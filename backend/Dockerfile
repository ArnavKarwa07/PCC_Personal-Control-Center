FROM python:3.12-slim

WORKDIR /app

# Copy requirements & install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set up data directory and non-root user permissions for Hugging Face Spaces / Koyeb
RUN mkdir -p /app/data && chmod -R 777 /app/data

ENV PORT=7860
EXPOSE 7860 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]

