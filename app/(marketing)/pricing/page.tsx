'use client'

import { CheckCircle, Minus } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface PlanFeature {
  label: string
  included: boolean
}

interface Plan {
  name: string
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
    description: 'For individual practitioners getting started.',
    features: [
      { label: '50 queries/month', included: true },
      { label: 'ADGM + DIFC corpus', included: true },
      { label: '1 product twin', included: true },
      { label: 'Session history', included: true },
      { label: 'Multi-jurisdiction', included: false },
      { label: 'API access', included: false },
    ],
    cta: 'Request access',
    featured: false,
    ctaHref: '/sign-up',
  },
  {
    name: 'Professional',
    description: 'For teams navigating multiple jurisdictions.',
    features: [
      { label: 'Unlimited queries', included: true },
      { label: 'All jurisdictions', included: true },
      { label: '5 product twins', included: true },
      { label: 'Real-time alerts', included: true },
      { label: 'Document export', included: true },
      { label: 'All Wave 2 jurisdictions', included: true },
    ],
    cta: 'Request access',
    featured: true,
    badge: 'Most popular',
    ctaHref: '/sign-up',
  },
  {
    name: 'Enterprise',
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
    a: 'The corpus is updated as regulators publish. We monitor the ADGM, DFSA, and other regulatory gazettes and ingest new documents within hours of publication. The corpus currently contains over 2,366 documents and 65,822 sections.',
  },
  {
    q: 'Can I use QANUN for multiple entities?',
    a: 'Yes. Starter plans include 1 product twin, Professional includes 5, and Enterprise offers unlimited twins. Each twin can be configured for a different entity, jurisdiction, and licence type.',
  },
  {
    q: 'What jurisdictions are in the Professional plan?',
    a: 'Professional includes all live jurisdictions (ADGM/FSRA, DIFC/DFSA, VARA, El Salvador/CNAD) plus all Wave 2 jurisdictions as they come online (Saudi CMA, Mauritius FSC, Bahrain CBB, Pakistan SECP).',
  },
  {
    q: 'Is my query data kept confidential?',
    a: 'Absolutely. Your queries, session data, and product twin configurations are encrypted at rest and in transit. We do not use your data to train models. Enterprise customers can request dedicated infrastructure and data residency controls.',
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

function PricingCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative p-6 ${
        plan.featured
          ? 'border-2 border-black'
          : 'border border-black/10'
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 text-[10px] font-semibold uppercase">
          {plan.badge}
        </span>
      )}

      <h3 className="text-lg font-black uppercase tracking-tighter text-black">{plan.name}</h3>
      <p className="text-sm text-black/50 mt-1">{plan.description}</p>

      <div className="mt-4 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/30">
          Pricing on request
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-sm">
            {f.included ? (
              <CheckCircle size={16} className="text-[#059669] shrink-0" />
            ) : (
              <Minus size={16} className="text-black/20 shrink-0" />
            )}
            <span className={f.included ? 'text-black' : 'text-black/30'}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={plan.ctaHref}
        className={`w-full text-center justify-center ${
          plan.featured ? 'btn-primary' : 'btn-secondary'
        }`}
        style={{ display: 'flex' }}
      >
        {plan.cta}
      </a>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="py-16 px-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
          Simple pricing.
        </h1>
        <p className="text-base text-black/50 mt-3">
          All plans include full corpus access. No per-query charges.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-center mb-8">
          Common questions
        </h2>
        <Accordion className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-black/50 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
