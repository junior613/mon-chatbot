// filepath: app/api/comments/route.js
import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || "mon_chatbot_verify_token";
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

// ==================================================
// GET : Vérification du webhook par Meta
// ==================================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Commentaires vérifié !");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Token invalide", { status: 403 });
}

// ==================================================
// POST : Réception des événements de commentaires
// ==================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;

    if (body.object !== "page") {
      return new NextResponse("OK", { status: 200 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {

        // On vérifie que c'est bien un commentaire
        if (change.field === "feed" && change.value?.item === "comment") {
          const commentText = change.value?.message;
          const commentId = change.value?.comment_id;
          const isQuestion = detectQuestion(commentText);

          console.log(`💬 Commentaire reçu: "${commentText}" | Question: ${isQuestion}`);

          // On répond seulement si c'est une question
          if (isQuestion && commentId && commentText) {
            await handleComment(commentId, commentText, origin);
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Erreur webhook commentaires:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

// ==================================================
// Détecter si le commentaire est une question
// ==================================================
function detectQuestion(text) {
  if (!text) return false;

  const textLower = text.toLowerCase();

  // Contient un point d'interrogation
  if (text.includes("?")) return true;

  // Commence par un mot interrogatif
  const questionWords = [
    "comment", "pourquoi", "quand", "où", "quel", "quelle",
    "quels", "quelles", "combien", "est-ce", "est ce", "avez-vous",
    "avez vous", "pouvez", "peut-on", "peut on", "y a-t-il",
    "y a t il", "qu'est", "qu est", "c'est quoi", "c est quoi",
    "how", "why", "when", "where", "what", "which", "who", "do you",
    "can you", "is there", "are there"
  ];

  return questionWords.some(word => textLower.startsWith(word) || textLower.includes(" " + word + " "));
}

// ==================================================
// Gérer le commentaire et générer une réponse
// ==================================================
async function handleComment(commentId, commentText, origin) {
  try {
    // Appeler le chatbot pour générer une réponse
    const res = await fetch(origin + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: commentText }],
      }),
    });

    const data = await res.json();
    const reply = data.reply || "Merci pour votre question ! Contactez-nous en message privé pour plus d'informations.";

    // Répondre au commentaire publiquement
    await replyToComment(commentId, reply);

  } catch (error) {
    console.error("❌ Erreur handleComment:", error);
  }
}

// ==================================================
// Répondre publiquement à un commentaire
// ==================================================
async function replyToComment(commentId, text) {
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