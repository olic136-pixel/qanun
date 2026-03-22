'use client'

import { CreditCard, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Billing</h1>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[16px] font-semibold text-gray-900">Professional</h2>
              <Badge className="bg-navy text-white text-[10px]">Current plan</Badge>
            </div>
            <p className="text-[13px] text-gray-500">
              Unlimited queries · 10 product twins · All agents · Priority support
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-gray-900">$299</p>
            <p className="text-[12px] text-gray-400">/month</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Plan features</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            'Unlimited regulatory queries',
            'Full MALIS agent pipeline',
            '10 product twin monitors',
            'Real-time regulatory alerts',
            'Claim grounding & validation',
            'Cross-jurisdiction comparison',
            'Export to Word/PDF',
            'Priority email support',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
              <span className="text-[13px] text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Payment method</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-gray-100 rounded flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-[11px] text-gray-400">Expires 12/27</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-[12px]">Update</Button>
        </div>
      </Card>
    </div>
  )
}
