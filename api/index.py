"""
Book Boo API — FastAPI backend
Deployed as a Vercel serverless function at /api/*
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import httpx

app = FastAPI(title="Book Boo API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def get_supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "book-boo-api"}


# ── Book info ─────────────────────────────────────────────────────────────────
@app.get("/api/book")
async def get_book_info():
    """Returns the public URL for the PDF stored in Supabase Storage."""
    if not SUPABASE_URL:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    bucket = "books"
    filename = "the-alchemist.pdf"
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{filename}"

    return {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "pdf_url": public_url,
    }


# ── Threads ───────────────────────────────────────────────────────────────────
class CreateThreadRequest(BaseModel):
    page_number: int
    selected_text: Optional[str] = ""
    anchor_type: str  # word | phrase | sentence | paragraph | page | chapter
    created_by: str   # harshuu | sashank


class CreateReplyRequest(BaseModel):
    thread_id: str
    content: str
    created_by: str


@app.post("/api/threads")
async def create_thread(body: CreateThreadRequest):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/threads",
            headers={**get_supabase_headers(), "Prefer": "return=representation"},
            json={
                "page_number": body.page_number,
                "selected_text": body.selected_text,
                "anchor_type": body.anchor_type,
                "created_by": body.created_by,
            },
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    return resp.json()[0] if isinstance(resp.json(), list) else resp.json()


@app.get("/api/threads/{page_number}")
async def get_threads_for_page(page_number: int):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/threads",
            headers=get_supabase_headers(),
            params={
                "select": "*,replies(*)",
                "page_number": f"eq.{page_number}",
                "order": "created_at.asc",
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    return resp.json()


@app.post("/api/replies")
async def create_reply(body: CreateReplyRequest):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/replies",
            headers={**get_supabase_headers(), "Prefer": "return=representation"},
            json={
                "thread_id": body.thread_id,
                "content": body.content,
                "created_by": body.created_by,
            },
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    return resp.json()[0] if isinstance(resp.json(), list) else resp.json()


# ── PDF upload (admin use only) ───────────────────────────────────────────────
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload the PDF to Supabase Storage.
    Use this once from a local machine — not exposed in production.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    content = await file.read()
    bucket = "books"
    storage_path = "the-alchemist.pdf"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/storage/v1/object/{bucket}/{storage_path}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/pdf",
                "x-upsert": "true",
            },
            content=content,
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{storage_path}"
    return {"message": "PDF uploaded successfully", "url": public_url}
