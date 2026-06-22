import { useState, useEffect } from 'react'
import Wheel from './components/Wheel'
import WinnerOverlay from './components/WinnerOverlay'
import AdminPanel from './components/AdminPanel'
import PrizeLegend from './components/PrizeLegend'
import { useWheelStore } from './store/wheelStore'
import { BYT_LOGO_URL } from './utils/brandAssets'

function BYTMonogram() {
  const [err, setErr] = useState(false)
  if (err) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-sage-600 text-cream-50 grid place-items-center font-display font-extrabold text-lg shadow-soft shrink-0">
        BYT
      </div>
    )
  }
  return (
    <div className="w-11 h-11 rounded-2xl bg-white overflow-hidden shadow-soft shrink-0 border border-cream-200">
      <img
        src={BYT_LOGO_URL}
        alt="Bếp Yêu Thương"
        className="w-full h-full object-contain p-0.5"
        onError={() => setErr(true)}
        decoding="async"
      />
    </div>
  )
}

export default function App() {
  const { winners } = useWheelStore()
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="min-h-[100dvh]">
      {/* Header */}
      <header className="border-b border-cream-300/70 px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <BYTMonogram />
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-cocoa-900 leading-tight truncate">
              Bếp Yêu Thương
            </h1>
            <p className="text-cocoa-500 text-xs sm:text-sm leading-tight truncate">
              Ăn lành. Uống sạch. Sống yêu thương.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {winners.length > 0 && (
            <div className="text-xs sm:text-sm bg-sage-50 border border-sage-100 text-sage-700 px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
              {winners.length} lượt trúng
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 grid place-items-center rounded-full text-cocoa-500 hover:text-cocoa-900 hover:bg-cream-200 transition-colors"
            title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {fullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m13-5h-3a2 2 0 0 0-2 2v3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">
          {/* Wheel - center */}
          <div className="flex flex-col items-center">
            <p className="font-display text-2xl sm:text-3xl font-bold text-cocoa-900 text-center mb-1">
              Vòng quay may mắn
            </p>
            <p className="text-cocoa-500 text-sm text-center mb-7 max-w-sm text-balance">
              Một lựa chọn tử tế hơn cho cả nhà. Quay để nhận quà từ Bếp Yêu Thương.
            </p>
            <Wheel />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 w-full">
            <PrizeLegend />
            <AdminPanel />
          </div>
        </div>
      </main>

      {/* Winner overlay */}
      <WinnerOverlay />
    </div>
  )
}
