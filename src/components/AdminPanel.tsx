import { useState } from 'react'
import { useWheelStore, type Prize } from '../store/wheelStore'
import { submitLeadToSheet } from '../utils/sheets'
import { BRAND_COLORS } from '../utils/brandPalette'
import ProductAdminSection from './admin/ProductAdminSection'
import OrdersAdminSection from './admin/OrdersAdminSection'

const ADMIN_PASSWORD = 'admin123'

const PRESET_COLORS = [
  BRAND_COLORS.tomato, BRAND_COLORS.forest, BRAND_COLORS.leaf, BRAND_COLORS.citrus, BRAND_COLORS.ink,
  BRAND_COLORS.lineStrong, BRAND_COLORS.muted, BRAND_COLORS.tomatoDark, BRAND_COLORS.mint, BRAND_COLORS.cream,
]

const EMOJIS = ['🥇', '🥈', '🥉', '🎁', '🌿', '🍵', '🥗', '🍯', '🧺', '💚', '🥭', '🍶', '🥛', '🥤', '🍊', '⚡']

type AdminTab = 'prizes' | 'products' | 'orders' | 'sheet'

interface PrizeFormData {
  name: string
  color: string
  quantity: string
  weight: string
  emoji: string
  image: string
}

const EMPTY_FORM: PrizeFormData = { name: '', color: BRAND_COLORS.forest, quantity: '1', weight: '10', emoji: '🎁', image: '' }

function PrizeThumbSmall({ src, emoji, color }: { src?: string; emoji: string; color: string }) {
  const [err, setErr] = useState(false)
  if (src && !err) {
    return (
      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-cream-300">
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} decoding="async" loading="lazy" />
      </div>
    )
  }
  return (
    <span className="w-8 h-8 rounded-full grid place-items-center text-base shrink-0" style={{ background: `${color}24` }}>
      {emoji}
    </span>
  )
}

