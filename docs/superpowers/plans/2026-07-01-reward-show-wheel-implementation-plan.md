# Reward Show Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the prize wheel with GSAP-driven weighted motion, pointer ticks, subtle sound/haptics, winning glow, and a 2.5-3.5 second Product Spotlight reveal without changing prize fairness or the current claim flow.

**Architecture:** Keep prize selection in `src/utils/spin.ts` and UI orchestration in `src/hooks/useSpin.ts`. `Wheel.tsx` owns refs and transient visual state; `ProductSpotlightReveal.tsx` owns the post-spin reveal before the existing form. Audio, haptics, reduced-motion checks, and particles live behind small helpers/components.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, GSAP, Howler.js, @tsparticles/react with @tsparticles/slim, canvas-confetti.

---

## File Structure

- Modify `package.json` and `package-lock.json`: add animation/audio/particle dependencies and verification script.
- Modify `src/utils/spin.ts`: add deterministic segment helpers used by tick and winner glow.
- Create `scripts/verify-reward-show-wheel.mjs`: source and behavior checks for the reward-show feature.
- Create `src/utils/reducedMotion.ts`: browser-safe reduced motion detection.
- Create `src/utils/haptics.ts`: browser-safe vibration helper with throttled tick feedback.
- Create `src/utils/soundEffects.ts`: Howler-based generated cue playback for press, tick, and win.
- Create `src/components/ParticleField.tsx`: lightweight tsParticles wrapper for spotlight particles.
- Modify `src/components/Wheel.tsx`: expose refs, render visual layers, winning segment overlay, and particle burst hooks.
- Modify `src/hooks/useSpin.ts`: replace CSS transition/setTimeout spin with GSAP timeline, tick detection, cleanup, and visual callbacks.
- Create `src/components/ProductSpotlightReveal.tsx`: premium product-centered reveal before the existing claim form.
- Modify `src/components/WinnerOverlay.tsx`: add `spotlight` step and hand off to the current `reveal` step.
- Modify `src/index.css`: add focused CSS utilities for wheel glow, light sweep, center burst, and spotlight fallback styling.

---

### Task 1: Dependencies And Verification Guard

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/verify-reward-show-wheel.mjs`

- [ ] **Step 1: Add a failing verification script**

Create `scripts/verify-reward-show-wheel.mjs` with this content:

```js
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'vite'

const requiredFiles = [
  'src/utils/reducedMotion.ts',
  'src/utils/haptics.ts',
  'src/utils/soundEffects.ts',
  'src/components/ParticleField.tsx',
  'src/components/ProductSpotlightReveal.tsx',
]

