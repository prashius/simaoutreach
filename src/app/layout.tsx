import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SimaOutreach — AI Cold Emails That Actually Get Replies',
  description: 'Upload your prospects. AI researches each one live, writes a unique personalized email. No templates. No merge tags. 50 emails for $7.',
  metadataBase: new URL('https://simaoutreach.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
