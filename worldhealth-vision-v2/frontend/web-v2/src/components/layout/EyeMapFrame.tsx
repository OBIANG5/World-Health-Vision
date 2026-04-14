import WorldMap from "../map/WorldMap";
import "../../styles/eye.css";

type EyeMapFrameProps = {
  drawerOpen: boolean;
};

export default function EyeMapFrame({ drawerOpen }: EyeMapFrameProps) {
  return (
    <section className={`eye-stage ${drawerOpen ? "drawer-open" : ""}`}>
      <div className="eye-scene">
        <svg
          className="eye-svg"
          viewBox="0 0 1600 760"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="whv-eye-clip" clipPathUnits="userSpaceOnUse">
              <path d="M30 380 C210 150, 500 56, 800 56 C1100 56, 1390 150, 1570 380 C1390 610, 1100 704, 800 704 C500 704, 210 610, 30 380 Z" />
            </clipPath>

            <filter id="whv-eye-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="whv-eye-stroke-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0f5f93" />
              <stop offset="50%" stopColor="#0b74b6" />
              <stop offset="100%" stopColor="#0f5f93" />
            </linearGradient>
          </defs>

          <foreignObject
            x="0"
            y="0"
            width="1600"
            height="760"
            clipPath="url(#whv-eye-clip)"
            className="eye-map-foreign"
          >
            <div className="eye-map-surface">
              <WorldMap />
            </div>
          </foreignObject>

          <path
            d="M30 380 C210 150, 500 56, 800 56 C1100 56, 1390 150, 1570 380 C1390 610, 1100 704, 800 704 C500 704, 210 610, 30 380 Z"
            className="eye-outline-main"
            filter="url(#whv-eye-glow)"
          />

          <path
            d="M30 380 C210 150, 500 56, 800 56 C1100 56, 1390 150, 1570 380 C1390 610, 1100 704, 800 704 C500 704, 210 610, 30 380 Z"
            className="eye-outline-highlight"
          />
        </svg>
      </div>
    </section>
  );
}