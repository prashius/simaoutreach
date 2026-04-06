import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

/**
 * Open tracking pixel.
 * GET /api/track/open/:sendId → logs open → returns 1x1 transparent GIF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const { sendId } = await params

  try {
    // Record first open only (don't overwrite)
    await sql`
      UPDATE email_sends
      SET opened_at = COALESCE(opened_at, NOW())
      WHERE id = ${Number(sendId)} AND status = 'sent'
    `
  } catch (error) {
    console.error('[OpenTrack] Error:', error)
  }

  // Always return the pixel regardless of DB success
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
