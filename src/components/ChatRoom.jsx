import React, { useEffect, useRef, useState } from 'react'
import { supabase, subscribeToRoomMessages } from '../firebase'
import EmojiPicker from 'emoji-picker-react'

export default function ChatRoom({ roomId, user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!roomId) return
    let mounted = true
    
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: true })
      
      if (error) {
        console.error('Error loading messages:', error)
        return
      }
      
      if (mounted) {
        setMessages(data || [])
      }
    }
    
    loadMessages()

    const channel = subscribeToRoomMessages(roomId, (payload) => {
      if (!mounted) return
      
      if (payload.eventType === 'INSERT' && payload.new) {
        setMessages(prev => [...prev, payload.new])
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      }
    })

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || loading) return

    setLoading(true)
    
    const payload = {
      room_id: roomId,
      user_data: { id: user.id, name: user.name },
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    try {
      const { error } = await supabase.from('messages').insert(payload)
      if (error) {
        console.error('Send error:', error)
        alert('Ошибка отправки: ' + error.message)
      } else {
        setText('')
        setShowEmojiPicker(false)
      }
    } catch (err) {
      console.error('Send error:', err)
      alert('Не удалось отправить сообщение')
    } finally {
      setLoading(false)
    }
  }

  async function deleteMessage(messageId) {
    if (window.confirm('Удалить сообщение?')) {
      try {
        await supabase.from('messages').delete().eq('id', messageId)
      } catch (err) {
        console.error('Delete error:', err)
        alert('Не удалось удалить сообщение')
      }
    }
  }

  async function editMessage(messageId, newText) {
    if (!newText.trim()) return
    
    try {
      await supabase
        .from('messages')
        .update({ text: newText.trim() })
        .eq('id', messageId)
      setEditingMessage(null)
    } catch (err) {
      console.error('Edit error:', err)
      alert('Не удалось отредактировать сообщение')
    }
  }

  async function uploadImage(e) {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер 5MB')
      return
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }
    
    setUploading(true)
    
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      
      const payload = {
        room_id: roomId,
        user_data: { id: user.id, name: user.name },
        text: `📷 ${file.name}\n${base64String}`,
        timestamp: new Date().toISOString()
      }
      
      try {
        await supabase.from('messages').insert(payload)
      } catch (err) {
        console.error('Upload error:', err)
        alert('Не удалось загрузить изображение')
      } finally {
        setUploading(false)
      }
    }
    
    reader.onerror = () => {
      setUploading(false)
      alert('Ошибка чтения файла')
    }
    
    reader.readAsDataURL(file)
  }

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  const renderMessage = (message) => {
    if (message.text.startsWith('📷')) {
      const lines = message.text.split('\n')
      const fileName = lines[0].replace('📷 ', '')
      const imageData = lines[1]
      
      return (
        <div>
          <div className="text-sm mb-1">📷 {fileName}</div>
          {imageData && (
            <img 
              src={imageData} 
              alt={fileName}
              className="max-w-full rounded-lg cursor-pointer"
              style={{ maxHeight: '200px' }}
              onClick={() => window.open(imageData, '_blank')}
            />
          )}
        </div>
      )
    }
    return <div className="text-sm break-words">{message.text}</div>
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="p-4 border-b bg-white/90 backdrop-blur-sm">
        <div className="font-bold text-indigo-600">🐟 Рыболовная беседа</div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/80 mt-10">
            🎣 Нет сообщений. Напишите первое! 🐟
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.user_data?.id === user.id
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[70%] ${mine ? 'bg-indigo-600 text-white' : 'bg-white/95 backdrop-blur-sm border'} rounded-lg px-4 py-2 relative shadow-md`}>
                  {!mine && m.user_data?.name && (
                    <div className="text-xs text-gray-500 mb-1">{m.user_data.name}</div>
                  )}
                  {renderMessage(m)}
                  <div className="text-xs mt-1 opacity-70">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </div>
                  
                  {mine && (
                    <div className="absolute -right-16 top-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                      <button 
                        onClick={() => setEditingMessage(m)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteMessage(m.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t bg-white/95 backdrop-blur-sm">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="bg-gray-200 hover:bg-gray-300 px-3 rounded text-xl transition"
            title="Emoji"
          >
            😊
          </button>
          <label className="bg-gray-200 hover:bg-gray-300 px-3 rounded cursor-pointer transition relative">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={uploadImage}
              className="hidden"
              disabled={uploading}
            />
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded text-white text-xs">
                ...
              </span>
            )}
          </label>
          <input 
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/90" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Введите сообщение..." 
            disabled={loading || uploading}
          />
          <button 
            type="submit"
            className="bg-indigo-600 text-white px-6 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            disabled={loading || uploading || !text.trim()}
          >
            {loading ? '...' : 'Отправить'}
          </button>
        </div>
        
        {showEmojiPicker && (
          <div className="absolute bottom-24 right-4 z-50">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-gray-600 z-10"
              >
                ✕
              </button>
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          </div>
        )}
      </form>

      {/* Модальное окно редактирования */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-bold mb-4">Редактировать сообщение</h3>
            <textarea
              defaultValue={editingMessage.text}
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  editMessage(editingMessage.id, e.target.value)
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  const textarea = document.querySelector('textarea')
                  editMessage(editingMessage.id, textarea.value)
                }}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditingMessage(null)}
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