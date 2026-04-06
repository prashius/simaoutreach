'use client'

import Link from 'next/link'
import { Zap, Search, Mail, ArrowRight, CheckCircle, Shield } from 'lucide-react'

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
            <Link href="/dashboard" className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            AI-Powered Cold Email Generation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            50 cold emails.<br />
            Each one researched.<br />
            Each one unique.<br />
            <span className="text-orange-500">$7.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Other tools charge $47/mo for you to do the work. We research every prospect live,
            write a unique email for each, and deliver them ready to send.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/new-campaign"
              className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-orange-600 transition text-lg"
            >
              Start Your First Campaign
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900 font-medium">
              See pricing →
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mail className="w-8 h-8 text-orange-500" />,
                title: 'Upload Your Prospects',
                desc: 'Drop a CSV with names, emails, companies. Apollo, LinkedIn, any source.',
              },
              {
                icon: <Search className="w-8 h-8 text-orange-500" />,
                title: 'AI Researches Each One',
                desc: 'Live web search finds recent funding, launches, news. Not stale database data — real-time intelligence.',
              },
              {
                icon: <Zap className="w-8 h-8 text-orange-500" />,
                title: 'Unique Emails Written',
                desc: 'AI picks the sharpest angle for each prospect and writes a unique, personalized email. Preview, edit, send.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-4">The Real Cost of 50 Cold Emails</h2>
            <p className="text-slate-600 text-center mb-10">Other tools charge for the sending. You still do the work.</p>

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
                  <div className="flex justify-between"><span>50 AI-researched emails</span><span className="font-semibold">$7</span></div>
                  <div className="flex justify-between"><span>Research each prospect</span><span className="font-semibold text-green-600">Included</span></div>
                  <div className="flex justify-between"><span>Write unique emails</span><span className="font-semibold text-green-600">Included</span></div>
                  <div className="flex justify-between"><span>Unique subject lines</span><span className="font-semibold text-green-600">Included</span></div>
                  <div className="flex justify-between border-t pt-3 text-base"><span className="font-bold">Total</span><span className="font-bold text-orange-600">$7</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What makes it different */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">What Makes This Different</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Live web research per prospect', desc: 'Not stale database data. AI searches the web for each prospect — recent funding, product launches, company news from last week.' },
              { title: 'Each email is truly unique', desc: 'Not the same template with {name} swapped. Different hooks, different angles, different subject lines. Every single one.' },
              { title: 'Anti-creep rule built in', desc: 'Only professionally published content. Never references personal life, social media, or anything that feels like surveillance.' },
              { title: 'Preview and edit before sending', desc: 'Every email is generated as a draft. You review, edit, approve. Nothing sends without your say-so.' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Simple Pricing. No Subscriptions Required.</h2>
            <p className="text-slate-400 mb-10">Pay for what you use. Each plan gives you a batch of AI-researched, personalized emails.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Starter', emails: 50, price: '$7', per: '$0.14/email' },
                { name: 'Growth', emails: 200, price: '$19', per: '$0.10/email' },
                { name: 'Pro', emails: 500, price: '$39', per: '$0.08/email', popular: true },
                { name: 'Scale', emails: 2000, price: '$99', per: '$0.05/email' },
              ].map((plan, idx) => (
                <div key={idx} className={`rounded-xl p-6 ${plan.popular ? 'bg-orange-500 ring-2 ring-orange-400' : 'bg-slate-800'}`}>
                  {plan.popular && <p className="text-xs font-bold uppercase tracking-wider mb-2">Most Popular</p>}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-3xl font-bold mt-2">{plan.price}</p>
                  <p className="text-sm opacity-70 mt-1">{plan.emails} emails</p>
                  <p className="text-xs opacity-50 mt-1">{plan.per}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/new-campaign" className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition mt-10">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Trust */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-semibold">Privacy First</span>
          </div>
          <p className="text-slate-600 max-w-lg mx-auto">
            Your prospect data stays in your account. We use your SMTP — emails send from your domain,
            your sender reputation. No shared infrastructure.
          </p>
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
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
          </div>
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Simarahitam Technologies</p>
        </div>
      </footer>
    </div>
  )
}
