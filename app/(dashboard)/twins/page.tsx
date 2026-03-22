'use client'

import Link from 'next/link'

const twins = [
  {
    id: 'fuutura-treasury',
    name: 'Fuutura Treasury Inc.',
    status: 'clear' as const,
    jurisdiction: 'BVI',
    type: 'Token issuer',
    description: 'BVI-incorporated token issuer. Issues FUUTURA utility token (ERC-20).',
    lastAssessed: '2 days ago',
  },
  {
    id: 'tradedar',
    name: 'TradeDar Ltd',
    status: 'alert' as const,
    jurisdiction: 'ADGM',
    type: 'CFD broker',
    description: 'ADGM-based synthetic CFD platform. Dual-entity structure. Category 3A applicant.',
    lastAssessed: '1 day ago',
    featured: true,
  },
  {
    id: 'fuutura-el-salvador',
    name: 'Fuutura El Salvador S.A. de C.V.',
    status: 'clear' as const,
    jurisdiction: 'El Salvador',
    type: 'CEX',
    description: 'El Salvador DASP licence holder. Regulated CEX operator under Bitcoin Law.',
    lastAssessed: '2 days ago',
  },
]

export default function TwinsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[28px] font-medium text-[#0B1829]">Product twins</h1>
        <button className="bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white rounded-md px-4 h-[38px] text-[13px] transition-colors">
          Create twin +
        </button>
      </div>

      {/* Twin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {twins.map((twin) => (
          <div
            key={twin.id}
            className={`bg-white rounded-xl p-5 cursor-pointer hover:shadow-sm transition-all ${
              twin.featured
                ? 'border-2 border-[#C4922A]'
                : 'border border-[#E8EBF0]'
            }`}
          >
            {/* Top: Name + Status */}
            <div className="flex justify-between items-start">
              <span className="text-[15px] font-medium text-[#0B1829]">
                {twin.name}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  twin.status === 'clear'
                    ? 'bg-[#ECFDF5] text-[#166534]'
                    : 'bg-[#FEF3C7] text-[#92400E]'
                }`}
              >
                {twin.status}
              </span>
            </div>

            {/* Badges */}
            <div className="flex gap-1.5 mt-2">
              <span className="bg-[#0B1829] text-white text-[10px] px-2 py-0.5 rounded-sm">
                {twin.jurisdiction}
              </span>
              <span className="bg-[#F5F7FA] text-[#6B7280] text-[10px] px-2 py-0.5 rounded-sm">
                {twin.type}
              </span>
            </div>

            {/* Description */}
            <p className="mt-2 text-[12px] text-[#6B7280] line-clamp-2">
              {twin.description}
            </p>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-[#E8EBF0] flex justify-between text-[11px]">
              <span className="text-[#9CA3AF]">Last assessed: {twin.lastAssessed}</span>
              <Link
                href={`/twins/${twin.id}`}
                className="text-[#1A5FA8] hover:underline"
              >
                Run assessment &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
