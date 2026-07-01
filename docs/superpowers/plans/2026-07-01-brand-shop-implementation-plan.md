# Brand Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium brand shopping experience around the existing Bep Yeu Thuong prize wheel, with landing, catalog, cart, checkout, order sync, and admin management.

**Architecture:** Keep the project as a Vite/React SPA. Add a separate shop domain (`shopCatalog`, `shopStore`, shop UI, order Sheet payloads) while keeping existing wheel prize state untouched. `App.tsx` owns the top-level tab state; Zustand owns catalog/cart/orders.

**Tech Stack:** React 18, TypeScript, Zustand persist, Tailwind CSS, Vite, existing Google Apps Script `no-cors` Sheet sync.

---

## File Structure

- Create `src/utils/shopCatalog.ts`: shop domain types, default six product groups, price formatting, cart subtotal helpers, order item summarization, Vietnamese phone validator.
- Create `src/store/shopStore.ts`: persisted catalog/cart/order state and actions.
- Modify `src/utils/sheets.ts`: add `type: "lead"` and `type: "order"` payloads, plus `submitOrderToSheet`.
- Create `src/components/ScrollReveal.tsx`: small IntersectionObserver wrapper for landing section reveals.
- Create `src/components/BrandLanding.tsx`: Balanced Premium landing page and CTAs into shop/wheel.
- Create `src/components/Shop.tsx`: product grid and product cards with variant selection and quick add.
- Create `src/components/CartDrawer.tsx`: cart drawer, quantity controls, checkout form, success state.
- Create `src/components/admin/ProductAdminSection.tsx`: local product and variant management.
- Create `src/components/admin/OrdersAdminSection.tsx`: local order list, CSV export, clear orders.
- Modify `src/components/AdminPanel.tsx`: add admin tabs and render prize/product/order/Sheet sections.
- Modify `src/components/WinnerOverlay.tsx`: send wheel leads with `type: "lead"`.
- Modify `src/App.tsx`: add top-level tabs, landing/shop rendering, cart button, and cart drawer.
- Modify `src/index.css`: add reveal, marquee, cart bounce, and reduced-motion-safe animations.
- Modify `GOOGLE_SHEETS_SETUP.md`: document dual lead/order Apps Script.
- Modify `package.json`: add verification scripts.
- Create `scripts/verify-shop-catalog.mjs`: verify six product groups and variant prices.
- Create `scripts/verify-sheet-payloads.mjs`: verify payload shapes and source updates.

## Checkpoints

1. Shop data and store compile independently.
2. Sheet payloads support both lead and order.
3. Landing/shop/cart UI works without changing wheel behavior.
4. Admin can edit products and export orders.
5. Documentation and verification pass.

---

### Task 1: Shop Catalog Domain

**Files:**
- Create: `src/utils/shopCatalog.ts`
- Create: `scripts/verify-shop-catalog.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create shop catalog types and defaults**

Create `src/utils/shopCatalog.ts` with this complete module shape. Use `driveImg` from `src/utils/brandAssets.ts` so images follow the current Drive thumbnail pattern.

```ts
import { driveImg } from './brandAssets'

export interface ProductVariant {
  id: string
  name: string
  price: number
  unit: string
  description?: string
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  audience: string
  storageNote: string
  image: string
  featured: boolean
  available: boolean
  variants: ProductVariant[]
}

export interface CartItem {
  id: string
  productId: string
  variantId: string
  quantity: number
  note: string
}

export interface OrderItem {
  productId: string
  productName: string
  variantId: string
  variantName: string
  unit: string
  unitPrice: number
  quantity: number
  note: string
  lineTotal: number
}

export interface Order {
  id: string
  customerName: string
  phone: string
  address: string
  preferredTime: string
  note: string
  items: OrderItem[]
  subtotal: number
  status: 'new'
  timestamp: number
}

