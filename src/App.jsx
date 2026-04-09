import React, { useEffect, useState } from 'react'
import Login from './components/Login'
import RoomList from './components/RoomList'
import ChatRoom from './components/ChatRoom'

// ИСПРАВЛЕНИЕ: Правильный путь к фону
const chatBg = '/images/chat-bg.jpg'

// Компонент с инструкциями по настройке уведомлений
function NotificationInstructions({ onClose }) {
  const [deviceInfo, setDeviceInfo] = useState({ os: 'unknown', browser: 'unknown' })
  
  useEffect(() => {
    detectDevice()
  }, [])
  
  const detectDevice = () => {
    const ua = navigator.userAgent
    let os = 'unknown'
    let browser = 'unknown'
    
    // Определение ОС
    if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'ios'
    } else if (/Android/i.test(ua)) {
      os = 'android'
      // Определение производителя Android
      if (/Xiaomi|Redmi/i.test(ua)) os = 'xiaomi'
      else if (/Huawei|Honor/i.test(ua)) os = 'huawei'
      else if (/Samsung|SM-/i.test(ua)) os = 'samsung'
      else if (/OPPO|CPH/i.test(ua)) os = 'oppo'
    } else if (/Windows/i.test(ua)) {
      os = 'windows'
    } else if (/Mac/i.test(ua)) {
      os = 'mac'
    } else if (/Linux/i.test(ua)) {
      os = 'linux'
    }
    
    // Определение браузера
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'chrome'
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'safari'
    else if (/Firefox/i.test(ua)) browser = 'firefox'
    else if (/Edg/i.test(ua)) browser = 'edge'
    else if (/SamsungBrowser/i.test(ua)) browser = 'samsung'
    
    setDeviceInfo({ os, browser })
  }
  
  const renderInstructions = () => {
    const { os, browser } = deviceInfo
    
    // iOS + Safari
    if (os === 'ios' && browser === 'safari') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на iPhone/iPad</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="font-medium">Установите приложение на домашний экран:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>Нажмите кнопку <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">Поделиться</span> (квадрат со стрелкой ↑)</li>
                <li>Прокрутите вниз и выберите <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">На экран «Домой»</span></li>
                <li>Нажмите <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">Добавить</span></li>
              </ul>
            </li>
            <li className="font-medium">Откройте приложение с домашнего экрана (НЕ из Safari!)</li>
            <li className="font-medium">Нажмите кнопку «🔔 Включить уведомления» в приложении</li>
          </ol>
          <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-xs border border-yellow-200">
            <p className="font-medium text-yellow-800">⚠️ Важно для пользователей из ЕС:</p>
            <p className="text-yellow-700 mt-1">Из-за ограничений Apple, уведомления в PWA не работают в странах Евросоюза. Это ограничение невозможно обойти технически.</p>
          </div>
        </>
      )
    }
    
    // iOS + другой браузер
    if (os === 'ios') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на iPhone/iPad</h3>
          <div className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-200 mb-3">
            <p className="font-medium text-blue-800">Для работы уведомлений используйте Safari</p>
            <p className="text-blue-700 mt-1">Другие браузеры на iOS (Chrome, Firefox, Edge) не поддерживают push-уведомления из-за ограничений Apple.</p>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Откройте сайт в браузере Safari</li>
            <li>Следуйте инструкции для Safari выше</li>
          </ol>
        </>
      )
    }
    
    // Xiaomi
    if (os === 'xiaomi') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на Xiaomi (MIUI)</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="font-medium">Отключите оптимизацию батареи:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>Зайдите в <span className="font-mono bg-gray-100 px-1">Настройки</span> → <span className="font-mono bg-gray-100 px-1">Приложения</span> → <span className="font-mono bg-gray-100 px-1">Управление приложениями</span></li>
                <li>Найдите <span className="font-medium">3TRIX</span> (или ваш браузер)</li>
                <li>Нажмите <span className="font-mono bg-gray-100 px-1">Экономия энергии</span> → выберите <span className="font-medium">«Нет ограничений»</span></li>
              </ul>
            </li>
            <li className="font-medium">Включите автозапуск:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>В настройках приложения включите <span className="font-medium">«Автозапуск»</span></li>
              </ul>
            </li>
            <li className="font-medium">Нажмите кнопку «🔔 Включить уведомления» выше</li>
          </ol>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
            <p className="font-medium">💡 Совет:</p>
            <p>Закрепите приложение в списке недавних (проведите вниз по карточке приложения и нажмите на замочек 🔒)</p>
          </div>
        </>
      )
    }
    
    // Huawei
    if (os === 'huawei') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на Huawei (HarmonyOS/EMUI)</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="font-medium">Настройте запуск приложения:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li><span className="font-mono bg-gray-100 px-1">Настройки</span> → <span className="font-mono bg-gray-100 px-1">Приложения</span> → <span className="font-mono bg-gray-100 px-1">Запуск приложений</span></li>
                <li>Найдите <span className="font-medium">3TRIX</span> (или браузер)</li>
                <li>Отключите <span className="font-medium">«Управлять автоматически»</span></li>
                <li>Включите все три переключателя: <span className="font-medium">Автозапуск, Косвенный запуск, Фоновый запуск</span></li>
              </ul>
            </li>
            <li className="font-medium">Отключите оптимизацию батареи:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>В настройках приложения → <span className="font-mono bg-gray-100 px-1">Батарея</span> → выберите <span className="font-medium">«Не оптимизировать»</span></li>
              </ul>
            </li>
          </ol>
        </>
      )
    }
    
    // Samsung
    if (os === 'samsung') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на Samsung</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="font-medium">Отключите оптимизацию батареи:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li><span className="font-mono bg-gray-100 px-1">Настройки</span> → <span className="font-mono bg-gray-100 px-1">Приложения</span> → выберите браузер</li>
                <li><span className="font-mono bg-gray-100 px-1">Батарея</span> → выберите <span className="font-medium">«Без ограничений»</span></li>
              </ul>
            </li>
            <li className="font-medium">Добавьте в исключения режима сна:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li><span className="font-mono bg-gray-100 px-1">Настройки</span> → <span className="font-mono bg-gray-100 px-1">Обслуживание устройства</span> → <span className="font-mono bg-gray-100 px-1">Батарея</span></li>
                <li><span className="font-mono bg-gray-100 px-1">Фоновые приложения</span> → добавьте в «Приложения в спящем режиме НИКОГДА»</li>
              </ul>
            </li>
          </ol>
        </>
      )
    }
    
    // OPPO/Realme/OnePlus
    if (os === 'oppo') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на OPPO/Realme/OnePlus (ColorOS)</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="font-medium">Разрешите фоновую работу:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li><span className="font-mono bg-gray-100 px-1">Настройки</span> → <span className="font-mono bg-gray-100 px-1">Приложения</span> → <span className="font-mono bg-gray-100 px-1">Автозапуск</span></li>
                <li>Включите для браузера или установленного приложения</li>
              </ul>
            </li>
            <li className="font-medium">Отключите оптимизацию:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>В настройках приложения → <span className="font-mono bg-gray-100 px-1">Экономия энергии</span> → <span className="font-medium">«Разрешить фоновую работу»</span></li>
              </ul>
            </li>
            <li className="font-medium">Закрепите в недавних:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>Откройте список недавних приложений (кнопка ≡)</li>
                <li>Проведите вниз по карточке и нажмите на замочек 🔒</li>
              </ul>
            </li>
          </ol>
        </>
      )
    }
    
    // Android (общие инструкции)
    if (os === 'android') {
      return (
        <>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">📱 Настройка уведомлений на Android</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li className="font-medium">Проверьте настройки браузера:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>Зайдите в <span className="font-mono bg-gray-100 px-1">Настройки Android</span> → <span className="font-mono bg-gray-100 px-1">Приложения</span> → найдите ваш браузер</li>
                <li>Убедитесь, что уведомления разрешены</li>
              </ul>
            </li>
            <li className="font-medium">Отключите оптимизацию батареи для браузера:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li><span className="font-mono bg-gray-100 px-1">Батарея</span> или <span className="font-mono bg-gray-100 px-1">Экономия энергии</span> → <span className="font-medium">«Без ограничений»</span></li>
              </ul>
            </li>
            <li className="font-medium">Для максимальной надежности — установите PWA:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
                <li>Нажмите на кнопку <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded">📱 Установить</span> в правом верхнем углу</li>
              </ul>
            </li>
          </ol>
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
            <p className="font-medium">💡 Важно:</p>
            <p>Некоторые производители могут иметь дополнительные настройки энергосбережения. Если уведомления не приходят — проверьте приложение вашего производителя (Mi Security, Phone Manager и т.д.)</p>
          </div>
        </>
      )
    }
    
    // Desktop
    return (
      <>
        <h3 className="text-lg font-bold text-indigo-600 mb-3">💻 Настройка уведомлений на компьютере</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li className="font-medium">Разрешите уведомления в браузере:
            <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
              <li>Нажмите на значок замка 🔒 слева от адресной строки</li>
              <li>Найдите «Уведомления» и выберите <span className="font-medium">«Разрешить»</span></li>
            </ul>
          </li>
          <li className="font-medium">В Windows 10/11 проверьте Focus Assist:
            <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
              <li>Убедитесь, что режим «Не беспокоить» отключен</li>
            </ul>
          </li>
          <li className="font-medium">В macOS проверьте настройки уведомлений:
            <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 font-normal">
              <li><span className="font-mono bg-gray-100 px-1">Системные настройки</span> → <span className="font-mono bg-gray-100 px-1">Уведомления</span> → найдите ваш браузер</li>
            </ul>
          </li>
        </ol>
      </>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">🔔 Настройка уведомлений</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>
        
        {renderInstructions()}
        
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Понятно, спасибо!
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeRoom, setActiveRoom] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState('default')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission)
    }
    
    const stored = localStorage.getItem('anon_user')
    if (stored) {
      const userData = JSON.parse(stored)
      setUser(userData)
    }
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
      console.log('PWA установлено')
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // ИСПОЛЬЗУЕТСЯ: Функция установки PWA
  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('Приложение уже установлено или функция недоступна')
      return
    }
    
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA установлено пользователем')
        setShowInstallButton(false)
      }
    } catch (error) {
      console.error('Ошибка установки:', error)
    } finally {
      setDeferredPrompt(null)
    }
  }

  // ИСПОЛЬЗУЕТСЯ: Функция запроса уведомлений
  const handleRequestNotification = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает уведомления')
      return
    }
    
    // Если уже разрешены - показываем инструкции
    if (Notification.permission === 'granted') {
      setShowInstructions(true)
      
      // На десктопе показываем тестовое уведомление
      if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            registration.showNotification('Уведомления уже включены! 🔥', {
              body: 'Вы будете получать уведомления о новых сообщениях',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png'
            })
          }
        } catch (e) {
          console.warn('Не удалось показать тестовое уведомление:', e)
        }
      }
      return
    }
    
    // Если запрещены - показываем инструкции как включить
    if (Notification.permission === 'denied') {
      setShowInstructions(true)
      return
    }
    
    // Запрашиваем разрешение
    try {
      const permission = await Notification.requestPermission()
      setNotificationStatus(permission)
      
      // Всегда показываем инструкции после запроса
      setShowInstructions(true)
      
      if (permission === 'granted') {
        console.log('[PWA] Уведомления разрешены')
      }
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error)
      setShowInstructions(true)
    }
  }

  // ИСПОЛЬЗУЕТСЯ: Функция выхода
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      localStorage.removeItem('anon_user')
      setUser(null)
      setActiveRoom(null)
      setMenuOpen(false)
    }
  }

  if (!user) return <Login onLogin={(u) => setUser(u)} />

  const showNotificationButton = 'Notification' in window && notificationStatus !== 'granted'
  const getNotificationButtonText = () => {
    if (notificationStatus === 'denied') return '🔕 Включить уведомления'
    if (notificationStatus === 'granted') return '🔔 Настроить уведомления'
    return '🔔 Включить уведомления'
  }

  return (
    <div className="h-screen flex relative">
      {/* Кнопка меню для мобильных */}
      {!menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden fixed z-50 bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg"
          style={{ 
            top: 'max(16px, env(safe-area-inset-top))',
            left: 'max(16px, env(safe-area-inset-left))'
          }}
        >
          ☰ Комнаты
        </button>
      )}

      {/* Кнопки в правом верхнем углу */}
      <div 
        className="fixed z-50 flex gap-2"
        style={{ 
          top: 'max(16px, env(safe-area-inset-top))',
          right: 'max(16px, env(safe-area-inset-right))'
        }}
      >
        {/* ИСПРАВЛЕНИ: Кнопка уведомлений всегда показывается */}
        <button
          onClick={handleRequestNotification}
          className={`px-3 py-2 rounded-lg shadow-lg transition text-sm font-medium ${
            notificationStatus === 'denied' 
              ? 'bg-red-500 hover:bg-red-600' 
              : notificationStatus === 'granted'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-yellow-500 hover:bg-yellow-600'
          } text-white`}
        >
          {getNotificationButtonText()}
        </button>
        
        {/* ИСПРАВЛЕНИ: Кнопка установки показывается только когда доступна */}
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
            className="md:hidden text-gray-500 text-xl hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <button
          onClick={handleLogout}
          className="text-xs text-red-500 p-3 hover:bg-red-50 transition text-left border-b"
        >
          🚪 Выйти
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
          onClick={() => setMenuOpen(false)} 
        />
      )}

      {/* Правая панель с чатом */}
      <div 
        className="flex-1 bg-cover bg-center bg-no-repeat chat-panel flex flex-col h-screen overflow-hidden"
        style={{ 
          backgroundImage: `url(${chatBg})`,
          backgroundColor: '#0a2f44'
        }}
      >
        {activeRoom ? (
          <ChatRoom roomId={activeRoom} user={user} />
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-xl text-center max-w-md">
              <div className="text-6xl mb-4">✨</div>
              <div className="text-gray-600 text-lg">
                Выберите или создайте комнату<br />
                для дружеских и иных бесед
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Модальное окно с инструкциями */}
      {showInstructions && (
        <NotificationInstructions onClose={() => setShowInstructions(false)} />
      )}
    </div>
  )
}