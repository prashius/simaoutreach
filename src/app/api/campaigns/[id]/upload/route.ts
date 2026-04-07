import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { parseCSV } from '@/lib/csv-parser'
import { checkCredits } from '@/lib/usage'
import { encrypt, hash } from '@/lib/encryption'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Filter against excluded emails (match by hash)
  const excludedRows = await sql`
    SELECT email_hash FROM excluded_emails WHERE user_id = ${auth.userId} AND email_hash IS NOT NULL
  `
  // Also check plain text for backwards compat
  const excludedPlainRows = await sql`
    SELECT email FROM excluded_emails WHERE user_id = ${auth.userId} AND email_hash IS NULL
  `
  const excludedHashes = new Set(excludedRows.map((r: any) => r.email_hash))
  const excludedPlain = new Set(excludedPlainRows.map((r: any) => r.email.toLowerCase()))

  const filtered = valid.filter(c => {
    const emailHash = hash(c.email)
    return !excludedHashes.has(emailHash) && !excludedPlain.has(c.email.toLowerCase())
  })
  const excludedCount = valid.length - filtered.length

  // Check for contacts already in this campaign (match by hash)
  const existingRows = await sql`
    SELECT email_hash FROM contacts WHERE campaign_id = ${campaignId} AND email_hash IS NOT NULL
  `
  const existingPlainRows = await sql`
    SELECT email FROM contacts WHERE campaign_id = ${campaignId} AND email_hash IS NULL
  `
  const existingHashes = new Set(existingRows.map((r: any) => r.email_hash))
  const existingPlain = new Set(existingPlainRows.map((r: any) => r.email.toLowerCase()))

  const newContacts = filtered.filter(c => {
    const emailHash = hash(c.email)
    return !existingHashes.has(emailHash) && !existingPlain.has(c.email.toLowerCase())
  })
  const alreadyInCampaign = filtered.length - newContacts.length

  // Insert contacts with encrypted PII
  let inserted = 0
  for (const contact of newContacts) {
    const emailHash = hash(contact.email)
    const encryptedEmail = encrypt(contact.email)
    const encryptedFirstName = contact.first_name ? encrypt(contact.first_name) : null
    const encryptedLastName = contact.last_name ? encrypt(contact.last_name) : null

    await sql`
      INSERT INTO contacts (user_id, campaign_id, email, email_hash, first_name, last_name, company_name, title)
      VALUES (${auth.userId}, ${campaignId}, ${encryptedEmail}, ${emailHash}, ${encryptedFirstName}, ${encryptedLastName}, ${contact.company_name}, ${contact.title})
    `
    inserted++
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
    alreadyInCampaign,
    invalid: invalid.slice(0, 10),
  })
}
