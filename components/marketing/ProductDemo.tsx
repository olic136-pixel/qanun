'use client'
import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

function ResearchPanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
        <span className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF]">RESEARCH NOTE</span>
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
        <p key={i} className="text-[13px] font-black uppercase tracking-tighter text-white mt-5 mb-2 leading-snug">{item.text}</p>
      ) : (
        <p key={i} className="text-[12px] text-white/65 leading-[1.7] mb-2">
          {item.text}
          <span className="inline-flex items-center gap-1 mx-1 align-middle">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#60A5FA', background: 'rgba(26,95,168,0.2)', border: '1px solid rgba(26,95,168,0.3)' }}>{item.cit}</span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full" style={{ color: item.tc, background: item.tb, border: `1px solid ${item.tb}` }}>{item.tier}</span>
          </span>
        </p>
      ))}
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF] mt-6 mb-3 pt-4 border-t border-white/[0.07]">REFERENCE MATERIAL</p>
      {[
        { tier: 'VERIFIED', c: '#0F7A5F', bg: 'rgba(15,122,95,0.12)', bd: 'rgba(15,122,95,0.25)', text: 'COBS 23.12.2 requires a Managing Assets FSP for copy/mirror trading to Retail Clients.', ref: 'COBS 23.12.2' },
        { tier: 'SUPPORTED', c: '#1A5FA8', bg: 'rgba(26,95,168,0.12)', bd: 'rgba(26,95,168,0.25)', text: 'FSRA retains broad supervisory discretion under the "satisfaction of the Regulator" standard.', ref: 'COBS 23.12.2' },
        { tier: 'INFERRED', c: '#C4922A', bg: 'rgba(196,146,42,0.12)', bd: 'rgba(196,146,42,0.25)', text: 'A Category 3A licence would be required in addition to the Managing Assets FSP.', ref: 'PRU 1.3.3' },
      ].map((cl, i) => (
        <div key={i} className="p-2.5 mb-2 border" style={{ background: cl.bg, borderColor: cl.bd }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-mono px-1.5 py-0.5" style={{ color: cl.c, background: 'rgba(0,0,0,0.2)', border: `1px solid ${cl.bd}` }}>{cl.tier}</span>
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
        <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF] mb-2">QUERY</p>
        <p className="text-[12px] font-mono text-white/80">What is a Category 3A licence under ADGM?</p>
      </div>
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF] mb-3">ANSWER · ADGM / FSRA</p>
      {[
        { h: 'Determinative criterion', p: 'A Category 3A Authorised Person is one whose FSP authorises it to carry on Dealing in Investments as Agent and/or as Principal (Matched Principal only), and which does not meet the criteria for Categories 1, 2, or 5.', c: 'PRU 1.3.3(1)' },
        { h: 'Matched Principal defined', p: 'A firm Deals as Matched Principal if it executes simultaneous back-to-back trades, bears no market risk, and holds positions only incidental to the transaction. Total market value must not exceed 15% of Tier 1 Capital Resources.', c: 'PRU 1.3.3(2)' },
        { h: 'Lower-category activities', p: 'A Category 3A firm may also conduct any Regulated Activity specified under a lower Category (3B, 3C, 4), provided it is authorised under its FSP.', c: 'PRU 1.3' },
      ].map((s, i) => (
        <div key={i}>
          <p className="text-[11px] font-semibold text-white mt-4 mb-1.5">{s.h}</p>
          <p className="text-[11px] text-white/65 leading-[1.65] mb-1">
            {s.p}
            <span className="font-mono text-[10px] px-1.5 py-0.5 ml-1" style={{ color: '#60A5FA', background: 'rgba(26,95,168,0.2)', border: '1px solid rgba(26,95,168,0.3)' }}>{s.c}</span>
          </p>
        </div>
      ))}
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF] mt-5 mb-2 pt-4 border-t border-white/[0.07]">SOURCE PROVISIONS</p>
      <div className="flex flex-wrap gap-2">
        {['PRU 1.3.3', 'PRU 1.3.2', 'PRU 1.3'].map((r, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border" style={{ background: 'rgba(26,95,168,0.12)', borderColor: 'rgba(26,95,168,0.25)' }}>
            <span className="text-[10px] font-mono text-[#60A5FA]">{r}</span>
            <span className="text-[8px] font-mono text-[#374151]">PRU</span>
          </span>
        ))}
      </div>
    </div>
  )
}

{/* Demo content — ADGM only. Jurisdiction-specific demo
    panels for BVI/Panama to be added in future session. */}
function MonitoringPanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0047FF] animate-pulse" />
          <span className="text-[13px] font-semibold text-white">TradeDar Ltd</span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30">2 alerts</span>
      </div>
      <p className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF] mb-3">ACTIVE ALERTS</p>
      <div className="space-y-3">
        <div className="p-4 border border-[#991B1B]/30 bg-[#991B1B]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-semibold text-[#F87171] bg-[#991B1B]/20 px-2 py-0.5">HIGH</span>
            <span className="text-[9px] font-mono text-[#6B7280]">22 Mar 2026</span>
          </div>
          <p className="text-[11px] font-semibold text-white mb-1.5">COBS 23.12.2 — Managing Assets FSP</p>
          <p className="text-[11px] text-white/65 leading-relaxed">Auto-Build feature may constitute copy trading for Retail Clients. Managing Assets FSP required.</p>
        </div>
        <div className="p-4 border border-[#D97706]/30 bg-[#D97706]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-semibold text-[#D97706] bg-[#D97706]/20 px-2 py-0.5">MEDIUM</span>
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

function GovernanceSuitePanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
        <span className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF]">GOVERNANCE SUITE</span>
        <div className="flex items-center gap-3 text-[9px] font-mono text-white/30">
          <span>ADGM / FSRA</span><span>·</span><span>5 tiers</span><span>·</span><span>23 documents</span>
        </div>
      </div>
      {[
        { tier: 1, label: 'Registration Pack', count: 7, status: 'complete' },
        { tier: 2, label: 'Mandatory Compliance Framework', count: 8, status: 'complete' },
        { tier: 3, label: 'Corporate Governance Framework', count: 5, status: 'drafting' },
        { tier: 4, label: 'Operational Procedures', count: 5, status: 'queued' },
        { tier: 5, label: 'Regulatory Filings & Monitoring', count: 5, status: 'queued' },
      ].map((t, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-white/30 w-12">Tier {t.tier}</span>
            <span className="text-[12px] text-white/80 font-medium">{t.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-white/30">{t.count} docs</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 ${
              t.status === 'complete' ? 'text-[#059669] bg-[#059669]/10' :
              t.status === 'drafting' ? 'text-[#0047FF] bg-[#0047FF]/10 animate-pulse' :
              'text-white/20 bg-white/5'
            }`}>
              {t.status}
            </span>
          </div>
        </div>
      ))}
      <div className="mt-6 pt-4 border-t border-white/[0.07]">
        <div className="flex justify-between text-[9px] font-mono text-white/30 mb-2">
          <span>Suite progress</span><span>40%</span>
        </div>
        <div className="h-[2px] bg-white/[0.08] w-full">
          <div className="h-full bg-[#0047FF]" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  )
}

function EntitySetupPanel() {
  return (
    <div className="h-full overflow-y-auto px-6 py-5 hide-scrollbar">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.07]">
        <span className="text-[9px] font-mono tracking-[0.12em] uppercase text-[#0047FF]">ENTITY INTAKE</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-pulse" />
          <span className="text-[9px] font-mono text-white/30">ADGM</span>
        </div>
      </div>
      {[
        { role: 'system', text: 'Welcome. I\'ll help determine the right regulatory framework for your entity. To start — can you describe the core business activity you intend to conduct in ADGM?' },
        { role: 'user', text: 'We want to manage discretionary portfolios for institutional clients.' },
        { role: 'system', text: 'Thank you. Will you be managing collective investment funds, or separately managed accounts for each client?' },
        { role: 'user', text: 'Separately managed accounts.' },
        { role: 'system', text: 'Understood. And will your clients include any retail investors, or are you restricted to professional clients only?' },
      ].map((msg, i) => (
        <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] text-[11px] leading-relaxed px-3 py-2 ${
            msg.role === 'user'
              ? 'bg-[#0047FF]/20 text-white/90'
              : 'bg-white/[0.06] text-white/65'
          }`}>
            {msg.text}
          </div>
        </div>
      ))}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[9px] font-mono text-white/20">Entity profile building: 3 / 12 fields confirmed</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>
    </div>
  )
}

