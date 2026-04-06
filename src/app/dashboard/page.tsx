'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Mail, Clock, CheckCircle, Send, AlertCircle } from 'lucide-react'
import type { Campaign } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: <Clock className="w-3 h-3" /> },
  generating: { label: 'Generating', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3 animate-spin" /> },
  ready: { label: 'Ready', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3" /> },
  sending: { label: 'Sending', color: 'bg-orange-100 text-orange-700', icon: <Send className="w-3 h-3" /> },
  sent: { label: 'Sent', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  paused: { label: 'Paused', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
}

export default function DashboardPage() {
  const { token } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/campaigns', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setCampaigns(data.campaigns || []))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-slate-600 text-sm mt-1">Manage your cold email campaigns</p>
        </div>
        <Link
          href="/dashboard/new-campaign"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No campaigns yet</h2>
          <p className="text-slate-500 text-sm mb-6">Create your first campaign to start sending AI-personalized cold emails.</p>
          <Link
            href="/dashboard/new-campaign"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => {
            const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
            return (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-200 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {campaign.total_contacts} contacts &middot; {campaign.emails_generated} generated &middot; {campaign.emails_sent} sent
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
