import Link from 'next/link'

export function CTASection() {
  return (
    <section className="bg-[#0B1829] py-32 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(26,95,168,0.09) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-[640px] mx-auto px-6 text-center relative z-10">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#C4922A] mb-5">
          GET STARTED
        </p>
        <h2 className="text-[48px] font-semibold tracking-[-0.02em] text-white leading-[1.1] mb-5">
          The regulatory corpus, structured. Your question, answered.
        </h2>
        <p className="text-[17px] text-[#9CA3AF] mb-10">
          Start with a question. QANUN handles the rest.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#C4922A] text-[#0B1829] font-semibold px-8 py-4 rounded-md text-[15px] hover:bg-[#D4A23A] transition-colors"
          >
            Start researching free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-white border border-white/20 px-8 py-4 rounded-md text-[15px] hover:bg-white/5 transition-colors"
          >
            Talk to the team
          </Link>
        </div>
        <p className="text-[13px] text-[#4B5563] mt-7">
          No credit card required · Full corpus access · Cancel anytime
        </p>
      </div>
    </section>
  )
}
