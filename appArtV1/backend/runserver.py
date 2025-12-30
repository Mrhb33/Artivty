"""Entrypoint that reliably starts the FastAPI backend with sane defaults."""

from __future__ import annotations

import os
from pathlib import Path

import uvicorn

APP_MODULE = "backend.app.main:app"
BASE_DIR = Path(__file__).resolve().parent


def _env_flag(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def main() -> None:
    """Start Uvicorn with the AppArt backend."""
    host = os.environ.get("APPART_BACKEND_HOST", "0.0.0.0")
    port = int(os.environ.get("APPART_BACKEND_PORT", "8000"))
    reload_enabled = _env_flag("APPART_RELOAD", True)
    reload_dirs = [str(BASE_DIR / "app")] if reload_enabled else None

    uvicorn.run(
        APP_MODULE,
        host=host,
        port=port,
        reload=reload_enabled,
        reload_dirs=reload_dirs,
        log_level="info",
    )


if __name__ == "__main__":
    main()
