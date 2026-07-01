let lastTickAt = 0

function getNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(pattern)
}

export function vibratePress(): void {
  vibrate(10)
}

export function vibrateTick(now = getNow()): void {
  if (now - lastTickAt < 120) return
  lastTickAt = now
  vibrate(8)
}

export function vibrateWin(): void {
  vibrate([18, 35, 22])
}
