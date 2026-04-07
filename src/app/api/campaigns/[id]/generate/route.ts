import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { researchCompany, researchPerson } from '@/lib/perplexity'
import { generateColdEmail } from '@/lib/groq'
import { checkCredits, deductCredits } from '@/lib/usage'
import { decryptOptional, encrypt } from '@/lib/encryption'
import { scoreEmail } from '@/lib/email-scorer'
import axios from 'axios'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'

/**
 * Detect hook type from email body
 */
function detectHookType(body: string): string {
  const lower = body.toLowerCase()
  if (/\$[\d,.]+[mkb]?|\braised\b|\bfunding\b|\bseries [a-d]\b|\bseed\b|\binvest/i.test(lower)) return 'funding'
  if (/\blaunched\b|\breleased\b|\bnew product\b|\bannounced\b|\brollout/i.test(lower)) return 'product_launch'
  if (/\bgrown\b|\bgrowth\b|\bemployees\b|\bcustomers\b|\bexpand|\bhired|\bheadcount/i.test(lower)) return 'growth'
  if (/\btalk\b|\bconference\b|\barticle\b|\bpublished\b|\bwrote\b|\bpodcast/i.test(lower)) return 'person_quote'
  return 'general'
}

/**
 * Count factual references in research text
 */
function countFacts(research: string): number {
  let count = 0
  if (/\$[\d,.]+/i.test(research)) count++
  if (/\d+%/i.test(research)) count++
  if (/\b20[12]\d\b/.test(research)) count++
  if (/\d+\+?\s*(employees|customers|users|countries|cities)/i.test(research)) count++
  if (/series [a-d]|seed|pre-seed/i.test(research)) count++
  if (/\b(launched|acquired|partnered|raised|expanded)\b/i.test(research)) count++
  return count
}

/**
 * Auto-revise an email using scorer tips
 */
async function autoRevise(
  subject: string,
  body: string,
  score: ReturnType<typeof scoreEmail>,
  research: string,
  firstName: string,
  _company: string
): Promise<{ subject: string; body: string }> {
  if (!DEEPSEEK_API_KEY) return { subject, body }

  const tips = [
    ...score.personalization.tips,
    ...score.subjectLine.tips,
  ].filter(Boolean)

  const response = await axios.post(
    `${DEEPSEEK_API_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are improving a cold email to score higher. Current score: ${score.overall}/100.

ISSUES TO FIX:
${tips.map(t => `- ${t}`).join('\n')}

AVAILABLE RESEARCH (use specific facts from this):
${research}

RULES:
- Use SPECIFIC numbers, dates, product names from the research
- Keep under 150 words, plain text, no emojis
- Start with "Hi ${firstName},"
- Subject must reference a specific fact, under 10 words, lowercase
- Return JSON: {"subject": "...", "body": "..."}`
        },
        {
          role: 'user',
          content: `Current subject: ${subject}\n\nCurrent body:\n${body}\n\nImprove this email to address the issues listed above.`
        }
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
  try {
    let jsonStr = content
    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0].trim()
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0].trim()
    return JSON.parse(jsonStr)
  } catch {
    return { subject, body } // revision failed, keep original
  }
}

