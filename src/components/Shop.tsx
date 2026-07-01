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
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
            loading="lazy"
            decoding="async"
          />
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

        <select
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          className="w-full rounded-xl border border-brand-line bg-brand-inset px-3 py-2.5 text-sm font-semibold text-brand-ink outline-none focus:border-brand-forest"
        >
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
