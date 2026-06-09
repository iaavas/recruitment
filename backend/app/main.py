from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .database import engine, SessionLocal
from . import models
from .routers import  auth as auth_router
from .seed import seed

load_dotenv()
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TechKraft Recruitment API — v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)

@app.on_event("startup")
def on_startup():
    """Seed roles and permissions on every startup — safe to run repeatedly."""
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {"status": "ok", "version": "2.0"}