/**
 * Generate ONE email per request — with scoring + auto-revise.
 * Frontend calls this in a loop with studio progress tracking.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuthToken(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: campaignId } = await params

    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'PERPLEXITY_API_KEY not configured' }, { status: 503 })
    }
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 503 })
    }

    const rows = await sql`
      SELECT * FROM campaigns WHERE id = ${campaignId} AND user_id = ${auth.userId}
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    const campaign = rows[0]

    // Get NEXT contact without an email
    const contacts = await sql`
      SELECT c.* FROM contacts c
      LEFT JOIN email_sends es ON es.contact_id = c.id AND es.campaign_id = ${campaignId}
      WHERE c.campaign_id = ${campaignId}
        AND c.user_id = ${auth.userId}
        AND es.id IS NULL
      ORDER BY c.id
      LIMIT 1
    `

    if (contacts.length === 0) {
      await sql`UPDATE campaigns SET status = 'ready', updated_at = NOW() WHERE id = ${campaignId}`
      return NextResponse.json({ generated: 0, remaining: 0, done: true })
    }

    const contact = contacts[0]

    const hasCredits = await checkCredits(auth.userId, 1)
    if (!hasCredits) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 402 })
    }

    // Check if user has paid plan (deep research enabled)
    const userRows = await sql`SELECT plan FROM users WHERE id = ${auth.userId}`
    const userPlan = userRows[0]?.plan || 'FREE'
    const isPaid = userPlan !== 'FREE'

    // Decrypt contact PII
    const firstName = decryptOptional(contact.first_name) || 'there'
    const lastName = decryptOptional(contact.last_name) || ''
    const companyName = contact.company_name || 'Unknown'
    const title = contact.title || 'Professional'

    await sql`UPDATE campaigns SET status = 'generating', updated_at = NOW() WHERE id = ${campaignId}`

    // === STEP 1: Research via Perplexity ===
    const companyResearch = await researchCompany(companyName, firstName, title)

    // Person research — paid plans only
    let personResearch: string | undefined
    if (isPaid) {
      try {
        const fullName = `${firstName} ${lastName}`.trim()
        personResearch = await researchPerson(fullName, title, companyName)
        // Skip if nothing useful found
        if (personResearch?.includes('No professional public statements found')) {
          personResearch = undefined
        }
      } catch {
        // Person research is optional, continue without it
      }
    }

    const researchFactCount = countFacts(companyResearch + (personResearch || ''))

    // Store research
    const researchData = JSON.stringify({ company: companyResearch, person: personResearch || null })
    try {
      await sql`UPDATE contacts SET research_data = ${researchData} WHERE id = ${contact.id}`
    } catch {
      try { await sql`UPDATE contacts SET research_data = ${JSON.parse(researchData)}::jsonb WHERE id = ${contact.id}` } catch {}
    }

    // === STEP 2: Generate email via DeepSeek ===
    const email = await generateColdEmail({
      firstName,
      lastName: lastName || undefined,
      title,
      company: companyName,
      companyResearch,
      personResearch,
      senderName: campaign.sender_name || 'Team',
      productDescription: campaign.product_description || '',
      callToAction: campaign.call_to_action || 'Would you be open to a quick chat?',
    })

    // === STEP 3: Score the first draft ===
    const contactFullName = `${firstName} ${lastName}`.trim()
    const firstDraftScoreResult = scoreEmail(email.subject, email.body, contactFullName, companyName)
    const firstDraftScore = firstDraftScoreResult.overall

    // === STEP 4: Auto-revise if score < 75 ===
    let finalSubject = email.subject
    let finalBody = email.body
    let finalScoreResult = firstDraftScoreResult
    let autoRevised = false

    if (firstDraftScore < 75) {
      try {
        const revised = await autoRevise(
          email.subject, email.body,
          firstDraftScoreResult,
          companyResearch,
          firstName, companyName
        )
        if (revised.subject && revised.body) {
          finalSubject = revised.subject
          finalBody = revised.body
          finalScoreResult = scoreEmail(finalSubject, finalBody, contactFullName, companyName)
          autoRevised = true
        }
      } catch {
        // Revision failed, keep original
      }
    }

    const finalScore = finalScoreResult.overall
    const hookType = detectHookType(finalBody)

    // === STEP 5: Store encrypted email with scoring metadata ===
    await sql`
      INSERT INTO email_sends (
        user_id, campaign_id, contact_id, subject, body, status, ai_research,
        first_draft_score, final_score, auto_revised, hook_type, research_fact_count
      ) VALUES (
        ${auth.userId}, ${campaignId}, ${contact.id},
        ${encrypt(finalSubject)}, ${encrypt(finalBody)},
        'draft', ${researchData},
        ${firstDraftScore}, ${finalScore}, ${autoRevised}, ${hookType}, ${researchFactCount}
      )
    `

    await deductCredits(auth.userId, 1)

    await sql`
      UPDATE campaigns SET emails_generated = emails_generated + 1, updated_at = NOW()
      WHERE id = ${campaignId}
    `

    // Count remaining
    const remainingRows = await sql`
      SELECT COUNT(*) as cnt FROM contacts c
      LEFT JOIN email_sends es ON es.contact_id = c.id AND es.campaign_id = ${campaignId}
      WHERE c.campaign_id = ${campaignId} AND c.user_id = ${auth.userId} AND es.id IS NULL
    `
    const remaining = Number(remainingRows[0].cnt)

    if (remaining === 0) {
      await sql`UPDATE campaigns SET status = 'ready', updated_at = NOW() WHERE id = ${campaignId}`
    }

    return NextResponse.json({
      generated: 1,
      remaining,
      done: remaining === 0,
      contact: `${firstName} ${lastName}`.trim(),
      company: companyName,
      researchSummary: companyResearch.slice(0, 200),
      researchFactCount,
      hookType,
      firstDraftScore,
      finalScore,
      autoRevised,
    })

  } catch (error) {
    console.error('[Generate] Error:', error)
    return NextResponse.json({
      error: `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 })
  }
}
