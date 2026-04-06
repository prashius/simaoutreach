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

  await transporter.sendMail({
    from: fromStr,
    to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
    subject: opts.subject,
    text: opts.body,
    messageId,
    headers,
  })

  return { messageId }
}
