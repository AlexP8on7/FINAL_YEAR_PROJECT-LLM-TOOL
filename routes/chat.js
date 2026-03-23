const express = require('express');
const router = express.Router();
const { getAIClient, getKubectlInfo } = require('../lib/aiClient');
const store = require('../lib/store');

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const clusterInfo = await getKubectlInfo();

        const scanContext = [
            store.codeScan   && `Latest Source Code Scan:\n${store.codeScan}`,
            store.zapScan    && `Latest ZAP Scan:\n${store.zapScan}`,
            store.hydraScan  && `Latest Hydra Scan:\n${store.hydraScan}`,
            store.nvdScan    && `Latest NVD CVE Scan:\n${store.nvdScan}`,
        ].filter(Boolean).join('\n\n');

        const systemPrompt = `You are a Kubernetes and security expert assistant with access to the user's live cluster data and latest scan results.
Respond conversationally and concisely. Do not use markdown headers, horizontal rules, or excessive bold text. Use plain sentences and short bullet points only when listing multiple items.

CURRENT CLUSTER STATE:
Pods: ${clusterInfo.status}
Recent Logs: ${clusterInfo.logs.substring(0, 500)}
Errors: ${clusterInfo.errors || 'None'}

${scanContext ? `LATEST SCAN RESULTS:\n${scanContext}` : ''}

Use all available context to provide specific, actionable advice.`;

        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            temperature: 0.7, max_tokens: 1000, model: 'gpt-4o'
        });

        res.json({ success: true, response: response.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
