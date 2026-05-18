import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getCurrentSession, hasAdminTestBypass } from '@/lib/supabase'

export function useAdminAccess() {
  const testBypass = hasAdminTestBypass()
  const [session, setSession] = useState<Session | null | undefined>(testBypass ? null : undefined)

  useEffect(() => {
    if (testBypass) return

    getCurrentSession()
      .then(setSession)
      .catch(() => setSession(null))
  }, [testBypass])

  return {
    isAllowed: Boolean(session) || testBypass,
    isLoading: session === undefined && !testBypass,
    session,
    testBypass,
  }
}
