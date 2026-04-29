/* Ceci est la page principale du site; c
'est la première page que l'utilisateur voit; ici, le composant ChatBot qui apparaitra
en bas à droite de l'écran, et qui permettra à l'utilisateur d'interagir avec le chatbot. */

import ChatBot from "@/components/ChatBot";

export default function Home() {
  return (
    <main style= {{ minHeight: "100vh", background: "linear-gradiant(135deg, #0084ff, #a020f0)"}}>

      {/*Contenu du site à personnaliser plus tard */}
      <div style={{ padding: 40, fontFamily: "sans-serif"}}>
        <h1>Bienvenue sur notre site !</h1>
        <p>Notre assistant es disponible en bas à droite.</p>
      </div>

      {/* Le chatbot flottant */}
      <ChatBot/>
    </main>
  );
} 