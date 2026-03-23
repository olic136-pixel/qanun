import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B1829] flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-[11px] font-mono tracking-widest uppercase text-[#C4922A] mb-3">
          404
        </p>
        <h1 className="text-[36px] font-semibold text-white mb-3">
          Page not found
        </h1>
        <p className="text-[15px] text-[#9CA3AF] mb-8">
          This page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#C4922A]
                     text-[#0B1829] font-semibold px-6 py-3 rounded-md
                     text-[14px] hover:bg-[#D4A23A] transition-colors"
        >
          Return home
        </Link>
      </div>
    </div>
  )
}
