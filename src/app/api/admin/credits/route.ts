import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.CRON_SECRET

/**
 * Admin endpoint to update user credits.
 *
 * Usage:
 *   curl "https://simaoutreach.com/api/admin/credits?secret=YOUR_SECRET&email=user@email.com&credits=50"
 *
 * Or set credits + plan:
 *   curl "https://simaoutreach.com/api/admin/credits?secret=YOUR_SECRET&email=user@email.com&credits=500&plan=PRO"
 *
 * Or reset usage:
 *   curl "https://simaoutreach.com/api/admin/credits?secret=YOUR_SECRET&email=user@email.com&credits=50&reset=true"
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const email = searchParams.get('email')
  const credits = searchParams.get('credits')
  const plan = searchParams.get('plan')
  const reset = searchParams.get('reset')

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!email) {
    // List all users
    const users = await sql`
      SELECT id, email, name, plan, emails_limit, emails_used,
             emails_limit - emails_used as remaining
      FROM users ORDER BY created_at DESC
    `
    return NextResponse.json({ users })
  }

  // Find user
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`
  if (rows.length === 0) {
    return NextResponse.json({ error: `User ${email} not found` }, { status: 404 })
  }

  const user = rows[0]

  // Update credits
  if (credits) {
    const newLimit = Number(credits)
    const newUsed = reset === 'true' ? 0 : user.emails_used

    await sql`
      UPDATE users
      SET emails_limit = ${newLimit},
          emails_used = ${newUsed},
          plan = ${plan || user.plan},
          updated_at = NOW()
      WHERE email = ${email}
    `

    const updated = await sql`SELECT email, plan, emails_limit, emails_used, emails_limit - emails_used as remaining FROM users WHERE email = ${email}`
    return NextResponse.json({ success: true, user: updated[0] })
  }

  // Just return current status
  return NextResponse.json({
    user: {
      email: user.email,
      plan: user.plan,
      emails_limit: user.emails_limit,
      emails_used: user.emails_used,
      remaining: user.emails_limit - user.emails_used,
    }
  })
}
