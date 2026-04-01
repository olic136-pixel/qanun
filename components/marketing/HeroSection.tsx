'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const QUERY_TEXT = 'When does a copy trading service require a Managing Assets FSP under COBS 23.12.2, and can a block-delegation model avoid this?'

const AGENTS = ['retriever','analyst','devils_advocate','blue_sky','stress_tester','orchestrator']

const DOC_SECTIONS: DocSection[] = [
  { type: 'heading', text: '1. The Regulatory Trigger' },
  {
    type: 'para',
    text: 'COBS 23.12.2 imposes a binary prohibition: an Authorised Person must not offer or arrange for Retail Clients to subscribe to copy trading, mirror trading, or similar services unless it holds a Financial Services Permission to undertake the Regulated Activity of Managing Assets.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'VERIFIED', color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)' }],
  },
  {
    type: 'para',
    text: 'The rule imposes two cumulative requirements: (i) holding a Managing Assets FSP; and (ii) having implemented effective systems and controls to manage material risks, to the satisfaction of the Regulator.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'VERIFIED', color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)' }],
  },
  { type: 'heading', text: '2. Scope — The "Similar Services" Catch-All' },
  {
    type: 'para',
    text: 'The rule extends beyond narrowly defined copy or mirror trading to capture "similar services." This catch-all is purposively broad, designed to capture functional equivalents regardless of how the arrangement is characterised by the operator.',
    citations: [{ ref: 'COBS 23.4.1', tier: 'SUPPORTED', color: '#0047FF', bg: 'rgba(0,71,255,0.08)', border: 'rgba(0,71,255,0.20)' }],
  },
  { type: 'heading', text: '3. The Block-Delegation Model' },
  {
    type: 'para',
    text: 'A block-delegation model does not avoid the COBS 23.12.2 trigger. The characterisation of who makes the "investment decision" is irrelevant to the rule\'s application. Parameter-setting by the client does not constitute the investment decision.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'VERIFIED', color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)' }],
  },
  { type: 'heading', text: '4. FSRA Supervisory Discretion' },
  {
    type: 'para',
    text: 'The requirement to implement systems and controls "to the satisfaction of the Regulator" confers broad FSRA supervisory discretion to look through any structural characterisation of the arrangement.',
    citations: [{ ref: 'COBS 23.12.2', tier: 'SUPPORTED', color: '#0047FF', bg: 'rgba(0,71,255,0.08)', border: 'rgba(0,71,255,0.20)' }],
  },
  { type: 'claims_header', text: 'Reference Material' },
  {
    type: 'claim', tier: 'VERIFIED', color: '#059669',
    bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.18)',
    text: 'COBS 23.12.2 requires a Managing Assets FSP for copy/mirror trading to Retail Clients.',
    ref: 'COBS 23.12.2',
  },
  {
    type: 'claim', tier: 'SUPPORTED', color: '#0047FF',
    bg: 'rgba(0,71,255,0.06)', border: 'rgba(0,71,255,0.18)',
    text: 'FSRA retains broad supervisory discretion to look through structural arrangements.',
    ref: 'COBS 23.12.2',
  },
  {
    type: 'claim', tier: 'INFERRED', color: '#D97706',
    bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.18)',
    text: 'Client parameter-setting is analogous to an investment policy statement — not an investment decision.',
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

function useTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!active) { setDisplayed(''); return }
    let cancelled = false
    setDisplayed('')

    async function type() {
      for (let i = 0; i < text.length; i++) {
        if (cancelled) return
        const char = text[i]
        const next = text[i + 1]

        setDisplayed(text.slice(0, i + 1))

        // Variable delay based on character type
        let ms = 10 + Math.random() * 18       // base: 10–28ms
        if (char === ' ') {
          ms = next && next === next.toUpperCase() && next !== ' '
            ? 80 + Math.random() * 60           // space before capital: 80–140ms
            : 45 + Math.random() * 55           // regular space: 45–100ms
        }
        if (char === ',') ms = 130 + Math.random() * 90   // comma: 130–220ms
        if (char === '.') ms = 200 + Math.random() * 150  // period: 200–350ms
        if (char === '?') ms = 220 + Math.random() * 180  // question: 220–400ms
        if (char === '—') ms = 160 + Math.random() + 80   // em dash: 160–240ms
        // Occasional hesitation (3% chance)
        if (Math.random() < 0.03) ms += 280 + Math.random() * 350

        await new Promise(r => setTimeout(r, ms))
      }
    }

    type()
    return () => { cancelled = true }
  }, [text, active])
  return displayed
}

