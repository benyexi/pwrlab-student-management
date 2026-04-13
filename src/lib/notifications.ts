// Calls the send-notification Supabase Edge Function.
// Fires-and-forgets — email failure never blocks the UI action.
import { supabase } from './supabase'

interface NotificationPayload {
  type: 'report' | 'question' | 'milestone_reminder'
  student_name: string
  title: string
  content?: string
  week_start?: string
  week_end?: string
  link?: string
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    await supabase.functions.invoke('send-notification', { body: payload })
  } catch {
    // Silent fail — email is non-critical
    console.warn('[notify] send-notification failed (non-critical)')
  }
}
