import React, { useEffect, useState } from 'react'
import Login from './components/Login'
import RoomList from './components/RoomList'
import ChatRoom from './components/ChatRoom'
import chatBg from './assets/chat-bg.jpg'

export default function App() {
  const [user, setUser] = useState(null)
  const [activeRoom, setActiveRoom] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState('default')

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission)
    }
    
    const stored = localStorage.getItem('anon_user')
    if (stored) {
      const userData = JSON.parse(stored)
      setUser(userData)
    }
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    })
    
    window.addEventListener('appinstalled', () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    })
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('Приложение установлено')
      }
      setDeferredPrompt(null)
      setShowInstallButton(false)
    } else {
      alert('Установка доступна только через HTTPS (на Vercel)')
    }
  }

  const handleRequestNotification = async () => {
  if (!('Notification' in window)) {
    alert('Ваш браузер не поддерживает уведомления')
    return
  }
  
  // Если уже разрешены
  if (Notification.permission === 'granted') {
    new Notification('Уведомления уже включены! 🎣', {
      body: 'Вы будете получать уведомления о новых сообщениях',
      icon: '/icons/icon-192x192.png'
    })
    return
  }
  
  // Если запрещены - показываем инструкцию
  if (Notification.permission === 'denied') {
    alert('🔕 Уведомления запрещены!\n\nЧтобы включить:\n1️⃣ Нажмите на значок замка 🔒 слева от адреса\n2️⃣ Выберите "Настройки сайта"\n3️⃣ Найдите "Уведомления" → выберите "Разрешить"\n4️⃣ Обновите страницу')
    return
  }
  
  // Если еще не запрошены
  const permission = await Notification.requestPermission()
  setNotificationStatus(permission)
  
  if (permission === 'granted') {
    new Notification('Уведомления включены! 🎣', {
      body: 'Теперь вы будете получать уведомления о новых сообщениях',
      icon: '/icons/icon-192x192.png'
    })
  }
}

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      localStorage.removeItem('anon_user')
      setUser(null)
      setActiveRoom(null)
    }
  }

  if (!user) return <Login onLogin={(u) => setUser(u)} />

  // Показываем кнопку уведомлений всегда, если они не разрешены
  const showNotificationButton = 'Notification' in window && 
    notificationStatus !== 'granted'

  // Разные тексты для кнопки в зависимости от статуса
  const getNotificationButtonText = () => {
    if (notificationStatus === 'denied') return '🔕 Включить уведомления'
    if (notificationStatus === 'default') return '🔔 Включить уведомления'
    return '🔔 Уведомления'
  }

  return (
    <div className="h-screen flex relative">
      {/* Кнопки в правом верхнем углу */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {showNotificationButton && (
          <button
            onClick={handleRequestNotification}
            className={`px-3 py-2 rounded-lg shadow-lg transition text-sm font-medium ${
              notificationStatus === 'denied' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            } text-white`}
          >
            {getNotificationButtonText()}
          </button>
        )}
        
        {showInstallButton && (
          <button
            onClick={handleInstall}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow-lg transition text-sm font-medium"
          >
            📱 Установить
          </button>
        )}
      </div>

      {/* Левая панель */}
      <div className="w-80 border-r bg-white/95 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b bg-white/50">
          <div className="font-bold text-xl text-indigo-600">3TRIX 💬</div>
          <div className="text-xs text-gray-500 mt-1">
            {user.name} ⚛️
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-500 mt-2 hover:text-red-700 transition"
          >
            Выйти на свободу
          </button>
        </div>
        <RoomList 
          onSelectRoom={(r) => setActiveRoom(r)} 
          activeRoom={activeRoom}
          user={user}
        />
      </div>

      {/* Правая панель с чатом */}
      <div 
        className="flex-1 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${chatBg})`,
          backgroundColor: '#0a2f44'
        }}
      >
        {activeRoom ? (
          <ChatRoom roomId={activeRoom} user={user} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl text-center">
              <div className="text-6xl mb-4">⚛️</div>
              <div className="text-gray-600 text-lg">
                Выберите или создайте комнату<br />
                для интересных бесед
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}