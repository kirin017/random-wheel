import { useEffect } from 'react'
import { useWheelStore } from '../store/wheelStore'

export default function WinnerOverlay() {
  const { currentWinner, showWinnerOverlay, setShowWinnerOverlay, setCurrentWinner } = useWheelStore()

  useEffect(() => {
    if (!showWinnerOverlay) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showWinnerOverlay])

  if (!showWinnerOverlay || !currentWinner) return null

  function handleClose() {
    setShowWinnerOverlay(false)
    setTimeout(() => setCurrentWinner(null), 300)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="relative animate-bounce-in text-center px-8 py-10 rounded-3xl max-w-md w-full mx-4"
        style={{
          background: `radial-gradient(circle at top, ${currentWinner.color}22 0%, #111827 60%)`,
          border: `3px solid ${currentWinner.color}`,
          boxShadow: `0 0 60px ${currentWinner.color}66, 0 0 120px ${currentWinner.color}33`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top sparkles */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-2 text-2xl">
          <span>✨</span><span>🎊</span><span>✨</span>
        </div>

        <p className="text-gray-400 text-sm uppercase tracking-widest mb-2 font-semibold">
          🎉 Chúc mừng! Bạn nhận được
        </p>

        <div className="text-7xl mb-4 drop-shadow-lg">{currentWinner.emoji}</div>

        <h2
          className="text-4xl font-black mb-3 shimmer-text"
          style={{ textShadow: `0 0 30px ${currentWinner.color}` }}
        >
          {currentWinner.name}
        </h2>

        {currentWinner.quantity > 0 && (
          <p className="text-gray-400 text-sm mb-6">
            Còn lại: <span className="text-white font-bold">{currentWinner.quantity - 1}</span> giải
          </p>
        )}

        <button
          onClick={handleClose}
          className="mt-2 px-8 py-3 rounded-full font-bold text-gray-900 transition-all hover:scale-105 active:scale-95 text-lg"
          style={{ background: `linear-gradient(135deg, ${currentWinner.color}, #ffd700)` }}
        >
          Nhận thưởng 🎁
        </button>

        <p className="mt-4 text-gray-600 text-xs">Nhấn bất kỳ đâu hoặc ESC để đóng</p>
      </div>
    </div>
  )
}
