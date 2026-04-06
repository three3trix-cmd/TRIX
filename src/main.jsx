import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { supabase } from './firebase'

// Получаем ключи из переменных окружения
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Функция инициализации OneSignal
async function initOneSignal() {
  if (typeof window === 'undefined') return
  if (window.OneSignal) return
  
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(function(OneSignal) {
    OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false, // Отключаем встроенную кнопку (у нас своя)
      },
    })
  })
  
  console.log('[OneSignal] Инициализирован с App ID:', ONESIGNAL_APP_ID)
}

// Запрос разрешения на уведомления
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    console.log('[PWA] Уведомления разрешены')
    return true
  }
  return false
}

// Функция для подписки на push (OneSignal)
async function subscribeToOneSignal() {
  if (!window.OneSignal) return
  
  try {
    const user = JSON.parse(localStorage.getItem('anon_user') || '{}')
    if (user.id) {
      await window.OneSignal.setExternalUserId(user.id)
      console.log('[OneSignal] Внешний ID установлен:', user.id)
    }
    
    await window.OneSignal.User.PushSubscription.optIn()
    console.log('[OneSignal] Подписка создана')
  } catch (error) {
    console.error('[OneSignal] Ошибка подписки:', error)
  }
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
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: subscription
      })
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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(async (registration) => {
        console.log('[PWA] Service Worker зарегистрирован')
        
        // Инициализируем OneSignal
        await initOneSignal()
        
        // Запрашиваем разрешение на уведомления
        const granted = await requestNotificationPermission()
        
        if (granted) {
          // Подписываемся на OneSignal
          await subscribeToOneSignal()
          // Подписываемся на VAPID
          await subscribeToPushNotifications(registration)
        }
      })
      .catch((error) => {
        console.error('[PWA] Ошибка регистрации Service Worker:', error)
      })
  })
}

createRoot(document.getElementById('root')).render(<App />)