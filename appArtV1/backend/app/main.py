from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth
from .routers import users
from .routers import artworks
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AppArt V1 API",
    description="Backend API for AppArt V1 mobile application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(artworks.router, prefix="/artworks", tags=["artworks"])
# TODO: Re-enable other routers after fixing model imports
# app.include_router(requests.router, prefix="/requests", tags=["requests"])
# app.include_router(offers.router, prefix="/offers", tags=["offers"])
# app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

@app.get("/")
def root():
    return {"message": "AppArt V1 API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
