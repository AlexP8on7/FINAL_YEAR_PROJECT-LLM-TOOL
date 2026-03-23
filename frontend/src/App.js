import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import AdvancedSpinner from './AdvancedSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [zapLoading, setZapLoading] = useState(false);
  const [hydraLoading, setHydraLoading] = useState(false);
  const [nvdLoading, setNvdLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [grafanaLoading, setGrafanaLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [statusResult, setStatusResult] = useState(null);
  const [zapResult, setZapResult] = useState(null);
  const [hydraResult, setHydraResult] = useState(null);
  const [nvdResult, setNvdResult] = useState(null);
  const [codeResult, setCodeResult] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [metricsExpanded, setMetricsExpanded] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [error, setError] = useState(null);
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [zapExpanded, setZapExpanded] = useState(false);
  const [hydraExpanded, setHydraExpanded] = useState(false);
  const [nvdExpanded, setNvdExpanded] = useState(false);
  const [codeExpanded, setCodeExpanded] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const checkStatus = async () => {
    setStatusLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/status');
      setStatusResult(response.data);
    } catch (err) {
      setError('Failed to check cluster status: ' + err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      const response = await axios.post('/api/analyze');
      setAnalysisResult(response.data);
    } catch (err) {
      setError('Failed to run analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulateAttack = async () => {
    setZapLoading(true);
    setError(null);
    setZapResult(null);
    
    try {
      const response = await axios.post('/api/zap-attack');
      setZapResult(response.data);
    } catch (err) {
      setError('Failed to run ZAP attack: ' + err.message);
    } finally {
      setZapLoading(false);
    }
  };

  const runHydraScan = async () => {
    setHydraLoading(true);
    setError(null);
    setHydraResult(null);
    
    try {
      const response = await axios.post('/api/hydra-scan');
      setHydraResult(response.data);
    } catch (err) {
      setError('Failed to run Hydra scan: ' + err.message);
    } finally {
      setHydraLoading(false);
    }
  };

  const runNvdScan = async () => {
    setNvdLoading(true);
    setError(null);
    setNvdResult(null);
    
    try {
      const response = await axios.post('/api/nvd-scan', { keywords: 'kubernetes', resultsPerPage: 10 });
      setNvdResult(response.data);
    } catch (err) {
      setError('Failed to run NVD scan: ' + err.message);
    } finally {
      setNvdLoading(false);
    }
  };

  const openGrafana = async () => {
    setGrafanaLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/metrics');
      if (response.data.success) {
        const buildChartData = (result, transform) => {
          const seriesMap = {};
          result.forEach((r, i) => {
            const label = r.metric.container || r.metric.pod || `series${i}`;
            r.values.forEach(([ts, val]) => {
              const time = new Date(ts * 1000).toLocaleTimeString();
              if (!seriesMap[time]) seriesMap[time] = { time };
              seriesMap[time][label] = transform(val);
            });
          });
          return {
            data: Object.values(seriesMap),
            keys: result.map((r, i) => r.metric.container || r.metric.pod || `series${i}`)
          };
        };
        const cpu = buildChartData(response.data.cpu, v => parseFloat((parseFloat(v) * 100).toFixed(4)));
        const memory = buildChartData(response.data.memory, v => parseFloat((parseFloat(v) / 1024 / 1024).toFixed(2)));
        setMetricsData({
          cpu,
          memory,
          restarts: response.data.restarts?.[0]?.values?.slice(-1)?.[0]?.[1] || 0,
          status: response.data.status?.[0]?.values?.slice(-1)?.[0]?.[1] || 0
        });
        setMetricsExpanded(true);
      }
    } catch (err) {
      setError('Failed to fetch metrics: ' + err.message);
    } finally {
      setGrafanaLoading(false);
    }
  };

  const runCodeScan = async () => {
    setCodeLoading(true);
    setError(null);
    setCodeResult(null);
    
    try {
      const response = await axios.post('/api/code-scan');
      setCodeResult(response.data);
    } catch (err) {
      setError('Failed to run code scan: ' + err.message);
    } finally {
      setCodeLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatExpanded(true);
    setChatLoading(true);
    
    try {
      const response = await axios.post('/api/chat', { message: userMessage });
      setChatMessages(prev => [...prev, { type: 'ai', message: response.data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { type: 'error', message: 'Failed to get AI response: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="hero-section">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className="display-4 mb-4">Kubernetes AI Monitor</h1>
              <p className="lead">AI-powered analysis of your Kubernetes cluster health and performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row mb-5">
          <div className="col-md-3 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">ZAP Security Test</h5>
                <p className="card-text">Run OWASP ZAP security scan against your Juice Shop</p>
                <button className="btn-simulate-attack" onClick={simulateAttack} disabled={zapLoading}>
                  {zapLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Scanning...
                    </>
                  ) : (
                    'ZAP Scan'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">Hydra Brute-Force</h5>
                <p className="card-text">Test authentication security with password brute-forcing</p>
                <button className="btn-hydra" onClick={runHydraScan} disabled={hydraLoading}>
                  {hydraLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Scanning...
                    </>
                  ) : (
                    'Hydra Test'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">NVD CVE Scan</h5>
                <p className="card-text">Check juice-shop CVEs from NVD database</p>
                <button className="btn-nvd" onClick={runNvdScan} disabled={nvdLoading}>
                  {nvdLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Scanning...
                    </>
                  ) : (
                    'NVD Scan'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">Source Code Scan</h5>
                <p className="card-text">Extract and analyze juice-shop source code for vulnerabilities</p>
                <button className="btn-code" onClick={runCodeScan} disabled={codeLoading}>
                  {codeLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Scanning...
                    </>
                  ) : (
                    'Code Scan'
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Chat with AI</h5>
            <div className="mb-3">
              <div className="btn-group" role="group">
                <button className="btn btn-outline-primary btn-sm" onClick={checkStatus} disabled={statusLoading}>
                  {statusLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Checking...
                    </>
                  ) : (
                    'Status Check'
                  )}
                </button>
                <button className="btn btn-outline-success btn-sm" onClick={runAnalysis} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Analyzing...
                    </>
                  ) : (
                    'AI Analysis'
                  )}
                </button>
                <button className="btn btn-outline-info btn-sm" onClick={openGrafana} disabled={grafanaLoading}>
                  {grafanaLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Loading...
                    </>
                  ) : (
                    'View Metrics'
                  )}
                </button>
              </div>
            </div>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ask me about Kubernetes, security, or anything else..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                disabled={chatLoading}
              />
              <button className="btn btn-primary" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}>
                {chatLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </div>
            
            {chatMessages.length > 0 && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded" onClick={() => setChatExpanded(!chatExpanded)} style={{cursor: 'pointer'}}>
                  <span>AI Chat ({chatMessages.length} messages)</span>
                  <span>{chatExpanded ? '▼' : '▶'}</span>
                </div>
                {chatExpanded && (
                  <div className="border rounded mt-2 p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`mb-2 ${msg.type === 'user' ? 'text-end' : 'text-start'}`}>
                        <div className={`d-inline-block p-2 rounded ${msg.type === 'user' ? 'bg-primary text-white' : msg.type === 'error' ? 'bg-danger text-white' : 'bg-light'}`} style={{ maxWidth: '80%' }}>
                          <strong>{msg.type === 'user' ? 'You' : msg.type === 'error' ? 'Error' : 'AI'}:</strong> {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {statusResult && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded" onClick={() => setStatusExpanded(!statusExpanded)} style={{cursor: 'pointer'}}>
                  <span>Cluster Status</span>
                  <span>{statusExpanded ? '▼' : '▶'}</span>
                </div>
                {statusExpanded && (
                  <div className="border rounded mt-2 p-3">
                    {statusResult.error ? (
                      <div className="alert alert-danger">Connection failed: {statusResult.error}</div>
                    ) : (
                      <div className="alert alert-success">
                        <strong>Connected to cluster!</strong><br />
                        {(() => {
                          const pods = statusResult.status ? 
                            statusResult.status.split('\n').filter(line => line.trim() && !line.startsWith('NAME')).map(line => line.split(/\s+/)[0]) : [];
                          return (
                            <>
                              Found {pods.length} pod{pods.length !== 1 ? 's' : ''}:
                              <ul className="mb-0 mt-2">
                                {pods.map((podName, index) => (
                                  <li key={index}><code>{podName}</code></li>
                                ))}
                              </ul>
                            </>
                          );
                        })()} 
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {analysisResult && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded" onClick={() => setAnalysisExpanded(!analysisExpanded)} style={{cursor: 'pointer'}}>
                  <span>AI Analysis Results</span>
                  <span>{analysisExpanded ? '▼' : '▶'}</span>
                </div>
                {analysisExpanded && (
                  <div className="border rounded mt-2 p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="analysis-content">
                      <ReactMarkdown>{analysisResult.analysis}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {metricsData && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded" onClick={() => setMetricsExpanded(!metricsExpanded)} style={{cursor: 'pointer'}}>
                  <span>Juice Shop Pod Metrics</span>
                  <span>{metricsExpanded ? '▼' : '▶'}</span>
                </div>
                {metricsExpanded && (
                  <div className="border rounded mt-2 p-3">
                    <div className="row mb-4">
                      <div className="col-md-3 text-center">
                        <div className={`p-3 rounded ${metricsData.status == 1 ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                          <strong>Pod Status</strong><br />
                          {metricsData.status == 1 ? 'RUNNING' : 'DOWN'}
                        </div>
                      </div>
                      <div className="col-md-3 text-center">
                        <div className="p-3 rounded bg-light">
                          <strong>Restarts</strong><br />
                          {metricsData.restarts}
                        </div>
                      </div>
                    </div>
                    <h6>CPU Usage (%)</h6>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={metricsData.cpu.data} margin={{top: 5, right: 20, left: 10, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="time" tick={{fontSize: 10}} interval={10} />
                        <YAxis tickFormatter={v => `${v}%`} domain={[0, 'auto']} tick={{fontSize: 10}} />
                        <Tooltip formatter={(v, name) => [`${v}%`, name]} />
                        <Legend />
                        {metricsData.cpu.keys.map((key, i) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={['#3a1fc1','#1a7a3a','#b85c00','#a00000'][i % 4]} dot={false} strokeWidth={2} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    <h6 className="mt-4">Memory Usage (MiB)</h6>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={metricsData.memory.data} margin={{top: 5, right: 20, left: 10, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="time" tick={{fontSize: 10}} interval={10} />
                        <YAxis tickFormatter={v => `${v} MiB`} domain={[0, 'auto']} tick={{fontSize: 10}} />
                        <Tooltip formatter={(v, name) => [`${v} MiB`, name]} />
                        <Legend />
                        {metricsData.memory.keys.map((key, i) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={['#1a7a3a','#3a1fc1','#b85c00','#a00000'][i % 4]} dot={false} strokeWidth={2} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {zapResult && (
          <div className="card mb-4">
            <div className="card-header" onClick={() => setZapExpanded(!zapExpanded)} style={{cursor: 'pointer'}}>
              <h5 className="mb-0 d-flex justify-content-between align-items-center">
                ZAP Security Analysis
                <span>{zapExpanded ? '▼' : '▶'}</span>
              </h5>
            </div>
            {zapExpanded && (
              <div className="card-body">
                <div className="analysis-content">
                  <ReactMarkdown>{zapResult.analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {hydraResult && (
          <div className="card mb-4">
            <div className="card-header" onClick={() => setHydraExpanded(!hydraExpanded)} style={{cursor: 'pointer'}}>
              <h5 className="mb-0 d-flex justify-content-between align-items-center">
                Hydra Brute-Force Results
                <span>{hydraExpanded ? '▼' : '▶'}</span>
              </h5>
            </div>
            {hydraExpanded && (
              <div className="card-body">
                <div className="analysis-content">
                  <ReactMarkdown>{hydraResult.analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {nvdResult && (
          <div className="card mb-4">
            <div className="card-header" onClick={() => setNvdExpanded(!nvdExpanded)} style={{cursor: 'pointer'}}>
              <h5 className="mb-0 d-flex justify-content-between align-items-center">
                NVD CVE Analysis ({nvdResult.totalResults} vulnerabilities)
                <span>{nvdExpanded ? '▼' : '▶'}</span>
              </h5>
            </div>
            {nvdExpanded && (
              <div className="card-body">
                <div className="analysis-content">
                  <ReactMarkdown>{nvdResult.analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {codeResult && (
          <div className="card mb-4">
            <div className="card-header" onClick={() => setCodeExpanded(!codeExpanded)} style={{cursor: 'pointer'}}>
              <h5 className="mb-0 d-flex justify-content-between align-items-center">
                Source Code Vulnerability Analysis ({codeResult.filesAnalyzed} files)
                <span>{codeExpanded ? '▼' : '▶'}</span>
              </h5>
            </div>
            {codeExpanded && (
              <div className="card-body">
                <div className="analysis-content">
                  <ReactMarkdown>{codeResult.analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}


        {(loading || zapLoading || hydraLoading || nvdLoading || codeLoading) && (
          <div className="loading-spinner">
            <div className="text-center">
              <AdvancedSpinner />
              <p className="mt-3">
                {loading && "AI is analyzing your cluster..."}
                {zapLoading && "Running OWASP ZAP security scan..."}
                {hydraLoading && "Running Hydra brute-force test..."}
                {nvdLoading && "Fetching CVE data from NVD database..."}
                {codeLoading && "Extracting and analyzing source code..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;