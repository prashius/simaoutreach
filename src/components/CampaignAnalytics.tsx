'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import type { EmailScore } from '@/lib/email-scorer'

interface Props {
  scores: EmailScore[]
  totalContacts: number
  emailsGenerated: number
  emailsSent: number
  emailsApproved: number
}

function HealthRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Health</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color}`} />
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  )
}

export default function CampaignAnalytics({ scores, totalContacts, emailsGenerated, emailsSent, emailsApproved }: Props) {
  const analytics = useMemo(() => {
    if (scores.length === 0) return null

    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)

    const avgOverall = avg(scores.map(s => s.overall))
    const avgPersonalization = avg(scores.map(s => s.personalization.score))
    const avgSpamSafety = avg(scores.map(s => 100 - s.spamRisk.score))
    const avgReadability = avg(scores.map(s => s.readability.score))
    const avgCta = avg(scores.map(s => s.ctaClarity.score))
    const avgSubject = avg(scores.map(s => s.subjectLine.score))

    // Score distribution
    const distribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ]
    scores.forEach(s => {
      if (s.overall <= 20) distribution[0].count++
      else if (s.overall <= 40) distribution[1].count++
      else if (s.overall <= 60) distribution[2].count++
      else if (s.overall <= 80) distribution[3].count++
      else distribution[4].count++
    })

    // Radar data
    const radarData = [
      { dimension: 'Personalization', score: avgPersonalization },
      { dimension: 'Spam Safety', score: avgSpamSafety },
      { dimension: 'Readability', score: avgReadability },
      { dimension: 'CTA Clarity', score: avgCta },
      { dimension: 'Subject Line', score: avgSubject },
    ]

    // Top issues (aggregate tips)
    const tipCounts: Record<string, number> = {}
    scores.forEach(s => {
      [...s.personalization.tips, ...s.subjectLine.tips].forEach(tip => {
        tipCounts[tip] = (tipCounts[tip] || 0) + 1
      })
      s.spamRisk.triggers.forEach(t => {
        tipCounts[`Spam trigger: ${t}`] = (tipCounts[`Spam trigger: ${t}`] || 0) + 1
      })
    })
    const topIssues = Object.entries(tipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Weakest emails
    const weakest = [...scores]
      .sort((a, b) => a.overall - b.overall)
      .slice(0, 3)

    return {
      avgOverall, avgPersonalization, avgSpamSafety, avgReadability, avgCta, avgSubject,
      distribution, radarData, topIssues, weakest,
    }
  }, [scores])

  if (!analytics || scores.length === 0) {
    return null
  }

  const barColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']

  return (
    <div className="space-y-6 mb-8">
      {/* Top row: Health + Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-center">
          <HealthRing score={analytics.avgOverall} />
        </div>
        <div className="col-span-4 grid grid-cols-4 gap-4">
          <StatCard label="Avg Personalization" value={analytics.avgPersonalization}
            color={analytics.avgPersonalization >= 60 ? 'bg-green-500' : analytics.avgPersonalization >= 30 ? 'bg-yellow-500' : 'bg-red-500'} />
          <StatCard label="Avg Spam Safety" value={analytics.avgSpamSafety}
            color={analytics.avgSpamSafety >= 70 ? 'bg-green-500' : analytics.avgSpamSafety >= 40 ? 'bg-yellow-500' : 'bg-red-500'} />
          <StatCard label="Avg Readability" value={analytics.avgReadability}
            color={analytics.avgReadability >= 70 ? 'bg-green-500' : analytics.avgReadability >= 50 ? 'bg-yellow-500' : 'bg-red-500'} />
          <StatCard label="Avg CTA Clarity" value={analytics.avgCta}
            color={analytics.avgCta >= 60 ? 'bg-green-500' : analytics.avgCta >= 30 ? 'bg-yellow-500' : 'bg-red-500'} />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Score Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.distribution} barSize={32}>
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                cursor={{ fill: '#f8fafc' }}
              />
              {analytics.distribution.map((_, i) => (
                <Bar key={i} dataKey="count" fill={barColors[i] || '#f97316'} radius={[4, 4, 0, 0]} />
              ))}
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {analytics.distribution.map((entry, i) => {
                  const fill = barColors[i] || '#f97316'
                  return <rect key={i} fill={fill} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Dimension Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={analytics.radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Radar dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Issues */}
      {analytics.topIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Issues Across Campaign</h3>
          <div className="space-y-2">
            {analytics.topIssues.map(([tip, count], i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-6 bg-orange-100 text-orange-700 text-xs font-bold rounded flex items-center justify-center">
                  {count}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${Math.min((count / scores.length) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0 max-w-[60%] truncate">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
