'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import type { EmailScore } from '@/lib/email-scorer'

function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    'bg-red-100 text-red-700 border-red-200'
  const sizeClass = size === 'lg' ? 'w-10 h-10 text-sm font-bold' : 'w-7 h-7 text-xs font-semibold'
  return (
    <div className={`${color} ${sizeClass} rounded-full border flex items-center justify-center`}>
      {score}
    </div>
  )
}

function Pill({ label, value, variant }: { label: string; value: string; variant: 'green' | 'yellow' | 'red' | 'neutral' }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[variant]}`}>
      {label}: {value}
    </span>
  )
}

export default function EmailScoreCard({ score }: { score: EmailScore }) {
  const [showTips, setShowTips] = useState(false)

  const allTips = [
    ...score.personalization.tips,
    ...score.subjectLine.tips,
    ...score.spamRisk.triggers.map(t => `Spam trigger: ${t}`),
  ].filter(Boolean)

  const spamVariant = score.spamRisk.level === 'Low' ? 'green' : score.spamRisk.level === 'Medium' ? 'yellow' : 'red'
  const readVariant = score.readability.grade === 'Ideal' ? 'green' : score.readability.grade === 'Concise' ? 'green' : score.readability.grade === 'Long' ? 'yellow' : 'red'
  const ctaVariant = score.ctaClarity.hasCta ? (score.ctaClarity.score >= 75 ? 'green' : 'yellow') : 'red'

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ScoreBadge score={score.overall} size="lg" />
        <Pill label="Personal" value={`${score.personalization.score}`} variant={score.personalization.score >= 60 ? 'green' : score.personalization.score >= 30 ? 'yellow' : 'red'} />
        <Pill label="Spam" value={score.spamRisk.level} variant={spamVariant} />
        <Pill label="CTA" value={score.ctaClarity.hasCta ? score.ctaClarity.ctaType : 'None'} variant={ctaVariant} />
        <Pill label="Length" value={score.readability.grade} variant={readVariant} />
        <Pill label="Subject" value={`${score.subjectLine.score}`} variant={score.subjectLine.score >= 60 ? 'green' : score.subjectLine.score >= 40 ? 'yellow' : 'red'} />

        {allTips.length > 0 && (
          <button
            onClick={() => setShowTips(!showTips)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-orange-600 hover:text-orange-700 font-medium"
          >
            <Lightbulb className="w-3 h-3" />
            {allTips.length} tips
            {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showTips && allTips.length > 0 && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <ul className="space-y-1">
            {allTips.map((tip, i) => (
              <li key={i} className="text-xs text-orange-800 flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
