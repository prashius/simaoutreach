import * as imapSimple from 'imap-simple'
import { simpleParser } from 'mailparser'
import sql from '@/lib/db'
import axios from 'axios'
import { decrypt } from '@/lib/encryption'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'

/**
 * Check for replies to sent emails for a single user.
 * Connects to their IMAP, searches for replies matching sent message_ids.
 */
export async function checkRepliesForUser(userId: string): Promise<{ found: number; errors: number }> {
  let found = 0
  let errors = 0

  // Get user's IMAP config
  const userRows = await sql`
    SELECT imap_host, imap_port, smtp_user, smtp_pass FROM users WHERE id = ${userId}
  `
  if (userRows.length === 0 || !userRows[0].imap_host) {
    return { found: 0, errors: 0 }
  }

  const user = userRows[0]

  // Get sent emails that haven't been replied to yet
  const sentEmails = await sql`
    SELECT id, message_id, contact_id, campaign_id
    FROM email_sends
    WHERE user_id = ${userId}
      AND status = 'sent'
      AND replied_at IS NULL
      AND message_id IS NOT NULL
      AND sent_at > NOW() - INTERVAL '30 days'
    ORDER BY sent_at DESC
    LIMIT 100
  `

  if (sentEmails.length === 0) return { found: 0, errors: 0 }

  let connection: imapSimple.ImapSimple | null = null

  try {
    // Connect to IMAP
    connection = await imapSimple.connect({
      imap: {
        host: user.imap_host,
        port: user.imap_port || 993,
        user: user.smtp_user,
        password: decrypt(user.smtp_pass),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    })

    await connection.openBox('INBOX')

    // Search for replies to each sent email
    for (const email of sentEmails) {
      try {
        // Search by In-Reply-To or References header matching our message_id
        const searchCriteria = [
          ['HEADER', 'In-Reply-To', email.message_id],
        ]
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT', ''],
          struct: true,
        }

        const messages = await connection.search(searchCriteria, fetchOptions)

        if (messages.length > 0) {
          // Found a reply
          const msg = messages[0]
          const all = msg.parts.find((p: any) => p.which === '')
          let replySnippet = ''

          if (all) {
            const parsed = await simpleParser(all.body)
            replySnippet = (parsed.text || '').slice(0, 500)
          }

          // Classify the reply
          const replyType = await classifyReply(replySnippet)

          // Update email_sends
          await sql`
            UPDATE email_sends SET replied_at = NOW() WHERE id = ${email.id}
          `

          // Update campaign reply count
          await sql`
            UPDATE campaigns
            SET emails_replied = (
              SELECT COUNT(*) FROM email_sends WHERE campaign_id = ${email.campaign_id} AND replied_at IS NOT NULL
            ), updated_at = NOW()
            WHERE id = ${email.campaign_id}
          `

          // If "not interested", auto-exclude from future campaigns
          if (replyType === 'not_interested') {
            const contactRows = await sql`SELECT email FROM contacts WHERE id = ${email.contact_id}`
            if (contactRows.length > 0) {
              await sql`
                INSERT INTO excluded_emails (user_id, email, reason)
                VALUES (${userId}, ${contactRows[0].email}, 'Replied not interested')
                ON CONFLICT (user_id, email) DO NOTHING
              `
            }
          }

          found++
        }
      } catch (err) {
        errors++
        console.error(`[ReplyTracker] Error checking email ${email.id}:`, err)
      }
    }
  } catch (err) {
    console.error(`[ReplyTracker] IMAP connection error for user ${userId}:`, err)
    errors++
  } finally {
    if (connection) {
      try { connection.end() } catch {}
    }
  }

  return { found, errors }
}

/**
 * Classify a reply using DeepSeek
 */
async function classifyReply(replyText: string): Promise<string> {
  if (!DEEPSEEK_API_KEY || !replyText.trim()) return 'unknown'

  try {
    const response = await axios.post(
      `${DEEPSEEK_API_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Classify this email reply into exactly one category. Return ONLY the category name, nothing else.

Categories:
- interested (wants to learn more, book a call, see a demo)
- not_interested (declines, asks to stop, unsubscribe)
- ooo (out of office, vacation auto-reply)
- question (asks a question before committing)
- referral (forwards to someone else, suggests another person)
- bounce (delivery failure, invalid address)
- other (anything else)`
          },
          { role: 'user', content: replyText.slice(0, 500) }
        ],
        temperature: 0,
        max_tokens: 20,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    )

    const classification = response.data.choices[0].message.content.trim().toLowerCase()
    const valid = ['interested', 'not_interested', 'ooo', 'question', 'referral', 'bounce', 'other']
    return valid.includes(classification) ? classification : 'other'
  } catch {
    return 'unknown'
  }
}

/**
 * Process replies for all users who have IMAP configured.
 * Called by the cron.
 */
export async function processAllReplies(): Promise<{ totalFound: number; totalErrors: number; usersChecked: number }> {
  const users = await sql`
    SELECT id FROM users WHERE imap_host IS NOT NULL AND smtp_pass IS NOT NULL
    LIMIT 10
  `

  let totalFound = 0
  let totalErrors = 0

  for (const user of users) {
    const result = await checkRepliesForUser(user.id)
    totalFound += result.found
    totalErrors += result.errors
  }

  return { totalFound, totalErrors, usersChecked: users.length }
}
