import sql from '@/lib/db'

export async function checkCredits(userId: string, count: number): Promise<boolean> {
  const rows = await sql`
    SELECT emails_limit, emails_used FROM users WHERE id = ${userId}
  `
  if (rows.length === 0) return false
  const user = rows[0]
  return (user.emails_limit - user.emails_used) >= count
}

export async function deductCredits(userId: string, count: number): Promise<boolean> {
  const result = await sql`
    UPDATE users
    SET emails_used = emails_used + ${count}, updated_at = NOW()
    WHERE id = ${userId}
      AND (emails_limit - emails_used) >= ${count}
    RETURNING id
  `
  return result.length > 0
}

export async function getUsage(userId: string): Promise<{ limit: number; used: number; remaining: number }> {
  const rows = await sql`
    SELECT emails_limit, emails_used FROM users WHERE id = ${userId}
  `
  if (rows.length === 0) return { limit: 0, used: 0, remaining: 0 }
  const user = rows[0]
  return {
    limit: user.emails_limit,
    used: user.emails_used,
    remaining: user.emails_limit - user.emails_used,
  }
}
