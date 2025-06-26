'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiCall } from '@/lib/api';
import { getCurrentUser } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  documentId: string;
  documentName: string;
  conversationUid: string;
  senderEmail: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const unreadCountRef = useRef(unreadCount);

  // Update ref when unreadCount changes
  useEffect(() => {
    unreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Check authentication status using Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      
      // Clear notifications when user logs out
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await apiCall('/notifications?limit=10&unread_only=false');
      setNotifications(response.notifications);
      const newUnreadCount = response.notifications.filter((n: Notification) => !n.readAt).length;
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Don't throw error, just log it
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch only unread count (lighter request for polling)
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiCall('/notifications?limit=1&unread_only=true');
      const newUnreadCount = response.notifications.length;
      
      // If unread count changed, fetch full notifications
      if (newUnreadCount !== unreadCountRef.current) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
      // Don't throw error, just log it
    }
  }, [fetchNotifications, isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!isAuthenticated) return;
    
    try {
      await apiCall('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ notificationIds: [notificationId] })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Don't throw error, just log it
    }
  }, [isAuthenticated]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      await apiCall('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAllAsRead: true })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Don't throw error, just log it
    }
  }, [isAuthenticated]);

  // Start polling when component mounts and user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 10000); // 10 seconds

    // Cleanup on unmount or when auth changes
    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications, refreshUnreadCount, isAuthenticated]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 