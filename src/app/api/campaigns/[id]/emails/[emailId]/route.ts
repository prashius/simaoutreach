import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

// PATCH - edit email subject/body
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { emailId } = await params
  const { subject, body } = await request.json()

  const result = await sql`
    UPDATE email_sends
    SET
      subject = COALESCE(${subject || null}, subject),
      body = COALESCE(${body || null}, body),
      edited_by_user = true
    WHERE id = ${Number(emailId)} AND user_id = ${auth.userId}
    RETURNING *
  `

  if (result.length === 0) {
    return NextResponse.json({ error: 'Email not found' }, { status: 404 })
  }

  return NextResponse.json({ email: result[0] })
}

// POST - approve email for sending
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: campaignId, emailId } = await params
  const { action } = await request.json()

  if (action === 'approve') {
    await sql`
      UPDATE email_sends
      SET status = 'approved', approved_at = NOW()
      WHERE id = ${Number(emailId)} AND user_id = ${auth.userId} AND status = 'draft'
    `
    await sql`
      UPDATE campaigns
      SET emails_approved = (
        SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status = 'approved'
      ), updated_at = NOW()
      WHERE id = ${campaignId}
    `
  } else if (action === 'reject') {
    await sql`
      UPDATE email_sends
      SET status = 'draft', approved_at = NULL
      WHERE id = ${Number(emailId)} AND user_id = ${auth.userId} AND status = 'approved'
    `
  }

  return NextResponse.json({ success: true })
}
