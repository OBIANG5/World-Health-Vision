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

// ---------- stub responses (until real LLM backend is wired) ----------

function generateStubResponse(question: string, countryName: string, lang: string): string {
  const fr = lang === "fr";
  const q = question.toLowerCase();

  if (q.includes("coût") || q.includes("cost") || q.includes("prix") || q.includes("price")) {
    return fr
      ? `Le coût de la vie en **${countryName}** varie selon le style de vie. D'après les données WHV (sources : Banque Mondiale, OCDE, Numbeo), l'indice général de prix oscille autour de la base OCDE=100. Les villes principales sont généralement plus onéreuses que les zones rurales. \n\n**Postes majeurs :** logement (35–45% du budget), alimentation (20–25%), transport (10–15%).\n\n*Pour une estimation précise, consultez le module "Pouvoir d'achat" et renseignez votre budget mensuel.*`
      : `The cost of living in **${countryName}** varies by lifestyle. According to WHV data (sources: World Bank, OECD, Numbeo), the general price index fluctuates around the OECD=100 base. Major cities are typically more expensive than rural areas.\n\n**Main expenses:** housing (35–45%), food (20–25%), transport (10–15%).\n\n*For a precise estimate, check the "Purchasing Power" module and enter your monthly budget.*`;
  }

  if (q.includes("santé") || q.includes("health") || q.includes("médical") || q.includes("medical")) {
    return fr
      ? `Le système de santé de **${countryName}** est évalué à travers l'indice de prospérité WHV (sources : OMS, Banque Mondiale, OCDE). \n\n**Points clés pour les expatriés :**\n- Assurance maladie internationale recommandée\n- Qualité variable entre secteur public et privé\n- Couverture des médicaments chroniques à vérifier\n\n*La section "Santé & Développement humain" de la fiche pays affiche les indicateurs détaillés.*`
      : `The healthcare system of **${countryName}** is assessed through the WHV prosperity index (sources: WHO, World Bank, OECD).\n\n**Key points for expats:**\n- International health insurance recommended\n- Variable quality between public and private sectors\n- Check coverage for chronic medication\n\n*The "Health & Human Development" section in the country sheet shows detailed indicators.*`;
  }

  if (q.includes("retraite") || q.includes("retirement") || q.includes("expat")) {
    return fr
      ? `**${countryName}** présente certaines caractéristiques intéressantes pour la retraite ou l'expatriation. \n\n**Facteurs à considérer :**\n- Coût de la vie relatif (indice WHV GENERAL_COST_LEVEL)\n- Stabilité économique (LABOR_STRESS, EXTERNAL_BALANCE)\n- Qualité de vie (PROSPERITY_LEVEL)\n- Visas pour retraités / résidence long terme\n\n*Utilisez le module "Expat" pour comparer automatiquement votre budget avec les destinations disponibles.*`
      : `**${countryName}** presents certain interesting characteristics for retirement or expat living.\n\n**Factors to consider:**\n- Relative cost of living (WHV GENERAL_COST_LEVEL index)\n- Economic stability (LABOR_STRESS, EXTERNAL_BALANCE)\n- Quality of life (PROSPERITY_LEVEL)\n- Retirement / long-term residence visas\n\n*Use the "Expat" module to automatically compare your budget with available destinations.*`;
  }

  if (q.includes("risque") || q.includes("risk") || q.includes("économique") || q.includes("economic")) {
    return fr
      ? `Les risques économiques en **${countryName}** sont analysés par plusieurs lentilles WHV :\n\n- **PRICE_PRESSURE** : pression inflationniste sur les ménages\n- **LABOR_STRESS** : tensions sur le marché de l'emploi\n- **EXTERNAL_BALANCE** : déficit/excédent courant — indicateur de vulnérabilité externe\n\n*Sources : FMI, Banque Mondiale, OCDE. Consultez la fiche pays pour les signaux détaillés et le niveau de confiance des données.*`
      : `Economic risks in **${countryName}** are analyzed through several WHV lenses:\n\n- **PRICE_PRESSURE**: inflationary pressure on households\n- **LABOR_STRESS**: labor market tensions\n- **EXTERNAL_BALANCE**: current account deficit/surplus — external vulnerability indicator\n\n*Sources: IMF, World Bank, OECD. Check the country sheet for detailed signals and data confidence levels.*`;
  }

  if (q.includes("emploi") || q.includes("travail") || q.includes("job") || q.includes("work")) {
    return fr
      ? `Le marché de l'emploi de **${countryName}** est mesuré par la lentille LABOR_STRESS (sources : OIT, Banque Mondiale). \n\n**Points clés :**\n- Taux de chômage et tendances récentes\n- Secteurs porteurs pour les étrangers\n- Reconnaissance des diplômes et permis de travail\n- Barrière linguistique (langue de travail dominante)\n\n*Ce conseil est basé sur les données WHV disponibles. Pour des informations spécifiques à votre secteur, complétez avec des sources locales.*`
      : `The labor market in **${countryName}** is measured by the LABOR_STRESS lens (sources: ILO, World Bank).\n\n**Key points:**\n- Unemployment rate and recent trends\n- High-demand sectors for foreigners\n- Degree recognition and work permits\n- Language barrier (dominant working language)\n\n*This advice is based on available WHV data. For sector-specific information, supplement with local sources.*`;
  }

  if (q.includes("fiscal") || q.includes("impôt") || q.includes("tax")) {
    return fr
      ? `La fiscalité de **${countryName}** est un aspect critique pour les expatriés. \n\n**Éléments à analyser :**\n- Convention fiscale avec votre pays d'origine\n- Taux d'imposition sur les revenus étrangers\n- Taxes locales et charges sociales\n- Régimes spéciaux pour non-résidents\n\n*WHV ne couvre pas encore les données fiscales détaillées. Cette information est à vérifier auprès d'un conseiller fiscal local ou de sources comme IBFD / EY Tax Guides.*`
      : `The tax system in **${countryName}** is critical for expats.\n\n**Elements to analyze:**\n- Tax treaty with your home country\n- Tax rate on foreign income\n- Local taxes and social contributions\n- Special regimes for non-residents\n\n*WHV does not yet cover detailed tax data. Check with a local tax advisor or sources like IBFD / EY Tax Guides.*`;
  }

  return fr
    ? `Voici ce que je sais sur **${countryName}** basé sur les données WHV actuelles.\n\nLes indicateurs économiques clés incluent le niveau de prix (GENERAL_COST_LEVEL), la stabilité (LABOR_STRESS, EXTERNAL_BALANCE) et la prospérité (PROSPERITY_LEVEL). Ces lentilles agrègent des données de la Banque Mondiale, du FMI, de l'OCDE et d'autres sources.\n\n*Pour une analyse approfondie, consultez la fiche pays complète ou posez une question plus spécifique.*`
    : `Here is what I know about **${countryName}** based on current WHV data.\n\nKey economic indicators include price level (GENERAL_COST_LEVEL), stability (LABOR_STRESS, EXTERNAL_BALANCE), and prosperity (PROSPERITY_LEVEL). These lenses aggregate data from the World Bank, IMF, OECD, and other sources.\n\n*For in-depth analysis, check the full country sheet or ask a more specific question.*`;
}

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
      // Fallback to local stub when backend is unreachable
      const countryName = contextCountry?.displayName ?? contextIso3;
      response = generateStubResponse(text, countryName, lang);
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
            : (fr ? "Mode hors-ligne — données WHV simulées (backend non connecté)" : "Offline mode — simulated WHV data (backend not connected)")}
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