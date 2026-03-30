export function ProofBar() {
  const ITEMS = [
    '2,366 regulatory documents',
    '65,822 indexed provisions',
    '84% average grounding ratio',
    '0 provisions invented',
    '3 jurisdictions live',
  ]

  return (
    <div className="bg-black py-4 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 overflow-x-auto">
        <div className="flex items-center whitespace-nowrap min-w-max">
          {ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="font-mono text-[11px] text-white/35 uppercase tracking-[0.18em]">
                {item}
              </span>
              {i < ITEMS.length - 1 && (
                <span className="font-mono text-[11px] text-white/15 mx-5 select-none">—</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
