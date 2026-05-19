import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getCurrentSession, hasAdminTestBypass, isCurrentUserAdmin } from '@/lib/supabase'

export function useAdminAccess() {
  const testBypass = hasAdminTestBypass()
  const [session, setSession] = useState<Session | null | undefined>(testBypass ? null : undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(testBypass ? true : undefined)

  useEffect(() => {
    if (testBypass) return

    Promise.all([getCurrentSession(), isCurrentUserAdmin()])
      .then(([currentSession, adminAccess]) => {
        setSession(currentSession)
        setIsAdmin(adminAccess)
      })
      .catch(() => {
        setSession(null)
        setIsAdmin(false)
      })
  }, [testBypass])

  return {
    isAllowed: testBypass || (Boolean(session) && Boolean(isAdmin)),
    isLoading: (session === undefined || isAdmin === undefined) && !testBypass,
    session,
    testBypass,
  }
}
