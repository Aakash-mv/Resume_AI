const TYPES = {
  green: { bg: 'rgba(34,197,94,.08)', border: 'rgba(34,197,94,.25)', color: '#22c55e' },
  red:   { bg: 'rgba(239,68,68,.08)', border: 'rgba(239,68,68,.25)', color: '#ef4444' },
  amber: { bg: 'rgba(245,158,11,.08)', border: 'rgba(245,158,11,.25)', color: '#f59e0b' },
  blue:  { bg: '#0f1f35', border: '#1e3a5f', color: '#60A5FA' },
}

export default function Chip({ text, type = 'blue' }) {
  const s = TYPES[type] || TYPES.blue
  return (
    <span className="inline-block font-mono text-[11px] font-semibold rounded-[6px] px-3 py-1 m-[3px]"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {text}
    </span>
  )
}
