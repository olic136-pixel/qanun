'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { User, Bell, Shield, Palette } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Palette },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-navy text-navy font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profile' && (
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1">Name</label>
            <Input defaultValue={session?.user?.name || ''} className="max-w-md" />
          </div>
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1">Email</label>
            <Input defaultValue={session?.user?.email || ''} disabled className="max-w-md" />
          </div>
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1">Role</label>
            <Badge variant="outline">{(session?.user as Record<string, unknown>)?.role as string || 'professional'}</Badge>
          </div>
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1">Jurisdictions</label>
            <div className="flex gap-2">
              {((session?.user as Record<string, unknown>)?.jurisdictions as string[] || ['ADGM / FSRA']).map((j) => (
                <Badge key={j} variant="outline" className="text-[11px]">{j}</Badge>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="p-6 space-y-5">
          {[
            { label: 'Twin alert notifications', desc: 'Get notified when a product twin triggers an alert', default: true },
            { label: 'Session completion', desc: 'Notify when a query session completes', default: true },
            { label: 'Corpus updates', desc: 'Notify when new documents are added to the corpus', default: false },
            { label: 'Weekly digest', desc: 'Receive a weekly summary of activity', default: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-gray-900">{item.label}</p>
                <p className="text-[12px] text-gray-500">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-gray-700 block mb-1">Change password</label>
            <div className="space-y-2 max-w-md">
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-[14px] font-medium text-gray-900 mb-1">Two-factor authentication</p>
            <p className="text-[12px] text-gray-500 mb-2">Add an extra layer of security to your account</p>
            <Badge variant="outline" className="text-[11px]">Not enabled</Badge>
          </div>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card className="p-6 space-y-5">
          {[
            { label: 'Dark mode', desc: 'Use dark theme across the application', default: false },
            { label: 'Compact view', desc: 'Reduce spacing in session results', default: false },
            { label: 'Auto-expand analysis', desc: 'Automatically expand the analysis panel on session load', default: true },
            { label: 'Show confidence labels', desc: 'Display confidence tier labels on claims', default: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-gray-900">{item.label}</p>
                <p className="text-[12px] text-gray-500">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
