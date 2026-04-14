import { useState } from "react";
import EyeLayout from "./components/layout/EyeLayout";
import EyeMapFrame from "./components/layout/EyeMapFrame";
import CountryDrawer from "./components/country/CountryDrawer";

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <EyeLayout>
      <EyeMapFrame drawerOpen={drawerOpen} />

      <CountryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {!drawerOpen && (
        <button
          type="button"
          className="open-sheet-btn"
          onClick={() => setDrawerOpen(true)}
        >
          Open country sheet
        </button>
      )}
    </EyeLayout>
  );
}

export default App;