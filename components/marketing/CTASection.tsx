import Link from 'next/link'

export function CTASection() {
  return (
    <section className="bg-black py-20 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Top rule */}
        <div className="h-px bg-white/10 mb-12" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          {/* Left — headline */}
          <div className="lg:col-span-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">
              Get started
            </p>
            <h2 className="text-[clamp(42px,6vw,72px)] font-black tracking-tighter uppercase text-white leading-[0.95] mb-0">
              The law,<br />
              <span className="text-[#0047FF]">decoded.</span>
            </h2>
          </div>

          {/* Right — actions */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <p className="text-[17px] text-white/50 leading-relaxed">
              From a regulatory question to a complete governance structure.
              Qanun handles the research, the drafting, and the monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/sign-up" className="btn-primary-inverted flex-1 text-center">
                Request access
              </Link>
              <Link href="/sign-in"
                className="flex-1 text-center justify-center px-8 py-4 border border-white/20 font-bold text-[13px] uppercase tracking-widest text-white/60 hover:text-white hover:border-white transition-all inline-flex items-center">
                Sign in
              </Link>
            </div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="h-px bg-white/10 mt-20" />
      </div>
    </section>
  )
}
