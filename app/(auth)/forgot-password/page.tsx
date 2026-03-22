'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        }
      )
    } catch {
      // Always show success to prevent email enumeration
    }
    setSent(true)
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-semibold text-[#0B1829] mb-6">
        Reset your password
      </h2>

      {sent ? (
        <div>
          <p className="text-sm text-[#6B7280] mb-6">
            If an account with that email exists, we&apos;ve sent a password
            reset link. Check your inbox.
          </p>
          <Link
            href="/sign-in"
            className="text-sm text-[#6B7280] hover:text-[#111827]"
          >
            &larr; Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#111827] mb-1 block">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@company.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-[13px] text-[#991B1B] mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#0B1829] text-white hover:bg-[#1A5FA8]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              'Send reset link'
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/sign-in"
              className="text-sm text-[#6B7280] hover:text-[#111827]"
            >
              &larr; Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
