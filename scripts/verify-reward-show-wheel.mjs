import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'vite'

const requiredFiles = [
  'src/utils/reducedMotion.ts',
  'src/utils/gsapTiming.ts',
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
assert.ok(useSpinSource.includes('configureGsapRealTimeTicker'), 'useSpin should keep GSAP timelines time-based under throttled frames')
assert.ok(useSpinSource.includes("WHEEL_SVG_ORIGIN = '250 250'"), 'wheel rotation should define the center in SVG coordinates')
assert.ok(useSpinSource.includes('svgOrigin: WHEEL_SVG_ORIGIN'), 'wheel rotation should use SVG coordinates so the wheel stays centered while scaled')
assert.ok(!useSpinSource.includes("transformOrigin: '250px 250px'"), 'wheel rotation should not use CSS px transformOrigin on SVG groups')
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
assert.ok(!wheelSource.includes('transformOrigin'), 'Wheel SVG groups should leave rotation origins to GSAP svgOrigin')
const segmentFunctionSource = wheelSource.slice(
  wheelSource.indexOf('function Segment('),
  wheelSource.indexOf('function ProductInfoCard'),
)
assert.ok(segmentFunctionSource.includes('const [imgErr, setImgErr]'), 'Wheel segment product badges should track image load errors')
assert.ok(segmentFunctionSource.includes('const hasImage'), 'Wheel segment product badges should render emoji fallback after image errors')
assert.ok(segmentFunctionSource.includes('onError={() => setImgErr(true)}'), 'Wheel segment SVG images should fail closed to emoji badges')
assert.ok(segmentFunctionSource.includes('fallback-badge'), 'Wheel segment fallback badges should have a polished framed state')

const cssSource = readFileSync('src/index.css', 'utf8')
assert.ok(cssSource.includes('.wheel-light-sweep::before'), 'light sweep should animate a clipped pseudo-element')
assert.ok(cssSource.includes('.wheel-light-sweep.is-active::before'), 'light sweep animation should not transform the mask element')

const overlaySource = readFileSync('src/components/WinnerOverlay.tsx', 'utf8')
assert.ok(overlaySource.includes("type Step = 'spotlight' | 'reveal' | 'form' | 'share'"), 'WinnerOverlay should start with a spotlight step')
assert.ok(overlaySource.includes('ProductSpotlightReveal'), 'WinnerOverlay should render ProductSpotlightReveal')
assert.ok(overlaySource.includes('dialogRef'), 'WinnerOverlay should move focus into the dialog')
assert.ok(overlaySource.includes('primaryActionRef'), 'WinnerOverlay should focus the reveal action when it appears')
assert.ok(overlaySource.includes('tabIndex={-1}'), 'WinnerOverlay dialog should be programmatically focusable')
assert.ok(overlaySource.includes('getDialogFocusableElements'), 'WinnerOverlay should trap tab focus inside the dialog')

const spotlightSource = readFileSync('src/components/ProductSpotlightReveal.tsx', 'utf8')
assert.ok(spotlightSource.includes('configureGsapRealTimeTicker'), 'ProductSpotlightReveal should keep reveal timing stable under throttled frames')
assert.ok(spotlightSource.includes('try') && spotlightSource.includes('confetti('), 'confetti should be fail-closed so it cannot block reveal flow')

const particleSource = readFileSync('src/components/ParticleField.tsx', 'utf8')
assert.ok(particleSource.includes('particlesReady'), 'ParticleField should disable itself if particle initialization fails')

const storeSource = readFileSync('src/store/wheelStore.ts', 'utf8')
assert.ok(storeSource.includes('version: 5'), 'wheel store should migrate persisted state after dropping transient fields')
assert.ok(storeSource.includes('partializeWheelState'), 'wheel store should use an explicit partialize helper')

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
  const { migrateWheelState, partializeWheelState, useWheelStore } = await server.ssrLoadModule('/src/store/wheelStore.ts')

  const prizes = useWheelStore.getState().prizes
  const winner = prizes[0]
  const targetAngle = calcTargetAngle(prizes, winner, 0, 8)
  const entries = getWheelSegmentEntries(prizes)
  const index = getPointerSegmentIndex(targetAngle, entries.length)

  assert.equal(normalizeRotation(725), 5)
  assert.equal(entries[index].prize.id, winner.id, 'target angle should land the selected winner under the pointer')
  assert.equal(getWinnerSegmentKey(prizes, winner, targetAngle), entries[index].segmentKey)

  const customPrize = {
    id: 'custom-detox',
    name: 'Custom Detox',
    color: '#123456',
    quantity: 7,
    weight: 13,
    emoji: 'C',
    image: 'https://example.com/custom.png',
  }
  const migrated = migrateWheelState({
    prizes: [customPrize],
    winners: [{ id: 'winner-1', prizeName: 'Custom Detox', prizeEmoji: 'C', timestamp: 123 }],
    adminUnlocked: true,
    soundEnabled: false,
    sheetsUrl: ' https://sheet.example ',
    currentWinner: customPrize,
    showWinnerOverlay: true,
    isSpinning: true,
  })

  assert.deepEqual(migrated.prizes, [customPrize], 'migration should preserve durable custom prizes and inventory')
  assert.equal(migrated.winners.length, 1, 'migration should preserve winner history')
  assert.equal(migrated.adminUnlocked, true, 'migration should preserve admin setting')
  assert.equal(migrated.soundEnabled, false, 'migration should preserve sound setting')
  assert.equal(migrated.sheetsUrl, ' https://sheet.example ', 'migration should preserve sheet URL setting')
  assert.equal(migrated.currentWinner, undefined, 'migration should drop transient current winner')
  assert.equal(migrated.showWinnerOverlay, undefined, 'migration should drop transient overlay state')
  assert.equal(migrated.isSpinning, undefined, 'migration should drop transient spinning state')

  const partialized = partializeWheelState({
    ...useWheelStore.getState(),
    prizes: [customPrize],
    winners: migrated.winners,
    currentWinner: customPrize,
    showWinnerOverlay: true,
    isSpinning: true,
    soundEnabled: false,
  })

  assert.deepEqual(partialized.prizes, [customPrize], 'partialize should persist prize configuration')
  assert.equal(partialized.winners.length, 1, 'partialize should persist winner history')
  assert.equal(partialized.soundEnabled, false, 'partialize should persist durable settings')
  assert.equal(partialized.currentWinner, undefined, 'current winner should not be persisted across reloads')
  assert.equal(partialized.showWinnerOverlay, undefined, 'winner overlay should not be persisted across reloads')
  assert.equal(partialized.isSpinning, undefined, 'spin progress should not be persisted across reloads')
} finally {
  await server.close()
}

console.log('Reward-show wheel checks passed.')
