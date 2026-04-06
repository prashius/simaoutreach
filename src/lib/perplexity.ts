import axios from 'axios'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

/**
 * Research a prospect's company using Perplexity web search
 */
export async function researchCompany(
  company: string,
  name: string,
  title: string
): Promise<string> {
  if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured')

  const query = `Find: (1) what ${company} does in one clear sentence, (2) any recent funding rounds, Series, seed, or acquisition news with amounts and dates, (3) any major product launches, partnerships, or press coverage in the last 12 months, (4) any notable growth signals — headcount, customer wins, market expansion. Be factual and specific — include numbers and dates where available. 150 words max. Only include facts you actually found, no fabrications.`

  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model: 'sonar',
      messages: [
        { role: 'user', content: query }
      ],
      max_tokens: 300,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
    }
  )

  return response.data.choices[0].message.content
}

/**
 * Research a prospect's professional public statements
 */
export async function researchPerson(
  name: string,
  title: string,
  company: string
): Promise<string> {
  if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured')

  const query = `Find professional public statements by ${name}, ${title} at ${company}. Look ONLY for: podcast interviews, conference talks, published articles or blog posts, press quotes, or public professional commentary they have made about their industry or role. Do NOT include: personal social media posts, personal life details, hobbies, family, lifestyle. If you find a relevant quote or professional opinion they expressed, summarize it in 1-2 sentences. If you find nothing professionally published, say 'No professional public statements found.' 50 words max. Only include what you actually found.`

  const response = await axios.post(
    'https://api.perplexity.ai/chat/completions',
    {
      model: 'sonar',
      messages: [
        { role: 'user', content: query }
      ],
      max_tokens: 150,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
    }
  )

  return response.data.choices[0].message.content
}
