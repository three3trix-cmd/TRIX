import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from './firebase'

// VAPID публичный ключ (из вашей генерации)
const VAPID_PUBLIC_KEY = 'BI3AUGoFr1k6cBt9zAYrNxLFSqPsncUwqm0viZy5ZORECatIGwCvLbOeDFc6nAdA7TyVFI2zd7Rcr-89Ltwqu94'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(async (registration) => {
        console.log('[PWA] Service Worker зарегистрирован')
        
        // Запрос разрешения на уведомления
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          await subscribeToPushNotifications(registration)
        }
      })
      .catch((error) => {
        console.error('[PWA] Ошибка регистрации Service Worker:', error)
      })
  })
}

async function subscribeToPushNotifications(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
    
    console.log('[PWA] Push-подписка создана')
    
    const user = JSON.parse(localStorage.getItem('anon_user') || '{}')
    if (user.id) {
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: subscription
      })
    }
  } catch (error) {
    console.error('[PWA] Ошибка подписки:', error)
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

createRoot(document.getElementById('root')).render(<App />)