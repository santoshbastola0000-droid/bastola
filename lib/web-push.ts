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

function getApiUrl() {
  // Browser requests use the same-origin API proxy configured in next.config.ts.
  // This keeps push setup working on Vercel without a separate public API env.
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.roomkhoj.com'
  );
}

export async function getPushStatus() {
  const response = await fetch(
    `${getApiUrl()}/push/public-key`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error('Web push server is not configured.');
  }

  const data = await response.json();
  if (!data?.publicKey) {
    throw new Error('Web push public key missing.');
  }

  return {
    publicKey: String(data.publicKey),
    testEnabled: data?.testEnabled === true,
  };
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

  const { publicKey: vapidKey } = await getPushStatus();

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      urlBase64ToUint8Array(vapidKey),
  });
}

export async function subscribePush() {
  const subscription = await registerPush();

  const response = await fetch(
    `${getApiUrl()}/push/subscriptions`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    },
  );

  if (!response.ok) {
    throw new Error(
      'Push subscription save failed',
    );
  }

  return response.json();
}

export async function sendPushTest() {
  await subscribePush();

  const response = await fetch(
    `${getApiUrl()}/push/test`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(
      'Test notification send failed.',
    );
  }

  return response.json() as Promise<{
    attempted: number;
    delivered: number;
    failed: number;
  }>;
}
