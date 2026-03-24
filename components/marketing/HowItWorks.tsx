'use client'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const TABS = [
  { id: 'research', label: 'Deep Research', tagline: 'Ask once. Get a research note any senior counsel would act on.', description: 'A 10-agent pipeline reads the corpus the way a senior counsel would — structurally, adversarially, completely. The result is a structured research note with grounded claims, cited provisions, and confidence tiers.', stat: '< 90 seconds', statLabel: 'full 10-agent pipeline' },
  { id: 'lookup', label: 'Quick Lookup', tagline: 'Type a question. Get the answer. Stay in flow.', description: 'For direct questions, QANUN retrieves the most relevant provisions and synthesises a grounded answer inline — with citations, no navigation, no waiting.', stat: '< 15 seconds', statLabel: 'corpus retrieval + synthesis' },
  { id: 'monitoring', label: 'Regulatory Monitoring', tagline: 'Define your structure once. Never miss a regulatory change.', description: 'Product Twins track your entity structure against the live corpus. When a new circular, amendment, or guidance touches your licence position, you are alerted — with the specific provision and its implications.', stat: 'Continuous', statLabel: 'live corpus monitoring' },
]

function ResearchPanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
        <span className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A]">RESEARCH NOTE</span>
        <div className="flex items-center gap-3 text-[9px] font-mono text-[#374151]">
          <span>ADGM / FSRA</span><span>·</span><span>14 claims</span><span>·</span><span>84%</span><span>·</span><span>78s</span>
        </div>
      </div>
      {[
        { t: 'h', text: '1. The Regulatory Trigger' },
        { t: 'p', text: 'COBS 23.12.2 imposes a binary prohibition: an Authorised Person must not offer or arrange for Retail Clients to subscribe to copy trading, mirror trading, or similar services unless it holds a Financial Services Permission to undertake the Regulated Activity of Managing Assets.', cit: 'COBS 23.12.2', tier: 'VERIFIED', tc: '#0F7A5F', tb: 'rgba(15,122,95,0.2)' },
        { t: 'h', text: '2. The Block-Delegation Model' },
        { t: 'p', text: 'The "similar services" catch-all is purposively broad and captures functional equivalents regardless of how the arrangement is characterised. Parameter-setting by the client does not constitute the investment decision.', cit: 'COBS 23.4.1', tier: 'SUPPORTED', tc: '#1A5FA8', tb: 'rgba(26,95,168,0.2)' },
        { t: 'h', text: '3. FSRA Supervisory Discretion' },
        { t: 'p', text: 'The requirement to implement systems and controls "to the satisfaction of the Regulator" confers broad FSRA discretion to look through any structural characterisation of the arrangement.', cit: 'COBS 23.12.2', tier: 'SUPPORTED', tc: '#1A5FA8', tb: 'rgba(26,95,168,0.2)' },
      ].map((item, i) => item.t === 'h' ? (
        <p key={i} className="text-[12px] font-semibold text-white mt-4 mb-2">{item.text}</p>
      ) : (
        <p key={i} className="text-[12px] text-white/65 leading-[1.7] mb-2">
          {item.text}
          <span className="inline-flex items-center gap-1 mx-1 align-middle">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#60A5FA', background: 'rgba(26,95,168,0.2)', border: '1px solid rgba(26,95,168,0.3)' }}>{item.cit}</span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: item.tc, background: item.tb, border: `1px solid ${item.tb}` }}>{item.tier}</span>
          </span>
        </p>
      ))}
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mt-6 mb-3 pt-4 border-t border-white/[0.07]">REFERENCE MATERIAL</p>
      {[
        { tier: 'VERIFIED', c: '#0F7A5F', bg: 'rgba(15,122,95,0.12)', bd: 'rgba(15,122,95,0.25)', text: 'COBS 23.12.2 requires a Managing Assets FSP for copy/mirror trading to Retail Clients.', ref: 'COBS 23.12.2' },
        { tier: 'SUPPORTED', c: '#1A5FA8', bg: 'rgba(26,95,168,0.12)', bd: 'rgba(26,95,168,0.25)', text: 'FSRA retains broad supervisory discretion under the "satisfaction of the Regulator" standard.', ref: 'COBS 23.12.2' },
        { tier: 'INFERRED', c: '#C4922A', bg: 'rgba(196,146,42,0.12)', bd: 'rgba(196,146,42,0.25)', text: 'A Category 3A licence would be required in addition to the Managing Assets FSP.', ref: 'PRU 1.3.3' },
      ].map((cl, i) => (
        <div key={i} className="rounded-lg p-2.5 mb-2 border" style={{ background: cl.bg, borderColor: cl.bd }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full" style={{ color: cl.c, background: 'rgba(0,0,0,0.2)', border: `1px solid ${cl.bd}` }}>{cl.tier}</span>
            <span className="text-[9px] font-mono text-[#6B7280]">{cl.ref}</span>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">{cl.text}</p>
        </div>
      ))}
    </div>
  )
}

function LookupPanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="mb-4 pb-4 border-b border-white/[0.07]">
        <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-2">QUERY</p>
        <p className="text-[12px] font-mono text-white/80">What is a Category 3A licence under ADGM?</p>
      </div>
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-3">ANSWER · ADGM / FSRA</p>
      {[
        { h: 'Determinative criterion', p: 'A Category 3A Authorised Person is one whose FSP authorises it to carry on Dealing in Investments as Agent and/or as Principal (Matched Principal only), and which does not meet the criteria for Categories 1, 2, or 5.', c: 'PRU 1.3.3(1)' },
        { h: 'Matched Principal defined', p: 'A firm Deals as Matched Principal if it executes simultaneous back-to-back trades, bears no market risk, and holds positions only incidental to the transaction. Total market value must not exceed 15% of Tier 1 Capital Resources.', c: 'PRU 1.3.3(2)' },
        { h: 'Lower-category activities', p: 'A Category 3A firm may also conduct any Regulated Activity specified under a lower Category (3B, 3C, 4), provided it is authorised under its FSP.', c: 'PRU 1.3' },
      ].map((s, i) => (
        <div key={i}>
          <p className="text-[11px] font-semibold text-white mt-4 mb-1.5">{s.h}</p>
          <p className="text-[11px] text-white/65 leading-[1.65] mb-1">
            {s.p}
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ color: '#60A5FA', background: 'rgba(26,95,168,0.2)', border: '1px solid rgba(26,95,168,0.3)' }}>{s.c}</span>
          </p>
        </div>
      ))}
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mt-5 mb-2 pt-4 border-t border-white/[0.07]">SOURCE PROVISIONS</p>
      <div className="flex flex-wrap gap-2">
        {['PRU 1.3.3', 'PRU 1.3.2', 'PRU 1.3'].map((r, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border" style={{ background: 'rgba(26,95,168,0.12)', borderColor: 'rgba(26,95,168,0.25)' }}>
            <span className="text-[10px] font-mono text-[#60A5FA]">{r}</span>
            <span className="text-[8px] font-mono text-[#374151]">PRU</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function MonitoringPanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C4922A] animate-pulse" />
          <span className="text-[13px] font-semibold text-white">TradeDar Ltd</span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#C4922A]/15 text-[#C4922A] border border-[#C4922A]/30">2 alerts</span>
      </div>
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-3">ACTIVE ALERTS</p>
      <div className="space-y-3">
        <div className="rounded-xl p-4 border border-[#991B1B]/30 bg-[#991B1B]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-semibold text-[#F87171] bg-[#991B1B]/20 px-2 py-0.5 rounded-full">HIGH</span>
            <span className="text-[9px] font-mono text-[#6B7280]">22 Mar 2026</span>
          </div>
          <p className="text-[11px] font-semibold text-white mb-1.5">COBS 23.12.2 — Managing Assets FSP</p>
          <p className="text-[11px] text-white/65 leading-relaxed">Auto-Build feature may constitute copy trading for Retail Clients. Managing Assets FSP required.</p>
        </div>
        <div className="rounded-xl p-4 border border-[#C4922A]/30 bg-[#C4922A]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-semibold text-[#C4922A] bg-[#C4922A]/20 px-2 py-0.5 rounded-full">MEDIUM</span>
            <span className="text-[9px] font-mono text-[#6B7280]">18 Mar 2026</span>
          </div>
          <p className="text-[11px] font-semibold text-white mb-1.5">PRU 1.3.3(2)(c) — Matched Principal</p>
          <p className="text-[11px] text-white/65 leading-relaxed">Condition (c) risk: if Risk Co is not operationally independent, the matched principal characterisation may fail.</p>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-white/[0.07] flex items-center gap-4 text-[9px] font-mono text-[#374151]">
        <span>Last assessed: 22 Mar 2026</span><span>·</span><span>14 provisions</span><span>·</span><span>2 changed</span>
      </div>
    </div>
  )
}

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" className="bg-[#0B1829] py-28 overflow-hidden">
      <div ref={ref} className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* LEFT */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#C4922A] mb-8">
              HOW IT WORKS
            </motion.p>
            <h2 className="text-[clamp(42px,4.8vw,64px)] font-semibold tracking-[-0.03em] text-white leading-[1.05] mb-6">
              Not a chatbot.<br /><span className="text-[#1A5FA8]">A research system.</span>
            </h2>
            <p className="text-[17px] text-white/60 leading-[1.65] mb-10 max-w-[480px]">
              QANUN reads 63,397 regulatory provisions the way a senior counsel would — structurally, adversarially, completely. Every answer is grounded against the corpus. Nothing is invented.
            </p>

            <div className="flex gap-1 mb-8 bg-white/[0.06] rounded-xl p-1 w-fit">
              {TABS.map((t, i) => (
                <button key={t.id} onClick={() => setActiveTab(i)}
                  className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === i ? 'bg-white/10 text-[#C4922A]' : 'text-white/50 hover:text-white/80'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <p className="text-[20px] font-semibold text-white leading-[1.3] mb-3">{TABS[activeTab].tagline}</p>
                <p className="text-[15px] text-white/50 leading-[1.7] mb-8">{TABS[activeTab].description}</p>
                <div className="border-l-2 border-[#1A5FA8] pl-5 mb-8">
                  <p className="text-[44px] font-mono font-semibold text-white leading-none mb-1">{TABS[activeTab].stat}</p>
                  <p className="text-[13px] text-white/40">{TABS[activeTab].statLabel}</p>
                </div>
                <div className="space-y-2.5 mb-8">
                  {['Every claim grounded against a specific corpus provision — never inferred beyond what the rules contain.',
                    'Citations are clickable — every reference opens the exact provision from the ADGM, DIFC, or El Salvador corpus.'
                  ].map((chip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/[0.08]">
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="mt-0.5 flex-shrink-0">
                        <circle cx="7.5" cy="7.5" r="6.5" stroke="#0F7A5F" strokeWidth="1.5"/>
                        <path d="M4.5 7.5l2 2 4-4" stroke="#0F7A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[13px] text-white/70">{chip}</span>
                    </div>
                  ))}
                </div>
                <Link href="/sign-up" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#1A5FA8] hover:text-[#0B1829] transition-colors group">
                  Try it now
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="group-hover:translate-x-1 transition-transform">
                    <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* RIGHT — terminal, sticky */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-24">
            <div className="rounded-2xl overflow-hidden flex flex-col"
                 style={{ height: '560px', background: '#0D1F30', boxShadow: '0 24px 64px rgba(11,24,41,0.2), 0 0 0 1px rgba(255,255,255,0.07)' }}>
              <div className="flex-shrink-0 bg-[#111827] px-5 py-3 flex items-center justify-between border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]"/><div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"/><div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"/>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] font-mono text-[#6B7280] ml-1">
                      QANUN · {TABS[activeTab].label}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse"/><span className="text-[10px] font-mono text-[#0F7A5F]">live</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="h-full">
                    {activeTab === 0 && <ResearchPanel />}
                    {activeTab === 1 && <LookupPanel />}
                    {activeTab === 2 && <MonitoringPanel />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex-shrink-0 bg-[#111827] px-5 py-2.5 border-t border-white/[0.08] flex items-center gap-4">
                <span className="text-[9px] font-mono text-[#0F7A5F]">● complete</span>
                <span className="text-[9px] font-mono text-[#374151]">·</span>
                <span className="text-[9px] font-mono text-[#374151]">ADGM / FSRA corpus</span>
                <span className="text-[9px] font-mono text-[#374151]">·</span>
                <span className="text-[9px] font-mono text-[#374151]">63,397 provisions</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-20 pt-10 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: '2,484', label: 'Regulatory documents' },
            { n: '63,397', label: 'Indexed provisions' },
            { n: '84%', label: 'Average grounding ratio' },
            { n: '0', label: 'Provisions invented', teal: true },
          ].map((s, i) => (
            <div key={i}>
              <p className={`text-[38px] font-mono font-semibold leading-none mb-1 ${s.teal ? 'text-[#0F7A5F]' : 'text-white'}`}>{s.n}</p>
              <p className="text-[13px] text-white/40">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
