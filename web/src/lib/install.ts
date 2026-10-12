import { useSyncExternalStore } from 'react'

/** The browser's PWA install prompt, captured once and shared by every component that offers "Install app". */
interface InstallEvent extends Event { prompt: () => Promise<void> }
let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; emit() })
  window.addEventListener('appinstalled', () => { deferred = null; emit() })
}

export function useInstall(): (() => void) | null {
  const available = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => deferred !== null)
  return available ? () => { deferred?.prompt(); deferred = null; emit() } : null
}