export interface CheckoutInfo {
  customerName: string
  phone: string
  address: string
  preferredTime: string
  note: string
}

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'ginger-shot',
    name: 'Ginger Shot',
    category: 'Shot tươi',
    description: 'Shot gừng tươi cô đặc, cay ấm, chua ngọt rõ, tiện thêm vào routine buổi sáng.',
    audience: 'Người muốn đồ uống nhỏ gọn, tỉnh vị, giảm đồ uống ngọt nhiều đường.',
    storageNote: 'Bảo quản lạnh 0-4°C, dùng tốt nhất trong 24-48 giờ theo HSD trên nhãn.',
    image: driveImg('14Sw6OqnKCLuzzSctN_MTpOYpqLxY-zN7'),
    featured: true,
    available: true,
    variants: [
      { id: 'vang', name: 'Vàng', price: 35000, unit: 'shot' },
      { id: 'xanh', name: 'Xanh', price: 35000, unit: 'shot' },
      { id: 'cam', name: 'Cam', price: 35000, unit: 'shot' },
      { id: 'do', name: 'Đỏ', price: 35000, unit: 'shot' },
      { id: 'hong', name: 'Hồng', price: 35000, unit: 'shot' },
    ],
  },
  {
    id: 'detox-lo-trinh',
    name: 'Detox / Lộ trình',
    category: 'Combo đồ uống tươi',
    description: 'Các lộ trình rau củ quả tươi theo cấp độ BYT, dùng theo lịch hướng dẫn.',
    audience: 'Người muốn bắt đầu ăn lành/uống sạch có hướng dẫn và combo rõ ràng.',
    storageNote: 'Giữ lạnh 0-4°C trong toàn bộ quá trình nhận và dùng; uống theo thứ tự trên phiếu.',
    image: driveImg('1gV4hUF1zKQ8YlJylEGTqOV3oYeqzWpq5'),
    featured: true,
    available: true,
    variants: [
      { id: 'tam-thanh', name: 'Chạm lành Tam thanh', price: 156000, unit: 'gói' },
      { id: 'luc-sac', name: 'Chạm lành Lục sắc', price: 282000, unit: 'gói' },
      { id: 'nhe-bung', name: 'Thanh thể Nhẹ bụng', price: 900000, unit: 'lộ trình' },
      { id: 'an-nhien', name: 'Hòa vị An nhiên', price: 1490000, unit: 'lộ trình' },
      { id: 'tuoi-nhuan', name: 'Dưỡng nguyên Tươi nhuận', price: 5790000, unit: 'lộ trình' },
      { id: 'truong-xuan', name: 'Trường xuân Rực rỡ', price: 6359000, unit: 'lộ trình' },
    ],
  },
  {
    id: 'nuoc-ep',
    name: 'Nước ép',
    category: 'Nước ép tươi',
    description: 'Nước ép rau củ quả tươi nguyên chất theo công thức BYT, thay thế lựa chọn nước ngọt công nghiệp.',
    audience: 'Người muốn tăng khẩu phần rau quả và cần đồ uống nhẹ trong ngày.',
    storageNote: 'Bảo quản lạnh 0-4°C, dùng ngon nhất trong ngày, sau khi mở nắp nên uống hết ngay.',
    image: driveImg('15cpv22xS5CDCitdMvuKZ-atqybupgWMd'),
    featured: true,
    available: true,
    variants: [
      { id: 'tao-xanh', name: 'Táo xanh thanh lọc', price: 55000, unit: 'chai' },
      { id: 'can-tay', name: 'Tỉnh táo cần tây', price: 50000, unit: 'chai' },
      { id: 'kale', name: 'Kale thanh lọc', price: 55000, unit: 'chai' },
      { id: 'den-cam', name: 'Hồng xuân dền cam', price: 55000, unit: 'chai' },
      { id: 'dua-hau-bac-ha', name: 'Dưa hấu bạc hà', price: 50000, unit: 'chai' },
    ],
  },
  {
    id: 'sua-hat',
    name: 'Sữa hạt',
    category: 'Sữa hạt tươi',
    description: 'Sữa hạt/ngũ cốc vị dịu, dễ uống, phù hợp dùng hằng ngày hoặc dùng lạnh/ấm nhẹ.',
    audience: 'Gia đình, dân văn phòng, người muốn đồ uống bùi nhẹ và tiện dùng.',
    storageNote: 'Bảo quản lạnh 0-4°C; lắc nhẹ trước khi uống vì sản phẩm có thể tách lớp tự nhiên.',
    image: driveImg('1eQZr-Biucevy52dPTO2dygL5FE2uYHiK'),
    featured: true,
    available: true,
    variants: [
      { id: 'daily-250', name: 'Daily 250 ml', price: 25000, unit: 'chai' },
      { id: 'daily-330', name: 'Daily 330 ml', price: 30000, unit: 'chai' },
      { id: 'cao-cap', name: 'Cao cấp', price: 65000, unit: 'chai' },
    ],
  },
  {
    id: 'smoothie',
    name: 'Smoothie',
    category: 'Smoothie tươi',
    description: 'Smoothie xay mịn từ trái cây tươi, tiện làm bữa phụ hoặc món giải khát healthy.',
    audience: 'Người thích đồ uống sánh mịn, dân văn phòng bận rộn, khách cần bữa phụ tiện lợi.',
    storageNote: 'Bảo quản lạnh 0-4°C, lắc/khuấy đều trước khi uống, sau mở nắp nên dùng hết.',
    image: driveImg('1eMgxarXNiVrAv_KORItsR4ZIwbhw8zIw'),
    featured: true,
    available: true,
    variants: [
      { id: 'hoa-qua', name: 'Smoothie hoa quả', price: 69000, unit: 'ly' },
      { id: 'no-lau', name: 'Smoothie no lâu', price: 79000, unit: 'ly' },
    ],
  },
  {
    id: 'hat-lanh',
    name: 'Hạt lành',
    category: 'Set hạt',
    description: 'Set hạt/đậu/ngũ cốc định lượng theo ngày, giúp khách tự làm sữa hạt hoặc chế biến tại nhà.',
    audience: 'Người muốn tự làm sữa hạt nhưng không muốn tự cân đo nguyên liệu.',
    storageNote: 'Để nơi khô, mát, kín, tránh nắng và ẩm; set sẵn sàng cần bảo quản lạnh theo nhãn.',
    image: driveImg('10wyv6CnpIckdDnrlJI1THDROL6doaKdy'),
    featured: false,
    available: true,
    variants: [
      { id: '7-ngay-chua-so-che', name: 'Set 7 ngày chưa sơ chế', price: 105000, unit: 'set' },
      { id: '14-ngay-chua-so-che', name: 'Set 14 ngày chưa sơ chế', price: 196000, unit: 'set' },
      { id: '30-ngay-chua-so-che', name: 'Set 30 ngày chưa sơ chế', price: 390000, unit: 'set' },
      { id: '7-ngay-san-sang', name: 'Set 7 ngày sẵn sàng', price: 210000, unit: 'set' },
      { id: '14-ngay-san-sang', name: 'Set 14 ngày sẵn sàng', price: 392000, unit: 'set' },
    ],
  },
]

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}

export function isValidVNPhone(raw: string): boolean {
  return /^0\d{9}$/.test(raw.replace(/[\s.]/g, ''))
}

export function getProductById(products: Product[], productId: string): Product | undefined {
  return products.find((product) => product.id === productId)
}

export function getVariantById(product: Product | undefined, variantId: string): ProductVariant | undefined {
  return product?.variants.find((variant) => variant.id === variantId)
}

export function calculateCartSubtotal(products: Product[], items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const product = getProductById(products, item.productId)
    const variant = getVariantById(product, item.variantId)
    return sum + (variant ? variant.price * item.quantity : 0)
  }, 0)
}

export function buildOrderItems(products: Product[], items: CartItem[]): OrderItem[] {
  return items.flatMap((item) => {
    const product = getProductById(products, item.productId)
    const variant = getVariantById(product, item.variantId)
    if (!product || !variant) return []
    return [{
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      unit: variant.unit,
      unitPrice: variant.price,
      quantity: item.quantity,
      note: item.note,
      lineTotal: variant.price * item.quantity,
    }]
  })
}

export function summarizeOrderItems(items: OrderItem[]): string {
  return items
    .map((item) => `${item.quantity} x ${item.productName} - ${item.variantName} (${formatVnd(item.lineTotal)})${item.note ? ` - Ghi chú: ${item.note}` : ''}`)
    .join('\n')
}
```

- [ ] **Step 2: Add the catalog verification script**

Create `scripts/verify-shop-catalog.mjs`:

```js
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
```

- [ ] **Step 3: Add package scripts**

Modify `package.json` scripts to include catalog verification without removing existing scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "verify:shop-catalog": "node scripts/verify-shop-catalog.mjs"
  }
}
```

- [ ] **Step 4: Run catalog verification**

Run:

```bash
npm run verify:shop-catalog
```

Expected:

```text
Shop catalog checks passed.
```

- [ ] **Step 5: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/utils/shopCatalog.ts scripts/verify-shop-catalog.mjs
git commit -m "feat: add shop catalog defaults"
```

---

### Task 2: Shop Store

**Files:**
- Create: `src/store/shopStore.ts`
- Modify: `scripts/verify-shop-catalog.mjs`

- [ ] **Step 1: Create persisted shop store**

Create `src/store/shopStore.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_PRODUCTS,
  type CartItem,
  type CheckoutInfo,
  type Order,
  type Product,
  buildOrderItems,
  calculateCartSubtotal,
} from '../utils/shopCatalog'

interface ShopState {
  products: Product[]
  cartItems: CartItem[]
  orders: Order[]
  cartOpen: boolean

  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  resetProducts: () => void

