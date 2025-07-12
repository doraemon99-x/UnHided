FROM python:3.10-slim-buster

# Set working directory
WORKDIR /app

# Install git (jika memang dibutuhkan oleh dependensi)
RUN apt-get update && apt-get install -y git

# Copy all files from repo (karena Koyeb sudah clone repo kamu otomatis)
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (gunakan PORT dari env, fallback ke 8888)
ENV PORT=8888
EXPOSE $PORT

# Run the app
CMD ["uvicorn", "run:main_app", "--host", "0.0.0.0", "--port", "8888", "--workers", "4"]
