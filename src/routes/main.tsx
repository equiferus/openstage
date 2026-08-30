import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/lib/ui/styles.css"
import { Routes } from "@/routes/routes"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Routes />
  </StrictMode>,
)
