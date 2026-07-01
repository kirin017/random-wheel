# Brand Shop Design

Date: 2026-07-01

## Goal

Turn the current Bep Yeu Thuong prize-wheel app into a premium conversion-focused brand shopping site while preserving the wheel experience.

The first version should:

- Add a high-end landing page for the brand.
- Add a separate shopping tab with catalog, variants, cart, and checkout.
- Keep the wheel as its own tab and keep prize logic separate from shop logic.
- Store orders locally and sync order payloads to Google Sheets through the existing Apps Script approach.
- Let admin manage products and view/export orders.

The first version will not include online payment, user accounts, external inventory APIs, or a full backend.

## Selected Approach

Use a Vite/React single-page app extension of the current codebase.

The app will use three top-level client-side tabs:

1. `Trang chủ`
2. `Vòng quay`
3. `Mua hàng`

No router is needed for the first version. The active tab will be held in React state in `App.tsx`; catalog, cart, and order state will live in a Zustand store. This keeps the scope small and fits the existing booth/event app.

## Landing Page

The selected visual direction is **Premium Conversion** with a **Balanced Premium** section stack.

Sections:

1. Hero with real product imagery, brand headline, and two CTAs: `Mua ngay` and `Quay nhận quà`.
2. Benefit marquee, for example: fresh daily, low sugar, fast delivery, clean eating.
3. Featured product strip using premium product cards.
4. Short brand story section about fresh preparation and caring, healthy routines.
5. Trust/proof section with concise metrics or claims that the brand can stand behind.
6. Final CTA band leading to checkout/shop.

Motion should be purposeful and light:

- Hero reveal on first render.
- Section fade/slide when scrolled into view.
- Product card lift, image zoom, and quick-add reveal on hover.
- Cart badge bounce when an item is added.
- Drawer transitions for cart and checkout.
- CSS smooth scroll.

Do not add GSAP, Lenis, Three.js, or video in the first version. The current app should remain fast and mobile-friendly.

## Catalog

Create a separate shop catalog model instead of reusing `Prize`.

Source material:

- Google Sheet: `FINAL_BYT_DANH MỤC SẢN PHẨM KÈM ẢNH & GIÁ & CHÍNH SÁCH`
- Spreadsheet ID: `1sisaPBk6rqFBCU-C1L-yXjHR_7lCV95KaB2DQuALbQY`
- Main product tab: `DANH MỤC SP & GIÁ`
- Image folder: `https://drive.google.com/drive/folders/1azyAHpAPzReygVpwyP0qRgJIKJ6W4PBi`
- Menu image subfolder: `https://drive.google.com/drive/folders/1CiXLKeUPxDpVF0HpX916zSTYjgNpHGUT`

The first version uses six default product groups:

1. Ginger Shot
2. Detox / lộ trình
3. Nước ép
4. Sữa hạt
5. Smoothie
6. Hạt lành

Each product group has a small set of variants so the cart total is meaningful without importing the entire spreadsheet.

Initial default variants:

- Ginger Shot: Vàng, Xanh, Cam, Đỏ, Hồng at `35.000`.
- Detox / lộ trình: Chạm lành Tam thanh `156.000`, Chạm lành Lục sắc `282.000`, Thanh thể Nhẹ bụng `900.000`, Hòa vị An nhiên `1.490.000`, Dưỡng nguyên Tươi nhuận `5.790.000`, Trường xuân Rực rỡ `6.359.000`.
- Nước ép: Táo xanh thanh lọc `55.000`, Tỉnh táo cần tây `50.000`, Kale thanh lọc `55.000`, Hồng xuân dền cam `55.000`, Dưa hấu bạc hà `50.000`.
- Sữa hạt: Daily 250 ml `25.000`, Daily 330 ml `30.000`, Cao cấp `65.000`.
- Smoothie: Smoothie hoa quả `69.000`, Smoothie no lâu `79.000`.
- Hạt lành: Set 7 ngày chưa sơ chế `105.000`, Set 14 ngày chưa sơ chế `196.000`, Set 30 ngày chưa sơ chế `390.000`, Set 7 ngày sẵn sàng `210.000`, Set 14 ngày sẵn sàng `392.000`.

Representative image IDs from Drive:

- Ginger Shot: `14Sw6OqnKCLuzzSctN_MTpOYpqLxY-zN7`
- Detox: `1gV4hUF1zKQ8YlJylEGTqOV3oYeqzWpq5`
- Nước ép: `15cpv22xS5CDCitdMvuKZ-atqybupgWMd`
- Sữa hạt: `1eQZr-Biucevy52dPTO2dygL5FE2uYHiK`
- Smoothie: `1eMgxarXNiVrAv_KORItsR4ZIwbhw8zIw`
- Hạt lành: `10wyv6CnpIckdDnrlJI1THDROL6doaKdy`

