export const PLANS = {
  FREE: {
    name: 'Free',
    emails: 5,
    priceUSD: 0,
    priceINR: 0,
    deepResearch: false,
  },
  STARTER: {
    name: 'Starter',
    emails: 50,
    priceUSD: 1900, // cents ($19)
    priceINR: 159900, // paise (₹1,599)
    deepResearch: true,
  },
  GROWTH: {
    name: 'Growth',
    emails: 150,
    priceUSD: 3900, // $39
    priceINR: 329900,
    deepResearch: true,
  },
  PRO: {
    name: 'Pro',
    emails: 400,
    priceUSD: 7900, // $79
    priceINR: 659900,
    deepResearch: true,
  },
} as const

export type PlanType = keyof typeof PLANS
