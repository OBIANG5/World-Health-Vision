import "../../styles/eye.css";

type EyeLayoutProps = {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
};

export default function EyeLayout({ children, headerActions }: EyeLayoutProps) {
  return (
    <div className="whv-page">
      <header className="whv-header">
        <div className="whv-brand">
          <div className="whv-brand-logo" aria-hidden="true">
            <svg viewBox="0 0 96 60" className="whv-brand-logo-svg">
              <defs>
                <clipPath id="whv-brand-globe-clip">
                  <circle cx="48" cy="30" r="13.5" />
                </clipPath>
              </defs>

              {/* Sclère — fond blanc de l'œil (visible autour du globe) */}
              <path
                d="M8 30 C20 14, 36 7, 48 7 C60 7, 76 14, 88 30 C76 46, 60 53, 48 53 C36 53, 20 46, 8 30 Z"
                fill="#dceef8"
              />

              {/* Globe / iris — fond sombre */}
              <circle cx="48" cy="30" r="13.5" fill="#081c2d" />

              {/* Grille méridienne */}
              <g clipPath="url(#whv-brand-globe-clip)" opacity="0.38">
                <ellipse cx="48" cy="30" rx="13.5" ry="5.5" fill="none" stroke="#4db8ff" strokeWidth="0.5" />
                <ellipse cx="48" cy="30" rx="13.5" ry="10"  fill="none" stroke="#4db8ff" strokeWidth="0.5" />
                <line x1="48" y1="16.5" x2="48" y2="43.5"  stroke="#4db8ff" strokeWidth="0.5" />
                <line x1="34.5" y1="30" x2="61.5" y2="30"  stroke="#4db8ff" strokeWidth="0.5" />
              </g>

              {/* Continents */}
              <ellipse cx="41.5" cy="29" rx="3.0" ry="4.6" fill="#1a72b8" clipPath="url(#whv-brand-globe-clip)" />
              <ellipse cx="49.5" cy="27" rx="2.0" ry="2.6" fill="#1a72b8" clipPath="url(#whv-brand-globe-clip)" />
              <ellipse cx="50"   cy="34" rx="2.2" ry="3.2" fill="#1a72b8" clipPath="url(#whv-brand-globe-clip)" />
              <ellipse cx="56.5" cy="26" rx="3.8" ry="2.8" fill="#1a72b8" clipPath="url(#whv-brand-globe-clip)" />
              <ellipse cx="58.5" cy="34" rx="1.8" ry="1.3" fill="#1a72b8" clipPath="url(#whv-brand-globe-clip)" />

              {/* Reflet globe */}
              <ellipse cx="43.5" cy="23.5" rx="3.5" ry="2.2" fill="rgba(200,235,255,0.10)" clipPath="url(#whv-brand-globe-clip)" />

              {/* Bague limbique — séparation sclère / iris */}
              <circle cx="48" cy="30" r="13.5" fill="none" stroke="rgba(6,32,52,0.55)" strokeWidth="1.2" />

              {/* Bordure épaisse de l'œil */}
              <path
                d="M8 30 C20 14, 36 7, 48 7 C60 7, 76 14, 88 30 C76 46, 60 53, 48 53 C36 53, 20 46, 8 30 Z"
                fill="none"
                stroke="#0a3050"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Filet lumineux interne de la bordure */}
              <path
                d="M8 30 C20 14, 36 7, 48 7 C60 7, 76 14, 88 30 C76 46, 60 53, 48 53 C36 53, 20 46, 8 30 Z"
                fill="none"
                stroke="rgba(100, 196, 255, 0.20)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="whv-brand-text">
            <h1>World Health Vision</h1>
            <p>Observe the health of the world</p>
          </div>
        </div>
        {headerActions}
      </header>

      <main className="whv-main">{children}</main>
    </div>
  );
}