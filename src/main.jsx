import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker зарегистрирован:', registration.scope)
        
        // Проверка обновлений
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Доступно обновление!')
              if (window.confirm('Доступна новая версия! Обновить?')) {
                window.location.reload()
              }
            }
          })
        })
      })
      .catch((error) => {
        console.error('[PWA] Ошибка регистрации Service Worker:', error)
      })
  })
}

createRoot(document.getElementById('root')).render(<App />)