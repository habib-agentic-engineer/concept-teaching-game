import React from "react";
import ReactDOM from "react-dom/client";
import { Game } from "@/components/Game";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <main className="w-full h-screen">
      <Game />
    </main>
  </React.StrictMode>
);
