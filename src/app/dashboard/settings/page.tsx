'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Save, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { user, token } = useAuth()
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('465')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const u = data.user
        if (u.smtp_host) setSmtpHost(u.smtp_host)
        if (u.smtp_port) setSmtpPort(String(u.smtp_port))
        if (u.smtp_user) setSmtpUser(u.smtp_user)
        if (u.smtp_from) setSmtpFrom(u.smtp_from)
        if (u.smtp_from_name) setSmtpFromName(u.smtp_from_name)
      })
  }, [token])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: Number(smtpPort),
          smtp_user: smtpUser,
          smtp_pass: smtpPass || undefined,
          smtp_from: smtpFrom,
          smtp_from_name: smtpFromName,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-slate-600 text-sm mb-8">Configure your SMTP to send emails from your own domain.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold">SMTP Configuration</h2>
        <p className="text-xs text-slate-500">Emails are sent from YOUR email server. Your domain, your reputation.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">SMTP Host</label>
            <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Port</label>
            <input value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
              placeholder="465" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)}
              placeholder="you@domain.com" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)}
              placeholder="App password" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Email</label>
            <input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)}
              placeholder="you@domain.com" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From Name</label>
            <input value={smtpFromName} onChange={e => setSmtpFromName(e.target.value)}
              placeholder="Your Name" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}</>}
        </button>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
        <h2 className="font-semibold mb-4">Account</h2>
        <div className="text-sm space-y-2">
          <p><span className="text-slate-500">Email:</span> {user?.email}</p>
          <p><span className="text-slate-500">Plan:</span> {user?.plan || 'FREE'}</p>
          <p><span className="text-slate-500">Emails remaining:</span> {(user?.emails_limit || 0) - (user?.emails_used || 0)}</p>
        </div>
      </div>
    </div>
  )
}
