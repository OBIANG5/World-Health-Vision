/**
 * Private CI smoke — mounts the actual edit UI, not a mocked imitation.
 * Uses only synthetic local fixtures; never routes to a public page.
 */
import React from "react";
import {createRoot} from "react-dom/client";
import CinematicProductionBoard from "./CinematicProductionBoard";
const root=document.getElementById("root");
if(!root)throw Error("Missing Studio smoke root");
createRoot(root).render(<CinematicProductionBoard/>);