const CAPABILITIES = [
  {
    id: 'research',
    label: 'Deep Research',
    description: 'A 10-agent pipeline reads the corpus structurally, adversarially, completely. You get a research note with grounded claims, cited provisions, and confidence tiers. Not a summary — an analysis.',
    stat: '< 90s',
    statLabel: 'full 10-agent pipeline',
  },
  {
    id: 'lookup',
    label: 'Quick Lookup',
    description: 'Type a provision reference or a direct question. QANUN retrieves the relevant rules and synthesises a grounded answer in under 15 seconds, inline, with citations.',
    stat: '< 15s',
    statLabel: 'corpus retrieval + synthesis',
  },
  {
    id: 'monitoring',
    label: 'Regulatory Monitoring',
    description: 'Define your entity structure once. QANUN watches the corpus. When something changes that affects your licence position, you know before your next board meeting.',
    stat: 'Continuous',
    statLabel: 'live corpus monitoring',
  },
  {
    id: 'governance',
    label: 'Governance Suites',
    description: 'Describe your entity. QANUN generates the complete governance structure — registration pack, policies, board frameworks, operational procedures, filing templates — drafted against live corpus provisions.',
    stat: '112',
    statLabel: 'document templates across 5 tiers',
  },
  {
    id: 'entity',
    label: 'Entity Setup',
    description: 'A conversation. No forms, no dropdowns. By the end of it, your licensing category is confirmed, your entity is created, and your governance suite is initiated.',
    stat: '< 10 min',
    statLabel: 'from conversation to suite initiated',
  },
]

export function ProductDemo() {
  const [active, setActive] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" className="bg-black py-24 overflow-hidden">
      <div ref={ref} className="max-w-[1280px] mx-auto px-6">
        {/* Section statement */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="mb-16"
        >
          <h2 className="text-[clamp(38px,4.5vw,64px)] font-black uppercase tracking-tighter
                         text-white leading-[1.0]">
            Not a chatbot.<br />
            <span className="text-[#0047FF]">A research system.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* LEFT — capability list + description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 flex flex-col"
          >

            {/* Numbered capability list */}
            <div className="space-y-0 mb-0">
              {CAPABILITIES.map((cap, i) => (
                <button
                  key={cap.id}
                  onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-4 py-4 text-left
                               border-l-2 pl-5 transition-all duration-200 ${
                    active === i
                      ? 'border-[#0047FF]'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <span className="font-mono text-[10px] text-white/20 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`text-[15px] font-black uppercase tracking-tighter
                                    transition-colors duration-200 ${
                    active === i ? 'text-[#0047FF]' : 'text-white/50 hover:text-white/80'
                  }`}>
                    {cap.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Active description */}
            <div className="border-t border-white/10 mt-8 pt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="text-[15px] text-white/50 leading-[1.7] mb-8">
                    {CAPABILITIES[active].description}
                  </p>
                  <p className="font-mono text-[48px] font-semibold text-white leading-none mb-2">
                    {CAPABILITIES[active].stat}
                  </p>
                  <p className="font-mono text-[10px] text-white/25 uppercase tracking-[0.2em]">
                    {CAPABILITIES[active].statLabel}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-10">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 font-mono text-[11px]
                           text-white/40 uppercase tracking-[0.2em]
                           hover:text-[#0047FF] transition-colors"
              >
                Get started →
              </Link>
            </div>
          </motion.div>

          {/* RIGHT — terminal, full height */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 lg:sticky lg:top-24"
          >
            <div
              className="overflow-hidden flex flex-col"
              style={{
                height: '620px',
                background: '#111417',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {/* Header — no traffic lights */}
              <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.08]
                              flex items-center justify-between bg-[#111111]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={active}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#0047FF]"
                  >
                    QANUN · {CAPABILITIES[active].label}
                  </motion.span>
                </AnimatePresence>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-pulse" />
                  <span className="font-mono text-[10px] text-[#059669]">live</span>
                </div>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="h-full"
                  >
                    {active === 0 && <ResearchPanel />}
                    {active === 1 && <LookupPanel />}
                    {active === 2 && <MonitoringPanel />}
                    {active === 3 && <GovernanceSuitePanel />}
                    {active === 4 && <EntitySetupPanel />}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Status bar */}
              <div className="flex-shrink-0 bg-[#111111] px-5 py-2.5
                              border-t border-white/[0.08] flex items-center gap-4">
                <span className="font-mono text-[9px] text-[#059669]">● live corpus</span>
                <span className="font-mono text-[9px] text-[#374151]">·</span>
                <span className="font-mono text-[9px] text-[#374151]">ADGM / FSRA</span>
                <span className="font-mono text-[9px] text-[#374151]">·</span>
                <span className="font-mono text-[9px] text-[#374151]">67,056 provisions</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
