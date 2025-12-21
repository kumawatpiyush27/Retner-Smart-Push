import { json } from "@remix-run/node";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

        // Ensure table exists (Quick check)
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS subscription (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL,
        p256dh TEXT,
        auth TEXT,
        store_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

        // Insert
        const existing = await prisma.$queryRaw`SELECT id FROM subscription WHERE endpoint = ${data.endpoint} LIMIT 1`;

        if (Array.isArray(existing) && existing.length > 0) {
            console.log("ℹ️ Subscription already exists.");
            await prisma.$executeRaw`UPDATE subscription SET store_id = ${data.storeId} WHERE endpoint = ${data.endpoint}`;
        } else {
            await prisma.$executeRaw`
          INSERT INTO subscription (endpoint, p256dh, auth, store_id)
          VALUES (${data.endpoint}, ${data.keys.p256dh}, ${data.keys.auth}, ${data.storeId});
        `;
            console.log("✅ Subscription Saved to DB");
        }

        return json({ success: true });

    } catch (error) {
        console.error("❌ Subscription Error:", error);
        return json({ error: error.message }, { status: 500 });
    }
};
