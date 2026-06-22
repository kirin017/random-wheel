import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { menuImg } from '../utils/brandAssets'

export interface Prize {
  id: string
  name: string
  color: string
  quantity: number
  weight: number
  emoji: string
  image?: string
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
  { id: '1', name: 'Sữa Hạt Cao Cấp', color: '#b66639', quantity: 1, weight: 5, emoji: '🥛', image: menuImg('sữa hạt cao cấp.png') },
  { id: '2', name: 'Set Hạt Lành 14 Ngày', color: '#4c7257', quantity: 1, weight: 5, emoji: '🧺', image: menuImg('hạt lành_set 14 ngày.png') },
  { id: '3', name: 'Detox Chạm Lành', color: '#6f9079', quantity: 3, weight: 10, emoji: '🌿', image: menuImg('detox_chạm lành.png') },
  { id: '4', name: 'Smoothie No Lâu', color: '#cd7c4d', quantity: 5, weight: 15, emoji: '🥤', image: menuImg('smoothie no lâu.png') },
  { id: '5', name: 'Sữa Hạt Daily', color: '#5f8a6c', quantity: 8, weight: 25, emoji: '🥛', image: menuImg('sữa hạt daily.png') },
  { id: '6', name: 'Nước Ép Tươi', color: '#b58a3c', quantity: 8, weight: 25, emoji: '🍊', image: menuImg('nước ép_mặt 1.png') },
  { id: '7', name: 'Ginger Shot', color: '#d99468', quantity: 10, weight: 30, emoji: '⚡', image: menuImg('T2_GINGER SHOT.png') },
  { id: '8', name: 'Thử Lần Sau Nhé!', color: '#9a8c79', quantity: -1, weight: 40, emoji: '💚' },
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
    { name: 'random-wheel-v2' },
  ),
)
