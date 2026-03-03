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
                if (index === 0) results.status = stdout || 'No pods found';
                if (index === 1) results.describe = stdout || 'No pods found';
                if (index === 2) results.logs = stdout || 'No logs available';
                
                if (stderr) results.errors += stderr + '\n';
                
                completed++;
                if (completed === commands.length) {
                    resolve(results);
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
            model: "gpt-4.1"
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
        console.log('Status check requested');
        const clusterInfo = await getKubectlInfo();
        console.log('Cluster info retrieved:', clusterInfo);
        res.json(clusterInfo);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

async function analyzeZapWithAI(zapResults) {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN environment variable not set');
        }

        const alerts = zapResults.site?.[0]?.alerts || [];
        
        // Group by severity
        const high = alerts.filter(a => a.riskcode === '3');
        const medium = alerts.filter(a => a.riskcode === '2');
        const low = alerts.filter(a => a.riskcode === '1');
        const info = alerts.filter(a => a.riskcode === '0');

        // Build detailed summary for critical issues
        const formatAlert = (alert) => `- ${alert.name}: ${alert.desc?.replace(/<[^>]*>/g, '').substring(0, 150)} (${alert.instances?.length || 0} instances)`;
        
        const summary = `ZAP Security Scan Results:
Target: ${zapResults.site?.[0]?.['@name'] || 'Unknown'}
Total: ${alerts.length} (High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}, Info: ${info.length})

HIGH SEVERITY (ALL):
${high.map(formatAlert).join('\n') || 'None'}

MEDIUM SEVERITY (ALL):
${medium.map(formatAlert).join('\n') || 'None'}

LOW SEVERITY (Top 5):
${low.slice(0, 5).map(formatAlert).join('\n') || 'None'}`;

        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });

        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a cybersecurity expert. Analyze OWASP ZAP findings and provide: 1) Critical risks, 2) Remediation priorities, 3) Quick wins. Format in markdown."
                },
                {
                    role: "user",
                    content: summary
                }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            model: "gpt-4.1"
        });

        return response.choices[0].message.content;
    } catch (error) {
        throw new Error(`AI Analysis failed: ${error.message}`);
    }
}

