"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Informations personnelles
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    entreprise: "",
    poste: "",
    // Besoins et préférences
    produitInteret: "",
    budget: "",
    delai: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    const required = {
      1: ["nom", "prenom", "email"],
      2: ["entreprise", "poste"],
      3: ["produitInteret", "budget"],
    };

    required[currentStep]?.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = "Ce champ est requis";
      }
    });

    // Validation email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);

    // Simulation d'envoi - ici tu connecteras ton API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Données du formulaire:", formData);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      entreprise: "",
      poste: "",
      produitInteret: "",
      budget: "",
      delai: "",
      message: "",
    });
    setStep(1);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Merci pour votre intérêt !</h2>
          <p style={styles.successText}>
            Nous avons bien reçu votre demande. Notre équipe vous contactera dans les 24 heures.
          </p>
          <div style={styles.successDetails}>
            <p><strong>Email :</strong> {formData.email}</p>
            <p><strong>Entreprise :</strong> {formData.entreprise}</p>
          </div>
          <button onClick={resetForm} style={styles.buttonSecondary}>
            Soumettre une nouvelle demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  ...styles.progressStep,
                  ...(step >= s ? styles.progressStepActive : {}),
                }}
              >
                {s}
              </div>
            ))}
          </div>
          <div style={styles.progressLabels}>
            <span>Contact</span>
            <span>Entreprise</span>
            <span>Besoins</span>
          </div>
        </div>

        {/* Step 1: Informations personnelles */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>👤 Vos informations</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  style={errors.nom ? styles.inputError : styles.input}
                  placeholder="Dupont"
                />
                {errors.nom && <span style={styles.errorText}>{errors.nom}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prénom *</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  style={errors.prenom ? styles.inputError : styles.input}
                  placeholder="Jean"
                />
                {errors.prenom && <span style={styles.errorText}>{errors.prenom}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={errors.email ? styles.inputError : styles.input}
                  placeholder="jean.dupont@entreprise.com"
                />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Informations entreprise */}
        {step === 2 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>🏢 Votre entreprise</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom de l'entreprise *</label>
                <input
                  type="text"
                  name="entreprise"
                  value={formData.entreprise}
                  onChange={handleChange}
                  style={errors.entreprise ? styles.inputError : styles.input}
                  placeholder="Mon Entreprise"
                />
                {errors.entreprise && <span style={styles.errorText}>{errors.entreprise}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Votre poste *</label>
                <input
                  type="text"
                  name="poste"
                  value={formData.poste}
                  onChange={handleChange}
                  style={errors.poste ? styles.inputError : styles.input}
                  placeholder="Directeur Marketing"
                />
                {errors.poste && <span style={styles.errorText}>{errors.poste}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Besoins */}
        {step === 3 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>🎯 Vos besoins</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Produit/Service d'intérêt *</label>
                <select
                  name="produitInteret"
                  value={formData.produitInteret}
                  onChange={handleChange}
                  style={errors.produitInteret ? styles.inputError : styles.input}
                >
                  <option value="">Sélectionner...</option>
                  <option value="chatbot">Chatbot Messenger</option>
                  <option value="support">Support client IA</option>
                  <option value="automation">Automatisation</option>
                  <option value="autre">Autre</option>
                </select>
                {errors.produitInteret && <span style={styles.errorText}>{errors.produitInteret}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Budget estimé *</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  style={errors.budget ? styles.inputError : styles.input}
                >
                  <option value="">Sélectionner...</option>
                  <option value="<1000">Moins de 1000€</option>
                  <option value="1000-5000">1000€ - 5000€</option>
                  <option value="5000-10000">5000€ - 10000€</option>
                  <option value=">10000">Plus de 10000€</option>
                </select>
                {errors.budget && <span style={styles.errorText}>{errors.budget}</span>}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Délai de déploiement souhaité</label>
                <select
                  name="delai"
                  value={formData.delai}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Sélectionner...</option>
                  <option value="urgent">Urgent (1-2 semaines)</option>
                  <option value="1mois">1 mois</option>
                  <option value="3mois">3 mois</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div style={styles.formGroupFull}>
                <label style={styles.label}>Message complémentaire</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
                  placeholder="Décrivez votre projet en quelques mots..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.buttonContainer}>
          {step > 1 && (
            <button onClick={prevStep} style={styles.buttonSecondary}>
              ← Précédent
            </button>
          )}
          {step < 3 ? (
            <button onClick={nextStep} style={styles.buttonPrimary}>
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={isSubmitting ? styles.buttonDisabled : styles.buttonPrimary}
            >
              {isSubmitting ? "Envoi en cours..." : "Soumettre ma demande"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxWidth: "600px",
    width: "100%",
    padding: "40px",
  },
  progressContainer: {
    marginBottom: "30px",
  },
  progressBar: {
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
    marginBottom: "10px",
  },
  progressStep: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#666",
    zIndex: 1,
  },
  progressStepActive: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#666",
  },
  stepContent: {
    animation: "fadeIn 0.3s ease",
  },
  stepTitle: {
    fontSize: "24px",
    marginBottom: "25px",
    color: "#333",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formGroupFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#444",
    marginBottom: "8px",
  },
  input: {
    padding: "12px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    fontSize: "15px",
    transition: "border-color 0.3s",
    outline: "none",
  },
  inputError: {
    padding: "12px 16px",
    border: "2px solid #ff4444",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
  },
  errorText: {
    color: "#ff4444",
    fontSize: "12px",
    marginTop: "5px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
    gap: "15px",
  },
  buttonPrimary: {
    flex: 1,
    padding: "14px 28px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  buttonSecondary: {
    padding: "14px 28px",
    background: "#f0f0f0",
    color: "#333",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  buttonDisabled: {
    flex: 1,
    padding: "14px 28px",
    background: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "not-allowed",
  },
  successCard: {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxWidth: "500px",
    width: "100%",
    padding: "40px",
    textAlign: "center",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontSize: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  successTitle: {
    fontSize: "28px",
    color: "#333",
    marginBottom: "15px",
  },
  successText: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "25px",
  },
  successDetails: {
    background: "#f8f9fa",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "25px",
    textAlign: "left",
  },
};