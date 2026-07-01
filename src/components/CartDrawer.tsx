import { useShopStore } from '../store/shopStore'

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useShopStore()
  if (!cartOpen) return null

  return (
    <div className="fixed inset-0 z-[70] bg-brand-ink/45" onClick={() => setCartOpen(false)}>
      <div
        className="absolute bottom-0 right-0 top-auto w-full rounded-t-3xl bg-white p-6 shadow-lift sm:bottom-0 sm:top-0 sm:w-[420px] sm:rounded-l-3xl sm:rounded-tr-none"
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={() => setCartOpen(false)} className="mb-4 text-sm font-bold text-brand-muted">
          Đóng
        </button>
        <h2 className="font-display text-2xl font-extrabold text-brand-ink">Giỏ hàng</h2>
      </div>
    </div>
  )
}
