# LLM Orchestration Analyser

AI-powered Kubernetes cluster monitoring tool that analyzes your pod health status and generates detailed markdown reports. Now includes OWASP ZAP security testing integration!

## Features

 **Cluster Monitoring**: Real-time Kubernetes pod health analysis
 **AI Analysis**: GPT-4 powered insights and recommendations  
 **Security Testing**: OWASP ZAP vulnerability scanning
 **Web Dashboard**: React-based frontend interface
 **Report Generation**: Automated markdown reports

## Prerequisites

- Python 3.8+
- Node.js 14+
- Docker (for OWASP ZAP)
- kubectl configured with cluster access
- GitHub account with access to GitHub Models
- Juice Shop deployed in your Kubernetes cluster

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Setup OWASP ZAP (requires Docker)
bash setup-zap.sh
```

### 2. Configure GitHub Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes: `read:user`, `user:email`
4. Copy the generated token

### 3. Set Environment Variable

```bash
# Linux/WSL/Mac:
export GITHUB_TOKEN=your_github_token_here

# Windows CMD:
set GITHUB_TOKEN=your_github_token_here

# Windows PowerShell:
$env:GITHUB_TOKEN="your_github_token_here"
```

### 4. Configure kubectl

Ensure kubectl is installed and configured to access your Kubernetes cluster:

```bash
# Test kubectl access
kubectl get pods

# Verify juice-shop pods exist
kubectl get pods -l app=juice-shop
```

## Usage

### Start the Application

```bash
# Start the backend server
node server.js

# In a new terminal, start the frontend
cd frontend
npm start
```

### Access the Web Interface

Open your browser to `http://localhost:3000`

### Available Features

1. **Quick Status Check**: Verify cluster connectivity and pod status
2. **AI Analysis**: Get comprehensive AI insights about your cluster
3. **Simulate Attack!**: Run OWASP ZAP security scan against Juice Shop

The tool will:
1. Fetch real-time data from your Kubernetes cluster
2. Analyze the juice-shop pod status using AI
3. Run security scans using OWASP ZAP
4. Generate timestamped markdown reports in the `Reports/` folder

## Output

Reports are saved in the `Reports/` folder:
- **Cluster Analysis**: `juice-shop-analysis_YYYY-MM-DD_HH-MM-SS.md`
- **Security Analysis**: `zap-analysis_YYYY-MM-DD_HH-MM-SS.md`

Each report includes:
- Pod health status
- Performance metrics  
- Error analysis
- AI-powered recommendations
- Security vulnerabilities (ZAP reports)
- Recent logs analysis

## Troubleshooting

**"Command 'kubectl' not found"**
- Install kubectl: https://kubernetes.io/docs/tasks/tools/

**"Unauthorized" error**
- Generate a new GitHub token with correct permissions
- Ensure token is set in environment variable

**"No pods found"**
- Verify juice-shop is deployed: `kubectl get pods -l app=juice-shop`
- Check if pods use different labels

**"Docker not found" (ZAP attacks)**
- Install Docker Desktop
- Ensure Docker daemon is running
- Run `docker pull owasp/zap2docker-stable`

**"ZAP scan failed"**
- Ensure juice-shop service is accessible
- Check if port-forwarding is needed: `kubectl port-forward svc/juice-shop 3000:3000`
- Verify Docker has sufficient resources