import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'
import { generateEmailsForCampaign } from '@/lib/email-generator'
import { checkCredits, deductCredits } from '@/lib/usage'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: campaignId } = await params

  // Get campaign
  const rows = await sql`
    SELECT * FROM campaigns WHERE id = ${campaignId} AND user_id = ${auth.userId}
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const campaign = rows[0]

  // Count contacts needing generation
  const countRows = await sql`
    SELECT COUNT(*) as cnt FROM contacts c
    LEFT JOIN email_sends es ON es.contact_id = c.id AND es.campaign_id = ${campaignId}
    WHERE c.campaign_id = ${campaignId} AND es.id IS NULL
  `
  const pendingCount = Number(countRows[0].cnt)

  if (pendingCount === 0) {
    return NextResponse.json({ error: 'All contacts already have emails generated' }, { status: 400 })
  }

  // Check credits
  const hasCredits = await checkCredits(auth.userId, pendingCount)
  if (!hasCredits) {
    return NextResponse.json({ error: `Not enough credits for ${pendingCount} emails` }, { status: 402 })
  }

  // Mark campaign as generating
  await sql`UPDATE campaigns SET status = 'generating', updated_at = NOW() WHERE id = ${campaignId}`

  // Generate emails
  const result = await generateEmailsForCampaign({
    campaignId,
    userId: auth.userId,
    mode: (campaign.mode as 'simple' | 'deep') || 'simple',
    senderName: campaign.sender_name || 'Team',
    productDescription: campaign.product_description || '',
    callToAction: campaign.call_to_action || 'Would you be open to a quick chat?',
  })

  // Deduct credits for successfully generated emails
  if (result.generated > 0) {
    await deductCredits(auth.userId, result.generated)
  }

  return NextResponse.json(result)
}

export const maxDuration = 300 // 5 minutes for batch generation
