# Guide d'intégration Facebook Messenger

Ce guide explique comment connecter votre chatbot Next.js à Facebook Messenger via l'API Meta.

---

## Étape 1 : Créer un compte développeur Meta

1. **Aller sur** [developers.facebook.com](https://developers.facebook.com)
2. **Cliquer** sur "Mes applications" → "Créer une application"
3. **Choisir** "Autre" → "Entreprise"
4. **Nommer** l'app : `ChatBot Entreprise`
5. **Associer** un compte Facebook (votre profil personnel)

---

## Étape 2 : Configurer le produit Messenger

1. Dans le tableau de bord, **ajouter un produit** : chercher "Messenger"
2. **Cliquer** sur "Configurer" Messenger
3. Aller dans **Paramètres → Messagerie** 

---

## Étape 3 : Configurer le Webhook

Le webhook permet à Messenger de communiquer avec votre serveur.

### 3.1 Créer la route du webhook

Créer `app/api/messenger/route.js` :

```javascript
// filepath: app/api/messenger/route.js
import { NextResponse } from "next/server";

const VERIFY_TOKEN = "mon_chatbot_verify_token"; // À changer !

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Vérification du webhook (Meta appelle cette URL pour valider)
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook vérifié !");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Erreur de vérification", { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Ignorer les messages de type "standby" (messages hors ligne)
    if (body.object !== "page") {
      return new NextResponse("OK", { status: 200 });
    }

    // Traiter chaque entrée
    for (const entry of body.entry || []) {
      for (const messaging of entry.messaging || []) {
        const senderId = messaging.sender?.id;
        const messageText = messaging.message?.text;

        if (senderId && messageText) {
          // Ici : appeler votre chatbot Groq
          const reply = await getBotResponse(messageText);
          
          // Envoyer la réponse via l'API Messenger
          await sendMessage(senderId, reply);
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Erreur webhook:", error);
    return new NextResponse("OK", { status: 200 });
  }
}

// Fonction pour obtenir la réponse du bot (à implémenter)
async function getBotResponse(userMessage) {
  // Appel à votre /api/chat existant
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      messages: [{ role: "user", content: userMessage }] 
    }),
  });
  
  const data = await res.json();
  return data.reply || "Désolé, j'ai eu un problème. Veuillez réessayer.";
}

// Fonction pour envoyer un message via l'API Messenger
async function sendMessage(recipientId, text) {
  const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  
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
  
  return response.json();
}
```

### 3.2 Configurer le webhook dans Meta

1. Dans Meta Developers → **Webhooks**
2. **URL de callback** : `https://votre-domaine.com/api/messenger`
3. **Jeton de vérification** : `mon_chatbot_verify_token` (doit correspondre au code)
4. **Sélectionner** les événements :
   - `messages`
   - `message_postbacks`
   - `message_deliveries`

### 3.3 Souscrire au webhook

Aller dans **Messenger → Configuration** → **Webhooks**
→ Cliquer sur "Souscrire" aux événements sélectionnés.

---

## Étape 4 : Obtenir le Page Access Token

1. Dans Meta Developers → **Messenger → Configuration**
2. **Générer un token** en sélectionnant une Page Facebook
3. **Copier** le token (il sera utilisé comme variable d'environnement)

---

## Étape 5 : Variables d'environnement

Dans `.env.local` :

```env
# Groq (déjà configuré)
GROQ_API_KEY=your_groq_api_key

# Messenger (nouvelles variables)
MESSENGER_PAGE_ACCESS_TOKEN=your_page_access_token
MESSENGER_VERIFY_TOKEN=mon_chatbot_verify_token
```

---

## Étape 6 : Déployer et tester

### Déploiement requis
Le webhook nécessite **HTTPS** (Facebook ne supporte pas HTTP).

**Options de déploiement** :
| Service | Gratuit | HTTPS | Domaine personnalisé |
|---------|---------|------|---------------------|
| Vercel | ✅ | ✅ | ✅ |
| Netlify | ✅ | ✅ | ✅ |
| Railway | ✅ (limité) | ✅ | ✅ |

### Test en local (optionnel)
Pour tester sans déployer :
1. Utiliser **ngrok** : `ngrok http 3000`
2. Utiliser l'URL ngrok comme webhook

---

## Étape 7 : Validation Meta (Review)

Pour rendre le bot accessible au public :

1. **Aller** dans "Review des fonctionnalités"
2. **Soumettre** les permissions nécessaires :
   - `pages_messaging`
   - `pages_read_engagement`
3. **Remplir** le formulaire de review :
   - Description du bot
   - Captures d'écran
   - Instructions de test

**Délai** : 1-7 jours ouvrés

---

## Résumé des fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `app/api/messenger/route.js` | **Créer** - Webhook handler |
| `.env.local` | **Modifier** - Ajouter tokens |
| `app/page.js` | **Optionnel** - Ajouter lien onboarding |

---

## Checklist final

- [ ] Compte Meta Developers créé
- [ ] App Messenger configurée
- [ ] Webhook créé et validé
- [ ] Page Access Token obtenu
- [ ] Variables d'environnement configurées
- [ ] Déploiement HTTPS fait
- [ ] Test avec compte Facebook personnel
- [ ] Soumis pour review Meta

---

> **Note** : Pendant le développement, tester avec des **comptes test** Facebook (ajouter dans "Rôles → Rôles de test").