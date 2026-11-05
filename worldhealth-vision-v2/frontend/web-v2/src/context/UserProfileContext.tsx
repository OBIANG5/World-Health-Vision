// WorldHealthVision V2 — UserProfileContext
// Profil utilisateur persisté en localStorage.
// Contient : pays de résidence, budget mensuel, situation, priorités pondérées.
// Toute la personnalisation (score destination, pouvoir d'achat, alertes) s'appuie sur ce contexte.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ---------- types ----------

export type UserSituation =
  | "employee"
  | "freelance"
  | "retired"
  | "student"
  | "investor"
  | "other";

export interface UserPriorities {
  cost: number;         // 0–10
  safety: number;
  healthcare: number;
  employment: number;
  governance: number;
}

export interface UserProfile {
  homeIso3: string;
  monthlyBudgetEur: number;
  situation: UserSituation;
  priorities: UserPriorities;
  preferredCurrency: string;
  displayName: string;
}

const DEFAULT_PROFILE: UserProfile = {
  homeIso3: "FRA",
  monthlyBudgetEur: 2500,
  situation: "employee",
  priorities: {
    cost: 7,
    safety: 6,
    healthcare: 6,
    employment: 5,
    governance: 5,
  },
  preferredCurrency: "EUR",
  displayName: "",
};

// ---------- context ----------

interface UserProfileCtx {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updatePriority: (key: keyof UserPriorities, value: number) => void;
  resetProfile: () => void;
  hasProfile: boolean;
}

const UserProfileContext = createContext<UserProfileCtx | null>(null);

const STORAGE_KEY = "whv_user_profile_v2";

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      priorities: { ...DEFAULT_PROFILE.priorities, ...(parsed.priorities ?? {}) },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

// ---------- provider ----------

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [hasProfile, setHasProfile] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== null,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setHasProfile(true);
  }, [profile]);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const updatePriority = useCallback(
    (key: keyof UserPriorities, value: number) => {
      setProfile((prev) => ({
        ...prev,
        priorities: { ...prev.priorities, [key]: value },
      }));
    },
    [],
  );

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    localStorage.removeItem(STORAGE_KEY);
    setHasProfile(false);
  }, []);

  return (
    <UserProfileContext.Provider
      value={{ profile, updateProfile, updatePriority, resetProfile, hasProfile }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

// ---------- hook ----------

export function useUserProfile(): UserProfileCtx {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}

// ---------- labels i18n ----------

export const SITUATION_LABEL: Record<UserSituation, { fr: string; en: string }> = {
  employee:  { fr: "Salarié(e)",        en: "Employee"        },
  freelance: { fr: "Freelance / Indép.", en: "Freelance"       },
  retired:   { fr: "Retraité(e)",       en: "Retired"         },
  student:   { fr: "Étudiant(e)",       en: "Student"         },
  investor:  { fr: "Investisseur",      en: "Investor"        },
  other:     { fr: "Autre",             en: "Other"           },
};

export const PRIORITY_LABEL: Record<keyof UserPriorities, { fr: string; en: string; icon: string }> = {
  cost:        { fr: "Coût de la vie",    en: "Cost of living",  icon: "💶" },
  safety:      { fr: "Sécurité",          en: "Safety",          icon: "🛡" },
  healthcare:  { fr: "Santé publique",    en: "Healthcare",      icon: "🏥" },
  employment:  { fr: "Marché de l'emploi",en: "Job market",      icon: "💼" },
  governance:  { fr: "Gouvernance",       en: "Governance",      icon: "⚖" },
};