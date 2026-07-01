import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { gsap } from 'gsap'
import type { Prize } from '../store/wheelStore'
import { BRAND_COLORS } from '../utils/brandPalette'
import { prefersReducedMotion } from '../utils/reducedMotion'
import ParticleField from './ParticleField'

interface ProductSpotlightRevealProps {
  winner: Prize
  onDone: () => void
}

export default function ProductSpotlightReveal({ winner, onDone }: ProductSpotlightRevealProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const productRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  const [imgErr, setImgErr] = useState(false)
  const reducedMotion = prefersReducedMotion()
  const hasImage = !!winner.image && !imgErr

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const product = productRef.current
    const glow = glowRef.current
    const totalDuration = reducedMotion ? 0.9 : 2.85

    const timeline = gsap.timeline()

    if (overlay) {
      timeline.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: reducedMotion ? 0.08 : 0.22, ease: 'power2.out' }, 0)
    }
    if (product) {
      if (reducedMotion) {
        timeline.fromTo(product, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 0.08)
      } else {
        timeline.fromTo(
          product,
          { scale: 0.78, y: 18, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.82, ease: 'back.out(1.28)' },
          0.18,
        )
      }
    }
    if (glow) {
      if (reducedMotion) {
        timeline.fromTo(glow, { opacity: 0 }, { opacity: 0.36, duration: 0.12, ease: 'power1.out' }, 0.12)
      } else {
        timeline.fromTo(
          glow,
          { scale: 0.72, opacity: 0 },
          { scale: 1.14, opacity: 0.72, duration: 1.25, ease: 'power2.out' },
          0.22,
        )
      }
    }

    if (!reducedMotion) {
      timeline.call(() => {
        confetti({
          particleCount: 120,
          spread: 68,
          origin: { y: 0.54 },
          scalar: 0.9,
          colors: [winner.color, BRAND_COLORS.citrus, BRAND_COLORS.surface, BRAND_COLORS.tomato, BRAND_COLORS.leaf],
        })
      }, undefined, 0.95)
    }

    timeline.call(() => {
      doneRef.current()
    }, undefined, totalDuration)

    return () => {
      timeline.kill()
    }
  }, [reducedMotion, winner.color, winner.id])

  return (
    <div ref={overlayRef} className="relative min-h-[430px] overflow-hidden bg-brand-ink text-center text-brand-cream">
      <ParticleField
        id={`winner-particles-${winner.id}`}
        active={!reducedMotion}
        colors={[winner.color, BRAND_COLORS.citrus, BRAND_COLORS.leaf, BRAND_COLORS.surface]}
        density={20}
      />
      <div ref={glowRef} className="absolute left-1/2 top-[42%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" style={{ background: `${winner.color}80` }} />
      <div className="relative z-10 flex min-h-[430px] flex-col items-center justify-center px-7 py-9">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-cream/72">
          Phần quà của bạn
        </p>
        <div
          ref={productRef}
          className="relative grid h-52 w-52 place-items-center overflow-hidden rounded-[2rem] border border-brand-cream/24 bg-brand-cream/95 shadow-[0_28px_70px_rgb(0_0_0_/_0.32)]"
        >
          {hasImage ? (
            <img
              src={winner.image}
              alt={winner.name}
              className="h-full w-full object-cover"
              onError={() => setImgErr(true)}
              decoding="async"
            />
          ) : (
            <span className="text-7xl">{winner.emoji}</span>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(to top, ${winner.color}cc, transparent)` }} />
        </div>
        <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-brand-cream">
          {winner.name}
        </h2>
        <div className="mt-4 h-1.5 w-24 rounded-full" style={{ background: winner.color }} />
      </div>
    </div>
  )
}
