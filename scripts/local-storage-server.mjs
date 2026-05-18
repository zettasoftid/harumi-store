import { createServer } from 'node:http'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataFile = path.join(rootDir, 'data', 'local-db.json')
const uploadsDir = path.join(rootDir, 'public', 'uploads')
const port = Number(process.env.LOCAL_STORAGE_PORT || 8081)
const host = process.env.LOCAL_STORAGE_HOST || '127.0.0.1'

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Path',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS, GET',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function sanitizeUploadPath(value = '') {
  const normalized = value.replace(/\\/g, '/').replace(/^\/+/, '')
  const safeParts = normalized
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, '-'))

  if (safeParts.length === 0) {
    return `products/image-${Date.now()}.webp`
  }

  return safeParts.join('/')
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []

    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}

const seedCategories = [
  { created_at: new Date().toISOString(), id: 'local-category-daster', name: 'Daster', slug: 'daster' },
  { created_at: new Date().toISOString(), id: 'local-category-sepatu', name: 'Sepatu Thrifting', slug: 'sepatu-thrifting' },
]

const defaultDb = {
  categories: seedCategories,
  products: [],
  sales: [],
  sale_items: [],
  settings: {
    admin_whatsapp: '6281339691260',
    id: 'local-settings',
    instagram_url: null,
    store_name: 'Harumi Store',
    updated_at: new Date().toISOString(),
  },
  wa_click_events: [],
}

async function readDb() {
  try {
    const content = await readFile(dataFile, 'utf-8')
    return { ...defaultDb, ...JSON.parse(content) }
  } catch {
    await writeDb(defaultDb)
    return structuredClone(defaultDb)
  }
}

async function writeDb(db) {
  await mkdir(path.dirname(dataFile), { recursive: true })
  await writeFile(dataFile, JSON.stringify(db, null, 2))
}

async function readJson(request) {
  const body = await readBody(request)
  return JSON.parse(body.toString() || '{}')
}

function productWithRelations(product, db) {
  return {
    ...product,
    categories: db.categories.find((category) => category.id === product.category_id) ?? null,
    product_images: product.product_images ?? [],
    product_variants: product.product_variants ?? [],
  }
}

function saleWithRelations(sale, db) {
  return {
    ...sale,
    sale_items: db.sale_items
      .filter((item) => item.sale_id === sale.id)
      .map((item) => ({
        ...item,
        products: productWithRelations(db.products.find((product) => product.id === item.product_id) ?? {}, db),
        product_variants: db.products
          .flatMap((product) => product.product_variants ?? [])
          .find((variant) => variant.id === item.variant_id) ?? null,
      })),
  }
}

