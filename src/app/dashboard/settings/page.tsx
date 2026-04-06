'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Save, CheckCircle, Mail, Server, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'

type Provider = 'gmail' | 'outlook' | 'custom'

const PROVIDER_PRESETS: Record<string, { smtp_host: string; smtp_port: number; imap_host: string; imap_port: number }> = {
  gmail: { smtp_host: 'smtp.gmail.com', smtp_port: 465, imap_host: 'imap.gmail.com', imap_port: 993 },
  outlook: { smtp_host: 'smtp.office365.com', smtp_port: 587, imap_host: 'outlook.office365.com', imap_port: 993 },
}

export default function SettingsPage() {
  const { user, token } = useAuth()
  const [provider, setProvider] = useState<Provider>('gmail')
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('465')
  const [imapHost, setImapHost] = useState('imap.gmail.com')
  const [imapPort, setImapPort] = useState('993')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

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
        if (u.imap_host) setImapHost(u.imap_host)
        if (u.imap_port) setImapPort(String(u.imap_port))
        // Detect provider from host
        if (u.smtp_host === 'smtp.gmail.com') setProvider('gmail')
        else if (u.smtp_host === 'smtp.office365.com') setProvider('outlook')
        else if (u.smtp_host) setProvider('custom')
      })
  }, [token])

  const selectProvider = (p: Provider) => {
    setProvider(p)
    if (p in PROVIDER_PRESETS) {
      const preset = PROVIDER_PRESETS[p]
      setSmtpHost(preset.smtp_host)
      setSmtpPort(String(preset.smtp_port))
      setImapHost(preset.imap_host)
      setImapPort(String(preset.imap_port))
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: Number(smtpPort),
          smtp_user: smtpUser,
          smtp_pass: smtpPass || undefined,
          smtp_from: smtpFrom,
          smtp_from_name: smtpFromName,
          imap_host: imapHost,
          imap_port: Number(imapPort),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/user/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTestResult({ ok: res.ok, message: data.message || data.error })
    } catch {
      setTestResult({ ok: false, message: 'Connection test failed' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-slate-600 text-sm mb-8">Connect your email to send campaigns and track replies.</p>

      {/* Provider selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Email Provider</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => selectProvider('gmail')}
            className={`p-4 rounded-lg border text-center transition ${provider === 'gmail' ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400' : 'border-slate-200 hover:border-slate-300'}`}>
            <Mail className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-sm font-medium">Gmail</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Google Workspace</p>
          </button>
          <button onClick={() => selectProvider('outlook')}
            className={`p-4 rounded-lg border text-center transition ${provider === 'outlook' ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400' : 'border-slate-200 hover:border-slate-300'}`}>
            <Mail className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium">Outlook</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Microsoft 365</p>
          </button>
          <button onClick={() => selectProvider('custom')}
            className={`p-4 rounded-lg border text-center transition ${provider === 'custom' ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400' : 'border-slate-200 hover:border-slate-300'}`}>
            <Server className="w-6 h-6 mx-auto mb-2 text-slate-500" />
            <p className="text-sm font-medium">Custom SMTP</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Hostinger, SendGrid, etc.</p>
          </button>
        </div>

        {/* Gmail/Outlook help */}
        {provider === 'gmail' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Gmail Setup (30 seconds)</p>
            <ol className="text-xs text-blue-700 space-y-1.5">
              <li>1. Make sure 2-Step Verification is enabled on your Google account</li>
              <li>2. Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="underline font-medium">App Passwords</a></li>
              <li>3. Create a new app password — name it "SimaOutreach"</li>
              <li>4. Copy the 16-character password and paste it below</li>
            </ol>
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener"
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 hover:text-blue-700">
              Open App Passwords <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {provider === 'outlook' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Outlook / Microsoft 365 Setup</p>
            <ol className="text-xs text-blue-700 space-y-1.5">
              <li>1. Enable 2FA on your Microsoft account</li>
              <li>2. Go to <a href="https://account.live.com/proofs/AppPassword" target="_blank" rel="noopener" className="underline font-medium">App Passwords</a></li>
              <li>3. Create an app password and paste it below</li>
            </ol>
          </div>
        )}

        {/* Credentials */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input value={smtpFrom} onChange={e => { setSmtpFrom(e.target.value); setSmtpUser(e.target.value) }}
                placeholder="you@company.com" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {provider === 'custom' ? 'SMTP Password' : 'App Password'}
              </label>
              <input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)}
                placeholder={provider === 'custom' ? 'Password' : 'xxxx xxxx xxxx xxxx'}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input value={smtpFromName} onChange={e => setSmtpFromName(e.target.value)}
              placeholder="Your Name" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
          </div>

          {/* Custom SMTP fields */}
          {provider === 'custom' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Host</label>
                  <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
                    placeholder="smtp.example.com" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SMTP Port</label>
                  <input value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
                    placeholder="465" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">IMAP Host</label>
                  <input value={imapHost} onChange={e => setImapHost(e.target.value)}
                    placeholder="imap.example.com" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IMAP Port</label>
                  <input value={imapPort} onChange={e => setImapPort(e.target.value)}
                    placeholder="993" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${testResult.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {testResult.message}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}</>}
          </button>
          <button onClick={testConnection} disabled={testing}
            className="flex items-center gap-2 bg-white text-slate-700 px-6 py-2.5 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50">
            {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
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
