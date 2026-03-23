'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const CYCLES = [
  { n: 1, label: 'Category 3A framework', claims: 14 },
  { n: 2, label: 'PRU 1.3.3(2) conditions', claims: 12 },
  { n: 3, label: 'COBS 23.12.2 copy trading', claims: 11 },
]

const ANALYSIS_LINES = [
  'The dual-entity structure satisfies conditions (a), (b)',
  'and (d) of the matched principal framework.',
  'Condition (c) — Risk Co independence — requires',
  'further analysis on legal separation.',
]

export default function DeepResearchPanel({ className = '' }: { className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4 }}
      className={`rounded-xl overflow-hidden border border-white/10 bg-[#0B1829] ${className}`}
      style={{ boxShadow: '0 16px 48px rgba(11,24,41,0.2)' }}
    >
      {/* Title bar */}
      <div className="bg-[#111827] px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
            <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
            <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[10px] font-mono text-[#6B7280] ml-1">QANUN · Deep Research</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
          <span className="text-[9px] font-mono text-[#0F7A5F]">live</span>
        </div>
      </div>

      <div className="flex min-h-[200px]">
        {/* Left — project sidebar */}
        <div className="w-[38%] border-r border-white/[0.08] px-3 py-3">
          <p className="text-[10px] font-semibold text-white truncate mb-1">TradeDar — Category 3A</p>

          {/* Confidence bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: '72%' } : { width: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
            className="h-1 rounded-full bg-[#1A5FA8] mb-3"
          />
          <p className="text-[8px] font-mono text-[#1A5FA8] mb-3">72% — Advanced</p>

          <p className="text-[8px] font-mono tracking-[0.1em] uppercase text-white/30 mb-2">Cycles</p>
          {CYCLES.map((c, i) => (
            <motion.div
              key={c.n}
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.2 }}
              className="flex items-center gap-1.5 mb-1.5"
            >
              <span className="w-4 h-4 rounded-full bg-white/10 text-[8px] text-white flex items-center justify-center shrink-0">
                {c.n}
              </span>
              <span className="text-[9px] text-white/60 truncate flex-1">{c.label}</span>
              <span className="text-[7px] px-1 py-0.5 rounded-full bg-[#0F7A5F]/20 text-[#0F7A5F]">✓</span>
            </motion.div>
          ))}
        </div>

        {/* Right — living opinion */}
        <div className="flex-1 px-4 py-3">
          <p className="text-[9px] font-mono tracking-[0.1em] uppercase text-[#C4922A] mb-2">Living Opinion</p>
          <div className="space-y-1">
            {ANALYSIS_LINES.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 1.4 + i * 0.15 }}
                className="text-[10px] text-white/60 leading-[1.6]"
              >
                {line}
              </motion.p>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 2.2 }}
            className="flex gap-1.5 mt-3"
          >
            {['PRU 1.3.3', 'COBS 23.12.2'].map((cite) => (
              <span key={cite} className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#0F7A5F]/30 text-[#0F7A5F] bg-[#0F7A5F]/10">
                {cite}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
