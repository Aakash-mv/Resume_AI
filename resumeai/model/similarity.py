"""
Similarity engine — TF-IDF cosine similarity + optional sentence-transformer embeddings.
"""
from pathlib import Path
from typing import Tuple
import numpy as np

MODEL_DIR = Path(__file__).parent


class SimilarityEngine:
    def __init__(self, use_sentence_transformers: bool = False):
        self.use_st = use_sentence_transformers
        self._tfidf = None
        self._st_model = None
        self._load()

    def _load(self):
        # Try to load pre-trained TF-IDF vectorizer
        tfidf_path = MODEL_DIR / "tfidf_vectorizer.pkl"
        if tfidf_path.exists():
            try:
                import joblib
                self._tfidf = joblib.load(tfidf_path)
            except Exception:
                pass

        if self.use_st:
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception:
                pass

    def tfidf_similarity(self, text_a: str, text_b: str) -> float:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        if self._tfidf is not None:
            try:
                vecs = self._tfidf.transform([text_a, text_b])
                return float(cosine_similarity(vecs[0], vecs[1])[0][0])
            except Exception:
                pass

        # Fit on the fly
        vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=8000)
        vecs = vec.fit_transform([text_a, text_b])
        return float(cosine_similarity(vecs[0], vecs[1])[0][0])

    def embedding_similarity(self, text_a: str, text_b: str) -> float:
        if self._st_model is None:
            return self.tfidf_similarity(text_a, text_b)
        try:
            emb_a, emb_b = self._st_model.encode([text_a[:512], text_b[:512]])
            cos = np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b))
            return float(cos)
        except Exception:
            return self.tfidf_similarity(text_a, text_b)

    def combined_score(self, text_a: str, text_b: str) -> dict:
        tfidf = self.tfidf_similarity(text_a, text_b)
        if self._st_model:
            emb = self.embedding_similarity(text_a, text_b)
            combined = tfidf * 0.4 + emb * 0.6
        else:
            emb = None
            combined = tfidf

        return {
            "tfidf": round(tfidf * 100, 1),
            "embedding": round(emb * 100, 1) if emb is not None else None,
            "combined": round(combined * 100, 1),
        }
