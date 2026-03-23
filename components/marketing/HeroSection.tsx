'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const JLEFT = ['ADGM / FSRA','DIFC / DFSA','El Salvador · BCR','Saudi Arabia · CMA','Mauritius · FSC','Pakistan · SECP','ADGM / FSRA','DIFC / DFSA','El Salvador · BCR','Saudi Arabia · CMA','Mauritius · FSC','Pakistan · SECP']
const JRIGHT = ['Bahrain · CBB','Kenya · CMA','Nigeria · SEC','Rwanda · BNR','Singapore · MAS','UAE · VARA','Bahrain · CBB','Kenya · CMA','Nigeria · SEC','Rwanda · BNR','Singapore · MAS','UAE · VARA']

const WORDS = ['Regulatory','clarity.','BREAK','Wherever','you','operate.']

const QUERY_TEXT = 'When does a copy trading service require a Managing Assets FSP under COBS 23.12.2, and can a block-delegation model avoid this?'

const AGENTS = ['retriever','analyst','devils_advocate','blue_sky','stress_tester','orchestrator']

const DOC_SECTIONS: DocSection[] = [
  { type: 'heading', text: '1. The Regulatory Trigger' },
  {
    type: 'para',
    text: 'COBS 23.12.2 imposes a binary prohibition: an Authorised Person must not offer or arrange for Retail Clients to subscribe to copy trading, mirror trading, or similar services unless it holds a Financial Services Permission to undertake the Regulated Activity of Managing Assets.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.2)', border: 'rgba(15,122,95,0.3)' }],
  },
  {
    type: 'para',
    text: 'The rule imposes two cumulative requirements: (i) holding a Managing Assets FSP; and (ii) having implemented effective systems and controls to manage material risks, to the satisfaction of the Regulator.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.2)', border: 'rgba(15,122,95,0.3)' }],
  },
  { type: 'heading', text: '2. Scope — The "Similar Services" Catch-All' },
  {
    type: 'para',
    text: 'The rule extends beyond narrowly defined copy or mirror trading to capture "similar services." This catch-all is purposively broad, designed to capture functional equivalents regardless of how the arrangement is characterised by the operator.',
    citations: [{ ref: 'COBS 23.4.1', tier: 'SUPPORTED', color: '#1A5FA8', bg: 'rgba(26,95,168,0.2)', border: 'rgba(26,95,168,0.3)' }],
  },
  { type: 'heading', text: '3. The Block-Delegation Model' },
  {
    type: 'para',
    text: 'A block-delegation model — in which clients set parameters but execution decisions are made by a lead trader or algorithm — does not avoid the COBS 23.12.2 trigger. The characterisation of who makes the "investment decision" is irrelevant to the rule\'s application.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.2)', border: 'rgba(15,122,95,0.3)' }],
  },
  {
    type: 'para',
    text: 'Parameter-setting by the client is functionally analogous to an investment policy statement. It defines the mandate; it does not constitute the investment decision itself.',
    citations: [{ ref: 'COBS 23.5.1', tier: 'INFERRED', color: '#C4922A', bg: 'rgba(196,146,42,0.2)', border: 'rgba(196,146,42,0.3)' }],
  },
  { type: 'heading', text: '4. FSRA Supervisory Discretion' },
  {
    type: 'para',
    text: 'The requirement to implement systems and controls "to the satisfaction of the Regulator" confers broad FSRA supervisory discretion to look through any structural characterisation and assess the true nature of the arrangement.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'SUPPORTED', color: '#1A5FA8', bg: 'rgba(26,95,168,0.2)', border: 'rgba(26,95,168,0.3)' }],
  },
  { type: 'claims_header', text: 'Reference Material' },
  {
    type: 'claim', tier: 'VERIFIED', color: '#0F7A5F',
    bg: 'rgba(15,122,95,0.12)', border: 'rgba(15,122,95,0.25)',
    text: 'COBS 23.12.2 requires a Managing Assets FSP for any copy or mirror trading service offered to Retail Clients.',
    ref: 'COBS 23.12.2',
  },
  {
    type: 'claim', tier: 'VERIFIED', color: '#0F7A5F',
    bg: 'rgba(15,122,95,0.12)', border: 'rgba(15,122,95,0.25)',
    text: 'The "similar services" catch-all captures block-delegation models regardless of how the investment decision is characterised.',
    ref: 'COBS 23.4.1',
  },
  {
    type: 'claim', tier: 'SUPPORTED', color: '#1A5FA8',
    bg: 'rgba(26,95,168,0.12)', border: 'rgba(26,95,168,0.25)',
    text: 'FSRA retains broad supervisory discretion under the "satisfaction of the Regulator" standard to look through structural arrangements.',
    ref: 'COBS 23.12.2',
  },
  {
    type: 'claim', tier: 'INFERRED', color: '#C4922A',
    bg: 'rgba(196,146,42,0.12)', border: 'rgba(196,146,42,0.25)',
    text: 'Client parameter-setting is functionally analogous to an investment policy statement and does not constitute the investment decision.',
    ref: 'COBS 23.5.1',
  },
]

