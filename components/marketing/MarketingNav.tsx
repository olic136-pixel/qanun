'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white border-b border-[#E8EBF0]'
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Link href="/" className="flex items-baseline gap-2">
            <span className={`text-[18px] font-semibold tracking-[-0.02em] transition-colors ${
              scrolled ? 'text-[#0B1829]' : 'text-white'
            }`}>
              QANUN
            </span>
            <span className={`text-[11px] italic font-normal transition-colors ${
              scrolled ? 'text-[#9CA3AF]' : 'text-white/40'
            }`}>
              /kɑːˈnuːn/
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Product', 'Jurisdictions', 'Pricing', 'About'].map(link => (
              <Link
                key={link}
                href={link === 'Pricing' ? '/pricing' : `/#${link.toLowerCase()}`}
                className={`text-[13px] font-medium transition-colors ${
                  scrolled
                    ? 'text-[#6B7280] hover:text-[#0B1829]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {link}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className={`text-[13px] transition-colors px-3 py-2 ${
                scrolled ? 'text-[#6B7280] hover:text-[#0B1829]' : 'text-white/60 hover:text-white'
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] font-medium bg-[#C4922A] text-[#0B1829] hover:bg-[#D4A23A] transition-all duration-200 px-4 py-2 rounded-md"
            >
              Request access
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`block h-px transition-all ${scrolled ? 'bg-[#0B1829]' : 'bg-white'} ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-px transition-all ${scrolled ? 'bg-[#0B1829]' : 'bg-white'} ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px transition-all ${scrolled ? 'bg-[#0B1829]' : 'bg-white'} ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
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
              {['Product', 'Jurisdictions', 'Pricing', 'About'].map(link => (
                <Link
                  key={link}
                  href={link === 'Pricing' ? '/pricing' : `/#${link.toLowerCase()}`}
                  className="text-[18px] font-medium text-[#0B1829]"
                  onClick={() => setMenuOpen(false)}
                >
                  {link}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-[#E8EBF0]">
                <Link href="/sign-in" className="text-[16px] text-[#6B7280]">Sign in</Link>
                <Link href="/sign-up" className="text-[16px] font-medium bg-[#0B1829] text-[#C4922A] px-4 py-3 rounded-md text-center">
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
