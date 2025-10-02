from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()

# small model for testing
llm = pipeline("text-generation", model="gpt2")

@app.get("/analyze")
def analyze(prompt: str = "Analyze this:"):
    result = llm(prompt, max_length=100, do_sample=True)
    return {"analysis": result[0]["generated_text"]}
