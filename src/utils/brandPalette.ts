export const BRAND_COLORS = {
  cream: '#fff8ea',
  surface: '#ffffff',
  inset: '#f6fbf7',
  mint: '#eaf7ef',
  line: '#d8e5dd',
  lineStrong: '#9fc7ae',
  ink: '#17231f',
  muted: '#66756f',
  forest: '#155e3b',
  leaf: '#4baa65',
  tomato: '#e94f37',
  tomatoDark: '#a33022',
  citrus: '#f6c744',
} as const

export function readableTextForHex(hex: string): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return BRAND_COLORS.surface

  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  return luminance > 0.62 ? BRAND_COLORS.ink : BRAND_COLORS.surface
}
