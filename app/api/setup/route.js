// filepath: app/api/setup/route.js
// Ce fichier abonne automatiquement votre page au webhook feed
// Visitez : https://mon-chatbot-xi.vercel.app/api/setup UNE SEULE FOIS

import { NextResponse } from "next/server";

export async function GET(request) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;

  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    return NextResponse.json({
      error: "Variables manquantes",
      missing: {
        PAGE_ACCESS_TOKEN: !PAGE_ACCESS_TOKEN,
        PAGE_ID: !PAGE_ID,
      }
    }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PAGE_ID}/subscribed_apps`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribed_fields: "feed,messages,messaging_postbacks",
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "✅ Page abonnée avec succès à feed, messages, messaging_postbacks !",
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result,
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}