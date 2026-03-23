const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getAIClient, saveReport, timestamp } = require('../lib/aiClient');
const store = require('../lib/store');

function runZapAttack(targetUrl) {
    return new Promise((resolve) => {
        const actualTarget = 'http://host.docker.internal:8080';
        const workDir = process.cwd();
        const zapCmd = `docker run --rm -v "${workDir}:/zap/wrk/:rw" zaproxy/zap-stable zap-full-scan.py -t ${actualTarget} -J zap-report.json -j`;

        exec(zapCmd, { timeout: 300000 }, (error, stdout, stderr) => {
            if (error && error.code !== 2) {
                return resolve({ success: false, error: `Docker command failed: ${error.message}`, stdout, stderr });
            }
            try {
                const reportPath = path.join(process.cwd(), 'zap-report.json');
                if (fs.existsSync(reportPath)) {
                    resolve({ success: true, report: JSON.parse(fs.readFileSync(reportPath, 'utf8')), stdout, stderr });
                } else {
                    resolve({ success: false, error: 'ZAP report not generated', stdout, stderr });
                }
            } catch (e) {
                resolve({ success: false, error: `Failed to parse ZAP report: ${e.message}`, stdout, stderr });
            }
        });
    });
}

router.post('/', async (req, res) => {
    try {
        const zapResults = await runZapAttack('http://localhost:8080');
        if (!zapResults.success) return res.json({ success: false, error: zapResults.error, stdout: zapResults.stdout, stderr: zapResults.stderr });

        const alerts = zapResults.report.site?.[0]?.alerts || [];
        const high = alerts.filter(a => a.riskcode === '3');
        const medium = alerts.filter(a => a.riskcode === '2');
        const low = alerts.filter(a => a.riskcode === '1');
        const fmt = a => `- ${a.name}: ${a.desc?.replace(/<[^>]*>/g, '').substring(0, 150)} (${a.instances?.length || 0} instances)`;

        const summary = `ZAP Scan Results:\nTarget: ${zapResults.report.site?.[0]?.['@name'] || 'Unknown'}\nTotal: ${alerts.length} (High: ${high.length}, Medium: ${medium.length}, Low: ${low.length})\n\nHIGH:\n${high.map(fmt).join('\n') || 'None'}\n\nMEDIUM:\n${medium.map(fmt).join('\n') || 'None'}\n\nLOW (Top 5):\n${low.slice(0, 5).map(fmt).join('\n') || 'None'}`;

        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a cybersecurity expert. Analyze OWASP ZAP findings and provide: 1) Critical risks, 2) Remediation priorities, 3) Quick wins. Format in markdown.' },
                { role: 'user', content: summary }
            ],
            temperature: 0.3, max_tokens: 2000, model: 'gpt-4.1'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(`zap-analysis_${timestamp()}.md`, `# OWASP ZAP Security Analysis\n\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Analysis\n\n${analysis}\n\n## Raw Results\n\n\`\`\`json\n${JSON.stringify(zapResults.report, null, 2)}\n\`\`\``);

        store.zapScan = analysis;
        res.json({ success: true, analysis, reportFile: filename, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
