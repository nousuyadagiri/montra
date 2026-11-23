import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { chatActiveTracker } from '../store/chatActiveTracker';

/**
 * Global Real-Time Incoming Chat Notification Listener.
 * Listens for new messages in personal & group conversations across the app.
 * If the user is on any other screen, it displays an in-app banner toast with sender details
 * and one-tap navigation to open that chat.
 */
export function useIncomingChatNotifications() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?.id) return;

    const channelName = `global_chat_notifications_${user.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg?.id || !newMsg.conversation_id) return;

          // Ignore own messages
          if (newMsg.sender_id === user.id) return;

          // Ignore if user is currently inside this chat screen
          if (chatActiveTracker.getActive() === newMsg.conversation_id) return;

          try {
            // Verify if current user is actually a participant of this conversation
            const { data: participation } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .eq('conversation_id', newMsg.conversation_id)
              .eq('user_id', user.id)
              .maybeSingle();

            if (!participation) return;

            // Fetch sender profile details and conversation info
            const [senderRes, convRes] = await Promise.all([
              supabase
                .from('profiles')
                .select('full_name')
                .eq('id', newMsg.sender_id)
                .maybeSingle(),
              supabase
                .from('conversations')
                .select('title, type, group_id')
                .eq('id', newMsg.conversation_id)
                .maybeSingle(),
            ]);

            const senderName = senderRes.data?.full_name || 'New Message';
            const conv = convRes.data;
            const isGroup = conv?.type === 'group';

            let title = senderName;
            if (isGroup && conv?.title) {
              title = `${conv.title}: ${senderName}`;
            }

            let preview = newMsg.content;
            if (newMsg.message_type === 'money_request') {
              preview = `💰 Money Request: ${newMsg.content}`;
            } else if (newMsg.message_type === 'payment_update') {
              preview = `✓ Payment Update: ${newMsg.content}`;
            } else if (newMsg.message_type === 'expense_notification') {
              preview = `🧾 Shared Expense: ${newMsg.content}`;
            }

            toast.chat({
              title,
              message: preview || 'Sent a new message',
              onPress: () => {
                router.push(`/chat/${newMsg.conversation_id}`);
              },
            });
          } catch (err) {
            console.warn('Error handling incoming chat notification:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, router]);
}

