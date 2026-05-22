import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPwaUpdater } from "./lib/pwaUpdater";

initPwaUpdater();

createRoot(document.getElementById("root")!).render(<App />);
