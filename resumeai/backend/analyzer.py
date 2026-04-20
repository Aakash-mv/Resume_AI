import os
import json
import re
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Local NLP Engines
from model.skill_extractor import SkillExtractor
from model.similarity import SimilarityEngine

from dotenv import load_dotenv

# Ensure .env is re-read and overrides any dangling terminal variables
load_dotenv(override=True)
# ── LLM Service ─────────────────────────────────────────────────────────────

class LLMService:
    """Handles communication with Gemini."""

    def __init__(self):
        self.provider = "gemini"
        self.gemini_key = os.getenv("GEMINI_API_KEY")

        if not self.gemini_key:
            raise ValueError("GEMINI_API_KEY not found in environment.")

        import google.generativeai as genai
        genai.configure(api_key=self.gemini_key)
        self.gemini_model = genai.GenerativeModel("gemini-flash-latest")

    async def call(self, prompt: str, system_prompt: str = "You are a senior technical recruiter and ATS expert.") -> str:
        """Call Gemini API."""
        return await self._call_gemini(prompt, system_prompt)

    async def _call_gemini(self, prompt: str, system_prompt: str) -> str:
        import google.generativeai as genai
        loop = asyncio.get_event_loop()
        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        # Valid Gemini models in order of preference for fallback (2026 Context)
        models_to_try = [
            "gemini-2.5-flash", 
            "gemini-2.5-pro", 
            "gemini-2.0-flash", 
            "gemini-1.5-flash", 
            "gemini-pro"
        ]
        
        last_error = None
        for model_name in models_to_try:
            try:
                temp_model = genai.GenerativeModel(model_name)
                
                # Try the current model
                try:
                    response = await loop.run_in_executor(
                        None,
                        lambda: temp_model.generate_content(full_prompt)
                    )
                    return response.text
                except Exception as e:
                    error_str = str(e).lower()
                    
                    # If it's a quota or rate limit issue, move to the NEXT model immediately
                    if "429" in error_str or "quota" in error_str:
                        print(f"[FALLBACK] Model {model_name} hit limit. Trying next...")
                        continue
                    
                    # For 404 (model not found), also move to next
                    if "404" in error_str:
                        continue
                        
                    # For other errors, re-raise
                    raise e
                        
            except Exception as e:
                # Store the last error but continue to next model if it was a limit/missing model issue
                last_error = e
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "404" in error_str:
                    continue
                else:
                    raise e
                    
        raise last_error or Exception("All Gemini models exhausted or failed.")


# ── Main Analyzer ──────────────────────────────────────────────────────────

