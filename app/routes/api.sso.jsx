
import { json } from "@remix-run/node";
import jwt from "jsonwebtoken";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    // Secret for signing JWT (Add SSO_SECRET to Vercel Envs!)
    // Fallback to Shopify API Secret if not present (Risky but works for MVP if same server)
    // Or fallback to a hardcoded placeholder for dev (Must be changed!)
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

    // Redirect to External Dashboard with Token
    // Using 'sso_token' query param
    const dashboardUrl = `https://push-retner.vercel.app/store-admin?sso_token=${token}&shop=${session.shop}`;

    return Response.redirect(dashboardUrl);
};