function CitationChip({ citRef, tier, color, bg, border }: {
  citRef: string; tier: string; color: string; bg: string; border: string
}) {
  return (
    <span className="inline-flex items-center gap-1 mx-0.5 align-middle">
      <span className="font-mono text-[10px] px-1.5 py-0.5"
            style={{ color: '#0047FF', background: 'rgba(0,71,255,0.08)',
                     border: '1px solid rgba(0,71,255,0.18)' }}>
        {citRef}
      </span>
      <span className="font-mono text-[9px] px-1.5 py-0.5"
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
      setPhase('typing')
      setProgress(0)
      await delay(QUERY_TEXT.length * 28 + 1200)
      if (cancelRef.current) return

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

      setPhase('document')
      await delay(500)

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
    <section className="relative w-full overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-68px)]">

      {/* ── LEFT COLUMN — 42% on desktop ── */}
      <div className="w-full lg:w-[42%] flex flex-col justify-center
                      px-8 md:px-12 lg:px-16 xl:px-20
                      py-20 lg:py-0
                      border-r border-black/10 shrink-0">

        {/* Headline — static, no animation */}
        <h1 className="text-[clamp(64px,7.5vw,112px)] leading-[1.0]
                       font-black tracking-tighter uppercase mb-10">
          THE LAW,<br />
          <span className="text-[#0047FF]">DECODED.</span>
        </h1>

        {/* Assertion lines */}
        <div className="mb-10">
          <div className="py-3 border-t border-black/10">
            <p className="hero-assertion">67,056 provisions. Zero hallucination.</p>
          </div>
          <div className="py-3 border-t border-black/10">
            <p className="hero-assertion">ADGM · VARA · El Salvador · BVI · Panama</p>
          </div>
          <div className="py-3 border-t border-b border-black/10">
            <p className="hero-assertion">Research. Draft. Monitor.</p>
          </div>
        </div>

        {/* CTAs */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2">
              Start researching
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M3 7.5h9M8 3.5l4 4-4 4" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/sign-in" className="btn-secondary inline-flex items-center gap-2">
              See a live session
            </Link>
          </motion.div>
        )}
      </div>

      {/* ── RIGHT COLUMN — fills remaining viewport width, flush to edge ── */}
      {mounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex flex-col pt-[52px] min-h-[560px] lg:min-h-0"
          style={{ pointerEvents: 'none' }}
        >
          {/* Terminal — white, dashboard-matching */}
          <div className="flex flex-col h-full bg-[#FAF9F7]">

            {/* Header bar — thin, no traffic lights */}
            <div className="flex-shrink-0 bg-[#FAF9F7] px-6 py-3
                            border-b border-black/10
                            flex items-center justify-between">
              <span className="font-mono text-[10px] text-black/25 uppercase tracking-[0.2em]">
                RESEARCH · ADGM / FSRA
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-pulse" />
                <span className="font-mono text-[10px] text-[#0047FF]">live</span>
              </div>
            </div>

            {/* Query display */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-black/10 bg-[#FAF9F7]">
              <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#0047FF] mb-1.5">
                QUERY
              </p>
              <p className="font-mono text-[12px] text-black/70 leading-relaxed min-h-[32px]">
                {phase === 'typing'
                  ? <>{typedQuery}<span className="animate-pulse text-black/30">▋</span></>
                  : QUERY_TEXT}
              </p>
            </div>

            {/* Main content */}
            <div className="flex-1 relative overflow-hidden bg-[#FAF9F7]" style={{ minHeight: 0 }}>

              {phase === 'typing' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-mono text-[11px] text-black/20">preparing analysis…</p>
                </div>
              )}

              <AnimatePresence>
                {phase === 'processing' && (
                  <motion.div key="processing"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-6">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] text-black/30">running pipeline</span>
                        <span className="font-mono text-[10px] text-[#0047FF]">{AGENTS[agentIdx]}</span>
                      </div>
                      <div className="h-[2px] w-full bg-black/[0.08] overflow-hidden">
                        <div className="h-full transition-[width] duration-100 ease-linear"
                             style={{
                               width: `${progress}%`,
                               background: 'linear-gradient(90deg, #0047FF, #059669)',
                             }} />
                      </div>
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                      {AGENTS.map((a, i) => (
                        <span key={a}
                          className="font-mono text-[11px] whitespace-nowrap transition-all duration-250"
                          style={{
                            opacity: i === agentIdx ? 1 : 0.15,
                            color: '#000000',
                            transform: i === agentIdx ? 'scale(1.05)' : 'scale(1)',
                          }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === 'document' && (
                  <motion.div key="document" ref={scrollRef}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 overflow-y-auto px-6 py-4 hide-scrollbar bg-[#FAF9F7]"
                    style={{ scrollbarWidth: 'none' }}>

                    {/* Note header */}
                    <div className="mb-5 pb-4 border-b border-black/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#0047FF]">
                          RESEARCH NOTE
                        </span>
                        <span className="font-mono text-[9px] text-black/25">
                          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-[9px] text-black/40 bg-black/5
                                         border border-black/10 px-2 py-0.5">
                          ADGM / FSRA
                        </span>
                        <span className="font-mono text-[9px] text-black/25">
                          14 claims · grounding 84% · 78s
                        </span>
                      </div>
                    </div>

                    {/* Document sections */}
                    <div className="space-y-0">
                      {DOC_SECTIONS.map((section, i) => {
                        if (section.type === 'heading') return (
                          <motion.p key={i}
                            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.05 }}
                            className="text-[13px] font-black uppercase tracking-tighter
                                       text-black mt-5 mb-2 leading-snug">
                            {section.text}
                          </motion.p>
                        )
                        if (section.type === 'para') return (
                          <motion.p key={i}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ duration: 0.45, delay: i * 0.05 }}
                            className="text-[12px] text-black/70 leading-[1.75] mb-1">
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
                            transition={{ duration: 0.35, delay: i * 0.05 }}
                            className="font-mono text-[9px] tracking-[0.15em] uppercase
                                       text-[#0047FF] mt-7 mb-3 pt-5 border-t border-black/10">
                            {section.text}
                          </motion.p>
                        )
                        if (section.type === 'claim') return (
                          <motion.div key={i}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.06 }}
                            className="p-3 mb-2 border"
                            style={{ background: section.bg, borderColor: section.border }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-[8px] px-2 py-0.5"
                                style={{
                                  color: section.color,
                                  background: 'rgba(0,0,0,0.04)',
                                  border: `1px solid ${section.border}`,
                                }}>
                                {section.tier}
                              </span>
                              <span className="font-mono text-[9px] text-black/25">{section.ref}</span>
                            </div>
                            <p className="text-[11px] text-black/70 leading-relaxed">{section.text}</p>
                          </motion.div>
                        )
                        return null
                      })}
                      {/* Fade out bottom */}
                      <div className="h-16 sticky bottom-0 pointer-events-none -mt-16"
                           style={{ background: 'linear-gradient(to bottom, transparent, #FAF9F7)' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status bar */}
            <div className="flex-shrink-0 bg-[#FAF9F7] px-6 py-2.5 border-t border-black/10
                            flex items-center gap-4">
              <span className={`font-mono text-[9px] ${
                phase === 'typing'    ? 'text-[#0047FF]' :
                phase === 'processing'? 'text-[#0047FF]' : 'text-[#059669]'
              }`}>
                {phase === 'typing'     ? '● entering query' :
                 phase === 'processing' ? '● analysing corpus' : '● complete'}
              </span>
              <span className="font-mono text-[9px] text-black/20">·</span>
              <span className="font-mono text-[9px] text-black/25">ADGM / FSRA corpus</span>
              <span className="font-mono text-[9px] text-black/20">·</span>
              <span className="font-mono text-[9px] text-black/25">67,056 provisions</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading state — right column placeholder before mount */}
      {!mounted && (
        <div className="flex-1 bg-[#FAF9F7] border-l border-black/10 min-h-[560px]" />
      )}
    </section>
  )
}