for (const file of requiredFiles) {
  assert.ok(existsSync(file), `${file} should exist for reward-show wheel effects`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
for (const dependency of ['gsap', 'howler', '@tsparticles/react', '@tsparticles/slim', '@tsparticles/engine']) {
  assert.ok(packageJson.dependencies?.[dependency], `${dependency} should be installed as a runtime dependency`)
}
assert.ok(packageJson.devDependencies?.['@types/howler'], '@types/howler should be installed for strict TypeScript')
assert.equal(packageJson.scripts?.['verify:reward-show-wheel'], 'node scripts/verify-reward-show-wheel.mjs')

const useSpinSource = readFileSync('src/hooks/useSpin.ts', 'utf8')
assert.ok(useSpinSource.includes("from 'gsap'"), 'useSpin should import GSAP')
assert.ok(useSpinSource.includes('gsap.timeline'), 'useSpin should use a GSAP timeline')
assert.ok(useSpinSource.includes('getPointerSegmentIndex'), 'useSpin should tick from segment crossing')
assert.ok(useSpinSource.includes('playSpinSound'), 'useSpin should play Howler-backed cues')
assert.ok(useSpinSource.includes('vibrateTick'), 'useSpin should trigger throttled tick haptics')
assert.ok(!useSpinSource.includes('setTimeout(() =>'), 'spin completion should be controlled by the GSAP timeline')

const wheelSource = readFileSync('src/components/Wheel.tsx', 'utf8')
assert.ok(wheelSource.includes('pointerRef'), 'Wheel should expose a pointer ref for tick animation')
assert.ok(wheelSource.includes('wheelShellRef'), 'Wheel should expose a shell ref for zoom animation')
assert.ok(wheelSource.includes('winningSegmentKey'), 'Wheel should render winner glow by segment key')
assert.ok(wheelSource.includes('winner-segment-glow'), 'Wheel should render a winner segment glow overlay')
assert.ok(wheelSource.includes('center-burst'), 'Wheel should render a center burst effect')

const overlaySource = readFileSync('src/components/WinnerOverlay.tsx', 'utf8')
assert.ok(overlaySource.includes("type Step = 'spotlight' | 'reveal' | 'form' | 'share'"), 'WinnerOverlay should start with a spotlight step')
assert.ok(overlaySource.includes('ProductSpotlightReveal'), 'WinnerOverlay should render ProductSpotlightReveal')

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const {
    calcTargetAngle,
    getPointerSegmentIndex,
    getWinnerSegmentKey,
    normalizeRotation,
  } = await server.ssrLoadModule('/src/utils/spin.ts')
  const { getWheelSegmentEntries } = await server.ssrLoadModule('/src/utils/wheelSegments.ts')
  const { useWheelStore } = await server.ssrLoadModule('/src/store/wheelStore.ts')

  const prizes = useWheelStore.getState().prizes
  const winner = prizes[0]
  const targetAngle = calcTargetAngle(prizes, winner, 0, 8)
  const entries = getWheelSegmentEntries(prizes)
  const index = getPointerSegmentIndex(targetAngle, entries.length)

  assert.equal(normalizeRotation(725), 5)
  assert.equal(entries[index].prize.id, winner.id, 'target angle should land the selected winner under the pointer')
  assert.equal(getWinnerSegmentKey(prizes, winner, targetAngle), entries[index].segmentKey)
} finally {
  await server.close()
}

console.log('Reward-show wheel checks passed.')
```

- [ ] **Step 2: Wire the script in `package.json`**

Add this script entry after `verify:sheet-payloads`:

```json
"verify:reward-show-wheel": "node scripts/verify-reward-show-wheel.mjs"
```

- [ ] **Step 3: Run the verification script to confirm it fails for the intended reason**

Run:

```powershell
npm run verify:reward-show-wheel
```

Expected: exit code `1` with an assertion such as `src/utils/reducedMotion.ts should exist for reward-show wheel effects`.

- [ ] **Step 4: Install dependencies**

Run:

```powershell
npm install gsap howler @tsparticles/react @tsparticles/slim @tsparticles/engine
npm install -D @types/howler
```

Expected: `package.json` and `package-lock.json` are updated.

- [ ] **Step 5: Commit the guard and dependencies**

Run:

```powershell
git add package.json package-lock.json scripts/verify-reward-show-wheel.mjs
git commit -m "test: add reward show wheel verification"
```

---

### Task 2: Spin Geometry Helpers

**Files:**
- Modify: `src/utils/spin.ts`
- Test: `scripts/verify-reward-show-wheel.mjs`

- [ ] **Step 1: Add segment helpers to `src/utils/spin.ts`**

Append these exports before `formatTime`:

```ts
export function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360
}

export function getPointerSegmentIndex(rotation: number, segmentCount: number): number {
  if (segmentCount <= 0) return 0
  const segmentSize = 360 / segmentCount
  const pointerAngle = normalizeRotation(360 - normalizeRotation(rotation))
  return Math.floor(pointerAngle / segmentSize) % segmentCount
}

export function getWinnerSegmentKey(
  prizes: Prize[],
  winner: Prize,
  targetRotation: number,
): string | null {
  const segmentEntries = getWheelSegmentEntries(prizes)
  if (segmentEntries.length === 0) return null

  const targetIndex = getPointerSegmentIndex(targetRotation, segmentEntries.length)
  const targetEntry = segmentEntries[targetIndex]
  if (targetEntry?.prize.id === winner.id) return targetEntry.segmentKey

  return segmentEntries.find((entry) => entry.prize.id === winner.id)?.segmentKey ?? null
}
```

- [ ] **Step 2: Run the focused verification**

Run:

```powershell
npm run verify:reward-show-wheel
```

Expected: still fails because files/components for effects do not exist, but the spin helper assertions no longer fail once the script reaches them later.

- [ ] **Step 3: Commit spin helpers**

Run:

```powershell
git add src/utils/spin.ts
git commit -m "feat: add wheel segment geometry helpers"
```

---

### Task 3: Motion, Haptic, And Sound Helpers

**Files:**
- Create: `src/utils/reducedMotion.ts`
- Create: `src/utils/haptics.ts`
- Create: `src/utils/soundEffects.ts`
- Test: `scripts/verify-reward-show-wheel.mjs`

- [ ] **Step 1: Create `src/utils/reducedMotion.ts`**

```ts
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
```

- [ ] **Step 2: Create `src/utils/haptics.ts`**

```ts
let lastTickAt = 0

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(pattern)
}