  addToCart: (productId: string, variantId: string) => void
  updateCartQuantity: (itemId: string, quantity: number) => void
  updateCartNote: (itemId: string, note: string) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void

  getCartSubtotal: () => number
  createOrder: (info: CheckoutInfo) => Order
  clearOrders: () => void
}

function makeCartItemId(productId: string, variantId: string): string {
  return `${productId}:${variantId}`
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      products: DEFAULT_PRODUCTS,
      cartItems: [],
      orders: [],
      cartOpen: false,

      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((product) => (product.id === id ? { ...product, ...updates } : product)),
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
          cartItems: state.cartItems.filter((item) => item.productId !== id),
        })),
      resetProducts: () => set({ products: DEFAULT_PRODUCTS }),

      addToCart: (productId, variantId) =>
        set((state) => {
          const product = state.products.find((item) => item.id === productId)
          const variant = product?.variants.find((item) => item.id === variantId)
          if (!product || !variant || !product.available) return state

          const itemId = makeCartItemId(productId, variantId)
          const existing = state.cartItems.find((item) => item.id === itemId)
          if (existing) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item,
              ),
              cartOpen: true,
            }
          }
          return {
            cartItems: [...state.cartItems, { id: itemId, productId, variantId, quantity: 1, note: '' }],
            cartOpen: true,
          }
        }),
      updateCartQuantity: (itemId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item,
          ),
        })),
      updateCartNote: (itemId, note) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) => (item.id === itemId ? { ...item, note } : item)),
        })),
      removeFromCart: (itemId) =>
        set((state) => ({ cartItems: state.cartItems.filter((item) => item.id !== itemId) })),
      clearCart: () => set({ cartItems: [] }),
      setCartOpen: (open) => set({ cartOpen: open }),

      getCartSubtotal: () => calculateCartSubtotal(get().products, get().cartItems),
      createOrder: (info) => {
        const state = get()
        const items = buildOrderItems(state.products, state.cartItems)
        const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
        const order: Order = {
          id: Date.now().toString(),
          customerName: info.customerName.trim(),
          phone: info.phone.replace(/[\s.]/g, ''),
          address: info.address.trim(),
          preferredTime: info.preferredTime.trim(),
          note: info.note.trim(),
          items,
          subtotal,
          status: 'new',
          timestamp: Date.now(),
        }
        set({ orders: [order, ...state.orders], cartItems: [] })
        return order
      },
      clearOrders: () => set({ orders: [] }),
    }),
    {
      name: 'byt-shop-v1',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as Partial<ShopState>
        return {
          products: state.products?.length ? state.products : DEFAULT_PRODUCTS,
          cartItems: state.cartItems ?? [],
          orders: state.orders ?? [],
          cartOpen: false,
        }
      },
    },
  ),
)
```

- [ ] **Step 2: Extend catalog verification to cover store actions**

Append this block inside `try` in `scripts/verify-shop-catalog.mjs` after existing helper assertions:

```js
  const { useShopStore } = await server.ssrLoadModule('/src/store/shopStore.ts')
  const store = useShopStore.getState()
  assert.equal(store.products.length, 6)

  store.clearCart()
  store.addToCart('ginger-shot', 'vang')
  store.addToCart('ginger-shot', 'vang')
  store.addToCart('smoothie', 'no-lau')
  assert.equal(useShopStore.getState().cartItems.length, 2)
  assert.equal(useShopStore.getState().getCartSubtotal(), 149000)

  const order = useShopStore.getState().createOrder({
    customerName: 'Nguyen Van A',
    phone: '0901234567',
    address: '1 Le Loi, Quan 1',
    preferredTime: 'Sang mai',
    note: 'Giao lanh',
  })
  assert.equal(order.items.length, 2)
  assert.equal(order.subtotal, 149000)
  assert.equal(useShopStore.getState().cartItems.length, 0)
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm run verify:shop-catalog
```

Expected:

```text
Shop catalog checks passed.
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build passes with no unused TypeScript symbols.

- [ ] **Step 5: Commit**

```bash
git add src/store/shopStore.ts scripts/verify-shop-catalog.mjs
git commit -m "feat: add persisted shop store"
```

---

### Task 3: Sheet Payloads For Leads And Orders

**Files:**
- Modify: `src/utils/sheets.ts`
- Modify: `src/components/WinnerOverlay.tsx`
- Create: `scripts/verify-sheet-payloads.mjs`
- Modify: `package.json`

- [ ] **Step 1: Update Sheet payload utilities**

Modify `src/utils/sheets.ts` so it exports these types and functions:

```ts
import { type Order, summarizeOrderItems } from './shopCatalog'

export interface SheetLeadPayload {
  type: 'lead'
  name: string
  phone: string
  prize: string
  consent: boolean
  timestamp: number
}

export interface SheetOrderPayload {
  type: 'order'
  customerName: string
  phone: string
  address: string
  preferredTime: string
  note: string
  itemSummary: string
  subtotal: number
  status: string
  timestamp: number
}

export type SheetPayload = SheetLeadPayload | SheetOrderPayload

export function orderToSheetPayload(order: Order): SheetOrderPayload {
  return {
    type: 'order',
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    preferredTime: order.preferredTime,
    note: order.note,
    itemSummary: summarizeOrderItems(order.items),
    subtotal: order.subtotal,
    status: order.status,
    timestamp: order.timestamp,
  }
}

export async function submitPayloadToSheet(url: string, payload: SheetPayload): Promise<boolean> {
  if (!url) return false
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    return true
  } catch {
    return false
  }
}

export async function submitLeadToSheet(url: string, lead: Omit<SheetLeadPayload, 'type'>): Promise<boolean> {
  return submitPayloadToSheet(url, { type: 'lead', ...lead })
}

export async function submitOrderToSheet(url: string, order: Order): Promise<boolean> {
  return submitPayloadToSheet(url, orderToSheetPayload(order))
}
```

- [ ] **Step 2: Keep WinnerOverlay call site compatible**

Verify `src/components/WinnerOverlay.tsx` still calls `submitLeadToSheet` with the existing shape:

```ts
submitLeadToSheet(sheetsUrl, {
  name: cleanName,
  phone: cleanPhone,
  prize: winner.name,
  consent,
  timestamp: Date.now(),
})
```

No `type` is passed by the component; `submitLeadToSheet` adds it.

- [ ] **Step 3: Add payload verification script**

Create `scripts/verify-sheet-payloads.mjs`:

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

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
```

- [ ] **Step 4: Add package script**

Add this script:

```json
"verify:sheet-payloads": "node scripts/verify-sheet-payloads.mjs"
```

- [ ] **Step 5: Run payload verification**

Run:

```bash
npm run verify:sheet-payloads
```

Expected:

```text
Sheet payload checks passed.
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/utils/sheets.ts src/components/WinnerOverlay.tsx scripts/verify-sheet-payloads.mjs
git commit -m "feat: add order sheet payloads"
```

---

### Task 4: Landing And Top-Level Navigation

**Files:**
- Create: `src/components/ScrollReveal.tsx`
- Create: `src/components/BrandLanding.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Create ScrollReveal component**

