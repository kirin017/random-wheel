import type { Prize } from '../store/wheelStore'
import { BRAND_COLORS } from './brandPalette'

export const WHEEL_SEGMENT_MULTIPLIER = 2

const SECONDARY_MIX_TARGETS = [
  BRAND_COLORS.citrus,
  BRAND_COLORS.tomato,
  BRAND_COLORS.ink,
  BRAND_COLORS.cream,
  BRAND_COLORS.forest,
  BRAND_COLORS.tomatoDark,
]

export interface WheelSegmentEntry {
  prize: Prize
  copyIndex: number
  segmentKey: string
  displayColor: string
}

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return null

  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return null

  return [r, g, b]
}

function mixHex(baseHex: string, targetHex: string, targetWeight = 0.42): string {
  const base = parseHex(baseHex)
  const target = parseHex(targetHex)
  if (!base || !target) return targetHex

  const mixed = base.map((channel, index) => {
    const value = channel * (1 - targetWeight) + target[index] * targetWeight
    return Math.round(value).toString(16).padStart(2, '0')
  })

  return `#${mixed.join('')}`
}

export function getWheelSegmentEntries(prizes: Prize[]): WheelSegmentEntry[] {
  const available = prizes.filter((p) => p.quantity !== 0)
  const source = available.length > 0 ? available : prizes

  const entries: WheelSegmentEntry[] = []
  for (let copyIndex = 0; copyIndex < WHEEL_SEGMENT_MULTIPLIER; copyIndex += 1) {
    source.forEach((prize, sourceIndex) => {
      const displayColor = copyIndex === 0
        ? prize.color
        : mixHex(prize.color, SECONDARY_MIX_TARGETS[sourceIndex % SECONDARY_MIX_TARGETS.length])

      entries.push({
        prize,
        copyIndex,
        displayColor,
        segmentKey: `${prize.id}-${copyIndex}`,
      })
    })
  }

  return entries
}
