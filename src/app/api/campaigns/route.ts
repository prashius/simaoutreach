import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

// GET - list campaigns
export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaigns = await sql`
    SELECT * FROM campaigns
    WHERE user_id = ${auth.userId}
    ORDER BY created_at DESC
  `

  return NextResponse.json({ campaigns })
}

// POST - create campaign
export async function POST(request: NextRequest) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, mode, senderName, senderEmail, productDescription, callToAction } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Campaign name required' }, { status: 400 })
  }

  const result = await sql`
    INSERT INTO campaigns (user_id, name, mode, sender_name, sender_email, product_description, call_to_action)
    VALUES (${auth.userId}, ${name}, ${mode || 'simple'}, ${senderName || null}, ${senderEmail || null}, ${productDescription || null}, ${callToAction || null})
    RETURNING *
  `

  return NextResponse.json({ campaign: result[0] }, { status: 201 })
}
