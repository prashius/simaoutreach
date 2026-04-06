'use client'

import { useState } from 'react'
import { Send, Loader2, Wand2, AlertCircle } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

interface Props {
  emailId: number
  campaignId: string
  token: string
  onUpdate: (subject: string, body: string) => void
}

export default function ChatEditor({ emailId, campaignId, token, onUpdate }: Props) {
  const [instruction, setInstruction] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [scope, setScope] = useState<'single' | 'all'>('single')
  const [refinementsUsed, setRefinementsUsed] = useState<number | null>(null)
  const [refinementsLimit, setRefinementsLimit] = useState(30)
  const [limitReached, setLimitReached] = useState(false)

  const handleSubmit = async () => {
    if (!instruction.trim() || loading || limitReached) return

    const userMsg = instruction.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInstruction('')
    setLoading(true)

    try {
      if (scope === 'single') {
        const res = await fetch(`/api/campaigns/${campaignId}/emails/${emailId}/refine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ instruction: userMsg }),
        })
        const data = await res.json()
        if (res.status === 429) {
          setLimitReached(true)
          setMessages(prev => [...prev, { role: 'ai', text: data.error }])
          return
        }
        if (!res.ok) throw new Error(data.error)

        if (data.refinementsUsed != null) {
          setRefinementsUsed(data.refinementsUsed)
          setRefinementsLimit(data.refinementsLimit)
        }

        setMessages(prev => [...prev, {
          role: 'ai',
          text: `Updated subject: "${data.subject}"\n\nPreview: ${data.body.slice(0, 120)}...`
        }])
        onUpdate(data.subject, data.body)
      } else {
        const res = await fetch(`/api/campaigns/${campaignId}/refine-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ instruction: userMsg }),
        })
        const data = await res.json()
        if (res.status === 429) {
          setLimitReached(true)
          setMessages(prev => [...prev, { role: 'ai', text: data.error }])
          return
        }
        if (!res.ok) throw new Error(data.error)

        if (data.refinementsUsed != null) {
          setRefinementsUsed(data.refinementsUsed)
          setRefinementsLimit(data.refinementsLimit)
        }

        setMessages(prev => [...prev, {
          role: 'ai',
          text: `Applied to ${data.updated}/${data.total} emails.${data.failed > 0 ? ` ${data.failed} failed.` : ''}`
        }])
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Error: ${err instanceof Error ? err.message : 'Failed to refine'}`
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-semibold text-slate-700">AI Editor</span>
          {refinementsUsed != null && (
            <span className="text-[10px] text-slate-400">{refinementsUsed}/{refinementsLimit} refinements used</span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-full p-0.5">
          <button onClick={() => setScope('single')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${scope === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            This email
          </button>
          <button onClick={() => setScope('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            All drafts
          </button>
        </div>
      </div>

      {/* Limit reached banner */}
      {limitReached && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs text-amber-700">Refinement limit reached. Upgrade your plan or try again tomorrow.</span>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-3 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 p-3 bg-white border-t border-slate-100">
        <input
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder={limitReached ? 'Refinement limit reached'
            : scope === 'single' ? "e.g. 'make it shorter', 'add their funding round'"
            : "e.g. 'make all emails more casual', 'remove product pitch'"
          }
          className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          disabled={loading || limitReached}
        />
        <button
          onClick={handleSubmit}
          disabled={!instruction.trim() || loading || limitReached}
          className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
