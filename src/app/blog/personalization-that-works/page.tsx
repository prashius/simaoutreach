'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

export default function PersonalizationGuide() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">Cold Email Personalization That Actually Works in 2026</h1>

        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed space-y-6">
          <p>Everyone says &quot;personalize your cold emails.&quot; But what does that actually mean? There&apos;s a spectrum from completely generic to genuinely researched — and most people are stuck in the middle, thinking merge tags count as personalization.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">The Personalization Spectrum</h2>
          <div className="space-y-4 my-6">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Level 1</span>
              <div>
                <p className="font-semibold text-sm">Generic</p>
                <p className="text-sm text-slate-600">&quot;I help companies grow their revenue.&quot; — Could be sent to literally anyone.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">Level 2</span>
              <div>
                <p className="font-semibold text-sm">Merge Tags</p>
                <p className="text-sm text-slate-600">&quot;Hi {'{first_name}'}, I see {'{company}'} is in the {'{industry}'} space.&quot; — Technically personalized. Feels like a robot.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">Level 3</span>
              <div>
                <p className="font-semibold text-sm">Templated Research</p>
                <p className="text-sm text-slate-600">&quot;I saw {'{company}'} recently raised funding...&quot; — Better, but it&apos;s a template with one fact swapped in. Recipients can tell.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Level 4</span>
              <div>
                <p className="font-semibold text-sm">Live Research + Unique Writing</p>
                <p className="text-sm text-slate-600">&quot;Juicyway processing $1B+ in cross-border payments with 60+ people means your inbox is a warzone of operational and strategic emails daily.&quot; — This can&apos;t be templated. It was written for this person.</p>
              </div>
            </div>
          </div>
          <p>Most cold email tools operate at Level 2-3. SimaOutreach operates at Level 4.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Why Merge Tags Don&apos;t Count</h2>
          <p>When you write &quot;Hi {'{first_name}'}, I noticed {'{company}'} is growing fast,&quot; the recipient knows instantly it&apos;s a template. How? Because:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Every cold email they get says the same thing</li>
            <li>&quot;Growing fast&quot; is generic — it could apply to any company</li>
            <li>There&apos;s no specific fact that proves you actually looked at their business</li>
            <li>The rest of the email is identical for every recipient</li>
          </ul>
          <p><strong>Real personalization means the email could only have been written for this person.</strong> If you can swap the name and company and it still makes sense, it&apos;s not personalized.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Live Web Research: The Differentiator</h2>
          <p>SimaOutreach uses Perplexity AI to search the web in real-time for each prospect. Not a stale database. Not LinkedIn scraping. An actual web search that finds:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Recent funding rounds with exact amounts and dates</li>
            <li>Product launches from the last few months</li>
            <li>Press coverage and industry news</li>
            <li>Growth signals — hiring, expansion, customer milestones</li>
          </ul>
          <p>This research is then fed to a reasoning AI (DeepSeek) that writes a unique email referencing these specific facts. The AI is instructed to use actual numbers — &quot;$1B+ processed&quot; not &quot;impressive growth.&quot;</p>

          <h2 className="text-xl font-bold mt-8 mb-3">The Scoring System: Know Before You Send</h2>
          <p>Every email SimaOutreach produces is scored on five dimensions:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Personalization (30%)</strong> — Does it reference specific facts? Numbers? The company name beyond the greeting?</li>
            <li><strong>Spam Risk (20%)</strong> — Any trigger words? Excessive caps? Too many links?</li>
            <li><strong>Readability (15%)</strong> — Is it 50-150 words? Short sentences? Good paragraph structure?</li>
            <li><strong>CTA Clarity (20%)</strong> — Is there a clear ask? Is it a question? Is it specific?</li>
            <li><strong>Subject Line (15%)</strong> — Does it reference a fact? Is it under 8 words? Is it unique?</li>
          </ol>
          <p>If an email scores below 75, the AI automatically rewrites it. You see the before and after scores. Nothing ships at Level 2.</p>

          <h2 className="text-xl font-bold mt-8 mb-3">Hook Types: What Actually Gets Replies</h2>
          <p>Not all personalization hooks are equal. Based on data from thousands of cold emails:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Funding reference</strong> — &quot;Congrats on the Series A&quot; — high engagement, shows awareness</li>
            <li><strong>Product launch</strong> — &quot;I saw you just launched X&quot; — timely, relevant</li>
            <li><strong>Growth signal</strong> — &quot;Growing to 60+ employees means...&quot; — connects to a real problem</li>
            <li><strong>Generic description</strong> — &quot;As a [industry] company...&quot; — low engagement, feels templated</li>
          </ul>
          <p>SimaOutreach tracks which hook types perform best for your campaigns and recommends what to use next time. The system gets smarter with every send.</p>
        </div>

        <div className="mt-12 p-8 bg-orange-50 border border-orange-200 rounded-xl text-center">
          <h3 className="text-lg font-bold mb-2">See Level 4 personalization in action.</h3>
          <p className="text-sm text-slate-600 mb-4">Upload 5 prospects and watch the AI research, write, and score in real-time.</p>
          <Link href="/dashboard/new-campaign" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition text-sm">
            Try Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </article>
    </div>
  )
}
