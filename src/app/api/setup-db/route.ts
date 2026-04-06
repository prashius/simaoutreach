import { NextResponse } from 'next/server'
import sql from '@/lib/db'

// Run once to set up the database schema
// DELETE this route after initial setup
export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE NOT NULL,
        name          TEXT,
        avatar_url    TEXT,
        plan          TEXT DEFAULT 'FREE',
        emails_limit  INTEGER DEFAULT 0,
        emails_used   INTEGER DEFAULT 0,
        plan_start    TIMESTAMPTZ,
        plan_end      TIMESTAMPTZ,
        smtp_host     TEXT,
        smtp_port     INTEGER,
        smtp_user     TEXT,
        smtp_pass     TEXT,
        smtp_from     TEXT,
        smtp_from_name TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id       TEXT NOT NULL REFERENCES users(id),
        name          TEXT NOT NULL,
        status        TEXT DEFAULT 'draft',
        mode          TEXT DEFAULT 'simple',
        sender_name   TEXT,
        sender_email  TEXT,
        product_description TEXT,
        call_to_action TEXT,
        total_contacts INTEGER DEFAULT 0,
        emails_generated INTEGER DEFAULT 0,
        emails_approved INTEGER DEFAULT 0,
        emails_sent   INTEGER DEFAULT 0,
        emails_replied INTEGER DEFAULT 0,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id),
        campaign_id   TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        email         TEXT NOT NULL,
        first_name    TEXT,
        last_name     TEXT,
        company_name  TEXT,
        title         TEXT,
        research_data JSONB,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS email_sends (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id),
        campaign_id   TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        contact_id    INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        subject       TEXT,
        body          TEXT,
        send_type     TEXT DEFAULT 'initial',
        status        TEXT DEFAULT 'draft',
        ai_research   JSONB,
        edited_by_user BOOLEAN DEFAULT false,
        approved_at   TIMESTAMPTZ,
        sent_at       TIMESTAMPTZ,
        failed_reason TEXT,
        message_id    TEXT,
        in_reply_to   TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS excluded_emails (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL REFERENCES users(id),
        email         TEXT NOT NULL,
        reason        TEXT,
        excluded_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, email)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id         TEXT NOT NULL REFERENCES users(id),
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        amount          INTEGER NOT NULL,
        currency        TEXT DEFAULT 'USD',
        plan_type       TEXT NOT NULL,
        status          TEXT DEFAULT 'created',
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Migrations — safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS refinements_used INTEGER DEFAULT 0`
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS refinements_limit INTEGER DEFAULT 30`

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_campaign ON contacts(campaign_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(user_id, email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_excluded_user ON excluded_emails(user_id)`

    return NextResponse.json({ success: true, message: 'Schema created successfully' })
  } catch (error) {
    console.error('Schema setup error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
