const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { getAIClient, saveReport, timestamp } = require('../lib/aiClient');
const store = require('../lib/store');

function getPodInfo() {
    return new Promise((resolve, reject) => {
        exec(`kubectl get pods -l app=juice-shop -o jsonpath="{.items[0].metadata.name}"`, (error, stdout) => {
            if (error || !stdout) return reject(new Error('No juice-shop pod found'));
            const podName = stdout.trim();
            exec(`kubectl get pod ${podName} -o jsonpath="{.spec.containers[0].image}"`, (err, img) => {
                const version = img.match(/juice-shop:v?([\d.]+)/)?.[1] || 'unknown';
                resolve({ podName, image: img.trim(), version });
            });
        });
    });
}

router.post('/', async (req, res) => {
    try {
        const { podName, image, version } = await getPodInfo();
        const searches = ['node.js', 'express', 'angular', 'sqlite', 'juice-shop'];

        const nvdResults = await Promise.all(
            searches.map(k => fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${k}&resultsPerPage=5`).then(r => r.json()).catch(() => ({ vulnerabilities: [] })))
        );

        const allVulns = nvdResults.flatMap(r => r.vulnerabilities || []);
        const cves = allVulns.slice(0, 20).map(v => {
            const cve = v.cve;
            const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || 'N/A';
            return `${cve.id}: ${cve.descriptions?.[0]?.value?.substring(0, 150) || 'No description'}... (CVSS: ${cvss})`;
        }).join('\n') || 'No CVEs found';

        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a vulnerability analyst. Analyze CVEs for juice-shop (Node.js/Express/Angular app). Focus on: 1) High-severity vulnerabilities, 2) Specific risks, 3) Actionable remediation. Format in markdown.' },
                { role: 'user', content: `Analyze CVEs for juice-shop pod ${podName} (image: ${image}, version: ${version}). Dependencies: Node.js, Express, Angular, SQLite.\n\nCVEs found:\n${cves}` }
            ],
            temperature: 0.3, max_tokens: 1500, model: 'gpt-4o'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(`nvd-juiceshop-analysis_${timestamp()}.md`, `# NVD CVE Analysis\n\n**Pod:** ${podName}\n**Image:** ${image}\n**Version:** ${version}\n**Generated:** ${new Date().toLocaleString()}\n**Total CVEs:** ${allVulns.length}\n\n## AI Analysis\n\n${analysis}\n\n## CVE Details\n\n${cves}`);

        store.nvdScan = analysis;
        res.json({ success: true, analysis, reportFile: filename, podName, version, image, totalResults: allVulns.length, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
