import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const notes = [880, 1108.73, 1318.51, 1108.73, 1318.51];
    const durations = [0.1, 0.1, 0.15, 0.1, 0.2];
    let time = 0;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.15, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + durations[i]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + durations[i] + 0.05);
      time += durations[i];
    });
  } catch {}
}

function getNotificationMessages(count: number, role: string): { title: string; body: string } {
  if (role === 'comptable') {
    return {
      title: 'Demandes en attente',
      body: count === 1
        ? 'Vous avez 1 dépense à corriger'
        : `Vous avez ${count} dépenses à corriger`,
    };
  }
  return {
    title: 'Validations en attente',
    body: count === 1
      ? 'Vous avez 1 élément à valider'
      : `Vous avez ${count} éléments à valider`,
  };
}

export function useNotifications(role?: string) {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);
  const permissionRef = useRef<NotificationPermission>('default');
  const mountedRef = useRef(true);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return;
    }
    if (Notification.permission === 'denied') {
      permissionRef.current = 'denied';
      return;
    }
    const result = await Notification.requestPermission();
    permissionRef.current = result;
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const data = await api.get('/stats/notifications');
      if (!mountedRef.current) return;
      const newCount = data.count || 0;
      const prevCount = prevCountRef.current;

      if (newCount > prevCount && prevCountRef.current > 0 && permissionRef.current === 'granted') {
        playNotificationSound();
        try {
          const msg = getNotificationMessages(newCount, role || 'comptable');
          new Notification(msg.title, {
            body: msg.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: 'chantier-flow-notif',
            requireInteraction: false,
            silent: false,
          });
        } catch {}
      }

      prevCountRef.current = newCount;
      setCount(newCount);
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    requestPermission();
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchCount, requestPermission]);

  return { count, requestPermission };
}
