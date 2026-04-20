import { useState, useRef } from 'react'
import Speedometer from './components/Speedometer'
import ScoreBar from './components/ScoreBar'
import Chip from './components/Chip'
import Panel, { PanelLabel } from './components/Panel'
import ChatCoach from './components/ChatCoach'
import { uploadResume, analyzeResume } from './utils/api'

// ── Helpers ────────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  'Parsing resume structure…',
  'Extracting skills & experience…',
  'Comparing with job description…',
  'Running ATS compatibility scan…',
  'Calculating match score…',
  'Generating actionable insights…',
]
const TABS = ['Overview','Skills','Improvements','ATS Report','AI Coach']

// ── Upload Screen ─────────────────────────────────────────────────────────
function UploadScreen({ onAnalyze }) {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = async (f) => {
    if (!f) return
    setFile(f)
    setError('')
    setUploading(true)
    try {
      const data = await uploadResume(f)
      setResumeText(data.text)
    } catch {
      setResumeText(`[File: ${f.name}]\nCould not auto-extract — paste text below or check backend is running.`)
    }
    setUploading(false)
  }

  const ready = (resumeText.trim().length > 30 || file) && jdText.trim().length > 30

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16" style={{ paddingBottom: 80 }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-16">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold"
          style={{ border: '1.5px solid #2563EB', color: '#3B82F6', boxShadow: '0 0 20px rgba(37,99,235,.3)' }}>◈</div>
        <span className="text-lg font-black tracking-tight">Resume<span style={{ color: '#3B82F6' }}>AI</span></span>
      </div>

      {/* Hero */}
      <div className="text-[10px] font-mono font-bold tracking-[2px] uppercase flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
        style={{ background: '#0f1f35', border: '1px solid #1e3a5f', color: '#60A5FA' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: '#3B82F6', boxShadow: '0 0 6px #3B82F6' }}/>
        AI Career Intelligence
      </div>

      <h1 className="text-center font-black tracking-tight mb-4 leading-[1.05]" style={{ fontSize: 'clamp(32px,6vw,68px)', letterSpacing: '-2px' }}>
        Decode Your<br/>
        <span style={{ color: 'transparent', WebkitTextStroke: '1.5px #3B82F6' }}>Job Match</span>
      </h1>
      <p className="font-mono text-center mb-14 leading-relaxed" style={{ color: '#666', fontSize: 16, maxWidth: 460 }}>
        Upload your resume. Paste a job description.<br/>Get deep AI insights + your selection probability.
      </p>

      {error && (
        <div className="w-full max-w-[900px] mb-4 px-4 py-3 rounded-xl text-[13px] font-mono"
          style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: '#ef4444' }}>
          ⚠ {error}
        </div>
      )}

      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Resume panel */}
        <Panel>
          <PanelLabel>01 — Your Resume</PanelLabel>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl text-center cursor-pointer transition-all duration-200 mb-4"
            style={{
              border: `2px dashed ${dragOver ? '#2563EB' : file ? '#22c55e' : '#2a2a2a'}`,
              padding: '28px 16px',
              background: dragOver ? '#0f1f35' : file ? 'rgba(34,197,94,.04)' : 'transparent',
            }}>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
              onChange={e => handleFile(e.target.files[0])}/>
            <div className="text-2xl mb-2">{uploading ? '⏳' : file ? '✅' : '📄'}</div>
            {file
              ? <><div className="text-[13px] font-bold" style={{ color: '#22c55e' }}>{file.name}</div>
                  <div className="text-[11px] font-mono mt-1" style={{ color: '#444' }}>{uploading ? 'Extracting text…' : 'Click to replace'}</div></>
              : <><div className="text-[14px] font-semibold" style={{ color: '#666' }}>Drop your resume here</div>
                  <div className="text-[11px] font-mono mt-1" style={{ color: '#444' }}>PDF · DOCX · TXT — or click to browse</div></>
            }
          </div>
          <div className="text-[11px] font-mono text-center mb-3" style={{ color: '#444' }}>— or paste text —</div>
          <textarea value={file ? '' : resumeText} onChange={e => { setResumeText(e.target.value); setFile(null) }}
            placeholder="Paste your full resume here — work experience, skills, education, projects…"
            rows={7} className="w-full rounded-[10px] px-4 py-3 text-[13px] font-mono leading-relaxed resize-y outline-none transition-colors duration-200"
            style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0' }}
            onFocus={e => e.target.style.borderColor='#2563EB'}
            onBlur={e => e.target.style.borderColor='#2a2a2a'}/>
          <div className="text-right text-[11px] font-mono mt-2" style={{ color: '#444' }}>
            {(file ? resumeText : resumeText).trim().split(/\s+/).filter(Boolean).length} words
          </div>
        </Panel>

        {/* JD panel */}
        <Panel>
          <PanelLabel>02 — Job Description</PanelLabel>
          <textarea value={jdText} onChange={e => setJdText(e.target.value)}
            placeholder={"Paste the complete job description here.\n\nInclude requirements, responsibilities, and preferred qualifications for the most accurate analysis…"}
            rows={16} className="w-full rounded-[10px] px-4 py-3 text-[13px] font-mono leading-relaxed resize-y outline-none transition-colors duration-200"
            style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#f0f0f0' }}
            onFocus={e => e.target.style.borderColor='#2563EB'}
            onBlur={e => e.target.style.borderColor='#2a2a2a'}/>
          <div className="text-right text-[11px] font-mono mt-2" style={{ color: '#444' }}>
            {jdText.trim().split(/\s+/).filter(Boolean).length} words
          </div>
        </Panel>
      </div>

      {/* CTA */}
      <button onClick={() => onAnalyze(resumeText || '', jdText)} disabled={!ready}
        className="flex items-center gap-2.5 text-white font-bold rounded-xl px-12 py-4 text-[15px] transition-all duration-200 relative overflow-hidden"
        style={{
          background: ready ? '#2563EB' : '#1a1a1a',
          color: ready ? '#fff' : '#444',
          boxShadow: ready ? '0 0 30px rgba(37,99,235,.35), inset 0 1px 0 rgba(255,255,255,.1)' : 'none',
          cursor: ready ? 'pointer' : 'not-allowed',
          letterSpacing: '0.3px',
        }}>
        <span>◈</span> Analyze My Resume
      </button>
      <div className="text-[12px] font-mono mt-3" style={{ color: '#444' }}>
        ML model + Gemini 1.5 Flash · ~10 seconds
      </div>
    </div>
  )
}

