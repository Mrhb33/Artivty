FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .

# Install Python packages with SSL verification disabled (workaround for certificate issues)
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt

# Copy application code
COPY . .

# Expose port 8000
EXPOSE 8000

# Run with host 0.0.0.0 so it's accessible from outside the container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

