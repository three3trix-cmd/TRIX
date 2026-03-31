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
  const [menuOpen, setMenuOpen] = useState(false)

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
    }
  }

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает уведомления')
      return
    }
    
    if (Notification.permission === 'granted') {
      new Notification('Уведомления уже включены! 🎣', {
        body: 'Вы будете получать уведомления о новых сообщениях',
        icon: '/icons/icon-192x192.png'
      })
      return
    }
    
    if (Notification.permission === 'denied') {
      alert('🔕 Уведомления запрещены!\n\nЧтобы включить:\n1️⃣ Нажмите на значок замка 🔒 слева от адреса\n2️⃣ Выберите "Настройки сайта"\n3️⃣ Найдите "Уведомления" → выберите "Разрешить"\n4️⃣ Обновите страницу')
      return
    }
    
    const permission = await Notification.requestPermission()
    setNotificationStatus(permission)
    
    if (permission === 'granted') {
      new Notification('Уведомления включены! 🔥', {
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

  const showNotificationButton = 'Notification' in window && notificationStatus !== 'granted'
  const getNotificationButtonText = () => notificationStatus === 'denied' ? '🔕 Включить уведомления' : '🔔 Уведомления'

  return (
    <div className="h-screen flex relative">
      {/* Кнопка меню для мобильных - скрывается когда меню открыто */}
      {!menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg"
        >
          ☰ Комнаты
        </button>
      )}
      
      {/* Кнопки в правом верхнем углу */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {showNotificationButton && (
          <button
            onClick={handleRequestNotification}
            className={`px-3 py-2 rounded-lg shadow-lg transition text-sm font-medium ${
              notificationStatus === 'denied' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
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

      {/* Левая панель с комнатами - адаптивная */}
      <div className={`fixed md:relative inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-sm flex flex-col z-40 transition-transform duration-300 ${
        menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 border-b bg-white/50 flex justify-between items-center">
          <div>
            <div className="font-bold text-xl text-indigo-600">3TRIX</div>
            <div className="text-xs text-gray-500 mt-1">
              {user.name} ⚛️
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="md:hidden text-gray-500 text-xl"
          >
            ✕
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-red-500 p-3 hover:bg-red-50 transition text-left"
        >
          Выйти на свободу
        </button>
        <RoomList 
          onSelectRoom={(r) => {
            setActiveRoom(r)
            setMenuOpen(false)
          }} 
          activeRoom={activeRoom}
          user={user}
        />
      </div>
      
      {/* Оверлей для мобильного меню */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Правая панель с чатом */}
      <div className="flex-1 bg-cover bg-center bg-no-repeat chat-panel flex flex-col h-screen overflow-hidden">
        {activeRoom ? (
          <ChatRoom roomId={activeRoom} user={user} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl text-center mx-4">
              <div className="text-6xl mb-4">✨</div>
              <div className="text-gray-600 text-lg">
                Выберите или создайте комнату<br />
                для дружеских и иных бесед
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}