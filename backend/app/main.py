import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import boards, cards, lists

Base.metadata.create_all(bind=engine)

# Allowed browser origins, comma-separated. Set FRONTEND_URL to the deployed
# Vercel frontend URL (e.g. https://taskboard-xyz.vercel.app) when deploying;
# localhost stays allowed for local development.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allow_origins = [origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()]

app = FastAPI(title="TaskBoard API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(boards.router)
app.include_router(lists.router)
app.include_router(cards.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
