import { create } from 'zustand';
import type { Notification, PaginatedResponse } from '@/types';
import { get, post } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const { data } = await get<PaginatedResponse<Notification>>('/notifications/');
      const notifications = data.results;
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount });
    } catch {
      // silently fail
    }
  },

  markRead: async (id) => {
    await post(`/notifications/${id}/read/`);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await post('/notifications/mark-all-read/');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },
}));
