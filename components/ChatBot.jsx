// ==================================================
// COMPOSANT PRINCIPAL DU CHATBOT
// Ce fichier gère tout le visuel du chat :
// - Le bouton flottant en bas à droite
// - La fenêtre de conversation
// - Les bulles de messages
// - La zone de saisie
// ==================================================

"use client"; // Indique à Next.js que ce composant s'exécute côté navigateur

import { useState, useRef, useEffect } from "react";

// --------------------------------------------------
// COMPOSANT : Indicateur de frappe (les 3 points animés)
// S'affiche pendant que l'IA prépare sa réponse
// --------------------------------------------------
function TypingIndicator() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "10px 14px", background: "#f0f0f0",
      borderRadius: "18px 18px 18px 4px", width: "fit-content"
    }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: "#aaa",
          display: "block", animation: "bounce 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
    </div>
  );
}

// --------------------------------------------------
// COMPOSANT : Une bulle de message
// - Bleue à droite pour l'utilisateur
// - Grise à gauche pour l'IA
// --------------------------------------------------
function Message({ msg }) {
  const isUser = msg.role === "user"; // true si c'est l'utilisateur

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 4,
      padding: "0 16px",
      animation: "slideIn 0.2s ease-out"
    }}>
      {/* Avatar de l'IA (affiché uniquement pour les messages de l'IA) */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #0084ff, #a020f0)",
          flexShrink: 0, marginRight: 8, alignSelf: "flex-end",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "white", fontWeight: 700
        }}>SC</div>
      )}

      {/* Bulle du message */}
      <div style={{
        maxWidth: "72%", padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg, #0084ff, #0060df)" // bleu pour l'utilisateur
          : "#f0f0f0", // gris pour l'IA
        color: isUser ? "#fff" : "#1c1c1e",
        fontSize: 15, lineHeight: 1.5,
        wordBreak: "break-word", whiteSpace: "pre-wrap"
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// --------------------------------------------------
// COMPOSANT PRINCIPAL : La fenêtre de chat complète
// --------------------------------------------------
export default function ChatBot() {

  // Liste des messages de la conversation
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! 👋 Bienvenue dans notre service client. Comment puis-je vous aider ?" }
  ]);

  const [input, setInput] = useState("");        // Texte tapé par l'utilisateur
  const [isLoading, setIsLoading] = useState(false); // true pendant que l'IA répond
  const [isOpen, setIsOpen] = useState(false);   // true si la fenêtre est ouverte
  const [error, setError] = useState(null);      // Message d'erreur si problème

  const messagesEndRef = useRef(null); // Référence pour scroller vers le bas
  const inputRef = useRef(null);       // Référence pour focus automatique

  // Scroll automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus automatique sur la zone de texte quand on ouvre le chat
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // --------------------------------------------------
  // FONCTION : Envoyer un message
  // 1. Ajoute le message de l'utilisateur
  // 2. Appelle le backend (route.js)
  // 3. Ajoute la réponse de l'IA
  // --------------------------------------------------
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return; // Ne rien faire si le message est vide
    setError(null);

    // Ajoute le message de l'utilisateur à la liste
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Appel au backend sécurisé (app/api/chat/route.js)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }

      // Ajoute la réponse de l'IA à la liste
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Envoyer avec la touche Entrée (Shift+Entrée pour saut de ligne)
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --------------------------------------------------
  // RENDU VISUEL
  // --------------------------------------------------
  return (
    <>
      {/* Animations CSS */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .chat-window { animation: popIn 0.25s ease-out; }
        ::-webkit-scrollbar { width: 0; }
        textarea { resize: none; }
        textarea:focus { outline: none; }
      `}</style>

      {/* Bouton flottant pour ouvrir/fermer le chat */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg, #0084ff, #0060df)",
          cursor: "pointer", boxShadow: "0 4px 20px rgba(0,132,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {/* Icône : X si ouvert, bulle si fermé */}
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.08 2 11c0 2.67 1.19 5.07 3.08 6.74L4 22l4.5-1.5C9.58 20.83 10.77 21 12 21c5.52 0 10-4.08 10-9S17.52 2 12 2z"/>
          </svg>
        )}
      </button>

      {/* Fenêtre de chat (affichée uniquement si isOpen = true) */}
      {isOpen && (
        <div className="chat-window" style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 999,
          width: 360, height: 520, background: "#fff", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>

          {/* En-tête du chat */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 16px", borderBottom: "1px solid #f0f0f0"
          }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, #0084ff, #a020f0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, color: "white", fontWeight: 700
              }}>SC</div>
              {/* Point vert "en ligne" */}
              <div style={{
                position: "absolute", bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: "50%",
                background: "#31a24c", border: "2px solid white"
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Service Client</div>
              <div style={{ fontSize: 12, color: "#31a24c" }}>● En ligne</div>
            </div>
            {/* Bouton fermer */}
            <button onClick={() => setIsOpen(false)} style={{
              border: "none", background: "none", cursor: "pointer",
              color: "#999", fontSize: 20, padding: 4
            }}>×</button>
          </div>

          {/* Zone des messages */}
          <div style={{
            flex: 1, overflowY: "auto", paddingTop: 12, paddingBottom: 8,
            display: "flex", flexDirection: "column", gap: 2
          }}>
            {/* Affiche chaque message */}
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {/* Indicateur de frappe pendant la réponse de l'IA */}
            {isLoading && (
              <div style={{ display: "flex", padding: "4px 16px", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #0084ff, #a020f0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "white", fontWeight: 700, flexShrink: 0
                }}>SC</div>
                <TypingIndicator />
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div style={{
                margin: "4px 16px", padding: "8px 12px",
                background: "#fff0f0", borderRadius: 10,
                fontSize: 13, color: "#d00", textAlign: "center"
              }}>{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            padding: "10px 12px", borderTop: "1px solid #f0f0f0"
          }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "flex-end",
              background: "#f0f0f0", borderRadius: 22,
              padding: "8px 14px", minHeight: 38, maxHeight: 100
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Écrivez votre message…"
                rows={1}
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 14, color: "#1c1c1e", lineHeight: 1.4,
                  fontFamily: "inherit", maxHeight: 80, overflowY: "auto"
                }}
              />
            </div>

            {/* Bouton envoyer */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none",
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg, #0084ff, #0060df)"
                  : "#e4e6eb",
                cursor: input.trim() && !isLoading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={input.trim() && !isLoading ? "white" : "#999"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() && !isLoading ? "white" : "#999"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

        </div>
      )}
    </>
  );
}