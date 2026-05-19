import { supabase } from './client'
import type { Tables } from './database.types'
import { isLocalBackendEnabled, localApi } from './local-api'

export type AdminCustomerProfile = Tables<'customer_profiles'>

export async function getCustomers() {
  if (isLocalBackendEnabled()) {
    return localApi<AdminCustomerProfile[]>('/customers')
  }

  const { data, error } = await supabase
    .from('customer_profiles')
    .select()
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
