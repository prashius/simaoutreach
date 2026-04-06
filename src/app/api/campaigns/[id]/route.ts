import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyAuthToken } from '@/lib/jwt-auth'

// GET - campaign detail
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const rows = await sql`
    SELECT * FROM campaigns WHERE id = ${id} AND user_id = ${auth.userId}
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({ campaign: rows[0] })
}

// PATCH - update campaign
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const result = await sql`
    UPDATE campaigns
    SET
      name = COALESCE(${body.name || null}, name),
      mode = COALESCE(${body.mode || null}, mode),
      sender_name = COALESCE(${body.senderName || null}, sender_name),
      sender_email = COALESCE(${body.senderEmail || null}, sender_email),
      product_description = COALESCE(${body.productDescription || null}, product_description),
      call_to_action = COALESCE(${body.callToAction || null}, call_to_action),
      status = COALESCE(${body.status || null}, status),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${auth.userId}
    RETURNING *
  `

  if (result.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({ campaign: result[0] })
}

// DELETE - delete campaign
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthToken(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const result = await sql`
    DELETE FROM campaigns WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id
  `

  if (result.length === 0) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
