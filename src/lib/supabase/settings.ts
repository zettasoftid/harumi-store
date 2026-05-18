import { supabase } from './client'
import type { Tables, Updates } from './database.types'
import { isLocalBackendEnabled, localApi } from './local-api'

export type StoreSettings = Tables<'store_settings'>

export async function getStoreSettings() {
  if (isLocalBackendEnabled()) {
    return localApi<StoreSettings>('/settings')
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateStoreSettings(settings: Updates<'store_settings'>) {
  if (isLocalBackendEnabled()) {
    return localApi<StoreSettings>('/settings', {
      body: JSON.stringify(settings),
      method: 'PATCH',
    })
  }

  const current = await getStoreSettings()

  if (current) {
    const { data, error } = await supabase
      .from('store_settings')
      .update(settings)
      .eq('id', current.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('store_settings')
    .insert(settings)
    .select()
    .single()

  if (error) throw error
  return data
}
