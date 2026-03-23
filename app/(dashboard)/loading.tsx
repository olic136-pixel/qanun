export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
        <span className="text-[13px] font-mono text-[#6B7280]">
          Loading QANUN…
        </span>
      </div>
    </div>
  )
}
