'use client'

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const liveMarkets = ['ADGM / FSRA', 'DIFC / DFSA', 'El Salvador']
const comingSoonMarkets = ['Saudi CMA', 'Mauritius FSC', 'Pakistan SECP', 'Bahrain CBB']
const plannedMarkets = ['Kenya CMA', 'Nigeria SEC', 'Rwanda BNR', 'Singapore MAS']

function MarketPill({
  label,
  variant,
}: {
  label: string
  variant: 'live' | 'coming' | 'planned'
}) {
  const styles = {
    live: 'border-[#0F7A5F] bg-[rgba(15,122,95,0.1)] text-[#0F7A5F]',
    coming: 'border-[#C4922A] bg-[rgba(196,146,42,0.1)] text-[#C4922A]',
    planned: 'border-[rgba(255,255,255,0.2)] bg-transparent text-[rgba(255,255,255,0.4)]',
  }

  return (
    <span
      className={`text-[11px] rounded-[20px] px-3 py-1 border ${styles[variant]}`}
    >
      {label}
    </span>
  )
}

export function HeroSection() {
  return (
    <section className="w-full bg-[#0B1829] min-h-screen md:min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        {/* Eyebrow badge */}
        <div className="flex items-center gap-2 border border-[#C4922A] rounded-full px-4 py-1.5 mb-8">
          <span className="w-[5px] h-[5px] rounded-full bg-[#C4922A]" />
          <span className="text-[#C4922A] text-xs">
            Regulatory intelligence for emerging markets
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[32px] md:text-[48px] font-medium leading-tight mb-6">
          <span className="text-white">The law, </span>
          <span className="text-[#C4922A]">decoded</span>
          <span className="text-white">.</span>
          <br />
          <span className="text-white">Wherever you operate.</span>
        </h1>

        {/* Sub-copy */}
        <p className="text-[15px] text-[rgba(255,255,255,0.6)] max-w-[520px] mb-8 leading-relaxed">
          QANUN is the AI-powered regulatory intelligence platform built for
          founders, CLOs, and compliance teams navigating ADGM, DIFC, and the
          world&apos;s fastest-growing financial markets.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-row gap-3 mb-12">
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants(),
              'bg-[#1A5FA8] text-white h-11 px-6 hover:bg-[#16508a]'
            )}
          >
            Start free trial
          </Link>
          <Link
            href="#features"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'border-[rgba(255,255,255,0.25)] text-[rgba(255,255,255,0.7)] bg-transparent h-11 px-6 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
            )}
          >
            See it live
          </Link>
        </div>

        {/* Market status strip */}
        <div className="flex flex-wrap justify-center gap-2">
          {liveMarkets.map((m) => (
            <MarketPill key={m} label={m} variant="live" />
          ))}
          {comingSoonMarkets.map((m) => (
            <MarketPill key={m} label={m} variant="coming" />
          ))}
          {plannedMarkets.map((m) => (
            <MarketPill key={m} label={m} variant="planned" />
          ))}
        </div>
      </div>
    </section>
  )
}
