import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT = 'simaoutreach-v1' // static salt, key derivation from env secret

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!secret) throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set')
  return scryptSync(secret, SALT, 32)
}

/**
 * Encrypt a string. Returns base64-encoded string: iv:tag:ciphertext
 */
export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a string. Expects format: iv:tag:ciphertext (hex encoded)
 */
export function decrypt(encryptedText: string): string {
  // If it doesn't look encrypted (no colons), return as-is (backwards compat with plain text)
  if (!encryptedText.includes(':')) return encryptedText

  const key = getKey()
  const parts = encryptedText.split(':')
  if (parts.length !== 3) return encryptedText // not encrypted, return as-is

  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a string looks encrypted (has the iv:tag:ciphertext format)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':')
  return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32
}
