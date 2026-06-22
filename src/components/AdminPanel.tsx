import { useState } from 'react'
import { useWheelStore, type Prize } from '../store/wheelStore'

const ADMIN_PASSWORD = 'admin123'

// Bếp Yêu Thương brand palette swatches
const PRESET_COLORS = [
  '#b66639', '#cd7c4d', '#4c7257', '#6f9079', '#b58a3c',
  '#5f8a6c', '#d99468', '#3d5c47', '#eecb7e', '#473b30',
]

const EMOJIS = ['🥇', '🥈', '🥉', '🎁', '🌿', '🍵', '🥗', '🍯', '🧺', '💚', '🥭', '🍶']

interface PrizeFormData {
  name: string
  color: string
  quantity: string
  weight: string
  emoji: string
}

const EMPTY_FORM: PrizeFormData = { name: '', color: '#4c7257', quantity: '1', weight: '10', emoji: '🎁' }

export default function AdminPanel() {
  const {
    prizes, addPrize, updatePrize, deletePrize,
    winners, clearWinners,
    adminUnlocked, setAdminUnlocked,
    soundEnabled, setSoundEnabled,
  } = useWheelStore()

  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<PrizeFormData>(EMPTY_FORM)
  const [showAddForm, setShowAddForm] = useState(false)

  function unlock() {
    if (password === ADMIN_PASSWORD) {
      setAdminUnlocked(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  function startEdit(prize: Prize) {
    setEditing(prize.id)
    setForm({
      name: prize.name,
      color: prize.color,
      quantity: prize.quantity.toString(),
      weight: prize.weight.toString(),
      emoji: prize.emoji,
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
    })
    setForm(EMPTY_FORM)
    setShowAddForm(false)
  }

  function exportWinners() {
    const csv = ['Giải thưởng,Thời gian', ...winners.map((w) => `${w.prizeEmoji} ${w.prizeName},${new Date(w.timestamp).toLocaleString('vi-VN')}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'danh-sach-trung-thuong.csv'
    a.click()
  }

  if (!adminUnlocked) {
    return (
      <div className="bg-cream-50 rounded-3xl p-5 border border-cream-300/70 shadow-soft">
        <h2 className="font-display text-base font-bold text-cocoa-900 mb-1">
          Khu vực quản lý
        </h2>
        <p className="text-cocoa-500 text-xs mb-4">Dành cho ban tổ chức sự kiện</p>
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
            onClick={unlock}
            className="bg-sage-600 hover:bg-sage-700 text-cream-50 font-display font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Vào
          </button>
        </div>
        {pwError && <p className="text-clay-600 text-xs mt-2">Mật khẩu chưa đúng, thử lại nhé.</p>}
        <p className="text-cocoa-500/60 text-xs mt-3">Gợi ý: admin123</p>
      </div>
    )
  }

  return (
    <div className="bg-cream-50 rounded-3xl p-5 border border-cream-300/70 shadow-soft space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-cocoa-900">
          Quản lý giải thưởng
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
            onClick={() => setAdminUnlocked(false)}
            className="text-xs text-cocoa-500 hover:text-cocoa-900 transition-colors font-medium"
          >
            Khóa lại
          </button>
        </div>
      </div>

      {/* Prize list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {prizes.map((prize) => (
          <div key={prize.id} className="bg-cream-100 rounded-2xl p-3">
            {editing === prize.id ? (
              <PrizeForm form={form} setForm={setForm} onSave={saveEdit} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-full grid place-items-center text-base shrink-0"
                  style={{ background: `${prize.color}24` }}
                >
                  {prize.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${prize.quantity === 0 ? 'text-cocoa-500 line-through' : 'text-cocoa-900'}`}>
                    {prize.name}
                  </p>
                  <p className="text-xs text-cocoa-500">
                    Số lượng: {prize.quantity === -1 ? 'không giới hạn' : prize.quantity} · Tỉ lệ: {prize.weight}
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

      {/* Winners section */}
      {winners.length > 0 && (
        <div className="border-t border-cream-300/70 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-cocoa-900">Lịch sử trao quà ({winners.length})</h3>
            <div className="flex gap-2">
              <button onClick={exportWinners} className="text-xs bg-sage-50 hover:bg-sage-100 text-sage-700 px-3 py-1.5 rounded-lg transition-colors font-medium">Xuất CSV</button>
              <button onClick={clearWinners} className="text-xs bg-clay-300/40 hover:bg-clay-300/70 text-clay-600 px-3 py-1.5 rounded-lg transition-colors font-medium">Xóa</button>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-sm text-cocoa-700 bg-cream-100 px-3 py-2 rounded-xl">
                <span>{w.prizeEmoji}</span>
                <span className="flex-1 font-medium truncate">{w.prizeName}</span>
                <span className="text-xs text-cocoa-500">{new Date(w.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
        <div className="flex flex-col gap-1">
          <input
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="Số lượng"
            type="number"
            className="bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border border-cream-300 focus:border-sage-500 transition-colors"
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
          <span className="text-xs text-cocoa-500 shrink-0">Số càng lớn, cơ hội trúng càng cao</span>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3.5 py-2 bg-cream-200 hover:bg-cream-300 text-cocoa-700 rounded-xl text-xs font-semibold transition-colors">Hủy</button>
        <button onClick={onSave} className="px-3.5 py-2 bg-sage-600 hover:bg-sage-700 text-cream-50 rounded-xl text-xs font-bold transition-colors">{saveLabel}</button>
      </div>
    </div>
  )
}
