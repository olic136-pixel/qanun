import Link from 'next/link'

export const metadata = {
  title: 'About — QANUN',
  description: 'Built by practitioners who spent years answering the questions QANUN now answers.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="max-w-[640px] mb-20">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A5FA8] mb-4">
            ABOUT QANUN
          </p>
          <h1 className="text-[52px] font-semibold tracking-[-0.02em] text-[#0B1829] leading-[1.08] mb-6">
            The regulatory corpus,<br />finally structured.
          </h1>
          <p className="text-[18px] text-[#6B7280] leading-[1.65]">
            QANUN was built by practitioners who spent years answering the
            questions it now answers — and who found no tool that came close
            to doing it properly.
          </p>
        </div>

        {/* Two column — story + team */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div className="space-y-6">
            <h2 className="text-[24px] font-semibold text-[#0B1829]">
              Why we built this
            </h2>
            <p className="text-[16px] text-[#6B7280] leading-[1.7]">
              The problem with regulatory research has never been the law itself.
              It&apos;s been the distance between the question and the answer. A CLO
              applying for a licence in ADGM, a founder mapping their product
              against PRU and COBS, a compliance officer reviewing a rule change
              at 11pm — they all know what they need to find. They just can&apos;t
              find it fast enough.
            </p>
            <p className="text-[16px] text-[#6B7280] leading-[1.7]">
              Existing tools — keyword search, legal databases, chatbots — all
              give you raw material. None of them give you a structured research
              note grounded in the specific provisions that answer your specific
              question. That&apos;s what QANUN does.
            </p>
            <p className="text-[16px] text-[#6B7280] leading-[1.7]">
              We built a 10-agent pipeline because a single model pass isn&apos;t
              good enough for legal work. You need retrieval, analysis, adversarial
              challenge, lateral thinking, stress-testing, and synthesis — the same
              cognitive process a good lawyer applies to a hard question, run at
              machine speed.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-[24px] font-semibold text-[#0B1829]">
              The team
            </h2>
            <div className="bg-[#F5F7FA] rounded-2xl p-6 border border-[#E8EBF0]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0B1829] flex items-center
                                justify-center text-[#C4922A] font-semibold text-[16px]
                                flex-shrink-0">
                  OC
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#0B1829]">
                    Oliver Cook KC
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                    Co-founder · Barrister, Libertas Chambers
                  </p>
                  <p className="text-[14px] text-[#6B7280] leading-relaxed mt-3">
                    King&apos;s Counsel specialising in encrypted communications,
                    complex fraud, and cross-jurisdictional financial regulation.
                    Former appearances before the Court of Appeal and EU Parliament.
                    CLO of Fuutura, a multi-jurisdiction crypto exchange.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#F5F7FA] rounded-2xl p-6 border border-[#E8EBF0]">
              <p className="text-[14px] text-[#6B7280] leading-relaxed">
                QANUN is built with Libertas Chambers and a network of
                regulatory practitioners across ADGM, DIFC, and the Gulf.
                The corpus is curated by lawyers. The pipeline is designed
                by lawyers. The output is reviewed by lawyers.
              </p>
              <p className="text-[13px] text-[#9CA3AF] mt-4 font-medium">
                We&apos;re hiring regulatory analysts and AI engineers.{' '}
                <Link href="/sign-in" className="text-[#1A5FA8] hover:underline">
                  Get in touch →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Corpus stats */}
        <div className="bg-[#0B1829] rounded-2xl px-8 py-8
                        grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 mb-16">
          {[
            { n: '2,484', label: 'Regulatory documents in corpus' },
            { n: '63,397', label: 'Individual provisions searchable' },
            { n: '11', label: 'Jurisdictions covered' },
          ].map((s, i) => (
            <div key={i}
              className={`flex flex-col ${i > 0 ? 'md:border-l md:border-white/10 md:pl-8' : ''}`}>
              <span className="text-[42px] font-mono font-semibold text-white leading-none">
                {s.n}
              </span>
              <span className="text-[13px] text-[#6B7280] mt-2">{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-[32px] font-semibold text-[#0B1829] mb-4">
            Ready to try it?
          </h2>
          <p className="text-[16px] text-[#6B7280] mb-8">
            Start with any regulatory question. QANUN handles the rest.
          </p>
          <Link href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#C4922A] text-[#0B1829]
                       font-semibold px-8 py-4 rounded-md text-[15px]
                       hover:bg-[#D4A23A] transition-colors">
            Start researching free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