function makeSaleItem(saleId, item, db) {
  const variant = db.products
    .flatMap((product) => product.product_variants ?? [])
    .find((row) => row.id === item.variant_id)
  const hpp = Number(variant?.hpp ?? 0)
  const sellingPrice = Number(variant?.selling_price ?? 0)
  const qty = Number(item.qty ?? 1)

  return {
    created_at: new Date().toISOString(),
    gross_revenue: qty * sellingPrice,
    hpp,
    id: randomUUID(),
    net_profit: (qty * sellingPrice) - (qty * hpp),
    product_id: item.product_id,
    qty,
    sale_id: saleId,
    selling_price: sellingPrice,
    total_hpp: qty * hpp,
    variant_id: item.variant_id,
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`)

  if (request.method === 'OPTIONS') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/categories') {
    const db = await readDb()
    sendJson(response, 200, db.categories)
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/products') {
    const db = await readDb()
    sendJson(response, 200, db.products.map((product) => productWithRelations(product, db)))
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/products') {
    const db = await readDb()
    const payload = await readJson(request)
    const now = new Date().toISOString()
    const productId = randomUUID()
    const product = {
      category_id: payload.category_id,
      condition_note: payload.condition_note ?? null,
      created_at: now,
      description: payload.description,
      id: productId,
      is_active: payload.is_active ?? true,
      name: payload.name,
      product_images: (payload.images ?? []).map((image, index) => ({
        ...image,
        created_at: now,
        id: randomUUID(),
        is_primary: index === 0,
        product_id: productId,
        sort_order: index,
      })),
      product_variants: (payload.variants ?? []).map((variant) => ({
        ...variant,
        created_at: now,
        id: randomUUID(),
        product_id: productId,
        updated_at: now,
      })),
      slug: payload.slug,
      updated_at: now,
    }
    db.products.unshift(product)
    await writeDb(db)
    sendJson(response, 200, productWithRelations(product, db))
    return
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/)
  if (productMatch && request.method === 'GET') {
    const db = await readDb()
    const product = db.products.find((row) => row.id === productMatch[1])
    sendJson(response, product ? 200 : 404, product ? productWithRelations(product, db) : { error: 'Product not found' })
    return
  }

  if (productMatch && request.method === 'PATCH') {
    const db = await readDb()
    const payload = await readJson(request)
    const index = db.products.findIndex((row) => row.id === productMatch[1])
    if (index < 0) {
      sendJson(response, 404, { error: 'Product not found' })
      return
    }
    const now = new Date().toISOString()
    const existing = db.products[index]
    db.products[index] = {
      ...existing,
      ...payload,
      product_images: payload.replaceImages
        ? (payload.images ?? []).map((image, imageIndex) => ({
            ...image,
            created_at: image.created_at ?? now,
            id: image.id ?? randomUUID(),
            is_primary: imageIndex === 0,
            product_id: existing.id,
            sort_order: imageIndex,
          }))
        : existing.product_images,
      product_variants: payload.replaceVariants
        ? (payload.variants ?? []).map((variant) => ({
            ...variant,
            created_at: variant.created_at ?? now,
            id: variant.id ?? randomUUID(),
            product_id: existing.id,
            updated_at: now,
          }))
        : existing.product_variants,
      updated_at: now,
    }
    delete db.products[index].images
    delete db.products[index].variants
    delete db.products[index].replaceImages
    delete db.products[index].replaceVariants
    await writeDb(db)
    sendJson(response, 200, productWithRelations(db.products[index], db))
    return
  }

  if (productMatch && request.method === 'DELETE') {
    const db = await readDb()
    db.products = db.products.filter((row) => row.id !== productMatch[1])
    await writeDb(db)
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/settings') {
    const db = await readDb()
    sendJson(response, 200, db.settings)
    return
  }

  if (request.method === 'PATCH' && url.pathname === '/api/settings') {
    const db = await readDb()
    db.settings = { ...db.settings, ...(await readJson(request)), updated_at: new Date().toISOString() }
    await writeDb(db)
    sendJson(response, 200, db.settings)
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/sales') {
    const db = await readDb()
    sendJson(response, 200, db.sales.map((sale) => saleWithRelations(sale, db)))
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/sales') {
    const db = await readDb()
    const payload = await readJson(request)
    const now = new Date().toISOString()
    const sale = {
      created_at: now,
      customer_name: payload.customer_name ?? null,
      customer_phone: payload.customer_phone ?? null,
      id: randomUUID(),
      note: payload.note ?? null,
      other_cost: Number(payload.other_cost ?? 0),
      sale_date: payload.sale_date ?? new Date().toISOString().slice(0, 10),
    }
    db.sales.unshift(sale)
    db.sale_items.push(...(payload.items ?? []).map((item) => makeSaleItem(sale.id, item, db)))
    await writeDb(db)
    sendJson(response, 200, saleWithRelations(sale, db))
    return
  }

  const saleMatch = url.pathname.match(/^\/api\/sales\/([^/]+)$/)
  if (saleMatch && request.method === 'PATCH') {
    const db = await readDb()
    const payload = await readJson(request)
    const index = db.sales.findIndex((row) => row.id === saleMatch[1])
    if (index < 0) {
      sendJson(response, 404, { error: 'Sale not found' })
      return
    }
    db.sales[index] = { ...db.sales[index], ...payload }
    db.sale_items = db.sale_items.filter((item) => item.sale_id !== saleMatch[1])
    db.sale_items.push(...(payload.items ?? []).map((item) => makeSaleItem(saleMatch[1], item, db)))
    await writeDb(db)
    sendJson(response, 200, saleWithRelations(db.sales[index], db))
    return
  }

  if (saleMatch && request.method === 'DELETE') {
    const db = await readDb()
    db.sales = db.sales.filter((row) => row.id !== saleMatch[1])
    db.sale_items = db.sale_items.filter((row) => row.sale_id !== saleMatch[1])
    await writeDb(db)
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'POST' && url.pathname === '/upload') {
    try {
      const requestedPath = sanitizeUploadPath(String(request.headers['x-file-path'] || ''))
      const filePath = path.join(uploadsDir, requestedPath)

      if (!filePath.startsWith(uploadsDir)) {
        sendJson(response, 400, { error: 'Invalid upload path' })
        return
      }

      const body = await readBody(request)
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, body)

      const publicUrl = `/uploads/${requestedPath}`
      sendJson(response, 200, {
        key: requestedPath,
        path: publicUrl,
        publicUrl,
      })
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : 'Upload failed' })
    }
    return
  }

  if (request.method === 'DELETE' && request.url === '/delete') {
    try {
      const body = await readBody(request)
      const payload = JSON.parse(body.toString() || '{}')
      const requestedPath = sanitizeUploadPath(String(payload.path || '').replace(/^\/?uploads\/?/, ''))
      const filePath = path.join(uploadsDir, requestedPath)

      if (!filePath.startsWith(uploadsDir)) {
        sendJson(response, 400, { error: 'Invalid delete path' })
        return
      }

      await rm(filePath, { force: true })
      sendJson(response, 200, { ok: true })
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : 'Delete failed' })
    }
    return
  }

  sendJson(response, 404, { error: 'Not found' })
}).listen(port, host, () => {
  console.log(`Local product image storage listening at http://${host}:${port}`)
  console.log(`Saving uploads into ${uploadsDir}`)
})
