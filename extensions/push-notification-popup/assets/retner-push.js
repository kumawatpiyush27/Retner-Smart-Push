// Push Notification Helper for Shopify
// Place this file in your Shopify theme: Assets > push-notification-helper.js

// IMPORTANT: Ensure your Shopify App Proxy (e.g., /apps/push) points to your Vercel Backend URL.
// You do not need to hardcode the URL here if using the proxy.
const BACKEND_URL = ''; // Kept for reference, logic uses /apps/push proxy below

// -----------------------------------------------------------------------------
// Cart / Customer identity helpers
// -----------------------------------------------------------------------------
// Read Shopify's `cart` cookie. On every Shopify storefront, when at least one
// item is added to the cart Shopify sets a cookie named `cart` whose value is
// the cart token. The same token is included in the `checkouts/update` webhook
// payload, so we use it as the join key between push subscription and
// abandoned checkout.
function _readCartTokenFromCookie() {
    try {
        const match = document.cookie.match(/(?:^|;\s*)cart=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    } catch (e) { return null; }
}

// Hit /cart.js as a fallback — works even before the cart cookie is written.
async function _fetchCartToken() {
    try {
        const r = await fetch('/cart.js', { credentials: 'same-origin' });
        if (!r.ok) return null;
        const j = await r.json();
        return j && j.token ? j.token : null;
    } catch (e) { return null; }
}

// Shopify exposes the logged-in customer id via ShopifyAnalytics. May be null
// for anonymous shoppers — that's fine, cart_token still works as a fallback.
function _readCustomerId() {
    try {
        if (window.ShopifyAnalytics &&
            window.ShopifyAnalytics.meta &&
            window.ShopifyAnalytics.meta.page &&
            window.ShopifyAnalytics.meta.page.customerId) {
            return String(window.ShopifyAnalytics.meta.page.customerId);
        }
        if (window.__st && window.__st.cid) return String(window.__st.cid);
    } catch (e) {}
    return null;
}

async function _resolveCartToken() {
    return _readCartTokenFromCookie() || await _fetchCartToken();
}

// Subscribe to push notifications (Direct App Proxy Method)
async function subscribeToPushNotifications() {
    try {
        if (typeof Notification === 'undefined') {
            console.warn('Notifications are not supported in this browser/device.');
            return { success: false, message: 'Notifications not supported' };
        }
        console.log('Step 1: Requesting Permission...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permission blocked by user');
        }

        console.log('Step 2: Registering SW...');
        // Note: Using the proxy path for SW to ensure it's served from the same origin
        const registration = await navigator.serviceWorker.register('/apps/push/sw.js', {
            scope: '/apps/push/'
        });

        // Wait for the service worker to be active before proceeding
        console.log('Step 2.5: Waiting for Service Worker to be active...');
        let serviceWorker = registration.installing || registration.waiting || registration.active;

        if (serviceWorker) {
            await new Promise((resolve) => {
                if (serviceWorker.state === 'activated') {
                    resolve();
                } else {
                    serviceWorker.addEventListener('statechange', function listener() {
                        if (serviceWorker.state === 'activated') {
                            serviceWorker.removeEventListener('statechange', listener);
                            resolve();
                        }
                    });
                }
            });
        }

        console.log('SW Active:', registration);

        console.log('Step 3: Creating Subscription with VAPID...');
        // Replace this with your actual VAPID Public Key from Vercel env
        const publicVapidKey = 'BN2u6-t6iC6o0CKza2ifWfNy_OSovucgNlZwgeWoMbAYME6b5qdgdDD6WIX6c_SOAF-R15ZepMt0N4eTdFZlU04';

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        });
        console.log('Subscription Object Created:', JSON.stringify(subscription));

        console.log('Step 4: Sending to Backend via Proxy...');

        // 🔥 DYNAMIC STORE ID: Automatically detects the store identity
        // Priority: 1. Shopify Object 2. Hostname
        let dynamicStoreId = 'unknown-store';

        if (window.Shopify && window.Shopify.shop) {
            // Example: 'zyrajewel.myshopify.com' -> 'zyrajewel'
            dynamicStoreId = window.Shopify.shop.split('.')[0];
        } else {
            // Fallback for non-Shopify or testing: 'zyrajewel.co.in' -> 'zyrajewel'
            const host = window.location.hostname;
            dynamicStoreId = host.replace('www.', '').split('.')[0];
        }

        const storeName = document.title || dynamicStoreId;
        const storeDomain = window.location.hostname;

        // Cart + Customer identity — required for abandoned-cart matching.
        const cartToken = await _resolveCartToken();
        const customerId = _readCustomerId();

        console.log(`📍 Detected Store ID: ${dynamicStoreId}`);
        console.log(`🛒 Cart Token: ${cartToken ? cartToken.substring(0, 8) + '…' : 'none'}  Customer: ${customerId || 'guest'}`);

        const response = await fetch('/apps/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...subscription.toJSON(),
                storeId: dynamicStoreId,
                storeName: storeName,
                storeDomain: storeDomain,
                cartToken: cartToken,
                customerId: customerId
            })
        });

        // Remember the endpoint locally so the cart-change listener can keep
        // the row up-to-date even if the user adds items later.
        try {
            const json = subscription.toJSON();
            localStorage.setItem('retnerEndpoint', json.endpoint);
            localStorage.setItem('retnerStoreId', dynamicStoreId);
        } catch (e) {}

        console.log('Server Response Status:', response.status);

        if (!response.ok) {
            // Try to parse error text to show detailed reason
            const text = await response.text();
            throw new Error(`Server Error ${response.status}: ${text}`);
        }

        console.log('Step 5: Success!');
        localStorage.setItem('pushNotificationSubscribed', 'true');
        // Success - no alert needed
        return { success: true };

    } catch (error) {
        console.error('Subscription Failed:', error);
        let errorMessage = error.message;
        const isPermissionDenied = (typeof Notification !== 'undefined' && Notification.permission === 'denied');
        if (error.message.includes('blocked') || error.message.includes('denied') || isPermissionDenied) {
            console.warn('[Retner] Notification permission denied/blocked by user.');
            return { success: false, message: 'Permission denied', denied: true };
        }
        console.error('[Retner] Technical error during subscription:', errorMessage);
        return { success: false, message: error.message };
    }
}

