// This file is compiled inside Decidim core pack. Code can be added here and will be executed
// as part of that pack

// Load images
require.context("../../images", true)
import * as ActiveStorage from "@rails/activestorage"
import Rails from "@rails/ujs"

Rails.start()
ActiveStorage.start()

document.addEventListener("DOMContentLoaded", () => {
  const tokenElement = document.querySelector('meta[name="csrf-token"]')
  if (!tokenElement) return

  const token = tokenElement.getAttribute("content")

  // Intercetta l'evento di Active Storage e aggiungi l'header
  addEventListener("direct-upload:initialize", event => {
    if (event && event.detail && event.detail.xhr) {
      event.detail.xhr.setRequestHeader("X-CSRF-Token", token)
    }
  })
})
