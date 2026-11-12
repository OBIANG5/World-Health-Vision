import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import MediaStudio from "./media/MediaStudio";

const isMediaStudio =
  window.location.pathname.startsWith("/media-studio") ||
  new URLSearchParams(window.location.search).get("view") === "media";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isMediaStudio ? <MediaStudio /> : <App />}
  </React.StrictMode>
);
