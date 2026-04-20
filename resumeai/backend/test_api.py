import requests
import json
import time

resume_text = """**Name:** Aakash M
**Email:** aakash@email.com
**Phone:** 9876543210

**Objective:**
Aspiring Software Engineer with interest in Artificial Intelligence and Machine Learning. Looking to apply my skills in real-world applications.

**Education:**
B.Tech in Computer Science (AI/ML)
VIT-AP University
CGPA: 9.1

**Skills:**

* Programming: Python, JavaScript
* Web: HTML, CSS, Node.js
* Database: MySQL
* Tools: Git, VS Code

**Projects:**

1. **Resume AI Analyzer**

   * Built a web application to analyze resumes using AI
   * Used FastAPI and Next.js
   * Implemented basic keyword matching

2. **Crop Recommendation System**

   * Suggested crops based on soil pH and season
   * Used Python and basic ML algorithms

**Experience:**
No formal work experience

**Certifications:**

* Introduction to Machine Learning (Coursera)

**Strengths:**

* Quick learner
* Good problem-solving skills
"""

jd_text = """**Job Title:** Software Engineer – AI/ML

**Responsibilities:**

* Develop and deploy machine learning models for real-world applications
* Work with NLP models for text analysis and prediction
* Build REST APIs using Node.js or Python (FastAPI/Flask)
* Collaborate with cross-functional teams to integrate AI solutions
* Optimize model performance and scalability

**Requirements:**

* Strong knowledge of Python and JavaScript
* Experience with machine learning frameworks (TensorFlow, PyTorch, scikit-learn)
* Familiarity with NLP concepts (tokenization, embeddings, transformers)
* Experience with REST APIs and backend development
* Knowledge of databases (MySQL, MongoDB)
* Understanding of Git and version control

**Preferred:**

* Experience with cloud platforms (AWS/GCP)
* Projects related to AI/ML or NLP
* Understanding of ATS systems and resume parsing
"""

def run_tests():
    print("Testing /analyze endpoint...")
    url = "http://127.0.0.1:8000/analyze"
    payload = {
        "resume_text": resume_text,
        "job_description": jd_text
    }
    
    try:
        r = requests.post(url, json=payload, timeout=60)
        r.raise_for_status()
        analysis_res = r.json()
        print("Analysis Successful!")
        print(f"Overall Score: {analysis_res.get('overallScore')}")
        print(f"Strengths: {analysis_res.get('strengths')}")
    except Exception as e:
        print("Failed /analyze endpoint:", str(e))
        if 'r' in locals():
            print(r.text)
        return

    print("\nTesting /chat endpoint...")
    url_chat = "http://127.0.0.1:8000/chat"
    payload_chat = {
        "message": "How can I improve my score?",
        "history": [],
        "analysis_context": analysis_res,
        "job_description": jd_text
    }

    try:
        r2 = requests.post(url_chat, json=payload_chat, timeout=60)
        r2.raise_for_status()
        chat_res = r2.json()
        print("Chat Successful!")
        print("Reply:", chat_res.get("reply"))
    except Exception as e:
        print("Failed /chat endpoint:", str(e))
        if 'r2' in locals():
            print(r2.text)

if __name__ == "__main__":
    time.sleep(2) # Give uvicorn a moment to pick up the changes if it was reloading
    run_tests()
