import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

/**
 * Click tracking redirect.
 * GET /t/:sendId/:trackingId → logs click → 301 redirect to original URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string; trackingId: string }> }
) {
  const { trackingId } = await params

  try {
    // Fetch original URL and increment click count
    const rows = await sql`
      UPDATE click_tracking
      SET click_count = click_count + 1,
          clicked_at = COALESCE(clicked_at, NOW()),
          ip_address = ${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'},
          user_agent = ${request.headers.get('user-agent') || 'unknown'}
      WHERE id = ${Number(trackingId)}
      RETURNING original_url, email_send_id
    `

    if (rows.length === 0) {
      return NextResponse.redirect('https://simaoutreach.com', 302)
    }

    const { original_url, email_send_id } = rows[0]

    // Update click count on email_sends
    await sql`
      UPDATE email_sends
      SET click_count = COALESCE(click_count, 0) + 1
      WHERE id = ${email_send_id}
    `

    // 301 permanent redirect to original URL
    return NextResponse.redirect(original_url, 301)
  } catch (error) {
    console.error('[ClickTrack] Error:', error)
    return NextResponse.redirect('https://simaoutreach.com', 302)
  }
}