Create `src/components/ScrollReveal.tsx`:

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
}

export default function ScrollReveal({ children, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${className} reveal-on-scroll ${visible ? 'is-visible' : ''}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Add landing motion CSS**

Append to `src/index.css`:

```css
@layer utilities {
  .reveal-on-scroll {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 520ms ease, transform 520ms ease;
  }

  .reveal-on-scroll.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .marquee-track {
    animation: marquee-track 24s linear infinite;
  }

  .cart-bounce {
    animation: cart-bounce 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }
}

@keyframes marquee-track {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes cart-bounce {
  0% { transform: scale(1); }
  45% { transform: scale(1.14); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll,
  .marquee-track,
  .cart-bounce {
    animation: none !important;
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
```

- [ ] **Step 3: Create BrandLanding component**

Create `src/components/BrandLanding.tsx` with this public API:

```tsx
import { useMemo } from 'react'
import ScrollReveal from './ScrollReveal'
import { useShopStore } from '../store/shopStore'
import { formatVnd } from '../utils/shopCatalog'

interface BrandLandingProps {
  onShop: () => void
  onWheel: () => void
}

export default function BrandLanding({ onShop, onWheel }: BrandLandingProps) {
  const { products, addToCart } = useShopStore()
  const featured = useMemo(() => products.filter((product) => product.featured && product.available).slice(0, 4), [products])

  return (
    <div className="space-y-12 pb-10">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center min-h-[calc(100dvh-96px)]">
        <div className="space-y-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-forest">Bếp Yêu Thương</p>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] text-brand-ink">
            Ăn lành hơn, mỗi ngày dễ hơn.
          </h2>
          <p className="max-w-xl text-base sm:text-lg leading-8 text-brand-muted">
            Đồ uống tươi, sữa hạt, smoothie và set hạt được chuẩn bị tử tế cho những routine bận rộn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onShop} className="rounded-full bg-brand-tomato px-7 py-3.5 font-display text-lg font-extrabold text-white shadow-lift transition-transform hover:-translate-y-0.5 active:translate-y-0">
              Mua ngay
            </button>
            <button onClick={onWheel} className="rounded-full border border-brand-line bg-white/80 px-7 py-3.5 font-display text-lg font-extrabold text-brand-forest shadow-soft transition-colors hover:bg-brand-mint">
              Quay nhận quà
            </button>
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-brand-forest shadow-wheel">
          {featured[0]?.image && <img src={featured[0].image} alt={featured[0].name} className="absolute inset-0 h-full w-full object-cover opacity-90" />}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/70 via-brand-forest/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/88 p-4 backdrop-blur">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-brand-muted">Fresh daily</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-brand-ink">Ginger Shot, sữa hạt, detox và smoothie.</p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-brand-line bg-white/70 py-3">
        <div className="marquee-track flex w-max gap-8 text-sm font-extrabold uppercase tracking-[0.16em] text-brand-forest">
          {Array.from({ length: 2 }).map((_, index) => (
            <span key={index} className="flex gap-8">
              <span>Tươi mỗi ngày</span><span>Ít đường</span><span>Giao nhanh</span><span>Eat clean</span><span>Quà từ vòng quay</span>
            </span>
          ))}
        </div>
      </div>

      <ScrollReveal className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-forest">Sản phẩm nổi bật</p>
            <h3 className="font-display text-3xl font-extrabold text-brand-ink">Chọn nhanh cho hôm nay</h3>
          </div>
          <button onClick={onShop} className="hidden sm:inline-flex rounded-full bg-brand-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-ink">
            Xem tất cả
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => {
            const variant = product.variants[0]
            return (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-brand-line bg-white shadow-soft">
                <div className="aspect-[4/3] overflow-hidden bg-brand-mint">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="space-y-2 p-4">
                  <h4 className="font-display text-xl font-extrabold text-brand-ink">{product.name}</h4>
                  <p className="line-clamp-2 text-sm leading-6 text-brand-muted">{product.description}</p>
                  {variant && (
                    <button onClick={() => addToCart(product.id, variant.id)} className="w-full rounded-full bg-brand-tomato px-4 py-2.5 text-sm font-extrabold text-white transition-transform hover:-translate-y-0.5">
                      Thêm từ {formatVnd(variant.price)}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </ScrollReveal>

      <ScrollReveal className="grid gap-5 rounded-[28px] bg-brand-forest p-6 text-brand-cream sm:grid-cols-[0.9fr_1.1fr] sm:p-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-citrus">Câu chuyện BYT</p>
          <h3 className="mt-2 font-display text-3xl font-extrabold">Chuẩn bị tử tế cho lịch sống bận rộn.</h3>
        </div>
        <p className="text-sm leading-7 text-brand-cream/82">
          Bếp Yêu Thương tập trung vào đồ uống tươi, set hạt và những lựa chọn dễ dùng để khách duy trì routine ăn lành mà không cần quyết tâm quá lớn mỗi ngày.
        </p>
      </ScrollReveal>

      <ScrollReveal className="grid gap-4 sm:grid-cols-3">
        {[
          ['6 nhóm', 'Catalog gọn, dễ chọn'],
          ['24-48h', 'Ưu tiên dùng tươi'],
          ['2 bước', 'Thêm giỏ và gửi đơn'],
        ].map(([number, label]) => (
          <div key={label} className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft">
            <p className="font-display text-4xl font-extrabold text-brand-forest">{number}</p>
            <p className="mt-1 text-sm font-semibold text-brand-muted">{label}</p>
          </div>
        ))}
      </ScrollReveal>

      <ScrollReveal className="rounded-[28px] bg-brand-citrus p-6 text-brand-ink sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-3xl font-extrabold">Sẵn sàng chọn món hôm nay?</h3>
            <p className="mt-1 text-sm font-semibold text-brand-ink/70">Mua nhanh hoặc thử vận may với vòng quay trước khi checkout.</p>
          </div>
          <button onClick={onShop} className="rounded-full bg-brand-ink px-6 py-3 font-display text-base font-extrabold text-white">
            Mua hàng
          </button>
        </div>
      </ScrollReveal>
    </div>
  )
}
```

- [ ] **Step 4: Modify App navigation**

In `src/App.tsx`, add:

```ts
import BrandLanding from './components/BrandLanding'
import Shop from './components/Shop'
import CartDrawer from './components/CartDrawer'
import { useShopStore } from './store/shopStore'
```

Add the tab type near the top:

```ts
type MainTab = 'home' | 'wheel' | 'shop'
```

Inside `App`, add:

```ts
const [activeTab, setActiveTab] = useState<MainTab>('home')
const { cartItems, setCartOpen, getCartSubtotal } = useShopStore()
const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
const cartSubtotal = getCartSubtotal()
```

Replace the current single main layout with conditional rendering:

```tsx
<main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
  {activeTab === 'home' && (
    <BrandLanding onShop={() => setActiveTab('shop')} onWheel={() => setActiveTab('wheel')} />
  )}
  {activeTab === 'wheel' && (
    <div className="flex flex-col items-center">
      <p className="font-display text-2xl sm:text-3xl font-bold text-brand-ink text-center mb-1">Vòng quay may mắn</p>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px w-10 rounded-full bg-brand-leaf/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-brand-citrus" />
        <div className="h-px w-10 rounded-full bg-brand-leaf/60" />
      </div>
      <p className="text-brand-muted text-sm text-center mb-7 max-w-sm text-balance">
        Một lựa chọn tử tế hơn cho cả nhà. Quay để nhận quà từ Bếp Yêu Thương.
      </p>
      <Wheel />
    </div>
  )}
  {activeTab === 'shop' && <Shop />}
</main>
<CartDrawer />
```

In the header, add three tab buttons and a cart button. Use the existing brand header styling and keep the fullscreen button:

```tsx
<nav className="hidden md:flex items-center gap-1 rounded-full bg-brand-cream/[.12] p-1">
  {([
    ['home', 'Trang chủ'],
    ['wheel', 'Vòng quay'],
    ['shop', 'Mua hàng'],
  ] as const).map(([tab, label]) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${activeTab === tab ? 'bg-brand-cream text-brand-forest' : 'text-brand-cream/82 hover:text-brand-cream'}`}
    >
      {label}
    </button>
  ))}
