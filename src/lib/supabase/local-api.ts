export function isLocalBackendEnabled() {
  return ['1', 'true', 'yes', 'y'].includes((import.meta.env.VITE_LOCAL_STORAGE ?? '').toLowerCase())
}

export function localApiUrl(path: string) {
  const base = import.meta.env.VITE_LOCAL_API_ENDPOINT ?? 'http://127.0.0.1:8081/api'
  return `${base.replace(/\/+$/g, '')}/${path.replace(/^\/+/g, '')}`
}

export async function localApi<T>(path: string, init?: RequestInit) {
  const response = await fetch(localApiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Local API gagal (${response.status})`)
  }

  return response.json() as Promise<T>
}
