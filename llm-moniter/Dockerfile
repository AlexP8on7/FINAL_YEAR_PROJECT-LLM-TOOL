FROM python:3.10-slim

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn transformers torch

# Copy app code
COPY app.py /app/app.py
WORKDIR /app

# Expose API port
EXPOSE 8080

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
