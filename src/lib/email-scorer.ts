export interface EmailScore {
  overall: number
  personalization: { score: number; tips: string[] }
  spamRisk: { score: number; level: 'Low' | 'Medium' | 'High'; triggers: string[] }
  readability: { score: number; wordCount: number; avgSentenceLength: number; grade: string }
  ctaClarity: { score: number; hasCta: boolean; ctaType: string }
  subjectLine: { score: number; length: number; hasPersonalization: boolean; tips: string[] }
}

const SPAM_WORDS = [
  'free', 'act now', 'limited time', 'guaranteed', 'urgent', 'winner',
  'congratulations', 'click here', 'buy now', 'discount', 'offer',
  'amazing', 'incredible', 'exclusive', 'no obligation', 'risk free',
  'double your', 'earn extra', 'be your own boss', 'cash bonus',
]

const CTA_PATTERNS = [
  { pattern: /would you be open to/i, type: 'Soft Ask' },
  { pattern: /can we schedule/i, type: 'Question' },
  { pattern: /let me know/i, type: 'Soft Ask' },
  { pattern: /worth a (chat|call|look|conversation)/i, type: 'Soft Ask' },
  { pattern: /interested in/i, type: 'Soft Ask' },
  { pattern: /15.?min/i, type: 'Question' },
  { pattern: /quick (call|chat|demo)/i, type: 'Question' },
  { pattern: /happy to (show|demo|set up|walk)/i, type: 'Soft Ask' },
  { pattern: /reply (and|if|to)/i, type: 'Soft Ask' },
  { pattern: /book a/i, type: 'Hard Ask' },
  { pattern: /sign up/i, type: 'Hard Ask' },
  { pattern: /free trial/i, type: 'Hard Ask' },
  { pattern: /\?[\s]*$/m, type: 'Question' },
]

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function scorePersonalization(subject: string, body: string, contactName?: string, companyName?: string): { score: number; tips: string[] } {
  let score = 0
  const tips: string[] = []
  const bodyLower = body.toLowerCase()
  const subjectLower = subject.toLowerCase()

  // Company mention in body
  if (companyName && bodyLower.includes(companyName.toLowerCase())) {
    score += 30
  } else {
    tips.push('Mention the company name in the email body')
  }

  // Contact name beyond greeting (check if name appears after first line)
  if (contactName) {
    const nameLower = contactName.toLowerCase().split(' ')[0]
    const lines = body.split('\n').filter(l => l.trim())
    const bodyWithoutGreeting = lines.slice(1).join(' ').toLowerCase()
    if (bodyWithoutGreeting.includes(nameLower)) {
      score += 20
    }
  }

  // Specific facts: numbers, dollars, percentages, dates
  const factPatterns = /\$[\d,.]+|\d+%|\d{4}|\d+[kKmMbB]\+?|\d+\s*(million|billion|employees|customers|users|countries)/i
  if (factPatterns.test(body)) {
    score += 20
  } else {
    tips.push('Include specific numbers, metrics, or dates from research')
  }

  // Specific product/technology/service references
  const techWords = body.match(/\b(platform|software|tool|app|product|API|SaaS|AI|machine learning|automation|integration|dashboard|analytics)\b/gi)
  if (techWords && techWords.length >= 2) {
    score += 15
  } else {
    tips.push('Reference a specific product or technology the prospect uses')
  }

  // Subject personalization
  if (companyName && subjectLower.includes(companyName.toLowerCase())) {
    score += 15
  } else if (contactName && subjectLower.includes(contactName.toLowerCase().split(' ')[0])) {
    score += 15
  } else {
    tips.push('Include company or person name in subject line')
  }

  return { score: clamp(score), tips }
}

