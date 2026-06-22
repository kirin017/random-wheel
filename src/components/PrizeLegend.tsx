import { useWheelStore } from '../store/wheelStore'

export default function PrizeLegend() {
  const { prizes } = useWheelStore()
  const totalWeight = prizes.reduce((s, p) => s + p.weight, 0)

  return (
    <div className="bg-cream-50 rounded-3xl p-5 border border-cream-300/70 shadow-soft">
      <h3 className="font-display text-base font-bold text-cocoa-900 mb-4">
        Bảng giải thưởng
      </h3>
      <div className="space-y-2">
        {prizes.map((prize) => {
          const pct = ((prize.weight / totalWeight) * 100).toFixed(1)
          const depleted = prize.quantity === 0
          return (
            <div
              key={prize.id}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-opacity ${depleted ? 'opacity-45' : ''}`}
              style={{ background: `${prize.color}12` }}
            >
              <span
                className="w-9 h-9 rounded-full grid place-items-center text-lg shrink-0"
                style={{ background: depleted ? '#e4dccb' : `${prize.color}24` }}
              >
                {prize.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${depleted ? 'line-through text-cocoa-500' : 'text-cocoa-900'}`}>
                  {prize.name}
                </p>
                <p className="text-xs text-cocoa-500">
                  {depleted ? 'Đã trao hết' : prize.quantity === -1 ? 'Không giới hạn' : `còn ${prize.quantity} phần`}
                </p>
              </div>
              <span
                className="text-sm font-display font-bold shrink-0"
                style={{ color: depleted ? '#9a8c79' : prize.color }}
              >
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
