import { BYT_LOGO_URL } from './brandAssets'
import { BRAND_COLORS } from './brandPalette'

const W = 1080
const H = 1080

/** Load an image with CORS so it can be drawn to a canvas without tainting it. */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Wrap text to a max width, returning the lines. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export interface ShareCardOpts {
  prizeName: string
  color: string
  guestName?: string
}

/** Draw the BYT win share card onto the given canvas. Resolves when done. */
export async function drawShareCard(canvas: HTMLCanvasElement, opts: ShareCardOpts): Promise<void> {
  const { prizeName, color, guestName } = opts
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Make sure brand fonts are ready so canvas text uses them
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* ignore */
  }

  // Background mirrors the storefront: cream, inset green, citrus light.
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, BRAND_COLORS.cream)
  bg.addColorStop(0.52, BRAND_COLORS.inset)
  bg.addColorStop(1, BRAND_COLORS.surface)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Soft radial accents from the live brand palette.
  const r1 = ctx.createRadialGradient(120, 80, 0, 120, 80, 620)
  r1.addColorStop(0, 'rgba(21,94,59,0.16)')
  r1.addColorStop(1, 'rgba(21,94,59,0)')
  ctx.fillStyle = r1
  ctx.fillRect(0, 0, W, H)
  const r2 = ctx.createRadialGradient(W - 80, H - 80, 0, W - 80, H - 80, 640)
  r2.addColorStop(0, 'rgba(246,199,68,0.24)')
  r2.addColorStop(1, 'rgba(246,199,68,0)')
  ctx.fillStyle = r2
  ctx.fillRect(0, 0, W, H)
  const r3 = ctx.createRadialGradient(80, H - 120, 0, 80, H - 120, 520)
  r3.addColorStop(0, 'rgba(233,79,55,0.10)')
  r3.addColorStop(1, 'rgba(233,79,55,0)')
  ctx.fillStyle = r3
  ctx.fillRect(0, 0, W, H)

  // Rounded inner frame
  const m = 48
  ctx.strokeStyle = 'rgba(21,94,59,0.30)'
  ctx.lineWidth = 4
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 44)
  ctx.stroke()

  // Logo (or BYT monogram fallback) in a white disc
  const logo = await loadImage(BYT_LOGO_URL)
  const discR = 96
  const discY = 232
  ctx.save()
  ctx.beginPath()
  ctx.arc(W / 2, discY, discR, 0, Math.PI * 2)
  ctx.fillStyle = BRAND_COLORS.surface
  ctx.shadowColor = 'rgba(21,94,59,0.16)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 8
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(W / 2, discY, discR - 10, 0, Math.PI * 2)
  ctx.clip()
  if (logo) {
    const s = (discR - 10) * 2
    ctx.drawImage(logo, W / 2 - s / 2, discY - s / 2, s, s)
  } else {
    ctx.fillStyle = BRAND_COLORS.forest
    ctx.fillRect(W / 2 - discR, discY - discR, discR * 2, discR * 2)
    ctx.fillStyle = BRAND_COLORS.cream
    ctx.font = '700 76px "Baloo 2", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('BYT', W / 2, discY + 4)
  }
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  // "TÔI VỪA TRÚNG" eyebrow
  ctx.fillStyle = BRAND_COLORS.muted
  ctx.font = '600 34px "Be Vietnam Pro", sans-serif'
  ctx.fillText('🎉  T Ô I   V Ừ A   T R Ú N G  🎉', W / 2, 430)

  // Prize name — large, brand color, wrapped
  ctx.fillStyle = color
  let size = 104
  ctx.font = `800 ${size}px "Baloo 2", sans-serif`
  let lines = wrapLines(ctx, prizeName, W - 200)
  while (lines.length > 2 && size > 60) {
    size -= 8
    ctx.font = `800 ${size}px "Baloo 2", sans-serif`
    lines = wrapLines(ctx, prizeName, W - 200)
  }
  const lineH = size * 1.12
  const startY = 430 + 110 + (lines.length === 1 ? lineH * 0.4 : 0)
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lineH))

  // "tại Bếp Yêu Thương"
  const afterNameY = startY + (lines.length - 1) * lineH + 80
  ctx.fillStyle = BRAND_COLORS.ink
  ctx.font = '600 46px "Be Vietnam Pro", sans-serif'
  ctx.fillText('tại Bếp Yêu Thương', W / 2, afterNameY)

  // Optional guest name
  if (guestName) {
    ctx.fillStyle = BRAND_COLORS.muted
    ctx.font = '500 36px "Be Vietnam Pro", sans-serif'
    ctx.fillText(`— ${guestName} —`, W / 2, afterNameY + 64)
  }

  // Divider dot row
  const dy = H - 180
  ctx.fillStyle = 'rgba(21,94,59,0.55)'
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.arc(W / 2 + i * 34, dy, i === 0 ? 8 : 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Tagline
  ctx.fillStyle = BRAND_COLORS.forest
  ctx.font = '700 40px "Baloo 2", sans-serif'
  ctx.fillText('Ăn lành · Uống sạch · Sống yêu thương', W / 2, H - 110)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Convert a canvas to a PNG Blob. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
