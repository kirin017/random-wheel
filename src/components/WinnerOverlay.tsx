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
      style={{ background: 'rgba(47,38,32,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={handleClose}
    >
      <div
        className="relative animate-bounce-in text-center px-8 py-10 rounded-[28px] max-w-md w-full mx-4 bg-cream-50 shadow-lift"
        style={{ border: `2px solid ${currentWinner.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand-colored top accent bar */}
        <div
          className="absolute top-0 inset-x-10 h-1.5 rounded-b-full"
          style={{ background: currentWinner.color }}
        />

        <p className="text-cocoa-500 text-sm mb-4 font-medium">
          Chúc mừng bạn nhận được
        </p>

        <div
          className="mx-auto mb-5 w-24 h-24 rounded-full grid place-items-center text-5xl animate-float-soft"
          style={{ background: `${currentWinner.color}1f` }}
        >
          {currentWinner.emoji}
        </div>

        <h2
          className="font-display text-4xl font-extrabold mb-3"
          style={{ color: currentWinner.color }}
        >
          {currentWinner.name}
        </h2>

        {currentWinner.quantity > 0 && (
          <p className="text-cocoa-500 text-sm mb-6">
            Còn lại <span className="text-cocoa-900 font-bold">{currentWinner.quantity - 1}</span> phần quà
          </p>
        )}

        <button
          onClick={handleClose}
          className="mt-2 px-8 py-3 rounded-full font-display font-bold text-cream-50 text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-soft"
          style={{ background: currentWinner.color }}
        >
          Nhận quà
        </button>

        <p className="mt-4 text-cocoa-500/70 text-xs">Nhấn ra ngoài hoặc phím ESC để đóng</p>
      </div>
    </div>
  )
}
