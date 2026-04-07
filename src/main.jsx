import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from './firebase'

// VAPID ключ (публичный)
const VAPID_PUBLIC_KEY = 'BI3AUGoFr1k6cBt9zAYrNxLFSqPsncUwqm0viZy5ZORECatIGwCvLbOeDFc6nAdA7TyVFI2zd7Rcr-89Ltwqu94'

// Запрос разрешения на уведомления
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[PWA] Браузер не поддерживает уведомления')
    return false
  }
  
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    console.log('[PWA] Уведомления разрешены')
    return true
  }
  return false
}

// Функция для подписки на push (VAPID)
async function subscribeToPushNotifications(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })
    
    console.log('[PWA] VAPID Push-подписка создана')
    
    const user = JSON.parse(localStorage.getItem('anon_user') || '{}')
    if (user.id) {
      // Сохраняем подписку в Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      if (error) {
        console.error('[PWA] Ошибка сохранения подписки:', error)
      } else {
        console.log('[PWA] Подписка сохранена в БД')
      }
    }
  } catch (error) {
    console.error('[PWA] Ошибка VAPID подписки:', error)
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

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[PWA] Service Worker зарегистрирован')
      
      // Запрашиваем разрешение на уведомления
      const granted = await requestNotificationPermission()
      
      if (granted) {
        // Подписываемся на VAPID push-уведомления
        await subscribeToPushNotifications(registration)
      }
      
      // Проверяем существующие подписки
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('[PWA] Найдена существующая подписка')
      }
    } catch (error) {
      console.error('[PWA] Ошибка регистрации Service Worker:', error)
    }
  })
}

createRoot(document.getElementById('root')).render(<App />)