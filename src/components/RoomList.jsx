import React, { useEffect, useState } from 'react'
import { supabase } from '../firebase'

export default function RoomList({ onSelectRoom, activeRoom, user }) {
  const [rooms, setRooms] = useState([])
  const [myRoomIds, setMyRoomIds] = useState([])
  const [newName, setNewName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinRoomName, setJoinRoomName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Загрузка комнат
  useEffect(() => {
    loadRooms()

    const channel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => loadRooms())
      .subscribe()

    const membersChannel = supabase
      .channel('public:room_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => loadRooms())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(membersChannel)
    }
  }, [user.id])

  async function loadRooms() {
    try {
      // Загружаем все публичные комнаты
      const { data: publicRooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: true })
      
      // Загружаем ID комнат, где пользователь участник
      const { data: memberRooms } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id)
      
      const memberRoomIds = memberRooms?.map(m => m.room_id) || []
      setMyRoomIds(memberRoomIds)
      
      // Загружаем приватные комнаты, где пользователь участник
      const { data: privateRooms } = await supabase
        .from('rooms')
        .select('*')
        .in('id', memberRoomIds)
        .eq('is_private', true)
      
      setRooms([...(publicRooms || []), ...(privateRooms || [])])
    } catch (err) {
      console.error('Load rooms error:', err)
    }
  }

  async function createRoom(e) {
    e.preventDefault()
    if (!newName.trim()) {
      alert('Введите название комнаты')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({ 
          name: newName.trim(),
          is_private: isPrivate,
          password: isPrivate ? password : null,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Добавляем создателя как участника
      await supabase.from('room_members').insert({
        room_id: data.id,
        user_id: user.id,
        user_name: user.name,
        role: 'admin'
      })
      
      setNewName('')
      setPassword('')
      setIsPrivate(false)
      setShowCreateModal(false)
      onSelectRoom(data.id)
      loadRooms()
    } catch (err) {
      console.error('Create room error:', err)
      alert('Ошибка создания комнаты: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function joinPrivateRoom() {
    if (!joinRoomName.trim()) {
      alert('Введите название комнаты')
      return
    }
    
    setLoading(true)
    
    try {
      // Ищем комнату по названию
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('name', joinRoomName.trim())
        .eq('is_private', true)
        .single()
      
      if (error || !room) {
        alert('Приватная комната с таким названием не найдена')
        return
      }
      
      // Проверяем пароль
      if (room.password !== joinPassword) {
        alert('Неверный пароль')
        return
      }
      
      // Проверяем, не является ли пользователь уже участником
      const { data: existing } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single()
      
      if (!existing) {
        // Добавляем пользователя в участники
        await supabase.from('room_members').insert({
          room_id: room.id,
          user_id: user.id,
          user_name: user.name,
          role: 'member'
        })
      }
      
      setJoinRoomName('')
      setJoinPassword('')
      setShowJoinModal(false)
      onSelectRoom(room.id)
      loadRooms()
    } catch (err) {
      console.error('Join room error:', err)
      alert('Ошибка присоединения к комнате')
    } finally {
      setLoading(false)
    }
  }

  async function forgetRoom(roomId, roomName) {
    if (!window.confirm(`Забыть комнату "${roomName}"? Чтобы вернуться, нужно будет снова ввести пароль.`)) {
      return
    }
    
    try {
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)
      
      if (activeRoom === roomId) {
        onSelectRoom(null)
      }
      
      loadRooms()
    } catch (err) {
      console.error('Forget room error:', err)
      alert('Ошибка при выходе из комнаты')
    }
  }

  async function deleteRoom(roomId, roomName) {
    if (!window.confirm(`Удалить комнату "${roomName}"? Это действие необратимо.`)) {
      return
    }
    
    try {
      await supabase.from('rooms').delete().eq('id', roomId)
      if (activeRoom === roomId) {
        onSelectRoom(null)
      }
      loadRooms()
    } catch (err) {
      console.error('Delete room error:', err)
      alert('Ошибка удаления комнаты')
    }
  }

  const isMember = (roomId) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room?.is_private) return true
    return myRoomIds.includes(roomId)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 space-y-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition"
        >
          + Создать комнату
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
        >
          🔑 Присоединиться к приватной
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {rooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Нет комнат. Создайте первую!
          </div>
        ) : (
          rooms.map((r) => {
            const member = isMember(r.id)
            return (
              <div 
                key={r.id} 
                className={`border-t ${activeRoom === r.id ? 'bg-indigo-50' : ''}`}
              >
                <div 
                  onClick={() => member && onSelectRoom(r.id)}
                  className={`p-3 cursor-pointer transition ${!member ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">
                        {r.name}
                        {r.is_private && ' 🔒'}
                        {!member && ' (нет доступа)'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {r.id.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {r.is_private && member && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            forgetRoom(r.id, r.name)
                          }}
                          className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition"
                          title="Забыть комнату"
                        >
                          🚪
                        </button>
                      )}
                      {r.user_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteRoom(r.id, r.name)
                          }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                          title="Удалить комнату"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Модальное окно создания комнаты */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-bold mb-4">Создать комнату</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название комнаты"
              className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && createRoom(e)}
            />
            <label className="flex items-center mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mr-2"
              />
              Приватная комната (нужен пароль)
            </label>
            {isPrivate && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль комнаты"
                className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={createRoom}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewName('')
                  setPassword('')
                  setIsPrivate(false)
                }}
                className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно присоединения к приватной комнате */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-bold mb-4">Присоединиться к приватной комнате</h3>
            <input
              type="text"
              value={joinRoomName}
              onChange={(e) => setJoinRoomName(e.target.value)}
              placeholder="Название комнаты"
              className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Пароль комнаты"
              className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && joinPrivateRoom()}
            />
            <div className="flex gap-2">
              <button
                onClick={joinPrivateRoom}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? 'Присоединение...' : 'Присоединиться'}
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinRoomName('')
                  setJoinPassword('')
                }}
                className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}