export function vibratePress(): void {
  vibrate(10)
}

export function vibrateTick(now = performance.now()): void {
  if (now - lastTickAt < 120) return
  lastTickAt = now
  vibrate(8)
}

export function vibrateWin(): void {
  vibrate([18, 35, 22])
}
```

- [ ] **Step 3: Create `src/utils/soundEffects.ts`**

```ts
import { Howl } from 'howler'

type SoundCue = 'press' | 'tick' | 'win'

const SAMPLE_RATE = 22050
const soundCache: Partial<Record<SoundCue, Howl>> = {}
let lastTickAt = 0

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

function createToneDataUri(frequencies: number[], durationSeconds: number, volume: number): string {
  const sampleCount = Math.floor(SAMPLE_RATE * durationSeconds)
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + sampleCount * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, sampleCount * 2, true)

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / SAMPLE_RATE
    const envelope = Math.max(0, 1 - t / durationSeconds)
    const wave = frequencies.reduce((sum, frequency) => {
      return sum + Math.sin(2 * Math.PI * frequency * t)
    }, 0) / frequencies.length
    const sample = Math.max(-1, Math.min(1, wave * envelope * volume))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

function getCue(cue: SoundCue): Howl {
  if (soundCache[cue]) return soundCache[cue]

  const srcByCue: Record<SoundCue, string> = {
    press: createToneDataUri([330, 520], 0.16, 0.18),
    tick: createToneDataUri([880], 0.045, 0.09),
    win: createToneDataUri([523, 659, 784], 0.42, 0.16),
  }

  const sound = new Howl({
    src: [srcByCue[cue]],
    volume: cue === 'tick' ? 0.28 : 0.42,
    preload: true,
    html5: false,
  })
  soundCache[cue] = sound
  return sound
}

export function playSpinSound(cue: SoundCue, enabled: boolean): void {
  if (!enabled) return
  if (cue === 'tick') {
    const now = performance.now()
    if (now - lastTickAt < 65) return
    lastTickAt = now
  }

  try {
    getCue(cue).play()
  } catch {
    // Browser audio unlock failures should not block the spin.
  }
}

export function stopSpinSounds(): void {
  Object.values(soundCache).forEach((sound) => sound.stop())
}

export function unloadSpinSounds(): void {
  Object.values(soundCache).forEach((sound) => sound.unload())
}
```

- [ ] **Step 4: Run TypeScript build**

Run:

```powershell
npm run build
```

Expected: build succeeds for the helper files or exposes import/type issues to fix immediately.

- [ ] **Step 5: Commit helpers**

Run:

```powershell
git add src/utils/reducedMotion.ts src/utils/haptics.ts src/utils/soundEffects.ts
git commit -m "feat: add wheel effect helpers"
```

---

### Task 4: Particle Field And CSS Effects

**Files:**
- Create: `src/components/ParticleField.tsx`
- Modify: `src/index.css`
- Test: `npm run build`

- [ ] **Step 1: Create `src/components/ParticleField.tsx`**

```tsx
import { useMemo } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import type { Engine, ISourceOptions } from '@tsparticles/engine'
import { OutMode } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

interface ParticleFieldProps {
  id: string
  active: boolean
  colors: string[]
  density?: number
}

const particlesInit = async (engine: Engine): Promise<void> => {
  await loadSlim(engine)
}

