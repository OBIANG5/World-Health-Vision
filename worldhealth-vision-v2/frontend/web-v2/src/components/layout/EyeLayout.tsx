import "../../styles/eye.css";

type EyeLayoutProps = {
  children: React.ReactNode;
};

export default function EyeLayout({ children }: EyeLayoutProps) {
  return (
    <div className="whv-page">
      <header className="whv-header">
        <div className="whv-brand">
          <div className="whv-brand-logo" aria-hidden="true">
            <svg viewBox="0 0 96 60" className="whv-brand-logo-svg">
              <path
                d="M8 30 C20 15, 36 8, 48 8 C60 8, 76 15, 88 30 C76 45, 60 52, 48 52 C36 52, 20 45, 8 30 Z"
                className="whv-brand-eye-stroke"
              />
              <circle cx="48" cy="30" r="13" className="whv-brand-globe" />
              <circle cx="48" cy="30" r="4.2" className="whv-brand-pupil" />
            </svg>
          </div>

          <div className="whv-brand-text">
            <h1>World Health Vision</h1>
            <p>Observe the health of the world</p>
          </div>
        </div>
      </header>

      <main className="whv-main">{children}</main>
    </div>
  );
}