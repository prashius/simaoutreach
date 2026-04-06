import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

export async function PATCH(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_from_name } = await request.json()

  // Only update smtp_pass if provided (don't overwrite with null)
  if (smtp_pass) {
    await sql`
      UPDATE users SET
        smtp_host = ${smtp_host}, smtp_port = ${smtp_port}, smtp_user = ${smtp_user},
        smtp_pass = ${smtp_pass}, smtp_from = ${smtp_from}, smtp_from_name = ${smtp_from_name},
        updated_at = NOW()
      WHERE id = ${auth.userId}
    `
  } else {
    await sql`
      UPDATE users SET
        smtp_host = ${smtp_host}, smtp_port = ${smtp_port}, smtp_user = ${smtp_user},
        smtp_from = ${smtp_from}, smtp_from_name = ${smtp_from_name},
        updated_at = NOW()
      WHERE id = ${auth.userId}
    `
  }

  return NextResponse.json({ success: true })
}
