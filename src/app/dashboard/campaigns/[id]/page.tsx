'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Send, Check, Edit3, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import type { Campaign, EmailSend } from '@/types'

export default function CampaignDetailPage() {
  const { token } = useAuth()
  const params = useParams()
  const campaignId = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [emails, setEmails] = useState<EmailSend[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch(`/api/campaigns/${campaignId}`, { headers }).then(r => r.json()),
      fetch(`/api/campaigns/${campaignId}/emails`, { headers }).then(r => r.json()),
    ]).then(([cData, eData]) => {
      setCampaign(cData.campaign)
      setEmails(eData.emails || [])
    }).finally(() => setLoading(false))
  }, [token, campaignId])

  const approveEmail = async (emailId: number) => {
    await fetch(`/api/campaigns/${campaignId}/emails/${emailId}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, status: 'approved' } : e))
  }

  const approveAll = async () => {
    const drafts = emails.filter(e => e.status === 'draft')
    for (const email of drafts) {
      await approveEmail(email.id)
    }
  }

  const saveEdit = async (emailId: number) => {
    await fetch(`/api/campaigns/${campaignId}/emails/${emailId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: editSubject, body: editBody }),
    })
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, subject: editSubject, body: editBody, edited_by_user: true } : e))
    setEditingId(null)
  }

  const sendAll = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers,
      })
      const data = await res.json()
      setSendResult(data)
      // Refresh
      const eRes = await fetch(`/api/campaigns/${campaignId}/emails`, { headers })
      const eData = await eRes.json()
      setEmails(eData.emails || [])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" /></div>
  }

  if (!campaign) return <p>Campaign not found</p>

  const draftCount = emails.filter(e => e.status === 'draft').length
  const approvedCount = emails.filter(e => e.status === 'approved').length
  const sentCount = emails.filter(e => e.status === 'sent').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign.total_contacts} contacts &middot; {emails.length} emails generated
          </p>
        </div>
        <div className="flex gap-2">
          {draftCount > 0 && (
            <button onClick={approveAll}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition">
              <CheckCircle className="w-4 h-4" /> Approve All ({draftCount})
            </button>
          )}
          {approvedCount > 0 && (
            <button onClick={sendAll} disabled={sending}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50">
              <Send className="w-4 h-4" /> {sending ? 'Sending...' : `Send ${approvedCount} Emails`}
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Draft', count: draftCount, color: 'bg-slate-100 text-slate-700' },
          { label: 'Approved', count: approvedCount, color: 'bg-blue-100 text-blue-700' },
          { label: 'Sent', count: sentCount, color: 'bg-green-100 text-green-700' },
          { label: 'Failed', count: emails.filter(e => e.status === 'failed').length, color: 'bg-red-100 text-red-700' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} rounded-lg p-3 text-center`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {sendResult && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Sent {sendResult.sent} emails. {sendResult.failed > 0 ? `${sendResult.failed} failed.` : ''}
        </div>
      )}

      {/* Email list */}
      <div className="space-y-2">
        {emails.map(email => (
          <div key={email.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    email.status === 'sent' ? 'bg-green-500' :
                    email.status === 'approved' ? 'bg-blue-500' :
                    email.status === 'failed' ? 'bg-red-500' : 'bg-slate-300'
                  }`} />
                  <p className="text-sm font-medium truncate">{email.contact_first_name} {email.contact_last_name}</p>
                  <span className="text-xs text-slate-400">{email.contact_company}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{email.subject}</p>
              </div>
              {expandedId === email.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {expandedId === email.id && (
              <div className="border-t border-slate-100 p-4">
                {editingId === email.id ? (
                  <div className="space-y-3">
                    <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                    <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                      rows={8} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(email.id)}
                        className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="text-slate-600 px-4 py-1.5 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">To: {email.contact_email}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(email.id); setEditSubject(email.subject || ''); setEditBody(email.body || '') }}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        {email.status === 'draft' && (
                          <button onClick={() => approveEmail(email.id)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2">Subject: {email.subject}</p>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                      {email.body}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
