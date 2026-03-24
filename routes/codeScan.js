const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { getAIClient, saveReport, timestamp } = require('../lib/aiClient');
const store = require('../lib/store');

const FILES = [
    { path: 'routes/login.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/routes/login.ts' },
    { path: 'routes/search.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/routes/search.ts' },
    { path: 'lib/insecurity.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/lib/insecurity.ts' },
    { path: 'routes/basket.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/routes/basket.ts' }
];

function getPodName() {
    return new Promise((resolve, reject) => {
        exec(`kubectl get pods -l app=juice-shop -o jsonpath="{.items[0].metadata.name}"`, (error, stdout) => {
            if (error || !stdout) reject(new Error('No juice-shop pod found'));
            else resolve(stdout.trim());
        });
    });
}

router.post('/', async (req, res) => {
    try {
        const podName = await getPodName();
        const results = await Promise.all(FILES.map(async f => {
            try {
                const r = await fetch(f.url);
                return r.ok ? { file: f.path, content: await r.text(), success: true } : { file: f.path, content: '', success: false };
            } catch {
                return { file: f.path, content: '', success: false };
            }
        }));

        const successful = results.filter(r => r.success);
        if (successful.length === 0) return res.status(500).json({ error: 'Failed to fetch any source files.' });

        const codeContext = successful.map(r => `File: ${r.file}\n\`\`\`javascript\n${r.content.substring(0, 3000)}\n\`\`\``).join('\n\n');

        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a security code reviewer. Analyze the juice-shop source code for vulnerabilities, refer to specific CVEs and give references.' },
                { role: 'user', content: `Analyze these juice-shop source files for security vulnerabilities:\n\n${codeContext}` }
            ],
            temperature: 0.2, max_tokens: 2000, model: 'gpt-4o'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(`code-analysis_${timestamp()}.md`, `# Source Code Vulnerability Analysis\n\n**Pod:** ${podName}\n**Files Analyzed:** ${successful.length}/${FILES.length}\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Analysis\n\n${analysis}\n\n## Files\n\n${successful.map(r => `- ${r.file}`).join('\n')}`);

        store.codeScan = analysis;
        res.json({ success: true, analysis, reportFile: filename, podName, filesAnalyzed: successful.length, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
