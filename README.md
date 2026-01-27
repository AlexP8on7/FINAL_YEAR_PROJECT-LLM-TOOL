# Kubernetes AI Monitor

AI-powered Kubernetes cluster monitoring tool that analyzes your juice-shop pod status and generates detailed markdown reports.

## Prerequisites

- Python 3.8+
- kubectl configured with cluster access
- GitHub account with access to GitHub Models

## Setup Instructions

### 1. Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/WSL:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install required packages
pip install openai requests
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

Run the monitoring tool:

```bash
python3 main.py
```

The tool will:
1. Fetch real-time data from your Kubernetes cluster
2. Analyze the juice-shop pod status using AI
3. Generate a timestamped markdown report in the `Reports/` folder

## Output

Reports are saved as: `Reports/juice-shop-analysis_YYYY-MM-DD_HH-MM-SS.md`

Each report includes:
- Pod health status
- Performance metrics
- Error analysis
- Recommendations
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

## Customization

To monitor different applications, modify the kubectl commands in `get_kubectl_info()` function:

```python
# Change 'app=juice-shop' to your app label
pod_status = subprocess.run(['kubectl', 'get', 'pods', '-l', 'app=your-app'], ...)
```

## File Structure

```
FINAL_YEAR_PROJECT-LLM-TOOL/
├── main.py              # Main monitoring script
├── README.md           # This file
├── Reports/            # Generated analysis reports
│   └── juice-shop-analysis_*.md
└── venv/              # Python virtual environment
```