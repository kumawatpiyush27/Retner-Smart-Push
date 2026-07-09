export const loader = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Retner Smart Push</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; color: #111; }
        h2 { margin-top: 30px; color: #222; }
        .update-date { color: #666; font-style: italic; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="update-date">Last updated: December 31, 2025</p>

    <p>Retner Smart Push ("we", "us", or "our") provides a web push notification service for Shopify merchants. This Privacy Policy describes how we collect, use, and handle your personal information when you use our app.</p>

    <h2>1. Information We Collect</h2>
    <p><strong>From Merchants:</strong> We collect your shop domain and basic store information provided by Shopify to identify your account.</p>
    <p><strong>From End Users (Store Visitors):</strong> We do NOT collect personal emails or phone numbers. We collect:</p>
    <ul>
        <li>Anonymous Push Subscription Tokens</li>
        <li>Device type (Desktop/Mobile)</li>
        <li>Browser language settings</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use the collected information solely to:</p>
    <ul>
        <li>Send web push notifications explicitly requested by the user.</li>
        <li>Provide analytics to the merchant (e.g., number of subscribers).</li>
        <li>Authenticate the merchant via Shopify's secure API.</li>
    </ul>

    <h2>3. Data Sharing</h2>
    <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.</p>

    <h2>4. Your Rights</h2>
    <p>Merchants and end-users have the right to access, correct, or delete their data. End-users can unsubscribe from notifications at any time via their browser settings.</p>

    <h2>5. Contact Us</h2>
    <p>If you have questions about this Privacy Policy, please contact us at: <strong>Koregrowtech@gmail.com</strong></p>
</body>
</html>`;

    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
        },
    });
};
