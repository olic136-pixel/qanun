'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const ALERTS = [
  { level: 'HIGH', color: '#F87171', bg: 'rgba(153,27,27,0.15)', border: 'rgba(153,27,27,0.3)', title: 'COBS 23.12.2 — Managing Assets FSP', desc: 'Auto-Build may constitute copy trading for Retail Clients.' },
  { level: 'MEDIUM', color: '#C4922A', bg: 'rgba(196,146,42,0.15)', border: 'rgba(196,146,42,0.3)', title: 'PRU 1.3.3(2)(c) — Matched Principal', desc: 'Condition (c): Risk Co operational independence question.' },
]

export default function MonitoringPanel({ className = '' }: { className?: string }) {
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
          <span className="text-[10px] font-mono text-[#6B7280] ml-1">QANUN · Product Twin</span>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#C4922A]/15 text-[#C4922A] border border-[#C4922A]/30">2 alerts</span>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#C4922A] animate-pulse" />
          <span className="text-[11px] font-semibold text-white">TradeDar Ltd</span>
        </div>

        <p className="text-[8px] font-mono tracking-[0.1em] uppercase text-[#C4922A] mb-2">Active Alerts</p>
        {ALERTS.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.25 }}
            className="rounded-lg p-2.5 mb-2 border"
            style={{ background: alert.bg, borderColor: alert.border }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full" style={{ color: alert.color, background: 'rgba(0,0,0,0.2)' }}>
                {alert.level}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-white mb-0.5">{alert.title}</p>
            <p className="text-[9px] text-white/55 leading-relaxed">{alert.desc}</p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 1.2 }}
          className="flex items-center gap-3 mt-2 text-[8px] font-mono text-white/30"
        >
          <span>Last assessed: 22 Mar 2026</span>
          <span>·</span>
          <span>14 provisions</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
