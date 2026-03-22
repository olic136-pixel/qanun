'use client'

import { useState } from 'react'
import { CheckCircle, Minus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type BillingPeriod = 'monthly' | 'annual'

interface PlanFeature {
  label: string
  included: boolean
}

interface Plan {
  name: string
  monthlyPrice: number | null
  annualPrice: number | null
  annualTotal: number | null
  description: string
  features: PlanFeature[]
  cta: string
  featured: boolean
  badge?: string
  ctaHref: string
}

const plans: Plan[] = [
  {
    name: 'Starter',
    monthlyPrice: 99,
    annualPrice: 79,
    annualTotal: 948,
    description: 'For individual practitioners getting started.',
    features: [
      { label: '50 queries/month', included: true },
      { label: 'ADGM + DIFC corpus', included: true },
      { label: '1 product twin', included: true },
      { label: 'Session history', included: true },
      { label: 'Multi-jurisdiction', included: false },
      { label: 'API access', included: false },
    ],
    cta: 'Start free trial',
    featured: false,
    ctaHref: '/sign-up',
  },
  {
    name: 'Professional',
    monthlyPrice: 349,
    annualPrice: 279,
    annualTotal: 3348,
    description: 'For teams navigating multiple jurisdictions.',
    features: [
      { label: 'Unlimited queries', included: true },
      { label: 'All jurisdictions', included: true },
      { label: '5 product twins', included: true },
      { label: 'Real-time alerts', included: true },
      { label: 'Document export', included: true },
      { label: 'All Wave 2 jurisdictions', included: true },
    ],
    cta: 'Start free trial',
    featured: true,
    badge: 'Most popular',
    ctaHref: '/sign-up',
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    annualTotal: null,
    description: 'For organisations with advanced requirements.',
    features: [
      { label: 'Everything unlimited', included: true },
      { label: 'Team seats + SSO', included: true },
      { label: 'API access', included: true },
      { label: 'White-label option', included: true },
      { label: 'Dedicated support', included: true },
      { label: 'SLA', included: true },
    ],
    cta: 'Talk to us',
    featured: false,
    ctaHref: 'mailto:hello@qanun.ai',
  },
]

const faqs = [
  {
    q: 'What is a product twin?',
    a: 'A product twin is a regulatory digital twin of your entity. You define your jurisdiction, licence type, and regulated activities, and QANUN continuously monitors the corpus for rule changes that affect your specific structure. When something changes, you get an alert with the exact rule, what changed, and what it means for you.',
  },
  {
    q: 'How current is the corpus? How often is it updated?',
    a: 'The corpus is updated as regulators publish. We monitor the ADGM, DFSA, and other regulatory gazettes and ingest new documents within hours of publication. The corpus currently contains over 2,484 documents and 63,397 sections.',
  },
  {
    q: 'Can I use QANUN for multiple entities?',
    a: 'Yes. Starter plans include 1 product twin, Professional includes 5, and Enterprise offers unlimited twins. Each twin can be configured for a different entity, jurisdiction, and licence type.',
  },
  {
    q: 'What jurisdictions are in the Professional plan?',
    a: 'Professional includes all live jurisdictions (ADGM/FSRA, DIFC/DFSA, El Salvador) plus all Wave 2 jurisdictions as they come online (Saudi CMA, UAE VARA, Mauritius FSC, Bahrain CBB, Pakistan SECP/PVARA).',
  },
  {
    q: 'Is my query data kept confidential?',
    a: 'Absolutely. Your queries, session data, and product twin configurations are encrypted at rest and in transit. We do not use your data to train models. Enterprise customers can request dedicated infrastructure and data residency controls.',
  },
  {
    q: 'How does the 14-day trial work?',
    a: 'Sign up with your email — no credit card required. You get full Professional-tier access for 14 days, including unlimited queries, all jurisdictions, and up to 5 product twins. At the end of the trial, choose a plan or your account pauses.',
  },
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Yes. You can change your plan at any time from the billing page. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    q: 'Do you offer white-labelling?',
    a: 'Yes, on Enterprise plans. White-label QANUN under your brand for your clients or internal teams. Contact us for details on customisation options, including custom domains, branded reports, and API integrations.',
  },
]

function PricingCard({
  plan,
  billing,
}: {
  plan: Plan
  billing: BillingPeriod
}) {
  const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice
  const originalPrice = billing === 'annual' ? plan.monthlyPrice : null

  return (
    <div
      className={cn(
        'relative rounded-xl p-6',
        plan.featured
          ? 'border-2 border-[#1A5FA8]'
          : 'border border-[#E8EBF0]'
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0B1829] text-[#C4922A] rounded-full px-3 py-1 text-[10px] font-semibold uppercase">
          {plan.badge}
        </span>
      )}

      <h3 className="text-lg font-medium text-[#0B1829]">{plan.name}</h3>
      <p className="text-sm text-[#6B7280] mt-1">{plan.description}</p>

      <div className="mt-4 mb-6">
        {price !== null ? (
          <div className="flex items-baseline gap-2">
            {originalPrice && billing === 'annual' && (
              <span className="text-lg text-[#9CA3AF] line-through">
                ${originalPrice}
              </span>
            )}
            <span className="text-3xl font-semibold text-[#0B1829]">
              ${price}
            </span>
            <span className="text-sm text-[#6B7280]">/mo</span>
          </div>
        ) : (
          <span className="text-3xl font-semibold text-[#0B1829]">Custom</span>
        )}
        {plan.annualTotal && billing === 'annual' && (
          <p className="text-xs text-[#9CA3AF] mt-1">
            Billed ${plan.annualTotal.toLocaleString()}/yr
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-sm">
            {f.included ? (
              <CheckCircle size={16} className="text-[#0F7A5F] shrink-0" />
            ) : (
              <Minus size={16} className="text-[#D1D5DB] shrink-0" />
            )}
            <span className={f.included ? 'text-[#111827]' : 'text-[#9CA3AF]'}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={plan.ctaHref}
        className={cn(
          buttonVariants({
            variant: plan.featured ? 'default' : 'outline',
          }),
          'w-full',
          plan.featured &&
            'bg-[#0B1829] text-white hover:bg-[#1A5FA8]'
        )}
      >
        {plan.cta}
      </a>

      {plan.monthlyPrice !== null && (
        <p className="text-[11px] text-[#6B7280] text-center mt-3">
          14-day free trial &middot; No credit card required
        </p>
      )}
    </div>
  )
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')

  return (
    <div className="py-16 px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-semibold text-[#0B1829]">
          Simple, transparent pricing
        </h1>
        <p className="text-base text-[#6B7280] mt-3">
          All plans include full corpus access. No per-query charges.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 flex justify-center">
          <Tabs
            value={billing}
            onValueChange={(v) => setBilling(v as BillingPeriod)}
          >
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">
                Annual (2 months free)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} billing={billing} />
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Common questions
        </h2>
        <Accordion className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[#6B7280] leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
