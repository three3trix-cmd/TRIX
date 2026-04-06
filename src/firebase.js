import { createClient } from '@supabase/supabase-js'

// Получаем ключи из переменных окружения
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export function subscribeToRoomMessages(roomId, callback) {
  return supabase
    .channel(`public:messages:room=${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      (payload) => callback(payload)
    )
    .subscribe()
}