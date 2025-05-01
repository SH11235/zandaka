import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BankProvider } from "./contexts/BankContext.tsx";

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <BankProvider>
            <App />
        </BankProvider>
    </StrictMode>,
);
