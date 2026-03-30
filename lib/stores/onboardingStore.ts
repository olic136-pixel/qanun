import { create } from 'zustand'

interface OnboardingState {
  step: 1 | 2
  role: string
  orgName: string
  setStep: (step: 1 | 2) => void
  setRole: (role: string) => void
  setOrgName: (orgName: string) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  role: '',
  orgName: '',
  setStep: (step) => set({ step }),
  setRole: (role) => set({ role }),
  setOrgName: (orgName) => set({ orgName }),
  reset: () => set({ step: 1, role: '', orgName: '' }),
}))
