import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await sql`
    SELECT id, email, name, avatar_url, plan, emails_limit, emails_used,
           plan_start, plan_end, smtp_host, smtp_port, smtp_from, smtp_from_name,
           created_at
    FROM users WHERE id = ${auth.userId}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: rows[0] })
}
