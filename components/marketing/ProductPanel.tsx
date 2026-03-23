'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const CLAIMS = [
  { tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.15)', border: 'rgba(15,122,95,0.3)',
    text: 'COBS 23.12.2 requires a Managing Assets FSP for any copy or mirror trading service offered to Retail Clients.',
    ref: 'COBS 23.12.2' },
  { tier: 'VERIFIED', color: '#0F7A5F', bg: 'rgba(15,122,95,0.15)', border: 'rgba(15,122,95,0.3)',
    text: 'The "similar services" catch-all captures block-delegation models regardless of how the investment decision is characterised.',
    ref: 'COBS 23.12.2' },
  { tier: 'SUPPORTED', color: '#1A5FA8', bg: 'rgba(26,95,168,0.15)', border: 'rgba(26,95,168,0.3)',
    text: 'FSRA retains broad supervisory discretion under the "to the satisfaction of the Regulator" standard.',
    ref: 'COBS 23.5.1' },
  { tier: 'INFERRED', color: '#C4922A', bg: 'rgba(196,146,42,0.15)', border: 'rgba(196,146,42,0.3)',
    text: 'A Category 3A licence would be required in addition to the Managing Assets FSP given the matched principal structure.',
    ref: 'PRU 1.3.3' },
]

export function ProductPanel() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-white py-32">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="mb-16">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A5FA8] mb-4">
            HOW IT WORKS
          </p>
          <h2 className="text-[48px] font-semibold tracking-[-0.02em] text-[#0B1829] leading-[1.1] max-w-[580px]">
            From question to research note. In 90 seconds.
          </h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.65] max-w-[520px] mt-5">
            QANUN doesn&apos;t return search results. It runs a structured 10-agent
            pipeline — retrieval, legal analysis, adversarial review,
            stress-testing, synthesis — and produces a research note with
            grounded claims and cited provisions.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden border border-white/10 bg-[#0B1829]"
          style={{ boxShadow: '0 32px 80px rgba(11,24,41,0.25)' }}
        >
          <div className="bg-[#111827] px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <span className="text-[13px] text-[#6B7280] ml-2">QANUN Research</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
              <span className="text-[12px] font-mono text-[#0F7A5F]">10 agents live</span>
            </div>
          </div>

          <div className="bg-[#1C2B3A] px-6 py-5 border-b border-white/10">
            <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-2">QUERY</p>
            <p className="text-[15px] text-white leading-relaxed">
              When does a copy trading service require a Managing Assets FSP under
              COBS 23.12.2, and can a block-delegation model avoid this requirement
              by characterising client parameter-setting as the investment decision?
            </p>
          </div>

          <div className="flex flex-col lg:flex-row min-h-[380px]">
            <div className="flex-1 px-6 py-6 border-b lg:border-b-0 lg:border-r border-white/10">
              <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-5">ANALYSIS</p>
              <div className="space-y-5">
                <div>
                  <p className="text-[13px] font-semibold text-white mb-2">1. The Regulatory Trigger</p>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    <span className="inline-flex items-center bg-[rgba(26,95,168,0.2)] border border-[rgba(26,95,168,0.3)] text-[#60A5FA] font-mono text-[11px] px-1.5 py-0.5 rounded mx-0.5 align-middle">
                      COBS 23.12.2
                    </span>
                    {' '}prohibits an Authorised Person from offering or arranging copy
                    trading services to Retail Clients unless it holds a Financial
                    Services Permission to undertake Managing Assets.{' '}
                    <span className="inline-flex items-center bg-[rgba(15,122,95,0.2)] border border-[rgba(15,122,95,0.3)] text-[#34D399] font-mono text-[10px] px-2 py-0.5 rounded-full align-middle">
                      VERIFIED
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white mb-2">2. The Block-Delegation Question</p>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    The &quot;similar services&quot; catch-all in{' '}
                    <span className="inline-flex items-center bg-[rgba(26,95,168,0.2)] border border-[rgba(26,95,168,0.3)] text-[#60A5FA] font-mono text-[11px] px-1.5 py-0.5 rounded mx-0.5 align-middle">
                      COBS 23.4.1
                    </span>
                    {' '}is designed to capture functional equivalents regardless of
                    how the investment decision is characterised.{' '}
                    <span className="inline-flex items-center bg-[rgba(26,95,168,0.2)] border border-[rgba(26,95,168,0.3)] text-[#93C5FD] font-mono text-[10px] px-2 py-0.5 rounded-full align-middle">
                      SUPPORTED
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white mb-2">3. FSRA Supervisory Discretion</p>
                  <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
                    The FSRA retains broad discretion under the &quot;to the satisfaction
                    of the Regulator&quot; standard to look through any structural
                    characterisation of the arrangement.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[300px] px-5 py-6">
              <p className="text-[10px] font-mono tracking-[0.12em] uppercase text-[#C4922A] mb-5">REFERENCE MATERIAL</p>
              <div className="space-y-3">
                {CLAIMS.map((claim, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                    <span
                      className="inline-flex text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border"
                      style={{ color: claim.color, background: claim.bg, borderColor: claim.border }}
                    >
                      {claim.tier}
                    </span>
                    <p className="text-[12px] text-[#D1D5DB] leading-relaxed mt-2">{claim.text}</p>
                    <p className="text-[10px] font-mono text-[#6B7280] mt-2">{claim.ref}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#111827] px-6 py-3.5 border-t border-white/10 flex flex-wrap items-center gap-6">
            <span className="text-[12px] font-mono text-[#6B7280]">14 claims extracted</span>
            <span className="text-[12px] font-mono text-[#6B7280]">· Grounding ratio: 84%</span>
            <span className="text-[12px] font-mono text-[#6B7280]">· Elapsed: 78s</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
