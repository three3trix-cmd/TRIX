import { createClient } from '@supabase/supabase-js'

// ВРЕМЕННО используйте эти ключи для теста
// ПОТОМ ЗАМЕНИТЕ НА СВОИ!
const SUPABASE_URL = 'https://qwhqrlsvanudxykmsetn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_aNrJKmO5lf5sIYN0HLOWXQ_DED8Rei-'

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