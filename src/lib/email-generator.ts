import sql from '@/lib/db'
import { researchCompany, researchPerson } from '@/lib/perplexity'
import { generateColdEmail } from '@/lib/groq'
import { decrypt, decryptOptional, encrypt, encryptJson } from '@/lib/encryption'

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
 * Decrypts contact PII for AI generation, encrypts output before storing.
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
      // Decrypt contact PII for AI use
      const firstName = decryptOptional(contact.first_name) || 'there'
      const lastName = decryptOptional(contact.last_name) || ''
      const email = decrypt(contact.email)
      const companyName = contact.company_name || 'Unknown'
      const title = contact.title || 'Professional'

      // Step 1: Research via Perplexity (uses plain text for search)
      const companyResearch = await researchCompany(companyName, firstName, title)

      let personResearch: string | undefined
      if (opts.mode === 'deep') {
        try {
          personResearch = await researchPerson(
            `${firstName} ${lastName}`.trim(),
            title,
            companyName
          )
        } catch {
          // Person research is optional
        }
      }

      // Store encrypted research on contact
      const researchData = { company: companyResearch, person: personResearch }
      await sql`
        UPDATE contacts
        SET research_data = ${encryptJson(researchData)}
        WHERE id = ${contact.id}
      `

      // Step 2: Generate email via DeepSeek
      const generatedEmail = await generateColdEmail({
        firstName,
        lastName: lastName || undefined,
        title,
        company: companyName,
        companyResearch,
        personResearch,
        senderName: opts.senderName,
        senderTitle: opts.senderTitle,
        productDescription: opts.productDescription,
        callToAction: opts.callToAction,
      })

      // Step 3: Store encrypted email content
      await sql`
        INSERT INTO email_sends (user_id, campaign_id, contact_id, subject, body, status, ai_research)
        VALUES (
          ${opts.userId},
          ${opts.campaignId},
          ${contact.id},
          ${encrypt(generatedEmail.subject)},
          ${encrypt(generatedEmail.body)},
          'draft',
          ${encryptJson(researchData)}
        )
      `

      generated++

      await sql`
        UPDATE campaigns
        SET emails_generated = emails_generated + 1, updated_at = NOW()
        WHERE id = ${opts.campaignId}
      `
    } catch (err) {
      failed++
      const msg = `Failed for contact ${contact.id}: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      console.error(`[EmailGenerator] ${msg}`)
    }
  }

  const newStatus = generated > 0 ? 'ready' : 'draft'
  await sql`
    UPDATE campaigns SET status = ${newStatus}, updated_at = NOW()
    WHERE id = ${opts.campaignId}
  `

  return { generated, failed, errors }
}