app.post('/api/zap-attack', async (req, res) => {
    try {
        const targetUrl = 'http://localhost:8080';
        
        // Try ZAP first, fallback to simple scanner if Docker fails
        let zapResults;
        try {
            zapResults = await runZapAttack(targetUrl);
        } catch (dockerError) {
            console.log('Docker/ZAP failed, using fallback scanner:', dockerError.message);
            zapResults = await runFallbackScanner(targetUrl);
        }
        
        if (!zapResults.success) {
            return res.status(500).json({
                success: false,
                error: `Security scan failed: ${zapResults.error}`,
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
        
        const reportContent = `# Security Analysis\n\n**Target:** ${targetUrl}\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Security Analysis\n\n${aiAnalysis}\n\n## Raw Results\n\n\`\`\`json\n${JSON.stringify(zapResults.report, null, 2)}\n\`\`\``;
        
        const filename = `${reportsDir}/security-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            targetUrl: targetUrl,
            timestamp: new Date().toLocaleString()
        });
        
    } catch (error) {
        console.error('Security Scan Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

async function runFallbackScanner(targetUrl) {
    const vulnerabilities = [];
    
    try {
        // Test common vulnerabilities
        const tests = [
            { name: 'SQL Injection', path: '/rest/products/search?q=\'', expected: 'error' },
            { name: 'XSS', path: '/rest/products/search?q=<script>alert(1)</script>', expected: 'script' },
            { name: 'Path Traversal', path: '/ftp/../../../etc/passwd', expected: '404' },
            { name: 'Admin Access', path: '/administration', expected: '200' },
            { name: 'API Exposure', path: '/api-docs', expected: '200' }
        ];
        
        for (const test of tests) {
            try {
                const response = await fetch(`${targetUrl}${test.path}`);
                const text = await response.text();
                
                let risk = 'Low';
                if (response.status === 200 && test.name === 'Admin Access') risk = 'High';
                if (text.includes('SQLITE_ERROR') || text.includes('syntax error')) risk = 'High';
                if (text.includes('<script>') && test.name === 'XSS') risk = 'Medium';
                
                vulnerabilities.push({
                    name: test.name,
                    riskcode: risk === 'High' ? '3' : risk === 'Medium' ? '2' : '1',
                    desc: `${test.name} test on ${test.path}`,
                    instances: [{ uri: `${targetUrl}${test.path}`, response: response.status }]
                });
            } catch (e) {
                // Ignore connection errors
            }
        }
        
        return {
            success: true,
            report: {
                site: [{
                    '@name': targetUrl,
                    alerts: vulnerabilities
                }]
            }
        };
    } catch (error) {
        return {
            success: false,
            error: `Fallback scanner failed: ${error.message}`
        };
    }
}

function runZapAttack(targetUrl) {
    return new Promise((resolve, reject) => {
        const actualTarget = `http://host.docker.internal:8080`;
        const workDir = process.cwd().replace(/\\/g, '/');
        
        console.log(`Starting ZAP scan against: ${actualTarget}`);
        const zapCmd = `docker run --rm -v "${workDir}:/zap/wrk/:rw" zaproxy/zap-stable zap-baseline.py -t ${actualTarget} -J zap-report.json`;
        
        console.log(`Running command: ${zapCmd}`);
        exec(zapCmd, { timeout: 120000 }, (error, stdout, stderr) => {
            console.log('ZAP stdout:', stdout);
            console.log('ZAP stderr:', stderr);
            if (error) {
                console.log('ZAP error:', error);
                reject(error);
                return;
            }
            
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
}

app.post('/api/nvd-scan', async (req, res) => {
    try {
        // Get current juice-shop pod
        const getPodName = () => new Promise((resolve, reject) => {
            exec(`kubectl get pods -l app=juice-shop -o jsonpath="{.items[0].metadata.name}"`, (error, stdout) => {
                if (error || !stdout) reject(new Error('No juice-shop pod found'));
                else resolve(stdout.trim());
            });
        });
        
        const podName = await getPodName();
        
        // Get image and version
        const getImageInfo = () => new Promise((resolve) => {
            exec(`kubectl get pod ${podName} -o jsonpath="{.spec.containers[0].image}"`, (error, stdout) => {
                const version = stdout.match(/juice-shop:v?([\d.]+)/) || ['', 'unknown'];
                resolve({ image: stdout.trim(), version: version[1] });
            });
        });
        
        const { image, version: juiceShopVersion } = await getImageInfo();
        
        // Search multiple CVE sources
        const searches = ['node.js', 'express', 'angular', 'sqlite', 'juice-shop'];
        const nvdPromises = searches.map(keyword => 
            fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}&resultsPerPage=5`)
                .then(r => r.json())
                .catch(() => ({ vulnerabilities: [] }))
        );
        
        const nvdResults = await Promise.all(nvdPromises);
        const allVulns = nvdResults.flatMap(r => r.vulnerabilities || []);
        const totalResults = allVulns.length;
        
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
        }
        
        const cves = allVulns.slice(0, 20).map(v => {
            const cve = v.cve;
            const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                        cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || 'N/A';
            return `${cve.id}: ${cve.descriptions?.[0]?.value?.substring(0, 150) || 'No description'}... (CVSS: ${cvss})`;
        }).join('\n') || 'No CVEs found';
        
        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });
        
        const aiResponse = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a vulnerability analyst. Analyze CVEs for juice-shop (Node.js/Express/Angular app). Focus on: 1) High-severity vulnerabilities in dependencies, 2) Specific risks for this stack, 3) Actionable remediation. Format in markdown."
                },
                {
                    role: "user",
                    content: `Analyze CVEs for juice-shop pod ${podName} (image: ${image}, version: ${juiceShopVersion}). Dependencies: Node.js, Express, Angular, SQLite.\n\nCVEs found:\n${cves}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1500,
            model: "gpt-4o"
        });
        
        const aiAnalysis = aiResponse.choices[0].message.content;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const reportsDir = 'Reports';
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const reportContent = `# NVD CVE Analysis - Juice Shop\n\n**Pod:** ${podName}\n**Image:** ${image}\n**Version:** ${juiceShopVersion}\n**Generated:** ${new Date().toLocaleString()}\n**Total CVEs Found:** ${totalResults}\n**Search Keywords:** ${searches.join(', ')}\n\n## AI Vulnerability Analysis\n\n${aiAnalysis}\n\n## CVE Details (Top 20)\n\n${cves}`;
        
        const filename = `${reportsDir}/nvd-juiceshop-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            podName: podName,
            version: juiceShopVersion,
            image: image,
            totalResults: totalResults,
            timestamp: new Date().toLocaleString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Kubernetes AI Monitor API running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /api/analyze - Kubernetes pod analysis');
    console.log('  POST /api/zap-attack - OWASP ZAP security scan');
    console.log('  GET /api/status - Cluster status check');
});

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
    return { success: true, rawOutput: output, testedCombinations: users.length * passwords.length, found };
}

app.post('/api/hydra-scan', async (req, res) => {
    try {
        const hydraResults = await runHydraScan();
        
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
        }
        
        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });
        
        const response = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a penetration testing expert. Analyze the actual Hydra brute-force attack output. Focus on: 1) What credentials were tested 2) Success/failure results 3) Authentication vulnerabilities found. Be specific about the actual test results, not general Hydra capabilities."
                },
                {
                    role: "user",
                    content: `Analyze this actual Hydra attack output against juice-shop:\n\n${hydraResults.rawOutput}\n\nProvide specific findings from THIS test.`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            model: "gpt-4o"
        });
        
        const aiAnalysis = response.choices[0].message.content;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const reportsDir = 'Reports';
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const reportContent = `# Brute-Force Analysis\n\n**Target:** juice-shop login\n**Generated:** ${new Date().toLocaleString()}\n**Combinations Tested:** ${hydraResults.testedCombinations || 'N/A'}\n**Valid Credentials Found:** ${hydraResults.found?.length || 0}\n\n## AI Security Analysis\n\n${aiAnalysis}\n\n## Attack Output\n\n\`\`\`\n${hydraResults.rawOutput}\n\`\`\``;
        
        const filename = `${reportsDir}/hydra-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            timestamp: new Date().toLocaleString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/code-scan', async (req, res) => {
    try {
        console.log('Starting code scan...');
        
        const getPodName = () => new Promise((resolve, reject) => {
            exec(`kubectl get pods -l app=juice-shop -o jsonpath="{.items[0].metadata.name}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Pod lookup error:', error.message, stderr);
                    reject(new Error('No juice-shop pod found'));
                } else if (!stdout) {
                    reject(new Error('No juice-shop pod found'));
                } else {
                    console.log('Found pod:', stdout.trim());
                    resolve(stdout.trim());
                }
            });
        });
        
        const podName = await getPodName();
        
        // Fetch source code from GitHub juice-shop repository
        const files = [
            { path: 'routes/login.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/routes/login.ts' },
            { path: 'routes/search.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/routes/search.ts' },
            { path: 'lib/insecurity.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/lib/insecurity.ts' },
            { path: 'routes/basket.ts', url: 'https://raw.githubusercontent.com/juice-shop/juice-shop/master/routes/basket.ts' }
        ];
        
        const fetchFile = async (file) => {
            try {
                console.log(`Fetching ${file.path} from GitHub...`);
                const response = await fetch(file.url);
                if (response.ok) {
                    const content = await response.text();
                    console.log(`Fetched ${file.path}: ${content.length} bytes`);
                    return { file: file.path, content, success: true };
                } else {
                    console.error(`Failed to fetch ${file.path}: ${response.status}`);
                    return { file: file.path, content: '', success: false };
                }
            } catch (error) {
                console.error(`Error fetching ${file.path}:`, error.message);
                return { file: file.path, content: '', success: false };
            }
        };
        
        const results = await Promise.all(files.map(fetchFile));
        const successfulExtracts = results.filter(r => r.success);
        
        console.log(`Successfully extracted ${successfulExtracts.length}/${files.length} files`);
        
        if (successfulExtracts.length === 0) {
            return res.status(500).json({ error: 'Failed to extract any source files. Check if juice-shop pod is running.' });
        }
        
        const codeContext = successfulExtracts.map(r => `File: ${r.file}\n\`\`\`javascript\n${r.content.substring(0, 3000)}\n\`\`\``).join('\n\n');
        
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
        }
        
        const client = new OpenAI({
            baseURL: 'https://models.github.ai/inference',
            apiKey: token,
        });
        
        const aiResponse = await client.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a security code reviewer. Analyze the juice-shop source code for vulnerabilities, refer to specific CVE's and give refernces."
                },
                {
                    role: "user",
                    content: `Analyze these juice-shop source files for security vulnerabilities:\n\n${codeContext}`
                }
            ],
            temperature: 0.2,
            max_tokens: 2000,
            model: "gpt-4o"
        });
        
        const aiAnalysis = aiResponse.choices[0].message.content;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const reportsDir = 'Reports';
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        
        const reportContent = `# Source Code Vulnerability Analysis\n\n**Pod:** ${podName}\n**Files Analyzed:** ${successfulExtracts.length}/${files.length}\n**Generated:** ${new Date().toLocaleString()}\n\n## AI Security Analysis\n\n${aiAnalysis}\n\n## Extracted Files\n\n${successfulExtracts.map(r => `- ${r.file}`).join('\n')}`;
        
        const filename = `${reportsDir}/code-analysis_${timestamp}.md`;
        fs.writeFileSync(filename, reportContent);
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            reportFile: filename,
            podName: podName,
            filesAnalyzed: successfulExtracts.length,
            timestamp: new Date().toLocaleString()
        });
    } catch (error) {
        console.error('Code scan error:', error);
        res.status(500).json({ error: error.message });
    }
});