# ResumeAI — Career Intelligence Platform

A full-stack AI Resume Analyzer with a React frontend, FastAPI backend, and an NLP-based ML model using TF-IDF + Sentence Transformers for job-match scoring.

---

## Project Structure

```
resumeai/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Gauge, ScoreBar, Chat, Chips, etc.
│   │   ├── pages/        # Main app pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # API client, helpers
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/           # FastAPI Python API
│   ├── main.py           # API entry point
│   ├── analyzer.py       # Core analysis logic
│   ├── extractor.py      # PDF/DOCX text extraction
│   ├── requirements.txt
│   └── .env.example
├── model/             # ML model artifacts
│   ├── skill_extractor.py
│   ├── similarity.py
│   ├── tfidf_vectorizer.pkl  (generated after training)
│   └── skill_db.json
├── data/
│   ├── raw/           # Place raw CSV datasets here
│   └── processed/     # Auto-generated after preprocessing
├── scripts/
│   ├── preprocess.py     # Data preprocessing
│   ├── train.py          # Model training
│   └── evaluate.py       # Model evaluation
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.9
- **pip** (Python package manager)

---

## Quick Start

### 1. Clone / Extract the project

```bash
unzip resumeai.zip
cd resumeai
```

---

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Download spaCy language model
python -m spacy download en_core_web_sm

# Start the backend (runs on http://localhost:8000)
uvicorn main:app --reload --port 8000
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

### 4. Model Training (Optional — pre-trained artifacts included)

```bash
# Step 1: Place datasets in data/raw/
# Recommended: UpdatedResumeDataSet.csv from Kaggle
# https://www.kaggle.com/datasets/gauravduttakiit/resume-dataset

# Step 2: Preprocess
cd scripts
python preprocess.py

# Step 3: Train
python train.py

# Step 4: Evaluate
python evaluate.py
```

Training artifacts are saved to `model/` automatically.

---

## Environment Variables

```
# backend/.env
GEMINI_API_KEY=your_api_key_here
ALLOWED_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=10
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Analyze resume vs job description |
| POST | `/upload` | Upload and extract resume text |
| POST | `/chat` | AI career coach chat |
| GET | `/health` | Health check |

---

## Retraining the Model

1. Add new resume/JD pairs to `data/raw/`
2. Run `python scripts/preprocess.py`
3. Run `python scripts/train.py`
4. New model artifacts saved to `model/`
5. Restart the backend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.9+ |
| NLP | spaCy, scikit-learn, sentence-transformers |
| AI | Google Gemini API (gemini-1.5-flash) |
| PDF | pdfplumber, python-docx |

---

## License

MIT
