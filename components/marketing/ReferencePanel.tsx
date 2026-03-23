'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const CLAIMS = [
  { tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.15)', border: 'rgba(15,122,95,0.3)', text: 'COBS 23.12.2 requires a Managing Assets FSP for copy trading to Retail Clients.', ref: 'COBS 23.12.2' },
  { tier: 'SUPPORTED', color: '#1A5FA8', bg: 'rgba(26,95,168,0.15)', border: 'rgba(26,95,168,0.3)', text: 'FSRA retains broad supervisory discretion under the "satisfaction of the Regulator" standard.', ref: 'COBS 23.5.1' },
  { tier: 'INFERRED', color: '#C4922A', bg: 'rgba(196,146,42,0.15)', border: 'rgba(196,146,42,0.3)', text: 'A Category 3A licence is additionally required given the matched principal structure.', ref: 'PRU 1.3.3' },
]

export default function ReferencePanel({ className = '' }: { className?: string }) {
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
          <span className="text-[10px] font-mono text-[#6B7280] ml-1">QANUN · Reference Material</span>
        </div>
        <span className="text-[9px] font-mono text-white/40">14 claims · 84% grounded</span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[8px] font-mono tracking-[0.1em] uppercase text-[#C4922A] mb-2">Grounded Claims</p>
        <div className="space-y-2">
          {CLAIMS.map((claim, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.2 }}
              className="rounded-lg p-2.5 border"
              style={{ background: claim.bg, borderColor: claim.border }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full border"
                  style={{ color: claim.color, background: 'rgba(0,0,0,0.15)', borderColor: claim.border }}
                >
                  {claim.tier}
                </span>
                <span className="text-[8px] font-mono text-white/30">{claim.ref}</span>
              </div>
              <p className="text-[9px] text-white/60 leading-relaxed">{claim.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 1.2 }}
          className="mt-3 pt-2 border-t border-white/[0.08] flex items-center gap-2 text-[8px] font-mono text-white/30"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F]" />
          <span>Every claim linked to a specific corpus provision</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
