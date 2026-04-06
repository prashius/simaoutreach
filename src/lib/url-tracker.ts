import sql from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://simaoutreach.com'

/**
 * Wrap all URLs in email body with click tracking redirects.
 * Plain text friendly — replaces URLs inline.
 *
 * Before: "Check this out: https://example.com/demo"
 * After:  "Check this out: https://simaoutreach.com/t/SEND_ID/1"
 */
export async function wrapUrlsForTracking(
  body: string,
  emailSendId: number,
  userId: string,
  campaignId: string
): Promise<string> {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/g
  const urls = body.match(urlRegex)

  if (!urls || urls.length === 0) return body

  let wrappedBody = body
  const uniqueUrls = [...new Set(urls)]

  for (let i = 0; i < uniqueUrls.length; i++) {
    const originalUrl = uniqueUrls[i]

    // Don't wrap our own tracking URLs
    if (originalUrl.includes('/t/')) continue

    // Insert tracking record
    const rows = await sql`
      INSERT INTO click_tracking (email_send_id, user_id, campaign_id, original_url, link_index)
      VALUES (${emailSendId}, ${userId}, ${campaignId}, ${originalUrl}, ${i})
      RETURNING id
    `
    const trackingId = rows[0].id

    // Replace URL with tracking URL
    const trackingUrl = `${BASE_URL}/t/${emailSendId}/${trackingId}`
    wrappedBody = wrappedBody.replace(originalUrl, trackingUrl)
  }

  return wrappedBody
}
