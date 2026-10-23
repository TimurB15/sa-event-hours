import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { App } from '@capacitor/app'
import { Share } from '@capacitor/share'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
export async function tapFeedback() {
  if (Capacitor.isNativePlatform()) { try { await Haptics.impact({ style: ImpactStyle.Light }) } catch { /* optional feedback */ } }
}
export async function saveAndShare(filename: string, data: string, mime = 'application/json') {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({path:filename,data,directory:Directory.Cache,encoding:Encoding.UTF8})
    const {uri} = await Filesystem.getUri({directory:Directory.Cache,path:filename})
    await Share.share({title:'SA Event Logistics',url:uri})
  } else {
    const url=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
}
export function registerNativeLifecycle() {
  if (!Capacitor.isNativePlatform()) return () => {}
  const handles = [
    App.addListener('backButton', ({canGoBack}) => { if (canGoBack) history.back(); else void App.minimizeApp() }),
    App.addListener('appUrlOpen', ({url}) => {
      const parsed=new URL(url)
      // Tokens are accepted only from our application scheme. OAuth uses PKCE.
      if (parsed.protocol==='saevent:' && parsed.hostname==='auth') {
        void import('../cloud/client').then(m => m.exchangeAuthCallback(url)).then(() => { location.hash='/cloud' }).catch(() => { location.hash='/cloud'; alert('קישור הכניסה לא תקין או שפג תוקפו. בקשו קישור חדש.') })
      }
    }),
  ]
  return () => { handles.forEach(async handle => (await handle).remove()) }
}
