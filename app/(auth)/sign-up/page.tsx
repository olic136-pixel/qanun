'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Needs an uppercase letter')
      .regex(/[0-9]/, 'Needs a number'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, 'You must accept the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function getStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*]/.test(password)) score++
  return score
}

const strengthColors = ['bg-[#991B1B]', 'bg-orange-500', 'bg-yellow-500', 'bg-[#059669]']

export default function SignUpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  })

  const password = watch('password', '')
  const strength = getStrength(password)

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name,
            terms: data.terms,
          }),
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body.message || 'Registration failed. Please try again.')
        return
      }

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-1">
        Create your account
      </h2>
      <p className="text-sm text-black/50 mb-6">
        Start your 14-day free trial. No credit card required.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-black mb-1 block">
            Full name
          </label>
          <Input placeholder="Jane Smith" {...register('name')} />
          {errors.name && (
            <p className="text-[13px] text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-black mb-1 block">
            Work email
          </label>
          <Input
            type="email"
            placeholder="jane@company.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[13px] text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-black mb-1 block">
            Password
          </label>
          <Input
            type="password"
            placeholder="At least 8 characters"
            {...register('password')}
          />
          {/* Strength meter */}
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 transition-colors',
                  i < strength ? strengthColors[strength - 1] : 'bg-black/10'
                )}
              />
            ))}
          </div>
          {errors.password && (
            <p className="text-[13px] text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-black mb-1 block">
            Confirm password
          </label>
          <Input
            type="password"
            placeholder="Repeat your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-[13px] text-red-600 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            onCheckedChange={(checked) => setValue('terms', checked === true)}
          />
          <label htmlFor="terms" className="text-sm text-black/50 leading-tight">
            I agree to the{' '}
            <Link href="#" className="text-[#0047FF] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-[#0047FF] hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-[13px] text-red-600">{errors.terms.message}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-black text-white hover:bg-[#0047FF]"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            'Create account'
          )}
        </Button>

        {serverError && (
          <p className="text-[13px] text-red-600 text-center">{serverError}</p>
        )}
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-xs text-black/30">or continue with</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      {/* Google SSO */}
      <button
        className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2')}
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      >
        <Chrome size={16} />
        Google
      </button>

      <p className="text-sm text-black/40 text-center mt-6">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[#0047FF] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
