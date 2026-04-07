import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

/**
 * Click tracking redirect.
 * GET /t/:sendId/:trackId → log click → 301 redirect to original URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string; trackId: string }> }
) {
  const { sendId, trackId } = await params

  try {
    // Get original URL
    const rows = await sql`
      SELECT original_url FROM click_tracking WHERE id = ${Number(trackId)} AND email_send_id = ${Number(sendId)}
    `

    if (rows.length === 0) {
      return NextResponse.redirect('https://simaoutreach.com', { status: 302 })
    }

    const originalUrl = rows[0].original_url

    // Log click
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ua = request.headers.get('user-agent') || 'unknown'

    await sql`
      UPDATE click_tracking
      SET clicked_at = COALESCE(clicked_at, NOW()),
          click_count = click_count + 1,
          ip_address = ${ip},
          user_agent = ${ua}
      WHERE id = ${Number(trackId)}
    `

    // Update email send click count
    await sql`
      UPDATE email_sends
      SET click_count = COALESCE(click_count, 0) + 1
      WHERE id = ${Number(sendId)}
    `

    return NextResponse.redirect(originalUrl, { status: 301 })
  } catch (error) {
    console.error('[ClickTrack] Error:', error)
    return NextResponse.redirect('https://simaoutreach.com', { status: 302 })
  }
}
