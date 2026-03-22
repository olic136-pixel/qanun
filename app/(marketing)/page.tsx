import { HeroSection } from '@/components/qanun/marketing/HeroSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QANUN — The law, decoded. Wherever you operate.',
  description: 'AI-powered regulatory intelligence for ADGM, DIFC, and emerging markets.',
}

export default function Page() {
  return <HeroSection />
}
