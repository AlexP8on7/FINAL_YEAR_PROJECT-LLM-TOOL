const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { getAIClient, saveReport, timestamp } = require('../lib/aiClient');
const store = require('../lib/store');

function runCmd(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
            resolve({ stdout: stdout || '', stderr: stderr || '', error });
        });
    });
}

async function runKubeHunter() {
    const jobName = 'kube-hunter-job';

    // Clean up any previous run
    await runCmd(`kubectl delete job ${jobName} --ignore-not-found`);

    // Run kube-hunter as a pod inside the cluster (in-cluster mode discovers the network automatically)
    const createJob = `kubectl run ${jobName} --image=aquasec/kube-hunter:latest --restart=Never -- --pod`;
    const { stderr: createErr } = await runCmd(createJob);
    if (createErr && createErr.includes('Error')) {
        throw new Error(`Failed to create kube-hunter pod: ${createErr}`);
    }

    // Wait for pod to complete (up to 90s)
    await runCmd(`kubectl wait pod/${jobName} --for=condition=Ready --timeout=30s`);
    await runCmd(`kubectl wait pod/${jobName} --for=jsonpath='.status.phase'=Succeeded --timeout=90s`);

    const { stdout: logs } = await runCmd(`kubectl logs ${jobName}`);

    // Cleanup
    await runCmd(`kubectl delete pod ${jobName} --ignore-not-found`);

    return logs || 'No output from kube-hunter';
}

router.post('/', async (req, res) => {
    try {
        const rawOutput = await runKubeHunter();

        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a Kubernetes security expert. Analyze the kube-hunter scan output and provide: 1) Vulnerabilities found, 2) Severity assessment, 3) Specific risks to the juice-shop pod, 4) Remediation steps. Format in markdown.' },
                { role: 'user', content: `Analyze this kube-hunter scan output from my minikube cluster running juice-shop:\n\n${rawOutput}` }
            ],
            temperature: 0.3, max_tokens: 1200, model: 'gpt-4o'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(
            `kube-hunter-analysis_${timestamp()}.md`,
            `# Kube-Hunter Security Analysis\n\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Analysis\n\n${analysis}\n\n## Raw Scan Output\n\n\`\`\`\n${rawOutput}\n\`\`\``
        );

        store.kubeHunterScan = analysis;
        res.json({ success: true, analysis, rawOutput, reportFile: filename, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
