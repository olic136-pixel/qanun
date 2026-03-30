'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const CARDS = [
  {
    num: '01',
    title: 'Deep Research',
    body: 'Ask a complex regulatory question. Qanun runs 10 specialist agents — retrieval, analysis, adversarial review, stress-testing — and returns a structured research note with grounded claims in under 90 seconds.',
    stats: ['10 agents', '< 90 seconds', 'Grounded claims'],
    accent: '#0047FF',
  },
  {
    num: '02',
    title: 'Quick Lookup',
    body: 'For direct questions. Qanun retrieves the most relevant corpus provisions and synthesises a grounded answer in under 15 seconds — without leaving your dashboard. Inline, cited, immediate.',
    stats: ['< 15 seconds', 'Inline answer', 'Zero navigation'],
    accent: '#059669',
  },
  {
    num: '03',
    title: 'Regulatory Monitoring',
    body: 'Define your product structure once. Qanun tracks it against the corpus, alerts you when new provisions affect your licensing position, and maintains a live compliance map updated with every change.',
    stats: ['Live monitoring', 'Alert on change', 'Multi-jurisdiction'],
    accent: '#D97706',
  },
  {
    num: '04',
    title: 'Governance Suites',
    body: 'From a single entity intake conversation, Qanun generates your complete five-tier regulatory governance structure — 112 document templates across registration, compliance, governance, operations, and filings.',
    stats: ['112 templates', '5 tiers', '3 jurisdictions'],
    accent: '#0047FF',
  },
  {
    num: '05',
    title: 'Entity Setup',
    body: 'The Conversational Entity Engine interrogates your business model the way a regulatory counsel would. It determines licensing viability, confirms your category, and initiates your governance suite. No forms.',
    stats: ['Conversational', 'Corpus-grounded', 'Zero form fields'],
    accent: '#059669',
  },
]

export function CapabilityCards() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="features" className="bg-white py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="mb-16">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#0047FF] mb-4">
            CAPABILITIES
          </p>
          <h2 className="text-[clamp(42px,5vw,64px)] font-black tracking-tighter text-[#000000] leading-[1.0] uppercase">
            Research. Draft. Monitor.
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10 border border-black/10">
          {CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white p-8 hover:bg-[#0047FF]/[0.02] transition-colors duration-300 relative overflow-hidden cursor-pointer"
            >
              <span
                className="absolute top-4 right-5 text-[56px] font-mono font-semibold leading-none select-none pointer-events-none"
                style={{ color: 'rgba(0,0,0,0.06)' }}
              >
                {card.num}
              </span>
              <h3 className="text-[20px] font-black text-[#000000] mt-5 mb-3 uppercase tracking-tighter">
                {card.title}
              </h3>
              <p className="text-[15px] text-black/50 leading-relaxed">
                {card.body}
              </p>
              <div className="flex flex-wrap gap-3 mt-6 pt-5">
                {card.stats.map((s, j) => (
                  <span key={j} className="text-[12px] font-mono text-black/30">
                    {j > 0 && <span className="mr-3">·</span>}
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
