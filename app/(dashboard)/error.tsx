'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <p className="text-[11px] font-mono tracking-widest uppercase text-[#C4922A] mb-3">
          SYSTEM STATUS
        </p>
        <h1 className="text-[28px] font-semibold text-[#0B1829] mb-3">
          Research pipeline temporarily offline
        </h1>
        <p className="text-[15px] text-[#6B7280] mb-8 leading-relaxed">
          The QANUN API is restarting. This usually takes under 30 seconds.
        </p>
        <button
          onClick={reset}
          className="bg-[#0B1829] text-[#C4922A] font-medium px-6 py-3
                     rounded-md text-[14px] hover:bg-[#1A5FA8] hover:text-white
                     transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
