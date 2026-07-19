import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { notificationHub } from '../api/notificationHub';
import { notificationsApi } from '../api/endpoints';
import type { Notification } from '../types/types';

interface NotificationContextValue {
    notifications: Notification[];
    unreadCount: number;
    refresh: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                notificationsApi.mine(),
                notificationsApi.unreadCount(),
            ]);
            setNotifications(listRes.data);
            setUnreadCount(countRes.data);
        } catch {
            // ignore - user may not be authenticated yet
        }
    };

    useEffect(() => {
        void refresh();
        const off = notificationHub.onNotification((n: Notification) => {
            setNotifications((prev) => [n, ...prev].slice(0, 50));
            setUnreadCount((c) => c + 1);
        });
        return off;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const markRead = async (id: string) => {
        await notificationsApi.markRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const markAllRead = async () => {
        await notificationsApi.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, refresh, markRead, markAllRead }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return ctx;
}