The admin can edit names, descriptions, images, availability, variants, and prices locally after the defaults load.

## Data Model

`Product`:

- `id`
- `name`
- `category`
- `description`
- `audience`
- `storageNote`
- `image`
- `featured`
- `available`
- `variants`

`ProductVariant`:

- `id`
- `name`
- `price`
- `unit`
- `description`

`CartItem`:

- `productId`
- `variantId`
- `quantity`
- `note`

`Order`:

- `id`
- `customerName`
- `phone`
- `address`
- `preferredTime`
- `note`
- `items`
- `subtotal`
- `status`
- `timestamp`

Order status starts as `new`. The first version does not need a full order status workflow.

## Cart And Checkout

The `Mua hàng` tab shows the six catalog groups as product cards with variant selection and quick add.

Cart behavior:

- Add selected variant to cart.
- Increase or decrease quantity.
- Remove item.
- Edit item note.
- Show subtotal.
- Persist cart in local storage.
- Disable add-to-cart for unavailable products.

Checkout fields:

- Họ tên
- Số điện thoại
- Địa chỉ
- Thời gian nhận
- Ghi chú

Validation:

- Name is required.
- Vietnamese phone format follows the existing `0` + 9 digits rule.
- Address is required.
- Quantity cannot go below 1.
- Submit button is disabled while submitting to prevent duplicate orders.

After checkout:

1. Save the order locally.
2. Send the order to Google Sheets if a Sheet URL is configured.
3. Clear the cart after local save succeeds.
4. Show a success screen with order summary.

Because the existing Google Apps Script integration uses `no-cors`, the app cannot verify the actual Sheet response. The UI should say the order was saved locally and the sync request was sent, not that Google Sheet definitely accepted it.

## Google Sheets Sync

Keep the existing Apps Script Web App URL setting.

Extend payloads with a `type` field:

- `type: "lead"` for prize-wheel lead capture.
- `type: "order"` for checkout orders.

The Apps Script should write to separate tabs:

- Lead/wheel tab: timestamp, name, phone, prize, consent.
- Order tab: timestamp, customer name, phone, address, preferred time, item summary, subtotal, note, status.

If the Sheet URL is blank or sync fails, the local order list remains the backup and can be exported as CSV.

## Admin

Extend the existing admin panel with internal tabs:

1. `Giải thưởng`
2. `Sản phẩm`
3. `Đơn hàng`
4. `Google Sheet`

`Giải thưởng` keeps the current prize management behavior.

`Sản phẩm` manages the local catalog:

- Add product.
- Edit product.
- Delete product.
- Toggle availability.
- Edit image URL.
- Edit description and notes.
- Add, edit, and remove variants.

`Đơn hàng` shows local checkout orders:

- Customer name and phone.
- Item count and subtotal.
- Preferred receive time.
- Order timestamp.
- Export CSV.
- Clear local orders.

`Google Sheet` keeps the current Sheet URL controls and adds a test order sync action.

## Error Handling

- Product images fall back to a gradient or emoji-like fallback visual.
- Missing product image does not block checkout.
- Products marked unavailable cannot be added to cart.
- Cart drawer handles empty state.
- Checkout validates required fields before submit.
- Sheet sync failure does not delete local orders.
- Persisted state uses versioned migrations so existing prize and winner data is not broken.
- Existing `Prize` and `Winner` models remain separate from shop models.

## Testing And Verification

Run the existing project build:

- `npm run build`

Add focused verification scripts:

- Default catalog includes six product groups.
- Each product has at least one available variant with a positive numeric price.
- Cart subtotal is calculated from selected variant price and quantity.
- Checkout payload includes `type: "order"` and all required customer fields.
- Lead payload includes `type: "lead"` before sending.

Browser verification:

- Desktop and mobile landing page.
- Shop tab product cards and quick add.
- Cart drawer quantity changes and subtotal.
- Checkout validation and success screen.
- Admin product management.
- Admin order CSV export.
- Wheel tab still spins and captures lead.

## Out Of Scope

- Online payment.
- Customer accounts.
- Server-side order database.
- Real inventory reservation.
- Automatic full import from Google Sheets.
- Full status lifecycle for orders.
- Heavy animation libraries.

## Acceptance Criteria

- The app opens as a premium brand shopping website with a landing page, wheel tab, and shop tab.
- Users can add variants to a cart and submit an order with the selected checkout fields.
- Orders are saved locally and sent to Google Sheets with `type: "order"` when configured.
- Admin can manage products and view/export local orders.
- The existing wheel prize flow still works.
- The app builds successfully.
