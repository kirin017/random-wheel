import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { driveImg } from '../utils/brandAssets'
import { BRAND_COLORS } from '../utils/brandPalette'

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
  name?: string
  phone?: string
  consent?: boolean
}

export interface LeadInfo {
  name: string
  phone: string
  consent: boolean
}

interface WheelState {
  prizes: Prize[]
  winners: Winner[]
  isSpinning: boolean
  currentWinner: Prize | null
  showWinnerOverlay: boolean
  adminUnlocked: boolean
  soundEnabled: boolean
  sheetsUrl: string

  setPrizes: (prizes: Prize[]) => void
  addPrize: (prize: Omit<Prize, 'id'>) => void
  updatePrize: (id: string, updates: Partial<Omit<Prize, 'id'>>) => void
  deletePrize: (id: string) => void
  setIsSpinning: (v: boolean) => void
  setCurrentWinner: (prize: Prize | null) => void
  setShowWinnerOverlay: (v: boolean) => void
  recordWinner: (prize: Prize, lead?: LeadInfo) => void
  clearWinners: () => void
  setAdminUnlocked: (v: boolean) => void
  setSoundEnabled: (v: boolean) => void
  setSheetsUrl: (v: string) => void
  decrementPrize: (id: string) => void
}

type PersistedWheelState = Pick<
  WheelState,
  'prizes' | 'winners' | 'adminUnlocked' | 'soundEnabled' | 'sheetsUrl'
>

const DEFAULT_PRIZE_COLORS: Record<string, string> = {
  'ginger-shot-any': BRAND_COLORS.tomatoDark,
  'sua-hat-any': BRAND_COLORS.forest,
  'detox-xanh': BRAND_COLORS.leaf,
  'detox-do': BRAND_COLORS.tomato,
  'smoothie-any': BRAND_COLORS.citrus,
  'hu-mach-any': BRAND_COLORS.lineStrong,
}

const DEFAULT_PRIZES: Prize[] = [
  { id: 'ginger-shot-any', name: 'Ginger Shot Vị Bất Kỳ', color: DEFAULT_PRIZE_COLORS['ginger-shot-any'], quantity: 999, weight: 25, emoji: '⚡', image: driveImg('14Sw6OqnKCLuzzSctN_MTpOYpqLxY-zN7') },
  { id: 'sua-hat-any', name: 'Sữa Hạt Vị Bất Kỳ', color: DEFAULT_PRIZE_COLORS['sua-hat-any'], quantity: 999, weight: 25, emoji: '🥛', image: driveImg('1eQZr-Biucevy52dPTO2dygL5FE2uYHiK') },
  { id: 'detox-xanh', name: 'Detox Xanh', color: DEFAULT_PRIZE_COLORS['detox-xanh'], quantity: 999, weight: 20, emoji: '🌿', image: driveImg('1s8j6vSN0d1TGXTg1YnClEjj3Ggr6sjK8') },
  { id: 'detox-do', name: 'Detox Đỏ', color: DEFAULT_PRIZE_COLORS['detox-do'], quantity: 999, weight: 20, emoji: '🍓', image: driveImg('1A_rDzjg8YSf5T-rI9ceeaxP7qJqEZRqO') },
  { id: 'smoothie-any', name: 'Smoothie Vị Bất Kỳ', color: DEFAULT_PRIZE_COLORS['smoothie-any'], quantity: 999, weight: 7, emoji: '🥤', image: driveImg('1eMgxarXNiVrAv_KORItsR4ZIwbhw8zIw') },
  { id: 'hu-mach-any', name: 'Hũ Mạch Vị Bất Kỳ', color: DEFAULT_PRIZE_COLORS['hu-mach-any'], quantity: 999, weight: 3, emoji: '🥣', image: driveImg('1YO7DHEJ3EZRPJWnBe3KLXEDXvJziN9Mt') },
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
      sheetsUrl: (import.meta.env.VITE_SHEETS_URL as string | undefined) ?? '',

      setPrizes: (prizes) => set({ prizes }),
      addPrize: (prize) =>
        set((s) => ({ prizes: [...s.prizes, { ...prize, id: Date.now().toString() }] })),
      updatePrize: (id, updates) =>
        set((s) => ({ prizes: s.prizes.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deletePrize: (id) => set((s) => ({ prizes: s.prizes.filter((p) => p.id !== id) })),
      setIsSpinning: (v) => set({ isSpinning: v }),
      setCurrentWinner: (prize) => set({ currentWinner: prize }),
      setShowWinnerOverlay: (v) => set({ showWinnerOverlay: v }),
      recordWinner: (prize, lead) =>
        set((s) => ({
          winners: [
            {
              id: Date.now().toString(),
              prizeName: prize.name,
              prizeEmoji: prize.emoji,
              timestamp: Date.now(),
              name: lead?.name,
              phone: lead?.phone,
              consent: lead?.consent,
            },
            ...s.winners,
          ],
        })),
      clearWinners: () => set({ winners: [] }),
      setAdminUnlocked: (v) => set({ adminUnlocked: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setSheetsUrl: (v) => set({ sheetsUrl: v.trim() }),
      decrementPrize: (id) =>
        set((s) => ({
          prizes: s.prizes.map((p) =>
            p.id === id && p.quantity > 0 ? { ...p, quantity: p.quantity - 1 } : p,
          ),
        })),
    }),
    {
      name: 'random-wheel-v2',
      version: 5,
      migrate: (persistedState) => {
        const state = persistedState as Partial<WheelState>

        return {
          prizes: DEFAULT_PRIZES,
          winners: Array.isArray(state.winners) ? state.winners : [],
          adminUnlocked: state.adminUnlocked ?? false,
          soundEnabled: state.soundEnabled ?? true,
          sheetsUrl: typeof state.sheetsUrl === 'string' ? state.sheetsUrl : '',
        }
      },
      partialize: (state): PersistedWheelState => ({
        prizes: state.prizes,
        winners: state.winners,
        adminUnlocked: state.adminUnlocked,
        soundEnabled: state.soundEnabled,
        sheetsUrl: state.sheetsUrl,
      }),
    },
  ),
)
