'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

export default function AntiCreepGuide() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            <span className="font-bold">SimaOutreach</span>
          </Link>
          <Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900">← All posts</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-sm text-slate-400 mb-4">April 2026</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
          The Anti-Creep Cold Email Guide: Personalization That Gets Replies, Not Restraining Orders
        </h1>

        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-6">
          <p>There&apos;s a fine line between &quot;this person did their research&quot; and &quot;this person has been watching me.&quot; Most cold email advice ignores this line entirely. They tell you to personalize everything — reference their LinkedIn posts, mention their career moves, comment on their interests. The result? Emails that feel like surveillance reports.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">The Conference Test</h2>
          <p>Here&apos;s the simplest framework for cold email personalization: <strong>Would you say this to someone you just met at a professional conference?</strong></p>
          <p>At a conference, you might say: &quot;I saw Juicyway just crossed $1B in processed payments — impressive scale for cross-border in Africa.&quot; That&apos;s professional awareness. You read an article. Normal.</p>
          <p>You would never say: &quot;I saw your LinkedIn post last Tuesday about payments infrastructure.&quot; That&apos;s surveillance. You were scrolling their feed. Weird.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">What Professional Personalization Looks Like</h2>
          <p>Good personalization references publicly available business information — the kind of thing you&apos;d find in a press release, news article, or company blog:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Company milestones:</strong> &quot;I saw Runway launched Gen-4 — the creative AI space is moving fast.&quot;</li>
            <li><strong>Funding rounds:</strong> &quot;Congrats on the $14M Series A — scaling your engineering team must be top of mind.&quot;</li>
            <li><strong>Press coverage:</strong> &quot;Your TechCrunch feature on automated churn recovery was spot on.&quot;</li>
            <li><strong>Conference talks:</strong> &quot;Your talk at SaaStr about PLG metrics resonated with me.&quot;</li>
          </ul>
          <p>Notice the pattern: every reference has a <strong>public, named source</strong>. An article. A conference. A press release. The recipient thinks &quot;they know my company&quot; — not &quot;they know me.&quot;</p>

          <h2 className="text-xl font-bold mt-8 mb-3">What Crosses the Line</h2>
          <p>These are real examples from cold emails people receive. All of them feel invasive:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>&quot;I saw your LinkedIn post about...&quot; — You were scrolling my feed.</li>
            <li>&quot;I noticed you recently moved to Austin...&quot; — You&apos;re tracking my location.</li>
            <li>&quot;As a fellow Stanford alum...&quot; — You researched my education to manufacture rapport.</li>
            <li>&quot;I saw you just started at Company X...&quot; — You&apos;re monitoring my job changes.</li>
            <li>&quot;Since you&apos;re a parent of two...&quot; — Absolutely not. Ever.</li>
          </ul>
          <p>The common thread: these reference <strong>personal feeds, profiles, or life details</strong> that require actively monitoring someone&apos;s digital presence.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Creepy vs. Professional: Side by Side</h2>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-xs font-bold text-red-600 mb-2">CREEPY</p>
              <p className="text-sm text-red-800">&quot;I saw your LinkedIn post about scaling customer success teams last week...&quot;</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs font-bold text-green-600 mb-2">PROFESSIONAL</p>
              <p className="text-sm text-green-800">&quot;Churnkey&apos;s approach to automated churn recovery is solving a real pain point for SaaS...&quot;</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-xs font-bold text-red-600 mb-2">CREEPY</p>
              <p className="text-sm text-red-800">&quot;I noticed you&apos;ve been hiring a lot of SDRs recently...&quot;</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs font-bold text-green-600 mb-2">PROFESSIONAL</p>
              <p className="text-sm text-green-800">&quot;Salesfinity&apos;s growth to 50+ customers suggests outbound is working — scaling that without drowning in email is the next challenge.&quot;</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-3">How SimaOutreach Builds These Principles In</h2>
          <p>When we built SimaOutreach, we hardcoded these rules into the AI:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Research sources are limited:</strong> Our AI uses Perplexity to search the web — but only for company news, press coverage, funding rounds, and professional publications. Never social media feeds.</li>
            <li><strong>Anti-creep prompt rules:</strong> The AI is explicitly instructed to never reference personal life, social media posts, location, education, or job changes.</li>
            <li><strong>Source transparency:</strong> Every email shows a Research Card — you can see exactly what facts the AI found and where it got them.</li>
            <li><strong>The conference test is enforced:</strong> If the AI can&apos;t find professional-grade facts, it writes based on company description alone. It never reaches for personal details to fill the gap.</li>
          </ol>

          <p className="text-lg font-medium mt-8">The result: emails that feel like the sender is professionally aware, not personally invasive. That&apos;s the difference between a reply and an unsubscribe.</p>
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 bg-orange-50 border border-orange-200 rounded-xl text-center">
          <h3 className="text-lg font-bold mb-2">Personalization with principles.</h3>
          <p className="text-sm text-slate-600 mb-4">Try SimaOutreach — 5 emails free, no credit card required.</p>
          <Link href="/dashboard/new-campaign" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition text-sm">
            Start Producing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </article>
    </div>
  )
}
