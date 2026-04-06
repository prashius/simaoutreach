import nodemailer from 'nodemailer'
import { randomUUID } from 'crypto'

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName?: string
}

interface SendEmailOpts {
  to: string
  toName?: string
  subject: string
  body: string
  inReplyTo?: string
  references?: string
  domain?: string
  openTracking?: {
    enabled: boolean
    sendId: number
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://simaoutreach.com'

/**
 * Convert plain text body to minimal HTML with open tracking pixel.
 * Keeps the email looking like plain text — no styling, no colors.
 */
function toHtmlWithPixel(body: string, sendId: number): string {
  // Escape HTML entities
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Convert newlines to <br> and wrap URLs in <a> tags
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a73e8">$1</a>'
  )

  const pixelUrl = `${BASE_URL}/api/track/open/${sendId}`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;margin:0;padding:20px;">
<div style="max-width:600px;">${withLinks.replace(/\n/g, '<br>')}</div>
<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;" />
</body></html>`
}

export async function sendEmail(config: SmtpConfig, opts: SendEmailOpts) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  const domain = opts.domain || config.from.split('@')[1] || 'simaoutreach.com'
  const messageId = `<${randomUUID()}@${domain}>`

  const headers: Record<string, string> = {}
  if (opts.inReplyTo) {
    headers['In-Reply-To'] = opts.inReplyTo
    headers['References'] = opts.references || opts.inReplyTo
  }

  const fromStr = config.fromName
    ? `"${config.fromName}" <${config.from}>`
    : config.from

  const toStr = opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to

  const mailOpts: any = {
    from: fromStr,
    to: toStr,
    subject: opts.subject,
    text: opts.body, // always include plain text
    messageId,
    headers,
  }

  // If open tracking enabled, send as multipart (HTML + plain text)
  if (opts.openTracking?.enabled) {
    mailOpts.html = toHtmlWithPixel(opts.body, opts.openTracking.sendId)
  }

  await transporter.sendMail(mailOpts)

  return { messageId }
}
