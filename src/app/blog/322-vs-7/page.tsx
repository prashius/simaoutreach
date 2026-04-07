'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

export default function CostComparison() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><Zap className="w-6 h-6 text-orange-500" /><span className="font-bold">SimaOutreach</span></Link>
          <Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900">← All posts</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-sm text-slate-400 mb-4">April 2026</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">The Real Cost of 50 Cold Emails: $322 vs $7</h1>

        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-6">
          <p>Cold email tools love to advertise their monthly price. &quot;Just $47/month!&quot; &quot;$39/month for unlimited sending!&quot; What they don&apos;t tell you is that <strong>the tool is the cheapest part of cold email</strong>. Your time is the expensive part.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Let&apos;s Do the Math</h2>
          <p>You want to send 50 personalized cold emails using a traditional tool like Instantly or Lemlist. Here&apos;s what it actually costs:</p>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 my-6">
            <h3 className="font-semibold mb-4">Traditional approach: 50 emails</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Tool subscription (Instantly/Lemlist)</span><span className="font-bold">$47/mo</span></div>
              <div className="flex justify-between"><span>Research each prospect: 3 min × 50 = 2.5 hours at $50/hr</span><span className="font-bold">$125</span></div>
              <div className="flex justify-between"><span>Write each email: 3 min × 50 = 2.5 hours at $50/hr</span><span className="font-bold">$125</span></div>
              <div className="flex justify-between"><span>Personalize subject lines: 30 min at $50/hr</span><span className="font-bold">$25</span></div>
              <div className="flex justify-between border-t pt-3 font-bold text-base"><span>Total real cost</span><span className="text-red-600">$322</span></div>
            </div>
          </div>

          <p>That&apos;s <strong>$6.44 per email</strong>. For what? A template with their name swapped in.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">What $7 Gets You with SimaOutreach</h2>
          <p>For $7, SimaOutreach handles all of it:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Live web research per prospect</strong> — AI searches the web for each person&apos;s company. Recent funding, product launches, growth signals. Not stale database data. Real-time.</li>
            <li><strong>Unique email per prospect</strong> — not a template. Each email references specific facts about their company. Different hook, different subject line, different angle.</li>
            <li><strong>5-dimension scoring</strong> — every email is scored on personalization, spam risk, readability, CTA clarity, and subject line quality before you see it.</li>
            <li><strong>Auto-revision</strong> — if an email scores below 75/100, AI automatically rewrites it. You see the before and after.</li>
            <li><strong>Smart follow-ups</strong> — Day 3 and Day 7 follow-ups are generated automatically, threaded correctly, with different angles each time.</li>
          </ul>

          <p>Total cost: <strong>$7</strong>. Total time: <strong>upload a CSV and wait 5 minutes</strong>.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">The Hidden Cost: Your Time</h2>
          <p>If your time is worth $50/hr (conservative for a founder or sales leader), then 5 hours of email work costs $250. That&apos;s before the tool subscription.</p>
          <p>SimaOutreach eliminates the 5 hours entirely. Upload your list, AI produces the emails, you review and send. The math isn&apos;t close.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Why Per-Email Pricing Beats Subscriptions</h2>
          <p>Traditional tools charge $39-79/month whether you send 10 emails or 10,000. If you run one campaign a month with 50 emails, you&apos;re paying $47 for infrastructure you barely use.</p>
          <p>SimaOutreach charges per campaign. Send 50 emails: $7. Don&apos;t send anything next month: $0. Scale to 2000 emails: $99. You pay for what you use, not for a seat you forget to cancel.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Side by Side: Template vs. AI-Researched</h2>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-2">TEMPLATE (Instantly)</p>
              <p className="text-sm text-slate-700">&quot;Hi {'{first_name}'}, I saw that {'{company}'} is growing fast. We help companies like yours with...&quot;</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-xs font-bold text-orange-600 mb-2">AI-RESEARCHED (SimaOutreach)</p>
              <p className="text-sm text-slate-700">&quot;Hi Nwamaka, Juicyway processing $1B+ in cross-border payments since 2021 with 60+ people means your inbox is a warzone of operational and strategic threads...&quot;</p>
            </div>
          </div>
          <p>One of these gets replies. The other gets deleted.</p>
        </div>

        <div className="mt-12 p-8 bg-orange-50 border border-orange-200 rounded-xl text-center">
          <h3 className="text-lg font-bold mb-2">Start with 5 free emails. See the difference.</h3>
          <p className="text-sm text-slate-600 mb-4">No credit card. No subscription. Just upload a CSV.</p>
          <Link href="/dashboard/new-campaign" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition text-sm">
            Try Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </article>
    </div>
  )
}
