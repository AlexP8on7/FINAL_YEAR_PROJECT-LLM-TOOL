const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = 3001;


app.use(express.json());
app.use(express.static('public'));

// Get kubectl info function
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

// Analyze with AI function
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
                    content: "You are a kubernetes expert. Analyze the provided cluster information and give insights about the juice-shop pod's name, health, performance, and any issues. Format your response in markdown."
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

// Routes
app.post('/api/analyze', async (req, res) => {
    try {
        // Get cluster info
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

        // Analyze with AI
        const analysis = await analyzeWithAI(clusterData);
        
        // Save report
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

app.listen(PORT, () => {
    console.log(`Kubernetes AI Monitor API running at http://localhost:${PORT}`);
});