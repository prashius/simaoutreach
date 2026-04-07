import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { decryptOptional } from '@/lib/encryption'

function decryptEmail(row: any) {
  return {
    ...row,
    subject: decryptOptional(row.subject),
    body: decryptOptional(row.body),
    contact_email: decryptOptional(row.contact_email),
    contact_first_name: decryptOptional(row.contact_first_name),
    contact_last_name: decryptOptional(row.contact_last_name),
    // company_name and title are not encrypted
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: campaignId } = await params
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let emails
  if (status) {
    emails = await sql`
      SELECT es.*, c.email as contact_email, c.first_name as contact_first_name,
             c.last_name as contact_last_name, c.company_name as contact_company,
             c.title as contact_title
      FROM email_sends es
      JOIN contacts c ON c.id = es.contact_id
      WHERE es.campaign_id = ${campaignId} AND es.user_id = ${auth.userId}
        AND es.status = ${status}
      ORDER BY es.id
    `
  } else {
    emails = await sql`
      SELECT es.*, c.email as contact_email, c.first_name as contact_first_name,
             c.last_name as contact_last_name, c.company_name as contact_company,
             c.title as contact_title
      FROM email_sends es
      JOIN contacts c ON c.id = es.contact_id
      WHERE es.campaign_id = ${campaignId} AND es.user_id = ${auth.userId}
      ORDER BY es.id
    `
  }

  // Decrypt PII before sending to client
  const decrypted = emails.map(decryptEmail)

  return NextResponse.json({ emails: decrypted })
}
