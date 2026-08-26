export function urlBase64ToUint8Array(
  base64String: string,
) {
  const padding =
    '='.repeat(
      (4 - (base64String.length % 4)) % 4,
    );

  const base64 =
    (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0),
    ),
  );
}

export async function registerPush() {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    throw new Error(
      'Web Push यो browser मा supported छैन।',
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error(
      'Notification permission दिइएन।',
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      '/sw.js',
    );

  await navigator.serviceWorker.ready;

  const existing =
    await registration.pushManager
      .getSubscription();

  if (existing) {
    return existing;
  }

  const vapidKey =
    process.env
      .NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    throw new Error(
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY missing',
    );
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,

    applicationServerKey:
      urlBase64ToUint8Array(vapidKey),
  });
}

export async function subscribePush() {
  const subscription =
    await registerPush();

  const api =
    process.env.NEXT_PUBLIC_API_URL;

  if (!api) {
    throw new Error(
      'NEXT_PUBLIC_API_URL missing',
    );
  }

  const response = await fetch(
    `${api}/push/subscriptions`,
    {
      method: 'POST',

      credentials: 'include',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify(
        subscription.toJSON(),
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      'Push subscription save failed',
    );
  }

  return response.json();
}
