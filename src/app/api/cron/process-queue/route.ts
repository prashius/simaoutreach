import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { sendEmail } from '@/lib/smtp'
import { wrapUrlsForTracking } from '@/lib/url-tracker'
import { processFollowups } from '@/lib/followup-generator'
import { processAllReplies } from '@/lib/reply-tracker'
import { decrypt } from '@/lib/encryption'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * Master cron endpoint — called every 30 minutes by cron-job.org
 *
 * 1. Send approved/scheduled emails (respecting send intervals)
 * 2. Generate follow-ups for eligible sent emails
 *
 * Auth: query param ?secret=, or Basic Auth, or Bearer token
 */
export async function GET(request: NextRequest) {
  // Verify cron auth — support multiple methods
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')
  const authHeader = request.headers.get('authorization') || ''

  let authorized = false

  if (CRON_SECRET) {
    // Method 1: ?secret= query param
    if (querySecret === CRON_SECRET) authorized = true

    // Method 2: Bearer token
    if (authHeader === `Bearer ${CRON_SECRET}`) authorized = true

    // Method 3: Basic auth (username ignored, password = secret)
    if (authHeader.startsWith('Basic ')) {
      try {
        const decoded = atob(authHeader.slice(6))
        const password = decoded.split(':')[1]
        if (password === CRON_SECRET) authorized = true
      } catch {}
    }
  }

  if (!CRON_SECRET || !authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    emailsSent: 0,
    emailsFailed: 0,
    followupsGenerated: 0,
    followupErrors: 0,
    repliesFound: 0,
    replyErrors: 0,
    usersChecked: 0,
    errors: [] as string[],
  }

  try {
    // --- PHASE 1: Send queued emails ---
    // Find approved emails that are scheduled for now or past
    const pendingEmails = await sql`
      SELECT es.id, es.user_id, es.campaign_id, es.contact_id, es.subject, es.body,
             es.in_reply_to, es.send_type,
             c.email as contact_email, c.first_name as contact_first_name, c.last_name as contact_last_name,
             u.smtp_host, u.smtp_port, u.smtp_user, u.smtp_pass, u.smtp_from, u.smtp_from_name,
             camp.open_tracking
      FROM email_sends es
      JOIN contacts c ON c.id = es.contact_id
      JOIN users u ON u.id = es.user_id
      JOIN campaigns camp ON camp.id = es.campaign_id
      WHERE es.status = 'approved'
        AND (es.scheduled_at IS NULL OR es.scheduled_at <= NOW())
        AND u.smtp_host IS NOT NULL
        AND u.smtp_from IS NOT NULL
      ORDER BY es.scheduled_at NULLS FIRST, es.id
      LIMIT 20
    `

    for (const email of pendingEmails) {
      try {
        // Wrap URLs for click tracking
        const trackedBody = await wrapUrlsForTracking(
          email.body,
          email.id,
          email.user_id,
          email.campaign_id
        )

        // Send via user's SMTP
        const { messageId } = await sendEmail(
          {
            host: email.smtp_host,
            port: email.smtp_port || 465,
            user: email.smtp_user,
            pass: decrypt(email.smtp_pass),
            from: email.smtp_from,
            fromName: email.smtp_from_name || undefined,
          },
          {
            to: email.contact_email,
            toName: [email.contact_first_name, email.contact_last_name].filter(Boolean).join(' ') || undefined,
            subject: email.subject,
            body: trackedBody,
            inReplyTo: email.in_reply_to || undefined,
            openTracking: email.open_tracking ? { enabled: true, sendId: email.id } : undefined,
          }
        )

        // Mark as sent
        await sql`
          UPDATE email_sends
          SET status = 'sent', sent_at = NOW(), message_id = ${messageId}
          WHERE id = ${email.id}
        `

        // Update campaign stats
        await sql`
          UPDATE campaigns
          SET emails_sent = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${email.campaign_id} AND status = 'sent'),
              updated_at = NOW()
          WHERE id = ${email.campaign_id}
        `

        results.emailsSent++

        // Wait between sends (5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err)
        await sql`
          UPDATE email_sends SET status = 'failed', failed_reason = ${reason} WHERE id = ${email.id}
        `
        results.emailsFailed++
        results.errors.push(`Send ${email.id}: ${reason}`)
      }
    }

    // --- PHASE 2: Generate follow-ups ---
    const followupResult = await processFollowups()
    results.followupsGenerated = followupResult.generated
    results.followupErrors = followupResult.errors

    // --- PHASE 3: Check for replies via IMAP ---
    const replyResult = await processAllReplies()
    results.repliesFound = replyResult.totalFound
    results.replyErrors = replyResult.totalErrors
    results.usersChecked = replyResult.usersChecked

  } catch (error) {
    results.errors.push(`Global: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.log(`[Cron] Sent: ${results.emailsSent}, Failed: ${results.emailsFailed}, Follow-ups: ${results.followupsGenerated}, Replies: ${results.repliesFound}`)

  return NextResponse.json(results)
}

// Must complete within 30 seconds for cron-job.org
// 20 emails × 5s interval = ~25s max, plus follow-up generation
