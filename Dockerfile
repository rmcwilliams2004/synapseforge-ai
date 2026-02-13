# Use Python 3.10-slim as the base
FROM python:3.10-slim

# Updated dependencies for modern Debian base
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The rest of your Dockerfile remains the same
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install genesis-world 

COPY . .

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
