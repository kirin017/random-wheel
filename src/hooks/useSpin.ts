import { useRef, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { useWheelStore } from '../store/wheelStore'
import {
  pickWeightedPrize,
  calcTargetAngle,
  getPointerSegmentIndex,
  getWinnerSegmentKey,
} from '../utils/spin'
import { playSpinSound, stopSpinSounds, unloadSpinSounds } from '../utils/soundEffects'
import { vibratePress, vibrateTick, vibrateWin } from '../utils/haptics'
import { prefersReducedMotion } from '../utils/reducedMotion'
import { configureGsapRealTimeTicker } from '../utils/gsapTiming'

type SpinPhase = 'idle' | 'launching' | 'spinning' | 'decelerating' | 'settling' | 'spotlight'

const VISUAL_TICK_THROTTLE_MS = 80
const WINNER_GLOW_PAUSE_SECONDS = 0.75
const REDUCED_MOTION_WINNER_GLOW_PAUSE_SECONDS = 0.2
const WHEEL_SVG_ORIGIN = '250 250'
const POINTER_SVG_ORIGIN = '250 14'

function getNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}

function normalizeDegrees(rotation: number): number {
  return ((rotation % 360) + 360) % 360
}

function shortestTargetAngle(currentRotation: number, targetRotation: number): number {
  const current = normalizeDegrees(currentRotation)
  const target = normalizeDegrees(targetRotation)
  let delta = target - current

  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360

  return currentRotation + delta
}

interface UseSpinOptions {
  wheelRef: RefObject<SVGGElement | null>
  wheelShellRef: RefObject<HTMLDivElement | null>
  pointerRef: RefObject<SVGGElement | null>
  spinButtonRef: RefObject<HTMLButtonElement | null>
  segmentCount: number
  onPhaseChange: (phase: SpinPhase) => void
  onWinnerSegmentChange: (segmentKey: string | null) => void
  onCenterBurst: () => void
}