function scoreSpamRisk(subject: string, body: string): { score: number; level: 'Low' | 'Medium' | 'High'; triggers: string[] } {
  let score = 0
  const triggers: string[] = []
  const fullText = (subject + ' ' + body).toLowerCase()

  // Spam words
  for (const word of SPAM_WORDS) {
    if (fullText.includes(word)) {
      score += 15
      triggers.push(word.toUpperCase())
    }
  }

  // Excessive caps
  const words = body.split(/\s+/)
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w))
  if (capsWords.length / Math.max(words.length, 1) > 0.2) {
    score += 20
    triggers.push('Excessive capitalization')
  }

  // Excessive exclamation marks
  const exclamations = (body.match(/!/g) || []).length
  if (exclamations > 2) {
    score += 15
    triggers.push(`${exclamations} exclamation marks`)
  }

  // Excessive links
  const links = (body.match(/https?:\/\//g) || []).length
  if (links > 3) {
    score += 20
    triggers.push(`${links} links (keep under 3)`)
  }

  score = clamp(score)
  const level = score < 30 ? 'Low' : score < 60 ? 'Medium' : 'High'
  return { score, level, triggers }
}

function scoreReadability(body: string): { score: number; wordCount: number; avgSentenceLength: number; grade: string } {
  const words = body.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = Math.max(sentences.length, 1)
  const avgSentenceLength = Math.round(wordCount / sentenceCount)
  const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim().length > 0)

  let score = 100

  // Word count scoring
  if (wordCount < 30) score -= 30
  else if (wordCount < 50) score -= 15
  else if (wordCount > 200) score -= 30
  else if (wordCount > 150) score -= 15

  // Sentence length
  if (avgSentenceLength > 25) score -= 20
  else if (avgSentenceLength > 20) score -= 10

  // Paragraph count
  if (paragraphs.length > 6) score -= 15
  else if (paragraphs.length < 2) score -= 10

  let grade: string
  if (wordCount < 80) grade = 'Concise'
  else if (wordCount <= 150) grade = 'Ideal'
  else if (wordCount <= 200) grade = 'Long'
  else grade = 'Too Long'

  return { score: clamp(score), wordCount, avgSentenceLength, grade }
}

function scoreCtaClarity(body: string): { score: number; hasCta: boolean; ctaType: string } {
  let score = 0
  let ctaType = 'None'
  let hasCta = false

  for (const { pattern, type } of CTA_PATTERNS) {
    if (pattern.test(body)) {
      hasCta = true
      ctaType = type
      score += 50
      break
    }
  }

  if (!hasCta) {
    return { score: 0, hasCta: false, ctaType: 'None' }
  }

  // CTA is a question
  const lastParagraph = body.split(/\n\s*\n/).filter(p => p.trim()).pop() || ''
  if (lastParagraph.includes('?')) {
    score += 25
  }

  // CTA is specific (mentions time)
  if (/\d+\s*min|quick call|this week|next week|tomorrow/i.test(body)) {
    score += 25
  }

  return { score: clamp(score), hasCta, ctaType }
}

function scoreSubjectLine(subject: string, contactName?: string, companyName?: string): { score: number; length: number; hasPersonalization: boolean; tips: string[] } {
  const tips: string[] = []
  const words = subject.split(/\s+/).filter(Boolean)
  const length = words.length
  let score = 50 // base

  // Length scoring
  if (length >= 3 && length <= 8) score += 20
  else if (length > 10) { score -= 15; tips.push('Shorten subject to under 8 words') }
  else if (length < 2) { score -= 20; tips.push('Subject too short — add specifics') }

  // Personalization
  const subjectLower = subject.toLowerCase()
  const hasPersonalization = Boolean(
    (companyName && subjectLower.includes(companyName.toLowerCase())) ||
    (contactName && subjectLower.includes(contactName.toLowerCase().split(' ')[0]))
  )
  if (hasPersonalization) score += 20
  else tips.push('Include company or person name in subject')

  // Lowercase feel (not Title Case)
  const titleCaseWords = words.filter(w => w.length > 3 && w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase())
  if (titleCaseWords.length / Math.max(words.length, 1) < 0.5) score += 10

  // Spam words in subject
  for (const word of SPAM_WORDS) {
    if (subjectLower.includes(word)) {
      score -= 30
      tips.push(`Remove spam trigger: "${word}"`)
      break
    }
  }

  // Fake threading
  if (subjectLower.startsWith('re:')) {
    score -= 20
    tips.push('Remove fake "Re:" — it can trigger spam filters')
  }

  return { score: clamp(score), length, hasPersonalization, tips }
}

export function scoreEmail(subject: string, body: string, contactName?: string, companyName?: string): EmailScore {
  const personalization = scorePersonalization(subject, body, contactName, companyName)
  const spamRisk = scoreSpamRisk(subject, body)
  const readability = scoreReadability(body)
  const ctaClarity = scoreCtaClarity(body)
  const subjectLine = scoreSubjectLine(subject, contactName, companyName)

  // Overall: weighted average (spam is inverted — low spam = high score)
  const spamSafety = 100 - spamRisk.score
  const overall = Math.round(
    personalization.score * 0.30 +
    spamSafety * 0.20 +
    readability.score * 0.15 +
    ctaClarity.score * 0.20 +
    subjectLine.score * 0.15
  )

  return {
    overall: clamp(overall),
    personalization,
    spamRisk,
    readability,
    ctaClarity,
    subjectLine,
  }
}
