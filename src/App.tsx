import { useState, useEffect } from 'react'
import Wheel from './components/Wheel'
import WinnerOverlay from './components/WinnerOverlay'
import AdminPanel from './components/AdminPanel'
import { useWheelStore } from './store/wheelStore'
import { BYT_LOGO_URL } from './utils/brandAssets'
import { BRAND_COLORS } from './utils/brandPalette'

function BotanicalBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <svg
        className="absolute"
        style={{ top: '-60px', left: '-80px', width: '420px', height: '420px', opacity: 0.085 }}
        viewBox="0 0 420 420"
        fill="none"
        aria-hidden="true"
      >
        {/* top-left leaf cluster */}
        <ellipse cx="160" cy="180" rx="120" ry="42" fill={BRAND_COLORS.forest} transform="rotate(-38 160 180)" />
        <ellipse cx="110" cy="140" rx="95" ry="32" fill={BRAND_COLORS.forest} transform="rotate(-55 110 140)" />
        <ellipse cx="200" cy="210" rx="105" ry="30" fill={BRAND_COLORS.leaf} transform="rotate(-22 200 210)" />
        <ellipse cx="140" cy="250" rx="80" ry="26" fill={BRAND_COLORS.ink} transform="rotate(-70 140 250)" />
        <circle cx="188" cy="155" r="14" fill={BRAND_COLORS.citrus} opacity="0.55" />
        <circle cx="142" cy="195" r="9" fill={BRAND_COLORS.citrus} opacity="0.45" />
        <circle cx="218" cy="230" r="11" fill={BRAND_COLORS.tomato} opacity="0.38" />
      </svg>

      <svg
        className="absolute"
        style={{ top: '-40px', right: '-60px', width: '380px', height: '380px', opacity: 0.075 }}
        viewBox="0 0 380 380"
        fill="none"
        aria-hidden="true"
      >
        {/* top-right botanical sprigs */}
        <ellipse cx="220" cy="160" rx="110" ry="36" fill={BRAND_COLORS.citrus} transform="rotate(42 220 160)" />
        <ellipse cx="260" cy="200" rx="90" ry="28" fill={BRAND_COLORS.citrus} transform="rotate(25 260 200)" />
        <ellipse cx="180" cy="200" rx="100" ry="30" fill={BRAND_COLORS.forest} transform="rotate(60 180 200)" />
        <circle cx="215" cy="145" r="12" fill={BRAND_COLORS.forest} opacity="0.6" />
        <circle cx="255" cy="185" r="8" fill={BRAND_COLORS.tomato} opacity="0.42" />
      </svg>

      <svg
        className="absolute"
        style={{ bottom: '-80px', left: '5%', width: '350px', height: '350px', opacity: 0.07 }}
        viewBox="0 0 350 350"
        fill="none"
        aria-hidden="true"
      >
        {/* bottom-left herbs */}
        <ellipse cx="130" cy="170" rx="105" ry="34" fill={BRAND_COLORS.leaf} transform="rotate(30 130 170)" />
        <ellipse cx="170" cy="210" rx="80" ry="24" fill={BRAND_COLORS.forest} transform="rotate(50 170 210)" />
        <ellipse cx="90" cy="210" rx="70" ry="22" fill={BRAND_COLORS.ink} transform="rotate(15 90 210)" />
        <circle cx="150" cy="158" r="10" fill={BRAND_COLORS.citrus} opacity="0.5" />
        <circle cx="185" cy="195" r="7" fill={BRAND_COLORS.tomato} opacity="0.4" />
      </svg>

      <svg
        className="absolute"
        style={{ bottom: '-60px', right: '3%', width: '320px', height: '320px', opacity: 0.07 }}
        viewBox="0 0 320 320"
        fill="none"
        aria-hidden="true"
      >
        {/* bottom-right leaf fan */}
        <ellipse cx="180" cy="160" rx="100" ry="32" fill={BRAND_COLORS.forest} transform="rotate(-30 180 160)" />
        <ellipse cx="200" cy="200" rx="85" ry="26" fill={BRAND_COLORS.leaf} transform="rotate(-48 200 200)" />
        <ellipse cx="150" cy="185" rx="78" ry="22" fill={BRAND_COLORS.citrus} transform="rotate(-15 150 185)" />
        <circle cx="172" cy="150" r="11" fill={BRAND_COLORS.citrus} opacity="0.48" />
        <circle cx="205" cy="188" r="8" fill={BRAND_COLORS.tomato} opacity="0.38" />
      </svg>

      {/* centre organic blob — very soft honey wash */}
      <svg
        className="absolute"
        style={{ top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '500px', opacity: 0.045 }}
        viewBox="0 0 700 500"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="350" cy="250" rx="320" ry="190" fill={BRAND_COLORS.citrus} />
      </svg>
    </div>
  )
}

function GrainOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 55 }}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" opacity="0.032" />
      </svg>
    </div>
  )
}

function BYTMonogram() {
  const [err, setErr] = useState(false)
  if (err) {
    return (
      <div className="w-11 h-11 rounded-2xl bg-brand-forest text-brand-cream grid place-items-center font-display font-extrabold text-lg shadow-soft shrink-0">
        BYT
      </div>
    )
  }
  return (
    <div className="w-11 h-11 rounded-2xl bg-white overflow-hidden shadow-soft shrink-0 border border-brand-line">
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
      <BotanicalBg />
      <GrainOverlay />

      {/* All page content sits above the botanical/grain layers */}
      <div className="relative" style={{ zIndex: 1 }}>

      {/* Header — frosted glass sticky bar */}
      <header className="sticky top-0 z-40 border-b border-brand-cream/20 px-5 sm:px-8 py-4 flex items-center justify-between gap-4 text-brand-cream shadow-[0_14px_34px_rgb(23_35_31_/_0.20)]"
        style={{ background: 'rgba(21,94,59,0.86)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <BYTMonogram />
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-brand-cream leading-tight truncate">
              Bếp Yêu Thương
            </h1>
            <p className="text-brand-cream/80 text-xs sm:text-sm leading-tight truncate">
              Ăn lành. Uống sạch. Sống yêu thương.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {winners.length > 0 && (
            <div className="text-xs sm:text-sm bg-brand-cream/[.14] border border-brand-cream/[.26] text-brand-cream px-3 py-1.5 rounded-full font-semibold whitespace-nowrap">
              {winners.length} lượt trúng
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 grid place-items-center rounded-full text-brand-cream/80 hover:text-brand-forest hover:bg-brand-cream transition-colors"
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col items-center">
          <p className="font-display text-2xl sm:text-3xl font-bold text-brand-ink text-center mb-1">
            Vòng quay may mắn
          </p>
          {/* Decorative sage accent divider */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-10 rounded-full bg-brand-leaf/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-citrus" />
            <div className="h-px w-10 rounded-full bg-brand-leaf/60" />
          </div>
          <p className="text-brand-muted text-sm text-center mb-7 max-w-sm text-balance">
            Một lựa chọn tử tế hơn cho cả nhà. Quay để nhận quà từ Bếp Yêu Thương.
          </p>
          <Wheel />
        </div>
      </main>

      <AdminPanel />

      </div>{/* /relative content wrapper */}

      {/* Winner overlay — above everything */}
      <WinnerOverlay />
    </div>
  )
}
