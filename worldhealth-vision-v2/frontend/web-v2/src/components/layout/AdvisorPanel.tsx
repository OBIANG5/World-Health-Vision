// WorldHealthVision V2 — AdvisorPanel
// Assistant IA de conseil pays : interface conversationnelle.
// Contexte transmis à l'IA : profil utilisateur + données WHV du pays sélectionné.
// Architecture : appel réel vers /api/analytics/advisor/chat (FastAPI analytics-service).
// Fallback sur réponses stub locales si le backend est indisponible.

import { useEffect, useRef, useState } from "react";
import type { CountrySummary } from "../../api/types";
import { useLang } from "../../context/LanguageContext";
import { useUserProfile } from "../../context/UserProfileContext";
import "../../styles/advisor.css";

// ---------- types ----------

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  country?: string;
  isStreaming?: boolean;
}

interface AdvisorPanelProps {
  countries: CountrySummary[];
  selectedIso3?: string;
  onClose: () => void;
}

// ---------- suggested questions ----------

const SUGGESTED_FR = [
  "Quel est le coût de la vie en {country} pour une famille de 3 personnes ?",
  "Comment est le système de santé en {country} pour les expatriés ?",
  "Quels sont les risques économiques à surveiller en {country} ?",
  "Est-ce que {country} est un bon choix pour prendre sa retraite ?",
  "Comment se passe la recherche d'emploi pour un étranger en {country} ?",
  "Quels sont les avantages fiscaux pour les expatriés en {country} ?",
];

const SUGGESTED_EN = [
  "What is the cost of living in {country} for a family of 3?",
  "How is the healthcare system in {country} for expats?",
  "What are the economic risks to watch in {country}?",
  "Is {country} a good choice for retirement?",
  "How is job hunting for a foreigner in {country}?",
  "What are the tax benefits for expats in {country}?",
];

// When the real V2 analytics service is offline, do not fabricate country
// statistics or claim that OECD, Numbeo or World Bank data were consulted.

// ---------- helper ----------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- composant ----------

