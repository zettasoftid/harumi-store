import { normalizeIndonesianPhone } from './auth'
import { customerSupabase } from './customer-client'
import type { Tables, Updates } from './database.types'
import { isLocalBackendEnabled, localApi } from './local-api'

const LOCAL_CUSTOMER_TOKEN_KEY = 'harumi-customer-token'

export type CustomerProfile = Tables<'customer_profiles'>

export type CustomerRegisterInput = {
  address: string
  name: string
  password: string
  phone: string
}

export type CustomerLoginInput = {
  password: string
  phone: string
}

export type CustomerProfileUpdateInput = Pick<Updates<'customer_profiles'>, 'address' | 'name'>

type LocalCustomerAuthResponse = {
  profile: CustomerProfile
  token: string
}

function getLocalCustomerToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(LOCAL_CUSTOMER_TOKEN_KEY)
}

function setLocalCustomerToken(token: string) {
  window.localStorage.setItem(LOCAL_CUSTOMER_TOKEN_KEY, token)
}

function clearLocalCustomerToken() {
  window.localStorage.removeItem(LOCAL_CUSTOMER_TOKEN_KEY)
}

function localCustomerHeaders() {
  const token = getLocalCustomerToken()
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

async function ensureCustomerProfile(input: CustomerRegisterInput & { authUserId: string }) {
  const payload = {
    address: input.address.trim(),
    auth_user_id: input.authUserId,
    name: input.name.trim(),
    phone: normalizeIndonesianPhone(input.phone),
  }

  const { data, error } = await customerSupabase
    .from('customer_profiles')
    .upsert(payload, { onConflict: 'auth_user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function registerCustomer(input: CustomerRegisterInput) {
  const phone = normalizeIndonesianPhone(input.phone)

  if (isLocalBackendEnabled()) {
    const result = await localApi<LocalCustomerAuthResponse>('/customers/register', {
      body: JSON.stringify({ ...input, phone }),
      method: 'POST',
    })
    setLocalCustomerToken(result.token)
    return result.profile
  }

  const { data, error } = await customerSupabase.auth.signUp({
    password: input.password,
    phone,
    options: {
      data: {
        address: input.address.trim(),
        name: input.name.trim(),
      },
    },
  })

  if (error) throw error
  if (!data.user) throw new Error('Akun customer gagal dibuat.')
  if (!data.session) {
    throw new Error('Akun dibuat, tetapi Supabase masih meminta verifikasi Phone Auth. Matikan phone confirmation untuk MVP tanpa OTP atau lanjutkan dengan flow OTP.')
  }

  return ensureCustomerProfile({ ...input, authUserId: data.user.id, phone })
}

export async function loginCustomer(input: CustomerLoginInput) {
  const phone = normalizeIndonesianPhone(input.phone)

  if (isLocalBackendEnabled()) {
    const result = await localApi<LocalCustomerAuthResponse>('/customers/login', {
      body: JSON.stringify({ password: input.password, phone }),
      method: 'POST',
    })
    setLocalCustomerToken(result.token)
    return result.profile
  }

  const { data, error } = await customerSupabase.auth.signInWithPassword({
    password: input.password,
    phone,
  })

  if (error) throw error
  if (!data.user) throw new Error('Login customer gagal.')

  const profile = await getCurrentCustomer()
  if (!profile) throw new Error('Profile customer belum tersedia. Silakan daftar ulang dengan nama dan alamat lengkap.')
  return profile
}

export async function getCurrentCustomer() {
  if (isLocalBackendEnabled()) {
    const token = getLocalCustomerToken()
    if (!token) return null

    try {
      return await localApi<CustomerProfile>('/customers/me', {
        headers: localCustomerHeaders(),
      })
    } catch {
      clearLocalCustomerToken()
      return null
    }
  }

  const { data: sessionData, error: sessionError } = await customerSupabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!sessionData.session) return null

  const { data: userData, error: userError } = await customerSupabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) return null

  const { data, error } = await customerSupabase
    .from('customer_profiles')
    .select()
    .eq('auth_user_id', userData.user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateCustomerProfile(input: CustomerProfileUpdateInput) {
  if (isLocalBackendEnabled()) {
    const profile = await localApi<CustomerProfile>('/customers/me', {
      body: JSON.stringify(input),
      headers: localCustomerHeaders(),
      method: 'PATCH',
    })
    return profile
  }

  const current = await getCurrentCustomer()
  if (!current) throw new Error('Silakan masuk akun customer terlebih dahulu.')

  const { data, error } = await customerSupabase
    .from('customer_profiles')
    .update({
      address: input.address,
      name: input.name,
    })
    .eq('id', current.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function logoutCustomer() {
  if (isLocalBackendEnabled()) {
    const headers = localCustomerHeaders()
    clearLocalCustomerToken()
    if (headers) {
      await localApi<unknown>('/customers/logout', {
        headers,
        method: 'POST',
      }).catch(() => undefined)
    }
    return
  }

  const { error } = await customerSupabase.auth.signOut()
  if (error) throw error
}

export function getLocalCustomerAuthHeaders() {
  return localCustomerHeaders()
}
