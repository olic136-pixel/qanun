import Link from 'next/link'
import { Linkedin, Twitter } from 'lucide-react'

const SERVICES = ['Research', 'Monitoring', 'Governance Suites', 'Entity Setup']
const COMPANY = ['About', 'Pricing', 'Product', 'Careers']
const LEGAL = ['Privacy Policy', 'Terms of Service', 'Security']

const SERVICE_HREFS: Record<string, string> = {
  'Research': '/#how-it-works',
  'Monitoring': '/#how-it-works',
  'Governance Suites': '/sign-up',
  'Entity Setup': '/sign-up',
}
const COMPANY_HREFS: Record<string, string> = {
  'About': '/about',
  'Pricing': '/pricing',
  'Product': '/product',
  'Careers': '#',
}

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-[1280px] mx-auto px-6 pt-16 pb-12">

        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 pb-16 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white flex items-center justify-center">
                <span className="text-black font-black text-xl leading-none">Q</span>
              </div>
              <span className="text-[20px] font-black uppercase tracking-tighter text-white">
                QANUN
              </span>
            </div>
            <p className="text-[16px] text-white/40 leading-relaxed max-w-[360px]">
              Regulatory intelligence and governance suite drafting for ADGM, VARA, El Salvador, and beyond.
            </p>
          </div>
          <div className="flex flex-col justify-center lg:items-end gap-4">
            <h3 className="text-[28px] font-black uppercase tracking-tighter text-white leading-none">
              Ready to work with us?
            </h3>
            <Link href="/sign-up" className="btn-primary-inverted">
              Request access ↘
            </Link>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6">Services</p>
            <ul className="space-y-3">
              {SERVICES.map(s => (
                <li key={s}>
                  <Link href={SERVICE_HREFS[s] ?? '#'}
                    className="text-[14px] font-bold uppercase tracking-tight text-white/60 hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6">Company</p>
            <ul className="space-y-3">
              {COMPANY.map(c => (
                <li key={c}>
                  <Link href={COMPANY_HREFS[c] ?? '#'}
                    className="text-[14px] font-bold uppercase tracking-tight text-white/60 hover:text-white transition-colors">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6">Legal</p>
            <ul className="space-y-3">
              {LEGAL.map(l => (
                <li key={l}>
                  <Link href="#"
                    className="text-[14px] font-bold uppercase tracking-tight text-white/60 hover:text-white transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] mb-6">Status</p>
            <div className="space-y-3">
              {[
                { label: 'ADGM / FSRA', live: true },
                { label: 'VARA — Dubai', live: true },
                { label: 'El Salvador', live: true },
                { label: 'Saudi Arabia', live: false },
              ].map(j => (
                <div key={j.label} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${j.live ? 'bg-[#0047FF] animate-pulse' : 'bg-white/20'}`} />
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">{j.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">
            © 2026 QANUN Intelligence. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/20 hover:text-white/60 transition-colors" aria-label="LinkedIn">
              <Linkedin size={15} />
            </a>
            <a href="#" className="text-white/20 hover:text-white/60 transition-colors" aria-label="Twitter">
              <Twitter size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
