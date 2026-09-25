export type User = { id: string; organizationId: string; email: string; name: string; role: 'admin' | 'professional' }
export type Client = { id: string; name: string; email: string; notes: string; createdAt: string }
export type Case = { id: string; clientId: string; title: string; description: string; createdAt: string }
export type Milestone = { id: string; caseId: string; title: string; position: number; createdAt: string }
export type Asset = { id: string; caseId: string; runId: string; milestoneId: string; sourceAssetId: string; kind: 'source' | 'generated'; contentType: string; createdAt: string }
export type Run = { id: string; caseId: string; sourceAssetId: string; prompt: string; modelId: string; quantity: number; status: string; error: string; createdAt: string }
export type AdminUser = { id: string; email: string; name: string; role: string; active: boolean; createdAt: string }
export type AuditEvent = { id: string; actorName: string; action: string; subjectType: string; subjectId: string; createdAt: string }

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'same-origin', ...options })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { message = (await response.json()).error || message } catch { /* response has no JSON body */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export function json(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export function imageURL(id: string) { return `/api/assets/${id}/content` }

export function dateLabel(value: string, locale: 'pt-BR' | 'en' = 'pt-BR') {
  return new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}
