import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}
globalThis.window = { localStorage: globalThis.localStorage }

const sheetsSource = readFileSync('src/utils/sheets.ts', 'utf8')
const winnerSource = readFileSync('src/components/WinnerOverlay.tsx', 'utf8')

assert.ok(sheetsSource.includes("type: 'lead'"), 'lead payload should include a lead type')
assert.ok(sheetsSource.includes("type: 'order'"), 'order payload should include an order type')
assert.ok(sheetsSource.includes('orderToSheetPayload'), 'order payload converter should exist')
assert.ok(winnerSource.includes('submitLeadToSheet'), 'winner overlay should still submit leads')

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const { orderToSheetPayload } = await server.ssrLoadModule('/src/utils/sheets.ts')
  const payload = orderToSheetPayload({
    id: '1',
    customerName: 'Nguyen Van A',
    phone: '0901234567',
    address: '1 Le Loi',
    preferredTime: 'Sang mai',
    note: 'Giao lanh',
    items: [{
      productId: 'ginger-shot',
      productName: 'Ginger Shot',
      variantId: 'vang',
      variantName: 'Vàng',
      unit: 'shot',
      unitPrice: 35000,
      quantity: 2,
      note: '',
      lineTotal: 70000,
    }],
    subtotal: 70000,
    status: 'new',
    timestamp: 1782876000000,
  })

  assert.equal(payload.type, 'order')
  assert.equal(payload.customerName, 'Nguyen Van A')
  assert.equal(payload.subtotal, 70000)
  assert.ok(payload.itemSummary.includes('2 x Ginger Shot - Vàng'))
} finally {
  await server.close()
}

console.log('Sheet payload checks passed.')
