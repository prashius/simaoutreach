'use client'

import { CheckCircle, XCircle, Search, Zap, BarChart3, RefreshCw, AlertCircle, Clock } from 'lucide-react'

export interface StudioEntry {
  contactName: string
  company: string
  status: 'pending' | 'researching' | 'writing' | 'scoring' | 'revising' | 'done' | 'failed'
  researchSummary?: string
  researchFactCount?: number
  hookType?: string
  firstDraftScore?: number
  finalScore?: number
  autoRevised?: boolean
  error?: string
}

interface Props {
  entries: StudioEntry[]
  totalContacts: number
  completedCount: number
  averageScore: number
  autoRevisedCount: number
}

const HOOK_COLORS: Record<string, string> = {
  funding: 'bg-green-100 text-green-700',
  product_launch: 'bg-blue-100 text-blue-700',
  growth: 'bg-purple-100 text-purple-700',
  person_quote: 'bg-amber-100 text-amber-700',
  general: 'bg-slate-100 text-slate-600',
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  pending: { icon: <Clock className="w-4 h-4 text-slate-300" />, label: 'Waiting', color: 'text-slate-400' },
  researching: { icon: <Search className="w-4 h-4 text-blue-500 animate-pulse" />, label: 'Researching...', color: 'text-blue-600' },
  writing: { icon: <Zap className="w-4 h-4 text-orange-500 animate-pulse" />, label: 'Writing draft...', color: 'text-orange-600' },
  scoring: { icon: <BarChart3 className="w-4 h-4 text-yellow-500 animate-pulse" />, label: 'Scoring...', color: 'text-yellow-600' },
  revising: { icon: <RefreshCw className="w-4 h-4 text-green-500 animate-spin" />, label: 'Auto-revising...', color: 'text-green-600' },
  done: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: 'Done', color: 'text-green-600' },
  failed: { icon: <XCircle className="w-4 h-4 text-red-500" />, label: 'Failed', color: 'text-red-600' },
}

export default function StudioProgress({ entries, totalContacts, completedCount, averageScore, autoRevisedCount }: Props) {
  const progress = totalContacts > 0 ? (completedCount / totalContacts) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">Production Studio</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span><strong className="text-slate-700">{completedCount}</strong>/{totalContacts} produced</span>
            {completedCount > 0 && (
              <>
                <span>Avg score: <strong className={averageScore >= 75 ? 'text-green-600' : averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'}>{averageScore}</strong></span>
                {autoRevisedCount > 0 && <span><strong className="text-green-600">{autoRevisedCount}</strong> auto-revised</span>}
              </>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
        {entries.map((entry, i) => {
          const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending
          return (
            <div key={i} className={`px-5 py-3 flex items-center gap-3 ${entry.status === 'pending' ? 'opacity-50' : ''}`}>
              {/* Status icon */}
              <div className="flex-shrink-0">{config.icon}</div>

              {/* Contact info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800 truncate">{entry.contactName}</p>
                  <span className="text-xs text-slate-400">{entry.company}</span>
                </div>
                {entry.status === 'done' && entry.researchSummary && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {entry.researchFactCount || 0} facts found
                  </p>
                )}
                {entry.status === 'failed' && entry.error && (
                  <p className="text-xs text-red-500 truncate mt-0.5">{entry.error}</p>
                )}
                {['researching', 'writing', 'scoring', 'revising'].includes(entry.status) && (
                  <p className={`text-xs mt-0.5 ${config.color}`}>{config.label}</p>
                )}
              </div>

              {/* Score + hook badges */}
              {entry.status === 'done' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.hookType && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${HOOK_COLORS[entry.hookType] || HOOK_COLORS.general}`}>
                      {entry.hookType.replace('_', ' ')}
                    </span>
                  )}
                  {entry.autoRevised && entry.firstDraftScore != null && entry.finalScore != null ? (
                    <span className="text-xs font-medium">
                      <span className="text-red-400">{entry.firstDraftScore}</span>
                      <span className="text-slate-300 mx-0.5">→</span>
                      <span className="text-green-600">{entry.finalScore}</span>
                    </span>
                  ) : entry.finalScore != null ? (
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      entry.finalScore >= 75 ? 'bg-green-100 text-green-700' :
                      entry.finalScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {entry.finalScore}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