export function useSpin({
  wheelRef,
  wheelShellRef,
  pointerRef,
  spinButtonRef,
  segmentCount,
  onPhaseChange,
  onWinnerSegmentChange,
  onCenterBurst,
}: UseSpinOptions) {
  const rotationRef = useRef(0)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const pointerTweenRef = useRef<gsap.core.Timeline | null>(null)
  const lastSegmentRef = useRef<number | null>(null)
  const lastPointerTickAtRef = useRef(Number.NEGATIVE_INFINITY)
  const tickEffectsEnabledRef = useRef(true)
  const {
    prizes,
    isSpinning,
    setIsSpinning,
    setCurrentWinner,
    setShowWinnerOverlay,
    soundEnabled,
  } = useWheelStore()

  const cleanupVisuals = useCallback(() => {
    const wheel = wheelRef.current
    const shell = wheelShellRef.current
    const pointer = pointerRef.current
    if (wheel) gsap.set(wheel, { filter: 'blur(0px)', svgOrigin: WHEEL_SVG_ORIGIN })
    if (shell) gsap.set(shell, { scale: 1 })
    if (pointer) gsap.set(pointer, { rotation: 0, svgOrigin: POINTER_SVG_ORIGIN })
    pointerTweenRef.current?.kill()
    pointerTweenRef.current = null
    lastSegmentRef.current = null
    lastPointerTickAtRef.current = Number.NEGATIVE_INFINITY
  }, [pointerRef, wheelRef, wheelShellRef])

  const tickPointer = useCallback(() => {
    const pointer = pointerRef.current
    if (!pointer) return
    if (!tickEffectsEnabledRef.current) return

    const now = getNow()
    if (now - lastPointerTickAtRef.current < VISUAL_TICK_THROTTLE_MS) return
    lastPointerTickAtRef.current = now

    pointerTweenRef.current?.kill()
    pointerTweenRef.current = gsap.timeline()
      .to(pointer, { rotation: -8, svgOrigin: POINTER_SVG_ORIGIN, duration: 0.045, ease: 'power2.out' })
      .to(pointer, { rotation: 10, svgOrigin: POINTER_SVG_ORIGIN, duration: 0.055, ease: 'power2.out' })
      .to(pointer, { rotation: 0, svgOrigin: POINTER_SVG_ORIGIN, duration: 0.12, ease: 'power2.out' })
  }, [pointerRef])

  const updateRotation = useCallback((rotation: number) => {
    const wheel = wheelRef.current
    if (!wheel) return
    rotationRef.current = rotation
    gsap.set(wheel, { rotation, svgOrigin: WHEEL_SVG_ORIGIN })

    if (segmentCount <= 0) return
    const segmentIndex = getPointerSegmentIndex(rotation, segmentCount)
    if (lastSegmentRef.current === null) {
      lastSegmentRef.current = segmentIndex
      return
    }
    if (segmentIndex !== lastSegmentRef.current) {
      lastSegmentRef.current = segmentIndex
      if (!tickEffectsEnabledRef.current) return
      tickPointer()
      playSpinSound('tick', soundEnabled)
      vibrateTick()
    }
  }, [segmentCount, soundEnabled, tickPointer, wheelRef])

  const spin = useCallback(() => {
    if (isSpinning || timelineRef.current?.isActive()) return
    const available = prizes.filter((p) => p.quantity !== 0)
    if (available.length === 0) return

    const winner = pickWeightedPrize(prizes)
    if (!winner) return

    const wheel = wheelRef.current
    const shell = wheelShellRef.current
    if (!wheel || !shell) return

    const reducedMotion = prefersReducedMotion()
    const normalTargetAngle = calcTargetAngle(prizes, winner, rotationRef.current)
    const targetAngle = reducedMotion
      ? shortestTargetAngle(rotationRef.current, normalTargetAngle)
      : normalTargetAngle
    const winnerSegmentKey = getWinnerSegmentKey(prizes, winner, targetAngle)
    const startRotation = rotationRef.current
    const mainDuration = reducedMotion ? 2.1 : 5.4 + Math.random() * 0.8
    const preSettleAngle = reducedMotion ? targetAngle : targetAngle - 7
    const rotationState = { value: startRotation }

    timelineRef.current?.kill()
    configureGsapRealTimeTicker()
    cleanupVisuals()
    tickEffectsEnabledRef.current = !reducedMotion
    setIsSpinning(true)
    setCurrentWinner(null)
    setShowWinnerOverlay(false)
    onWinnerSegmentChange(null)
    onPhaseChange('launching')
    vibratePress()
    playSpinSound('press', soundEnabled)
    if (!reducedMotion) onCenterBurst()

    const timeline = gsap.timeline()

    timelineRef.current = timeline
    gsap.set(wheel, { svgOrigin: WHEEL_SVG_ORIGIN, filter: 'blur(0px)', rotation: startRotation })
    gsap.set(shell, { scale: 1 })

    if (spinButtonRef.current && !reducedMotion) {
      timeline.to(spinButtonRef.current, { scale: 0.96, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' }, 0)
    }

    if (!reducedMotion) {
      timeline
        .to(wheel, { filter: 'blur(7px)', duration: 0.35, ease: 'power2.out' }, 0.18)
        .to(wheel, { filter: 'blur(0px)', duration: 2.4, ease: 'power2.out' }, Math.max(0.8, mainDuration - 2.4))
        .to(shell, { scale: 1.055, duration: 0.6, ease: 'power2.out' }, Math.max(0.2, mainDuration - 0.75))
    }

    timeline
      .call(() => onPhaseChange('spinning'), undefined, 0.6)
      .call(() => onPhaseChange('decelerating'), undefined, Math.max(0.8, mainDuration - 2.2))
      .to(rotationState, {
        value: preSettleAngle,
        duration: mainDuration,
        ease: reducedMotion ? 'power2.out' : 'power4.out',
        onUpdate: () => updateRotation(rotationState.value),
      }, 0)
      .call(() => onPhaseChange('settling'))
      .to(rotationState, {
        value: targetAngle,
        duration: reducedMotion ? 0.18 : 0.42,
        ease: reducedMotion ? 'power1.out' : 'back.out(1.18)',
        onUpdate: () => updateRotation(rotationState.value),
      })
      .to(shell, { scale: 1, duration: reducedMotion ? 0.01 : 0.32, ease: 'power2.out' }, '<')
      .call(() => {
        rotationRef.current = targetAngle
        gsap.set(wheel, { rotation: targetAngle, svgOrigin: WHEEL_SVG_ORIGIN })
        cleanupVisuals()
        onPhaseChange('spotlight')
        onWinnerSegmentChange(winnerSegmentKey)
        playSpinSound('win', soundEnabled)
        vibrateWin()
      })
      .to({}, { duration: reducedMotion ? REDUCED_MOTION_WINNER_GLOW_PAUSE_SECONDS : WINNER_GLOW_PAUSE_SECONDS })
      .call(() => {
        setCurrentWinner(winner)
        setShowWinnerOverlay(true)
        setIsSpinning(false)
        onWinnerSegmentChange(null)
        onPhaseChange('idle')
        tickEffectsEnabledRef.current = true
        timelineRef.current = null
      })
  }, [
    cleanupVisuals,
    isSpinning,
    onCenterBurst,
    onPhaseChange,
    onWinnerSegmentChange,
    prizes,
    segmentCount,
    setCurrentWinner,
    setIsSpinning,
    setShowWinnerOverlay,
    soundEnabled,
    spinButtonRef,
    updateRotation,
    wheelRef,
    wheelShellRef,
  ])

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
      timelineRef.current = null
      cleanupVisuals()
      tickEffectsEnabledRef.current = true
      stopSpinSounds()
      unloadSpinSounds()
      setIsSpinning(false)
      onPhaseChange('idle')
      onWinnerSegmentChange(null)
    }
  }, [cleanupVisuals, onPhaseChange, onWinnerSegmentChange, setIsSpinning])

  return { spin, rotationRef }
}
