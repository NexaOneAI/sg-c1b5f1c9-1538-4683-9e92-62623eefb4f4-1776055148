/**
 * PWA Service Worker Registration
 * 
 * Registra el service worker para funcionalidad offline
 * Detecta actualizaciones y notifica al usuario
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('✅ Service Worker registrado:', registration.scope);

        // Detectar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('🔄 Nueva versión de la app disponible');
              
              // Mostrar notificación al usuario
              if (confirm('Nueva versión disponible. ¿Recargar ahora?')) {
                window.location.reload();
              }
            }
          });
        });

      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    });
  }
}

/**
 * Detectar si la app está instalada como PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Solicitar permiso para notificaciones push
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Detectar si está en iOS Safari
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent);
}

/**
 * Mostrar prompt de instalación PWA
 */
let deferredPrompt: any = null;

export function setupPWAInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 PWA instalable detectada');
  });
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('❌ No hay prompt de instalación disponible');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`🎯 Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} instalar la PWA`);
  
  deferredPrompt = null;
  return outcome === 'accepted';
}