'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push(returnUrl)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-semibold text-[#0B1829] mb-6">Welcome back</h2>

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
            <p className="text-[13px] text-[#991B1B] mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-[#111827]">Password</label>
            <Link
              href="/forgot-password"
              className="text-[13px] text-[#1A5FA8] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="Enter your password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[13px] text-[#991B1B] mt-1">
              {errors.password.message}
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
            'Sign in'
          )}
        </Button>

        {error && (
          <p className="text-[13px] text-[#991B1B] text-center">{error}</p>
        )}
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#E8EBF0]" />
        <span className="text-xs text-[#9CA3AF]">or continue with</span>
        <div className="flex-1 h-px bg-[#E8EBF0]" />
      </div>

      {/* Google SSO */}
      <button
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full gap-2'
        )}
        onClick={() => signIn('google', { callbackUrl: returnUrl })}
      >
        <Chrome size={16} />
        Google
      </button>

      <p className="text-sm text-[#6B7280] text-center mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-[#1A5FA8] hover:underline">
          Start free trial
        </Link>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
