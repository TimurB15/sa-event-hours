import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const cloud = url && key ? createClient(url,key, { auth: { persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce' } }) : null
export async function rpc(name: string, args: Record<string,unknown>) {
  if (!cloud || !navigator.onLine) throw new Error('נדרש חיבור לרשת ולסביבת העבודה')
  const { data,error } = await cloud.rpc(name,args)
  if (error) throw error
  return data
}

/** Exchange only a PKCE code: never persist tokens from arbitrary URL fragments. */
export async function exchangeAuthCallback(url: string) {
  if (!cloud) return
  const parsed = new URL(url)
  if (parsed.protocol !== 'saevent:' && parsed.origin !== location.origin) return
  const code = parsed.searchParams.get('code')
  if (code) {
    const { error } = await cloud.auth.exchangeCodeForSession(code)
    if (error) throw error
  }
}
