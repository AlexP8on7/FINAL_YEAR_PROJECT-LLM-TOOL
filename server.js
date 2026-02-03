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
            model: "gpt-4o"
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

function runZapAttack(targetUrl) {
    return new Promise((resolve, reject) => {
        exec('hostname -I | cut -d" " -f1', (ipError, ipStdout, ipStderr) => {
            const wslIP = ipStdout.trim() || '172.17.0.1';
            const actualTarget = `http://${wslIP}:8080`;
            
            console.log(`Starting ZAP scan against: ${actualTarget}`);
            const zapCmd = `docker run --rm --add-host=host.docker.internal:host-gateway -v "${process.cwd()}:/zap/wrk/:rw" zaproxy/zap-stable zap-baseline.py -t ${actualTarget} -J zap-report.json`;
            
            console.log(`Running command: ${zapCmd}`);
            exec(zapCmd, { timeout: 60000 }, (error, stdout, stderr) => {
                console.log('ZAP stdout:', stdout);
                console.log('ZAP stderr:', stderr);
                if (error) console.log('ZAP error:', error);
                
                try {
                    const reportPath = path.join(process.cwd(), 'zap-report.json');
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
    });
}

async function analyzeZapWithAI(zapResults) {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable not set');
        }

        // Sort alerts by risk level (High=3, Medium=2, Low=1, Info=0)
        const sortedAlerts = zapResults.site?.[0]?.alerts?.sort((a, b) => {
            return parseInt(b.riskcode) - parseInt(a.riskcode);
        }) || [];

        // Create minimal summary for AI with highest risks first
        const summary = `ZAP Security Scan Results:
- Target: ${zapResults.site?.[0]?.['@name'] || 'Unknown'}
- Total Vulnerabilities: ${sortedAlerts.length}
- High Risk: ${sortedAlerts.filter(a => a.riskcode === '3').length}
- Medium Risk: ${sortedAlerts.filter(a => a.riskcode === '2').length}
- Low Risk: ${sortedAlerts.filter(a => a.riskcode === '1').length}

Top 5 Issues (Highest Risk First):
${sortedAlerts.slice(0, 5).map((alert, i) => `${i+1}. ${alert.name} (${alert.riskdesc})`).join('\n') || 'None'}`;

        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a cybersecurity expert. Analyze OWASP ZAP scan summary and provide security insights in markdown format. Focus on the highest risk vulnerabilities first and explain their impact."
                },
                {
                    role: "user",
                    content: summary
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            model: "gpt-4o"
        });

        return response.choices[0].message.content;
    } catch (error) {
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
}

app.post('/api/zap-attack', async (req, res) => {
    try {
        const targetUrl = 'http://localhost:8080';
        
        const zapResults = await runZapAttack(targetUrl);
        
        if (!zapResults.success) {
            return res.status(500).json({
                success: false,
                error: `ZAP scan failed: ${zapResults.error}`,
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
        
        const reportContent = `# OWASP ZAP Security Analysis\n\n**Target:** ${targetUrl}\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Security Analysis\n\n${aiAnalysis}\n\n## Raw ZAP Results\n\n\`\`\`json\n${JSON.stringify(zapResults.report, null, 2)}\n\`\`\``;
        
        const filename = `${reportsDir}/zap-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            targetUrl: targetUrl,
            timestamp: new Date().toLocaleString()
        });
        
    } catch (error) {
        console.error('ZAP Attack Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Kubernetes AI Monitor API running at http://localhost:${PORT}`);
});