class ResumeAnalyzer:
    def __init__(self):
        self.llm = LLMService()
        self.skills_engine = SkillExtractor()
        self.similarity_engine = SimilarityEngine(use_sentence_transformers=True)

    async def analyze(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Full deep analysis using local NLP + Gemini."""
        
        # 1. Local Analysis (Ground Truth)
        skill_match = self.skills_engine.match(resume_text, job_description)
        similarity_data = self.similarity_engine.combined_score(resume_text, job_description)
        
        system_prompt = """
        You are an elite Career Coach & ATS Architect. Your goal is to provide a comprehensive, 
        expert-level analysis of a resume against a job description. 
        You evaluate resumes like a Tier-1 technical recruiter.
        
        CRITICAL: Your output MUST be a valid JSON object. No preamble, no conversational text.
        """

        prompt = f"""
        Perform a Deep Career Intelligence Analysis on the following Resume and Job Description (JD).
        
        --- LOCAL PRE-ANALYSIS RESULTS ---
        Skill Match Score: {skill_match['score']}%
        Matched Skills: {", ".join(skill_match['matched'])}
        Missing Skills: {", ".join(skill_match['missing'])}
        Semantic Similarity (Embeddings): {similarity_data['embedding']}%
        TF-IDF Similarity: {similarity_data['tfidf']}%

        RESUME:
        {resume_text}

        JOB DESCRIPTION:
        {job_description}

        --- EVALUATION CRITERIA ---
        1. EXPERIENCE & IMPACT (Weight: 30%):
           - Does the resume use the 'XYZ' formula (Accomplished [X] as measured by [Y], by doing [Z])?
           - Presence of quantifiable metrics (%, $, numbers).
           - Strong action verbs vs. weak 'responsible for' phrasing.
           
        2. ATS COMPATIBILITY (Weight: 20%):
           - Evaluate formatting (columns, tables, headers).
           - Suggest missing keywords for ATS optimization.
           
        3. EDUCATION & CERTS (Weight: 10%):
           - Are the required degrees/certifications present?

        --- TASKS ---
        1. Generate realistic scores for 'experienceScore', 'atsScore', and 'educationScore'.
        2. DO NOT recalculate 'skillMatchScore' or 'jobMatchScore' (similarity). Use the local results provided above.
        3. Identify 3 professional strengths and 3 clear gaps (weaknesses).
        4. Provide 5 actionable 'Tailoring Tips' ranked by impact.
        5. Rewrite 3 bullet points into high-impact versions using metrics.

        --- OUTPUT JSON SCHEMA ---
        {{
            "experienceScore": int,
            "atsScore": int,
            "educationScore": int,
            "summary": "2-3 sentence strategic executive summary",
            "strengths": ["string"],
            "weaknesses": ["string"],
            "tailoringTips": ["string"],
            "bulletImprovements": [
                {{ "original": "original bullet text", "improved": "metrics-driven rewrite" }}
            ],
            "atsIssues": ["Specific formatting or content issues"]
        }}
        """

        try:
            raw_response = await self.llm.call(prompt, system_prompt)
            json_match = re.search(r'(\{.*\})', raw_response, re.DOTALL)
            if json_match:
                llm_result = json.loads(json_match.group(1))
            else:
                llm_result = json.loads(raw_response)
            
            # Weighted Scoring Calculation
            # 40% Skills, 30% Experience, 20% ATS, 10% Education
            skill_w = 0.40
            exp_w = 0.30
            ats_w = 0.20
            edu_w = 0.10
            
            job_match_score = similarity_data['combined']
            skill_score = skill_match['score']
            exp_score = llm_result.get("experienceScore", 0)
            ats_score = llm_result.get("atsScore", 0)
            edu_score = llm_result.get("educationScore", 0)
            
            overall_score = round(
                (skill_score * skill_w) + 
                (exp_score * exp_w) + 
                (ats_score * ats_w) + 
                (edu_score * edu_w)
            )

            # Final merged result
            result = {
                "overallScore": overall_score,
                "jobMatchScore": job_match_score,
                "skillMatchScore": skill_score,
                "experienceScore": exp_score,
                "atsScore": ats_score,
                "educationScore": edu_score,
                "summary": llm_result.get("summary", ""),
                "strengths": llm_result.get("strengths", []),
                "weaknesses": llm_result.get("weaknesses", []),
                "tailoringTips": llm_result.get("tailoringTips", []),
                "presentSkills": skill_match['matched'],
                "missingSkills": skill_match['missing'],
                "missingKeywords": llm_result.get("missingKeywords", []),
                "bulletImprovements": llm_result.get("bulletImprovements", []),
                "atsIssues": llm_result.get("atsIssues", [])
            }
            
            return result

        except Exception as e:
            print(f"Analysis Error: {e}")
            return self._fallback_analysis(resume_text, job_description, skill_match, similarity_data)

    async def chat(self, message: str, history: List[Dict[str, str]], analysis: Optional[Dict[str, Any]], jd: str) -> str:
        """Personalized career coaching chat via Gemini."""
        
        system_prompt = "You are a world-class Career Coach. You have the context of the user's resume analysis."
        
        context = f"""
        Analysis Data: {json.dumps(analysis) if analysis else 'Not yet analyzed'}
        Job Description: {jd[:1000] if jd else 'Not provided'}
        """

        full_prompt = f"""
        CONTEXT:
        {context}

        CHAT HISTORY:
        {json.dumps(history)}

        USER MESSAGE:
        {message}

        Provide a concise, expert, and encouraging response via Gemini. Highlight areas from the analysis context.
        """

        try:
            return await self.llm.call(full_prompt, system_prompt)
        except Exception as e:
            return f"Coach is busy (Gemini error): {str(e)}"

    def _fallback_analysis(self, resume: str, jd: str, skill_match: dict, similarity: dict) -> Dict[str, Any]:
        """Refined local analysis if LLM fails."""
        skill_score = skill_match.get('score', 0)
        sim_score = similarity.get('combined', 0)
        overall = round((skill_score * 0.6) + (sim_score * 0.4))
        
        return {
            "overallScore": overall,
            "jobMatchScore": sim_score,
            "skillMatchScore": skill_score,
            "experienceScore": 50,
            "atsScore": 50,
            "educationScore": 50,
            "summary": "Local NLP analysis utilized (AI API currently unavailable).",
            "strengths": ["Matched key skills", "Semantic alignment found"],
            "weaknesses": ["Detailed AI experience audit unavailable"],
            "tailoringTips": ["Review JD for specific action items"],
            "presentSkills": skill_match.get('matched', []),
            "missingSkills": skill_match.get('missing', []),
            "missingKeywords": [],
            "bulletImprovements": [],
            "atsIssues": ["AI check unavailable"]
        }
