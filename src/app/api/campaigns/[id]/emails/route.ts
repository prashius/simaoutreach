import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

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

  return NextResponse.json({ emails })
}
