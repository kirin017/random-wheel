import assert from 'node:assert/strict'
import { createServer } from 'vite'

const expectedPrizes = [
  {
    id: 'ginger-shot-any',
    name: 'Ginger Shot Vị Bất Kỳ',
    weight: 25,
    imageId: '14Sw6OqnKCLuzzSctN_MTpOYpqLxY-zN7',
  },
  {
    id: 'sua-hat-any',
    name: 'Sữa Hạt Vị Bất Kỳ',
    weight: 25,
    imageId: '1eQZr-Biucevy52dPTO2dygL5FE2uYHiK',
  },
  {
    id: 'detox-xanh',
    name: 'Detox Xanh',
    weight: 20,
    imageId: '1s8j6vSN0d1TGXTg1YnClEjj3Ggr6sjK8',
  },
  {
    id: 'detox-do',
    name: 'Detox Đỏ',
    weight: 20,
    imageId: '1A_rDzjg8YSf5T-rI9ceeaxP7qJqEZRqO',
  },
  {
    id: 'smoothie-any',
    name: 'Smoothie Vị Bất Kỳ',
    weight: 7,
    imageId: '1eMgxarXNiVrAv_KORItsR4ZIwbhw8zIw',
  },
  {
    id: 'hu-mach-any',
    name: 'Hũ Mạch Vị Bất Kỳ',
    weight: 3,
    imageId: '1YO7DHEJ3EZRPJWnBe3KLXEDXvJziN9Mt',
  },
]

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
  const prizes = useWheelStore.getState().prizes

  assert.deepEqual(
    prizes.map(({ id, name, weight }) => ({ id, name, weight })),
    expectedPrizes.map(({ id, name, weight }) => ({ id, name, weight })),
  )

  assert.equal(prizes.length, 6, 'wheel should contain exactly the requested six prize entries')
  assert.equal(
    prizes.some((prize) => prize.name.toLowerCase().includes('thử lần sau')),
    false,
    'requested prize-only wheel should not include a consolation segment',
  )

  for (const expected of expectedPrizes) {
    const prize = prizes.find((item) => item.id === expected.id)
    assert.ok(prize, `missing prize ${expected.name}`)
    assert.ok(prize.quantity > 0, `${expected.name} should be claimable, not treated as consolation`)
    assert.ok(prize.image?.includes('drive.google.com/thumbnail'), `${expected.name} should use a Drive thumbnail URL`)
    assert.ok(prize.image?.includes(expected.imageId), `${expected.name} should use the selected Drive image`)
  }

  const byId = Object.fromEntries(prizes.map((prize) => [prize.id, prize]))
  assert.equal(prizes.reduce((sum, prize) => sum + prize.weight, 0), 100)
  assert.ok(byId['smoothie-any'].weight < byId['ginger-shot-any'].weight)
  assert.ok(byId['smoothie-any'].weight < byId['sua-hat-any'].weight)
  assert.ok(byId['hu-mach-any'].weight < byId['smoothie-any'].weight)
  assert.equal(Math.min(...prizes.map((prize) => prize.weight)), byId['hu-mach-any'].weight)
} finally {
  await server.close()
}
