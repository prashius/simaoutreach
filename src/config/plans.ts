export const PLANS = {
  FREE: {
    name: 'Free',
    emails: 0,
    priceUSD: 0,
    priceINR: 0,
  },
  STARTER: {
    name: 'Starter',
    emails: 50,
    priceUSD: 700, // cents
    priceINR: 59900, // paise
  },
  GROWTH: {
    name: 'Growth',
    emails: 200,
    priceUSD: 1900,
    priceINR: 159900,
  },
  PRO: {
    name: 'Pro',
    emails: 500,
    priceUSD: 3900,
    priceINR: 329900,
  },
  SCALE: {
    name: 'Scale',
    emails: 2000,
    priceUSD: 9900,
    priceINR: 829900,
  },
} as const

export type PlanType = keyof typeof PLANS
