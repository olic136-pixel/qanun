'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const LIVE = [
  { name: 'ADGM', reg: 'FSRA' },
  { name: 'DIFC', reg: 'DFSA' },
  { name: 'El Salvador', reg: 'BCR' },
]
const COMING = [
  { name: 'Saudi Arabia', reg: 'CMA', eta: 'Q3 2026' },
  { name: 'Mauritius', reg: 'FSC', eta: 'Q3 2026' },
  { name: 'Pakistan', reg: 'SECP', eta: 'Q3 2026' },
  { name: 'Bahrain', reg: 'CBB', eta: 'Q4 2026' },
  { name: 'Kenya', reg: 'CMA', eta: 'Q4 2026' },
  { name: 'Nigeria', reg: 'SEC', eta: 'Q4 2026' },
  { name: 'Rwanda', reg: 'BNR', eta: 'Q4 2026' },
  { name: 'Singapore', reg: 'MAS', eta: 'Q1 2027' },
]
const STATS = [
  { n: '2,484', label: 'Regulatory documents indexed' },
  { n: '63,397', label: 'Individual provisions searchable' },
  { n: '13,337', label: 'Cross-references mapped' },
]

export function JurisdictionsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="jurisdictions" className="bg-white py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A5FA8] mb-4">COVERAGE</p>
            <h2 className="text-[48px] font-semibold tracking-[-0.02em] text-[#0B1829] leading-[1.1] mb-5">
              Eleven jurisdictions.<br />One platform.
            </h2>
            <p className="text-[17px] text-[#6B7280] leading-[1.65] max-w-[440px]">
              QANUN&apos;s regulatory corpus spans the world&apos;s fastest-growing
              financial markets. New jurisdictions ship quarterly — suggested
              by practitioners in the field.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-3"
          >
            {LIVE.map((j) => (
              <div key={j.name} className="bg-[#F5F7FA] rounded-xl px-4 py-3 border border-[#E8EBF0] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#0F7A5F] animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-[#0B1829]">{j.name}</p>
                  <p className="text-[11px] font-mono text-[#9CA3AF]">{j.reg}</p>
                </div>
              </div>
            ))}
            {COMING.map((j) => (
              <div key={j.name} className="bg-[#F5F7FA] rounded-xl px-4 py-3 border border-[#E8EBF0] flex items-center gap-3 opacity-60">
                <span className="w-2 h-2 rounded-full bg-[#C4922A] flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-[#0B1829]">{j.name}</p>
                  <p className="text-[11px] font-mono text-[#9CA3AF]">{j.reg} · {j.eta}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="bg-[#0B1829] rounded-2xl px-8 py-8 mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0"
        >
          {STATS.map((s, i) => (
            <div key={i} className={`flex flex-col ${i > 0 ? 'md:border-l md:border-white/10 md:pl-8' : ''}`}>
              <span className="text-[42px] font-mono font-semibold text-white leading-none">{s.n}</span>
              <span className="text-[13px] text-[#6B7280] mt-2">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
