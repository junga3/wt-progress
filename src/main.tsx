import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

const STYLE_MODE_STORAGE_KEY = "wt-progress-style-mode"
const redirectTarget = new URLSearchParams(window.location.search).get("p")

if (redirectTarget) {
  const basePath = import.meta.env.BASE_URL
  const nextPath = redirectTarget.startsWith("/")
    ? redirectTarget.slice(1)
    : redirectTarget

  window.history.replaceState(null, "", `${basePath}${nextPath}`)
}

const initialStyleMode =
  window.localStorage.getItem(STYLE_MODE_STORAGE_KEY) === "original"
    ? "original"
    : "rebuilt"

document.documentElement.dataset.styleMode = initialStyleMode
document.documentElement.style.colorScheme = initialStyleMode === "original" ? "light" : "dark"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