export default function ParticleField({ id, active, colors, density = 24 }: ParticleFieldProps) {
  const options = useMemo<ISourceOptions>(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      color: { value: colors },
      number: { value: density },
      opacity: {
        value: { min: 0.22, max: 0.62 },
        animation: { enable: true, speed: 0.8, minimumValue: 0.1 },
      },
      size: { value: { min: 2, max: 5 } },
      move: {
        enable: true,
        speed: { min: 0.45, max: 1.2 },
        random: true,
        outModes: { default: OutMode.out },
      },
      shape: { type: 'circle' },
    },
  }), [colors, density])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <ParticlesProvider init={particlesInit}>
        <Particles id={id} options={options} />
      </ParticlesProvider>
    </div>
  )
}
```

- [ ] **Step 2: Add CSS effects to `src/index.css`**

Add these utilities inside `@layer utilities`:

```css
  .wheel-shell {
    transform-origin: center;
    will-change: transform;
  }

  .wheel-light-sweep {
    background: linear-gradient(105deg, transparent 22%, rgba(255,255,255,0.68) 48%, transparent 74%);
    transform: translateX(-130%) rotate(-18deg);
    opacity: 0;
  }

  .wheel-light-sweep.is-active {
    animation: wheel-light-sweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .winner-segment-glow {
    filter: drop-shadow(0 0 10px currentColor) drop-shadow(0 0 18px currentColor);
    opacity: 0;
    pointer-events: none;
  }

  .center-burst span {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 999px;
    background: var(--burst-color, #f6c744);
    transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(-58px);
    animation: center-burst 720ms ease-out both;
  }
```

Add these keyframes below the existing `@keyframes cart-bounce` block:

```css
@keyframes wheel-light-sweep {
  0% { opacity: 0; transform: translateX(-130%) rotate(-18deg); }
  18% { opacity: 0.8; }
  100% { opacity: 0; transform: translateX(130%) rotate(-18deg); }
}

@keyframes center-burst {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(0) scale(0.4); }
  18% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--burst-angle)) translateY(-86px) scale(0.9); }
}
```

Extend the reduced-motion block with:

```css
  .wheel-light-sweep.is-active,
  .center-burst span {
    animation: none !important;
  }
```

- [ ] **Step 3: Run build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite build succeed.

- [ ] **Step 4: Commit particle and CSS effects**

Run:

```powershell
git add src/components/ParticleField.tsx src/index.css
git commit -m "feat: add reward show particle effects"
```

---

### Task 5: Wheel Refs And Visual State

**Files:**
- Modify: `src/components/Wheel.tsx`
- Test: `npm run verify:reward-show-wheel`

- [ ] **Step 1: Export no helpers; keep geometry local**

Keep `polarToCartesian` and `buildSegmentPath` local to `Wheel.tsx`. Do not move them unless another file needs them.

- [ ] **Step 2: Add local visual state and refs**

Inside `Wheel`, replace the current `wheelGroupRef` and `useSpin` call area with this structure:

```tsx
  const { prizes, isSpinning } = useWheelStore()
  const wheelShellRef = useRef<HTMLDivElement>(null)
  const wheelGroupRef = useRef<SVGGElement>(null)
  const pointerRef = useRef<SVGGElement>(null)
  const spinButtonRef = useRef<HTMLButtonElement>(null)
  const [activeSegment, setActiveSegment] = useState<ActiveSegment | null>(null)
  const [spinPhase, setSpinPhase] = useState<'idle' | 'launching' | 'spinning' | 'decelerating' | 'settling' | 'spotlight'>('idle')
  const [winningSegmentKey, setWinningSegmentKey] = useState<string | null>(null)
  const [centerBurstKey, setCenterBurstKey] = useState(0)
```

After `segments` is built, call `useSpin` with object options:

```tsx
  const { spin } = useSpin({
    wheelRef: wheelGroupRef,
    wheelShellRef,
    pointerRef,
    spinButtonRef,
    segmentCount: segments.length,
    onPhaseChange: setSpinPhase,
    onWinnerSegmentChange: setWinningSegmentKey,
    onCenterBurst: () => setCenterBurstKey((value) => value + 1),
  })
```

- [ ] **Step 3: Render winner glow data**

Add this derived value before `return`:

```tsx
  const winningSegment = winningSegmentKey
    ? segments.find((segment) => segment.segmentKey === winningSegmentKey)
    : null
```

- [ ] **Step 4: Update the wheel shell wrapper**

Change the wrapper currently rendered as `<div className="relative">` around the SVG to:

```tsx
      <div ref={wheelShellRef} className="relative wheel-shell">
```

- [ ] **Step 5: Add center burst and light sweep layers**

Inside the shell wrapper, immediately after the pulse ring `<div>`, add:

```tsx
        <div className={`pointer-events-none absolute inset-0 overflow-hidden rounded-full wheel-light-sweep ${spinPhase !== 'idle' ? 'is-active' : ''}`} />
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
```

Make sure `CSSProperties` is available by changing the type import to:

```tsx
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
```

Then cast the style as `CSSProperties`, matching the center-burst snippet above.

- [ ] **Step 6: Add winner segment overlay**

Inside the SVG, after the rotating wheel group and before the pointer, add:

```tsx
          {winningSegment && (
            <path
              className="winner-segment-glow"
              d={buildSegmentPath(cx, cy, r, winningSegment.start, winningSegment.end)}
              fill="none"
              stroke={winningSegment.displayColor}
              strokeWidth="8"
              style={{ color: winningSegment.displayColor }}
            />
          )}