</nav>
<button
  type="button"
  onClick={() => setCartOpen(true)}
  className={`relative rounded-full bg-brand-cream px-4 py-2 text-sm font-extrabold text-brand-forest shadow-soft ${cartCount > 0 ? 'cart-bounce' : ''}`}
  aria-label="Mở giỏ hàng"
>
  Giỏ {cartCount > 0 ? `(${cartCount})` : ''}
  {cartSubtotal > 0 && <span className="ml-2 hidden sm:inline">{new Intl.NumberFormat('vi-VN').format(cartSubtotal)}đ</span>}
</button>
```

- [ ] **Step 5: Create minimal Shop shell**

Create `src/components/Shop.tsx` as a compiling shell so top-level navigation can be verified before the product grid task.

```tsx
export default function Shop() {
  return (
    <section className="rounded-3xl border border-brand-line bg-white p-8 text-center shadow-soft">
      <h2 className="font-display text-3xl font-extrabold text-brand-ink">Mua hàng</h2>
      <p className="mt-2 text-brand-muted">Catalog sản phẩm sẽ được triển khai ở task tiếp theo.</p>
    </section>
  )
}
```

- [ ] **Step 6: Create minimal CartDrawer shell**

Create `src/components/CartDrawer.tsx` as a compiling shell so cart open/close state can be verified before the checkout task.

```tsx
import { useShopStore } from '../store/shopStore'

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useShopStore()
  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-[70] bg-brand-ink/45" onClick={() => setCartOpen(false)}>
      <div className="absolute bottom-0 right-0 top-auto w-full rounded-t-3xl bg-white p-6 shadow-lift sm:bottom-0 sm:top-0 sm:w-[420px] sm:rounded-l-3xl sm:rounded-tr-none" onClick={(event) => event.stopPropagation()}>
        <button onClick={() => setCartOpen(false)} className="mb-4 text-sm font-bold text-brand-muted">Đóng</button>
        <h2 className="font-display text-2xl font-extrabold text-brand-ink">Giỏ hàng</h2>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/index.css src/components/BrandLanding.tsx src/components/ScrollReveal.tsx src/components/Shop.tsx src/components/CartDrawer.tsx
