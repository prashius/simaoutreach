import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { sendEmail } from '@/lib/smtp'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: campaignId } = await params

  // Get user's SMTP config
  const userRows = await sql`
    SELECT smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_from_name
    FROM users WHERE id = ${auth.userId}
  `
  if (userRows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const user = userRows[0]
  if (!user.smtp_host || !user.smtp_user || !user.smtp_pass || !user.smtp_from) {
    return NextResponse.json({ error: 'SMTP not configured. Go to Settings to set up your email.' }, { status: 400 })
  }

  // Get approved emails
  const emails = await sql`
    SELECT es.*, c.email as contact_email,
           c.first_name as contact_first_name, c.last_name as contact_last_name
    FROM email_sends es
    JOIN contacts c ON c.id = es.contact_id
    WHERE es.campaign_id = ${campaignId}
      AND es.user_id = ${auth.userId}
      AND es.status = 'approved'
    ORDER BY es.id
  `

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No approved emails to send' }, { status: 400 })
  }

  // Mark campaign as sending
  await sql`UPDATE campaigns SET status = 'sending', updated_at = NOW() WHERE id = ${campaignId}`

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const email of emails) {
    try {
      const { messageId } = await sendEmail(
        {
          host: user.smtp_host,
          port: user.smtp_port || 465,
          user: user.smtp_user,
          pass: user.smtp_pass,
          from: user.smtp_from,
          fromName: user.smtp_from_name || undefined,
        },
        {
          to: email.contact_email,
          toName: [email.contact_first_name, email.contact_last_name].filter(Boolean).join(' ') || undefined,
          subject: email.subject,
          body: email.body,
          inReplyTo: email.in_reply_to || undefined,
        }
      )

      await sql`
        UPDATE email_sends
        SET status = 'sent', sent_at = NOW(), message_id = ${messageId}
        WHERE id = ${email.id}
      `
      sent++
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      await sql`
        UPDATE email_sends
        SET status = 'failed', failed_reason = ${reason}
        WHERE id = ${email.id}
      `
      failed++
      errors.push(`${email.contact_email}: ${reason}`)
    }

    // Wait between sends to avoid rate limiting
    if (sent + failed < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  // Update campaign stats
  await sql`
    UPDATE campaigns
    SET emails_sent = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${campaignId} AND status = 'sent'),
        status = 'sent',
        updated_at = NOW()
    WHERE id = ${campaignId}
  `

  return NextResponse.json({ sent, failed, errors })
}

export const maxDuration = 300
