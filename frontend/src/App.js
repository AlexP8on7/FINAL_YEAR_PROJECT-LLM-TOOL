import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import AdvancedSpinner from './AdvancedSpinner';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [zapLoading, setZapLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [statusResult, setStatusResult] = useState(null);
  const [zapResult, setZapResult] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="App">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className="display-4 mb-4">
                 Kubernetes AI Monitor
              </h1>
              <p className="lead">
                AI-powered analysis of your Kubernetes cluster health and performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Action Cards */}
        <div className="row mb-5">
          <div className="col-md-4 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">Quick Status Check</h5>
                <p className="card-text">
                  Verify your Kubernetes cluster connection and pod status
                </p>
                <button 
                  className="btn-check-status"
                  onClick={checkStatus}
                  disabled={statusLoading}
                >
                  {statusLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">AI Analysis</h5>
                <p className="card-text">
                  Get comprehensive AI-powered insights about your cluster
                </p>
                <button 
                  className="btn-Ai-analysis"
                  onClick={runAnalysis}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Run AI Analysis'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card status-card h-100 shadow-sm">
              <div className="card-body text-center">
                <div className="feature-icon"></div>
                <h5 className="card-title">Security Test</h5>
                <p className="card-text">
                  Run OWASP ZAP security scan against your Juice Shop
                </p>
                <button 
                  className="btn-simulate-attack"
                  onClick={simulateAttack}
                  disabled={zapLoading}
                >
                  {zapLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Attacking...
                    </>
                  ) : (
                    'Simulate Attack!'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Status Result */}
        {statusResult && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0"> Cluster Status</h5>
            </div>
            <div className="card-body">
              {statusResult.error ? (
                <div className="alert alert-danger">
                  Connection failed: {statusResult.error}
                </div>
              ) : (
                <div className="alert alert-success">
                  <strong> Connected to cluster!</strong><br />
                  {(() => {
                    const pods = statusResult.status ? 
                      statusResult.status.split('\n')
                        .filter(line => line.trim() && !line.startsWith('NAME'))
                        .map(line => line.split(/\s+/)[0]) : [];
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
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <>
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0"> AI Analysis Results</h5>
                <small className="text-muted">
                  {analysisResult.timestamp} | Saved: {analysisResult.filename}
                </small>
              </div>
              <div className="card-body">
                <div className="analysis-content">
                  <ReactMarkdown>{analysisResult.analysis}</ReactMarkdown>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0"> Raw Cluster Data</h6>
              </div>
              <div className="card-body">
                <div className="cluster-data">
                  {analysisResult.clusterData}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ZAP Attack Results */}
        {zapResult && (
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"> Security Analysis Results</h5>
              <small className="text-muted">
                Target: {zapResult.targetUrl} | {zapResult.timestamp} | Saved: {zapResult.reportFile}
              </small>
            </div>
            <div className="card-body">
              <div className="analysis-content">
                <ReactMarkdown>{zapResult.analysis}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(loading || zapLoading) && (
          <div className="loading-spinner">
            <div className="text-center">
              <AdvancedSpinner />
              <p className="mt-3">
                {loading && "AI is analyzing your cluster..."}
                {zapLoading && "Running OWASP ZAP security scan..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;