import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Prize {
  id: string
  name: string
  color: string
  quantity: number
  weight: number
  emoji: string
}

export interface Winner {
  id: string
  prizeName: string
  prizeEmoji: string
  timestamp: number
}

interface WheelState {
  prizes: Prize[]
  winners: Winner[]
  isSpinning: boolean
  currentWinner: Prize | null
  showWinnerOverlay: boolean
  adminUnlocked: boolean
  soundEnabled: boolean

  setPrizes: (prizes: Prize[]) => void
  addPrize: (prize: Omit<Prize, 'id'>) => void
  updatePrize: (id: string, updates: Partial<Omit<Prize, 'id'>>) => void
  deletePrize: (id: string) => void
  setIsSpinning: (v: boolean) => void
  setCurrentWinner: (prize: Prize | null) => void
  setShowWinnerOverlay: (v: boolean) => void
  recordWinner: (prize: Prize) => void
  clearWinners: () => void
  setAdminUnlocked: (v: boolean) => void
  setSoundEnabled: (v: boolean) => void
  decrementPrize: (id: string) => void
}

const DEFAULT_PRIZES: Prize[] = [
  { id: '1', name: 'Giải Nhất', color: '#f59e0b', quantity: 1, weight: 5, emoji: '🥇' },
  { id: '2', name: 'Giải Nhì', color: '#60a5fa', quantity: 2, weight: 10, emoji: '🥈' },
  { id: '3', name: 'Giải Ba', color: '#34d399', quantity: 3, weight: 15, emoji: '🥉' },
  { id: '4', name: 'Khuyến Khích', color: '#f472b6', quantity: 10, weight: 30, emoji: '🎁' },
  { id: '5', name: 'Thử Lại', color: '#a78bfa', quantity: -1, weight: 40, emoji: '🔄' },
]

export const useWheelStore = create<WheelState>()(
  persist(
    (set) => ({
      prizes: DEFAULT_PRIZES,
      winners: [],
      isSpinning: false,
      currentWinner: null,
      showWinnerOverlay: false,
      adminUnlocked: false,
      soundEnabled: true,

      setPrizes: (prizes) => set({ prizes }),
      addPrize: (prize) =>
        set((s) => ({ prizes: [...s.prizes, { ...prize, id: Date.now().toString() }] })),
      updatePrize: (id, updates) =>
        set((s) => ({ prizes: s.prizes.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deletePrize: (id) => set((s) => ({ prizes: s.prizes.filter((p) => p.id !== id) })),
      setIsSpinning: (v) => set({ isSpinning: v }),
      setCurrentWinner: (prize) => set({ currentWinner: prize }),
      setShowWinnerOverlay: (v) => set({ showWinnerOverlay: v }),
      recordWinner: (prize) =>
        set((s) => ({
          winners: [
            { id: Date.now().toString(), prizeName: prize.name, prizeEmoji: prize.emoji, timestamp: Date.now() },
            ...s.winners,
          ],
        })),
      clearWinners: () => set({ winners: [] }),
      setAdminUnlocked: (v) => set({ adminUnlocked: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      decrementPrize: (id) =>
        set((s) => ({
          prizes: s.prizes.map((p) =>
            p.id === id && p.quantity > 0 ? { ...p, quantity: p.quantity - 1 } : p,
          ),
        })),
    }),
    { name: 'random-wheel-storage' },
  ),
)
