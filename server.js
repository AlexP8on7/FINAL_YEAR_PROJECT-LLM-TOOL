const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function getKubectlInfo() {
    return new Promise((resolve, reject) => {
        const commands = [
            "kubectl get pods -l app=juice-shop -o wide",
            "kubectl describe pods -l app=juice-shop",
            "kubectl logs -l app=juice-shop --tail=20"
        ];

        let results = { status: '', describe: '', logs: '', errors: '' };
        let completed = 0;

        commands.forEach((cmd, index) => {
            exec(cmd, (error, stdout, stderr) => {
                if (index === 0) results.status = stdout;
                if (index === 1) results.describe = stdout;
                if (index === 2) results.logs = stdout;
                
                if (stderr) results.errors += stderr + '\n';
                
                completed++;
                if (completed === commands.length) {
                    if (error && !stdout) {
                        reject({ error: error.message });
                    } else {
                        resolve(results);
                    }
                }
            });
        });
    });
}

async function analyzeWithAI(clusterData) {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable not set');
        }

        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a kubernetes expert. Analyze the provided cluster information and give insights about any crytical the juice-shop pod's name, health, performance, and any issues. Format your response in markdown."
                },
                {
                    role: "user",
                    content: `Analyze my juice-shop pod status:\n\n${clusterData}`
                }
            ],
            temperature: 0.3,
            top_p: 1.0,
            max_tokens: 1000,
            model: "gpt-4.1"
        });

        return response.choices[0].message.content;
    } catch (error) {
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
}

app.post('/api/analyze', async (req, res) => {
    try {
        const clusterInfo = await getKubectlInfo();
        
        const clusterData = `
Pod Status:
${clusterInfo.status}

Pod Details:
${clusterInfo.describe}

Recent Logs:
${clusterInfo.logs}

Errors (if any):
${clusterInfo.errors}
`;

        const analysis = await analyzeWithAI(clusterData);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const reportsDir = 'Reports';
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const filename = `${reportsDir}/juice-shop-analysis_${timestamp}.md`;
        const markdownContent = `# Juice Shop Pod Analysis\n\n**Generated:** ${new Date().toLocaleString()}\n\n${analysis}`;
        
        fs.writeFileSync(filename, markdownContent);
        
        res.json({
            success: true,
            analysis: analysis,
            clusterData: clusterData,
            filename: filename,
            timestamp: new Date().toLocaleString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const clusterInfo = await getKubectlInfo();
        res.json(clusterInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function analyzeZapWithAI(zapResults) {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable not set');
        }

        const alerts = zapResults.site?.[0]?.alerts || [];
        
        // Group by severity
        const high = alerts.filter(a => a.riskcode === '3');
        const medium = alerts.filter(a => a.riskcode === '2');
        const low = alerts.filter(a => a.riskcode === '1');
        const info = alerts.filter(a => a.riskcode === '0');

        // Build detailed summary for critical issues
        const formatAlert = (alert) => `- ${alert.name}: ${alert.desc?.replace(/<[^>]*>/g, '').substring(0, 150)} (${alert.instances?.length || 0} instances)`;
        
        const summary = `ZAP Security Scan Results:
Target: ${zapResults.site?.[0]?.['@name'] || 'Unknown'}
Total: ${alerts.length} (High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}, Info: ${info.length})

HIGH SEVERITY (ALL):
${high.map(formatAlert).join('\n') || 'None'}

MEDIUM SEVERITY (ALL):
${medium.map(formatAlert).join('\n') || 'None'}

LOW SEVERITY (Top 5):
${low.slice(0, 5).map(formatAlert).join('\n') || 'None'}`;

        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a cybersecurity expert. Analyze OWASP ZAP findings and provide: 1) Critical risks, 2) Remediation priorities, 3) Quick wins. Format in markdown."
                },
                {
                    role: "user",
                    content: summary
                }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            model: "gpt-4o"
        });

        return response.choices[0].message.content;
    } catch (error) {
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
}

