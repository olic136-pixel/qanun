'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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

const PIPELINE_STEPS = [
  { agent: 'retriever', label: 'Retrieving corpus provisions…', duration: 1800 },
  { agent: 'analyst', label: 'Running legal analysis…', duration: 2200 },
  { agent: 'devils_advocate', label: "Devil's advocate review…", duration: 1600 },
  { agent: 'blue_sky', label: 'Lateral thinking…', duration: 1400 },
  { agent: 'stress_tester', label: 'Stress testing…', duration: 1500 },
  { agent: 'orchestrator', label: 'Synthesising research note…', duration: 2000 },
]

const CLAIMS_REVEAL = [
  { tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.15)', border: 'rgba(15,122,95,0.25)',
    text: 'COBS 23.12.2 requires a Managing Assets FSP for any copy trading service offered to Retail Clients.',
    ref: 'COBS 23.12.2' },
  { tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.15)', border: 'rgba(15,122,95,0.25)',
    text: 'The "similar services" catch-all captures block-delegation models regardless of characterisation.',
    ref: 'COBS 23.4.1' },
  { tier: 'SUPPORTED', color: '#1A5FA8', bg: 'rgba(26,95,168,0.15)', border: 'rgba(26,95,168,0.25)',
    text: 'FSRA retains broad supervisory discretion under the "satisfaction of the Regulator" standard.',
    ref: 'COBS 23.5.1' },
  { tier: 'INFERRED', color: '#C4922A', bg: 'rgba(196,146,42,0.15)', border: 'rgba(196,146,42,0.25)',
    text: 'A Category 3A licence would be required in addition to the Managing Assets FSP.',
    ref: 'PRU 1.3.3' },
]

