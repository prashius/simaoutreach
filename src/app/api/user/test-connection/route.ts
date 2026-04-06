import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRows = await sql`
    SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from
    FROM users WHERE id = ${auth.userId}
  `
  if (userRows.length === 0 || !userRows[0].smtp_host) {
    return NextResponse.json({ error: 'SMTP not configured. Save settings first.' }, { status: 400 })
  }

  const u = userRows[0]

  try {
    const transporter = nodemailer.createTransport({
      host: u.smtp_host,
      port: u.smtp_port || 465,
      secure: (u.smtp_port || 465) === 465,
      auth: { user: u.smtp_user, pass: u.smtp_pass },
      connectionTimeout: 10000,
    })

    await transporter.verify()

    return NextResponse.json({ message: 'SMTP connection successful. Ready to send emails.' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `SMTP connection failed: ${msg}` }, { status: 400 })
  }
}
