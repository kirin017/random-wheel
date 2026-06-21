import { useState, useEffect } from 'react'
import Wheel from './components/Wheel'
import WinnerOverlay from './components/WinnerOverlay'
import AdminPanel from './components/AdminPanel'
import PrizeLegend from './components/PrizeLegend'
import { useWheelStore } from './store/wheelStore'

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
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight shimmer-text">🎡 VÒNG QUAY MAY MẮN</h1>
          <p className="text-gray-500 text-xs mt-0.5">Sự kiện · Random Wheel</p>
        </div>
        <div className="flex items-center gap-3">
          {winners.length > 0 && (
            <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full font-semibold">
              🏅 {winners.length} lượt trúng
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="text-gray-500 hover:text-white transition-colors text-xl"
            title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {fullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Wheel - center */}
          <div className="flex justify-center">
            <Wheel />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
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
