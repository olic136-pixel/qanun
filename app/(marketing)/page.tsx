import { HeroSection } from '@/components/marketing/HeroSection'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { CapabilityCards } from '@/components/marketing/CapabilityCards'
import { JurisdictionsSection } from '@/components/marketing/JurisdictionsSection'
import { FounderStatement } from '@/components/marketing/FounderStatement'
import { TrustSection } from '@/components/marketing/TrustSection'
import { CTASection } from '@/components/marketing/CTASection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QANUN — The law, decoded. Wherever you operate.',
  description: 'AI-powered regulatory intelligence for ADGM, DIFC, and emerging markets.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <CapabilityCards />
      <JurisdictionsSection />
      <FounderStatement />
      <TrustSection />
      <CTASection />
    </>
  )
}
