'use client'

import { useEffect, useState } from 'react'

const testimonials = [
  {
    quote: 'QANUN cut our regulatory research time from days to minutes.',
    author: 'Head of Compliance, Series B Fintech',
  },
  {
    quote: 'The product twin feature alone justifies the subscription.',
    author: 'CLO, Digital Asset Exchange',
  },
  {
    quote: 'Finally, a tool that understands ADGM the way practitioners do.',
    author: 'Partner, Regional Law Firm',
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const testimonial = testimonials[current]

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col items-center justify-center px-12">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white flex items-center justify-center shrink-0">
            <span className="text-black font-black text-xl leading-none">Q</span>
          </div>
          <span className="text-[22px] font-black uppercase tracking-tighter text-white">QANUN</span>
        </div>
        <div className="text-center max-w-sm transition-opacity duration-500" key={current}>
          <p className="text-white/70 text-sm leading-relaxed mb-3">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em]">{testimonial.author}</p>
        </div>
      </div>

      {/* Right panel — auth card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        {children}
      </div>
    </div>
  )
}
