export default function Panel({ children, className = '' }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#0e0e0e', border: '1px solid #2a2a2a' }}>
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #1e3a5f, transparent)' }}/>
      <div className="p-6 md:p-7">{children}</div>
    </div>
  )
}

export function PanelLabel({ children }) {
  return (
    <div className="text-[10px] font-mono font-bold tracking-[2.5px] uppercase text-[#444] mb-4">
      {children}
    </div>
  )
}
