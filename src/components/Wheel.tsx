import { useRef, useEffect } from 'react'
import { useWheelStore, type Prize } from '../store/wheelStore'
import { useSpin } from '../hooks/useSpin'

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function buildSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polarToCartesian(cx, cy, r, startAngle)
  const e = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y} Z`
}

interface SegmentProps {
  prize: Prize
  startAngle: number
  endAngle: number
  cx: number
  cy: number
  r: number
}

function Segment({ prize, startAngle, endAngle, cx, cy, r }: SegmentProps) {
  const mid = (startAngle + endAngle) / 2
  const textR = r * 0.65
  const textPos = polarToCartesian(cx, cy, textR, mid)
  const emojiR = r * 0.82
  const emojiPos = polarToCartesian(cx, cy, emojiR, mid)
  const textAngle = mid - 90

  return (
    <g>
      <path
        d={buildSegmentPath(cx, cy, r, startAngle, endAngle)}
        fill={prize.quantity === 0 ? '#374151' : prize.color}
        stroke="#1f2937"
        strokeWidth="2"
        opacity={prize.quantity === 0 ? 0.4 : 1}
      />
      {/* Segment label */}
      <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textAngle})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={endAngle - startAngle > 30 ? '11' : '8'}
          fontWeight="700"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
        >
          {prize.name.length > 12 ? prize.name.slice(0, 11) + '…' : prize.name}
        </text>
      </g>
      {/* Emoji near rim */}
      <g transform={`translate(${emojiPos.x}, ${emojiPos.y}) rotate(${textAngle})`}>
        <text textAnchor="middle" dominantBaseline="middle" fontSize="14">
          {prize.emoji}
        </text>
      </g>
    </g>
  )
}

export default function Wheel() {
  const { prizes, isSpinning } = useWheelStore()
  const wheelGroupRef = useRef<SVGGElement>(null)
  const { spin } = useSpin(wheelGroupRef)

  const cx = 250
  const cy = 250
  const r = 230

  const available = prizes.filter((p) => p.quantity !== 0)
  const displayPrizes = available.length > 0 ? available : prizes
  const totalWeight = displayPrizes.reduce((s, p) => s + p.weight, 0)

  let currentAngle = 0
  const segments: { prize: Prize; start: number; end: number }[] = []
  for (const prize of displayPrizes) {
    const sweep = (prize.weight / totalWeight) * 360
    segments.push({ prize, start: currentAngle, end: currentAngle + sweep })
    currentAngle += sweep
  }

  // Reset wheel CSS when not spinning (no transition on init)
  useEffect(() => {
    const el = wheelGroupRef.current
    if (!el || isSpinning) return
    // Keep current transform but remove transition on next tick
    const id = setTimeout(() => {
      if (el) el.style.transition = 'none'
    }, 50)
    return () => clearTimeout(id)
  }, [isSpinning])

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Outer glow ring */}
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-full ${isSpinning ? 'pulse-ring' : ''}`}
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }}
        />

        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          className="wheel-shadow max-w-[min(90vw,500px)]"
        >
          {/* Outer decorative ring */}
          <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke="#f59e0b" strokeWidth="6" opacity="0.6" />
          <circle cx={cx} cy={cy} r={r + 18} fill="none" stroke="#d97706" strokeWidth="2" opacity="0.3" />

          {/* Wheel segments */}
          <g ref={wheelGroupRef} style={{ transformOrigin: `${cx}px ${cy}px` }}>
            {segments.map(({ prize, start, end }) => (
              <Segment key={prize.id} prize={prize} startAngle={start} endAngle={end} cx={cx} cy={cy} r={r} />
            ))}
            {/* Center circle */}
            <circle cx={cx} cy={cy} r={28} fill="#1f2937" stroke="#f59e0b" strokeWidth="4" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="20">
              🎡
            </text>
          </g>

          {/* Pointer (top, fixed) */}
          <polygon
            points={`${cx - 14},${cy - r - 8} ${cx + 14},${cy - r - 8} ${cx},${cy - r + 20}`}
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth="2"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          />
          <polygon
            points={`${cx - 14},${cy - r - 8} ${cx + 14},${cy - r - 8} ${cx},${cy - r - 30}`}
            fill="#ef4444"
            stroke="#dc2626"
            strokeWidth="2"
            filter="drop-shadow(0 -2px 4px rgba(0,0,0,0.5))"
          />
        </svg>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning || available.length === 0}
        className={`
          relative px-12 py-4 rounded-full text-xl font-black tracking-wide uppercase
          transition-all duration-200 select-none
          ${isSpinning || available.length === 0
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 hover:from-amber-300 hover:to-orange-400 hover:scale-105 active:scale-95 glow-gold cursor-pointer'
          }
        `}
      >
        {isSpinning ? (
          <span className="flex items-center gap-2">
            <span className="inline-block animate-spin">🎡</span> Đang quay…
          </span>
        ) : available.length === 0 ? (
          '🎉 Hết giải thưởng!'
        ) : (
          '🎰 QUAY NGAY!'
        )}
      </button>
    </div>
  )
}
