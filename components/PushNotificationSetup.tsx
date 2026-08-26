'use client';

import {
  useState,
} from 'react';

import {
  Bell,
  Loader2,
} from 'lucide-react';

import {
  subscribePush,
} from '@/lib/web-push';

export default function PushNotificationSetup() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function enable() {
    try {
      setLoading(true);
      setMessage('');

      await subscribePush();

      setMessage(
        'Web notification enable भयो।',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Notification enable भएन।',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-slate-100 p-2">
          <Bell className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">
            Job invitation notification
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Employer ले job invite पठाउँदा browser notification पाउनुहोस्।
          </p>

          <button
            type="button"
            onClick={enable}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Enable notifications
          </button>

          {message && (
            <p className="mt-2 text-sm text-slate-600">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
