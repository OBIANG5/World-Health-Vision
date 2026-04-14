import { useState } from "react";
import "../../styles/country.css";

type CountryDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function CountryDrawer({
  open,
  onClose,
}: CountryDrawerProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <aside
      className={`country-drawer ${open ? "open" : ""} ${
        fullscreen ? "fullscreen" : ""
      }`}
    >
      <div className="country-drawer-header">
        <div className="country-drawer-title-block">
          <h2 className="country-drawer-title">Country Sheet</h2>
          <p className="country-drawer-subtitle">
            V2 intelligent country overview
          </p>
        </div>

        <div className="country-drawer-actions">
          <button
            className="drawer-btn"
            onClick={() => setFullscreen(!fullscreen)}
            type="button"
          >
            {fullscreen ? "⤢" : "⛶"}
          </button>

          <button className="drawer-btn close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
      </div>

      <div className="country-drawer-content">
        <div className="info-card">
          <h3>Country name</h3>
          <p>This panel will show the real selected country.</p>
        </div>

        <div className="info-card">
          <h3>Economic indicators</h3>
          <p>This area will contain charts and indicator data.</p>
        </div>

        <div className="info-card">
          <h3>Daily economy</h3>
          <p>
            This block is reserved for future affordability, FX conversion,
            hotel and living-cost tools.
          </p>
        </div>

        <div className="info-card">
          <h3>Comparison</h3>
          <p>This block will later host country comparison tools.</p>
        </div>
      </div>
    </aside>
  );
}