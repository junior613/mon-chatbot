// filepath: app/api/messenger/messenger/webhook/route.js
import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || "mon_chatbot_verify_token";

// ==================================================
// GET : Vérification du webhook par Meta
// ==================================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Messenger vérifié !");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("❌ Échec de vérification du webhook");
  return new NextResponse("Token de vérification invalide", { status: 403 });
}

// ==================================================
// POST : Réception des messages depuis Messenger
// ==================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const origin = new URL(request.url).origin; // ✅ Récupéré ici et passé en paramètre

    if (body.object !== "page") {
      return new NextResponse("OK", { status: 200 });
    }

    for (const entry of body.entry || []) {
      for (const messaging of entry.messaging || []) {
        const senderId = messaging.sender?.id;
        const messageText = messaging.message?.text;
        const postback = messaging.postback?.payload;

        if (senderId) {
          if (postback) {
            await handlePostback(senderId, postback);
          } else if (messageText) {
            await handleMessage(senderId, messageText, origin); // ✅ origin passé en paramètre
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Erreur webhook Messenger:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

// ==================================================
// Gérer les messages texte
// ==================================================
async function handleMessage(senderId, messageText, origin) { // ✅ origin reçu en paramètre
  try {
    const res = await fetch(origin + "/api/chat", { // ✅ Plus d'erreur request non défini
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: messageText }],
      }),
    });

    const data = await res.json();
    const reply = data.reply || "Désolé, j'ai eu un problème. Veuillez réessayer.";

    await sendMessage(senderId, reply);
  } catch (error) {
    console.error("Erreur handleMessage:", error);
    await sendMessage(senderId, "Une erreur est survenue. Veuillez réessayer.");
  }
}

// ==================================================
// Gérer les postbacks (boutons cliqués)
// ==================================================
async function handlePostback(senderId, payload) {
  const responses = {
    START_CONVERSATION: "Bonjour ! 👋 Bienvenue ! Comment puis-je vous aider ?",
    GET_INFO: "Je peux vous informer sur nos produits, services, tarifs. Que souhaitez-vous savoir ?",
    CONTACT_SUPPORT: "Je vais vous mettre en contact avec un conseiller. Veuillez patienter...",
    ONBOARDING: "Je vais vous orienter vers notre formulaire de contact. Un conseiller vous répondra sous 24h.",
  };

  const reply = responses[payload] || "Comment puis-je vous aider ?";
  await sendMessage(senderId, reply);
}

// ==================================================
// Envoyer un message via l'API Messenger Graph
// ==================================================
async function sendMessage(recipientId, text) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

  if (!PAGE_ACCESS_TOKEN) {
    console.error("❌ MESSENGER_PAGE_ACCESS_TOKEN non configuré");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur envoi message:", result);
    } else {
      console.log("✅ Message envoyé à", recipientId);
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur sendMessage:", error);
  }
}

// ==================================================
// Helper: Envoyer un message avec boutons (Quick Reply)
// ==================================================
async function sendQuickReply(recipientId, text, buttons) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

  if (!PAGE_ACCESS_TOKEN) return;

  const quickReplies = buttons.map((btn) => ({
    content_type: "text",
    title: btn.title,
    payload: btn.payload,
  }));

  await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text,
          quick_replies: quickReplies,
        },
      }),
    }
  );
}
