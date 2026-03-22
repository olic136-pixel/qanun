'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [countdown, setCountdown] = useState(60)
  const [resending, setResending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  async function handleResend() {
    setResending(true)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      )
      setSent(true)
      setCountdown(60)
    } catch {
      // silently fail
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-sm text-center">
      <Mail size={48} className="text-[#1A5FA8] mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-[#0B1829] mb-2">
        Check your email
      </h2>
      <p className="text-[13px] text-[#6B7280] mb-6">
        We sent a verification link to{' '}
        <span className="font-medium text-[#111827]">{email}</span>. Click the
        link to verify your account.
      </p>

      {sent && (
        <p className="text-[13px] text-[#0F7A5F] mb-4">
          Verification email resent.
        </p>
      )}

      <Button
        variant="outline"
        disabled={countdown > 0 || resending}
        onClick={handleResend}
        className="mb-4"
      >
        {countdown > 0
          ? `Resend email (${countdown}s)`
          : resending
            ? 'Sending...'
            : 'Resend email'}
      </Button>

      <div>
        <Link
          href="/sign-in"
          className="text-sm text-[#6B7280] hover:text-[#111827]"
        >
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
