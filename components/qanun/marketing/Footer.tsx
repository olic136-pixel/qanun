import Link from 'next/link'
import { Linkedin, Twitter } from 'lucide-react'
import { QanunWordmark } from '@/components/qanun/QanunWordmark'

const columns = [
  {
    label: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Roadmap', href: '/#roadmap' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer>
      {/* Gold top border */}
      <div className="border-t border-[#C4922A]" />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#0B1829] rounded-[6px] flex items-center justify-center">
                <span className="text-[#C4922A] text-sm font-medium italic">
                  Q
                </span>
              </div>
              <QanunWordmark size="md" />
            </div>
            <p className="text-[13px] text-[#6B7280] max-w-[200px] mt-3 leading-relaxed">
              Regulatory intelligence for ADGM, DIFC, and the world&apos;s
              fastest-growing financial markets.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.label}>
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
                {col.label}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E8EBF0] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B7280]">
            &copy; 2026 QANUN. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-[#6B7280] hover:text-[#111827] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href="#"
              className="text-[#6B7280] hover:text-[#111827] transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
