import { create } from 'zustand'

interface UIStore {
  paletteOpen: boolean
  setPaletteOpen: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
}))
