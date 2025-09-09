import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  type: 'new_registration' | 'payment_confirmed' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  eventId?: string;
  eventTitle?: string;
}

interface UseGlobalNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export function useGlobalNotifications(): UseGlobalNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Subscribe to global notifications state
  useEffect(() => {
    // Initialize with current state
    setNotifications(globalNotificationManager.getNotifications());
    setUnreadCount(globalNotificationManager.getUnreadCount());

    // Subscribe to changes
    const unsubscribe = globalNotificationManager.subscribe(() => {
      setNotifications(globalNotificationManager.getNotifications());
      setUnreadCount(globalNotificationManager.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  // Configure toast notifications (only once globally)
  useEffect(() => {
    const originalAddNotification = globalNotificationManager.addNotification.bind(globalNotificationManager);
    
    // Override addNotification to show toast
    globalNotificationManager.addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
      // Call original method
      originalAddNotification(notification);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };
    
    console.log('✅ Global notification manager configured with toast');
  }, [toast]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read'>) => {
    globalNotificationManager.addNotification(notification);
  }, []);

  const markAsRead = useCallback((id: string) => {
    globalNotificationManager.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    globalNotificationManager.markAllAsRead();
  }, []);

  const clearNotifications = useCallback(() => {
    globalNotificationManager.clearNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

// Global notification manager for SSE events
class GlobalNotificationManager {
  private static instance: GlobalNotificationManager;
  private notifications: Notification[] = [];
  private subscribers: Set<() => void> = new Set();
  private isInitialized = false;

  static getInstance(): GlobalNotificationManager {
    if (!GlobalNotificationManager.instance) {
      GlobalNotificationManager.instance = new GlobalNotificationManager();
    }
    return GlobalNotificationManager.instance;
  }

  // Initialize with saved notifications
  private initialize() {
    if (this.isInitialized) return;
    
    const savedNotifications = localStorage.getItem('eventflow-notifications');
    if (savedNotifications) {
      try {
        this.notifications = JSON.parse(savedNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    }
    this.isInitialized = true;
  }

  // Subscribe to notifications changes
  subscribe(callback: () => void) {
    this.initialize();
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Get current notifications
  getNotifications(): Notification[] {
    this.initialize();
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount(): number {
    this.initialize();
    return this.notifications.filter(n => !n.read).length;
  }

  // Add notification
  addNotification(notification: Omit<Notification, 'id' | 'read'>) {
    this.initialize();
    
    // Use the ID from Pusher if available, otherwise generate one
    const notificationId = (notification as any).id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      ...notification,
      id: notificationId,
      read: false,
    };

    // Check if notification already exists to prevent duplicates
    const exists = this.notifications.some(n => n.id === notificationId);
    if (exists) {
      console.log('🔄 Notification already exists, skipping duplicate:', notificationId);
      return;
    }
    
    console.log('✅ Adding new notification:', notificationId);
    this.notifications = [newNotification, ...this.notifications.slice(0, 49)]; // Keep only last 50
    
    // Save to localStorage
    localStorage.setItem('eventflow-notifications', JSON.stringify(this.notifications));
    
    // Notify all subscribers
    this.subscribers.forEach(callback => callback());
  }

  // Mark notification as read
  markAsRead(id: string) {
    this.initialize();
    this.notifications = this.notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    
    // Save to localStorage
    localStorage.setItem('eventflow-notifications', JSON.stringify(this.notifications));
    
    // Notify all subscribers
    this.subscribers.forEach(callback => callback());
  }

  // Mark all as read
  markAllAsRead() {
    this.initialize();
    this.notifications = this.notifications.map(notification => ({ ...notification, read: true }));
    
    // Save to localStorage
    localStorage.setItem('eventflow-notifications', JSON.stringify(this.notifications));
    
    // Notify all subscribers
    this.subscribers.forEach(callback => callback());
  }

  // Clear all notifications
  clearNotifications() {
    this.initialize();
    this.notifications = [];
    
    // Save to localStorage
    localStorage.setItem('eventflow-notifications', JSON.stringify(this.notifications));
    
    // Notify all subscribers
    this.subscribers.forEach(callback => callback());
  }
}

export const globalNotificationManager = GlobalNotificationManager.getInstance();
