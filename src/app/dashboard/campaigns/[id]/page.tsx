'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Send, Check, Edit3, ChevronDown, ChevronUp, CheckCircle, Upload, Zap, BarChart3 } from 'lucide-react'
import type { Campaign, EmailSend } from '@/types'
import { scoreEmail, type EmailScore } from '@/lib/email-scorer'
import EmailScoreCard from '@/components/EmailScoreCard'
import ChatEditor from '@/components/ChatEditor'
import CampaignAnalytics from '@/components/CampaignAnalytics'

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
  const [error, setError] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(true)

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // Generate state
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<any>(null)
  const [generateProgress, setGenerateProgress] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = async () => {
    if (!token) return
    const [cData, eData] = await Promise.all([
      fetch(`/api/campaigns/${campaignId}`, { headers }).then(r => r.json()),
      fetch(`/api/campaigns/${campaignId}/emails`, { headers }).then(r => r.json()),
    ])
    setCampaign(cData.campaign)
    setEmails(eData.emails || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [token, campaignId])

  // Compute scores for all emails
  const emailScores = useMemo(() => {
    const map = new Map<number, EmailScore>()
    emails.forEach(email => {
      if (email.subject && email.body) {
        map.set(email.id, scoreEmail(
          email.subject,
          email.body,
          [email.contact_first_name, email.contact_last_name].filter(Boolean).join(' '),
          email.contact_company
        ))
      }
    })
    return map
  }, [emails])

  const allScores = useMemo(() => Array.from(emailScores.values()), [emailScores])

  const uploadCSV = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/campaigns/${campaignId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadResult(data)
      setFile(null)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const generateEmails = async () => {
    setGenerating(true)
    setError('')
    setGenerateProgress('')
    let totalGenerated = 0
    let totalFailed = 0

    try {
      // Loop: generate one email per request until done
      while (true) {
        setGenerateProgress(`Generating email ${totalGenerated + 1}...`)
        const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
          method: 'POST',
          headers,
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error)
          break
        }

        if (data.done) {
          if (data.generated === 0 && totalGenerated === 0) {
            setGenerateProgress('All contacts already have emails.')
          }
          break
        }

        if (data.generated > 0) {
          totalGenerated++
          setGenerateProgress(`Generated ${totalGenerated} emails. ${data.remaining} remaining... (${data.contact})`)
        } else {
          totalFailed++
        }
      }

      setGenerateResult({ generated: totalGenerated, failed: totalFailed })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const approveEmail = async (emailId: number) => {
    await fetch(`/api/campaigns/${campaignId}/emails/${emailId}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, status: 'approved' as const } : e))
  }

  const approveAll = async () => {
    for (const email of emails.filter(e => e.status === 'draft')) {
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

  const handleChatUpdate = (emailId: number, subject: string, body: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, subject, body } : e))
  }

  const sendAll = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, { method: 'POST', headers })
      const data = await res.json()
      setSendResult(data)
      await fetchData()
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
  const failedCount = emails.filter(e => e.status === 'failed').length
  const hasContacts = campaign.total_contacts > 0
  const hasEmails = emails.length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaign.total_contacts} contacts &middot; {emails.length} emails &middot; Mode: {campaign.mode || 'simple'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasEmails && (
            <button onClick={() => setShowAnalytics(!showAnalytics)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition border ${
                showAnalytics ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-slate-200 text-slate-600'
              }`}>
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
          )}
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Upload step */}
      {!hasContacts && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">Step 1: Upload Contacts</h2>
          <p className="text-sm text-slate-500 mb-4">CSV with First Name, Last Name, Email, Company, Title — or any CSV with an email column</p>
          <div className="mb-4">
            <label className="flex items-center gap-3 bg-slate-50 border border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-slate-100 transition">
              <Upload className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span className="text-sm text-slate-600">{file ? file.name : 'Click to select a CSV file'}</span>
              <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>
          {uploadResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {uploadResult.inserted} contacts added.
              {uploadResult.duplicatesInFile > 0 && ` ${uploadResult.duplicatesInFile} duplicates skipped.`}
              {uploadResult.invalidRows > 0 && ` ${uploadResult.invalidRows} invalid rows.`}
            </div>
          )}
          <button onClick={uploadCSV} disabled={uploading || !file}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
            {uploading ? 'Uploading...' : <><Upload className="w-4 h-4" /> Upload & Parse</>}
          </button>
        </div>
      )}

      {/* Generate step */}
      {hasContacts && !hasEmails && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">Step 2: Generate Personalized Emails</h2>
          <p className="text-sm text-slate-500 mb-4">
            AI will research {campaign.total_contacts} contacts and write unique emails.
            {campaign.mode === 'deep' ? ' Deep mode: ~30s per email.' : ' Simple mode: ~10s per email.'}
          </p>
          {generateResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Generated {generateResult.generated} emails. {generateResult.failed > 0 ? `${generateResult.failed} failed.` : ''}
            </div>
          )}
          {generating && generateProgress && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
              {generateProgress}
            </div>
          )}
          <button onClick={generateEmails} disabled={generating}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50">
            {generating ? <><Zap className="w-4 h-4 animate-pulse" /> Generating...</> : <><Zap className="w-4 h-4" /> Generate {campaign.total_contacts} Emails</>}
          </button>
        </div>
      )}

      {/* Analytics */}
      {hasEmails && showAnalytics && allScores.length > 0 && (
        <CampaignAnalytics
          scores={allScores}
          totalContacts={campaign.total_contacts}
          emailsGenerated={campaign.emails_generated}
          emailsSent={campaign.emails_sent}
          emailsApproved={campaign.emails_approved}
        />
      )}

      {/* Stats bar */}
      {hasEmails && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Draft', count: draftCount, color: 'bg-slate-100 text-slate-700' },
              { label: 'Approved', count: approvedCount, color: 'bg-blue-100 text-blue-700' },
              { label: 'Sent', count: sentCount, color: 'bg-green-100 text-green-700' },
              { label: 'Failed', count: failedCount, color: 'bg-red-100 text-red-700' },
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
          <div className="space-y-3">
            {emails.map(email => {
              const score = emailScores.get(email.id)
              return (
                <div key={email.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                    className="w-full p-4 text-left hover:bg-slate-50/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            email.status === 'sent' ? 'bg-green-500' :
                            email.status === 'approved' ? 'bg-blue-500' :
                            email.status === 'failed' ? 'bg-red-500' : 'bg-slate-300'
                          }`} />
                          <p className="text-sm font-medium truncate">{email.contact_first_name} {email.contact_last_name}</p>
                          <span className="text-xs text-slate-400">{email.contact_company}</span>
                          {score && (
                            <span className={`ml-auto flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              score.overall >= 75 ? 'bg-green-100 text-green-700' :
                              score.overall >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {score.overall}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{email.subject}</p>
                      </div>
                      {expandedId === email.id ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
                    </div>
                  </button>

                  {expandedId === email.id && (
                    <div className="border-t border-slate-100 p-4">
                      {editingId === email.id ? (
                        <div className="space-y-3">
                          <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Subject" />
                          <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                            rows={8} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(email.id)} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-slate-600 px-4 py-1.5 rounded-lg text-sm">Cancel</button>
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

                          {/* Score Card */}
                          {score && <EmailScoreCard score={score} />}

                          {/* Chat Editor */}
                          {email.status === 'draft' && token && (
                            <ChatEditor
                              emailId={email.id}
                              campaignId={campaignId}
                              token={token}
                              onUpdate={(s, b) => handleChatUpdate(email.id, s, b)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
