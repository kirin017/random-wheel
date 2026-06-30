import { readFileSync } from 'node:fs'

function read(path) {
  return readFileSync(path, 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

const app = read('src/App.tsx')
const adminPanel = read('src/components/AdminPanel.tsx')
const wheel = read('src/components/Wheel.tsx')
const spin = read('src/utils/spin.ts')
const wheelSegments = read('src/utils/wheelSegments.ts')

assert(!app.includes('PrizeLegend'), 'App should not import or render the public prize legend.')
assert(!adminPanel.includes('Gợi ý: admin123'), 'Admin password hint should not be visible in source.')
assert(adminPanel.includes('panelOpen'), 'Admin panel should be collapsed behind an explicit open state.')
assert(adminPanel.includes('aria-expanded={panelOpen}'), 'Admin open control should expose its expanded state.')
assert(wheel.includes('getWheelSegmentEntries'), 'Wheel should render doubled visual segment entries.')
assert(spin.includes('getWheelSegmentEntries'), 'Spin targeting should use the same doubled segment entries as the wheel.')
assert(wheelSegments.includes('displayColor'), 'Wheel segments should expose a per-slice display color.')
assert(!wheelSegments.includes('source.flatMap'), 'Doubled wheel segments should be interleaved, not adjacent duplicate prizes.')
assert(wheel.includes('displayColor'), 'Wheel should render each slice with its display color variant.')

if (process.exitCode) {
  process.exit(process.exitCode)
}

console.log('Private admin layout and doubled wheel segment checks passed.')