git commit -m "feat: add premium landing navigation"
```

---

### Task 5: Shop Product Grid

**Files:**
- Modify: `src/components/Shop.tsx`

- [ ] **Step 1: Replace Shop shell with product grid**

Replace `src/components/Shop.tsx` with:

```tsx
import { useState } from 'react'
import { useShopStore } from '../store/shopStore'
import { formatVnd, type Product } from '../utils/shopCatalog'

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useShopStore()
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '')
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0]
  const [imgErr, setImgErr] = useState(false)

  return (
    <article className={`group overflow-hidden rounded-2xl border border-brand-line bg-white shadow-soft transition-transform hover:-translate-y-1 ${!product.available ? 'opacity-55' : ''}`}>
      <div className="aspect-[4/3] overflow-hidden bg-brand-mint">
        {product.image && !imgErr ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setImgErr(true)} loading="lazy" decoding="async" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-brand-mint to-brand-citrus/50 font-display text-4xl font-extrabold text-brand-forest">
            BYT
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-forest">{product.category}</p>
          <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight text-brand-ink">{product.name}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-brand-muted">{product.description}</p>
        </div>

        <select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="w-full rounded-xl border border-brand-line bg-brand-inset px-3 py-2.5 text-sm font-semibold text-brand-ink outline-none focus:border-brand-forest">
          {product.variants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - {formatVnd(item.price)}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-brand-muted">Từ</p>
            <p className="font-display text-xl font-extrabold text-brand-forest">{variant ? formatVnd(variant.price) : 'Liên hệ'}</p>
          </div>
          <button
            onClick={() => variant && addToCart(product.id, variant.id)}
            disabled={!product.available || !variant}
            className="rounded-full bg-brand-tomato px-5 py-2.5 text-sm font-extrabold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-brand-line disabled:text-brand-muted"
          >
            {product.available ? 'Thêm' : 'Tạm hết'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Shop() {
  const { products } = useShopStore()
  const available = products.filter((product) => product.available)

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-forest">Menu BYT</p>
          <h2 className="font-display text-4xl font-extrabold text-brand-ink">Mua hàng</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-muted">
            Chọn nhóm sản phẩm, biến thể và thêm vào giỏ. BYT sẽ xác nhận đơn sau khi bạn gửi thông tin nhận hàng.
          </p>
        </div>
        <p className="rounded-full bg-brand-mint px-4 py-2 text-sm font-bold text-brand-forest">
          {available.length} nhóm đang bán
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/Shop.tsx
git commit -m "feat: add shop product grid"
```

---

### Task 6: Cart Drawer And Checkout

**Files:**
- Modify: `src/components/CartDrawer.tsx`

- [ ] **Step 1: Replace CartDrawer shell with cart and checkout flow**

Replace `src/components/CartDrawer.tsx` with:

```tsx
import { useState } from 'react'
import { useShopStore } from '../store/shopStore'
import { formatVnd, getProductById, getVariantById, isValidVNPhone, type CheckoutInfo, type Order } from '../utils/shopCatalog'
import { submitOrderToSheet } from '../utils/sheets'
import { useWheelStore } from '../store/wheelStore'

type CheckoutStep = 'cart' | 'form' | 'success'

const EMPTY_INFO: CheckoutInfo = {
  customerName: '',
  phone: '',
  address: '',
  preferredTime: '',
  note: '',
}

export default function CartDrawer() {
  const {
    products,
    cartItems,
    cartOpen,
    setCartOpen,
    updateCartQuantity,
    updateCartNote,
    removeFromCart,
    getCartSubtotal,
    createOrder,
  } = useShopStore()
  const { sheetsUrl } = useWheelStore()
  const [step, setStep] = useState<CheckoutStep>('cart')
  const [info, setInfo] = useState<CheckoutInfo>(EMPTY_INFO)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutInfo, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)

  if (!cartOpen) return null

  const subtotal = getCartSubtotal()

  function close() {
    setCartOpen(false)
    setTimeout(() => {
      setStep('cart')
      setInfo(EMPTY_INFO)
      setErrors({})
      setSubmitting(false)
      setLastOrder(null)
    }, 250)
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof CheckoutInfo, string>> = {}
    if (!info.customerName.trim()) nextErrors.customerName = 'Vui lòng nhập họ tên'
    if (!isValidVNPhone(info.phone)) nextErrors.phone = 'Số điện thoại chưa hợp lệ'
    if (!info.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ nhận hàng'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function submitOrder() {
    if (submitting || cartItems.length === 0 || !validate()) return
    setSubmitting(true)
    const order = createOrder(info)
    setLastOrder(order)
    if (sheetsUrl) {
      await submitOrderToSheet(sheetsUrl, order)
    }
    setSubmitting(false)
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-[70] bg-brand-ink/55 backdrop-blur-sm animate-fade-in" onClick={close}>
      <aside className="absolute bottom-0 right-0 top-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift sm:bottom-0 sm:top-0 sm:max-h-none sm:w-[440px] sm:rounded-l-3xl sm:rounded-tr-none" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-forest">BYT Shop</p>
            <h2 className="font-display text-2xl font-extrabold text-brand-ink">
              {step === 'cart' ? 'Giỏ hàng' : step === 'form' ? 'Thông tin nhận hàng' : 'Đã nhận đơn'}
            </h2>
          </div>
          <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-brand-mint text-brand-forest hover:bg-brand-line" aria-label="Đóng giỏ hàng">
            ×
          </button>
        </div>

        {step === 'cart' && (
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="rounded-2xl bg-brand-inset p-6 text-center text-sm text-brand-muted">Giỏ hàng đang trống.</div>
            ) : (
              cartItems.map((item) => {
                const product = getProductById(products, item.productId)
                const variant = getVariantById(product, item.variantId)
                if (!product || !variant) return null
                return (
                  <div key={item.id} className="rounded-2xl border border-brand-line bg-brand-inset p-3">
                    <div className="flex gap-3">
                      <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-extrabold leading-tight text-brand-ink">{product.name}</p>
                        <p className="text-sm font-semibold text-brand-muted">{variant.name} · {formatVnd(variant.price)}</p>
                        <p className="mt-1 text-sm font-extrabold text-brand-forest">{formatVnd(variant.price * item.quantity)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="self-start text-xs font-bold text-brand-muted hover:text-brand-tomato">Xóa</button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full bg-white font-bold text-brand-forest">-</button>
                      <span className="w-8 text-center text-sm font-extrabold">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full bg-white font-bold text-brand-forest">+</button>
                      <input value={item.note} onChange={(event) => updateCartNote(item.id, event.target.value)} placeholder="Ghi chú món" className="min-w-0 flex-1 rounded-xl border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-forest" />
                    </div>
                  </div>
                )
              })
            )}

            <div className="rounded-2xl bg-brand-forest p-4 text-brand-cream">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Tạm tính</span>
                <span className="font-display text-2xl font-extrabold">{formatVnd(subtotal)}</span>
              </div>
              <button onClick={() => setStep('form')} disabled={cartItems.length === 0} className="mt-4 w-full rounded-full bg-brand-tomato py-3 font-display text-lg font-extrabold text-white disabled:opacity-50">
                Checkout
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-3">
            {([
              ['customerName', 'Họ tên'],
              ['phone', 'Số điện thoại'],
              ['address', 'Địa chỉ nhận hàng'],
              ['preferredTime', 'Thời gian nhận'],
            ] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-bold text-brand-muted">{label}</span>
                <input
                  value={info[key]}
                  onChange={(event) => {
                    setInfo((current) => ({ ...current, [key]: event.target.value }))
                    setErrors((current) => ({ ...current, [key]: undefined }))
                  }}
                  className={`w-full rounded-xl border bg-brand-inset px-4 py-3 text-sm outline-none ${errors[key] ? 'border-brand-tomato' : 'border-brand-line focus:border-brand-forest'}`}
                />
                {errors[key] && <span className="mt-1 block text-xs font-semibold text-brand-tomato">{errors[key]}</span>}
              </label>
            ))}

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-brand-muted">Ghi chú</span>
              <textarea value={info.note} onChange={(event) => setInfo((current) => ({ ...current, note: event.target.value }))} rows={3} className="w-full rounded-xl border border-brand-line bg-brand-inset px-4 py-3 text-sm outline-none focus:border-brand-forest" />
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep('cart')} className="flex-1 rounded-full bg-brand-mint py-3 font-bold text-brand-forest">Quay lại</button>
              <button onClick={submitOrder} disabled={submitting} className="flex-1 rounded-full bg-brand-tomato py-3 font-display text-base font-extrabold text-white disabled:opacity-60">
                {submitting ? 'Đang gửi...' : 'Gửi đơn'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && lastOrder && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-mint p-5 text-center">
              <p className="font-display text-3xl font-extrabold text-brand-forest">Cảm ơn bạn!</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">Đơn đã được lưu trong app. Nếu đã cấu hình Google Sheet, yêu cầu đồng bộ đơn cũng đã được gửi.</p>
            </div>
            <div className="rounded-2xl border border-brand-line p-4">
              <p className="text-sm font-bold text-brand-muted">Tạm tính</p>
              <p className="font-display text-3xl font-extrabold text-brand-ink">{formatVnd(lastOrder.subtotal)}</p>
              <p className="mt-2 text-sm text-brand-muted">{lastOrder.items.length} dòng sản phẩm · {new Date(lastOrder.timestamp).toLocaleString('vi-VN')}</p>
            </div>
            <button onClick={close} className="w-full rounded-full bg-brand-forest py-3 font-display text-lg font-extrabold text-white">Hoàn tất</button>
          </div>
        )}
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Run payload and catalog verification**

Run:

```bash
npm run verify:shop-catalog
npm run verify:sheet-payloads
```

Expected:

```text
Shop catalog checks passed.
Sheet payload checks passed.
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/CartDrawer.tsx
git commit -m "feat: add cart checkout drawer"
```

---

### Task 7: Admin Shop And Orders Sections

**Files:**
- Create: `src/components/admin/ProductAdminSection.tsx`
- Create: `src/components/admin/OrdersAdminSection.tsx`
- Modify: `src/components/AdminPanel.tsx`

- [ ] **Step 1: Create ProductAdminSection**

Create `src/components/admin/ProductAdminSection.tsx`:

```tsx
import { useState } from 'react'
import { useShopStore } from '../../store/shopStore'
import { type Product, type ProductVariant, formatVnd } from '../../utils/shopCatalog'

const EMPTY_PRODUCT: Product = {
  id: '',
  name: '',
  category: '',
  description: '',
  audience: '',
  storageNote: '',
  image: '',
  featured: false,
  available: true,
  variants: [{ id: 'default', name: 'Mặc định', price: 1000, unit: 'phần' }],
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProductAdminSection() {
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } = useShopStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Product>(EMPTY_PRODUCT)

  function startEdit(product: Product) {
    setEditingId(product.id)
    setDraft(product)
  }

  function startAdd() {
    setEditingId('new')
    setDraft({ ...EMPTY_PRODUCT, id: `product-${Date.now()}` })
  }

  function save() {
    const normalized: Product = {
      ...draft,
      id: draft.id || slugify(draft.name) || `product-${Date.now()}`,
      name: draft.name.trim() || 'Sản phẩm',
      category: draft.category.trim() || 'BYT',
      variants: draft.variants.map((variant) => ({
        ...variant,
        id: variant.id || slugify(variant.name) || `variant-${Date.now()}`,
        name: variant.name.trim() || 'Mặc định',
        price: Math.max(1000, Number(variant.price) || 1000),
        unit: variant.unit.trim() || 'phần',
      })),
    }
    if (editingId === 'new') addProduct(normalized)
    else updateProduct(normalized.id, normalized)
    setEditingId(null)
    setDraft(EMPTY_PRODUCT)
  }

  function updateVariant(index: number, updates: Partial<ProductVariant>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => (i === index ? { ...variant, ...updates } : variant)),
    }))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-cocoa-900">Sản phẩm ({products.length})</h3>
        <div className="flex gap-2">
          <button onClick={startAdd} className="rounded-lg bg-sage-600 px-3 py-1.5 text-xs font-bold text-cream-50">Thêm</button>
          <button onClick={resetProducts} className="rounded-lg bg-cream-200 px-3 py-1.5 text-xs font-semibold text-cocoa-700">Reset</button>
        </div>
      </div>

      {editingId && (
        <div className="space-y-2 rounded-2xl bg-cream-100 p-3">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Tên sản phẩm" className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-sage-500" />
          <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Danh mục" className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-sage-500" />
          <input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="URL ảnh" className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-sage-500" />
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Mô tả" rows={2} className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-sage-500" />
          <label className="flex items-center gap-2 text-xs font-semibold text-cocoa-700">
            <input type="checkbox" checked={draft.available} onChange={(event) => setDraft({ ...draft, available: event.target.checked })} className="accent-sage-600" />
            Còn bán
          </label>

          <div className="space-y-2">
            {draft.variants.map((variant, index) => (
              <div key={`${variant.id}-${index}`} className="grid grid-cols-[1fr_86px_64px] gap-2">
                <input value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} placeholder="Biến thể" className="rounded-lg border border-cream-300 bg-cream-50 px-2 py-2 text-xs outline-none" />
                <input value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} type="number" className="rounded-lg border border-cream-300 bg-cream-50 px-2 py-2 text-xs outline-none" />
                <input value={variant.unit} onChange={(event) => updateVariant(index, { unit: event.target.value })} placeholder="Đơn vị" className="rounded-lg border border-cream-300 bg-cream-50 px-2 py-2 text-xs outline-none" />
              </div>
            ))}
            <button onClick={() => setDraft((current) => ({ ...current, variants: [...current.variants, { id: `variant-${Date.now()}`, name: 'Mới', price: 1000, unit: 'phần' }] }))} className="text-xs font-bold text-sage-700">+ Thêm biến thể</button>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setEditingId(null)} className="rounded-lg bg-cream-200 px-3 py-2 text-xs font-semibold text-cocoa-700">Hủy</button>
            <button onClick={save} className="rounded-lg bg-sage-600 px-3 py-2 text-xs font-bold text-cream-50">Lưu</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl bg-cream-100 p-3">
            <div className="flex items-center gap-3">
              <img src={product.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-cocoa-900">{product.name}</p>
                <p className="text-xs text-cocoa-500">{product.variants.length} biến thể · từ {formatVnd(Math.min(...product.variants.map((variant) => variant.price)))}</p>
              </div>
              <button onClick={() => updateProduct(product.id, { available: !product.available })} className="rounded-lg bg-cream-200 px-2 py-1.5 text-xs font-semibold text-cocoa-700">{product.available ? 'Đang bán' : 'Ẩn'}</button>
              <button onClick={() => startEdit(product)} className="rounded-lg bg-cream-200 px-2 py-1.5 text-xs font-semibold text-cocoa-700">Sửa</button>
              <button onClick={() => deleteProduct(product.id)} className="rounded-lg bg-clay-300/40 px-2 py-1.5 text-xs font-semibold text-clay-600">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create OrdersAdminSection**

Create `src/components/admin/OrdersAdminSection.tsx`:

```tsx
import { useShopStore } from '../../store/shopStore'
import { formatVnd, summarizeOrderItems } from '../../utils/shopCatalog'

export default function OrdersAdminSection() {
  const { orders, clearOrders } = useShopStore()

  function exportOrders() {
    const esc = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Thời gian', 'Họ tên', 'SĐT', 'Địa chỉ', 'Thời gian nhận', 'Sản phẩm', 'Tạm tính', 'Ghi chú', 'Trạng thái'],
      ...orders.map((order) => [
        new Date(order.timestamp).toLocaleString('vi-VN'),
        order.customerName,
        "'" + order.phone,
        order.address,
        order.preferredTime,
        summarizeOrderItems(order.items),
        order.subtotal,
        order.note,
        order.status,
      ]),
    ]
    const csv = rows.map((row) => row.map(esc).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'don-hang-byt.csv'
    a.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold text-cocoa-900">Đơn hàng ({orders.length})</h3>
        <div className="flex gap-2">
          <button onClick={exportOrders} disabled={orders.length === 0} className="rounded-lg bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700 disabled:opacity-50">Xuất CSV</button>
          <button onClick={clearOrders} disabled={orders.length === 0} className="rounded-lg bg-clay-300/40 px-3 py-1.5 text-xs font-semibold text-clay-600 disabled:opacity-50">Xóa</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl bg-cream-100 p-4 text-center text-sm text-cocoa-500">Chưa có đơn hàng local.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-cream-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-cocoa-900">{order.customerName} · {order.phone}</p>
                  <p className="text-xs text-cocoa-500">{order.items.length} dòng · {order.preferredTime || 'Chưa hẹn giờ'}</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-sage-700">{formatVnd(order.subtotal)}</p>
              </div>
              <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-cocoa-500">{summarizeOrderItems(order.items)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add admin tab state to AdminPanel**

In `src/components/AdminPanel.tsx`, add imports:

```ts
import ProductAdminSection from './admin/ProductAdminSection'
import OrdersAdminSection from './admin/OrdersAdminSection'
```

Add type and state:

```ts
type AdminTab = 'prizes' | 'products' | 'orders' | 'sheet'
const [adminTab, setAdminTab] = useState<AdminTab>('prizes')
```

Place this tab strip after the panel title/header:

```tsx
<div className="grid grid-cols-4 gap-1 rounded-2xl bg-cream-100 p-1">
  {([
    ['prizes', 'Quà'],
    ['products', 'SP'],
    ['orders', 'Đơn'],
    ['sheet', 'Sheet'],
  ] as const).map(([tab, label]) => (
    <button
      key={tab}
      type="button"
      onClick={() => setAdminTab(tab)}
      className={`rounded-xl px-2 py-2 text-xs font-bold transition-colors ${adminTab === tab ? 'bg-sage-600 text-cream-50' : 'text-cocoa-500 hover:bg-cream-200'}`}
    >
      {label}
    </button>
  ))}
</div>
```

Wrap the existing prize list/add/winners blocks in:

```tsx
{adminTab === 'prizes' && (
  <>
    {/* existing prize list, add form, and winners section stay here */}
  </>
)}
```

Wrap the existing Google Sheet sync block in:

```tsx
{adminTab === 'sheet' && (
  <>
    {/* existing Google Sheet sync block stays here */}
  </>
)}
```

Insert product and order tabs:

```tsx
{adminTab === 'products' && <ProductAdminSection />}
{adminTab === 'orders' && <OrdersAdminSection />}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdminPanel.tsx src/components/admin/ProductAdminSection.tsx src/components/admin/OrdersAdminSection.tsx
git commit -m "feat: add shop admin sections"
```

---

### Task 8: Google Sheets Setup Documentation

**Files:**
- Modify: `GOOGLE_SHEETS_SETUP.md`

- [ ] **Step 1: Replace Apps Script sample with dual payload script**

In `GOOGLE_SHEETS_SETUP.md`, replace the current `doPost` code block with:

```javascript
function getOrCreateSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.postData.contents);
    var time = data.timestamp ? new Date(data.timestamp) : new Date();

    if (data.type === 'order') {
      var orderSheet = getOrCreateSheet_('Đơn hàng', [
        'Thời gian',
        'Họ tên',
        'SĐT',
        'Địa chỉ',
        'Thời gian nhận',
        'Sản phẩm',
        'Tạm tính',
        'Ghi chú',
        'Trạng thái'
      ]);
      orderSheet.appendRow([
        time,
        data.customerName || '',
        "'" + (data.phone || ''),
        data.address || '',
        data.preferredTime || '',
        data.itemSummary || '',
        data.subtotal || 0,
        data.note || '',
        data.status || 'new'
      ]);
    } else {
      var leadSheet = getOrCreateSheet_('Lead vòng quay', [
        'Thời gian',
        'Họ tên',
        'SĐT',
        'Giải thưởng',
        'Đồng ý nhận tin'
      ]);
      leadSheet.appendRow([
        time,
        data.name || '',
        "'" + (data.phone || ''),
        data.prize || '',
        data.consent ? 'Có' : 'Không'
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 2: Add a note about `no-cors` order sync**

Add this paragraph near the notes:

```md
- App gửi lead và đơn hàng bằng `mode: 'no-cors'`, nên trình duyệt không đọc được phản hồi thật từ Apps Script. Nếu URL đúng, Apps Script sẽ ghi dòng mới; nếu mạng hoặc endpoint lỗi, dữ liệu vẫn còn trong admin local để xuất CSV.
```

- [ ] **Step 3: Run documentation grep**

Run:

```bash
rg -n "Đơn hàng|Lead vòng quay|data.type === 'order'|no-cors" GOOGLE_SHEETS_SETUP.md
```

Expected: all four patterns are found.

- [ ] **Step 4: Commit**

```bash
git add GOOGLE_SHEETS_SETUP.md
git commit -m "docs: document order sheet sync"
```

---

### Task 9: Final Verification

**Files:**
- Modify only if verification reveals a concrete defect.

- [ ] **Step 1: Run all scripted checks**

Run:

```bash
npm run verify:shop-catalog
npm run verify:sheet-payloads
node scripts/verify-prize-catalog.mjs
node scripts/verify-wheel-product-hover.mjs
node scripts/verify-private-admin-layout.mjs
```

Expected:

```text
Shop catalog checks passed.
Sheet payload checks passed.
Wheel product hover and short-label checks passed.
Private admin layout and doubled wheel segment checks passed.
```

`verify-prize-catalog.mjs` has no success log today; it should exit with code 0.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Browser check desktop**

Open the dev URL and verify:

- `Trang chủ` shows the premium hero, marquee, featured products, story, proof, and CTA.
- Header tab buttons switch between `Trang chủ`, `Vòng quay`, and `Mua hàng`.
- `Mua hàng` shows six product groups.
- Adding an item opens or updates the cart.
- Cart quantity controls update subtotal.
- Checkout rejects blank name, invalid phone, and blank address.
- Valid checkout creates the success screen and clears cart.
- Admin panel opens, unlocks with the existing password, and shows `Quà`, `SP`, `Đơn`, `Sheet` tabs.

- [ ] **Step 5: Browser check mobile**

Resize to a mobile viewport around `390x844` and verify:

- Header text and buttons do not overlap.
- Landing hero media is not cropped in a way that hides the product signal.
- Product cards fit one column.
- Cart drawer is usable from the bottom.
- Admin panel fits within viewport height and scrolls.

- [ ] **Step 6: Stop dev server**

Stop the Vite process with `Ctrl+C`.

- [ ] **Step 7: Final status**

Run:

```bash
git status --short
```

Expected: no uncommitted files except intentional changes from verification fixes.

- [ ] **Step 8: Commit verification fixes if needed**

If Step 7 shows files changed due to concrete fixes, commit them:

```bash
git add <changed-files>
git commit -m "fix: polish brand shop verification"
```

If Step 7 is clean, do not create an empty commit.