export default function AdminPanel() {
  const {
    prizes, addPrize, updatePrize, deletePrize,
    winners, clearWinners,
    adminUnlocked, setAdminUnlocked,
    soundEnabled, setSoundEnabled,
    sheetsUrl, setSheetsUrl,
  } = useWheelStore()

  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<PrizeFormData>(EMPTY_FORM)
  const [showAddForm, setShowAddForm] = useState(false)
  const [sheetDraft, setSheetDraft] = useState(sheetsUrl)
  const [sheetTest, setSheetTest] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [panelOpen, setPanelOpen] = useState(adminUnlocked)
  const [adminTab, setAdminTab] = useState<AdminTab>('prizes')

  async function testSheet() {
    if (!sheetDraft.trim()) return
    setSheetsUrl(sheetDraft)
    setSheetTest('sending')
    await submitLeadToSheet(sheetDraft.trim(), {
      name: 'Khách thử nghiệm',
      phone: '0900000000',
      prize: '🧪 Gửi thử kết nối',
      consent: true,
      timestamp: Date.now(),
    })
    setSheetTest('sent')
    setTimeout(() => setSheetTest('idle'), 4000)
  }

  function unlock() {
    if (password === ADMIN_PASSWORD) {
      setAdminUnlocked(true)
      setPanelOpen(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  function lock() {
    setAdminUnlocked(false)
    setPanelOpen(false)
    setPassword('')
    setPwError(false)
  }

  function startEdit(prize: Prize) {
    setEditing(prize.id)
    setForm({
      name: prize.name,
      color: prize.color,
      quantity: prize.quantity.toString(),
      weight: prize.weight.toString(),
      emoji: prize.emoji,
      image: prize.image ?? '',
    })
    setShowAddForm(false)
  }

  function saveEdit() {
    if (!editing) return
    updatePrize(editing, {
      name: form.name.trim() || 'Giải thưởng',
      color: form.color,
      quantity: parseInt(form.quantity) || -1,
      weight: Math.max(1, parseInt(form.weight) || 10),
      emoji: form.emoji,
      image: form.image.trim() || undefined,
    })
    setEditing(null)
  }

  function handleAdd() {
    addPrize({
      name: form.name.trim() || 'Giải thưởng',
      color: form.color,
      quantity: parseInt(form.quantity) || -1,
      weight: Math.max(1, parseInt(form.weight) || 10),
      emoji: form.emoji,
      image: form.image.trim() || undefined,
    })
    setForm(EMPTY_FORM)
    setShowAddForm(false)
  }

  function exportWinners() {
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      ['Họ tên', 'Số điện thoại', 'Giải thưởng', 'Đồng ý nhận tin', 'Thời gian'],
      ...winners.map((w) => [
        w.name ?? '',
        w.phone ?? '',
        `${w.prizeEmoji} ${w.prizeName}`,
        w.consent ? 'Có' : 'Không',
        new Date(w.timestamp).toLocaleString('vi-VN'),
      ]),
    ]
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
    // BOM so Excel reads Vietnamese (UTF-8) correctly
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'danh-sach-khach-hang-byt.csv'
    a.click()
  }

  if (!adminUnlocked && !panelOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-[60]">
        <button
          type="button"
          onClick={() => { setPanelOpen(true); setPwError(false) }}
          aria-label="Mở quản lý"
          aria-expanded={panelOpen}
          className="h-10 w-10 grid place-items-center rounded-full border border-brand-line bg-cream-50/90 text-brand-forest shadow-soft backdrop-blur transition-colors hover:bg-brand-mint focus:outline-none focus:ring-2 focus:ring-brand-focus/70"
          title="Quản lý"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </button>
      </div>
    )
  }

  if (!adminUnlocked) {
    return (
      <div className="fixed left-4 right-4 bottom-4 sm:left-auto sm:w-[340px] z-[60] bg-cream-50 rounded-3xl p-5 border border-cream-300/80 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-base font-bold text-cocoa-900">
            Xác thực quản lý
          </h2>
          <button
            type="button"
            onClick={() => { setPanelOpen(false); setPassword(''); setPwError(false) }}
            className="w-8 h-8 grid place-items-center rounded-full text-cocoa-500 hover:text-cocoa-900 hover:bg-cream-200 transition-colors"
            aria-label="Đóng quản lý"
            title="Đóng"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && unlock()}
            placeholder="Nhập mật khẩu…"
            className={`flex-1 bg-cream-100 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border ${pwError ? 'border-clay-500' : 'border-cream-300 focus:border-sage-500'} transition-colors`}
          />
          <button
            type="button"
            onClick={unlock}
            className="bg-sage-600 hover:bg-sage-700 text-cream-50 font-display font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Vào
          </button>
        </div>
        {pwError && <p className="text-clay-600 text-xs mt-2">Mật khẩu chưa đúng, thử lại nhé.</p>}
      </div>
    )
  }

  return (
    <div className="fixed left-4 right-4 bottom-4 sm:left-auto sm:right-4 sm:top-24 sm:bottom-auto sm:w-[380px] z-[60] max-h-[calc(100dvh-6rem)] overflow-y-auto bg-cream-50 rounded-3xl p-5 border border-cream-300/80 shadow-soft space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-cocoa-900">
          Quản lý
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 grid place-items-center rounded-full text-cocoa-500 hover:text-cocoa-900 hover:bg-cream-200 transition-colors"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4z" />
              {soundEnabled ? (
                <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a9 9 0 0 1 0 14" /></>
              ) : (
                <><path d="m22 9-6 6" /><path d="m16 9 6 6" /></>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={lock}
            className="text-xs text-cocoa-500 hover:text-cocoa-900 transition-colors font-medium"
          >
            Khóa lại
          </button>
        </div>
      </div>

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

      {adminTab === 'prizes' && (
        <>
      {/* Prize list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {prizes.map((prize) => (
          <div key={prize.id} className="bg-cream-100 rounded-2xl p-3">
            {editing === prize.id ? (
              <PrizeForm form={form} setForm={setForm} onSave={saveEdit} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-center gap-3">
                <PrizeThumbSmall src={prize.image} emoji={prize.emoji} color={prize.color} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${prize.quantity === 0 ? 'text-cocoa-500 line-through' : 'text-cocoa-900'}`}>
                    {prize.name}
                  </p>
                  <p className="text-xs text-cocoa-500">
                    SL: {prize.quantity === -1 ? '∞' : prize.quantity} · Tỉ lệ: {prize.weight}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => startEdit(prize)}
                    className="text-xs bg-cream-200 hover:bg-cream-300 text-cocoa-700 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => deletePrize(prize.id)}
                    className="text-xs bg-clay-300/40 hover:bg-clay-300/70 text-clay-600 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new prize */}
      {showAddForm ? (
        <div className="bg-cream-100 rounded-2xl p-3">
          <p className="text-xs font-semibold text-cocoa-700 mb-3">Thêm giải mới</p>
          <PrizeForm form={form} setForm={setForm} onSave={handleAdd} onCancel={() => { setShowAddForm(false); setForm(EMPTY_FORM) }} saveLabel="Thêm" />
        </div>
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setForm(EMPTY_FORM); setEditing(null) }}
          className="w-full border-2 border-dashed border-cream-300 hover:border-sage-500 text-cocoa-500 hover:text-sage-700 rounded-2xl py-2.5 text-sm font-semibold transition-colors"
        >
          + Thêm giải thưởng
        </button>
      )}
        </>
      )}

      {/* Google Sheet sync */}
      {adminTab === 'sheet' && (
      <div className="border-t border-cream-300/70 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-sm font-bold text-cocoa-900">Đồng bộ Google Sheet</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${sheetsUrl ? 'bg-sage-50 text-sage-700' : 'bg-cream-200 text-cocoa-500'}`}
          >
            {sheetsUrl ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
        </div>
        <p className="text-xs text-cocoa-500 mb-2 leading-snug">
          Dán link Web App (Apps Script) để mỗi lượt nhận quà tự ghi vào Sheet. Xem hướng dẫn trong tệp
          <span className="font-mono text-[11px] bg-cream-200 px-1 py-0.5 rounded mx-1">GOOGLE_SHEETS_SETUP.md</span>.
        </p>
        <input
          value={sheetDraft}
          onChange={(e) => setSheetDraft(e.target.value)}
          onBlur={() => setSheetsUrl(sheetDraft)}
          placeholder="https://script.google.com/macros/s/…/exec"
          type="url"
          className="w-full bg-cream-100 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border border-cream-300 focus:border-sage-500 transition-colors"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setSheetsUrl(sheetDraft)}
            className="flex-1 text-xs bg-sage-600 hover:bg-sage-700 text-cream-50 px-3 py-2 rounded-lg transition-colors font-bold"
          >
            Lưu link
          </button>
          <button
            onClick={testSheet}
            disabled={!sheetDraft.trim() || sheetTest === 'sending'}
            className="flex-1 text-xs bg-cream-200 hover:bg-cream-300 text-cocoa-700 px-3 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50"
          >
            {sheetTest === 'sending' ? 'Đang gửi…' : sheetTest === 'sent' ? 'Đã gửi thử ✓' : 'Gửi thử'}
          </button>
          {sheetsUrl && (
            <button
              onClick={() => { setSheetsUrl(''); setSheetDraft('') }}
              className="text-xs bg-clay-300/40 hover:bg-clay-300/70 text-clay-600 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              Ngắt
            </button>
          )}
        </div>
        {sheetTest === 'sent' && (
          <p className="text-xs text-sage-700 mt-2">Đã gửi 1 dòng thử — kiểm tra Google Sheet nhé!</p>
        )}
      </div>
      )}

      {adminTab === 'products' && <ProductAdminSection />}

      {adminTab === 'orders' && <OrdersAdminSection />}

      {/* Winners section */}
      {adminTab === 'prizes' && winners.length > 0 && (
        <div className="border-t border-cream-300/70 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-cocoa-900">Khách hàng đã nhận ({winners.length})</h3>
            <div className="flex gap-2">
              <button onClick={exportWinners} className="text-xs bg-sage-50 hover:bg-sage-100 text-sage-700 px-3 py-1.5 rounded-lg transition-colors font-medium">Xuất CSV</button>
              <button onClick={clearWinners} className="text-xs bg-clay-300/40 hover:bg-clay-300/70 text-clay-600 px-3 py-1.5 rounded-lg transition-colors font-medium">Xóa</button>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-sm text-cocoa-700 bg-cream-100 px-3 py-2 rounded-xl">
                <span className="shrink-0">{w.prizeEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cocoa-900 truncate leading-tight">
                    {w.name || 'Khách'}{w.phone ? <span className="font-normal text-cocoa-500"> · {w.phone}</span> : null}
                  </p>
                  <p className="text-xs text-cocoa-500 truncate leading-tight">{w.prizeName}</p>
                </div>
                <span className="text-xs text-cocoa-500 shrink-0">{new Date(w.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface PrizeFormProps {
  form: PrizeFormData
  setForm: (f: PrizeFormData) => void
  onSave: () => void
  onCancel: () => void
  saveLabel?: string
}

function PrizeForm({ form, setForm, onSave, onCancel, saveLabel = 'Lưu' }: PrizeFormProps) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Tên giải thưởng"
          className="col-span-2 bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border border-cream-300 focus:border-sage-500 transition-colors"
        />
        <div className="col-span-2 flex items-center gap-2 bg-cream-50 rounded-xl px-3 py-2.5 border border-cream-300">
          <label className="text-xs text-cocoa-500 shrink-0">Màu</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent shrink-0"
            aria-label="Chọn màu tùy chỉnh"
          />
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-1 ring-cocoa-700 ring-offset-cream-50' : ''}`}
                style={{ background: c }}
                aria-label={`Chọn màu ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-cream-50 rounded-xl px-3 py-2.5 border border-cream-300">
          <label className="text-xs text-cocoa-500 shrink-0">Biểu tượng</label>
          <select
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            className="bg-transparent text-cocoa-900 text-base outline-none flex-1"
          >
            {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <input
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Số lượng (-1 = ∞)"
            type="number"
            className="w-full bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border border-cream-300 focus:border-sage-500 transition-colors"
          />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            placeholder="Tỉ lệ xuất hiện"
            type="number"
            min="1"
            className="flex-1 bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border border-cream-300 focus:border-sage-500 transition-colors"
          />
          <span className="text-xs text-cocoa-500 shrink-0">Số lớn = cơ hội cao</span>
        </div>
        <input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="URL ảnh sản phẩm (tuỳ chọn)"
          type="url"
          className="col-span-2 bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border border-cream-300 focus:border-sage-500 transition-colors"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3.5 py-2 bg-cream-200 hover:bg-cream-300 text-cocoa-700 rounded-xl text-xs font-semibold transition-colors">Hủy</button>
        <button onClick={onSave} className="px-3.5 py-2 bg-sage-600 hover:bg-sage-700 text-cream-50 rounded-xl text-xs font-bold transition-colors">{saveLabel}</button>
      </div>
    </div>
  )
}