```

- [ ] **Step 7: Wrap pointer shapes in a ref group**

Replace the standalone pointer polygon and circle with:

```tsx
          <g ref={pointerRef} style={{ transformOrigin: `${cx}px ${cy - r - 6}px` }}>
            <polygon
              points={`${cx - 13},${cy - r - 6} ${cx + 13},${cy - r - 6} ${cx},${cy - r + 22}`}
              fill={BRAND_COLORS.tomato}
              stroke={BRAND_COLORS.cream}
              strokeWidth="3"
              filter="drop-shadow(0 3px 5px rgba(23,35,31,0.35))"
            />
            <circle cx={cx} cy={cy - r - 6} r="9" fill={BRAND_COLORS.tomatoDark} stroke={BRAND_COLORS.cream} strokeWidth="3" />
          </g>
```

- [ ] **Step 8: Add button ref**

Add `ref={spinButtonRef}` to the spin button.

- [ ] **Step 9: Run build**

Run:

```powershell
npm run build
```

Expected: build fails until `useSpin` is updated to accept the new object argument. Continue to Task 6 without committing if this is the only failure.

---

### Task 6: GSAP Spin Timeline

**Files:**
- Modify: `src/hooks/useSpin.ts`
- Test: `npm run verify:reward-show-wheel`
- Test: `npm run build`

- [ ] **Step 1: Replace `src/hooks/useSpin.ts` with GSAP orchestration**

Use this complete structure:

```ts
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
```

- [ ] **Step 2: Remove old transition cleanup in `Wheel.tsx`**

Delete the `useEffect` that sets `el.style.transition = 'none'`, because GSAP now owns transforms.

- [ ] **Step 3: Run focused verification**

Run:

```powershell
npm run verify:reward-show-wheel
```

Expected: likely still fails because `ProductSpotlightReveal` is not integrated. `useSpin` and helper assertions should pass.

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds after fixing exact TypeScript import issues from the object-based `useSpin` signature.

- [ ] **Step 5: Commit wheel visual state and GSAP timeline together**

Run:

```powershell
git add src/components/Wheel.tsx src/hooks/useSpin.ts
git commit -m "feat: animate wheel with gsap timeline"
```

---

### Task 7: Product Spotlight Reveal

**Files:**
- Create: `src/components/ProductSpotlightReveal.tsx`
- Modify: `src/components/WinnerOverlay.tsx`
- Test: `npm run verify:reward-show-wheel`
- Test: `npm run build`

- [ ] **Step 1: Create `src/components/ProductSpotlightReveal.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
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
  const [imgErr, setImgErr] = useState(false)
  const hasImage = !!winner.image && !imgErr

  useEffect(() => {
    const reducedMotion = prefersReducedMotion()
    const overlay = overlayRef.current
    const product = productRef.current
    const glow = glowRef.current
    const duration = reducedMotion ? 0.9 : 2.85

    const timeline = gsap.timeline({
      onComplete: onDone,
    })

    if (overlay) {
      timeline.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: reducedMotion ? 0.08 : 0.22, ease: 'power2.out' }, 0)
    }
    if (product) {
      timeline.fromTo(
        product,
        { scale: reducedMotion ? 1 : 0.78, y: reducedMotion ? 0 : 18, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: reducedMotion ? 0.12 : 0.82, ease: reducedMotion ? 'power1.out' : 'back.out(1.28)' },
        0.18,
      )
    }
    if (glow) {
      timeline.fromTo(
        glow,
        { scale: 0.72, opacity: 0 },
        { scale: 1.14, opacity: reducedMotion ? 0.36 : 0.72, duration: reducedMotion ? 0.18 : 1.25, ease: 'power2.out' },
        0.22,
      )
    }

    timeline.call(() => {
      confetti({
        particleCount: reducedMotion ? 45 : 120,
        spread: 68,
        origin: { y: 0.54 },
        scalar: reducedMotion ? 0.7 : 0.9,
        colors: [winner.color, BRAND_COLORS.citrus, BRAND_COLORS.surface, BRAND_COLORS.tomato, BRAND_COLORS.leaf],
      })
    }, undefined, reducedMotion ? 0.28 : 0.95)

    timeline.to({}, { duration })

    return () => timeline.kill()
  }, [onDone, winner.color])

  return (
    <div ref={overlayRef} className="relative min-h-[430px] overflow-hidden bg-brand-ink text-center text-brand-cream">
      <ParticleField
        id={`winner-particles-${winner.id}`}
        active={!prefersReducedMotion()}
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
```

- [ ] **Step 2: Update `WinnerOverlay.tsx` imports and step type**

Add:

```tsx
import ProductSpotlightReveal from './ProductSpotlightReveal'
```

Change:

```ts
type Step = 'reveal' | 'form' | 'share'
```

to:

```ts
type Step = 'spotlight' | 'reveal' | 'form' | 'share'
```

- [ ] **Step 3: Start new winners at `spotlight`**

In the reset effect, replace:

```ts
setStep('reveal')
```

with:

```ts
setStep('spotlight')
```

- [ ] **Step 4: Render the spotlight before the reveal step**

Inside the modal card `<div ...>`, before the `STEP: REVEAL` block, add:

```tsx
        {step === 'spotlight' && (
          <ProductSpotlightReveal winner={winner} onDone={() => setStep('reveal')} />
        )}
```

- [ ] **Step 5: Prevent click-away during spotlight**

Change the overlay `onClick` handler from:

```tsx
onClick={handleClose}
```

to:

```tsx
onClick={step === 'spotlight' ? undefined : handleClose}
```

In the Escape key effect, change:

```ts
if (e.key === 'Escape') handleClose()
```

to:

```ts
if (e.key === 'Escape' && step !== 'spotlight') handleClose()
```

Add `step` to that effect dependency list and remove the eslint suppression if it is no longer needed.

- [ ] **Step 6: Run focused verification**

Run:

```powershell
npm run verify:reward-show-wheel
```

Expected: `Reward-show wheel checks passed.`

- [ ] **Step 7: Run build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite build succeed.

- [ ] **Step 8: Commit spotlight reveal**

Run:

```powershell
git add src/components/ProductSpotlightReveal.tsx src/components/WinnerOverlay.tsx
git commit -m "feat: add product spotlight winner reveal"
```

---

### Task 8: Final Verification And Browser Pass

**Files:**
- Modify only if verification exposes concrete issues.

- [ ] **Step 1: Run all relevant verification commands**

Run:

```powershell
npm run verify:reward-show-wheel
node scripts/verify-wheel-product-hover.mjs
npm run verify:sheet-payloads
npm run build
```

Expected:

- `Reward-show wheel checks passed.`
- `Wheel product hover and short-label checks passed.`
- `Sheet payload checks passed.`
- Vite build completes successfully.

- [ ] **Step 2: Start the dev server**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 3: Browser-check desktop**

Open the Vite URL and verify:

- Navigate to `Vòng quay`.
- Click `Quay ngay`.
- Button compresses and disables.
- Wheel accelerates, blurs while fast, decelerates, and settles.
- Pointer ticks visually while segments pass.
- Winning segment glows.
- Product Spotlight appears before the claim form.
- Claim form still accepts name and phone.

- [ ] **Step 4: Browser-check mobile width**

Use a mobile viewport around `390x844` and verify:

- Wheel fits on screen.
- Product Spotlight does not hide the claim action after the reveal.
- Text does not overflow inside the spotlight card.
- Spin button remains reachable.

- [ ] **Step 5: Browser-check sound disabled**

Use the existing admin/control path for `soundEnabled` if available, or temporarily set the persisted store value to false in DevTools. Verify:

- Spin still works.
- Tick/win sounds do not play.
- Product Spotlight still appears.

- [ ] **Step 6: Browser-check reduced motion**

Enable browser emulation for `prefers-reduced-motion: reduce` and verify:

- Spin still lands on a valid winner.
- Blur/zoom/particle effects are reduced.
- Product Spotlight completes faster but still hands off to the claim form.

- [ ] **Step 7: Commit any verification fixes**

If fixes were needed, run:

```powershell
git add src scripts package.json package-lock.json
git commit -m "fix: polish reward show wheel verification"
```

Skip this commit when no fixes were needed.

---

## Self-Review Notes

- Spec coverage: dependencies, GSAP spin, tick pointer, blur, glow, Product Spotlight, sound, haptics, reduced motion, image fallback, and claim-flow preservation are each mapped to tasks.
- Verification coverage: source checks, spin helper behavior checks, existing sheet/hover checks, build, desktop browser, mobile browser, sound-off, and reduced-motion checks are included.
- State decision: no persisted Zustand animation state is added; `spinPhase`, `winningSegmentKey`, and spotlight timing are local UI state.
- Scope control: Three.js, reward chest, loud game-show audio, and weighting changes remain out of scope.
