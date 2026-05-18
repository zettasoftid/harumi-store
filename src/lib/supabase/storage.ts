const R2_IMAGE_PROTOCOL = 'r2://'

type R2UploadResponse = {
  key?: string
  path?: string
  publicUrl?: string
  url?: string
}

function envFlag(value: string | undefined) {
  return ['1', 'true', 'yes', 'y'].includes((value ?? '').toLowerCase())
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}

function r2ImageKey(imagePath: string) {
  return imagePath.replace(R2_IMAGE_PROTOCOL, '')
}

export function isLocalProductImageStorage() {
  return envFlag(import.meta.env.VITE_LOCAL_STORAGE)
}

export function getProductImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return null

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath
  }

  if (imagePath.startsWith('/')) {
    return new URL(imagePath, window.location.origin).toString()
  }

  const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL
  if (imagePath.startsWith(R2_IMAGE_PROTOCOL) && r2PublicUrl) {
    return `${r2PublicUrl.replace(/\/+$/g, '')}/${trimSlashes(r2ImageKey(imagePath))}`
  }

  if (r2PublicUrl) {
    return `${r2PublicUrl.replace(/\/+$/g, '')}/${trimSlashes(imagePath)}`
  }

  return new URL(`/${trimSlashes(imagePath)}`, window.location.origin).toString()
}

export async function uploadProductImage(file: File, path: string) {
  if (isLocalProductImageStorage()) {
    return uploadProductImageToLocalServer(file, path)
  }

  return uploadProductImageToR2(file, path)
}

async function uploadProductImageToLocalServer(file: File, path: string) {
  const endpoint = import.meta.env.VITE_LOCAL_UPLOAD_ENDPOINT || 'http://127.0.0.1:8081/upload'
  const cleanPath = trimSlashes(path)

  const response = await fetch(endpoint, {
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Path': cleanPath,
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Upload lokal gagal (${response.status}). Pastikan ./manage.sh start sedang menjalankan local storage server.`)
  }

  const data = await response.json() as R2UploadResponse
  return data.publicUrl ?? data.url ?? data.path ?? `/uploads/${cleanPath}`
}

async function uploadProductImageToR2(file: File, path: string) {
  const endpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT

  if (!endpoint) {
    throw new Error('VITE_R2_UPLOAD_ENDPOINT belum diset. Set VITE_LOCAL_STORAGE=True untuk testing lokal, atau siapkan Cloudflare Worker upload R2.')
  }

  const cleanPath = trimSlashes(path)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', cleanPath)
  formData.append('contentType', file.type)

  const response = await fetch(endpoint, {
    body: formData,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Upload R2 gagal (${response.status}).`)
  }

  const data = await response.json() as R2UploadResponse

  if (data.publicUrl || data.url) {
    return data.publicUrl ?? data.url ?? ''
  }

  const key = data.key ?? data.path ?? cleanPath
  return `${R2_IMAGE_PROTOCOL}${trimSlashes(key)}`
}

export async function deleteProductImage(path: string) {
  if (isLocalProductImageStorage() || path.startsWith('/uploads/')) {
    const endpoint = import.meta.env.VITE_LOCAL_DELETE_ENDPOINT || 'http://127.0.0.1:8081/delete'
    await fetch(endpoint, {
      body: JSON.stringify({ path }),
      headers: { 'Content-Type': 'application/json' },
      method: 'DELETE',
    })
    return
  }

  const endpoint = import.meta.env.VITE_R2_DELETE_ENDPOINT
  if (!endpoint) return

  await fetch(endpoint, {
    body: JSON.stringify({ path: path.startsWith(R2_IMAGE_PROTOCOL) ? r2ImageKey(path) : path }),
    headers: { 'Content-Type': 'application/json' },
    method: 'DELETE',
  })
}
