export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let attempts = 0
  while (attempts < 3) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...fetchOptions,
        headers,
      })
      if (res.ok) return res.json() as Promise<T>
      if (res.status >= 500 && attempts < 2) {
        attempts++
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts)))
        continue
      }
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new ApiError(res.status, err.detail || 'Request failed', err.code)
    } catch (e) {
      if (e instanceof ApiError) throw e
      if (attempts >= 2) throw e
      attempts++
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts)))
    }
  }
  throw new ApiError(500, 'Max retries exceeded')
}
