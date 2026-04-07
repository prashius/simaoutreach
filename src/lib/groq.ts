import axios from 'axios'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'

interface GeneratedEmail {
  subject: string
  body: string
}

/**
 * Generate a personalized cold email using DeepSeek
 */
export async function generateColdEmail(opts: {
  firstName: string
  lastName?: string
  title: string
  company: string
  companyResearch: string
  personResearch?: string
  senderName: string
  senderTitle?: string
  productDescription: string
  callToAction: string
}): Promise<GeneratedEmail> {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY not configured')

  const hasPersonResearch = opts.personResearch && !opts.personResearch.includes('No professional public statements found')

  const systemPrompt = `You are writing a cold outreach email. Write a short, personalized cold email that feels founder-to-founder, not salesy.

RULES:
- Start with "Hi ${opts.firstName},"
- Para 1 (2-3 sentences): Reference a SPECIFIC fact from the research — use actual numbers ($amounts, %growth, user counts, dates, product names). If the research mentions "$14M Series A" or "500+ customers" or "launched in 2024" — USE those exact figures. This is what makes the email feel researched, not templated.
- Para 2 (2-3 sentences): Pitch the product naturally. Mention the product by name. Connect it to a specific problem the contact's company would face given what the research revealed.
- Para 3 (1-2 sentences): Soft CTA using the call-to-action provided.
- Sign off with sender name only.
- HARD limit: 150 words. No buzzwords, no emojis, plain text only.
- NEVER invent facts not in the research. But DO use every specific number/date/product name the research provides.
- ANTI-CREEP RULE: Never reference personal life details. Only professional content.
- Subject line: UNIQUE to this contact. Include a specific number or product name from the research. Under 10 words, lowercase feel.

Return JSON: {"subject": "...", "body": "..."}`

  const userPrompt = `CONTACT:
- Name: ${opts.firstName} ${opts.lastName || ''}
- Title: ${opts.title}
- Company: ${opts.company}

COMPANY RESEARCH:
${opts.companyResearch}
${hasPersonResearch ? `\nPERSON'S PROFESSIONAL VOICE:\n${opts.personResearch}` : ''}

PRODUCT DESCRIPTION:
${opts.productDescription}

CALL TO ACTION:
${opts.callToAction}

SENDER: ${opts.senderName}${opts.senderTitle ? `, ${opts.senderTitle}` : ''}

Generate the cold email. Return ONLY JSON.`

  const response = await axios.post(
    `${DEEPSEEK_API_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    }
  )

  const content = response.data.choices[0].message.content
  let parsed: GeneratedEmail

  try {
    let jsonStr = content
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim()
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim()
    }
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse AI response')
  }

  return {
    subject: parsed.subject || 'Following up',
    body: parsed.body || content,
  }
}
