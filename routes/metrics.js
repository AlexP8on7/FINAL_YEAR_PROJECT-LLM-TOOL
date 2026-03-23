const express = require('express');
const router = express.Router();

const PROMETHEUS_URL = 'http://localhost:9090';

async function query(promql) {
    const url = `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(promql)}&start=${Date.now() / 1000 - 1800}&end=${Date.now() / 1000}&step=15`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data?.result || [];
}

router.get('/', async (req, res) => {
    try {
        const [cpu, memory, restarts, status] = await Promise.all([
            query('rate(container_cpu_usage_seconds_total{pod=~"juice-shop.*"}[1m])'),
            query('container_memory_working_set_bytes{pod=~"juice-shop.*"}'),
            query('kube_pod_container_status_restarts_total{pod=~"juice-shop.*"}'),
            query('kube_pod_status_phase{pod=~"juice-shop.*", phase="Running"}')
        ]);
        res.json({ success: true, cpu, memory, restarts, status });
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch metrics: ${error.message}. Make sure Prometheus is port-forwarded on port 9090.` });
    }
});

module.exports = router;
