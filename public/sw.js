self.addEventListener(
  'push',
  (event) => {
    let data = {};

    try {
      data = event.data
        ? event.data.json()
        : {};
    } catch {
      data = {
        title: 'RoomKhoj',
        body: event.data
          ? event.data.text()
          : '',
      };
    }

    const title =
      data.title ||
      'RoomKhoj';

    const options = {
      body:
        data.body ||
        'तपाईंलाई नयाँ notification आएको छ।',

      icon:
        '/roomkhoj-logo.png',

      badge:
        '/roomkhoj-logo.png',

      data: {
        url:
          data.url ||
          '/user/dashboard/job-invitations',
      },
    };

    event.waitUntil(
      self.registration
        .showNotification(
          title,
          options,
        ),
    );
  },
);

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close();

    const url =
      event.notification
        ?.data?.url ||
      '/user/dashboard/job-invitations';

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      }).then((clientList) => {
        for (const client of clientList) {
          if (
            'focus' in client &&
            client.url.includes(url)
          ) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
    );
  },
);
