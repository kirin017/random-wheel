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

type SpinPhase = 'idle' | 'launching' | 'spinning' | 'decelerating' | 'settling' | 'spotlight'

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
    if (wheel) gsap.set(wheel, { filter: 'blur(0px)' })
    if (shell) gsap.set(shell, { scale: 1 })
    if (pointer) gsap.set(pointer, { rotation: 0 })
    pointerTweenRef.current?.kill()
    pointerTweenRef.current = null
    lastSegmentRef.current = null
  }, [pointerRef, wheelRef, wheelShellRef])

  const tickPointer = useCallback(() => {
    const pointer = pointerRef.current
    if (!pointer) return
    pointerTweenRef.current?.kill()
    pointerTweenRef.current = gsap.timeline()
      .to(pointer, { rotation: -8, duration: 0.045, ease: 'power2.out' })
      .to(pointer, { rotation: 10, duration: 0.055, ease: 'power2.out' })
      .to(pointer, { rotation: 0, duration: 0.12, ease: 'power2.out' })
  }, [pointerRef])

  const updateRotation = useCallback((rotation: number) => {
    const wheel = wheelRef.current
    if (!wheel) return
    rotationRef.current = rotation
    gsap.set(wheel, { rotation })

    if (segmentCount <= 0) return
    const segmentIndex = getPointerSegmentIndex(rotation, segmentCount)
    if (lastSegmentRef.current === null) {
      lastSegmentRef.current = segmentIndex
      return
    }
    if (segmentIndex !== lastSegmentRef.current) {
      lastSegmentRef.current = segmentIndex
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
    const targetAngle = calcTargetAngle(prizes, winner, rotationRef.current)
    const winnerSegmentKey = getWinnerSegmentKey(prizes, winner, targetAngle)
    const startRotation = rotationRef.current
    const mainDuration = reducedMotion ? 2.1 : 5.4 + Math.random() * 0.8
    const preSettleAngle = reducedMotion ? targetAngle : targetAngle - 7
    const rotationState = { value: startRotation }

    timelineRef.current?.kill()
    cleanupVisuals()
    setIsSpinning(true)
    setCurrentWinner(null)
    setShowWinnerOverlay(false)
    onWinnerSegmentChange(null)
    onPhaseChange('launching')
    vibratePress()
    playSpinSound('press', soundEnabled)
    if (!reducedMotion) onCenterBurst()

    const timeline = gsap.timeline({
      onComplete: () => {
        rotationRef.current = targetAngle
        cleanupVisuals()
        onPhaseChange('spotlight')
        onWinnerSegmentChange(winnerSegmentKey)
        setIsSpinning(false)
        setCurrentWinner(winner)
        setShowWinnerOverlay(true)
        playSpinSound('win', soundEnabled)
        vibrateWin()
      },
    })

    timelineRef.current = timeline
    gsap.set(wheel, { transformOrigin: '250px 250px', filter: 'blur(0px)', rotation: startRotation })
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
      pointerTweenRef.current?.kill()
      stopSpinSounds()
      unloadSpinSounds()
    }
  }, [])

  return { spin, rotationRef }
}
