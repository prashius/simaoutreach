import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { parseCSV } from '@/lib/csv-parser'
import { checkCredits } from '@/lib/usage'
import { encrypt, hash } from '@/lib/encryption'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuthToken(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: campaignId } = await params

    // Verify campaign ownership
    const campaign = await sql`
      SELECT id FROM campaigns WHERE id = ${campaignId} AND user_id = ${auth.userId}
    `
    if (campaign.length === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Parse multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'CSV file required' }, { status: 400 })
    }

    const csvContent = await file.text()
    const { valid, invalid, duplicates } = parseCSV(csvContent)

    if (valid.length === 0) {
      return NextResponse.json({
        error: 'No valid contacts found in CSV',
        invalid,
        duplicates,
      }, { status: 400 })
    }

    // Check credits
    const hasCredits = await checkCredits(auth.userId, valid.length)
    if (!hasCredits) {
      return NextResponse.json({
        error: `Not enough credits. Need ${valid.length}, check your plan.`,
      }, { status: 402 })
    }

    // Get existing contacts in this campaign for dedup
    let existingEmails = new Set<string>()
    try {
      const existingRows = await sql`
        SELECT email_hash FROM contacts WHERE campaign_id = ${campaignId} AND email_hash IS NOT NULL
      `
      existingEmails = new Set(existingRows.map((r: any) => r.email_hash))
    } catch {
      // email_hash column might not exist yet — fall back to plain email dedup
      try {
        const existingRows = await sql`SELECT email FROM contacts WHERE campaign_id = ${campaignId}`
        existingEmails = new Set(existingRows.map((r: any) => hash(r.email)))
      } catch {
        // No contacts yet, proceed
      }
    }

    // Get excluded emails
    let excludedHashes = new Set<string>()
    try {
      const excludedRows = await sql`SELECT email FROM excluded_emails WHERE user_id = ${auth.userId}`
      excludedHashes = new Set(excludedRows.map((r: any) => hash(r.email)))
    } catch {
      // No excluded emails table or empty
    }

    // Filter
    const newContacts = valid.filter(c => {
      const h = hash(c.email)
      return !existingEmails.has(h) && !excludedHashes.has(h)
    })
    const excludedCount = valid.length - newContacts.length - (valid.length - newContacts.length > 0 ? 0 : 0)

    // Insert contacts with encrypted PII
    let inserted = 0
    for (const contact of newContacts) {
      try {
        const emailHash = hash(contact.email)
        const encryptedEmail = encrypt(contact.email)
        const encryptedFirstName = contact.first_name ? encrypt(contact.first_name) : null
        const encryptedLastName = contact.last_name ? encrypt(contact.last_name) : null

        await sql`
          INSERT INTO contacts (user_id, campaign_id, email, email_hash, first_name, last_name, company_name, title)
          VALUES (${auth.userId}, ${campaignId}, ${encryptedEmail}, ${emailHash}, ${encryptedFirstName}, ${encryptedLastName}, ${contact.company_name}, ${contact.title})
        `
        inserted++
      } catch (err) {
        // If email_hash column doesn't exist, try without it
        const encryptedEmail = encrypt(contact.email)
        const encryptedFirstName = contact.first_name ? encrypt(contact.first_name) : null
        const encryptedLastName = contact.last_name ? encrypt(contact.last_name) : null

        await sql`
          INSERT INTO contacts (user_id, campaign_id, email, first_name, last_name, company_name, title)
          VALUES (${auth.userId}, ${campaignId}, ${encryptedEmail}, ${encryptedFirstName}, ${encryptedLastName}, ${contact.company_name}, ${contact.title})
        `
        inserted++
      }
    }

    // Update campaign total
    await sql`
      UPDATE campaigns
      SET total_contacts = total_contacts + ${inserted}, updated_at = NOW()
      WHERE id = ${campaignId}
    `

    return NextResponse.json({
      inserted,
      duplicatesInFile: duplicates,
      invalidRows: invalid.length,
      excludedEmails: excludedCount,
      alreadyInCampaign: valid.length - newContacts.length,
      invalid: invalid.slice(0, 10),
    })
  } catch (error) {
    console.error('[Upload] Error:', error)
    return NextResponse.json({
      error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 })
  }
}
