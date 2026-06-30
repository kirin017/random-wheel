import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'vite'

const labelHelperPath = 'src/utils/prizeLabels.ts'
const wheelPath = 'src/components/Wheel.tsx'

assert.ok(existsSync(labelHelperPath), 'wheel should have a prize short-label helper')

const wheel = readFileSync(wheelPath, 'utf8')
assert.ok(wheel.includes('getPrizeShortName'), 'wheel should render intentional short labels')
assert.ok(!wheel.includes('prize.name.length > 12'), 'wheel should not truncate prize names with ellipsis')
assert.ok(wheel.includes('ProductInfoCard'), 'wheel should render a product info hover card')
assert.ok(wheel.includes('onPointerEnter'), 'wheel segments should reveal product info on hover')
assert.ok(wheel.includes('onClick'), 'wheel segments should reveal product info on tap/click')

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
  const { useWheelStore } = await server.ssrLoadModule('/src/store/wheelStore.ts')
  const { getPrizeShortName } = await server.ssrLoadModule('/src/utils/prizeLabels.ts')

  const expectedShortNames = {
    'ginger-shot-any': 'Ginger Shot',
    'sua-hat-any': 'Sữa Hạt',
    'detox-xanh': 'Detox Xanh',
    'detox-do': 'Detox Đỏ',
    'smoothie-any': 'Smoothie',
    'hu-mach-any': 'Hũ Mạch',
  }

  for (const prize of useWheelStore.getState().prizes) {
    assert.equal(getPrizeShortName(prize), expectedShortNames[prize.id], `${prize.name} should use a clean short label`)
    assert.ok(!getPrizeShortName(prize).includes('…'), `${prize.name} short label should not contain ellipsis`)
  }
} finally {
  await server.close()
}

console.log('Wheel product hover and short-label checks passed.')