export default function AdvisorPanel({ countries, selectedIso3, onClose }: AdvisorPanelProps) {
  const lang = useLang();
  const { profile } = useUserProfile();
  const fr = lang === "fr";

  const [contextIso3, setContextIso3] = useState(selectedIso3 ?? profile.homeIso3 ?? "FRA");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [usedBackend, setUsedBackend] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const contextCountry = countries.find((c) => c.iso3 === contextIso3);

  // Welcome message on mount
  useEffect(() => {
    const welcome: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: fr
        ? `Bonjour ${profile.displayName ? profile.displayName : ""} ! Je suis l'assistant WHV. Je peux vous conseiller sur n'importe quel pays en m'appuyant sur les données économiques multi-sources de la plateforme.\n\n**Pays actuel :** ${contextCountry?.displayName ?? contextIso3}\n\nQue voulez-vous savoir ?`
        : `Hello${profile.displayName ? " " + profile.displayName : ""}! I'm the WHV advisor. I can advise you on any country using the platform's multi-source economic data.\n\n**Current country:** ${contextCountry?.displayName ?? contextIso3}\n\nWhat would you like to know?`,
      timestamp: Date.now(),
    };
    setMessages([welcome]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || thinking) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
      country: contextIso3,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    // Typing indicator
    const thinkingId = uid();
    setMessages((prev) => [...prev, {
      id: thinkingId,
      role: "assistant",
      content: fr ? "..." : "...",
      timestamp: Date.now(),
      isStreaming: true,
    }]);

    let response: string;
    try {
      const res = await fetch("/api/analytics/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, iso3: contextIso3, lang }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { answer: string };
      response = data.answer;
      setUsedBackend(true);
    } catch {
      setUsedBackend(false);
      response = fr
        ? "Le conseiller économique nécessite le service Analytics de WorldHealth Vision V2. Il n'est pas accessible pour le moment : aucune statistique, source ou recommandation n'a été simulée. Consultez les indicateurs disponibles dans la fiche du pays."
        : "The WorldHealth Vision V2 Analytics service is currently unavailable. No figures, sources or recommendations have been invented. Please consult the available country indicators.";
    }

    setMessages((prev) => prev.map((m) =>
      m.id === thinkingId
        ? { ...m, content: response, isStreaming: false }
        : m,
    ));
    setThinking(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const suggestions = (fr ? SUGGESTED_FR : SUGGESTED_EN)
    .map((s) => s.replace("{country}", contextCountry?.displayName ?? contextIso3))
    .slice(0, 3);

  return (
    <div className="adv-panel">
      {/* Header */}
      <div className="adv-header">
        <div className="adv-header-left">
          <span className="adv-header-icon">🤖</span>
          <div>
            <h2 className="adv-title">{fr ? "Assistant WHV" : "WHV Advisor"}</h2>
            <p className="adv-subtitle">
              {fr ? "Conseil pays basé sur les données multi-sources" : "Country advice based on multi-source data"}
            </p>
          </div>
        </div>
        <div className="adv-header-actions">
          {/* Country context selector */}
          <select
            className="adv-country-select"
            value={contextIso3}
            onChange={(e) => setContextIso3(e.target.value)}
            title={fr ? "Changer de pays de contexte" : "Change context country"}
          >
            {countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>{c.displayName}</option>
            ))}
          </select>
          <button type="button" className="adv-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Beta notice */}
      <div className="adv-beta-notice">
        <span className="adv-beta-badge">{fr ? "BÊTA" : "BETA"}</span>
        <span>
          {usedBackend
            ? (fr ? "Données WHV en direct · analytics-service connecté" : "Live WHV data · analytics-service connected")
            : (fr ? "Service Analytics non vérifié · aucune donnée simulée" : "Analytics service not verified · no simulated data")}
        </span>
      </div>

      {/* Messages */}
      <div className="adv-messages">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} lang={lang} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="adv-suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="adv-suggestion-btn"
              onClick={() => void sendMessage(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="adv-input-row">
        <textarea
          ref={inputRef}
          className="adv-input"
          placeholder={fr ? `Posez une question sur ${contextCountry?.displayName ?? "ce pays"}...` : `Ask a question about ${contextCountry?.displayName ?? "this country"}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={thinking}
        />
        <button
          type="button"
          className="adv-send-btn"
          onClick={() => void sendMessage(input)}
          disabled={!input.trim() || thinking}
        >
          {thinking ? "⟳" : "↑"}
        </button>
      </div>
      <p className="adv-input-hint">
        {fr ? "Entrée pour envoyer • Shift+Entrée pour saut de ligne" : "Enter to send • Shift+Enter for newline"}
      </p>
    </div>
  );
}

// ---------- ChatBubble ----------

function ChatBubble({ msg, lang }: { msg: ChatMessage; lang: string }) {
  const isUser = msg.role === "user";
  const isStreaming = msg.isStreaming;

  // Parse bold markdown: **text** → <strong>text</strong>
  // Parse newlines → <br>
  function renderContent(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p,
          )}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  }

  return (
    <div className={`adv-bubble-wrap ${isUser ? "adv-bubble-wrap--user" : "adv-bubble-wrap--assistant"}`}>
      {!isUser && <span className="adv-bubble-avatar">🤖</span>}
      <div className={`adv-bubble ${isUser ? "adv-bubble--user" : "adv-bubble--assistant"}${isStreaming ? " adv-bubble--streaming" : ""}`}>
        {isStreaming
          ? <span className="adv-typing">{lang === "fr" ? "Analyse en cours…" : "Thinking…"}</span>
          : <span className="adv-bubble-text">{renderContent(msg.content)}</span>}
      </div>
      {isUser && <span className="adv-bubble-avatar adv-bubble-avatar--user">👤</span>}
    </div>
  );
}