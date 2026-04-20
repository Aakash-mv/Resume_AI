import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { sendChatMessage } from '../utils/api'

const QUICK = [
  'How can I improve my score?',
  'What skills should I prioritize?',
  'Help me rewrite my summary',
  'How do I prepare for the interview?',
]

export default function ChatCoach({ analysis, jobDescription }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: analysis
        ? `Analysis complete. Your overall match is ${analysis.overallScore}%.\n\n${analysis.summary}\n\nWhat would you like to improve first?`
        : 'Hi! Run an analysis first, then I can give you personalized career coaching.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    setMessages(p => [...p, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const reply = await sendChatMessage(msg, history, analysis, jobDescription)
      setMessages(p => [...p, { role: 'assistant', content: reply }])
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Connection error — please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div className="relative rounded-2xl overflow-hidden flex flex-col" style={{ background: '#0e0e0e', border: '1px solid #2a2a2a', height: 560 }}>
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #2563EB, transparent)' }}/>

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1a1a1a]">
        <div className="text-[14px] font-bold">◈ AI Career Coach</div>
        <div className="text-[11px] font-mono text-[#444] mt-0.5">Ask anything — rewrites, interview prep, career strategy</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] shrink-0 font-bold"
                style={{ background: '#0f1f35', border: '1px solid #1e3a5f', color: '#60A5FA' }}>◈</div>
            )}
            <div className="max-w-[85%] px-4 py-2.5 text-[13px] font-mono leading-relaxed whitespace-pre-wrap rounded-2xl"
              style={m.role === 'user'
                ? { background: '#2563EB', color: '#fff', borderBottomRightRadius: 4, boxShadow: '0 4px 16px rgba(37,99,235,.3)' }
                : { background: '#141414', border: '1px solid #1e1e1e', color: '#888', borderBottomLeftRadius: 4 }
              }>
              {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] shrink-0"
              style={{ background: '#0f1f35', border: '1px solid #1e3a5f', color: '#60A5FA' }}>◈</div>
            <div className="flex gap-1.5 items-center px-4 py-3 rounded-2xl" style={{ background: '#141414', border: '1px solid #1e1e1e', borderBottomLeftRadius: 4 }}>
              <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Quick prompts */}
      <div className="flex gap-1.5 flex-wrap px-5 pb-2">
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[11px] font-mono rounded-full px-3 py-1 transition-all duration-200 cursor-pointer"
            style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#444' }}
            onMouseEnter={e => { e.target.style.borderColor='#2563EB'; e.target.style.color='#60A5FA' }}
            onMouseLeave={e => { e.target.style.borderColor='#2a2a2a'; e.target.style.color='#444' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2.5 px-5 pb-5 pt-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask your career coach anything…"
          className="flex-1 h-10 rounded-[10px] px-4 text-[13px] font-mono outline-none transition-all duration-200"
          style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#f0f0f0' }}
          onFocus={e => e.target.style.borderColor='#2563EB'}
          onBlur={e => e.target.style.borderColor='#2a2a2a'}/>
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-[10px] text-white text-[16px] transition-all duration-200 flex items-center justify-center"
          style={{ background: loading || !input.trim() ? '#1a1a1a' : '#2563EB', boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(37,99,235,.3)', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}>
          ➤
        </button>
      </div>
    </div>
  )
}
