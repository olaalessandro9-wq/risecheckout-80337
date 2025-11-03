import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BusyProvider } from "@/ui/BusyProvider";
import { ToastProvider } from "@/ui/toast";
console.log("[BUILD] v2.7 carregado");
const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

createRoot(container).render(
  <React.StrictMode>
    <ToastProvider>
      <BusyProvider>
        <App />
      </BusyProvider>
    </ToastProvider>
  </React.StrictMode>
);
