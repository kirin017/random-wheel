import { useRef, useEffect, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useWheelStore, type Prize } from '../store/wheelStore'
import { useSpin } from '../hooks/useSpin'
import { BYT_LOGO_URL } from '../utils/brandAssets'
import { BRAND_COLORS, readableTextForHex } from '../utils/brandPalette'
import { getWheelSegmentEntries } from '../utils/wheelSegments'
import { getPrizeShortName } from '../utils/prizeLabels'

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
  shortName: string
  startAngle: number
  endAngle: number
  cx: number
  cy: number
  r: number
  tooltipAnchor: { x: number; y: number }
  isActive: boolean
  onActivate: (segment: ActiveSegment) => void
  onDeactivate: (segmentKey: string) => void
}

interface ActiveSegment {
  prize: Prize
  segmentKey: string
  displayColor: string
  tooltipAnchor: { x: number; y: number }
}

function Segment({
  prize,
  segmentKey,
  displayColor,
  shortName,
  startAngle,
  endAngle,
  cx,
  cy,
  r,
  tooltipAnchor,
  isActive,
  onActivate,
  onDeactivate,
}: SegmentProps) {
  const [imgErr, setImgErr] = useState(false)
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
  const hasImage = !!prize.image && !imgErr
  const activeSegment = { prize, segmentKey, displayColor: renderedColor, tooltipAnchor }

  function handleKeyDown(event: ReactKeyboardEvent<SVGGElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate(activeSegment)
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${prize.name}. ${prize.quantity > 0 ? `Còn ${prize.quantity} phần` : 'Đã hết quà'}`}
      className="cursor-pointer outline-none"
      onPointerEnter={() => onActivate(activeSegment)}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') onDeactivate(segmentKey)
      }}
      onFocus={() => onActivate(activeSegment)}
      onBlur={() => onDeactivate(segmentKey)}
      onClick={() => onActivate(activeSegment)}
      onKeyDown={handleKeyDown}
    >
      <title>{prize.name}</title>
      {/* Clip path for circular product image badge */}
      {hasImage && (
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
        strokeWidth={isActive ? '5' : '3'}
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
          {shortName}
        </text>
      </g>

      {/* Product image badge or emoji near rim */}
      {hasImage ? (
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
            onError={() => setImgErr(true)}
          />
        </>
      ) : (
        <g className="fallback-badge">
          <circle
            cx={imgPos.x}
            cy={imgPos.y}
            r={imgSize / 2 + 2}
            fill="white"
            opacity="0.92"
          />
          <circle
            cx={imgPos.x}
            cy={imgPos.y}
            r={imgSize / 2}
            fill={BRAND_COLORS.cream}
            opacity="0.85"
          />
          <text
            x={imgPos.x}
            y={imgPos.y + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="800"
            fill={BRAND_COLORS.ink}
            style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}
          >
            {prize.emoji}
          </text>
        </g>
      )}
    </g>
  )
}

function ProductInfoCard({ segment }: { segment: ActiveSegment }) {
  const { prize, displayColor, tooltipAnchor } = segment
  const [imgErr, setImgErr] = useState(false)
  const left = `${(Math.min(Math.max(tooltipAnchor.x, 160), 340) / 500) * 100}%`
  const top = `${(Math.min(Math.max(tooltipAnchor.y, 115), 385) / 500) * 100}%`

  return (
    <div
      className="pointer-events-none absolute z-30 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-brand-line bg-white/95 text-left shadow-[0_18px_40px_rgb(23_35_31_/_0.18)] backdrop-blur-md animate-fade-in"
      style={{ left, top }}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3 p-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-brand-line bg-brand-mint grid place-items-center">
          {prize.image && !imgErr ? (
            <img
              src={prize.image}
              alt={prize.name}
              className="h-full w-full object-cover"
              onError={() => setImgErr(true)}
              decoding="async"
              loading="lazy"
            />
          ) : (
            <span className="text-3xl">{prize.emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-muted">
            Quà từ BYT
          </p>
          <h3 className="mt-0.5 font-display text-base font-extrabold leading-tight text-brand-ink">
            {prize.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-brand-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: displayColor }} />
            <span>{prize.quantity > 0 ? `Còn ${prize.quantity} phần` : 'Đã hết quà'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Wheel() {
  const { prizes, isSpinning } = useWheelStore()
  const wheelShellRef = useRef<HTMLDivElement>(null)
  const wheelGroupRef = useRef<SVGGElement>(null)
  const pointerRef = useRef<SVGGElement>(null)
  const spinButtonRef = useRef<HTMLButtonElement>(null)
  const [activeSegment, setActiveSegment] = useState<ActiveSegment | null>(null)
  const [spinPhase, setSpinPhase] = useState<'idle' | 'launching' | 'spinning' | 'decelerating' | 'settling' | 'spotlight'>('idle')
  const [winningSegmentKey, setWinningSegmentKey] = useState<string | null>(null)
  const [centerBurstKey, setCenterBurstKey] = useState(0)

  const cx = 250
  const cy = 250
  const r = 230

  const available = prizes.filter((p) => p.quantity !== 0)
  const displayEntries = getWheelSegmentEntries(prizes)

  // Equal-sized segments (visual fairness). Win odds are still driven by weight in the spin logic.
  const sweep = displayEntries.length > 0 ? 360 / displayEntries.length : 360
  let currentAngle = 0
  const segments: {
    prize: Prize
    segmentKey: string
    displayColor: string
    shortName: string
    tooltipAnchor: { x: number; y: number }
    start: number
    end: number
  }[] = []
  for (const { prize, segmentKey, displayColor } of displayEntries) {
    const start = currentAngle
    const end = currentAngle + sweep
    const mid = (start + end) / 2
    segments.push({
      prize,
      segmentKey,
      displayColor,
      shortName: getPrizeShortName(prize),
      tooltipAnchor: polarToCartesian(cx, cy, r * 0.68, mid),
      start,
      end,
    })
    currentAngle += sweep
  }

  const { spin, rotationRef } = useSpin({
    wheelRef: wheelGroupRef,
    wheelShellRef,
    pointerRef,
    spinButtonRef,
    segmentCount: segments.length,
    onPhaseChange: setSpinPhase,
    onWinnerSegmentChange: setWinningSegmentKey,
    onCenterBurst: () => setCenterBurstKey((value) => value + 1),
  })

  useEffect(() => {
    if (isSpinning) setActiveSegment(null)
  }, [isSpinning])

  function activateSegment(segment: ActiveSegment) {
    if (!isSpinning) setActiveSegment(segment)
  }

  function deactivateSegment(segmentKey: string) {
    setActiveSegment((current) => current?.segmentKey === segmentKey ? null : current)
  }

  const winningSegment = winningSegmentKey
    ? segments.find((segment) => segment.segmentKey === winningSegmentKey)
    : null

  return (
    <div className="relative flex flex-col items-center gap-4 sm:gap-6">
      <div ref={wheelShellRef} className="relative wheel-shell">
        <div
          className={`absolute inset-0 rounded-full ${isSpinning ? 'pulse-ring' : ''}`}
          style={{ background: 'radial-gradient(circle, rgba(21,94,59,0.18) 0%, transparent 70%)' }}
        />
        <div className={`pointer-events-none absolute inset-0 overflow-hidden rounded-full wheel-light-sweep ${spinPhase !== 'idle' ? 'is-active' : ''}`} />
        {centerBurstKey > 0 && (
          <div key={centerBurstKey} className="pointer-events-none absolute inset-0 center-burst">
            {Array.from({ length: 10 }).map((_, index) => (
              <span
                key={index}
                style={{
                  '--burst-angle': `${index * 36}deg`,
                  '--burst-color': index % 2 === 0 ? BRAND_COLORS.citrus : BRAND_COLORS.leaf,
                } as CSSProperties}
              />
            ))}
          </div>
        )}

        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          className="wheel-shadow max-w-[min(82vw,500px)] sm:max-w-[min(90vw,500px)]"
        >
          {/* Outer decorative rim */}
          <circle cx={cx} cy={cy} r={r + 14} fill={BRAND_COLORS.cream} stroke={BRAND_COLORS.line} strokeWidth="3" />
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={BRAND_COLORS.forest} strokeWidth="4" opacity="0.5" />

          {/* Wheel group — rotates around cx,cy */}
          <g ref={wheelGroupRef}>
            {segments.map(({ prize, segmentKey, displayColor, shortName, tooltipAnchor, start, end }) => (
              <Segment
                key={segmentKey}
                prize={prize}
                segmentKey={segmentKey}
                displayColor={displayColor}
                shortName={shortName}
                tooltipAnchor={tooltipAnchor}
                startAngle={start}
                endAngle={end}
                cx={cx}
                cy={cy}
                r={r}
                isActive={activeSegment?.segmentKey === segmentKey}
                onActivate={activateSegment}
                onDeactivate={deactivateSegment}
              />
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

          {winningSegment && (
            <path
              className="winner-segment-glow"
              d={buildSegmentPath(cx, cy, r, winningSegment.start, winningSegment.end)}
              fill="none"
              stroke={winningSegment.displayColor}
              strokeWidth="8"
              transform={`rotate(${rotationRef.current} ${cx} ${cy})`}
              style={{ color: winningSegment.displayColor, opacity: 1 }}
            />
          )}

          {/* Pointer (top, fixed) */}
          <g ref={pointerRef}>
            <polygon
              points={`${cx - 13},${cy - r - 6} ${cx + 13},${cy - r - 6} ${cx},${cy - r + 22}`}
              fill={BRAND_COLORS.tomato}
              stroke={BRAND_COLORS.cream}
              strokeWidth="3"
              filter="drop-shadow(0 3px 5px rgba(23,35,31,0.35))"
            />
            <circle cx={cx} cy={cy - r - 6} r="9" fill={BRAND_COLORS.tomatoDark} stroke={BRAND_COLORS.cream} strokeWidth="3" />
          </g>
        </svg>
        {activeSegment && <ProductInfoCard segment={activeSegment} />}
      </div>

      {/* Spin button */}
      <button
        ref={spinButtonRef}
        onClick={spin}
        disabled={isSpinning || available.length === 0}
        className={`
          relative px-9 py-3.5 sm:px-11 sm:py-4 rounded-full font-display text-lg sm:text-xl font-extrabold tracking-wide
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
