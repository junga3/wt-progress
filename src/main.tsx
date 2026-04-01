import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

const redirectTarget = new URLSearchParams(window.location.search).get("p")

if (redirectTarget) {
  const basePath = import.meta.env.BASE_URL
  const nextPath = redirectTarget.startsWith("/")
    ? redirectTarget.slice(1)
    : redirectTarget

  window.history.replaceState(null, "", `${basePath}${nextPath}`)
}

document.documentElement.dataset.styleMode = "original"
document.documentElement.style.colorScheme = "light"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
