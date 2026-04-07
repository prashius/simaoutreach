'use client'

import { CheckCircle, AlertTriangle, XCircle, Send, TrendingUp } from 'lucide-react'
import type { EmailScore } from '@/lib/email-scorer'

interface Props {
  score: EmailScore
  hookType?: string
  autoRevised?: boolean
  firstDraftScore?: number
}

function getVerdict(score: number): { label: string; color: string; bgColor: string; icon: React.ReactNode; replyEstimate: string } {
  if (score >= 80) return {
    label: 'SEND READY',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    replyEstimate: '8–14%',
  }
  if (score >= 65) return {
    label: 'GOOD TO SEND',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <Send className="w-5 h-5 text-blue-600" />,
    replyEstimate: '5–9%',
  }
  if (score >= 50) return {
    label: 'REVIEW RECOMMENDED',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    replyEstimate: '2–5%',
  }
  return {
    label: 'NEEDS IMPROVEMENT',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    replyEstimate: '<2%',
  }
}

function getHookStrength(hookType?: string): { label: string; color: string } {
  if (hookType === 'funding') return { label: 'Strong', color: 'text-green-600' }
  if (hookType === 'product_launch') return { label: 'Strong', color: 'text-green-600' }
  if (hookType === 'growth') return { label: 'Moderate', color: 'text-blue-600' }
  if (hookType === 'person_quote') return { label: 'Strong', color: 'text-green-600' }
  return { label: 'Weak', color: 'text-yellow-600' }
}

export default function VerdictCard({ score, hookType, autoRevised, firstDraftScore }: Props) {
  const verdict = getVerdict(score.overall)
  const hookStrength = getHookStrength(hookType)

  return (
    <div className={`rounded-lg border p-4 mt-3 ${verdict.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {verdict.icon}
          <span className={`text-sm font-bold tracking-wide ${verdict.color}`}>{verdict.label}</span>
        </div>
        <span className={`text-2xl font-bold ${verdict.color}`}>{score.overall}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Expected replies</p>
          <p className={`text-sm font-semibold ${verdict.color}`}>{verdict.replyEstimate}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Hook strength</p>
          <p className={`text-sm font-semibold ${hookStrength.color}`}>{hookStrength.label}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Risk level</p>
          <p className={`text-sm font-semibold ${score.spamRisk.level === 'Low' ? 'text-green-600' : score.spamRisk.level === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
            {score.spamRisk.level}
          </p>
        </div>
      </div>

      {autoRevised && firstDraftScore != null && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs text-slate-600">
            Auto-improved: <span className="text-slate-400">{firstDraftScore}</span>
            <span className="text-slate-300 mx-1">→</span>
            <span className="font-semibold text-green-600">{score.overall}</span>
            <span className="text-slate-400 ml-1">(+{score.overall - firstDraftScore} points)</span>
          </span>
        </div>
      )}
    </div>
  )
}
