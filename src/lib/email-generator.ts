import sql from '@/lib/db'
import { researchCompany, researchPerson } from '@/lib/perplexity'
import { generateColdEmail } from '@/lib/groq'

interface GenerateOptions {
  campaignId: string
  userId: string
  mode: 'simple' | 'deep'
  senderName: string
  senderTitle?: string
  productDescription: string
  callToAction: string
}

/**
 * Generate personalized emails for all contacts in a campaign.
 * Returns count of successfully generated emails.
 */
export async function generateEmailsForCampaign(opts: GenerateOptions): Promise<{
  generated: number
  failed: number
  errors: string[]
}> {
  // Get all contacts without emails yet
  const contacts = await sql`
    SELECT c.* FROM contacts c
    LEFT JOIN email_sends es ON es.contact_id = c.id AND es.campaign_id = ${opts.campaignId}
    WHERE c.campaign_id = ${opts.campaignId}
      AND c.user_id = ${opts.userId}
      AND es.id IS NULL
    ORDER BY c.id
  `

  let generated = 0
  let failed = 0
  const errors: string[] = []

  for (const contact of contacts) {
    try {
      // Step 1: Research via Perplexity
      const companyResearch = await researchCompany(
        contact.company_name || 'Unknown',
        contact.first_name || '',
        contact.title || ''
      )

      let personResearch: string | undefined
      if (opts.mode === 'deep') {
        try {
          personResearch = await researchPerson(
            `${contact.first_name} ${contact.last_name || ''}`.trim(),
            contact.title || '',
            contact.company_name || ''
          )
        } catch {
          // Person research is optional, continue without it
        }
      }

      // Store research on contact
      await sql`
        UPDATE contacts
        SET research_data = ${JSON.stringify({ company: companyResearch, person: personResearch })}
        WHERE id = ${contact.id}
      `

      // Step 2: Generate email via Groq
      const email = await generateColdEmail({
        firstName: contact.first_name || 'there',
        lastName: contact.last_name || undefined,
        title: contact.title || 'Professional',
        company: contact.company_name || 'your company',
        companyResearch,
        personResearch,
        senderName: opts.senderName,
        senderTitle: opts.senderTitle,
        productDescription: opts.productDescription,
        callToAction: opts.callToAction,
      })

      // Step 3: Insert email_send record
      await sql`
        INSERT INTO email_sends (user_id, campaign_id, contact_id, subject, body, status, ai_research)
        VALUES (
          ${opts.userId},
          ${opts.campaignId},
          ${contact.id},
          ${email.subject},
          ${email.body},
          'draft',
          ${JSON.stringify({ company: companyResearch, person: personResearch })}
        )
      `

      generated++

      // Update campaign count
      await sql`
        UPDATE campaigns
        SET emails_generated = emails_generated + 1, updated_at = NOW()
        WHERE id = ${opts.campaignId}
      `
    } catch (err) {
      failed++
      const msg = `Failed for ${contact.email}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`[EmailGenerator] ${msg}`)
    }
  }

  // Update campaign status
  const newStatus = generated > 0 ? 'ready' : 'draft'
  await sql`
    UPDATE campaigns SET status = ${newStatus}, updated_at = NOW()
    WHERE id = ${opts.campaignId}
  `

  return { generated, failed, errors }
}
