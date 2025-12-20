console.log('🚀 Service Worker v2 (Image Support) Loaded');
self.addEventListener('install', function (event) {
    console.log('📦 Service Worker installing...');
    event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function (event) {
    console.log('✅ Service Worker activating...');
    event.waitUntil(self.clients.claim());
});
self.addEventListener('push', async function (event) {
    try {
        const message = await event.data.json();
        const { title, body, icon, url, image, actions } = message;
        const options = {
            body: body || 'New Notification',
            icon: icon || 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
            image: image || null,
            requireInteraction: true,
            data: { url: url || '/' },
            actions: actions || [] // Add Actions here
        };
        await event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) { console.error('Push Error:', error); }
});
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Default URL (Clicking body)
    let openUrl = event.notification.data.url;

    // Button Clicks
    if (event.action) {
        // event.action will contain the URL from our payload
        openUrl = event.action;
    }

    if (openUrl) {
        event.waitUntil(clients.openWindow(openUrl));
    }
});
