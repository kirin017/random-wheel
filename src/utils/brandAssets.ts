const RAW = 'https://raw.githubusercontent.com/kirin017/brand-brain/main/assets'

export const BYT_LOGO_URL = `${RAW}/logos/${encodeURIComponent('Logo tách nền BYT.png')}`

export function menuImg(filename: string): string {
  return `${RAW}/menu-product-images/2026-06-22/${encodeURIComponent(filename)}`
}
