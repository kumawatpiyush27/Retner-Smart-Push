export const loader = () => {
    const content = `
  console.log('🚀 Service Worker v2 (Image Support) Loaded');
  self.addEventListener('install', function(event) {
      event.waitUntil(self.skipWaiting());
  });
  self.addEventListener('activate', function(event) {
      event.waitUntil(self.clients.claim());
  });
  self.addEventListener('push', async function (event) {
      try {
          const message = await event.data.json();
          const { title, body, icon, url, image, actions } = message;
          const options = {
              body: body || 'New Notification',
              icon: icon || 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
              image: image,
              data: { url: url || '/' },
              actions: actions || []
          };
          await event.waitUntil(self.registration.showNotification(title, options));
      } catch (error) { console.error('Push Error:', error); }
  });
  self.addEventListener('notificationclick', function (event) {
      event.notification.close();
      const data = event.notification.data || {}; 
      let openUrl = data.url;
      if (event.action) openUrl = event.action;
      
      // Tracking Logic
      if (data.tracking) {
           const { type, storeId } = data.tracking;
           // Fire Tracking Request
           fetch('https://push-retner.vercel.app/api/track-event', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ type, storeId, event: 'click' })
           }).catch(e => console.error('Tracking Error:', e));
      }

      if (openUrl) event.waitUntil(clients.openWindow(openUrl));
  });
  `;

    return new Response(content, {
        headers: {
            "Content-Type": "application/javascript",
            "Service-Worker-Allowed": "/",
            "Cache-Control": "no-cache"
        },
    });
};
