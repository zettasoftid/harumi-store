/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly VITE_ENABLE_ADMIN_TEST_BYPASS?: string
  readonly VITE_LOCAL_API_ENDPOINT?: string
  readonly VITE_LOCAL_DELETE_ENDPOINT?: string
  readonly VITE_LOCAL_STORAGE?: string
  readonly VITE_LOCAL_UPLOAD_ENDPOINT?: string
  readonly VITE_R2_DELETE_ENDPOINT?: string
  readonly VITE_R2_PUBLIC_URL?: string
  readonly VITE_R2_UPLOAD_ENDPOINT?: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
