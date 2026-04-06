import Papa from 'papaparse'

export interface ParsedContact {
  first_name: string
  last_name: string
  email: string
  company_name: string
  title: string
}

interface ParseResult {
  valid: ParsedContact[]
  invalid: { row: number; reason: string }[]
  duplicates: number
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Map common CSV header variations to our standard fields
const HEADER_MAP: Record<string, string> = {
  'first name': 'first_name',
  'firstname': 'first_name',
  'first_name': 'first_name',
  'last name': 'last_name',
  'lastname': 'last_name',
  'last_name': 'last_name',
  'email': 'email',
  'email address': 'email',
  'company': 'company_name',
  'company name': 'company_name',
  'company_name': 'company_name',
  'organization': 'company_name',
  'title': 'title',
  'job title': 'title',
  'job_title': 'title',
  'position': 'title',
  'role': 'title',
}

export function parseCSV(csvContent: string): ParseResult {
  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      const normalized = header.toLowerCase().trim()
      return HEADER_MAP[normalized] || normalized
    },
  })

  if (errors.length > 0) {
    console.error('CSV parse errors:', errors)
  }

  const valid: ParsedContact[] = []
  const invalid: { row: number; reason: string }[] = []
  const seenEmails = new Set<string>()
  let duplicates = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, string>
    const rowNum = i + 2 // 1-indexed + header row

    const email = (row.email || '').trim().toLowerCase()

    if (!email) {
      invalid.push({ row: rowNum, reason: 'Missing email' })
      continue
    }

    if (!EMAIL_REGEX.test(email)) {
      invalid.push({ row: rowNum, reason: `Invalid email: ${email}` })
      continue
    }

    if (seenEmails.has(email)) {
      duplicates++
      continue
    }
    seenEmails.add(email)

    valid.push({
      first_name: (row.first_name || '').trim(),
      last_name: (row.last_name || '').trim(),
      email,
      company_name: (row.company_name || '').trim(),
      title: (row.title || '').trim(),
    })
  }

  return { valid, invalid, duplicates }
}
