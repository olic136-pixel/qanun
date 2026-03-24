import Link from 'next/link'
import DeepResearchPanel from '@/components/marketing/DeepResearchPanel'
import QuickLookupPanel from '@/components/marketing/QuickLookupPanel'
import MonitoringPanel from '@/components/marketing/MonitoringPanel'
import ReferencePanel from '@/components/marketing/ReferencePanel'

const PANELS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Deep Research': DeepResearchPanel,
  'Quick Lookup': QuickLookupPanel,
  'Regulatory Monitoring': MonitoringPanel,
  'Reference Material': ReferencePanel,
}

export const metadata = {
  title: 'Product — QANUN',
  description: 'A structured research pipeline built for practitioners who need answers they can act on.',
}

const FEATURES = [
  {
    label: 'Deep Research',
    heading: 'A 10-agent pipeline that thinks like a senior lawyer.',
    body: "When you submit a research question, QANUN runs a structured pipeline: the Retriever pulls the most relevant corpus provisions via vector search; the Analyst examines them in detail; the Devil's Advocate challenges the analysis; the Blue Sky agent explores lateral frameworks; the Stress Tester attacks weak points; and the Orchestrator synthesises a structured research note with grounded claims.",
    stats: [
      { n: '10', label: 'specialist agents' },
      { n: '< 90s', label: 'full pipeline' },
      { n: '63,397', label: 'provisions searched' },
    ],
  },
  {
    label: 'Quick Lookup',
    heading: 'Direct answers in under 15 seconds.',
    body: "For direct questions — \"what does PRU 1.3.3 say?\", \"does COBS 23.12.2 apply to copy trading?\" — QANUN retrieves the top provisions and synthesises a grounded answer inline on the dashboard. No new page. No pipeline wait. Cited and accurate.",
    stats: [
      { n: '< 15s', label: 'response time' },
      { n: '5', label: 'provisions retrieved' },
      { n: '0', label: 'hallucinations' },
    ],
  },
  {
    label: 'Regulatory Monitoring',
    heading: 'Define your product structure. We watch the corpus.',
    body: 'Product Twins let you define your entity structure, licensing position, and jurisdictional footprint once. QANUN monitors the corpus for changes that affect your regulatory map — new guidance, rule amendments, consultation papers — and alerts you with a specific analysis of the impact on your position.',
    stats: [
      { n: 'Live', label: 'corpus monitoring' },
      { n: '24h', label: 'alert latency' },
      { n: '11', label: 'jurisdictions watched' },
    ],
  },
  {
    label: 'Reference Material',
    heading: 'Every claim grounded. Every provision cited.',
    body: 'QANUN does not speculate. Every claim in a research note is tagged with a confidence tier — VERIFIED, SUPPORTED, INFERRED, SPECULATIVE — and linked to the specific corpus provision that supports it. Clicking any citation opens the exact rule text in a slide-over panel.',
    stats: [
      { n: '84%', label: 'average grounding ratio' },
      { n: '4', label: 'confidence tiers' },
      { n: '13,337', label: 'cross-references mapped' },
    ],
  },
]

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="max-w-[640px] mb-24">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A5FA8] mb-4">
            PRODUCT
          </p>
          <h1 className="text-[52px] font-semibold tracking-[-0.02em] text-[#0B1829] leading-[1.08] mb-6">
            What QANUN actually does.
          </h1>
          <p className="text-[18px] text-[#6B7280] leading-[1.65]">
            Not a search tool. Not a chatbot. A structured research pipeline
            built for practitioners who need answers they can act on.
          </p>
        </div>

        {/* Feature sections */}
        <div className="space-y-24">
          {FEATURES.map((f, i) => (
            <div key={i}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center
                ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
              <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#1A5FA8] mb-3">
                  {f.label}
                </p>
                <h2 className="text-[32px] font-semibold tracking-[-0.02em] text-[#0B1829] leading-[1.15] mb-5">
                  {f.heading}
                </h2>
                <p className="text-[16px] text-[#6B7280] leading-[1.7] mb-8">
                  {f.body}
                </p>
                <div className="flex gap-8">
                  {f.stats.map((s, j) => (
                    <div key={j}>
                      <p className="text-[28px] font-mono font-semibold text-[#0B1829]">
                        {s.n}
                      </p>
                      <p className="text-[12px] text-[#9CA3AF] mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {(() => {
                const Panel = PANELS[f.label]
                return Panel ? (
                  <Panel className={`min-h-[240px] ${i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`} />
                ) : (
                  <div className={`bg-[#F5F7FA] rounded-xl p-8 border border-[#E8EBF0]
                    min-h-[240px] flex items-center justify-center
                    ${i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                    <p className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#C4922A]">
                      {f.label}
                    </p>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-[#0B1829] rounded-2xl px-8 py-16">
          <h2 className="text-[36px] font-semibold text-white mb-4">
            See it on a real question.
          </h2>
          <p className="text-[16px] text-[#9CA3AF] mb-8 max-w-[440px] mx-auto">
            Sign up and run your first research query free. No card required.
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
