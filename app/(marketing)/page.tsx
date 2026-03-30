import { HeroSection } from '@/components/marketing/HeroSection'
import { ProofBar } from '@/components/marketing/ProofBar'
import { ProductDemo } from '@/components/marketing/ProductDemo'
import { JurisdictionsSection } from '@/components/marketing/JurisdictionsSection'
import { FounderStatement } from '@/components/marketing/FounderStatement'
import { CTASection } from '@/components/marketing/CTASection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QANUN — The law, decoded.',
  description: 'AI-powered regulatory intelligence and governance suite drafting for ADGM, VARA, and El Salvador. 65,822 provisions. Zero hallucination.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProofBar />
      <ProductDemo />
      <JurisdictionsSection />
      <FounderStatement />
      <CTASection />
    </>
  )
}
