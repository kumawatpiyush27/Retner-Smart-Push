import { json } from "@remix-run/node";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const loader = async () => {
    return json({ status: "Active", method: "POST required" });
};

export const action = async ({ request }) => {
    // Allow CORS just in case, though Proxy handles origin
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    // Verify it is a POST
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const data = await request.json();
        console.log("🔔 Incoming Subscription:", data);

        // Validate data
        if (!data.endpoint || !data.keys || !data.storeId) {
            return json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure table exists (Quick check - Sync with Backend Schema)
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            endpoint TEXT UNIQUE,
            expiration_time BIGINT,
            keys JSONB,
            store_id TEXT,
            store_name TEXT,
            store_domain TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `;

        // Insert using Plural Table and JSONB keys
        const keysJson = JSON.stringify(data.keys);

        // Use insert logic compatible with Backend Model
        // Note: casting ::jsonb explicit to ensure postgres treats string as json
        await prisma.$executeRaw`
          INSERT INTO subscriptions (endpoint, keys, store_id, store_name, store_domain)
          VALUES (${data.endpoint}, ${keysJson}::jsonb, ${data.storeId}, ${data.storeName}, ${data.storeDomain})
          ON CONFLICT (endpoint) DO UPDATE SET 
            keys = ${keysJson}::jsonb, 
            store_id = ${data.storeId},
            store_name = ${data.storeName},
            store_domain = ${data.storeDomain}
        `;
        console.log("✅ Subscription Saved to DB (subscriptions table)");

        // Trigger Welcome Notification
        try {
            const subPayload = {
                endpoint: data.endpoint,
                keys: data.keys
            };

            // Fire and forget (or await, minimal delay)
            fetch('https://push-retner.vercel.app/api/trigger-welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: data.storeId,
                    subscription: subPayload
                })
            }).catch(err => console.error("Trigger Welcome Call Failed", err));

        } catch (triggerError) {
            console.error("Trigger Validation Error", triggerError);
        }

        return json({ success: true });

    } catch (error) {
        console.error("❌ Subscription Error:", error);
        return json({ error: error.message }, { status: 500 });
    }
};
