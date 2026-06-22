import { useEffect, useState } from 'react'
import { useWheelStore } from '../store/wheelStore'

export default function WinnerOverlay() {
  const { currentWinner, showWinnerOverlay, setShowWinnerOverlay, setCurrentWinner } = useWheelStore()
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    setImgErr(false)
  }, [currentWinner?.id])

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

  const hasImage = !!currentWinner.image && !imgErr

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(47,38,32,0.62)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="relative animate-bounce-in overflow-hidden rounded-[28px] max-w-sm w-full mx-4 bg-cream-50 shadow-lift"
        style={{ border: `2.5px solid ${currentWinner.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product image hero */}
        {hasImage ? (
          <div className="relative w-full" style={{ height: 240 }}>
            <img
              src={currentWinner.image}
              alt={currentWinner.name}
              className="w-full h-full object-cover"
              onError={() => setImgErr(true)}
              decoding="async"
            />
            {/* Gradient fade into card */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(47,38,32,0.08) 0%, transparent 40%, rgba(253,250,243,0.97) 88%)' }}
            />
            {/* Prize color accent stripe at bottom of image */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: currentWinner.color }}
            />
          </div>
        ) : (
          <div className="pt-8 pb-2">
            <div
              className="mx-auto w-28 h-28 rounded-2xl grid place-items-center text-6xl animate-float-soft"
              style={{ background: `${currentWinner.color}1f` }}
            >
              {currentWinner.emoji}
            </div>
          </div>
        )}

        {/* Non-image top accent */}
        {!hasImage && (
          <div
            className="absolute top-0 inset-x-12 h-1.5 rounded-b-full"
            style={{ background: currentWinner.color }}
          />
        )}

        {/* Content */}
        <div className={`px-7 pb-8 text-center ${hasImage ? 'pt-2' : 'pt-5'}`}>
          <p className="text-cocoa-500 text-sm mb-2 font-medium tracking-wide uppercase text-xs">
            Chúc mừng bạn nhận được
          </p>

          <h2
            className="font-display text-3xl sm:text-4xl font-extrabold mb-2 leading-tight"
            style={{ color: currentWinner.color }}
          >
            {currentWinner.name}
          </h2>

          {currentWinner.quantity > 0 && (
            <p className="text-cocoa-500 text-sm mb-5">
              Còn lại <span className="text-cocoa-900 font-bold">{currentWinner.quantity - 1}</span> phần quà
            </p>
          )}
          {currentWinner.quantity === -1 && <div className="mb-5" />}

          <button
            onClick={handleClose}
            className="px-10 py-3.5 rounded-full font-display font-bold text-cream-50 text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-soft"
            style={{ background: currentWinner.color }}
          >
            Nhận quà
          </button>

          <p className="mt-4 text-cocoa-500/60 text-xs">Nhấn ra ngoài hoặc phím ESC để đóng</p>
        </div>
      </div>
    </div>
  )
}
