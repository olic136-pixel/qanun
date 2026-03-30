'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const LIVE = [
  { name: 'ADGM', reg: 'FSRA' },
  { name: 'DIFC', reg: 'DFSA' },
  { name: 'El Salvador', reg: 'CNAD' },
  { name: 'VARA', reg: 'Dubai' },
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
  { n: '65,822', label: 'Individual provisions searchable' },
  { n: '2,366', label: 'Regulatory documents indexed' },
  { n: '3', label: 'Jurisdictions live' },
]

export function JurisdictionsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="jurisdictions" className="py-28 relative overflow-hidden">

      {/* Ghost number */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none overflow-hidden">
        <span
          className="text-[320px] font-black leading-none tracking-tighter"
          style={{ color: 'rgba(0,0,0,0.035)' }}
        >
          3
        </span>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 relative z-10">

        {/* Section heading */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
          className="mb-16"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#0047FF] mb-5">
            COVERAGE
          </p>
          <h2 className="text-[clamp(38px,5vw,72px)] font-black tracking-tighter uppercase
                          text-black leading-[1.0]">
            Three jurisdictions.<br />One platform.
          </h2>
        </motion.div>

        {/* Live jurisdictions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.19, 1, 0.22, 1] }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#0047FF] mb-3">
            LIVE
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
            {LIVE.map((j) => (
              <div
                key={j.name}
                className="bg-white px-4 py-3 border border-black/10 flex items-center gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-[#0047FF] animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-black">{j.name}</p>
                  <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.15em]">
                    {j.reg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Coming jurisdictions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.19, 1, 0.22, 1] }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-black/25 mb-3">
            COMING
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-16 opacity-40">
            {COMING.map((j) => (
              <div
                key={j.name}
                className="bg-white px-4 py-3 border border-black/10 flex items-center gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-black/20 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-black">{j.name}</p>
                  <p className="font-mono text-[10px] text-black/30">
                    {j.reg} · {j.eta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.19, 1, 0.22, 1] }}
          className="bg-black grid grid-cols-1 md:grid-cols-3 gap-px border border-white/10"
        >
          {STATS.map((s, i) => (
            <div key={i} className="flex flex-col px-8 py-8 bg-black">
              <span className="text-[56px] font-black text-white leading-none tracking-tighter">
                {s.n}
              </span>
              <span className="font-mono text-[11px] text-white/30 uppercase tracking-[0.2em] mt-3">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
