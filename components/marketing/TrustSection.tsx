'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const BADGES = [
  { n: '10', label: 'specialist agents', color: '#0B1829' },
  { n: '84%', label: 'average claim grounding ratio', color: '#0B1829' },
  { n: '< 90s', label: 'full pipeline, complex queries', color: '#0B1829' },
  { n: '0', label: 'provisions invented — ever', color: '#0F7A5F' },
]

const CHIPS = [
  'Corpus curated by regulatory practitioners',
  'Every claim grounded against specific corpus provisions',
  'No hallucination — QANUN cites what it finds, not what it infers',
]

export function TrustSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-[#F5F7FA] py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[clamp(28px,3.5vw,42px)] font-semibold tracking-[-0.02em] text-[#0B1829] leading-[1.15] mb-5">
              Built on practitioner judgment, not prompts.
            </h2>
            <p className="text-[16px] text-[#6B7280] leading-relaxed mb-8">
              QANUN was built by a King&apos;s Counsel and crypto founder who spent
              years answering the questions QANUN now answers. The corpus, the
              agent architecture, and the claim grounding system were all
              designed by people who have sat across the table from regulators.
            </p>
            <div className="flex flex-col gap-3">
              {CHIPS.map((chip, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3.5 border border-[#E8EBF0]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
                    <circle cx="8" cy="8" r="7" stroke="#0F7A5F" strokeWidth="1.5"/>
                    <path d="M5 8l2 2 4-4" stroke="#0F7A5F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px] font-medium text-[#0B1829]">{chip}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-4"
          >
            {BADGES.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-[#E8EBF0] text-center">
                <p className="text-[48px] font-mono font-semibold leading-none" style={{ color: b.color }}>
                  {b.n}
                </p>
                <p className="text-[13px] text-[#6B7280] mt-3 leading-snug">{b.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
