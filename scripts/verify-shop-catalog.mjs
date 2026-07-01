import assert from 'node:assert/strict'
import { createServer } from 'vite'

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
  const catalog = await server.ssrLoadModule('/src/utils/shopCatalog.ts')
  const { DEFAULT_PRODUCTS, calculateCartSubtotal, buildOrderItems, summarizeOrderItems } = catalog

  assert.equal(DEFAULT_PRODUCTS.length, 6, 'shop catalog should expose six default product groups')

  const expectedIds = ['ginger-shot', 'detox-lo-trinh', 'nuoc-ep', 'sua-hat', 'smoothie', 'hat-lanh']
  assert.deepEqual(DEFAULT_PRODUCTS.map((product) => product.id), expectedIds)

  for (const product of DEFAULT_PRODUCTS) {
    assert.ok(product.name, `${product.id} should have a display name`)
    assert.ok(product.description, `${product.id} should have a description`)
    assert.ok(product.image.includes('drive.google.com/thumbnail'), `${product.id} should use a Drive thumbnail`)
    assert.ok(product.variants.length > 0, `${product.id} should have variants`)
    for (const variant of product.variants) {
      assert.ok(variant.id, `${product.id} variant should have an id`)
      assert.ok(variant.name, `${product.id} variant should have a name`)
      assert.ok(variant.price > 0, `${product.id}/${variant.id} should have a positive price`)
      assert.ok(variant.unit, `${product.id}/${variant.id} should have a unit`)
    }
  }

  const subtotal = calculateCartSubtotal(DEFAULT_PRODUCTS, [
    { id: 'a', productId: 'ginger-shot', variantId: 'vang', quantity: 2, note: '' },
    { id: 'b', productId: 'smoothie', variantId: 'no-lau', quantity: 1, note: 'ít đá' },
  ])
  assert.equal(subtotal, 149000)

  const orderItems = buildOrderItems(DEFAULT_PRODUCTS, [
    { id: 'a', productId: 'ginger-shot', variantId: 'vang', quantity: 2, note: '' },
  ])
  assert.equal(orderItems[0].lineTotal, 70000)
  assert.ok(summarizeOrderItems(orderItems).includes('2 x Ginger Shot - Vàng'))
} finally {
  await server.close()
}

console.log('Shop catalog checks passed.')
