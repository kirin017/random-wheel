import { useState } from 'react'
import { useWheelStore, type Prize } from '../store/wheelStore'

const ADMIN_PASSWORD = 'admin123'

const PRESET_COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6',
  '#f472b6', '#06b6d4', '#84cc16', '#f97316', '#e11d48',
]

const EMOJIS = ['🥇', '🥈', '🥉', '🎁', '🎀', '🏆', '💎', '🎯', '⭐', '🔄', '🎪', '🎲']

interface PrizeFormData {
  name: string
  color: string
  quantity: string
  weight: string
  emoji: string
}

const EMPTY_FORM: PrizeFormData = { name: '', color: '#f59e0b', quantity: '1', weight: '10', emoji: '🎁' }

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
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
          <span>🔒</span> Admin Panel
        </h2>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && unlock()}
            placeholder="Mật khẩu admin…"
            className={`flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none border ${pwError ? 'border-red-500' : 'border-gray-700 focus:border-amber-500'} transition-colors`}
          />
          <button
            onClick={unlock}
            className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Vào
          </button>
        </div>
        {pwError && <p className="text-red-400 text-xs mt-2">Mật khẩu sai!</p>}
        <p className="text-gray-600 text-xs mt-3">Hint: admin123</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          <span>⚙️</span> Quản lý giải thưởng
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-lg hover:scale-110 transition-transform"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setAdminUnlocked(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Khóa
          </button>
        </div>
      </div>

      {/* Prize list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {prizes.map((prize) => (
          <div key={prize.id} className="bg-gray-800 rounded-xl p-3">
            {editing === prize.id ? (
              <PrizeForm form={form} setForm={setForm} onSave={saveEdit} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: prize.color }} />
                <span className="text-base">{prize.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${prize.quantity === 0 ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {prize.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    SL: {prize.quantity === -1 ? '∞' : prize.quantity} · Weight: {prize.weight}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(prize)} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-lg transition-colors">✏️</button>
                  <button onClick={() => deletePrize(prize.id)} className="text-xs bg-red-900/50 hover:bg-red-800 px-2 py-1 rounded-lg transition-colors">🗑</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new prize */}
      {showAddForm ? (
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Thêm giải mới</p>
          <PrizeForm form={form} setForm={setForm} onSave={handleAdd} onCancel={() => { setShowAddForm(false); setForm(EMPTY_FORM) }} saveLabel="Thêm" />
        </div>
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setForm(EMPTY_FORM); setEditing(null) }}
          className="w-full border-2 border-dashed border-gray-700 hover:border-amber-500 text-gray-500 hover:text-amber-400 rounded-xl py-2.5 text-sm font-semibold transition-colors"
        >
          + Thêm giải thưởng
        </button>
      )}

      {/* Winners section */}
      {winners.length > 0 && (
        <div className="border-t border-gray-800 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400">🏅 Lịch sử trúng thưởng ({winners.length})</h3>
            <div className="flex gap-2">
              <button onClick={exportWinners} className="text-xs bg-green-900/50 hover:bg-green-800 text-green-400 px-3 py-1 rounded-lg transition-colors">📥 Xuất CSV</button>
              <button onClick={clearWinners} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-400 px-3 py-1 rounded-lg transition-colors">Xóa</button>
            </div>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                <span>{w.prizeEmoji}</span>
                <span className="flex-1 font-medium">{w.prizeName}</span>
                <span className="text-xs text-gray-500">{new Date(w.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
          className="col-span-2 bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-amber-500 placeholder-gray-500"
        />
        <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
          <label className="text-xs text-gray-400 w-12 flex-shrink-0">Màu</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
          />
          <div className="flex gap-1 flex-wrap">
            {PRESET_COLORS.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                className="w-4 h-4 rounded-full border border-gray-600 hover:scale-110 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
          <label className="text-xs text-gray-400 w-12 flex-shrink-0">Emoji</label>
          <select
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            className="bg-transparent text-white text-sm outline-none"
          >
            {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <input
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          placeholder="Số lượng (-1 = ∞)"
          type="number"
          className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-amber-500 placeholder-gray-500"
        />
        <input
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          placeholder="Trọng số xác suất"
          type="number"
          min="1"
          className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 ring-amber-500 placeholder-gray-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-semibold transition-colors">Hủy</button>
        <button onClick={onSave} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg text-xs font-bold transition-colors">{saveLabel}</button>
      </div>
    </div>
  )
}
