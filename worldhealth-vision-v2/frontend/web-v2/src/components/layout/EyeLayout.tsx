import "../../styles/eye.css";
import { useLang } from "../../context/LanguageContext";

type EyeLayoutProps = {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
};

export default function EyeLayout({ children, headerActions }: EyeLayoutProps) {
  const lang = useLang();
  return (
    <div className="whv-page">
      <header className="whv-header">
        <div className="whv-brand">
          <div className="whv-brand-logo" aria-hidden="true">
            <svg viewBox="0 0 112 70" className="whv-brand-logo-svg" role="img" aria-label="World Vision — œil et Terre">
              <defs>
                <radialGradient id="wv-brand-sea" cx="35%" cy="22%" r="85%">
                  <stop offset="0" stopColor="#12aaf7"/>
                  <stop offset=".55" stopColor="#075db3"/>
                  <stop offset="1" stopColor="#001a63"/>
                </radialGradient>
                <linearGradient id="wv-brand-stroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#90faff"/>
                  <stop offset=".48" stopColor="#007df0"/>
                  <stop offset="1" stopColor="#a6fcff"/>
                </linearGradient>
                <clipPath id="wv-brand-clip"><circle cx="56" cy="35" r="25"/></clipPath>
              </defs>
              <path d="M3 35Q56 -14 109 35Q56 84 3 35Z" fill="#ffffff" stroke="#046ad9" strokeWidth="6"/>
              <path d="M4 35Q56 -13 108 35" fill="none" stroke="#64f1ff" strokeWidth="3.6"/>
              <path d="M4 35Q56 83 108 35" fill="none" stroke="#2de8ff" strokeWidth="3.6"/>
              <circle cx="56" cy="35" r="25.5" fill="url(#wv-brand-sea)" stroke="#35ddff" strokeWidth="2"/>
              <g clipPath="url(#wv-brand-clip)">
                <path d="M35 30 44 22 50 20 54 25 63 23 71 30 72 38 66 42 61 51 51 49 49 41 40 37z" fill="#3ea452"/>
                <path d="M41 33 56 31 66 35 68 43 61 49 54 47 50 39z" fill="#edbd59"/>
                <path d="M57 18 66 20 75 27 70 32 62 28 58 24z" fill="#87ba41"/>
                <path d="M34 18 41 22 39 30 33 34" fill="#58ae52"/>
                <path d="M34 43 40 45 44 56 39 59" fill="#a7bb45"/>
              </g>
              <circle cx="56" cy="35" r="25.2" fill="none" stroke="#e5fdff" strokeWidth=".9"/>
            </svg>
          </div>

          <div className="whv-brand-text">
            <h1>World Health Vision</h1>
            <p>{lang === "fr" ? "Voir le monde, le comprendre." : "See the world, understand it."}</p>
          </div>
        </div>
        {headerActions}
      </header>

      <main className="whv-main">{children}</main>
    </div>
  );
}