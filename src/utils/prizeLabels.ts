import type { Prize } from '../store/wheelStore'

const SHORT_PRIZE_NAMES: Record<string, string> = {
  'ginger-shot-any': 'Ginger Shot',
  'sua-hat-any': 'Sữa Hạt',
  'detox-xanh': 'Detox Xanh',
  'detox-do': 'Detox Đỏ',
  'smoothie-any': 'Smoothie',
  'hu-mach-any': 'Hũ Mạch',
}

const FILLER_PHRASES = [
  'Vị Bất Kỳ',
  'Bất Kỳ',
]

export function getPrizeShortName(prize: Pick<Prize, 'id' | 'name'>): string {
  const mapped = SHORT_PRIZE_NAMES[prize.id]
  if (mapped) return mapped

  let name = prize.name.trim()
  for (const phrase of FILLER_PHRASES) {
    name = name.replace(new RegExp(phrase, 'gi'), '').trim()
  }

  const words = name.split(/\s+/).filter(Boolean)
  const compact = words.slice(0, 2).join(' ')
  return compact || prize.name.trim()
}
