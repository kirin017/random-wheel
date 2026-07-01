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
    const safeVariants = draft.variants.length
      ? draft.variants
      : EMPTY_PRODUCT.variants
    const normalized: Product = {
      ...draft,
      id: draft.id || slugify(draft.name) || `product-${Date.now()}`,
      name: draft.name.trim() || 'Sản phẩm',
      category: draft.category.trim() || 'BYT',
      variants: safeVariants.map((variant) => ({
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

  function removeVariant(index: number) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.length <= 1
        ? current.variants
        : current.variants.filter((_, i) => i !== index),
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
              <div key={`${variant.id}-${index}`} className="grid grid-cols-[1fr_86px_64px_38px] gap-2">
                <input value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} placeholder="Biến thể" className="rounded-lg border border-cream-300 bg-cream-50 px-2 py-2 text-xs outline-none" />
                <input value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} type="number" className="rounded-lg border border-cream-300 bg-cream-50 px-2 py-2 text-xs outline-none" />
                <input value={variant.unit} onChange={(event) => updateVariant(index, { unit: event.target.value })} placeholder="Đơn vị" className="rounded-lg border border-cream-300 bg-cream-50 px-2 py-2 text-xs outline-none" />
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={draft.variants.length <= 1}
                  className="rounded-lg bg-clay-300/40 text-xs font-bold text-clay-600 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Xóa biến thể ${variant.name || index + 1}`}
                  title="Xóa biến thể"
                >
                  ×
                </button>
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
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
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
