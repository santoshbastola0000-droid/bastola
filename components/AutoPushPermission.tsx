'use client';

import { useEffect } from 'react';
import { subscribePush } from '@/lib/web-push';

export function AutoPushPermission() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      subscribePush().catch(() => undefined);
    }
  }, []);
  return null;
}
