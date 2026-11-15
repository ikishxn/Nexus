import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import api, { API_BASE_URL } from '../lib/api';
import { useAuth } from './AuthContext';

export type NotificationType = 'UPVOTE' | 'REPLY' | 'BOUNTY_CLAIMED' | 'DEBATE_CHALLENGE' | 'TARGETED_BOUNTY';

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: {
    _id: string;
    username: string;
    reputationScore?: number;
    badges?: string[];
  };
  type: NotificationType;
  postId?: {
    _id: string;
    title: string;
  } | string;
  read: boolean;
  message?: string;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // WebSocket Connection for Real-Time Notification Broadcasts
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

    const socket: Socket = io(socketUrl, {
      auth: { token: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[NotificationSocket] Connected to real-time notification gateway');
    });

    socket.on('newNotification', (newNotif: NotificationItem) => {
      console.log('[NotificationSocket] New notification received:', newNotif);
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n._id !== newNotif._id)]);
    });

    socket.on('disconnect', () => {
      console.log('[NotificationSocket] Disconnected from notification gateway');
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id || user?._id]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}`);

      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif)),
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');

      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
