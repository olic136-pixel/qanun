'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const JURISDICTIONS_LEFT = [
  'ADGM / FSRA', 'DIFC / DFSA', 'El Salvador · BCR',
  'Saudi Arabia · CMA', 'Mauritius · FSC', 'Pakistan · SECP',
  'ADGM / FSRA', 'DIFC / DFSA', 'El Salvador · BCR',
  'Saudi Arabia · CMA', 'Mauritius · FSC', 'Pakistan · SECP',
]
const JURISDICTIONS_RIGHT = [
  'Bahrain · CBB', 'Kenya · CMA', 'Nigeria · SEC',
  'Rwanda · BNR', 'Singapore · MAS', 'UAE · VARA',
  'Bahrain · CBB', 'Kenya · CMA', 'Nigeria · SEC',
  'Rwanda · BNR', 'Singapore · MAS', 'UAE · VARA',
]

const line1 = ['Regulatory', 'clarity.']
const line2 = ['Wherever', 'you', 'operate.']
const allWords = [...line1, 'BREAK', ...line2]

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="relative min-h-screen bg-[#0B1829] flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(26,95,168,0.10) 0%, transparent 70%)',
        }}
      />

      <div className="flex-1 flex flex-col justify-center max-w-[1280px] mx-auto px-6 pt-24 pb-16 w-full">
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2 mb-10"
          >
            <div className="flex items-center gap-2.5 border border-[#C4922A]/30 bg-[#C4922A]/10 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
              <span className="text-[12px] font-medium text-[#C4922A]">
                11 jurisdictions · 63,397 provisions indexed
              </span>
            </div>
          </motion.div>
        )}

        <h1 className="text-[48px] md:text-[68px] leading-[1.04] font-semibold tracking-[-0.03em] text-white mb-6"
            style={{ maxWidth: 760 }}>
          {mounted && allWords.map((word, i) => {
            if (word === 'BREAK') return <br key="br" />
            const isGold = word === 'clarity.' || word === 'operate.'
            const wordIndex = allWords.filter((w, j) => j < i && w !== 'BREAK').length
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3 + wordIndex * 0.09,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`inline-block mr-[0.22em] ${isGold ? 'text-[#C4922A]' : ''}`}
              >
                {word}
              </motion.span>
            )
          })}
        </h1>

        {mounted && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-[18px] text-[#9CA3AF] leading-[1.65] max-w-[540px] mb-10"
          >
            QANUN runs a 10-agent analysis pipeline across 63,397 regulatory
            provisions. In 90 seconds, you have a structured research note any
            senior counsel would act on.
          </motion.p>
        )}

        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.15 }}
            className="flex flex-wrap items-center gap-4 mb-14"
          >
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-[#C4922A] text-[#0B1829] font-semibold px-6 py-3.5 rounded-md text-[15px] hover:bg-[#D4A23A] transition-colors"
            >
              Start researching
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-white border border-white/20 px-6 py-3.5 rounded-md text-[15px] hover:bg-white/5 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 3.5l7 4.5-7 4.5V3.5z" fill="currentColor"/>
              </svg>
              See a live session
            </Link>
          </motion.div>
        )}

        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.35 }}
            className="flex flex-wrap items-center gap-6 text-[13px] font-mono text-[#4B5563]"
          >
            <span>2,484 documents</span>
            <span className="text-[#1F2937]">·</span>
            <span>63,397 provisions</span>
            <span className="text-[#1F2937]">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
              10 agents live
            </span>
          </motion.div>
        )}
      </div>

      <div className="border-t border-white/[0.06] py-4 overflow-hidden">
        <div className="flex flex-col gap-3">
          <div className="flex overflow-hidden">
            <div className="flex gap-10 animate-marquee-left whitespace-nowrap">
              {[...JURISDICTIONS_LEFT, ...JURISDICTIONS_LEFT].map((j, i) => (
                <span key={i} className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#374151]">
                  {j}
                </span>
              ))}
            </div>
          </div>
          <div className="flex overflow-hidden">
            <div className="flex gap-10 animate-marquee-right whitespace-nowrap">
              {[...JURISDICTIONS_RIGHT, ...JURISDICTIONS_RIGHT].map((j, i) => (
                <span key={i} className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#374151]">
                  {j}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
