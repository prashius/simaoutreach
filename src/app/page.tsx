'use client'

import Link from 'next/link'
import { Zap, Search, ArrowRight, CheckCircle, Shield, X, BarChart3, RefreshCw, MessageSquare, GitBranch, TrendingUp, Lock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-7 h-7 text-orange-500" />
            <span className="text-xl font-bold">SimaOutreach</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/blog" className="text-sm text-slate-600 hover:text-slate-900">Blog</Link>
            <Link href="/dashboard" className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">Dashboard</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI Outreach Studio
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
            50 cold emails.<br />
            Each one researched.<br />
            Each one unique.<br />
            <span className="text-orange-500">$7.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            The AI outreach studio that researches, writes, scores, and improves every email — before you hit send. Not a template engine. A production studio.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard/new-campaign" className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-orange-600 transition text-lg">
              Start Producing <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/blog/anti-creep-guide" className="text-slate-600 hover:text-slate-900 font-medium">Read our principles →</Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">5 emails free. No credit card required.</p>
        </section>

        {/* What happens when you hit Generate */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-3">What Happens When You Hit Produce</h2>
            <p className="text-slate-500 text-center mb-12 max-w-lg mx-auto">Seven steps. Fully automated. You watch it happen in real-time.</p>
            <div className="grid md:grid-cols-7 gap-4">
              {[
                { icon: <Search className="w-5 h-5" />, label: 'Research', desc: 'AI searches the web for each prospect — funding, launches, growth' },
                { icon: <Zap className="w-5 h-5" />, label: 'Write', desc: 'Unique email using only verified facts. No templates.' },
                { icon: <BarChart3 className="w-5 h-5" />, label: 'Score', desc: 'Scored on 5 dimensions: personalization, spam, readability, CTA, subject' },
                { icon: <RefreshCw className="w-5 h-5" />, label: 'Improve', desc: 'Below 75? AI rewrites automatically. You see before/after.' },
                { icon: <MessageSquare className="w-5 h-5" />, label: 'Refine', desc: 'Chat with AI: "make it shorter", "add their funding round"' },
                { icon: <GitBranch className="w-5 h-5" />, label: 'Follow up', desc: 'Smart follow-ups adapt based on opens, clicks, silence' },
                { icon: <TrendingUp className="w-5 h-5" />, label: 'Learn', desc: 'AI tracks what hooks work. Recommends your next campaign.' },
              ].map((step, i) => (
                <div key={i} className="text-center p-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-orange-600">
                    {step.icon}
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-1">{step.label}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Personalization Principles */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-3">Our Personalization Principles</h2>
          <p className="text-slate-500 text-center mb-10">Transparency about what our AI does — and what it never does.</p>
          <div className="grid md:grid-cols-2 gap-8">
            {/* What we research */}
            <div className="bg-green-50/50 rounded-xl border border-green-200/50 p-6">
              <h3 className="font-semibold text-green-800 mb-4">What our AI researches</h3>
              <ul className="space-y-3">
                {[
                  'Company news from the last 12 months',
                  'Funding rounds, acquisitions, product launches',
                  'Growth signals — headcount, customer wins, expansion',
                  'Professional talks at named conferences',
                  'Published articles and press quotes',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* What we never touch */}
            <div className="bg-red-50/50 rounded-xl border border-red-200/50 p-6">
              <h3 className="font-semibold text-red-800 mb-4">What our AI never touches</h3>
              <ul className="space-y-3">
                {[
                  'Social media feeds (LinkedIn, Twitter, Instagram)',
                  'Personal life, family, hobbies, lifestyle',
                  'Location or education details',
                  'Job change history or career timeline',
                  'Anything requiring scrolling someone\'s feed',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mt-8 italic">
            The test we apply: If you wouldn&apos;t say it to someone you just met at a conference, we don&apos;t put it in the email.
          </p>
        </section>

        {/* Cost comparison */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-4">The Real Cost of 50 Cold Emails</h2>
            <p className="text-slate-500 text-center mb-10">Other tools charge for the sending. You still do the work.</p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-400 mb-4">Using Instantly / Lemlist</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Tool subscription</span><span className="font-semibold">$47/mo</span></div>
                  <div className="flex justify-between"><span>Research 50 prospects (~2.5 hrs)</span><span className="font-semibold">$125</span></div>
                  <div className="flex justify-between"><span>Write 50 emails (~2.5 hrs)</span><span className="font-semibold">$125</span></div>
                  <div className="flex justify-between"><span>Personalize subject lines</span><span className="font-semibold">$25</span></div>
                  <div className="flex justify-between border-t pt-3 text-base"><span className="font-bold">Total</span><span className="font-bold text-red-600">$322</span></div>
                </div>
              </div>
              <div className="border-2 border-orange-400 rounded-xl p-6 bg-orange-50/50">
                <h3 className="text-lg font-semibold text-orange-600 mb-4">Using SimaOutreach</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>50 AI-researched, scored, auto-improved emails</span><span className="font-semibold">$7</span></div>
                  <div className="flex justify-between"><span>Live web research per prospect</span><span className="font-semibold text-green-600">Included</span></div>
                  <div className="flex justify-between"><span>5-dimension scoring + auto-revision</span><span className="font-semibold text-green-600">Included</span></div>
                  <div className="flex justify-between"><span>Smart follow-ups (Day 3 + Day 7)</span><span className="font-semibold text-green-600">Included</span></div>
                  <div className="flex justify-between border-t pt-3 text-base"><span className="font-bold">Total</span><span className="font-bold text-orange-600">$7</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence section */}
        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-3">Not Just Emails. Intelligence.</h2>
            <p className="text-slate-400 text-center mb-10">SimaOutreach gets smarter with every campaign you run.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Hook Performance', desc: 'Track which opener style gets replies. "Funding hooks: 14% reply rate. Generic: 3%."', icon: <BarChart3 className="w-5 h-5" /> },
                { title: 'Industry Breakdown', desc: 'See which industries respond to your outreach. Focus where you win.', icon: <TrendingUp className="w-5 h-5" /> },
                { title: 'Follow-up Strategy', desc: 'Day 3 adds +4% reply rate. Day 7 adds +2%. AI optimizes the sequence.', icon: <GitBranch className="w-5 h-5" /> },
                { title: 'Next Campaign AI', desc: '"Focus on SaaS founders. Lead with funding hooks. Estimated reply rate: 14-16%."', icon: <MessageSquare className="w-5 h-5" /> },
              ].map((item, i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-orange-400">{item.icon}</div>
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Simple Pricing. Pay Per Campaign.</h2>
            <p className="text-slate-500 mb-10">No subscriptions required. Each plan gives you AI-researched, scored, auto-improved emails.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { name: 'Free', emails: 5, price: '$0', per: 'No card needed', highlight: false, free: true },
                { name: 'Starter', emails: 50, price: '$7', per: '$0.14/email', highlight: false },
                { name: 'Growth', emails: 200, price: '$19', per: '$0.10/email', highlight: false },
                { name: 'Pro', emails: 500, price: '$39', per: '$0.08/email', highlight: true },
                { name: 'Scale', emails: 2000, price: '$99', per: '$0.05/email', highlight: false },
              ].map((plan: any, i) => (
                <div key={i} className={`rounded-xl p-5 border ${plan.highlight ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400' : plan.free ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}>
                  {plan.highlight && <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-2">Most Popular</p>}
                  {plan.free && <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-2">Try Free</p>}
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{plan.price}</p>
                  <p className="text-xs text-slate-500 mt-1">{plan.emails} emails</p>
                  <p className="text-[10px] text-slate-400">{plan.per}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/new-campaign" className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition mt-10">
              Start Producing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Trust */}
        <section className="bg-slate-50 border-t border-slate-200 py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Lock className="w-4 h-4 text-green-600" />
                <span>AES-256-GCM encryption at rest</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Your SMTP — your domain, your reputation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No raw prospect data stored unencrypted</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">SimaOutreach</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/blog" className="hover:text-slate-900">Blog</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
          </div>
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Simarahitam Technologies</p>
        </div>
      </footer>
    </div>
  )
}
