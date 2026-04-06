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

/**
 * Check if the first row looks like headers or data.
 * If any cell in the first row contains an @, it's likely data (email), not headers.
 */
function hasHeaders(firstRow: string[]): boolean {
  return !firstRow.some(cell => EMAIL_REGEX.test(cell.trim()))
}

/**
 * Try to detect which column index contains emails
 */
function findEmailColumn(rows: string[][]): number {
  for (const row of rows.slice(0, 5)) {
    for (let i = 0; i < row.length; i++) {
      if (EMAIL_REGEX.test(row[i].trim())) return i
    }
  }
  return -1
}

export function parseCSV(csvContent: string): ParseResult {
  // First parse without headers to inspect raw data
  const raw = Papa.parse(csvContent, { header: false, skipEmptyLines: true })
  const rawRows = raw.data as string[][]

  if (rawRows.length === 0) {
    return { valid: [], invalid: [], duplicates: 0 }
  }

  // Detect if first row is headers
  const firstRowIsHeaders = hasHeaders(rawRows[0])

  if (firstRowIsHeaders) {
    // Parse with headers normally
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        const normalized = header.toLowerCase().trim()
        return HEADER_MAP[normalized] || normalized
      },
    })
    return processRows(data as Record<string, string>[])
  }

  // No headers — detect column positions by finding the email column
  const emailCol = findEmailColumn(rawRows)
  if (emailCol === -1) {
    return { valid: [], invalid: [{ row: 1, reason: 'Could not find email column' }], duplicates: 0 }
  }

  // Assume columns around the email: first_name, last_name, email, company, title
  // But be flexible — map based on email column position
  const rows: Record<string, string>[] = rawRows.map(row => {
    const result: Record<string, string> = { email: row[emailCol] || '' }

    // Columns before email are likely name fields
    if (emailCol >= 1) result.first_name = row[0] || ''
    if (emailCol >= 2) result.last_name = row[1] || ''

    // Columns after email are likely company and title
    if (row.length > emailCol + 1) result.company_name = row[emailCol + 1] || ''
    if (row.length > emailCol + 2) result.title = row[emailCol + 2] || ''

    return result
  })

  return processRows(rows)
}

function processRows(data: Record<string, string>[]): ParseResult {
  const valid: ParsedContact[] = []
  const invalid: { row: number; reason: string }[] = []
  const seenEmails = new Set<string>()
  let duplicates = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 1

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
