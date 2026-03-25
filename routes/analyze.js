const express = require('express');
const router = express.Router();
const { getAIClient, getKubectlInfo, saveReport, timestamp } = require('../lib/aiClient');

async function getPrometheusStatus() {
    try {
        const url = `http://localhost:9090/api/v1/query?query=${encodeURIComponent('kube_pod_status_phase{pod=~"juice-shop.*",phase="Running"}')}` ;
        const res = await fetch(url);
        const data = await res.json();
        const result = data.data?.result?.[0];
        if (!result) return 'No data from Prometheus (pod may not be tracked yet)';
        return result.value[1] === '1' ? 'Running (Prometheus)' : 'NOT Running according to Prometheus';
    } catch {
        return 'Prometheus unreachable';
    }
}

router.post('/', async (req, res) => {
    try {
        const [clusterInfo, prometheusStatus] = await Promise.all([getKubectlInfo(), getPrometheusStatus()]);
        const clusterData = `Pod Status (kubectl):\n${clusterInfo.status}\n\nPrometheus Status:\n${prometheusStatus}\n\nPod Details:\n${clusterInfo.describe}\n\nRecent Logs:\n${clusterInfo.logs}\n\nErrors (if any):\n${clusterInfo.errors}`;

        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a kubernetes expert. Analyze the provided cluster information and give insights about the juice-shop pod\'s health, performance, and any issues. If kubectl and Prometheus disagree on pod status, explicitly flag this discrepancy and explain possible causes. Format your response in markdown.' },
                { role: 'user', content: `Analyze my juice-shop pod status:\n\n${clusterData}` }
            ],
            temperature: 0.3, top_p: 1.0, max_tokens: 1000, model: 'gpt-4.1'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(`juice-shop-analysis_${timestamp()}.md`, `# Juice Shop Pod Analysis\n\n**Generated:** ${new Date().toLocaleString()}\n\n${analysis}`);

        res.json({ success: true, analysis, clusterData, filename, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