// Check if user is already subscribed
async function isSubscribed() {
    // Since we can't check registration on cross-origin, we use local storage flag
    return localStorage.getItem('pushNotificationSubscribed') === 'true';
}

// -----------------------------------------------------------------------------
// Link cart to existing subscription
// -----------------------------------------------------------------------------
// Call whenever the cart changes (item added / quantity changed) so the
// backend knows which cart_token belongs to which push endpoint. Without
// this the abandoned-cart scheduler cannot find a subscription to notify.
async function linkCartToSubscription() {
    try {
        const endpoint = localStorage.getItem('retnerEndpoint');
        const storeId = localStorage.getItem('retnerStoreId');
        if (!endpoint) return; // Not subscribed yet.

        const cartToken = await _resolveCartToken();
        const customerId = _readCustomerId();
        if (!cartToken && !customerId) return;

        await fetch('/apps/push/link-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: endpoint,
                cartToken: cartToken,
                customerId: customerId,
                storeId: storeId,
                storeDomain: window.location.hostname
            })
        });
    } catch (e) { /* silent — best effort */ }
}

// Hook into Shopify's cart events. Different themes expose different hooks,
// so we listen broadly:
//   1. The standard 'cart:update' / 'cart:refresh' DOM events (most themes).
//   2. Intercept fetch() calls to /cart/* endpoints (works on all themes).
function _installCartListeners() {
    ['cart:update', 'cart:refresh', 'cart:change', 'cart:added'].forEach(ev => {
        document.addEventListener(ev, () => { linkCartToSubscription(); });
    });

    // Patch fetch — fires on AJAX add-to-cart from any theme.
    if (window.fetch && !window.fetch.__retnerPatched) {
        const origFetch = window.fetch;
        window.fetch = function (...args) {
            const p = origFetch.apply(this, args);
            try {
                const url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url) || '';
                if (/\/cart(\/|\.js|\/add|\/update|\/change|\/clear)/i.test(url)) {
                    p.then(() => setTimeout(linkCartToSubscription, 150)).catch(() => {});
                }
            } catch (e) {}
            return p;
        };
        window.fetch.__retnerPatched = true;
    }
}

// Install listeners as soon as the DOM is ready.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _installCartListeners);
} else {
    _installCartListeners();
}

// Export functions for use in Shopify theme
window.PushNotifications = {
    subscribe: subscribeToPushNotifications,
    isSubscribed: isSubscribed,
    linkCart: linkCartToSubscription
};
