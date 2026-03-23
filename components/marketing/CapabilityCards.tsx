'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const CARDS = [
  {
    num: '01',
    title: 'Deep Research',
    body: 'Ask a complex regulatory question. QANUN runs 10 specialist agents — retrieval, analysis, adversarial review, stress-testing — and returns a structured research note with grounded claims in under 90 seconds.',
    stats: ['10 agents', '< 90 seconds', 'Grounded claims'],
    accent: '#1A5FA8',
  },
  {
    num: '02',
    title: 'Quick Lookup',
    body: 'For direct questions. QANUN retrieves the most relevant corpus provisions and synthesises a grounded answer in under 15 seconds — without leaving your dashboard. Inline, cited, immediate.',
    stats: ['5 provisions', '< 15 seconds', 'Inline answer'],
    accent: '#0F7A5F',
  },
  {
    num: '03',
    title: 'Regulatory Monitoring',
    body: 'Define your product structure once. QANUN tracks it against the corpus, alerts you when new provisions affect your licensing position, and maintains a live compliance map updated with every change.',
    stats: ['Live monitoring', 'Alert on change', 'Multi-jurisdiction'],
    accent: '#C4922A',
  },
]

export function CapabilityCards() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="features" className="bg-[#F5F7FA] py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="mb-16">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A5FA8] mb-4">
            CAPABILITIES
          </p>
          <h2 className="text-[clamp(42px,5vw,64px)] font-semibold tracking-[-0.03em] text-[#0B1829] leading-[1.05]">
            Research. Monitor. Understand.
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-8 border border-[#E8EBF0] hover:border-[#1A5FA8]/30 hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-pointer"
            >
              <span
                className="absolute top-4 right-5 text-[56px] font-mono font-semibold leading-none select-none pointer-events-none"
                style={{ color: '#E8EBF0' }}
              >
                {card.num}
              </span>
              <h3 className="text-[20px] font-semibold text-[#0B1829] mt-5 mb-3">
                {card.title}
              </h3>
              <p className="text-[15px] text-[#6B7280] leading-relaxed">
                {card.body}
              </p>
              <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-[#E8EBF0]">
                {card.stats.map((s, j) => (
                  <span key={j} className="text-[12px] font-mono text-[#9CA3AF]">
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
