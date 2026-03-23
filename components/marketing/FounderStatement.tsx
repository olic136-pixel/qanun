'use client'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const PARAGRAPHS = [
  `QANUN exists because the regulatory question and the answer to it have always lived in different places. The question lives with the practitioner — the founder applying for a licence, the CLO mapping a product against seventeen provisions, the compliance officer monitoring a regulatory change that landed at 11pm.`,
  `The answer lives in a corpus of thousands of provisions, scattered across rulebooks, circulars, and guidance notes, with no index and no memory.`,
  `We built QANUN to close that gap. Not with a chatbot. With a system that reads the corpus the way a senior counsel reads it — structurally, adversarially, completely — and gives you a research note you can act on.`,
]

export function FounderStatement() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-[#0B1829] py-32 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(26,95,168,0.07) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-[800px] mx-auto px-6 relative z-10">
        <div ref={ref} className="relative">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 0.25 } : {}}
            transition={{ duration: 0.6 }}
            className="absolute -top-6 -left-4 text-[100px] leading-none text-[#C4922A] select-none"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            &ldquo;
          </motion.span>

          <div className="space-y-7">
            {PARAGRAPHS.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-[21px] leading-[1.75] text-white/90 tracking-[-0.01em]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {para}
              </motion.p>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-10"
          >
            <div className="w-10 h-px bg-[#C4922A] mb-5" />
            <p className="text-[16px] font-semibold text-white">Oliver Cook KC</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">Co-founder · Barrister, Libertas Chambers</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
