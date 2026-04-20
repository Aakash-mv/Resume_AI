import { useEffect, useRef, useState } from 'react'

const CX = 130, CY = 145, R = 100
const START_DEG = 240 
const SWEEP = 240
const OFFSET = 4 

function degToRad(d) { return (d - 90) * Math.PI / 180 }
function polar(cx, cy, r, deg) {
  const rad = degToRad(deg)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
function arcPath(cx, cy, r, s, e) {
  if (Math.abs(e - s) < 0.1) return ''
  const sp = polar(cx, cy, r, s), ep = polar(cx, cy, r, e)
  const large = (e - s) > 180 ? 1 : 0
  return `M${sp.x.toFixed(3)},${sp.y.toFixed(3)} A${r},${r} 0 ${large} 1 ${ep.x.toFixed(3)},${ep.y.toFixed(3)}`
}

export default function Speedometer({ value = 0 }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    let current = 0
    const target = Math.max(0, Math.min(100, value))
    const animate = () => {
      current = Math.min(current + 1.5, target)
      setDisplay(Math.round(current))
      if (current < target) rafRef.current = requestAnimationFrame(animate)
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  const pct = display
  const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e'
  const label = pct < 40 ? 'Low Match' : pct < 70 ? 'Moderate Match' : 'Strong Match'

  let activeEnd = START_DEG + OFFSET + 0.1; 
  if (pct > 0) {
    activeEnd = Math.max(
      START_DEG + OFFSET + 0.1, 
      START_DEG + (pct / 100) * SWEEP - OFFSET
    );
  }

  const needleRot = (START_DEG + (pct / 100) * SWEEP) 

  const ticks = []
  for (let t = 0; t <= 100; t += 10) {
    const deg = START_DEG + (t / 100) * SWEEP
    const major = t % 20 === 0
    const innerR = R - (major ? 12 : 8)
    const pi = polar(CX, CY, innerR, deg)
    const po = polar(CX, CY, R + 2, deg)
    ticks.push({ pi, po, major, t })
  }
  const labels = ticks.filter(t => t.major)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 260 220" className="w-full max-w-[260px] overflow-visible">
        <defs>
          {/* THE FIX: Added filterUnits and hardcoded a large global area to prevent clipping! */}
          <filter id="glow" filterUnits="userSpaceOnUse" x="-50" y="-50" width="360" height="360">
            <feGaussianBlur stdDeviation="3.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Base Dark Track */}
        <path d={arcPath(CX, CY, R, START_DEG + OFFSET, START_DEG + SWEEP - OFFSET)} fill="none" stroke="#1a1a1a" strokeWidth="14" strokeLinecap="round"/>
        
        {/* Continuous faint background track that perfectly reaches 100 */}
        <path d={arcPath(CX, CY, R, START_DEG + OFFSET, START_DEG + SWEEP - OFFSET)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" opacity="0.12"/>
        
        {/* Active Bright Arc */}
        {pct > 0 && (
          <path d={arcPath(CX, CY, R, START_DEG + OFFSET, activeEnd)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" filter="url(#glow)"/>
        )}

        {/* Ticks */}
        {ticks.map(({pi, po, major, t}) => (
          <line key={t} x1={pi.x} y1={pi.y} x2={po.x} y2={po.y}
            stroke={major ? '#333' : '#222'} strokeWidth={major ? 1.5 : 1}/>
        ))}

        {/* Tick labels */}
        {labels.map(({t}) => {
          const deg = START_DEG + (t/100)*SWEEP
          const pl = polar(CX, CY, R - 22, deg)
          return (
            <text key={t} x={pl.x} y={pl.y+3} textAnchor="middle"
              fontFamily="JetBrains Mono" fontSize="8" fill="#444">{t}</text>
          )
        })}

        {/* Needle */}
        <g>
          <line
            x1={CX} y1={CY} x2={CX} y2={CY - 82}
            stroke="#fff" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${needleRot}, ${CX}, ${CY})`}
          />
          <circle cx={CX} cy={CY} r="8" fill="#111" stroke="#2563EB" strokeWidth="2"/>
          <circle cx={CX} cy={CY} r="3" fill={color}/>
        </g>
      </svg>
      
      <div className="text-center -mt-10">
        <div className="font-mono font-bold leading-none" style={{ fontSize: 48, color, textShadow: `0 0 20px ${color}66` }}>
          {display}<span style={{ fontSize: 22, fontWeight: 400 }}>%</span>
        </div>
        <div className="text-xs font-mono font-bold tracking-[2px] uppercase mt-1" style={{ color: '#888' }}>
          {label}
        </div>
      </div>
    </div>
  )
}