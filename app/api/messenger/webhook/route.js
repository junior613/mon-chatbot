// filepath: app/api/messenger/webhook/route.js
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
    console.log("✅ Webhook vérifié !");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Token invalide", { status: 403 });
}

// ==================================================
// POST : Réception des événements Meta
// ==================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;

    if (body.object !== "page") {
      return new NextResponse("OK", { status: 200 });
    }

    for (const entry of body.entry || []) {

      // ---- MESSAGES MESSENGER ----
      for (const messaging of entry.messaging || []) {
        const senderId = messaging.sender?.id;
        const messageText = messaging.message?.text;
        const postback = messaging.postback?.payload;

        if (senderId) {
          if (postback) {
            await handlePostback(senderId, postback);
          } else if (messageText) {
            await handleMessage(senderId, messageText, origin);
          }
        }
      }

      // ---- COMMENTAIRES (feed) ----
      for (const change of entry.changes || []) {
        if (change.field === "feed" && change.value?.item === "comment") {
          const commentText = change.value?.message;
          const commentId = change.value?.comment_id;

          console.log(`💬 Commentaire reçu: "${commentText}"`);

          if (commentId && commentText && detectQuestion(commentText)) {
            await handleComment(commentId, commentText, origin);
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Erreur webhook:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

// ==================================================
// Détecter si un commentaire est une question
// ==================================================
function detectQuestion(text) {
  if (!text) return false;
  if (text.includes("?")) return true;

  const questionWords = [
    "comment", "pourquoi", "quand", "où", "quel", "quelle",
    "quels", "quelles", "combien", "est-ce", "est ce", "avez-vous",
    "pouvez", "peut-on", "y a-t-il", "qu'est", "c'est quoi",
    "how", "why", "when", "where", "what", "which", "who",
  ];

  const textLower = text.toLowerCase();
  return questionWords.some(word => textLower.startsWith(word) || textLower.includes(" " + word + " "));
}

// ==================================================
// Gérer les messages Messenger
// ==================================================
async function handleMessage(senderId, messageText, origin) {
  try {
    const res = await fetch(origin + "/api/chat", {
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
    console.error("❌ Erreur handleMessage:", error);
    await sendMessage(senderId, "Une erreur est survenue. Veuillez réessayer.");
  }
}

// ==================================================
// Gérer les commentaires Facebook
// ==================================================
async function handleComment(commentId, commentText, origin) {
  try {
    const res = await fetch(origin + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: commentText }],
      }),
    });

    const data = await res.json();
    const reply = data.reply || "Merci pour votre question ! Contactez-nous en message privé pour plus d'informations.";
    await replyToComment(commentId, reply);
  } catch (error) {
    console.error("❌ Erreur handleComment:", error);
  }
}

// ==================================================
// Gérer les postbacks (boutons)
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
// Envoyer un message Messenger
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
// Répondre publiquement à un commentaire
// ==================================================
async function replyToComment(commentId, text) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

  if (!PAGE_ACCESS_TOKEN) {
    console.error("❌ MESSENGER_PAGE_ACCESS_TOKEN non configuré");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("❌ Erreur réponse commentaire:", result);
    } else {
      console.log("✅ Réponse commentaire envoyée !");
    }
    return result;
  } catch (error) {
    console.error("❌ Erreur replyToComment:", error);
  }
}
