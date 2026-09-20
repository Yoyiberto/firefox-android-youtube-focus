// ==========================================================
// YouTube Focus & Controls - Content Script (Firefox Android)
// ==========================================================

(function () {
  "use strict";

  let settings = {
    hideShorts: true,
    eradicateHome: true,
    hideWatchRecs: true,
    enhanceMediaSession: true,
  };

  // 1. Inyectar script de contexto de página para MediaSession
  function injectPageScript() {
    if (document.getElementById("yt-mediasession-script")) return;
    try {
      const script = document.createElement("script");
      script.id = "yt-mediasession-script";
      script.src = browser.runtime.getURL("inject.js");
      (document.head || document.documentElement).appendChild(script);
    } catch (err) {
      console.warn("[Focus&Controls] No se pudo inyectar inject.js:", err);
    }
  }

  // 2. Redirección de Shorts a /watch?v=
  function checkAndRedirectShorts() {
    if (!settings.hideShorts) return false;
    const path = window.location.pathname;
    if (path.startsWith("/shorts/")) {
      const parts = path.split("/shorts/")[1];
      if (parts) {
        const videoId = parts.split("/")[0].split("?")[0];
        if (videoId) {
          const search = window.location.search ? window.location.search.replace("?", "&") : "";
          const newUrl = window.location.origin + "/watch?v=" + videoId + search;
          console.log("[Focus&Controls] Redirigiendo Short a reproductor estándar:", newUrl);
          window.location.replace(newUrl);
          return true;
        }
      }
    }
    return false;
  }

  // 3. Actualizar clases CSS y vista según la URL actual
  function updatePageClasses() {
    const path = window.location.pathname;
    const isHome = path === "/" || path === "";
    const isWatch = path.startsWith("/watch");

    if (document.body) {
      document.body.classList.toggle("is-home-page", isHome);
      document.body.classList.toggle("is-watch-page", isWatch);
    }

    // Gestionar tarjeta de Feed Eradicator en Home
    manageHomeFocusCard(isHome);
  }

  function manageHomeFocusCard(isHome) {
    const existing = document.getElementById("yt-focus-mode-card");
    if (!isHome || !settings.eradicateHome) {
      if (existing) existing.remove();
      return;
    }

    if (!existing) {
      const card = document.createElement("div");
      card.id = "yt-focus-mode-card";
      card.innerHTML = `
        <div class="focus-icon">🧘‍♂️</div>
        <h2>Modo Enfoque Activo</h2>
        <p>Tu feed de recomendaciones está oculto para evitar distracciones.</p>
        <p class="focus-tip">Usa la lupa 🔍 arriba para buscar lo que realmente deseas ver.</p>
      `;

      // Insertar después de la barra de navegación superior o en el contenedor principal
      const container =
        document.querySelector("ytm-browse[page-subtype='home'], #app, ytm-app, body") || document.body;
      if (container) {
        container.insertBefore(card, container.firstChild);
      }
    }
  }

  // 4. Aplicar configuraciones a <html>
  function applySettings() {
    const docEl = document.documentElement;
    docEl.classList.toggle("hide-shorts", !!settings.hideShorts);
    docEl.classList.toggle("eradicate-home", !!settings.eradicateHome);
    docEl.classList.toggle("hide-watch-recs", !!settings.hideWatchRecs);

    if (settings.enhanceMediaSession) {
      injectPageScript();
    }

    updatePageClasses();
    cleanShortsDirectDOM();
  }

  // 5. Limpieza directa adicional del DOM para Shorts (fallback agresivo)
  function cleanShortsDirectDOM() {
    if (!settings.hideShorts) return;

    // Ocultar pestaña Shorts de la barra inferior
    const pivotTabs = document.querySelectorAll(
      "ytm-pivot-bar-item-renderer, .pivot-bar-item-tab, [role='tab']"
    );
    for (let i = 0; i < pivotTabs.length; i++) {
      const tab = pivotTabs[i];
      const text = (tab.textContent || "").trim().toLowerCase();
      const aria = (tab.getAttribute("aria-label") || "").toLowerCase();
      const href = (tab.querySelector("a")?.getAttribute("href") || "").toLowerCase();
      if (text === "shorts" || aria.includes("shorts") || href.startsWith("/shorts")) {
        tab.style.setProperty("display", "none", "important");
      }
    }

    // Ocultar estanterías de reels
    const shelves = document.querySelectorAll(
      "ytm-reel-shelf-renderer, ytd-reel-shelf-renderer, ytd-rich-shelf-renderer[is-shorts], ytm-shorts-lockup-view-model"
    );
    for (let i = 0; i < shelves.length; i++) {
      const parent = shelves[i].closest("ytm-rich-section-renderer, ytd-rich-section-renderer") || shelves[i];
      parent.style.setProperty("display", "none", "important");
    }
  }

  // 6. Cargar configuración desde storage
  browser.storage.local
    .get({
      hideShorts: true,
      eradicateHome: true,
      hideWatchRecs: true,
      enhanceMediaSession: true,
    })
    .then((stored) => {
      settings = stored;
      applySettings();
    });

  // Escuchar cambios de configuración desde el popup en tiempo real
  browser.storage.onChanged.addListener((changes) => {
    for (const [key, change] of Object.entries(changes)) {
      if (key in settings) {
        settings[key] = change.newValue;
      }
    }
    applySettings();
  });

  // 7. Intercepción de navegación SPA
  const originalPush = history.pushState;
  history.pushState = function () {
    originalPush.apply(this, arguments);
    if (!checkAndRedirectShorts()) {
      updatePageClasses();
      cleanShortsDirectDOM();
    }
  };

  const originalReplace = history.replaceState;
  history.replaceState = function () {
    originalReplace.apply(this, arguments);
    if (!checkAndRedirectShorts()) {
      updatePageClasses();
      cleanShortsDirectDOM();
    }
  };

  window.addEventListener("popstate", () => {
    if (!checkAndRedirectShorts()) {
      updatePageClasses();
      cleanShortsDirectDOM();
    }
  });

  window.addEventListener("yt-navigate-finish", () => {
    if (!checkAndRedirectShorts()) {
      updatePageClasses();
      cleanShortsDirectDOM();
    }
  });

  // Observador de mutaciones del DOM
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      cleanShortsDirectDOM();
      updatePageClasses();
      debounceTimer = null;
    }, 100);
  });

  function init() {
    if (checkAndRedirectShorts()) return;
    applySettings();

    if (document.body) {
      updatePageClasses();
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        updatePageClasses();
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  init();
})();
