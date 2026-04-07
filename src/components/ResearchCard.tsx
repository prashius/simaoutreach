'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

interface Props {
  contactName: string
  company: string
  researchData: string | null
  hookType?: string
  firstDraftScore?: number
  finalScore?: number
  autoRevised?: boolean
}

const HOOK_LABELS: Record<string, { label: string; color: string }> = {
  funding: { label: 'Funding', color: 'bg-green-100 text-green-700' },
  product_launch: { label: 'Product Launch', color: 'bg-blue-100 text-blue-700' },
  growth: { label: 'Growth', color: 'bg-purple-100 text-purple-700' },
  person_quote: { label: 'Professional Voice', color: 'bg-amber-100 text-amber-700' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-600' },
}

function countResearchFacts(text: string): number {
  let count = 0
  if (/\$[\d,.]+/i.test(text)) count++
  if (/\d+%/i.test(text)) count++
  if (/\b20[12]\d\b/.test(text)) count++
  if (/\d+\+?\s*(employees|customers|users|countries)/i.test(text)) count++
  if (/series [a-d]|seed|pre-seed/i.test(text)) count++
  if (/\b(launched|acquired|partnered|raised|expanded)\b/i.test(text)) count++
  return count
}

function getResearchQuality(factCount: number): { label: string; color: string } {
  if (factCount >= 4) return { label: 'Strong', color: 'text-green-600' }
  if (factCount >= 2) return { label: 'Moderate', color: 'text-yellow-600' }
  if (factCount >= 1) return { label: 'Limited', color: 'text-orange-600' }
  return { label: 'Minimal', color: 'text-red-500' }
}

export default function ResearchCard({ contactName, company, researchData, hookType, firstDraftScore, finalScore, autoRevised }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Parse research
  let researchText = ''
  if (researchData) {
    try {
      const parsed = typeof researchData === 'string' ? JSON.parse(researchData) : researchData
      researchText = parsed.company || parsed.person || JSON.stringify(parsed)
    } catch {
      researchText = researchData
    }
  }

  if (!researchText) return null

  const factCount = countResearchFacts(researchText)
  const quality = getResearchQuality(factCount)
  const hookConfig = HOOK_LABELS[hookType || 'general'] || HOOK_LABELS.general

  // Split into bullet points (by sentence)
  const bullets = researchText
    .split(/(?<=[.!?])\s+/)
    .filter((s: string) => s.trim().length > 10)
    .slice(0, 6)

  return (
    <div className="bg-blue-50/40 border border-blue-100 rounded-lg overflow-hidden mb-3">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-blue-50/60 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-blue-800">Research: {company}</span>
          <span className={`text-[10px] font-medium ${quality.color}`}>
            {quality.label} ({factCount} facts)
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${hookConfig.color}`}>
            {hookConfig.label}
          </span>
          {autoRevised && firstDraftScore != null && finalScore != null && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-slate-400">{firstDraftScore}</span>
              <span className="text-slate-300">→</span>
              <span className="text-green-600 font-medium">{finalScore}</span>
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-blue-100/50">
          <ul className="space-y-1 mt-2">
            {bullets.map((bullet: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                <span>{bullet.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
