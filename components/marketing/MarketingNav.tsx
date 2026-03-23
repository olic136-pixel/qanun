'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const isHomepage = pathname === '/'
  const needsSolidNav = !isHomepage || scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navBg = needsSolidNav
    ? 'bg-white border-b border-[#E8EBF0]'
    : 'bg-transparent border-b border-transparent'

  const textColor = needsSolidNav ? 'text-[#6B7280]' : 'text-white/70'
  const textHover = needsSolidNav ? 'hover:text-[#0B1829]' : 'hover:text-white'
  const wordmarkColor = needsSolidNav ? 'text-[#0B1829]' : 'text-white'
  const pronunciationColor = needsSolidNav ? 'text-[#9CA3AF]' : 'text-white/40'
  const signinColor = needsSolidNav ? 'text-[#6B7280]' : 'text-white/60'

  const NAV_LINKS = [
    { label: 'Product', href: '/#features' },
    { label: 'Jurisdictions', href: '/#jurisdictions' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
  ]

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center
                             transition-colors duration-300 ${
              needsSolidNav ? 'bg-[#0B1829]' : 'bg-[#C4922A]/20'
            }`}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#C4922A" strokeWidth="1.5"/>
                <path d="M9.5 9.5l2 2" stroke="#C4922A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-[20px] font-semibold tracking-[-0.03em]
                                transition-colors duration-300 ${wordmarkColor}`}>
                QANUN
              </span>
              <span className={`text-[11px] italic font-normal hidden sm:block
                                transition-colors duration-300 ${pronunciationColor}`}>
                /kɑːˈnuːn/
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[13px] font-medium transition-colors duration-200 ${textColor} ${textHover}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className={`text-[13px] transition-colors px-3 py-2 ${signinColor} ${textHover}`}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] font-medium bg-[#0B1829] text-[#C4922A]
                         hover:bg-[#1A5FA8] hover:text-white transition-all
                         duration-200 px-4 py-2 rounded-md"
            >
              Request access
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              {[
                menuOpen ? 'rotate-45 translate-y-2' : '',
                menuOpen ? 'opacity-0' : '',
                menuOpen ? '-rotate-45 -translate-y-2' : '',
              ].map((cls, i) => (
                <span key={i}
                  className={`block h-px transition-all
                    ${needsSolidNav ? 'bg-[#0B1829]' : 'bg-white'} ${cls}`}
                />
              ))}
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-white pt-16"
          >
            <div className="flex flex-col p-6 gap-6">
              {NAV_LINKS.map(link => (
                <Link key={link.label} href={link.href}
                  className="text-[18px] font-medium text-[#0B1829]"
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-[#E8EBF0]">
                <Link href="/sign-in" className="text-[16px] text-[#6B7280]">Sign in</Link>
                <Link href="/sign-up"
                  className="text-[16px] font-medium bg-[#0B1829] text-[#C4922A]
                             px-4 py-3 rounded-md text-center">
                  Request access
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
