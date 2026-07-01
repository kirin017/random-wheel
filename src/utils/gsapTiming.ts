import { gsap } from 'gsap'

let configured = false

export function configureGsapRealTimeTicker(): void {
  if (configured) return
  gsap.ticker.lagSmoothing(0)
  configured = true
}
