// ==========================================================
// YouTube MediaSession & Controls Enhancer para Android
// Inyectado directamente en el contexto de página de YouTube
// ==========================================================

(function () {
  "use strict";

  if (window.__ytMediaSessionEnhanced) return;
  window.__ytMediaSessionEnhanced = true;

  console.log("[MediaSession] Inicializando puente para Samsung/Android Media Output...");

  function updatePosition(video) {
    if (!navigator.mediaSession || !("setPositionState" in navigator.mediaSession)) return;
    if (!video || isNaN(video.duration) || !isFinite(video.duration) || video.duration <= 0) return;

    try {
      const position = Math.max(0, Math.min(video.currentTime, video.duration));
      const playbackRate = video.playbackRate && isFinite(video.playbackRate) ? video.playbackRate : 1.0;

      navigator.mediaSession.setPositionState({
        duration: video.duration,
        playbackRate: playbackRate,
        position: position,
      });
    } catch (err) {
      // Ignorar errores transitorios si el video aún se está inicializando
    }
  }

  function updateMetadata(video) {
    if (!navigator.mediaSession) return;

    try {
      let title = "";
      const titleElem = document.querySelector(
        "h1.title, .slim-video-metadata-title, .video-details-title, ytm-video-metadata-renderer h1"
      );
      if (titleElem && titleElem.textContent.trim()) {
        title = titleElem.textContent.trim();
      } else {
        title = (document.title || "YouTube Video").replace(/\s*-\s*YouTube\s*$/i, "").trim();
      }

      let channel = "YouTube";
      const channelElem = document.querySelector(
        ".slim-owner-channel-name, ytm-owner-renderer, ytm-channel-thumbnail-with-link-renderer + div, .channel-name"
      );
      if (channelElem && channelElem.textContent.trim()) {
        channel = channelElem.textContent.trim();
      }

      let videoId = "";
      const urlParams = new URLSearchParams(window.location.search);
      videoId = urlParams.get("v") || "";

      const artworks = [];
      if (videoId) {
        artworks.push(
          { src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" },
          { src: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, sizes: "1280x720", type: "image/jpeg" }
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || "Video de YouTube",
        artist: channel || "YouTube",
        album: "YouTube",
        artwork: artworks,
      });
    } catch (err) {
      console.warn("[MediaSession] Error actualizando metadatos:", err);
    }
  }

  function setupActionHandlers() {
    if (!navigator.mediaSession) return;

    const handlers = {
      play: () => {
        const v = document.querySelector("video");
        if (v && v.paused) v.play();
      },
      pause: () => {
        const v = document.querySelector("video");
        if (v && !v.paused) v.pause();
      },
      seekbackward: (details) => {
        const v = document.querySelector("video");
        if (!v) return;
        const skip = (details && details.seekOffset) || 10;
        v.currentTime = Math.max(0, v.currentTime - skip);
        updatePosition(v);
      },
      seekforward: (details) => {
        const v = document.querySelector("video");
        if (!v) return;
        const skip = (details && details.seekOffset) || 10;
        v.currentTime = Math.min(v.duration || v.currentTime + skip, v.currentTime + skip);
        updatePosition(v);
      },
      seekto: (details) => {
        const v = document.querySelector("video");
        if (!v || !details || details.seekTime == null) return;
        v.currentTime = Math.max(0, Math.min(details.seekTime, v.duration || details.seekTime));
        updatePosition(v);
      },
      previoustrack: () => {
        const v = document.querySelector("video");
        if (v && v.currentTime > 3) {
          v.currentTime = 0;
          updatePosition(v);
        } else {
          window.history.back();
        }
      },
      nexttrack: () => {
        // Buscar botón de siguiente video en el reproductor de YouTube móvil
        const nextBtn = document.querySelector(
          ".ytp-next-button, ytm-next-button, button[aria-label*='Siguiente' i], button[aria-label*='Next' i], [aria-label*='Next video' i]"
        );
        if (nextBtn) {
          nextBtn.click();
        } else {
          // Si no hay botón explícito, saltar al primer video relacionado o lista
          const nextCard = document.querySelector("ytm-video-with-context-renderer a, ytm-compact-video-renderer a");
          if (nextCard) nextCard.click();
        }
      },
      stop: () => {
        const v = document.querySelector("video");
        if (v) {
          v.pause();
          v.currentTime = 0;
          updatePosition(v);
        }
      },
    };

    for (const [action, handler] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        // Algunas acciones pueden no estar soportadas por todas las versiones del navegador
      }
    }
  }

  // Escuchar eventos globales de <video> usando captura de eventos (capture: true)
  let lastUpdate = 0;
  document.addEventListener(
    "timeupdate",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") {
        const now = Date.now();
        // Limitar actualización de posición cada 500ms para eficiencia
        if (now - lastUpdate > 500) {
          lastUpdate = now;
          updatePosition(e.target);
        }
      }
    },
    true
  );

  document.addEventListener(
    "play",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") {
        setupActionHandlers();
        updateMetadata(e.target);
        updatePosition(e.target);
      }
    },
    true
  );

  document.addEventListener(
    "pause",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") {
        updatePosition(e.target);
      }
    },
    true
  );

  document.addEventListener(
    "seeked",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") {
        updatePosition(e.target);
      }
    },
    true
  );

  document.addEventListener(
    "durationchange",
    (e) => {
      if (e.target && e.target.tagName === "VIDEO") {
        updatePosition(e.target);
      }
    },
    true
  );

  // Inicializar handlers al cargar
  setupActionHandlers();
})();
