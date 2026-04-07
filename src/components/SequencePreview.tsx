'use client'

import { Circle, CheckCircle, Clock, MessageSquare } from 'lucide-react'

interface Props {
  initialSubject: string
  status: string
  sentAt?: string
  followupDay3?: boolean
  followupDay7?: boolean
}

function StepDot({ state }: { state: 'pending' | 'scheduled' | 'sent' | 'skipped' }) {
  if (state === 'sent') return <CheckCircle className="w-4 h-4 text-green-500" />
  if (state === 'scheduled') return <Clock className="w-4 h-4 text-blue-500" />
  if (state === 'skipped') return <MessageSquare className="w-4 h-4 text-yellow-500" />
  return <Circle className="w-4 h-4 text-slate-300" />
}

export default function SequencePreview({ initialSubject, status, sentAt, followupDay3 = true, followupDay7 = true }: Props) {
  const initialState = status === 'sent' ? 'sent' : status === 'approved' ? 'scheduled' : 'pending'
  const f1State = status === 'sent' ? 'scheduled' : 'pending'
  const f2State = status === 'sent' ? 'scheduled' : 'pending'

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Planned Sequence</p>

      <div className="space-y-0">
        {/* Day 0 */}
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <StepDot state={initialState} />
            {(followupDay3 || followupDay7) && <div className="w-px h-6 bg-slate-200 mt-0.5" />}
          </div>
          <div className="pb-2">
            <p className="text-xs font-medium text-slate-700">Day 0: Initial email</p>
            <p className="text-[11px] text-slate-500 truncate max-w-xs">{initialSubject}</p>
            {sentAt && <p className="text-[10px] text-slate-400">Sent {new Date(sentAt).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Day 3 */}
        {followupDay3 && (
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center">
              <StepDot state={f1State} />
              {followupDay7 && <div className="w-px h-6 bg-slate-200 mt-0.5" />}
            </div>
            <div className="pb-2">
              <p className="text-xs font-medium text-slate-700">Day 3: Follow-up 1</p>
              <p className="text-[11px] text-slate-500">New angle, different value point</p>
            </div>
          </div>
        )}

        {/* Day 7 */}
        {followupDay7 && (
          <div className="flex items-start gap-2">
            <StepDot state={f2State} />
            <div>
              <p className="text-xs font-medium text-slate-700">Day 7: Follow-up 2</p>
              <p className="text-[11px] text-slate-500">Final touch — demo or graceful close</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
