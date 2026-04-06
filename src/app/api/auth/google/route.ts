import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import sql from '@/lib/db'
import { generateToken } from '@/lib/jwt-auth'

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
    }

    // Verify with Google
    const { data: googleUser } = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (!googleUser.email) {
      return NextResponse.json({ error: 'Could not get email from Google' }, { status: 400 })
    }

    const userId = `google_${googleUser.id}`

    // Upsert user
    const existing = await sql`SELECT id FROM users WHERE id = ${userId}`

    if (existing.length === 0) {
      await sql`
        INSERT INTO users (id, email, name, avatar_url, plan, emails_limit)
        VALUES (${userId}, ${googleUser.email}, ${googleUser.name}, ${googleUser.picture}, 'FREE', 5)
      `
    } else {
      await sql`
        UPDATE users
        SET name = ${googleUser.name}, avatar_url = ${googleUser.picture}, updated_at = NOW()
        WHERE id = ${userId}
      `
    }

    const token = generateToken({ userId, email: googleUser.email })

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email: googleUser.email,
        name: googleUser.name,
        avatar_url: googleUser.picture,
      },
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
