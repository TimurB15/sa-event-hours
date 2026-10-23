import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.saeventlogistics.mobile',
  appName: 'SA Event Logistics',
  webDir: 'dist',
  ios: { contentInset: 'never', preferredContentMode: 'mobile' },
  android: { allowMixedContent: false },
}
export default config
