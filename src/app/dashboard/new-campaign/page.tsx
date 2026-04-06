'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Upload, Zap, ArrowRight } from 'lucide-react'

export default function NewCampaignPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Campaign details
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'simple' | 'deep'>('simple')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [callToAction, setCallToAction] = useState('Would you be open to a quick 15-minute call?')

  // Step 2: CSV upload
  const [campaignId, setCampaignId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const createCampaign = async () => {
    if (!name.trim() || !productDescription.trim()) {
      setError('Campaign name and product description are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, mode, senderName, senderEmail, productDescription, callToAction }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCampaignId(data.campaign.id)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const uploadCSV = async () => {
    if (!file) { setError('Select a CSV file'); return }
    setLoading(true)
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
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const startGeneration = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/dashboard/campaigns/${campaignId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">New Campaign</h1>
      <p className="text-slate-600 text-sm mb-8">Upload prospects, configure your pitch, let AI do the rest.</p>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-orange-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Step 1: Campaign details */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campaign Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. SaaS Founders Outreach"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Generation Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMode('simple')}
                className={`p-3 rounded-lg border text-sm text-left ${mode === 'simple' ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}>
                <p className="font-medium">Simple</p>
                <p className="text-xs text-slate-500 mt-1">1 research call. Fast (~10s/email)</p>
              </button>
              <button onClick={() => setMode('deep')}
                className={`p-3 rounded-lg border text-sm text-left ${mode === 'deep' ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}>
                <p className="font-medium">Deep</p>
                <p className="text-xs text-slate-500 mt-1">3 research calls. Better quality (~30s/email)</p>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input value={senderName} onChange={e => setSenderName(e.target.value)}
                placeholder="Prashant" className="w-full p-3 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Email</label>
              <input value={senderEmail} onChange={e => setSenderEmail(e.target.value)}
                placeholder="you@company.com" className="w-full p-3 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">What are you selling? (Product Description)</label>
            <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)}
              placeholder="e.g. Compose is an AI layer inside Gmail that triages your inbox overnight..."
              rows={3} className="w-full p-3 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Call to Action</label>
            <input value={callToAction} onChange={e => setCallToAction(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-sm" />
          </div>
          <button onClick={createCampaign} disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Creating...' : <>Next: Upload Contacts <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {/* Step 2: Upload CSV */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upload Contact CSV</label>
            <p className="text-xs text-slate-500 mb-3">Required columns: email. Optional: first_name, last_name, company_name, title</p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)}
                className="text-sm" />
            </div>
          </div>
          {file && (
            <p className="text-sm text-slate-600">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          )}
          <button onClick={uploadCSV} disabled={loading || !file}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Uploading...' : <>Upload & Parse <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}

      {/* Step 3: Confirm & Generate */}
      {step === 3 && uploadResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Upload Summary</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-700 font-medium">{uploadResult.inserted} contacts added</p>
            </div>
            {uploadResult.duplicatesInFile > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-yellow-700">{uploadResult.duplicatesInFile} duplicates skipped</p>
              </div>
            )}
            {uploadResult.invalidRows > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-red-700">{uploadResult.invalidRows} invalid rows</p>
              </div>
            )}
            {uploadResult.excludedEmails > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-slate-700">{uploadResult.excludedEmails} excluded</p>
              </div>
            )}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-800">
              Ready to generate {uploadResult.inserted} personalized emails using {mode} mode.
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {mode === 'simple' ? 'Estimated time: ~' + Math.ceil(uploadResult.inserted * 10 / 60) + ' minutes' :
                'Estimated time: ~' + Math.ceil(uploadResult.inserted * 30 / 60) + ' minutes'}
            </p>
          </div>

          <button onClick={startGeneration} disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? (
              <><Zap className="w-4 h-4 animate-pulse" /> Generating emails...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate All Emails</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