// ── Loading Screen ────────────────────────────────────────────────────────
function LoadingScreen({ step }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-0">
      <div className="text-xl font-black tracking-tight mb-14" style={{ color: '#666' }}>
        Resume<span style={{ color: '#3B82F6' }}>AI</span>
      </div>
      {/* Spinner */}
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#111" strokeWidth="4"/>
        <circle cx="50" cy="50" r="44" fill="none" stroke="#2563EB" strokeWidth="4"
          strokeDasharray="80 196" strokeLinecap="round"
          style={{ transformOrigin: 'center', animation: 'spin 1.2s linear infinite' }}/>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <text x="50" y="56" textAnchor="middle" fill="#3B82F6" fontSize="22" fontFamily="JetBrains Mono" fontWeight="600">◈</text>
      </svg>
      {/* Steps */}
      <div className="mt-10 flex flex-col gap-2" style={{ width: 320 }}>
        {LOADING_STEPS.map((s, i) => {
          const active = i === step
          const done = i < step
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-[13px] transition-all duration-300"
              style={{
                background: active ? '#0f1f35' : 'transparent',
                color: done ? '#22c55e' : active ? '#60A5FA' : '#333',
              }}>
              <div className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                style={{
                  background: done ? '#22c55e' : active ? '#3B82F6' : '#222',
                  boxShadow: active ? '0 0 8px #3B82F6' : 'none',
                }}/>
              {s}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Results Screen ────────────────────────────────────────────────────────
function ResultsScreen({ data, jdText, onReset }) {
  const [tab, setTab] = useState(0)
  const a = data

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a]"
        style={{ background: 'rgba(0,0,0,.9)', backdropFilter: 'blur(16px)' }}>
        <span className="text-base font-black tracking-tight">Resume<span style={{ color: '#3B82F6' }}>AI</span></span>
        <button onClick={onReset}
          className="text-[13px] font-bold px-5 py-2 rounded-lg transition-all duration-200"
          style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#666' }}
          onMouseEnter={e => { e.target.style.borderColor='#2563EB'; e.target.style.color='#60A5FA' }}
          onMouseLeave={e => { e.target.style.borderColor='#2a2a2a'; e.target.style.color='#666' }}>
          ← New Analysis
        </button>
      </div>

      <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-8">
        {/* Hero row */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 mb-4">
          {/* Gauge */}
          <Panel className="flex flex-col items-center">
            <PanelLabel>Selection Probability</PanelLabel>
            <Speedometer value={a.overallScore}/>
            <div className="mt-4 text-center text-[12px] font-mono leading-relaxed px-2 py-3 rounded-xl w-full"
              style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#666' }}>
              {a.summary}
            </div>
          </Panel>
          {/* Scores */}
          <Panel>
            <PanelLabel>Score Breakdown</PanelLabel>
            <ScoreBar label="Job Match" score={a.jobMatchScore} color="#3B82F6"/>
            <ScoreBar label="Skill Match" score={a.skillMatchScore} color="#60A5FA"/>
            <ScoreBar label="Experience Relevance" score={a.experienceScore} color="#f59e0b"/>
            <ScoreBar label="ATS Compatibility" score={a.atsScore} color="#a78bfa"/>
            <ScoreBar label="Education Relevance" score={a.educationScore} color="#22c55e"/>
          </Panel>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: '#0e0e0e', border: '1px solid #1a1a1a' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="flex-1 py-2.5 rounded-lg text-[12px] font-bold tracking-[0.3px] transition-all duration-200 cursor-pointer"
              style={{
                background: tab === i ? '#2563EB' : 'transparent',
                color: tab === i ? '#fff' : '#444',
                boxShadow: tab === i ? '0 4px 16px rgba(37,99,235,.4)' : 'none',
                border: 'none',
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 0 && (
          <div className="animate-fade-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Panel>
                <div className="text-[13px] font-bold mb-4" style={{ color: '#22c55e' }}>▲ Strengths</div>
                {a.strengths?.map((s,i) => (
                  <div key={i} className="flex gap-3 mb-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#22c55e' }}/>
                    <span className="text-[13px] font-mono leading-relaxed" style={{ color: '#666' }}>{s}</span>
                  </div>
                ))}
              </Panel>
              <Panel>
                <div className="text-[13px] font-bold mb-4" style={{ color: '#ef4444' }}>▼ Weaknesses</div>
                {a.weaknesses?.map((w,i) => (
                  <div key={i} className="flex gap-3 mb-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#ef4444' }}/>
                    <span className="text-[13px] font-mono leading-relaxed" style={{ color: '#666' }}>{w}</span>
                  </div>
                ))}
              </Panel>
            </div>
            <Panel>
              <div className="text-[13px] font-bold mb-4" style={{ color: '#f59e0b' }}>◆ Tailoring Tips</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {a.tailoringTips?.map((t,i) => (
                  <div key={i} className="rounded-xl px-4 py-3 text-[13px] font-mono leading-relaxed"
                    style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#666' }}>
                    <span style={{ color: '#3B82F6', fontWeight: 700, marginRight: 6 }}>{String(i+1).padStart(2,'0')}.</span>{t}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* Skills */}
        {tab === 1 && (
          <div className="animate-fade-up flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel>
                <div className="text-[13px] font-bold mb-4" style={{ color: '#22c55e' }}>✓ Matched Skills</div>
                <div>{a.presentSkills?.map((s,i) => <Chip key={i} text={s} type="green"/>)}</div>
              </Panel>
              <Panel>
                <div className="text-[13px] font-bold mb-4" style={{ color: '#ef4444' }}>✗ Missing Skills</div>
                <div>{a.missingSkills?.map((s,i) => <Chip key={i} text={s} type="red"/>)}</div>
              </Panel>
            </div>
            <Panel>
              <div className="text-[13px] font-bold mb-2" style={{ color: '#f59e0b' }}>⚑ Missing JD Keywords</div>
              <p className="text-[12px] font-mono mb-4 leading-relaxed" style={{ color: '#444' }}>
                These appear in the job description but are absent from your resume. Adding them significantly boosts ATS score.
              </p>
              <div>{a.missingKeywords?.map((k,i) => <Chip key={i} text={k} type="amber"/>)}</div>
            </Panel>
          </div>
        )}

        {/* Improvements */}
        {tab === 2 && (
          <div className="animate-fade-up flex flex-col gap-4">
            <div className="px-4 py-3 rounded-xl text-[13px] font-mono leading-relaxed"
              style={{ background: '#0f1f35', border: '1px solid #1e3a5f', color: '#93c5fd' }}>
              💡 <strong>Impact formula:</strong> Every bullet should answer — What did you do? At what scale? What was the measurable result?
            </div>
            <Panel>
              {a.bulletImprovements?.map((b,i) => (
                <div key={i}>
                  {i > 0 && <div className="my-5 border-t border-[#1a1a1a]"/>}
                  <div className="mb-3">
                    <div className="text-[10px] font-mono font-bold tracking-[2px] uppercase mb-2" style={{ color: '#ef4444' }}>✗ Before</div>
                    <div className="rounded-lg px-4 py-3 text-[13px] font-mono leading-relaxed border-l-2"
                      style={{ background: '#0a0a0a', borderColor: '#ef4444', color: '#666' }}>{b.original}</div>
                  </div>
                  <div className="text-center text-lg my-2" style={{ color: '#333' }}>↓</div>
                  <div>
                    <div className="text-[10px] font-mono font-bold tracking-[2px] uppercase mb-2" style={{ color: '#22c55e' }}>✓ After</div>
                    <div className="rounded-lg px-4 py-3 text-[13px] font-mono leading-relaxed border-l-2"
                      style={{ background: '#0a0a0a', borderColor: '#22c55e', color: '#666' }}>{b.improved}</div>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        )}

        {/* ATS */}
        {tab === 3 && (
          <div className="animate-fade-up">
            <Panel>
              <div className="text-[13px] font-bold mb-2" style={{ color: '#60A5FA' }}>◈ ATS Compatibility Report</div>
              <p className="text-[12px] font-mono mb-5 leading-relaxed" style={{ color: '#444' }}>
                ~75% of resumes are filtered by ATS before a human reads them. Fix these issues to get past the bots.
              </p>
              <ScoreBar label="ATS Compatibility Score" score={a.atsScore} color="#a78bfa"/>
              <div className="mt-4">
                {a.atsIssues?.map((issue,i) => (
                  <div key={i} className="flex gap-3 items-start px-4 py-3 rounded-xl mb-3 text-[13px] font-mono leading-relaxed"
                    style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.15)', color: '#666' }}>
                    <span style={{ color: '#ef4444' }}>⚠</span>{issue}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl px-4 py-4" style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.15)' }}>
                <div className="text-[11px] font-mono font-bold uppercase tracking-[1px] mb-3" style={{ color: '#22c55e' }}>Best Practices</div>
                {['Use standard headings: Experience, Education, Skills, Summary',
                  'Avoid tables, columns, text boxes, headers/footers, and graphics',
                  'Save as clean .docx or plain text — avoid designed PDFs',
                  'Mirror exact keywords and phrases from the job description',
                  'Spell out acronyms at least once (e.g. "Machine Learning (ML)")',
                ].map((t,i) => (
                  <div key={i} className="flex gap-2.5 mb-2 text-[13px] font-mono leading-relaxed" style={{ color: '#666' }}>
                    <span style={{ color: '#22c55e' }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* Coach */}
        {tab === 4 && (
          <div className="animate-fade-up">
            <ChatCoach analysis={a} jobDescription={jdText}/>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('upload') // upload | loading | results
  const [loadStep, setLoadStep] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [jdText, setJdText] = useState('')

  const handleAnalyze = async (resumeText, jd) => {
    setJdText(jd)
    setScreen('loading')
    setLoadStep(0)

    let step = 0
    const iv = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1)
      setLoadStep(step)
    }, 900)

    try {
      const data = await analyzeResume(resumeText, jd)
      clearInterval(iv)
      setAnalysis(data)
      setScreen('results')
    } catch (e) {
      clearInterval(iv)
      // Show fallback with error note
      setAnalysis({
        overallScore: 50, jobMatchScore: 55, atsScore: 50,
        skillMatchScore: 55, experienceScore: 50, educationScore: 70,
        presentSkills: ['See backend logs'],
        missingSkills: ['Backend may not be running'],
        missingKeywords: ['Start backend: uvicorn main:app --reload'],
        strengths: ['Resume text received successfully', 'Job description parsed', 'Analysis attempted', 'Check backend logs for details'],
        weaknesses: ['Backend connection failed — start it with uvicorn main:app --reload', 'Ensure .env has GEMINI_API_KEY', 'Install dependencies: pip install -r requirements.txt', 'Check console for detailed error'],
        bulletImprovements: [{ original: 'Backend not connected', improved: 'Run: cd backend && pip install -r requirements.txt && uvicorn main:app --reload' }],
        tailoringTips: ['Start the FastAPI backend first', 'Add GEMINI_API_KEY to backend/.env', 'Run: pip install -r requirements.txt', 'Then run: uvicorn main:app --reload --port 8000'],
        atsIssues: ['Backend not running — start with uvicorn main:app --reload', 'See README.md for full setup instructions'],
        summary: `Backend connection failed. Start the backend: cd backend && pip install -r requirements.txt && uvicorn main:app --reload`,
      })
      setScreen('results')
    }
  }

  if (screen === 'upload') return <UploadScreen onAnalyze={handleAnalyze}/>
  if (screen === 'loading') return <LoadingScreen step={loadStep}/>
  return <ResultsScreen data={analysis} jdText={jdText} onReset={() => { setScreen('upload'); setAnalysis(null) }}/>
}
