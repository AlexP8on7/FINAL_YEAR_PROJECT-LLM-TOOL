const { exec } = require('child_process');
const OpenAI = require('openai');

function getAIClient() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN environment variable not set');
    return new OpenAI({
        baseURL: 'https://models.github.ai/inference',
        apiKey: token,
    });
}

function getKubectlInfo() {
    return new Promise((resolve) => {
        const commands = [
            'kubectl get pods -l app=juice-shop -o wide',
            'kubectl describe pods -l app=juice-shop',
            'kubectl logs -l app=juice-shop --tail=20'
        ];
        let results = { status: '', describe: '', logs: '', errors: '' };
        let completed = 0;
        commands.forEach((cmd, index) => {
            exec(cmd, (error, stdout, stderr) => {
                if (index === 0) results.status = stdout || 'No pods found';
                if (index === 1) results.describe = stdout || 'No pods found';
                if (index === 2) results.logs = stdout || 'No logs available';
                if (stderr) results.errors += stderr + '\n';
                if (++completed === commands.length) resolve(results);
            });
        });
    });
}

function saveReport(filename, content) {
    const fs = require('fs');
    const reportsDir = 'Reports';
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);
    fs.writeFileSync(`${reportsDir}/${filename}`, content);
    return `${reportsDir}/${filename}`;
}

function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

module.exports = { getAIClient, getKubectlInfo, saveReport, timestamp };
