import { customerSupabase } from './customer-client'
import type { Inserts, Tables } from './database.types'
import { getLocalCustomerAuthHeaders } from './customer-auth'
import { isLocalBackendEnabled, localApi } from './local-api'

export type CheckoutIntent = Tables<'checkout_intents'>

export type CreateCheckoutIntentInput = {
  customer_id: string
  product_id: string
  qty: number
  source?: string | null
  stock_status: 'ready' | 'po'
  unit_price: number
  variant_id: string
}

export async function createCheckoutIntent(input: CreateCheckoutIntentInput) {
  const payload = {
    customer_id: input.customer_id,
    product_id: input.product_id,
    qty: input.qty,
    source: input.source ?? null,
    stock_status: input.stock_status,
    unit_price: input.unit_price,
    variant_id: input.variant_id,
  }

  if (isLocalBackendEnabled()) {
    return localApi<CheckoutIntent>('/checkout-intents', {
      body: JSON.stringify(payload),
      headers: getLocalCustomerAuthHeaders(),
      method: 'POST',
    })
  }

  const { data, error } = await customerSupabase
    .from('checkout_intents')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function recordCheckoutWhatsAppClick(input: Inserts<'wa_click_events'>) {
  const payload = {
    ...input,
    referrer: input.referrer ?? (typeof document === 'undefined' ? null : document.referrer),
  }

  if (isLocalBackendEnabled()) {
    await localApi<unknown>('/wa-click-events', {
      body: JSON.stringify(payload),
      headers: getLocalCustomerAuthHeaders(),
      method: 'POST',
    })
    return
  }

  const { error } = await customerSupabase.from('wa_click_events').insert(payload)
  if (error) throw error
}
