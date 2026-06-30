import type { Prize } from '../store/wheelStore'
import { getWheelSegmentEntries } from './wheelSegments'

/** Pick a weighted random prize from available prizes (quantity > 0 or quantity === -1 = unlimited) */
export function pickWeightedPrize(prizes: Prize[]): Prize | null {
  const available = prizes.filter((p) => p.quantity !== 0)
  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, p) => sum + p.weight, 0)
  let rand = Math.random() * totalWeight

  for (const prize of available) {
    rand -= prize.weight
    if (rand <= 0) return prize
  }
  return available[available.length - 1] ?? null
}

/** Calculate the target rotation angle so the pointer lands on the given prize segment */
export function calcTargetAngle(
  prizes: Prize[],
  winner: Prize,
  currentRotation: number,
  minSpins = 8,
): number {
  const segmentEntries = getWheelSegmentEntries(prizes)
  const winnerSegmentIndexes = segmentEntries.reduce<number[]>((indexes, entry, index) => {
    if (entry.prize.id === winner.id) indexes.push(index)
    return indexes
  }, [])
  if (winnerSegmentIndexes.length === 0) return currentRotation

  const prizeIndex = winnerSegmentIndexes[Math.floor(Math.random() * winnerSegmentIndexes.length)]

  // Segments are rendered equal-sized; match that geometry here so the pointer lands correctly.
  const segmentSize = 360 / segmentEntries.length
  const angle = prizeIndex * segmentSize
  const midAngle = angle + segmentSize / 2

  // Pointer is at top (270° in standard coords, or we offset so it points at 0°)
  // We want midAngle to be at the top (0°). Rotation needed = 360 - midAngle
  const targetSegmentTop = 360 - midAngle

  // Add extra full spins
  const extraSpins = (minSpins + Math.floor(Math.random() * 4)) * 360
  const normalised = ((currentRotation % 360) + 360) % 360
  const diff = ((targetSegmentTop - normalised + 360) % 360)

  return currentRotation + extraSpins + diff
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
