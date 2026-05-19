import { supabase } from './client'

const ADMIN_TEST_BYPASS_PHONE = '+6281339691260'
const ADMIN_TEST_BYPASS_KEY = 'harumi-admin-test-bypass'

export function normalizeIndonesianPhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '')

  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('62')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+62${cleaned.slice(1)}`

  return `+62${cleaned}`
}

export function isAdminTestBypassEnabled() {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN_TEST_BYPASS === 'true'
}

export function isAdminTestBypassPhone(phone: string) {
  return normalizeIndonesianPhone(phone) === ADMIN_TEST_BYPASS_PHONE
}

export function enableAdminTestBypass(phone: string) {
  if (!isAdminTestBypassEnabled() || !isAdminTestBypassPhone(phone)) return false

  window.localStorage.setItem(ADMIN_TEST_BYPASS_KEY, ADMIN_TEST_BYPASS_PHONE)
  return true
}

export function hasAdminTestBypass() {
  return isAdminTestBypassEnabled() && window.localStorage.getItem(ADMIN_TEST_BYPASS_KEY) === ADMIN_TEST_BYPASS_PHONE
}

export function clearAdminTestBypass() {
  window.localStorage.removeItem(ADMIN_TEST_BYPASS_KEY)
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) throw error
  return data
}

export async function sendAdminPhoneOtp(phone: string) {
  const normalizedPhone = normalizeIndonesianPhone(phone)
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
  })

  if (error) throw error
  return {
    ...data,
    phone: normalizedPhone,
  }
}

export async function verifyAdminPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizeIndonesianPhone(phone),
    token,
    type: 'sms',
  })

  if (error) throw error
  return data
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error
  return data.session
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) throw error
  return data.user
}

export async function isCurrentUserAdmin() {
  const session = await getCurrentSession()
  if (!session) return false

  const { data, error } = await supabase.rpc('is_admin')
  if (error) return false
  return Boolean(data)
}