type Phase = 'idle' | 'pipeline' | 'results'

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompleted] = useState<number[]>([])
  const [visibleClaims, setVisibleClaims] = useState<number[]>([])
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    cancelledRef.current = false
    const t = setTimeout(() => runPipeline(), 2000)
    return () => { clearTimeout(t); cancelledRef.current = true; if (elapsedRef.current) clearInterval(elapsedRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  async function runPipeline() {
    if (cancelledRef.current) return
    setPhase('pipeline')
    setCompleted([])
    setCurrentStep(0)
    setElapsed(0)
    setVisibleClaims([])

    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      if (cancelledRef.current) return
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, PIPELINE_STEPS[i].duration))
      setCompleted(prev => [...prev, i])
    }

    if (elapsedRef.current) clearInterval(elapsedRef.current)
    if (cancelledRef.current) return
    setPhase('results')

    for (let i = 0; i < CLAIMS_REVEAL.length; i++) {
      if (cancelledRef.current) return
      await new Promise(r => setTimeout(r, 350))
      setVisibleClaims(prev => [...prev, i])
    }

    await new Promise(r => setTimeout(r, 6000))
    if (cancelledRef.current) return
    setPhase('idle')
    await new Promise(r => setTimeout(r, 400))
    if (!cancelledRef.current) runPipeline()
  }

  return (
    <section className="relative min-h-screen bg-[#0B1829] flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 55% 60% at 75% 40%, rgba(26,95,168,0.12) 0%, transparent 65%)',
      }} />

      <div className="flex-1 max-w-[1280px] mx-auto px-6 pt-28 pb-10 w-full
                      grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-start">
        {/* LEFT: copy */}
        <div className="pt-8">
          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2 mb-8"
            >
              <div className="flex items-center gap-2.5 border border-[#C4922A]/30
                              bg-[#C4922A]/10 rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                <span className="text-[12px] font-medium text-[#C4922A]">
                  11 jurisdictions · 63,397 provisions indexed
                </span>
              </div>
            </motion.div>
          )}

          <h1 className="text-[clamp(44px,5.5vw,72px)] leading-[1.04]
                         font-semibold tracking-[-0.03em] text-white mb-6">
            {mounted && allWords.map((word, i) => {
              if (word === 'BREAK') return <br key="br" />
              const isGold = word === 'clarity.' || word === 'operate.'
              const wordIndex = allWords.filter((w, j) => j < i && w !== 'BREAK').length
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + wordIndex * 0.09,
                                ease: [0.16, 1, 0.3, 1] }}
                  className={`inline-block mr-[0.2em] ${isGold ? 'text-[#C4922A]' : ''}`}
                >
                  {word}
                </motion.span>
              )
            })}
          </h1>

          {mounted && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05 }}
              className="text-[17px] text-[#9CA3AF] leading-[1.65] max-w-[480px] mb-9"
            >
              QANUN runs a 10-agent analysis pipeline across 63,397 regulatory
              provisions. In 90 seconds, you have a structured research note any
              senior counsel would act on.
            </motion.p>
          )}

          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex flex-wrap items-center gap-4 mb-12"
            >
              <Link href="/sign-up"
                className="inline-flex items-center gap-2 bg-[#C4922A] text-[#0B1829]
                           font-semibold px-6 py-3.5 rounded-md text-[15px]
                           hover:bg-[#D4A23A] transition-colors">
                Start researching
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/sign-in"
                className="inline-flex items-center gap-2 text-white border
                           border-white/20 px-6 py-3.5 rounded-md text-[15px]
                           hover:bg-white/5 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4 2.5l7 4.5-7 4.5V2.5z" fill="currentColor"/>
                </svg>
                See a live session
              </Link>
            </motion.div>
          )}

          {mounted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="flex flex-wrap items-center gap-6 text-[12px] font-mono text-[#4B5563]"
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

        {/* RIGHT: animated pipeline terminal */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 flex flex-col"
                 style={{ background: '#0D1F30',
                          boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
                          height: '520px' }}>
              {/* Terminal chrome */}
              <div className="bg-[#111827] px-5 py-3.5 flex items-center
                              justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-[12px] text-[#6B7280] ml-1 font-mono">
                    QANUN · Research Pipeline
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                  <span className="text-[11px] font-mono text-[#0F7A5F]">live</span>
                </div>
              </div>

              {/* Query line */}
              <div className="px-5 py-4 border-b border-white/[0.07] bg-[#0B1F2E]">
                <p className="text-[10px] font-mono tracking-[0.1em] text-[#C4922A] mb-1.5">QUERY</p>
                <p className="text-[13px] text-white/80 leading-relaxed font-mono">
                  When does copy trading require a Managing Assets FSP under COBS 23.12.2?
                </p>
              </div>

              {/* Pipeline steps */}
              <div className="px-5 py-4 border-b border-white/[0.07] flex-1 overflow-hidden">
                <p className="text-[10px] font-mono tracking-[0.1em] text-[#C4922A] mb-3">PIPELINE</p>
                <div className="space-y-2">
                  {PIPELINE_STEPS.map((step, i) => {
                    const isDone = completedSteps.includes(i)
                    const isActive = phase === 'pipeline' && currentStep === i
                    const isPending = !isDone && !isActive
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {isDone ? (
                            <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }}
                              width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="6" fill="rgba(15,122,95,0.3)" stroke="#0F7A5F" strokeWidth="1"/>
                              <path d="M4.5 7l2 2 3-3" stroke="#0F7A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </motion.svg>
                          ) : isActive ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#C4922A] animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/15" />
                          )}
                        </div>
                        <span className={`text-[11px] font-mono flex-1 ${
                          isDone ? 'text-[#6B7280]' : isActive ? 'text-white' : 'text-white/25'
                        }`}>
                          {step.agent}
                        </span>
                        {isActive && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-[10px] font-mono text-[#C4922A]">
                            {step.label}
                          </motion.span>
                        )}
                        {isDone && (
                          <span className="text-[10px] font-mono text-[#374151]">done</span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
                {phase !== 'idle' && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#374151]">elapsed</span>
                    <span className="text-[11px] font-mono text-[#6B7280]">{elapsed}s</span>
                  </div>
                )}
              </div>

              {/* Results / claims */}
              <div className="px-5 py-4 overflow-y-auto" style={{ minHeight: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono tracking-[0.1em] text-[#C4922A]">REFERENCE MATERIAL</p>
                  {phase === 'results' && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-[10px] font-mono text-[#6B7280]">
                      {visibleClaims.length} claims
                    </motion.span>
                  )}
                </div>
                <div className="relative" style={{ minHeight: '20px' }}>
                  <AnimatePresence>
                    {phase === 'pipeline' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center gap-2
                                   text-[12px] font-mono text-[#374151]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#374151] animate-pulse" />
                        Waiting for pipeline…
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {phase === 'results' && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-2.5"
                    >
                  {visibleClaims.map(i => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-lg p-3 border"
                      style={{ background: CLAIMS_REVEAL[i].bg, borderColor: CLAIMS_REVEAL[i].border }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border"
                          style={{ color: CLAIMS_REVEAL[i].color, borderColor: CLAIMS_REVEAL[i].border, background: 'rgba(0,0,0,0.2)' }}>
                          {CLAIMS_REVEAL[i].tier}
                        </span>
                        <span className="text-[9px] font-mono text-[#6B7280]">{CLAIMS_REVEAL[i].ref}</span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">{CLAIMS_REVEAL[i].text}</p>
                    </motion.div>
                  ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Jurisdiction marquee strip */}
      <div className="border-t border-white/[0.05] py-3.5 overflow-hidden">
        <div className="flex flex-col gap-2.5">
          <div className="flex overflow-hidden">
            <div className="flex gap-10 animate-marquee-left whitespace-nowrap">
              {[...JURISDICTIONS_LEFT, ...JURISDICTIONS_LEFT].map((j, i) => (
                <span key={i} className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#2D3748]">{j}</span>
              ))}
            </div>
          </div>
          <div className="flex overflow-hidden">
            <div className="flex gap-10 animate-marquee-right whitespace-nowrap">
              {[...JURISDICTIONS_RIGHT, ...JURISDICTIONS_RIGHT].map((j, i) => (
                <span key={i} className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#2D3748]">{j}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