app.post('/api/zap-aggressive', async (req, res) => {
    try {
        const targetUrl = 'http://localhost:8080';
        
        const zapResults = await runAggressiveZapAttack(targetUrl);
        
        if (!zapResults.success) {
            return res.status(500).json({
                success: false,
                error: `Aggressive ZAP scan failed: ${zapResults.error}`,
                stdout: zapResults.stdout,
                stderr: zapResults.stderr
            });
        }
        
        const aiAnalysis = await analyzeZapWithAI(zapResults.report);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const reportsDir = 'Reports';
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const reportContent = `# OWASP ZAP Aggressive Security Analysis\n\n**Target:** ${targetUrl}\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Security Analysis\n\n${aiAnalysis}\n\n## Raw ZAP Results\n\n\`\`\`json\n${JSON.stringify(zapResults.report, null, 2)}\n\`\`\``;
        
        const filename = `${reportsDir}/zap-aggressive-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            targetUrl: targetUrl,
            timestamp: new Date().toLocaleString()
        });
        
    } catch (error) {
        console.error('Aggressive ZAP Attack Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

function runAggressiveZapAttack() {
    return new Promise((resolve) => {
        const actualTarget = `http://host.docker.internal:8080`;
        console.log(`Starting ZAP scan against: ${actualTarget}`);
        const zapCmd = `docker run --rm --add-host=host.docker.internal:host-gateway -v "${process.cwd()}:/zap/wrk/:rw" zaproxy/zap-stable zap.sh -cmd -quickurl ${actualTarget} -quickout /zap/wrk/zap-aggressive-report.json -quickprogress`;
        
        exec(zapCmd, { timeout: 300000 }, (error, stdout, stderr) => {
            console.log('ZAP stdout:', stdout);
            console.log('ZAP stderr:', stderr);
            if (error) console.log('ZAP error:', error);
            
            try {
                const reportPath = path.join(process.cwd(), 'zap-aggressive-report.json');
                if (fs.existsSync(reportPath)) {
                    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                    resolve({
                        success: true,
                        report: report,
                        stdout: stdout,
                        stderr: stderr
                    });
                } else {
                    resolve({
                        success: false,
                        error: 'ZAP report not generated',
                        stdout: stdout,
                        stderr: stderr
                    });
                }
            } catch (parseError) {
                resolve({
                    success: false,
                    error: `Failed to parse ZAP report: ${parseError.message}`,
                    stdout: stdout,
                    stderr: stderr
                });
            }
        });
    });
}

app.listen(PORT, () => {
    console.log(`Kubernetes AI Monitor API running at http://localhost:${PORT}`);
});

function runHydraScan() {
    return new Promise((resolve) => {
        console.log(`Starting Hydra brute-force test against juice-shop`);
        
        const hydraCmd = `docker run --rm --add-host=host.docker.internal:host-gateway vanhauser/hydra -l admin@juice-sh.op -p admin123 host.docker.internal http-post-form "/rest/user/login:email=^USER^&password=^PASS^:F=Invalid" -s 8080 -t 1 -w 10`;
        
        exec(hydraCmd, { timeout: 120000 }, (error, stdout, stderr) => {
            console.log('Hydra stdout:', stdout);
            console.log('Hydra stderr:', stderr);
            
            const output = stdout + '\n' + stderr;
            resolve({
                success: true,
                rawOutput: output || 'Hydra scan completed'
            });
        });
    });
}

app.post('/api/hydra-scan', async (req, res) => {
    try {
        const hydraResults = await runHydraScan();
        
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
        }
        
        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });
        
        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a penetration testing expert. Analyze the actual Hydra brute-force attack output. Focus on: 1) What credentials were tested 2) Success/failure results 3) Authentication vulnerabilities found. Be specific about the actual test results, not general Hydra capabilities."
                },
                {
                    role: "user",
                    content: `Analyze this actual Hydra attack output against juice-shop:\n\n${hydraResults.rawOutput}\n\nProvide specific findings from THIS test.`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            model: "gpt-4o"
        });
        
        const aiAnalysis = response.choices[0].message.content;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const reportsDir = 'Reports';
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const reportContent = `# Hydra Brute-Force Analysis\n\n**Target:** juice-shop login\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Security Analysis\n\n${aiAnalysis}\n\n## Raw Hydra Output\n\n\`\`\`\n${hydraResults.rawOutput}\n\`\`\``;
        
        const filename = `${reportsDir}/hydra-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            timestamp: new Date().toLocaleString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});