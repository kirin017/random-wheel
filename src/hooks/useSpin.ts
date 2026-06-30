import { useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useWheelStore } from '../store/wheelStore'
import { pickWeightedPrize, calcTargetAngle } from '../utils/spin'
import { BRAND_COLORS } from '../utils/brandPalette'

export function useSpin(wheelRef: React.RefObject<SVGGElement | null>) {
  const rotationRef = useRef(0)
  const {
    prizes,
    isSpinning,
    setIsSpinning,
    setCurrentWinner,
    setShowWinnerOverlay,
    soundEnabled,
  } = useWheelStore()

  const playSound = useCallback(
    (type: 'spin' | 'win') => {
      if (!soundEnabled) return
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

      if (type === 'spin') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
      } else {
        // Win fanfare
        const notes = [523, 659, 784, 1047]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = freq
          osc.type = 'sine'
          gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
          osc.start(ctx.currentTime + i * 0.12)
          osc.stop(ctx.currentTime + i * 0.12 + 0.35)
        })
      }
    },
    [soundEnabled],
  )

  const spin = useCallback(() => {
    if (isSpinning) return
    const available = prizes.filter((p) => p.quantity !== 0)
    if (available.length === 0) return

    const winner = pickWeightedPrize(prizes)
    if (!winner) return

    const spinDuration = 5000 + Math.random() * 2000
    const targetAngle = calcTargetAngle(prizes, winner, rotationRef.current)

    setIsSpinning(true)
    playSound('spin')

    const el = wheelRef.current
    if (el) {
      el.style.transition = `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
      el.style.transform = `rotate(${targetAngle}deg)`
    }

    rotationRef.current = targetAngle

    setTimeout(() => {
      setIsSpinning(false)
      setCurrentWinner(winner)
      setShowWinnerOverlay(true)
      // Lead capture + inventory decrement happen when the guest claims the prize (WinnerOverlay).
      playSound('win')

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: [winner.color, BRAND_COLORS.citrus, BRAND_COLORS.surface, BRAND_COLORS.tomato, BRAND_COLORS.leaf],
      })
    }, spinDuration)
  }, [isSpinning, prizes, wheelRef, setIsSpinning, setCurrentWinner, setShowWinnerOverlay, playSound])

  return { spin, rotationRef }
}
