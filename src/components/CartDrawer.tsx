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
      <aside
        className="absolute bottom-0 right-0 top-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift sm:bottom-0 sm:top-0 sm:max-h-none sm:w-[440px] sm:rounded-l-3xl sm:rounded-tr-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-forest">BYT Shop</p>
            <h2 className="font-display text-2xl font-extrabold text-brand-ink">
              {step === 'cart' ? 'Giỏ hàng' : step === 'form' ? 'Thông tin nhận hàng' : 'Đã nhận đơn'}
            </h2>
          </div>
          <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-brand-mint text-brand-forest hover:bg-brand-line" aria-label="Đóng giỏ hàng">
            x
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
                      <button onClick={() => removeFromCart(item.id)} className="self-start text-xs font-bold text-brand-muted hover:text-brand-tomato" aria-label={`Xóa ${product.name} khỏi giỏ`}>Xóa</button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full bg-white font-bold text-brand-forest" aria-label={`Giảm số lượng ${product.name}`}>-</button>
                      <span className="w-8 text-center text-sm font-extrabold">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full bg-white font-bold text-brand-forest" aria-label={`Tăng số lượng ${product.name}`}>+</button>
                      <input
                        value={item.note}
                        onChange={(event) => updateCartNote(item.id, event.target.value)}
                        placeholder="Ghi chú món"
                        aria-label={`Ghi chú cho ${product.name}`}
                        className="min-w-0 flex-1 rounded-xl border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-forest"
                      />
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
