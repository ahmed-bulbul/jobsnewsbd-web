'use client';

import { useEffect, useRef } from 'react';
import { registerDevice, unregisterDevice } from '@/lib/api';

/**
 * Requests browser push permission and registers the FCM device token
 * with the main backend (which proxies to the notification service).
 *
 * Usage: call inside a component that has access to the auth token.
 *
 * To activate FCM:
 *  1. npm install firebase
 *  2. Create lib/firebase.ts with initializeApp + getMessaging + getToken
 *  3. Add your Firebase config to .env.local (NEXT_PUBLIC_FIREBASE_*)
 *  4. Add public/firebase-messaging-sw.js service worker
 */
export function usePushNotifications(token: string | null) {
  const registered = useRef(false);

  useEffect(() => {
    if (!token || registered.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const requestAndRegister = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // ── FCM token retrieval (uncomment when firebase is installed) ──────
        // import { getMessaging, getToken } from 'firebase/messaging';
        // import { firebaseApp } from '@/lib/firebase';
        // const messaging = getMessaging(firebaseApp);
        // const fcmToken = await getToken(messaging, {
        //   vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        // });

        // Placeholder — remove when FCM is wired up
        const fcmToken: string | null = null;
        if (!fcmToken) return;

        await registerDevice(token, {
          deviceToken: fcmToken,
          platform: 'WEB',
          deviceName: navigator.userAgent.slice(0, 100),
          appVersion: '1.0.0',
        });

        registered.current = true;
        localStorage.setItem('fcm_token', fcmToken);
      } catch (err) {
        console.warn('[Push] Device registration failed:', err);
      }
    };

    requestAndRegister();
  }, [token]);

  const unregister = async () => {
    if (!token) return;
    const storedToken = localStorage.getItem('fcm_token');
    if (!storedToken) return;
    try {
      await unregisterDevice(token, storedToken);
      localStorage.removeItem('fcm_token');
      registered.current = false;
    } catch (err) {
      console.warn('[Push] Device unregister failed:', err);
    }
  };

  return { unregister };
}