interface Citation { ref: string; tier: string; color: string; bg: string; border: string }
interface DocSection {
  type: 'heading' | 'para' | 'claims_header' | 'claim'
  text?: string
  citations?: Citation[]
  tier?: string
  color?: string
  bg?: string
  border?: string
  ref?: string
}

type Phase = 'typing' | 'processing' | 'document'

function useTypewriter(text: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active) { setDisplayed(''); return }
    let i = 0
    setDisplayed('')
    const iv = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [text, active, speed])
  return displayed
}

function CitationChip({ citRef, tier, color, bg, border }: {
  citRef: string; tier: string; color: string; bg: string; border: string
}) {
  return (
    <span className="inline-flex items-center gap-1 mx-0.5 align-middle">
      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{ color: '#60A5FA', background: 'rgba(26,95,168,0.2)',
                     border: '1px solid rgba(26,95,168,0.3)' }}>
        {citRef}
      </span>
      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ color, background: bg, border: `1px solid ${border}` }}>
        {tier}
      </span>
    </span>
  )
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('typing')
  const [agentIdx, setAgentIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(false)

  const typedQuery = useTypewriter(QUERY_TEXT, mounted && phase === 'typing')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    cancelRef.current = false
    runLoop()
    return () => { cancelRef.current = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }

  async function runLoop() {
    while (!cancelRef.current) {
      // Phase 1: typing
      setPhase('typing')
      setProgress(0)
      await delay(QUERY_TEXT.length * 18 + 600)
      if (cancelRef.current) return

      // Phase 2: processing
      setPhase('processing')
      const PROCESSING_MS = 2800
      const start = Date.now()
      const agentIv = setInterval(() => setAgentIdx(i => (i + 1) % AGENTS.length), 380)
      const progIv = setInterval(() => {
        setProgress(Math.min(98, ((Date.now() - start) / PROCESSING_MS) * 100))
      }, 40)
      await delay(PROCESSING_MS)
      clearInterval(agentIv)
      clearInterval(progIv)
      setProgress(100)
      await delay(300)
      if (cancelRef.current) return

      // Phase 3: document
      setPhase('document')
      await delay(500)

      // Auto-scroll
      const el = scrollRef.current
      if (el) {
        const totalScroll = el.scrollHeight - el.clientHeight
        if (totalScroll > 0) {
          const scrollDuration = 14000
          const scrollStart = Date.now()
          const scrollIv = setInterval(() => {
            const frac = Math.min(1, (Date.now() - scrollStart) / scrollDuration)
            el.scrollTop = frac * totalScroll
            if (frac >= 1) clearInterval(scrollIv)
          }, 16)
          await delay(scrollDuration + 2000)
          clearInterval(scrollIv)
        } else {
          await delay(12000)
        }
        el.scrollTop = 0
      } else {
        await delay(12000)
      }
    }
  }

  return (
    <section className="relative bg-[#0B1829] flex flex-col overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 55% 60% at 72% 35%, rgba(26,95,168,0.11) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 15% 85%, rgba(196,146,42,0.04) 0%, transparent 60%)',
      }} />
      {/* Bottom fade — bridges to white section below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(11,24,41,0.6))' }}
      />

      <div className="max-w-[1280px] mx-auto px-6 pt-28 pb-16 w-full
                      grid grid-cols-1 lg:grid-cols-2 gap-10 lg:items-start">
        {/* LEFT COLUMN */}
        <div className="pt-4">
          {mounted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-2 mb-8">
              <div className="flex items-center gap-2.5 border border-[#C4922A]/30
                              bg-[#C4922A]/10 rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                <span className="text-[12px] font-medium text-[#C4922A]">
                  11 jurisdictions · 63,397 provisions indexed
                </span>
              </div>
            </motion.div>
          )}

          <h1 className="text-[clamp(42px,5.2vw,68px)] leading-[1.05]
                         font-semibold tracking-[-0.03em] text-white mb-6">
            {mounted && WORDS.map((w, i) => {
              if (w === 'BREAK') return <br key="br" />
              const isGold = w === 'clarity.' || w === 'operate.'
              const wi = WORDS.filter((x, j) => j < i && x !== 'BREAK').length
              return (
                <motion.span key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + wi * 0.09, ease: [0.16, 1, 0.3, 1] }}
                  className={`inline-block mr-[0.2em] ${isGold ? 'text-[#C4922A]' : ''}`}>
                  {w}
                </motion.span>
              )
            })}
          </h1>

          {mounted && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.05 }}
              className="text-[17px] text-[#9CA3AF] leading-[1.65] max-w-[460px] mb-9">
              QANUN runs a 10-agent analysis pipeline across 63,397 regulatory
              provisions. In 90 seconds, you have a structured research note any
              senior counsel would act on.
            </motion.p>
          )}

          {mounted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex flex-wrap items-center gap-4 mb-12">
              <Link href="/sign-up"
                className="inline-flex items-center gap-2 bg-[#C4922A] text-[#0B1829]
                           font-semibold px-6 py-3.5 rounded-md text-[15px]
                           hover:bg-[#D4A23A] transition-colors">
                Start researching
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/sign-in"
                className="inline-flex items-center gap-2 text-white border
                           border-white/20 px-6 py-3.5 rounded-md text-[15px]
                           hover:bg-white/5 transition-colors">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M3 2l8 4.5L3 11V2z" fill="currentColor"/>
                </svg>
                See a live session
              </Link>
            </motion.div>
          )}

          {mounted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="flex items-center gap-5 text-[12px] font-mono text-[#4B5563]">
              <span>2,484 documents</span>
              <span>·</span>
              <span>63,397 provisions</span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                10 agents live
              </span>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN — animated research document */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full">
            <div className="rounded-2xl overflow-hidden flex flex-col"
                 style={{
                   height: '520px',
                   background: '#0D1F30',
                   boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)',
                 }}>
              {/* Chrome bar */}
              <div className="flex-shrink-0 bg-[#111827] px-5 py-3 flex items-center
                              justify-between border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280] ml-1">
                    QANUN · Research
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#0F7A5F]">live</span>
                </div>
              </div>

              {/* Query display */}
              <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-white/[0.06]"
                   style={{ background: '#0B1F2E' }}>
                <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-1.5">
                  QUERY
                </p>
                <p className="text-[12px] font-mono text-white/80 leading-relaxed min-h-[32px]">
                  {phase === 'typing'
                    ? <>{typedQuery}<span className="animate-pulse">▋</span></>
                    : QUERY_TEXT}
                </p>
              </div>

              {/* Main content area */}
              <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
                {/* Typing phase idle */}
                {phase === 'typing' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[11px] font-mono text-white/20">preparing analysis…</p>
                  </div>
                )}

                {/* Processing phase */}
                <AnimatePresence>
                  {phase === 'processing' && (
                    <motion.div key="processing"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-6">
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono text-[#6B7280]">running pipeline</span>
                          <span className="text-[10px] font-mono text-[#C4922A]">{AGENTS[agentIdx]}</span>
                        </div>
                        <div className="h-[2px] w-full bg-white/[0.08] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-[width] duration-100 ease-linear"
                               style={{
                                 width: `${progress}%`,
                                 background: 'linear-gradient(90deg, #1A5FA8, #0F7A5F)',
                               }} />
                        </div>
                      </div>
                      <div className="flex gap-4 overflow-hidden">
                        {AGENTS.map((a, i) => (
                          <span key={a}
                            className="text-[11px] font-mono whitespace-nowrap transition-all duration-250"
                            style={{
                              opacity: i === agentIdx ? 1 : 0.18,
                              color: 'white',
                              transform: i === agentIdx ? 'scale(1.05)' : 'scale(1)',
                            }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Document phase */}
                <AnimatePresence>
                  {phase === 'document' && (
                    <motion.div key="document" ref={scrollRef}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 overflow-y-auto px-5 py-4 hide-scrollbar"
                      style={{ scrollbarWidth: 'none' }}>

                      {/* Doc meta header */}
                      <div className="mb-5 pb-4 border-b border-white/[0.08]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A]">
                            RESEARCH NOTE
                          </span>
                          <span className="text-[9px] font-mono text-[#374151]">
                            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-mono text-white/30 bg-white/5
                                           border border-white/10 px-2 py-0.5 rounded">
                            ADGM / FSRA
                          </span>
                          <span className="text-[9px] font-mono text-[#374151]">
                            14 claims · grounding 84% · 78s
                          </span>
                        </div>
                      </div>

                      {/* Doc body */}
                      <div className="space-y-0">
                        {DOC_SECTIONS.map((section, i) => {
                          if (section.type === 'heading') return (
                            <motion.p key={i}
                              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: i * 0.06 }}
                              className="text-[12px] font-semibold text-white mt-5 mb-2 leading-snug">
                              {section.text}
                            </motion.p>
                          )
                          if (section.type === 'para') return (
                            <motion.p key={i}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, delay: i * 0.06 }}
                              className="text-[12px] text-white/65 leading-[1.7] mb-1">
                              {section.text}
                              {section.citations?.map((c, j) => (
                                <CitationChip key={j} citRef={c.ref} tier={c.tier}
                                  color={c.color} bg={c.bg} border={c.border} />
                              ))}
                            </motion.p>
                          )
                          if (section.type === 'claims_header') return (
                            <motion.p key={i}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              transition={{ duration: 0.4, delay: i * 0.06 }}
                              className="text-[9px] font-mono tracking-[0.12em] uppercase
                                         text-[#C4922A] mt-7 mb-3 pt-5 border-t border-white/[0.07]">
                              {section.text}
                            </motion.p>
                          )
                          if (section.type === 'claim') return (
                            <motion.div key={i}
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: i * 0.07 }}
                              className="rounded-lg p-3 mb-2.5 border"
                              style={{ background: section.bg, borderColor: section.border }}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[8px] font-mono font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    color: section.color,
                                    background: 'rgba(0,0,0,0.25)',
                                    border: `1px solid ${section.border}`,
                                  }}>
                                  {section.tier}
                                </span>
                                <span className="text-[9px] font-mono text-[#6B7280]">{section.ref}</span>
                              </div>
                              <p className="text-[11px] text-white/70 leading-relaxed">{section.text}</p>
                            </motion.div>
                          )
                          return null
                        })}
                        {/* Fade gradient at bottom */}
                        <div className="h-16 sticky bottom-0 pointer-events-none -mt-16"
                             style={{ background: 'linear-gradient(to bottom, transparent, #0D1F30)' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status bar */}
              <div className="flex-shrink-0 bg-[#111827] px-5 py-2.5 border-t border-white/[0.08]
                              flex items-center gap-5">
                <span className={`text-[9px] font-mono ${
                  phase === 'typing' ? 'text-[#C4922A]' :
                  phase === 'processing' ? 'text-[#60A5FA]' : 'text-[#0F7A5F]'
                }`}>
                  {phase === 'typing' ? '● entering query' :
                   phase === 'processing' ? '● analysing corpus' : '● complete'}
                </span>
                <span className="text-[9px] font-mono text-[#374151]">·</span>
                <span className="text-[9px] font-mono text-[#374151]">ADGM / FSRA corpus</span>
                <span className="text-[9px] font-mono text-[#374151]">·</span>
                <span className="text-[9px] font-mono text-[#374151]">63,397 provisions</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Marquee strip */}
      <div className="border-t border-white/[0.10] py-3.5 overflow-hidden"
           style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex flex-col gap-2">
          <div className="flex overflow-hidden">
            <div className="flex gap-10 animate-marquee-left whitespace-nowrap">
              {[...JLEFT, ...JLEFT].map((j, i) => (
                <span key={i} className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6B7280]">{j}</span>
              ))}
            </div>
          </div>
          <div className="flex overflow-hidden">
            <div className="flex gap-10 animate-marquee-right whitespace-nowrap">
              {[...JRIGHT, ...JRIGHT].map((j, i) => (
                <span key={i} className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6B7280]">{j}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      {mounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.0 }}
          className="flex justify-center pb-4 pt-1"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-white/40">
              scroll
            </span>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="text-white/35">
              <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
