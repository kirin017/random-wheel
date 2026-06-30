import { useRef, useEffect } from 'react'
import { useWheelStore, type Prize } from '../store/wheelStore'
import { useSpin } from '../hooks/useSpin'
import { BYT_LOGO_URL } from '../utils/brandAssets'
import { BRAND_COLORS, readableTextForHex } from '../utils/brandPalette'
import { getWheelSegmentEntries } from '../utils/wheelSegments'

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
  segmentKey: string
  displayColor: string
  startAngle: number
  endAngle: number
  cx: number
  cy: number
  r: number
}

function Segment({ prize, segmentKey, displayColor, startAngle, endAngle, cx, cy, r }: SegmentProps) {
  const mid = (startAngle + endAngle) / 2
  const segSpan = endAngle - startAngle
  const textR = r * 0.62
  const textPos = polarToCartesian(cx, cy, textR, mid)
  const imgR = r * 0.83
  const imgPos = polarToCartesian(cx, cy, imgR, mid)
  const textAngle = mid - 90
  const clipId = `img-clip-${segmentKey}`
  const imgSize = 22
  const renderedColor = prize.quantity === 0 ? BRAND_COLORS.line : displayColor
  const labelColor = prize.quantity === 0 ? BRAND_COLORS.muted : readableTextForHex(renderedColor)
  const labelShadow = labelColor === BRAND_COLORS.surface ? '0 1px 2px rgba(23,35,31,0.45)' : 'none'

  return (
    <g>
      {/* Clip path for circular product image badge */}
      {prize.image && (
        <defs>
          <clipPath id={clipId}>
            <circle cx={imgPos.x} cy={imgPos.y} r={imgSize / 2} />
          </clipPath>
        </defs>
      )}

      <path
        d={buildSegmentPath(cx, cy, r, startAngle, endAngle)}
        fill={renderedColor}
        stroke={BRAND_COLORS.cream}
        strokeWidth="3"
        opacity={prize.quantity === 0 ? 0.55 : 1}
      />

      {/* Segment label */}
      <g transform={`translate(${textPos.x}, ${textPos.y}) rotate(${textAngle})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={labelColor}
          fontSize={segSpan > 30 ? '11' : '8'}
          fontWeight="700"
          style={{ fontFamily: '"Be Vietnam Pro", sans-serif', textShadow: labelShadow }}
        >
          {prize.name.length > 12 ? prize.name.slice(0, 11) + '…' : prize.name}
        </text>
      </g>

      {/* Product image badge or emoji near rim */}
      {prize.image ? (
        <>
          <circle
            cx={imgPos.x}
            cy={imgPos.y}
            r={imgSize / 2 + 2}
            fill="white"
            opacity="0.92"
          />
          <image
            href={prize.image}
            x={imgPos.x - imgSize / 2}
            y={imgPos.y - imgSize / 2}
            width={imgSize}
            height={imgSize}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <g transform={`translate(${imgPos.x}, ${imgPos.y}) rotate(${textAngle})`}>
          <text textAnchor="middle" dominantBaseline="middle" fontSize="14">
            {prize.emoji}
          </text>
        </g>
      )}
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
  const displayEntries = getWheelSegmentEntries(prizes)

  // Equal-sized segments (visual fairness). Win odds are still driven by weight in the spin logic.
  const sweep = displayEntries.length > 0 ? 360 / displayEntries.length : 360
  let currentAngle = 0
  const segments: { prize: Prize; segmentKey: string; displayColor: string; start: number; end: number }[] = []
  for (const { prize, segmentKey, displayColor } of displayEntries) {
    segments.push({ prize, segmentKey, displayColor, start: currentAngle, end: currentAngle + sweep })
    currentAngle += sweep
  }

  useEffect(() => {
    const el = wheelGroupRef.current
    if (!el || isSpinning) return
    const id = setTimeout(() => {
      if (el) el.style.transition = 'none'
    }, 50)
    return () => clearTimeout(id)
  }, [isSpinning])

  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative">
        <div
          className={`absolute inset-0 rounded-full ${isSpinning ? 'pulse-ring' : ''}`}
          style={{ background: 'radial-gradient(circle, rgba(21,94,59,0.18) 0%, transparent 70%)' }}
        />

        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          className="wheel-shadow max-w-[min(90vw,500px)]"
        >
          {/* Outer decorative rim */}
          <circle cx={cx} cy={cy} r={r + 14} fill={BRAND_COLORS.cream} stroke={BRAND_COLORS.line} strokeWidth="3" />
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={BRAND_COLORS.forest} strokeWidth="4" opacity="0.5" />

          {/* Wheel group — rotates around cx,cy */}
          <g ref={wheelGroupRef} style={{ transformOrigin: `${cx}px ${cy}px` }}>
            {segments.map(({ prize, segmentKey, displayColor, start, end }) => (
              <Segment key={segmentKey} prize={prize} segmentKey={segmentKey} displayColor={displayColor} startAngle={start} endAngle={end} cx={cx} cy={cy} r={r} />
            ))}

            {/* Center hub with BYT logo */}
            <defs>
              <clipPath id="hub-clip">
                <circle cx={cx} cy={cy} r={34} />
              </clipPath>
            </defs>
            <circle cx={cx} cy={cy} r={40} fill="white" stroke={BRAND_COLORS.cream} strokeWidth="5" />
            <circle cx={cx} cy={cy} r={40} fill={BRAND_COLORS.forest} stroke={BRAND_COLORS.cream} strokeWidth="5" opacity="0.15" />
            <image
              href={BYT_LOGO_URL}
              x={cx - 34}
              y={cy - 34}
              width="68"
              height="68"
              clipPath="url(#hub-clip)"
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Fallback ring in case image doesn't load */}
            <circle cx={cx} cy={cy} r={40} fill="none" stroke={BRAND_COLORS.forest} strokeWidth="2.5" opacity="0.4" />
          </g>

          {/* Pointer (top, fixed) */}
          <polygon
            points={`${cx - 13},${cy - r - 6} ${cx + 13},${cy - r - 6} ${cx},${cy - r + 22}`}
            fill={BRAND_COLORS.tomato}
            stroke={BRAND_COLORS.cream}
            strokeWidth="3"
            filter="drop-shadow(0 3px 5px rgba(23,35,31,0.35))"
          />
          <circle cx={cx} cy={cy - r - 6} r="9" fill={BRAND_COLORS.tomatoDark} stroke={BRAND_COLORS.cream} strokeWidth="3" />
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
            : 'bg-brand-tomato text-white shadow-lift hover:bg-clay-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer'
          }
        `}
      >
        {isSpinning ? 'Đang quay…' : available.length === 0 ? 'Đã trao hết quà' : 'Quay ngay'}
      </button>
    </div>
  )
}
