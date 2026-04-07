import sql from '@/lib/db'
import axios from 'axios'
import { encrypt, decrypt, decryptOptional } from '@/lib/encryption'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'

/**
 * Add business days to a date (skip weekends)
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

/**
 * Check and generate follow-ups for all campaigns that need them.
 * Called by the cron processor.
 */
export async function processFollowups(): Promise<{ generated: number; errors: number }> {
  let generated = 0
  let errors = 0

  // Find sent emails that need follow-ups
  // Day 3 follow-up: sent >= 3 business days ago, no followup_day3 exists
  const day3Candidates = await sql`
    SELECT es.id, es.user_id, es.campaign_id, es.contact_id, es.subject, es.body,
           es.message_id, c.first_name, c.last_name, c.company_name, c.title,
           camp.followup_day3, camp.followup_day7, camp.followup_day14
    FROM email_sends es
    JOIN contacts c ON c.id = es.contact_id
    JOIN campaigns camp ON camp.id = es.campaign_id
    LEFT JOIN excluded_emails ex ON ex.email = c.email AND ex.user_id = es.user_id
    WHERE es.status = 'sent'
      AND es.send_type = 'initial'
      AND es.sent_at IS NOT NULL
      AND es.sent_at < NOW() - INTERVAL '3 days'
      AND es.replied_at IS NULL
      AND ex.id IS NULL
      AND camp.followup_day3 = true
      AND NOT EXISTS (
        SELECT 1 FROM email_sends f
        WHERE f.parent_send_id = es.id AND f.send_type = 'followup_day3'
      )
    LIMIT 50
  `

  for (const email of day3Candidates) {
    try {
      await generateFollowup(email, 'followup_day3', 3)
      generated++
    } catch (err) {
      errors++
      console.error(`[Followup] Day 3 failed for send ${email.id}:`, err)
    }
  }

  // Day 7 follow-up
  const day7Candidates = await sql`
    SELECT es.id, es.user_id, es.campaign_id, es.contact_id, es.subject, es.body,
           es.message_id, c.first_name, c.last_name, c.company_name, c.title,
           camp.followup_day7
    FROM email_sends es
    JOIN contacts c ON c.id = es.contact_id
    JOIN campaigns camp ON camp.id = es.campaign_id
    LEFT JOIN excluded_emails ex ON ex.email = c.email AND ex.user_id = es.user_id
    WHERE es.status = 'sent'
      AND es.send_type = 'initial'
      AND es.sent_at IS NOT NULL
      AND es.sent_at < NOW() - INTERVAL '7 days'
      AND es.replied_at IS NULL
      AND ex.id IS NULL
      AND camp.followup_day7 = true
      AND NOT EXISTS (
        SELECT 1 FROM email_sends f
        WHERE f.parent_send_id = es.id AND f.send_type = 'followup_day7'
      )
    LIMIT 50
  `

  for (const email of day7Candidates) {
    try {
      await generateFollowup(email, 'followup_day7', 7)
      generated++
    } catch (err) {
      errors++
      console.error(`[Followup] Day 7 failed for send ${email.id}:`, err)
    }
  }

  return { generated, errors }
}

async function generateFollowup(
  originalEmail: any,
  sendType: string,
  dayNumber: number
): Promise<void> {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured')

  // Decrypt contact and email data for AI
  const firstName = decryptOptional(originalEmail.first_name) || ''
  const lastName = decryptOptional(originalEmail.last_name) || ''
  const subject = decrypt(originalEmail.subject)
  const body = decrypt(originalEmail.body)

  const response = await axios.post(
    `${DEEPSEEK_API_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are writing a follow-up cold email. This is follow-up #${dayNumber === 3 ? 1 : 2} sent ${dayNumber} business days after the original email.

ORIGINAL EMAIL:
Subject: ${subject}
Body: ${body}

CONTACT: ${firstName} ${lastName}, ${originalEmail.title || ''} at ${originalEmail.company_name || ''}

RULES:
- This is a follow-up, not a new email. Don't repeat the full pitch.
- Keep it under 80 words. Short and direct.
- ${dayNumber === 3 ? 'Gently follow up. Add a new angle or value point not in the original.' : 'Final follow-up. Be direct. Offer a specific next step or gracefully close.'}
- Don't start with "Just following up" or "Hope you're well" — be direct.
- Start with "Hi ${firstName},"
- End with sender name only.
- Return JSON: {"body": "..."}
- Plain text, no emojis, no markdown.`
        },
        { role: 'user', content: `Write the follow-up email.` }
      ],
      temperature: 0.7,
      max_tokens: 500,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    }
  )

  const content = response.data.choices[0].message.content
  let parsed
  try {
    let jsonStr = content
    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0].trim()
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0].trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse follow-up response')
  }

  // Thread the follow-up: Re: original subject, In-Reply-To original message_id
  const followupSubject = `Re: ${subject}`

  // Schedule for next business day morning
  const scheduledAt = addBusinessDays(new Date(), 1)
  scheduledAt.setHours(9, 0, 0, 0) // 9 AM

  // Encrypt before storing
  await sql`
    INSERT INTO email_sends (
      user_id, campaign_id, contact_id, subject, body,
      send_type, status, parent_send_id, in_reply_to, scheduled_at
    ) VALUES (
      ${originalEmail.user_id},
      ${originalEmail.campaign_id},
      ${originalEmail.contact_id},
      ${encrypt(followupSubject)},
      ${encrypt(parsed.body)},
      ${sendType},
      'approved',
      ${originalEmail.id},
      ${originalEmail.message_id},
      ${scheduledAt.toISOString()}
    )
  `
}
