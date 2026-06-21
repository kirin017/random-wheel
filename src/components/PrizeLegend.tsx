import { useWheelStore } from '../store/wheelStore'

export default function PrizeLegend() {
  const { prizes } = useWheelStore()
  const totalWeight = prizes.reduce((s, p) => s + p.weight, 0)

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
        🎁 Bảng giải thưởng
      </h3>
      <div className="space-y-2">
        {prizes.map((prize) => {
          const pct = ((prize.weight / totalWeight) * 100).toFixed(1)
          const depleted = prize.quantity === 0
          return (
            <div
              key={prize.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-opacity ${depleted ? 'opacity-40' : ''}`}
              style={{ background: `${prize.color}11`, border: `1px solid ${prize.color}33` }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: depleted ? '#4b5563' : prize.color }} />
              <span className="text-base">{prize.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${depleted ? 'line-through text-gray-500' : 'text-white'}`}>
                  {prize.name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold" style={{ color: depleted ? '#4b5563' : prize.color }}>
                  {pct}%
                </p>
                <p className="text-xs text-gray-600">
                  {depleted ? 'Hết' : prize.quantity === -1 ? '∞' : `còn ${prize.quantity}`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
