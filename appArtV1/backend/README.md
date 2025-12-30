# AppArt Backend

FastAPI backend for the AppArt mobile application.

## Prerequisites

- Docker and Docker Compose
- Or Python 3.11+

## Quick Start with Docker (Recommended)

1. **Build and run the backend:**
   ```bash
   cd backend
   docker compose up --build
   ```

2. **The API will be available at:**
   - Local: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

3. **For mobile device testing:**
   - Use your computer's LAN IP instead of localhost
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
   - Access: `http://192.168.0.101:8000` (replace with your IP)

## Manual Setup (Alternative)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server (single command):**
   ```bash
   python -m backend.runserver
   ```

   The helper defaults to `--host 0.0.0.0`, port `8000`, and watches just the `backend/app`
   folder when `APPART_RELOAD` is truthy (`1`, `true`, `yes`).

## Database

The application uses SQLite by default for simplicity. For production, configure PostgreSQL in the environment variables.

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: JWT secret key
- `AWS_*`: AWS S3 configuration for image uploads

## API Endpoints

- `GET /health` - Health check
- `GET /docs` - Interactive API documentation
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /artworks/feed` - Get artwork feed
- And more...

## Development

The Docker setup includes hot reload, so code changes will automatically restart the server.
