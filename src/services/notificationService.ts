import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types/database';

// Configure notification behavior
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // web or unsupported
}

export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch {
      return null;
    }
  },

  async sendLocalNotification(title: string, body: string, data?: any) {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    } catch (err) {
      console.warn('Failed to dispatch local notification:', err);
    }
  },

  async logAppNotification(
    userId: string,
    title: string,
    body: string,
    type: 'budget' | 'salary' | 'goal' | 'split' | 'system',
    data?: any
  ): Promise<AppNotification | null> {
    try {
      const { data: notif, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          data: data || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Also trigger device notification
      await this.sendLocalNotification(title, body, data);

      return notif;
    } catch (e) {
      console.warn('Failed to log notification:', e);
      return null;
    }
  },

  async getNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  },
};
