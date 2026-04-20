"""
Skill Extractor — extracts skills from text using NLP and a skill database.
"""
import re
import json
from pathlib import Path
from typing import List, Set

SKILL_DB_PATH = Path(__file__).parent / "skill_db.json"


class SkillExtractor:
    def __init__(self):
        self.skills = self._load_skills()
        # Sort by length desc so multi-word skills match first
        self.skills_sorted = sorted(self.skills, key=len, reverse=True)

    def _load_skills(self) -> List[str]:
        if SKILL_DB_PATH.exists():
            with open(SKILL_DB_PATH) as f:
                return json.load(f).get("skills", [])
        return []

    def extract(self, text: str) -> List[str]:
        text_lower = text.lower()
        found = set()
        for skill in self.skills_sorted:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found.add(skill)
        return sorted(found)

    def match(self, resume_text: str, jd_text: str) -> dict:
        resume_skills = set(s.lower() for s in self.extract(resume_text))
        jd_skills = set(s.lower() for s in self.extract(jd_text))
        matched = resume_skills & jd_skills
        missing = jd_skills - resume_skills
        extra = resume_skills - jd_skills
        score = round(len(matched) / max(len(jd_skills), 1) * 100)
        return {
            "matched": [s.title() for s in sorted(matched)],
            "missing": [s.title() for s in sorted(missing)],
            "extra": [s.title() for s in sorted(extra)],
            "score": score,
        }
