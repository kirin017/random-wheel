import { useCallback, useEffect, useRef, useState } from 'react'
import { useWheelStore } from '../store/wheelStore'
import { drawShareCard, canvasToBlob } from '../utils/shareCard'
import { submitLeadToSheet } from '../utils/sheets'
import { BRAND_COLORS } from '../utils/brandPalette'
import ProductSpotlightReveal from './ProductSpotlightReveal'

type Step = 'spotlight' | 'reveal' | 'form' | 'share'

function isValidVNPhone(raw: string): boolean {
  return /^0\d{9}$/.test(raw.replace(/[\s.]/g, ''))
}

export default function WinnerOverlay() {
  const {
    currentWinner,
    showWinnerOverlay,
    setShowWinnerOverlay,
    setCurrentWinner,
    recordWinner,
    decrementPrize,
    sheetsUrl,
  } = useWheelStore()

  const [imgErr, setImgErr] = useState(false)
  const [step, setStep] = useState<Step>('spotlight')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(true)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [cardBuilding, setCardBuilding] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const handleClose = useCallback(() => {
    setShowWinnerOverlay(false)
    setTimeout(() => setCurrentWinner(null), 300)
  }, [setCurrentWinner, setShowWinnerOverlay])

  const handleSpotlightDone = useCallback(() => {
    setStep('reveal')
  }, [])

  // Reset the whole flow whenever a new winner appears
  useEffect(() => {
    setImgErr(false)
    setStep('spotlight')
    setName('')
    setPhone('')
    setConsent(true)
    setErrors({})
    setCardUrl(null)
  }, [currentWinner?.id])

  useEffect(() => {
    if (!showWinnerOverlay) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'spotlight') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose, showWinnerOverlay, step])

  if (!showWinnerOverlay || !currentWinner) return null

  const winner = currentWinner
  const isConsolation = winner.quantity === -1
  const hasImage = !!winner.image && !imgErr

  function goToForm() {
    setStep('form')
  }

  async function submitLead() {
    const nextErrors: { name?: string; phone?: string } = {}
    if (!name.trim()) nextErrors.name = 'Vui lòng nhập họ tên'
    if (!isValidVNPhone(phone)) nextErrors.phone = 'Số điện thoại chưa hợp lệ (VD: 0901234567)'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const cleanPhone = phone.replace(/[\s.]/g, '')
    const cleanName = name.trim()
    recordWinner(winner, { name: cleanName, phone: cleanPhone, consent })
    if (winner.quantity > 0) decrementPrize(winner.id)

    // Push to Google Sheet if configured (fire-and-forget; local record is the backup)
    if (sheetsUrl) {
      submitLeadToSheet(sheetsUrl, {
        name: cleanName,
        phone: cleanPhone,
        prize: winner.name,
        consent,
        timestamp: Date.now(),
      })
    }

    setStep('share')
    setCardBuilding(true)
    try {
      const canvas = canvasRef.current ?? document.createElement('canvas')
      canvasRef.current = canvas
      await drawShareCard(canvas, { prizeName: winner.name, color: winner.color, guestName: name.trim() })
      setCardUrl(canvas.toDataURL('image/png'))
    } catch {
      setCardUrl(null)
    } finally {
      setCardBuilding(false)
    }
  }

  function downloadCard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'bep-yeu-thuong-trung-thuong.png'
    a.click()
  }

  async function shareCard() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await canvasToBlob(canvas)
    if (!blob) return
    const file = new File([blob], 'bep-yeu-thuong.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean }
    const shareData: ShareData = {
      files: [file],
      title: 'Bếp Yêu Thương',
      text: `Tôi vừa trúng ${winner.name} tại Bếp Yêu Thương! 🎉`,
    }
    if (nav.canShare && nav.canShare(shareData)) {
      try {
        await nav.share(shareData)
        return
      } catch {
        /* user cancelled — fall through to download */
      }
    }
    downloadCard()
  }

  function shareFacebook() {
    const url = window.location.origin
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,width=640,height=640',
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(23,35,31,0.68)', backdropFilter: 'blur(8px)' }}
      onClick={step === 'spotlight' ? undefined : handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative animate-bounce-in max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden rounded-[28px] max-w-sm w-full mx-4 bg-cream-50 shadow-lift"
        style={{ border: `2.5px solid ${winner.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'spotlight' && (
          <ProductSpotlightReveal winner={winner} onDone={handleSpotlightDone} />
        )}

        {/* ===== STEP: REVEAL ===== */}
        {step === 'reveal' && (
          <>
            {hasImage ? (
              <div className="relative w-full" style={{ height: 240 }}>
                <img
                  src={winner.image}
                  alt={winner.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgErr(true)}
                  decoding="async"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(to bottom, rgba(23,35,31,0.08) 0%, transparent 40%, ${BRAND_COLORS.cream}f7 88%)` }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: winner.color }} />
              </div>
            ) : (
              <div className="pt-8 pb-2">
                <div
                  className="mx-auto w-28 h-28 rounded-2xl grid place-items-center text-6xl animate-float-soft"
                  style={{ background: `${winner.color}1f` }}
                >
                  {winner.emoji}
                </div>
              </div>
            )}

            {!hasImage && (
              <div className="absolute top-0 inset-x-12 h-1.5 rounded-b-full" style={{ background: winner.color }} />
            )}

            <div className={`px-7 pb-8 text-center ${hasImage ? 'pt-2' : 'pt-5'}`}>
              <p className="text-cocoa-500 mb-2 font-medium tracking-wide uppercase text-xs">
                {isConsolation ? 'Chúc bạn may mắn lần sau' : 'Chúc mừng bạn nhận được'}
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-extrabold mb-2 leading-tight"
                style={{ color: winner.color }}
              >
                {winner.name}
              </h2>
              {winner.quantity > 0 && (
                <p className="text-cocoa-500 text-sm mb-5">
                  Còn lại <span className="text-cocoa-900 font-bold">{winner.quantity - 1}</span> phần quà
                </p>
              )}
              {isConsolation && <div className="mb-5" />}

              <button
                onClick={goToForm}
                className="px-10 py-3.5 rounded-full font-display font-bold text-cream-50 text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-soft"
                style={{ background: winner.color }}
              >
                {isConsolation ? 'Đăng ký nhận ưu đãi' : 'Nhận quà ngay'}
              </button>
              <p className="mt-4 text-cocoa-500/60 text-xs">Nhấn ra ngoài hoặc phím ESC để đóng</p>
            </div>
          </>
        )}

        {/* ===== STEP: LEAD FORM ===== */}
        {step === 'form' && (
          <div className="px-7 pt-7 pb-7">
            <div className="text-center mb-5">
              <div
                className="mx-auto w-14 h-14 rounded-2xl grid place-items-center text-3xl mb-3"
                style={{ background: `${winner.color}1f` }}
              >
                {winner.emoji}
              </div>
              <h2 className="font-display text-xl font-extrabold text-cocoa-900 leading-tight">
                {isConsolation ? 'Nhận ưu đãi từ Bếp Yêu Thương' : 'Thông tin nhận quà'}
              </h2>
              <p className="text-cocoa-500 text-sm mt-1">
                {isConsolation ? (
                  'Để lại thông tin để nhận ưu đãi thành viên nhé!'
                ) : (
                  <>Để lại thông tin để BYT trao <span className="font-semibold" style={{ color: winner.color }}>{winner.name}</span> cho bạn</>
                )}
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="Họ và tên"
                  autoFocus
                  className={`w-full bg-cream-100 rounded-xl px-4 py-3 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border transition-colors ${errors.name ? 'border-clay-500' : 'border-cream-300 focus:border-sage-500'}`}
                />
                {errors.name && <p className="text-clay-600 text-xs mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })) }}
                  onKeyDown={(e) => e.key === 'Enter' && submitLead()}
                  placeholder="Số điện thoại"
                  type="tel"
                  inputMode="numeric"
                  className={`w-full bg-cream-100 rounded-xl px-4 py-3 text-sm text-cocoa-900 placeholder-cocoa-500/60 outline-none border transition-colors ${errors.phone ? 'border-clay-500' : 'border-cream-300 focus:border-sage-500'}`}
                />
                {errors.phone && <p className="text-clay-600 text-xs mt-1 ml-1">{errors.phone}</p>}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none px-1 pt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sage-600 shrink-0"
                />
                <span className="text-xs text-cocoa-500 leading-snug">
                  Tôi đồng ý nhận thông tin ưu đãi & sản phẩm mới từ Bếp Yêu Thương.
                </span>
              </label>
            </div>

            <button
              onClick={submitLead}
              className="mt-5 w-full py-3.5 rounded-full font-display font-bold text-cream-50 text-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-soft"
              style={{ background: winner.color }}
            >
              Xác nhận
            </button>
            <button
              onClick={() => setStep('reveal')}
              className="mt-2 w-full py-2 text-cocoa-500 hover:text-cocoa-900 text-sm font-medium transition-colors"
            >
              Quay lại
            </button>
          </div>
        )}

        {/* ===== STEP: SHARE ===== */}
        {step === 'share' && (
          <div className="px-7 pt-7 pb-7 text-center">
            <h2 className="font-display text-2xl font-extrabold text-cocoa-900 leading-tight">
              Cảm ơn {name.trim().split(' ').slice(-1)[0] || 'bạn'}! 💚
            </h2>
            <p className="text-cocoa-500 text-sm mt-1 mb-4">
              Chia sẻ niềm vui và lan toả Bếp Yêu Thương nhé!
            </p>

            {/* Share card preview */}
            <div className="rounded-2xl overflow-hidden border border-cream-300 bg-cream-100 mb-5 aspect-square grid place-items-center">
              {cardBuilding ? (
                <div className="text-cocoa-500 text-sm animate-pulse py-20">Đang tạo ảnh chia sẻ…</div>
              ) : cardUrl ? (
                <img src={cardUrl} alt="Ảnh chia sẻ" className="w-full h-full object-cover" />
              ) : (
                <div className="text-cocoa-500 text-sm py-20 px-6">Không tạo được ảnh, bạn vẫn có thể chia sẻ trang nhé.</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={shareCard}
                disabled={!cardUrl}
                className="col-span-2 py-3.5 rounded-full font-display font-bold text-cream-50 text-base transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-soft disabled:opacity-50"
                style={{ background: winner.color }}
              >
                Chia sẻ ngay
              </button>
              <button
                onClick={downloadCard}
                disabled={!cardUrl}
                className="py-3 rounded-full font-semibold text-sm bg-cream-200 hover:bg-cream-300 text-cocoa-700 transition-colors disabled:opacity-50"
              >
                Tải ảnh
              </button>
              <button
                onClick={shareFacebook}
                className="py-3 rounded-full font-semibold text-sm bg-sage-50 hover:bg-sage-100 text-sage-700 border border-sage-100 transition-colors"
              >
                Facebook
              </button>
            </div>

            <button
              onClick={handleClose}
              className="mt-3 w-full py-2 text-cocoa-500 hover:text-cocoa-900 text-sm font-medium transition-colors"
            >
              Hoàn tất
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
