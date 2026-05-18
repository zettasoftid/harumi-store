import { supabase } from './client'
import type { Inserts, Tables, Updates } from './database.types'
import { isLocalBackendEnabled, localApi } from './local-api'

type ProductImageInput = Omit<Inserts<'product_images'>, 'product_id'>
type ProductVariantInput = Omit<Inserts<'product_variants'>, 'product_id'>
type CategoryRow = Tables<'categories'>
type ProductImageRow = Tables<'product_images'>
type ProductVariantRow = Tables<'product_variants'>

export type AdminProductWithRelations = Tables<'products'> & {
  categories: CategoryRow | null
  product_images: ProductImageRow[] | null
  product_variants: ProductVariantRow[] | null
}

export type ProductFormInput = {
  category_id: string
  condition_note?: string | null
  description: string
  images?: ProductImageInput[]
  is_active?: boolean
  name: string
  slug?: string
  variants?: ProductVariantInput[]
}

export type ProductUpdateInput = Partial<ProductFormInput> & {
  images?: ProductImageInput[]
  replaceImages?: boolean
  replaceVariants?: boolean
  variants?: ProductVariantInput[]
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getAdminProducts() {
  if (isLocalBackendEnabled()) {
    return localApi<AdminProductWithRelations[]>('/products')
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*),
      product_images (*),
      product_variants (*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AdminProductWithRelations[]
}

export async function getAdminProductById(productId: string) {
  if (isLocalBackendEnabled()) {
    return localApi<AdminProductWithRelations | null>(`/products/${productId}`)
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*),
      product_images (*),
      product_variants (*)
    `)
    .eq('id', productId)
    .maybeSingle()

  if (error) throw error
  return data as AdminProductWithRelations | null
}

export async function createProduct(input: ProductFormInput) {
  if (isLocalBackendEnabled()) {
    return localApi<unknown>('/products', {
      body: JSON.stringify(input),
      method: 'POST',
    })
  }

  const productPayload: Inserts<'products'> = {
    category_id: input.category_id,
    condition_note: input.condition_note ?? null,
    description: input.description,
    is_active: input.is_active ?? true,
    name: input.name,
    slug: input.slug ? slugify(input.slug) : slugify(input.name),
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productPayload)
    .select()
    .single()

  if (productError) throw productError

  await replaceProductChildren(product.id, input.images ?? [], input.variants ?? [], {
    replaceImages: true,
    replaceVariants: true,
  })

  return product
}

export async function updateProduct(productId: string, input: ProductUpdateInput) {
  if (isLocalBackendEnabled()) {
    return localApi<unknown>(`/products/${productId}`, {
      body: JSON.stringify(input),
      method: 'PATCH',
    })
  }

  const productPayload: Updates<'products'> = {}

  if (input.category_id !== undefined) productPayload.category_id = input.category_id
  if (input.condition_note !== undefined) productPayload.condition_note = input.condition_note
  if (input.description !== undefined) productPayload.description = input.description
  if (input.is_active !== undefined) productPayload.is_active = input.is_active
  if (input.name !== undefined) productPayload.name = input.name
  if (input.slug !== undefined) productPayload.slug = slugify(input.slug)

  const { data: product, error: productError } = await supabase
    .from('products')
    .update(productPayload)
    .eq('id', productId)
    .select()
    .single()

  if (productError) throw productError

  await replaceProductChildren(productId, input.images ?? [], input.variants ?? [], {
    replaceImages: input.replaceImages ?? false,
    replaceVariants: input.replaceVariants ?? false,
  })

  return product
}

export async function archiveProduct(productId: string) {
  return setProductActive(productId, false)
}

export async function setProductActive(productId: string, isActive: boolean) {
  if (isLocalBackendEnabled()) {
    return localApi<unknown>(`/products/${productId}`, {
      body: JSON.stringify({ is_active: isActive }),
      method: 'PATCH',
    })
  }

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(productId: string) {
  if (isLocalBackendEnabled()) {
    await localApi<unknown>(`/products/${productId}`, { method: 'DELETE' })
    return
  }

  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) throw error
}

async function replaceProductChildren(
  productId: string,
  images: ProductImageInput[],
  variants: ProductVariantInput[],
  options: { replaceImages: boolean; replaceVariants: boolean },
) {
  if (options.replaceImages) {
    const { error } = await supabase.from('product_images').delete().eq('product_id', productId)
    if (error) throw error
  }

  if (images.length > 0) {
    const { error } = await supabase.from('product_images').insert(
      images.map((image) => ({
        ...image,
        product_id: productId,
      })),
    )

    if (error) throw error
  }

  if (options.replaceVariants) {
    const { error } = await supabase.from('product_variants').delete().eq('product_id', productId)
    if (error) throw error
  }

  if (variants.length > 0) {
    const { error } = await supabase.from('product_variants').insert(
      variants.map((variant) => ({
        ...variant,
        product_id: productId,
      })),
    )

    if (error) throw error
  }
}

export async function updateVariantStock(variantId: string, stock: number) {
  const { data, error } = await supabase
    .from('product_variants')
    .update({ stock })
    .eq('id', variantId)
    .select()
    .single()

  if (error) throw error
  return data
}

export type AdminProduct = Tables<'products'>
