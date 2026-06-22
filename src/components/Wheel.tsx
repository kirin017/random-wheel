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
        fill={prize.quantity === 0 ? '#d8cdba' : prize.color}
        stroke="#fdfaf3"
        strokeWidth="3"
        opacity={prize.quantity === 0 ? 0.55 : 1}
      />
      {/* Segment label */}
      <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textAngle})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={endAngle - startAngle > 30 ? '11' : '8'}
          fontWeight="700"
          style={{ fontFamily: '"Be Vietnam Pro", sans-serif', textShadow: '0 1px 2px rgba(47,38,32,0.45)' }}
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
          style={{ background: 'radial-gradient(circle, rgba(95,138,108,0.18) 0%, transparent 70%)' }}
        />

        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          className="wheel-shadow max-w-[min(90vw,500px)]"
        >
          {/* Outer decorative ring (warm cream rim) */}
          <circle cx={cx} cy={cy} r={r + 14} fill="#fdfaf3" stroke="#ecdfc4" strokeWidth="3" />
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#5f8a6c" strokeWidth="4" opacity="0.45" />

          {/* Wheel segments */}
          <g ref={wheelGroupRef} style={{ transformOrigin: `${cx}px ${cy}px` }}>
            {segments.map(({ prize, start, end }) => (
              <Segment key={prize.id} prize={prize} startAngle={start} endAngle={end} cx={cx} cy={cy} r={r} />
            ))}
            {/* Center hub */}
            <circle cx={cx} cy={cy} r={30} fill="#4c7257" stroke="#fdfaf3" strokeWidth="5" />
            <text
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
              fontWeight="800"
              fill="#fdfaf3"
              style={{ fontFamily: '"Baloo 2", sans-serif' }}
            >
              BYT
            </text>
          </g>

          {/* Pointer (top, fixed) — terracotta */}
          <polygon
            points={`${cx - 13},${cy - r - 6} ${cx + 13},${cy - r - 6} ${cx},${cy - r + 22}`}
            fill="#b66639"
            stroke="#fdfaf3"
            strokeWidth="3"
            filter="drop-shadow(0 3px 5px rgba(71,59,48,0.35))"
          />
          <circle cx={cx} cy={cy - r - 6} r="9" fill="#cd7c4d" stroke="#fdfaf3" strokeWidth="3" />
        </svg>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning || available.length === 0}
        className={`
          relative px-11 py-4 rounded-full font-display text-xl font-extrabold tracking-wide
          transition-all duration-200 select-none
          ${isSpinning || available.length === 0
            ? 'bg-cream-300 text-cocoa-500/70 cursor-not-allowed'
            : 'bg-sage-600 text-cream-50 shadow-lift hover:bg-sage-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer'
          }
        `}
      >
        {isSpinning ? 'Đang quay…' : available.length === 0 ? 'Đã trao hết quà' : 'Quay ngay'}
      </button>
    </div>
  )
}
