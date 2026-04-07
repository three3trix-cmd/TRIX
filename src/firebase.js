import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export function subscribeToRoomMessages(roomId, callback) {
  const channel = supabase
    .channel(`public:messages:room=${roomId}`)
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'messages', 
        filter: `room_id=eq.${roomId}` 
      },
      (payload) => {
        console.log('[Realtime] Message event:', payload.eventType)
        callback(payload)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to room ${roomId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to room ${roomId}`)
        // Попытка переподключения через 3 секунды
        setTimeout(() => {
          subscribeToRoomMessages(roomId, callback)
        }, 3000)
      }
    })

  return channel
}

// Функция для сохранения push-подписки
export async function savePushSubscription(userId, subscription) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,subscription'
      })
    
    if (error) throw error
    console.log('[Push] Subscription saved successfully')
    return true
  } catch (error) {
    console.error('[Push] Error saving subscription:', error)
    return false
  }
}

// Функция для удаления push-подписки
export async function removePushSubscription(userId, subscription) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('subscription->>endpoint', subscription.endpoint)
    
    if (error) throw error
    console.log('[Push] Subscription removed successfully')
    return true
  } catch (error) {
    console.error('[Push] Error removing subscription:', error)
    return false
  }
}