import { create } from 'zustand'

interface OnboardingState {
  step: 1 | 2 | 3
  role: string
  orgName: string
  jurisdictions: string[]
  firstQuery: string
  setStep: (step: 1 | 2 | 3) => void
  setRole: (role: string) => void
  setOrgName: (orgName: string) => void
  toggleJurisdiction: (j: string) => void
  setFirstQuery: (q: string) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  role: '',
  orgName: '',
  jurisdictions: [],
  firstQuery: '',
  setStep: (step) => set({ step }),
  setRole: (role) => set({ role }),
  setOrgName: (orgName) => set({ orgName }),
  toggleJurisdiction: (j) =>
    set((s) => ({
      jurisdictions: s.jurisdictions.includes(j)
        ? s.jurisdictions.filter((x) => x !== j)
        : [...s.jurisdictions, j],
    })),
  setFirstQuery: (firstQuery) => set({ firstQuery }),
  reset: () =>
    set({ step: 1, role: '', orgName: '', jurisdictions: [], firstQuery: '' }),
}))
