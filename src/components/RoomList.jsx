import React, { useEffect, useState } from 'react'
import { supabase } from '../firebase'

export default function RoomList({ onSelectRoom, activeRoom, user }) {
  const [rooms, setRooms] = useState([])
  const [myRoomIds, setMyRoomIds] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})
  const [mutedRooms, setMutedRooms] = useState({}) // Новое состояние для mute
  const [newName, setNewName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinRoomName, setJoinRoomName] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Загрузка настроек mute из localStorage
  useEffect(() => {
    const savedMuted = JSON.parse(localStorage.getItem('muted_rooms') || '{}')
    setMutedRooms(savedMuted)
  }, [])

  // Функция переключения mute для комнаты
  const toggleMuteRoom = (roomId, roomName, e) => {
    e.stopPropagation()
    
    const newMuted = { ...mutedRooms }
    const isMuted = !mutedRooms[roomId]
    
    if (isMuted) {
      newMuted[roomId] = true
      // Показываем уведомление
      if (Notification.permission === 'granted') {
        new Notification(`🔇 Чат "${roomName}" заглушен`, {
          body: 'Вы не будете получать уведомления из этого чата',
          icon: '/icons/icon-72x72.png',
          silent: true
        })
      }
    } else {
      delete newMuted[roomId]
      if (Notification.permission === 'granted') {
        new Notification(`🔔 Чат "${roomName}" включен`, {
          body: 'Уведомления из этого чата снова будут приходить',
          icon: '/icons/icon-72x72.png',
          silent: true
        })
      }
    }
    
    setMutedRooms(newMuted)
    localStorage.setItem('muted_rooms', JSON.stringify(newMuted))
  }

  // Функция загрузки непрочитанных сообщений (обновлена с учетом mute)
  async function loadUnreadCounts(roomsList) {
    const counts = {}
    const lastRead = JSON.parse(localStorage.getItem('last_read_messages') || '{}')
    
    for (const room of roomsList) {
      const hasAccess = !room.is_private || myRoomIds.includes(room.id)
      if (!hasAccess) continue
      
      // Пропускаем заглушенные комнаты
      if (mutedRooms[room.id]) continue
      
      const lastReadTime = lastRead[room.id] || new Date(0).toISOString()
      
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .neq('user_data->>id', user.id)
        .gt('timestamp', lastReadTime)
      
      if (!error) {
        counts[room.id] = count || 0
      }
    }
    setUnreadCounts(counts)
  }

  // Загрузка комнат
  async function loadRooms() {
    try {
      const { data: publicRooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: true })
      
      const { data: memberRooms } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id)
      
      const memberRoomIds = memberRooms?.map(m => m.room_id) || []
      setMyRoomIds(memberRoomIds)
      
      const { data: privateRooms } = await supabase
        .from('rooms')
        .select('*')
        .in('id', memberRoomIds)
        .eq('is_private', true)
      
      const allRooms = [...(publicRooms || []), ...(privateRooms || [])]
      const uniqueRooms = allRooms.filter((room, index, self) => 
        index === self.findIndex(r => r.id === room.id)
      )
      
      setRooms(uniqueRooms)
      await loadUnreadCounts(uniqueRooms)
    } catch (err) {
      console.error('Load rooms error:', err)
    }
  }

  useEffect(() => {
    loadRooms()

    const channel = supabase
      .channel('rooms-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => loadRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => loadRooms())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new && payload.new.room_id) {
          loadUnreadCounts(rooms)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, mutedRooms]) // Добавлена зависимость от mutedRooms

  // ... остальные функции (createRoom, joinPrivateRoom, forgetRoom, deleteRoom) остаются без изменений ...

  async function createRoom(e) {
    e.preventDefault()
    if (!newName.trim()) {
      alert('Введите название чата')
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
      await loadRooms()
    } catch (err) {
      console.error('Create room error:', err)
      alert('Ошибка создания чата: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function joinPrivateRoom() {
    if (!joinRoomName.trim()) {
      alert('Введите название чата')
      return
    }
    
    setLoading(true)
    
    try {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('name', joinRoomName.trim())
        .eq('is_private', true)
        .single()
      
      if (error || !room) {
        alert('Приватный чат с таким названием не найден')
        return
      }
      
      if (room.password !== joinPassword) {
        alert('Неверный пароль')
        return
      }
      
      const { data: existing } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single()
      
      if (!existing) {
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
      await loadRooms()
    } catch (err) {
      console.error('Join room error:', err)
      alert('Ошибка присоединения к чату')
    } finally {
      setLoading(false)
    }
  }

  async function forgetRoom(roomId, roomName) {
    if (!window.confirm(`Забыть чат "${roomName}"? Чтобы вернуться, нужно будет снова ввести пароль.`)) {
      return
    }
    
    try {
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)
      
      // Удаляем из muted при выходе
      const newMuted = { ...mutedRooms }
      delete newMuted[roomId]
      setMutedRooms(newMuted)
      localStorage.setItem('muted_rooms', JSON.stringify(newMuted))
      
      if (activeRoom === roomId) {
        onSelectRoom(null)
      }
      
      await loadRooms()
    } catch (err) {
      console.error('Forget room error:', err)
      alert('Ошибка при выходе из чата')
    }
  }

  async function deleteRoom(roomId, roomName) {
    if (!window.confirm(`Удалить чат "${roomName}"? Это действие необратимо.`)) {
      return
    }
    
    try {
      await supabase.from('rooms').delete().eq('id', roomId)
      
      // Удаляем из muted при удалении
      const newMuted = { ...mutedRooms }
      delete newMuted[roomId]
      setMutedRooms(newMuted)
      localStorage.setItem('muted_rooms', JSON.stringify(newMuted))
      
      if (activeRoom === roomId) {
        onSelectRoom(null)
      }
      await loadRooms()
    } catch (err) {
      console.error('Delete room error:', err)
      alert('Ошибка удаления чата')
    }
  }

  const handleSelectRoom = (roomId) => {
    const lastRead = JSON.parse(localStorage.getItem('last_read_messages') || '{}')
    lastRead[roomId] = new Date().toISOString()
    localStorage.setItem('last_read_messages', JSON.stringify(lastRead))
    
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }))
    onSelectRoom(roomId)
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
    + Создать чат
  </button>
  
  <button
    onClick={() => setShowJoinModal(true)}
    className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
  >
    🔑 Присоединиться к приватному чату
  </button>
  
  {/* Разделитель */}
  <div className="border-t my-2"></div>
  
  {/* Кнопки управления уведомлениями */}
  <div className="grid grid-cols-2 gap-2">
    <button
      onClick={() => {
        const allMuted = {}
        rooms.forEach(r => { 
          if (isMember(r.id)) allMuted[r.id] = true 
        })
        setMutedRooms(allMuted)
        localStorage.setItem('muted_rooms', JSON.stringify(allMuted))
      }}
      className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition text-xs"
      title="Отключить уведомления для всех чатов"
    >
      🔇 Заглушить все
    </button>
    
    <button
      onClick={() => {
        setMutedRooms({})
        localStorage.setItem('muted_rooms', '{}')
      }}
      className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition text-xs"
      title="Включить уведомления для всех чатов"
    >
      🔔 Включить все
    </button>
  </div>
</div>


      <div className="flex-1 overflow-auto">
        {rooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Нет чатов. Создайте первый!
          </div>
        ) : (
          rooms.map((r) => {
            const member = isMember(r.id)
            const unread = unreadCounts[r.id] || 0
            const isMuted = mutedRooms[r.id] || false
            const roomTypeIcon = r.is_private ? '🔒' : '🌐'
            const roomTypeLabel = r.is_private ? 'Приватный' : 'Публичный'
            
            return (
              <div 
                key={r.id} 
                className={`border-t ${activeRoom === r.id ? 'bg-indigo-50' : ''} ${isMuted ? 'opacity-75' : ''}`}
              >
                <div 
                  onClick={() => member && handleSelectRoom(r.id)}
                  className={`p-3 cursor-pointer transition ${!member ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <span title={roomTypeLabel}>{roomTypeIcon}</span>
                        <span>{r.name}</span>
                        {isMuted && <span className="text-gray-400 text-xs" title="Уведомления отключены">🔇</span>}
                        {!member && <span className="text-xs text-gray-400">(нет доступа)</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span>{r.id.slice(0, 8)}...</span>
                        {r.is_private && member && <span className="text-orange-500">🔐 участник</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {unread > 0 && member && !isMuted && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center animate-bounce">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                      <div className="flex gap-1">
                        {/* Кнопка Mute/Unmute */}
                        {member && (
                          <button
                            onClick={(e) => toggleMuteRoom(r.id, r.name, e)}
                            className={`text-xs px-2 py-1 rounded transition ${
                              isMuted 
                                ? 'bg-gray-400 hover:bg-gray-500 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                            title={isMuted ? 'Включить уведомления' : 'Отключить уведомления'}
                          >
                            {isMuted ? '🔔' : '🔕'}
                          </button>
                        )}
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
                            title="Удалить чат"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Модальные окна остаются без изменений */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-bold mb-4">Создать чат</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название чата"
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
              Приватный чат (нужен пароль)
            </label>
            {isPrivate && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль от чата"
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

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-bold mb-4">Присоединиться к приватному чату</h3>
            <input
              type="text"
              value={joinRoomName}
              onChange={(e) => setJoinRoomName(e.target.value)}
              placeholder="Название чата"
              className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Пароль чата"
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