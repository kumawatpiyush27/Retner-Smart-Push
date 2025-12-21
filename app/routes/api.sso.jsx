
import { json } from "@remix-run/node";
import jwt from "jsonwebtoken";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    // Secret for signing JWT (Add SSO_SECRET to Vercel Envs!)
    const secret = process.env.SSO_SECRET || process.env.SHOPIFY_API_SECRET;

    if (!secret) {
        throw new Response("SSO Secret Config Missing", { status: 500 });
    }

    // Create Token
    const payload = {
        shop: session.shop,
        timestamp: Date.now(),
        role: 'admin'
    };

    const token = jwt.sign(payload, secret, { expiresIn: "5m" }); // Short expiry

    // Return URL instead of Redirecting
    const dashboardUrl = `https://push-retner.vercel.app/store-admin?sso_token=${token}&shop=${session.shop}`;

    return json({ url: dashboardUrl });
};
