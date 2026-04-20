"""
ResumeAI Backend — FastAPI Entry Point
"""
import os
import sys
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(override=True)

# Add parent to path so model/ is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from extractor import extract_text_from_file
from analyzer import ResumeAnalyzer

app = FastAPI(title="ResumeAI API", version="1.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ResumeAnalyzer()


# ── Models ──────────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str


class ChatRequest(BaseModel):
    message: str
    history: list
    analysis_context: Optional[dict] = None
    job_description: Optional[str] = ""


# ── Routes ──────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.1", "llm_provider": analyzer.llm.provider}


@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Extract text from uploaded PDF/DOCX/TXT file."""
    max_mb = int(os.getenv("MAX_FILE_SIZE_MB", 10))
    contents = await file.read()
    if len(contents) > max_mb * 1024 * 1024:
        raise HTTPException(413, f"File too large. Max {max_mb}MB.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".pdf", ".doc", ".docx", ".txt"}:
        raise HTTPException(400, "Unsupported file type. Use PDF, DOCX, or TXT.")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        text = extract_text_from_file(tmp_path, suffix)
    finally:
        os.unlink(tmp_path)

    if not text.strip():
        raise HTTPException(422, "Could not extract text from file. Try pasting the text directly.")

    return {"text": text, "filename": file.filename, "char_count": len(text)}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Full resume vs job-description analysis."""
    if len(req.resume_text.strip()) < 50:
        raise HTTPException(400, "Resume text too short.")
    if len(req.job_description.strip()) < 30:
        raise HTTPException(400, "Job description too short.")

    try:
        result = await analyzer.analyze(req.resume_text, req.job_description)
        return result
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@app.post("/chat")
async def chat(req: ChatRequest):
    """Direct AI Career Coaching."""
    try:
        reply = await analyzer.chat(
            message=req.message,
            history=req.history,
            analysis=req.analysis_context,
            jd=req.job_description
        )
        return {"reply": reply}

    except Exception as e:
        return {"reply": f"AI service error: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)