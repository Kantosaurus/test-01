const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export interface Contact {
  email: string
  name: string | null
}

export interface Email {
  id: string
  subject: string
  body: string
  snippet: string
  date: string
  is_read: boolean
  is_starred: boolean
  thread_id: string | null
  from: Contact
  to: Contact[]
  cc: Contact[]
  labels: string[]
}

export interface EmailListResponse {
  emails: Email[]
  total: number
  page: number
  limit: number
}

export interface Label {
  name: string
  color: string | null
  email_count: number
}

export interface EmailThread {
  id: string
  emails: Email[]
  subject: string
  last_message_date: string
  participant_count: number
}

interface GetEmailsParams {
  page?: number
  limit?: number
  label?: string
  is_read?: boolean
  is_starred?: boolean
  search?: string
}

interface SendEmailParams {
  to: string[]
  cc?: string[]
  subject: string
  body: string
  reply_to?: string
}

interface SmartComposeParams {
  context?: string
  reply_to?: string
  prompt?: string
}

interface SummarizeParams {
  email_id?: string
  thread_id?: string
  text?: string
}

interface SearchParams {
  query: string
  limit?: number
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || `API error: ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Emails
  getEmails: (params: GetEmailsParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))
    if (params.label) searchParams.set('label', params.label)
    if (params.is_read !== undefined) searchParams.set('is_read', String(params.is_read))
    if (params.is_starred !== undefined) searchParams.set('is_starred', String(params.is_starred))
    if (params.search) searchParams.set('search', params.search)
    
    const query = searchParams.toString()
    return fetchApi<EmailListResponse>(`/emails${query ? `?${query}` : ''}`)
  },

  getEmail: (id: string) => fetchApi<Email>(`/emails/${id}`),

  sendEmail: (params: SendEmailParams) => 
    fetchApi<Email>('/emails', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  updateEmail: (id: string, data: Partial<Email>) =>
    fetchApi<Email>(`/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteEmail: (id: string) =>
    fetch(`${API_URL}/emails/${id}`, { method: 'DELETE' }),

  // Threads
  getThread: (id: string) => fetchApi<EmailThread>(`/threads/${id}`),

  // Labels
  getLabels: () => fetchApi<Label[]>('/labels'),

  createLabel: (name: string, color?: string) =>
    fetchApi<Label>('/labels', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  deleteLabel: (name: string) =>
    fetch(`${API_URL}/labels/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // AI
  summarize: (params: SummarizeParams) =>
    fetchApi<{ summary: string }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  smartCompose: (params: SmartComposeParams) =>
    fetchApi<{ suggestions: string[] }>('/ai/compose', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  semanticSearch: (params: SearchParams) =>
    fetchApi<{ results: Array<{ email_id: string; subject: string; snippet: string; score: number }> }>(
      '/ai/search',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    ),

  categorize: (emailId: string) =>
    fetchApi<{ suggested_labels: string[]; priority: string }>('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify({ email_id: emailId }),
    }),

  indexEmails: () =>
    fetchApi<{ indexed_count: number }>('/ai/index', { method: 'POST' }),

  indexEmail: (emailId: string) =>
    fetch(`${API_URL}/ai/index/${emailId}`, { method: 'POST' }),
}
