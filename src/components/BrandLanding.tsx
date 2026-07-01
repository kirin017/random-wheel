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
