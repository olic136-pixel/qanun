'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

type Theme = 'light' | 'dark' | 'system'
type Density = 'comfortable' | 'compact'

interface NotificationPreference {
  id: string
  label: string
  email: boolean
  inApp: boolean
}

export default function SettingsPage() {
  const [fullName, setFullName] = useState('Oliver Cook')
  const [organisation, setOrganisation] = useState('Fuutura / TradeDar')
  const [role, setRole] = useState('CLO / General Counsel')

  const [notifications, setNotifications] = useState<NotificationPreference[]>([
    { id: 'alert', label: 'New regulatory alert', email: true, inApp: true },
    { id: 'corpus', label: 'Corpus update', email: true, inApp: true },
    { id: 'assessment', label: 'Assessment complete', email: true, inApp: true },
  ])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [theme, setTheme] = useState<Theme>('system')
  const [density, setDensity] = useState<Density>('comfortable')

  const toggleNotification = (
    id: string,
    channel: 'email' | 'inApp'
  ) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, [channel]: !n[channel] } : n
      )
    )
  }

  return (
    <div>
      <h1 className="mb-5 text-[28px] font-medium text-[#0B1829]">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList variant="line">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="mt-4 max-w-[480px] space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#0B1829]">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-[38px] w-full rounded-md border border-[#E8EBF0] bg-white px-3 text-[13px] outline-none focus:border-[#1A5FA8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#0B1829]">
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value="demo@qanun.ai"
                  disabled
                  className="h-[38px] flex-1 rounded-md border border-[#E8EBF0] bg-[#F5F7FA] px-3 text-[13px] text-[#6B7280] outline-none"
                />
                <button className="text-[13px] text-[#1A5FA8] hover:underline">
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#0B1829]">
                Organisation
              </label>
              <input
                type="text"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="h-[38px] w-full rounded-md border border-[#E8EBF0] bg-white px-3 text-[13px] outline-none focus:border-[#1A5FA8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#0B1829]">
                Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-[38px] w-full rounded-md border border-[#E8EBF0] bg-white px-3 text-[13px] outline-none focus:border-[#1A5FA8]"
              />
            </div>

            <button className="mt-2 h-[38px] rounded-md bg-[#0B1829] px-5 text-[13px] text-[#C4922A] transition-colors hover:bg-[#0B1829]/90">
              Save changes
            </button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="mt-4 max-w-[480px]">
            <p className="mb-3 text-[14px] font-medium text-[#0B1829]">
              Notification preferences
            </p>

            <div>
              {/* Header */}
              <div className="flex items-center border-b border-[#E8EBF0] py-2">
                <span className="flex-1 text-[12px] font-medium text-[#6B7280]">
                  Notification
                </span>
                <span className="w-16 text-center text-[12px] font-medium text-[#6B7280]">
                  Email
                </span>
                <span className="w-16 text-center text-[12px] font-medium text-[#6B7280]">
                  In-app
                </span>
              </div>

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between border-b border-[#E8EBF0] py-3"
                >
                  <span className="flex-1 text-[13px] text-[#0B1829]">
                    {notification.label}
                  </span>
                  <div className="flex w-16 justify-center">
                    <Switch
                      checked={notification.email}
                      onCheckedChange={() =>
                        toggleNotification(notification.id, 'email')
                      }
                    />
                  </div>
                  <div className="flex w-16 justify-center">
                    <Switch
                      checked={notification.inApp}
                      onCheckedChange={() =>
                        toggleNotification(notification.id, 'inApp')
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="mt-4 max-w-[480px] space-y-6">
            {/* Change Password */}
            <div>
              <p className="mb-3 text-[14px] font-medium text-[#0B1829]">
                Change password
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[13px] text-[#6B7280]">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-[38px] w-full rounded-md border border-[#E8EBF0] bg-white px-3 text-[13px] outline-none focus:border-[#1A5FA8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] text-[#6B7280]">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-[38px] w-full rounded-md border border-[#E8EBF0] bg-white px-3 text-[13px] outline-none focus:border-[#1A5FA8]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] text-[#6B7280]">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-[38px] w-full rounded-md border border-[#E8EBF0] bg-white px-3 text-[13px] outline-none focus:border-[#1A5FA8]"
                  />
                </div>
                <button className="h-[38px] rounded-md border border-[#E8EBF0] bg-white px-4 text-[13px] text-[#0B1829] transition-colors hover:bg-[#F5F7FA]">
                  Update password
                </button>
              </div>
            </div>

            {/* Two-factor authentication */}
            <div>
              <p className="mb-3 text-[14px] font-medium text-[#0B1829]">
                Two-factor authentication
              </p>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-[#FEF3C7] px-2 py-1 text-[12px] font-medium text-[#92400E]">
                  Not enabled
                </span>
                <button
                  disabled
                  className="h-[38px] cursor-not-allowed rounded-md border border-[#E8EBF0] bg-white px-4 text-[13px] text-[#9CA3AF]"
                >
                  Enable 2FA
                </button>
                <span className="text-[12px] text-[#9CA3AF]">Coming soon</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="mt-4 max-w-[480px]">
            {/* Theme */}
            <div>
              <p className="mb-3 text-[14px] font-medium text-[#0B1829]">
                Theme
              </p>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 rounded-md border px-4 py-3 text-[13px] capitalize transition-colors ${
                      theme === t
                        ? 'border-[#1A5FA8] bg-[#EFF6FF] text-[#0C447C]'
                        : 'border-[#E8EBF0] bg-white text-[#0B1829] hover:bg-[#F5F7FA]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="mt-6">
              <p className="mb-3 text-[14px] font-medium text-[#0B1829]">
                Density
              </p>
              <div className="flex gap-3">
                {(['comfortable', 'compact'] as Density[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDensity(d)}
                    className={`flex-1 rounded-md border px-4 py-3 text-[13px] capitalize transition-colors ${
                      density === d
                        ? 'border-[#1A5FA8] bg-[#EFF6FF] text-[#0C447C]'
                        : 'border-[#E8EBF0] bg-white text-[#0B1829] hover:bg-[#F5F7FA]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
