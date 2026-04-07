'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'

const posts = [
  {
    slug: 'anti-creep-guide',
    title: 'The Anti-Creep Cold Email Guide',
    description: 'Personalization that gets replies, not restraining orders. Why "I saw your LinkedIn post" kills response rates.',
    date: 'April 2026',
  },
  {
    slug: '322-vs-7',
    title: 'The Real Cost of 50 Cold Emails: $322 vs $7',
    description: 'Break down the hidden cost of cold email campaigns and why per-email pricing beats subscriptions.',
    date: 'April 2026',
  },
  {
    slug: 'personalization-that-works',
    title: 'Cold Email Personalization That Actually Works in 2026',
    description: 'The personalization spectrum from generic to creepy — and where the sweet spot is.',
    date: 'April 2026',
  },
]

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            <span className="font-bold">SimaOutreach</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">Dashboard →</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Blog</h1>
        <p className="text-slate-500 mb-10">Insights on cold email, personalization, and outreach intelligence.</p>

        <div className="space-y-6">
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-orange-200 hover:shadow-sm transition">
              <p className="text-xs text-slate-400 mb-2">{post.date}</p>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h2>
              <p className="text-sm text-slate-600 mb-3">{post.description}</p>
              <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                Read more <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
