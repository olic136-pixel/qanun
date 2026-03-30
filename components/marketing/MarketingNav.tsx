'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Research', href: '/#how-it-works' },
  { label: 'Jurisdictions', href: '/#jurisdictions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav' : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* Logo mark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#000000] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xl leading-none">Q</span>
            </div>
            <span className="text-[18px] font-black uppercase tracking-tighter text-[#000000]">
              QANUN
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="micro-label hover:opacity-100 transition-opacity"
                style={{ opacity: 0.5 }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="micro-label hover:opacity-100 px-3 py-2 transition-opacity"
              style={{ opacity: 0.4 }}
            >
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-primary py-2.5 px-5 text-[11px]">
              Request access
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen
              ? <X size={20} className="text-[#000000]" />
              : <Menu size={20} className="text-[#000000]" />
            }
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="fixed inset-0 z-40 bg-white pt-[68px] flex flex-col"
          >
            <div className="flex flex-col p-8 gap-0 border-t border-black/10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-5 text-[22px] font-black uppercase tracking-tighter text-[#000000] border-b border-black/10"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-8 flex flex-col gap-3">
                <Link href="/sign-in" className="text-[14px] font-bold uppercase tracking-widest text-black/40">
                  Sign in
                </Link>
                <Link href="/sign-up" className="btn-primary text-center">
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
