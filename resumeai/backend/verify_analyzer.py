import os
import sys
import asyncio
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

async def verify():
    print("--- Resume Analyzer Verification ---")
    
    try:
        from backend.analyzer import ResumeAnalyzer
        print("[OK] ResumeAnalyzer imported successfully.")
    except ImportError as e:
        print(f"[FAIL] Failed to import ResumeAnalyzer: {e}")
        return

    try:
        analyzer = ResumeAnalyzer()
        print("[OK] ResumeAnalyzer initialized successfully.")
    except Exception as e:
        print(f"[FAIL] Failed to initialize ResumeAnalyzer: {e}")
        return

    # Mock Data
    resume = "John Doe. Senior Software Engineer. Skills: Python, FastAPI, Docker, Cloud computing."
    jd = "Software Engineer role. Requirements: Python, Cloud experience, API design."

    print("\n--- Running Local Matchers ---")
    try:
        # Skill Match
        skill_match = analyzer.skills_engine.match(resume, jd)
        print(f"[OK] Skill Match working. Score: {skill_match['score']}%")
        print(f"   Matched: {skill_match['matched']}")
        
        # Similarity
        similarity = analyzer.similarity_engine.combined_score(resume, jd)
        print(f"[OK] Similarity Engine working. Combined: {similarity['combined']}%")
    except Exception as e:
        print(f"[FAIL] Local processing failed: {e}")

    print("\n--- Checking LLM Connectivity ---")
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or "your_" in gemini_key:
        print("[WARN] GEMINI_API_KEY not set or placeholder. Skipping LLM call check.")
    else:
        try:
            # We don't want to waste tokens, so just a very small call
            print("Checking Gemini service...")
            response = await analyzer.llm.call("Say 'Gemini OK'", system_prompt="Test")
            print(f"[OK] Gemini Response: {response.strip()}")
        except Exception as e:
            print(f"[FAIL] Gemini call failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
