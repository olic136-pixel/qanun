'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const ANSWER_LINES = [
  { h: 'Determinative criterion', p: 'A Category 3A Authorised Person is one whose FSP authorises Dealing in Investments as Matched Principal only.', c: 'PRU 1.3.3(1)' },
  { h: 'Matched Principal', p: 'The firm executes simultaneous back-to-back trades, bears no market risk, and holds only incidental positions.', c: 'PRU 1.3.3(2)' },
]

export default function QuickLookupPanel({ className = '' }: { className?: string }) {
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
      <div className="bg-[#111827] px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
            <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
            <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[10px] font-mono text-[#6B7280] ml-1">QANUN · Quick Lookup</span>
        </div>
        <span className="text-[9px] font-mono text-[#0F7A5F]">&lt; 15s</span>
      </div>

      {/* Query */}
      <div className="px-4 py-3 border-b border-white/[0.08]">
        <p className="text-[8px] font-mono tracking-[0.1em] uppercase text-[#C4922A] mb-1">Query</p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-[11px] text-white/80"
        >
          What is a Category 3A licence under ADGM?
        </motion.p>
      </div>

      {/* Answer */}
      <div className="px-4 py-3">
        <p className="text-[8px] font-mono tracking-[0.1em] uppercase text-[#C4922A] mb-2">Answer · ADGM / FSRA</p>
        {ANSWER_LINES.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.3 }}
            className="mb-2"
          >
            <p className="text-[10px] font-semibold text-white mb-0.5">{a.h}</p>
            <p className="text-[10px] text-white/55 leading-[1.6]">
              {a.p}
              <span className="inline-flex items-center ml-1 text-[8px] font-mono px-1 py-0.5 rounded bg-[rgba(26,95,168,0.2)] border border-[rgba(26,95,168,0.3)] text-[#60A5FA] align-middle">
                {a.c}
              </span>
            </p>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 1.4 }}
          className="flex gap-1.5 mt-2"
        >
          {['PRU 1.3.3', 'PRU 1.3.2', 'PRU 1.3'].map((r) => (
            <span key={r} className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#1A5FA8]/30 text-[#60A5FA] bg-[#1A5FA8]/10">
              {r}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
