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
