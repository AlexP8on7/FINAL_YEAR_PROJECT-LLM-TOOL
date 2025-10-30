from fastapi import FastAPI
from transformers import pipeline
import uvicorn

app = FastAPI()

# Tiny, CPU-friendly model
llm = pipeline("sentiment-analysis")  # uses DistilBERT by default

@app.get("/")
def root():
    return {"message": "LLM Monitor API is running"}

@app.get("/analyze")
def analyze(text: str = "I love Azure!"):
    return llm(text)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
