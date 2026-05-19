import { createServer } from 'node:http'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataFile = path.join(rootDir, 'data', 'local-db.json')
const uploadsDir = path.join(rootDir, 'public', 'uploads')
const port = Number(process.env.LOCAL_STORAGE_PORT || 8081)
const host = process.env.LOCAL_STORAGE_HOST || '127.0.0.1'

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-File-Path',
    'Access-Control-Allow-Methods': 'POST, PATCH, DELETE, OPTIONS, GET',
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
  checkout_intents: [],
  customer_profiles: [],
  customer_sessions: [],
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

function normalizeIndonesianPhone(phone = '') {
  const cleaned = String(phone).replace(/[^\d+]/g, '')

  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('62')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+62${cleaned.slice(1)}`

  return `+62${cleaned}`
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash = '') {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false

  const candidate = scryptSync(String(password), salt, 64)
  const expected = Buffer.from(hash, 'hex')

  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

function publicCustomerProfile(customer) {
  if (!customer) return null
  const profile = { ...customer }
  delete profile.password_hash
  return profile
}

function readBearerToken(request) {
  const header = request.headers.authorization ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function getCustomerFromRequest(db, request) {
  const token = readBearerToken(request)
  if (!token) return null

  const session = (db.customer_sessions ?? []).find((row) => row.token === token)
  if (!session) return null

  return (db.customer_profiles ?? []).find((customer) => customer.id === session.customer_id) ?? null
}

function requireCustomer(db, request, response) {
  const customer = getCustomerFromRequest(db, request)

  if (!customer) {
    sendJson(response, 401, { error: 'Customer belum login.' })
    return null
  }

  return customer
}

function findCustomerByPhone(db, phone) {
  if (!phone) return null
  const normalizedPhone = normalizeIndonesianPhone(phone)

  return (db.customer_profiles ?? []).find((customer) => customer.phone === normalizedPhone) ?? null
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
    customer_profiles: publicCustomerProfile((db.customer_profiles ?? []).find((customer) => customer.id === sale.customer_id)),
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

function checkoutIntentWithRelations(intent, db) {
  const product = db.products.find((row) => row.id === intent.product_id)

  return {
    ...intent,
    customer_profiles: publicCustomerProfile((db.customer_profiles ?? []).find((customer) => customer.id === intent.customer_id)),
    product_variants: (product?.product_variants ?? []).find((variant) => variant.id === intent.variant_id) ?? null,
    products: product ? productWithRelations(product, db) : null,
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

function adjustVariantStock(db, variantId, delta) {
  const now = new Date().toISOString()

  db.products = db.products.map((product) => ({
    ...product,
    product_variants: (product.product_variants ?? []).map((variant) => {
      if (variant.id !== variantId) return variant

      return {
        ...variant,
        stock: Math.max(Number(variant.stock ?? 0) + delta, 0),
        updated_at: now,
      }
    }),
    updated_at: (product.product_variants ?? []).some((variant) => variant.id === variantId)
      ? now
      : product.updated_at,
  }))
}

function restoreSaleStock(db, saleId) {
  db.sale_items
    .filter((item) => item.sale_id === saleId)
    .forEach((item) => adjustVariantStock(db, item.variant_id, Number(item.qty ?? 0)))
}

function applySaleStock(db, items = []) {
  items.forEach((item) => adjustVariantStock(db, item.variant_id, -Number(item.qty ?? 0)))
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

  if (request.method === 'GET' && url.pathname === '/api/customers') {
    const db = await readDb()
    sendJson(response, 200, (db.customer_profiles ?? []).map(publicCustomerProfile))
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/customers/register') {
    const db = await readDb()
    const payload = await readJson(request)
    const phone = normalizeIndonesianPhone(payload.phone)
    const existing = findCustomerByPhone(db, phone)

    if (existing) {
      sendJson(response, 409, { error: 'Nomor HP sudah terdaftar.' })
      return
    }

    const now = new Date().toISOString()
    const customer = {
      address: String(payload.address ?? '').trim(),
      auth_user_id: randomUUID(),
      created_at: now,
      id: randomUUID(),
      name: String(payload.name ?? '').trim(),
      password_hash: hashPassword(payload.password ?? ''),
      phone,
      updated_at: now,
    }
    const session = {
      created_at: now,
      customer_id: customer.id,
      id: randomUUID(),
      token: `${randomUUID()}${randomUUID()}`,
    }

    db.customer_profiles = [customer, ...(db.customer_profiles ?? [])]
    db.customer_sessions = [session, ...(db.customer_sessions ?? [])]

    await writeDb(db)
    sendJson(response, 200, {
      profile: publicCustomerProfile(customer),
      token: session.token,
    })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/customers/login') {
    const db = await readDb()
    const payload = await readJson(request)
    const customer = findCustomerByPhone(db, payload.phone)

    if (!customer || !verifyPassword(payload.password ?? '', customer.password_hash)) {
      sendJson(response, 401, { error: 'Nomor HP atau password salah.' })
      return
    }

    const session = {
      created_at: new Date().toISOString(),
      customer_id: customer.id,
      id: randomUUID(),
      token: `${randomUUID()}${randomUUID()}`,
    }
    db.customer_sessions = [session, ...(db.customer_sessions ?? [])]

    await writeDb(db)
    sendJson(response, 200, {
      profile: publicCustomerProfile(customer),
      token: session.token,
    })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/customers/me') {
    const db = await readDb()
    const customer = requireCustomer(db, request, response)
    if (!customer) return

    sendJson(response, 200, publicCustomerProfile(customer))
    return
  }

  if (request.method === 'PATCH' && url.pathname === '/api/customers/me') {
    const db = await readDb()
    const customer = requireCustomer(db, request, response)
    if (!customer) return

    const payload = await readJson(request)
    const index = db.customer_profiles.findIndex((row) => row.id === customer.id)
    const updated = {
      ...db.customer_profiles[index],
      address: payload.address === undefined ? customer.address : String(payload.address).trim(),
      name: payload.name === undefined ? customer.name : String(payload.name).trim(),
      updated_at: new Date().toISOString(),
    }

    db.customer_profiles[index] = updated
    await writeDb(db)
    sendJson(response, 200, publicCustomerProfile(updated))
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/customers/logout') {
    const db = await readDb()
    const token = readBearerToken(request)
    db.customer_sessions = (db.customer_sessions ?? []).filter((session) => session.token !== token)
    await writeDb(db)
    sendJson(response, 200, { ok: true })
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

  const variantMatch = url.pathname.match(/^\/api\/product-variants\/([^/]+)$/)
  if (variantMatch && request.method === 'PATCH') {
    const db = await readDb()
    const payload = await readJson(request)
    const now = new Date().toISOString()
    let updatedVariant = null

    db.products = db.products.map((product) => ({
      ...product,
      product_variants: (product.product_variants ?? []).map((variant) => {
        if (variant.id !== variantMatch[1]) return variant

        updatedVariant = {
          ...variant,
          hpp: payload.hpp === undefined ? variant.hpp : Number(payload.hpp),
          is_active: payload.is_active === undefined ? variant.is_active : Boolean(payload.is_active),
          selling_price: payload.selling_price === undefined ? variant.selling_price : Number(payload.selling_price),
          stock: payload.stock === undefined ? variant.stock : Number(payload.stock),
          updated_at: now,
        }

        return updatedVariant
      }),
    }))

    if (!updatedVariant) {
      sendJson(response, 404, { error: 'Variant not found' })
      return
    }

    await writeDb(db)
    sendJson(response, 200, updatedVariant)
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

  if (request.method === 'GET' && url.pathname === '/api/checkout-intents') {
    const db = await readDb()
    sendJson(response, 200, (db.checkout_intents ?? []).map((intent) => checkoutIntentWithRelations(intent, db)))
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/checkout-intents') {
    const db = await readDb()
    const customer = requireCustomer(db, request, response)
    if (!customer) return

    const payload = await readJson(request)
    const qty = Math.max(Number(payload.qty ?? 1), 1)
    const unitPrice = Number(payload.unit_price ?? 0)
    const intent = {
      created_at: new Date().toISOString(),
      customer_id: customer.id,
      id: randomUUID(),
      product_id: payload.product_id,
      qty,
      source: payload.source ?? null,
      stock_status: payload.stock_status === 'po' ? 'po' : 'ready',
      subtotal: qty * unitPrice,
      unit_price: unitPrice,
      variant_id: payload.variant_id,
    }

    db.checkout_intents = [intent, ...(db.checkout_intents ?? [])]
    await writeDb(db)
    sendJson(response, 200, intent)
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/wa-click-events') {
    const db = await readDb()
    sendJson(response, 200, db.wa_click_events ?? [])
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/wa-click-events') {
    const db = await readDb()
    const payload = await readJson(request)
    const now = new Date().toISOString()
    db.wa_click_events = [
      {
        created_at: now,
        checkout_intent_id: payload.checkout_intent_id ?? null,
        customer_id: payload.customer_id ?? getCustomerFromRequest(db, request)?.id ?? null,
        id: randomUUID(),
        product_id: payload.product_id ?? null,
        referrer: payload.referrer ?? null,
        source: payload.source ?? null,
        variant_id: payload.variant_id ?? null,
      },
      ...(db.wa_click_events ?? []),
    ]
    await writeDb(db)
    sendJson(response, 200, db.wa_click_events[0])
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/sales') {
    const db = await readDb()
    const payload = await readJson(request)
    const now = new Date().toISOString()
    const matchedCustomer = payload.customer_id
      ? (db.customer_profiles ?? []).find((customer) => customer.id === payload.customer_id) ?? null
      : findCustomerByPhone(db, payload.customer_phone)
    const sale = {
      created_at: now,
      customer_address_snapshot: payload.customer_address_snapshot ?? matchedCustomer?.address ?? null,
      customer_id: matchedCustomer?.id ?? payload.customer_id ?? null,
      customer_name: payload.customer_name ?? matchedCustomer?.name ?? null,
      customer_phone: payload.customer_phone ? normalizeIndonesianPhone(payload.customer_phone) : matchedCustomer?.phone ?? null,
      id: randomUUID(),
      note: payload.note ?? null,
      other_cost: Number(payload.other_cost ?? 0),
      sale_date: payload.sale_date ?? new Date().toISOString().slice(0, 10),
    }
    db.sales.unshift(sale)
    const saleItems = (payload.items ?? []).map((item) => makeSaleItem(sale.id, item, db))
    db.sale_items.push(...saleItems)
    applySaleStock(db, saleItems)
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
    const matchedCustomer = payload.customer_id
      ? (db.customer_profiles ?? []).find((customer) => customer.id === payload.customer_id) ?? null
      : findCustomerByPhone(db, payload.customer_phone)
    db.sales[index] = {
      ...db.sales[index],
      customer_address_snapshot: payload.customer_address_snapshot ?? matchedCustomer?.address ?? null,
      customer_id: matchedCustomer?.id ?? payload.customer_id ?? null,
      customer_name: payload.customer_name ?? matchedCustomer?.name ?? null,
      customer_phone: payload.customer_phone ? normalizeIndonesianPhone(payload.customer_phone) : matchedCustomer?.phone ?? null,
      note: payload.note ?? null,
      other_cost: Number(payload.other_cost ?? 0),
      sale_date: payload.sale_date ?? db.sales[index].sale_date,
    }
    restoreSaleStock(db, saleMatch[1])
    db.sale_items = db.sale_items.filter((item) => item.sale_id !== saleMatch[1])
    const saleItems = (payload.items ?? []).map((item) => makeSaleItem(saleMatch[1], item, db))
    db.sale_items.push(...saleItems)
    applySaleStock(db, saleItems)
    await writeDb(db)
    sendJson(response, 200, saleWithRelations(db.sales[index], db))
    return
  }

  if (saleMatch && request.method === 'DELETE') {
    const db = await readDb()
    restoreSaleStock(db, saleMatch[1])
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
