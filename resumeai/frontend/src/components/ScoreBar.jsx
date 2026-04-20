import { useEffect, useState } from 'react'

export default function ScoreBar({ label, score, color }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { const t = setTimeout(() => setWidth(score), 200); return () => clearTimeout(t) }, [score])
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <span className="text-[13px] font-mono text-[#888]">{label}</span>
        <span className="text-[13px] font-mono font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-[4px] rounded-full" style={{ background: '#1a1a1a' }}>
        <div className="h-full rounded-full transition-all duration-[1400ms] ease-out"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}55` }}/>
      </div>
    </div>
  )
}
