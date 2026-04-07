import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { researchCompany } from '@/lib/perplexity'
import { generateColdEmail } from '@/lib/groq'
import { checkCredits, deductCredits } from '@/lib/usage'
import { decryptOptional, encrypt, encryptJson } from '@/lib/encryption'

/**
 * Generate ONE email per request to stay within Vercel Hobby 10s timeout.
 * Frontend calls this in a loop until all contacts are done.
 *
 * Returns: { generated, remaining, contact, error? }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuthToken(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: campaignId } = await params

    // Verify env vars
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'PERPLEXITY_API_KEY not configured in Vercel' }, { status: 503 })
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured in Vercel' }, { status: 503 })
    }

    // Get campaign
    const rows = await sql`
      SELECT * FROM campaigns WHERE id = ${campaignId} AND user_id = ${auth.userId}
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    const campaign = rows[0]

    // Get NEXT contact without an email (just one)
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
      // All done
      await sql`UPDATE campaigns SET status = 'ready', updated_at = NOW() WHERE id = ${campaignId}`
      return NextResponse.json({ generated: 0, remaining: 0, done: true })
    }

    const contact = contacts[0]

    // Check credits
    const hasCredits = await checkCredits(auth.userId, 1)
    if (!hasCredits) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 402 })
    }

    // Decrypt contact PII
    const firstName = decryptOptional(contact.first_name) || 'there'
    const lastName = decryptOptional(contact.last_name) || ''
    const companyName = contact.company_name || 'Unknown'
    const title = contact.title || 'Professional'

    // Mark campaign as generating
    await sql`UPDATE campaigns SET status = 'generating', updated_at = NOW() WHERE id = ${campaignId}`

    // Step 1: Research via Perplexity
    const companyResearch = await researchCompany(companyName, firstName, title)

    // Store encrypted research
    const researchData = { company: companyResearch }
    await sql`
      UPDATE contacts SET research_data = ${encryptJson(researchData)} WHERE id = ${contact.id}
    `

    // Step 2: Generate email via DeepSeek
    const email = await generateColdEmail({
      firstName,
      lastName: lastName || undefined,
      title,
      company: companyName,
      companyResearch,
      senderName: campaign.sender_name || 'Team',
      productDescription: campaign.product_description || '',
      callToAction: campaign.call_to_action || 'Would you be open to a quick chat?',
    })

    // Step 3: Store encrypted email
    await sql`
      INSERT INTO email_sends (user_id, campaign_id, contact_id, subject, body, status, ai_research)
      VALUES (
        ${auth.userId}, ${campaignId}, ${contact.id},
        ${encrypt(email.subject)}, ${encrypt(email.body)},
        'draft', ${encryptJson(researchData)}
      )
    `

    // Deduct 1 credit
    await deductCredits(auth.userId, 1)

    // Update campaign count
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
      contact: `${firstName} ${lastName} (${companyName})`.trim(),
    })

  } catch (error) {
    console.error('[Generate] Error:', error)
    return NextResponse.json({
      error: `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 })
  }
}
