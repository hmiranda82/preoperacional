import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const mqDark = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

function applyStatusBar(isDark: boolean) {
  if (!Capacitor.isNativePlatform()) return
  const host = window.document.documentElement

  try {
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    StatusBar.setBackgroundColor({ color: isDark ? '#0d1422' : '#ffffff' })
    host.dataset.theme = isDark ? 'dark' : 'light'
  } catch (err) {
    console.warn('[theme] no se pudo configurar la status bar:', err)
  }
}

export function initTheme() {
  if (mqDark && typeof mqDark.addEventListener === 'function') {
    mqDark.addEventListener('change', (e) => applyStatusBar(e.matches))
  }
  applyStatusBar(mqDark ? mqDark.matches : false)
}