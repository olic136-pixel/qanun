'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return scrollY
}

const navLinks = [
  { label: 'Product', href: '/#features' },
  { label: 'Jurisdictions', href: '/jurisdictions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-[#6B7280]"
    >
      <motion.path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={open ? { d: 'M5 5L15 15' } : { d: 'M3 6H17' }}
        transition={{ duration: 0.2 }}
      />
      <motion.path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={open ? { d: 'M5 15L15 5' } : { d: 'M3 10H17' }}
        transition={{ duration: 0.2 }}
      />
      <motion.path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={open ? { opacity: 0, d: 'M3 14H17' } : { opacity: 1, d: 'M3 14H17' }}
        transition={{ duration: 0.2 }}
      />
    </svg>
  )
}

export function NavBar() {
  const scrollY = useScrollPosition()
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrolled = scrollY > 20

  return (
    <>
      <nav
        className="sticky top-0 z-50 h-16 transition-colors duration-150"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Bottom border with fade-in animation */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-[#E8EBF0]"
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        />

        <div className="mx-auto max-w-[1280px] flex items-center justify-between px-8 h-full">
          {/* Left: QANUN wordmark + pronunciation */}
          <Link href="/" className="flex items-center">
            <span
              className="text-[18px] font-semibold text-[#0B1829]"
              style={{ letterSpacing: '-0.02em' }}
            >
              QANUN
            </span>
            <span
              className="ml-2 text-[11px] italic text-[#9CA3AF]"
            >
              /kɑːˈnuːn/
            </span>
          </Link>

          {/* Center: nav links (desktop only) */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-[#6B7280] hover:text-[#0B1829] transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: CTA buttons (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-[13px] text-[#6B7280] hover:text-[#0B1829] transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/request-access"
              className="px-4 py-2 rounded-md text-[13px] font-medium bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white transition-all duration-150"
            >
              Request access
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer from right */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white border-l border-[#E8EBF0] p-6 md:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-end mb-8">
                <button
                  className="p-2 -mr-2"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <HamburgerIcon open={true} />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block text-[15px] text-[#6B7280] hover:text-[#0B1829] py-3 transition-colors duration-150"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-[#E8EBF0] mt-6 pt-6 space-y-3">
                <Link
                  href="/sign-in"
                  className="block text-center text-[13px] text-[#6B7280] hover:text-[#0B1829] py-2 transition-colors duration-150"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/request-access"
                  className="block text-center px-4 py-2 rounded-md text-[13px] font-medium bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white transition-all duration-150"
                  onClick={() => setMobileOpen(false)}
                >
                  Request access
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
