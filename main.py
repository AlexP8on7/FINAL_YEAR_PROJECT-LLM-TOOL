import os
import subprocess
from openai import OpenAI

def get_kubectl_info():
    """Get juice-shop pod information from kubectl"""
    try:
        # Get pod status
        pod_status = subprocess.run(['kubectl', 'get', 'pods', '-l', 'app=juice-shop', '-o', 'wide'], 
                                  capture_output=True, text=True)
        
        # Get pod details
        pod_describe = subprocess.run(['kubectl', 'describe', 'pods', '-l', 'app=juice-shop'], 
                                    capture_output=True, text=True)
        
        # Get pod logs (last 20 lines)
        pod_logs = subprocess.run(['kubectl', 'logs', '-l', 'app=juice-shop', '--tail=20'], 
                                capture_output=True, text=True)
        
        return {
            'status': pod_status.stdout,
            'describe': pod_describe.stdout,
            'logs': pod_logs.stdout,
            'errors': pod_status.stderr + pod_describe.stderr + pod_logs.stderr
        }
    except Exception as e:
        return {'error': str(e)}

print("Getting Kubernetes cluster information...")

# Get cluster info
cluster_info = get_kubectl_info()

if 'error' in cluster_info:
    print(f"Error getting cluster info: {cluster_info['error']}")
    exit(1)

# Prepare the prompt with actual cluster data
cluster_data = f"""
Pod Status:
{cluster_info['status']}

Pod Details:
{cluster_info['describe']}

Recent Logs:
{cluster_info['logs']}

Errors (if any):
{cluster_info['errors']}
"""

try:
    token = "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"
    endpoint = "https://models.github.ai/inference"
    model_name = "openai/gpt-4o"
    
    print("Creating OpenAI client...")
    client = OpenAI(
        base_url=endpoint,
        api_key=token,
    )
    
    print("Analyzing cluster data with AI...")
    response = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a Kubernetes expert. Analyze the provided cluster information and give insights about the juice-shop pod's health, performance, and any issues.",
            },
            {
                "role": "user",
                "content": f"Analyze my juice-shop pod status:\n\n{cluster_data}",
            }
        ],
        temperature=0.3,
        top_p=1.0,
        max_tokens=1000,
        model=model_name
    )
    
    print("\n" + "="*50)
    print("AI ANALYSIS OF YOUR JUICE-SHOP POD:")
    print("="*50)
    print(response.choices[0].message.content)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()