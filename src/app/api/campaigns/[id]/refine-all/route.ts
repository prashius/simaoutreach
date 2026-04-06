import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!DEEPSEEK_API_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  const { id: campaignId } = await params
  const { instruction } = await request.json()

  if (!instruction) {
    return NextResponse.json({ error: 'Instruction required' }, { status: 400 })
  }

  // Check refinement limit
  const campaignRows = await sql`
    SELECT refinements_used, refinements_limit FROM campaigns
    WHERE id = ${campaignId} AND user_id = ${auth.userId}
  `
  if (campaignRows.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }
  const used = campaignRows[0].refinements_used || 0
  const limit = campaignRows[0].refinements_limit || 30
  if (used >= limit) {
    return NextResponse.json({
      error: `Refinement limit reached (${limit}). Try again tomorrow or upgrade your plan.`,
    }, { status: 429 })
  }

  // Fetch all draft emails
  const emails = await sql`
    SELECT es.id, es.subject, es.body, c.first_name, c.last_name, c.company_name, c.title
    FROM email_sends es
    JOIN contacts c ON c.id = es.contact_id
    WHERE es.campaign_id = ${campaignId} AND es.user_id = ${auth.userId}
      AND es.status = 'draft'
    ORDER BY es.id
  `

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No draft emails to refine' }, { status: 400 })
  }

  let updated = 0
  let failed = 0

  for (const email of emails) {
    try {
      const response = await axios.post(
        `${DEEPSEEK_API_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are refining a cold outreach email based on the user's instruction.

CONTEXT:
- Contact: ${email.first_name} ${email.last_name || ''}, ${email.title || ''} at ${email.company_name || ''}
- Current subject: ${email.subject}
- Current body: ${email.body}

RULES:
- Apply the user's instruction precisely
- Preserve the core message and any factual references
- Keep it under 150 words, plain text, no emojis, no markdown
- Return JSON only: {"subject": "...", "body": "..."}`
            },
            { role: 'user', content: instruction }
          ],
          temperature: 0.6,
          max_tokens: 1000,
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
        failed++
        continue
      }

      await sql`
        UPDATE email_sends
        SET subject = ${parsed.subject}, body = ${parsed.body}, edited_by_user = true
        WHERE id = ${email.id}
      `
      updated++

      // Check if we've hit the limit mid-batch
      if (used + updated >= limit) break
    } catch {
      failed++
    }
  }

  // Increment refinement count
  await sql`
    UPDATE campaigns SET refinements_used = refinements_used + ${updated} WHERE id = ${campaignId}
  `

  return NextResponse.json({ updated, failed, total: emails.length, refinementsUsed: used + updated, refinementsLimit: limit })
}

export const maxDuration = 300
