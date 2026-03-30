import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import loginBg from '../assets/login-bg.jpg' // Импортируем фон

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)
  const [nickname, setNickname] = useState('')
  const [showNicknameInput, setShowNicknameInput] = useState(false)

  // Проверяем, есть ли сохраненный пользователь при загрузке
  React.useEffect(() => {
    const stored = localStorage.getItem('anon_user')
    if (stored) {
      const user = JSON.parse(stored)
      onLogin(user)
    }
  }, [onLogin])

  function handleAnonLogin() {
    if (!nickname.trim()) {
      alert('Пожалуйста, введите никнейм')
      return
    }
    
    setLoading(true)
    const user = { 
      id: uuidv4(), 
      name: nickname.trim(),
      createdAt: new Date().toISOString()
    }
    localStorage.setItem('anon_user', JSON.stringify(user))
    onLogin(user)
    setLoading(false)
  }

  if (!showNicknameInput) {
    return (
      <div 
        className="h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${loginBg})`,
          backgroundColor: '#1a1a2e' // fallback цвет
        }}
      >
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-xl w-96 text-center">
          <h1 className="text-3xl font-bold mb-2 text-indigo-600">3TRIX</h1>
          <p className="text-gray-600 mb-6">Чат для своих</p>
          
          <button 
            onClick={() => setShowNicknameInput(true)}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition mb-3"
          >
            Войти с ником
          </button>
          
          <button 
            onClick={() => {
              const randomName = 'Рыбак_' + Math.random().toString(36).slice(2, 8)
              setNickname(randomName)
              setShowNicknameInput(true)
            }}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Случайный ник
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url(${loginBg})`,
        backgroundColor: '#1a1a2e'
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-xl w-96 text-center">
        <h1 className="text-3xl font-bold mb-2 text-indigo-600">3TRIX 💬</h1>
        <p className="text-gray-600 mb-6">Введите ваш интересный псевдоним</p>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Ваш никнейм"
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
          onKeyPress={(e) => e.key === 'Enter' && handleAnonLogin()}
        />
        <button 
          onClick={handleAnonLogin} 
          disabled={loading || !nickname.trim()} 
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Закидываю удочку...' : 'Заплываем в чат'}
        </button>
        <button 
          onClick={() => setShowNicknameInput(false)}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
        >
          Назад
        </button>
      </div>
    </div>
  )
}