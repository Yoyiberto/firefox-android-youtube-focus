document.addEventListener("DOMContentLoaded", () => {
  const chkShorts = document.getElementById("chk-shorts");
  const chkHome = document.getElementById("chk-home");
  const chkWatch = document.getElementById("chk-watch");
  const chkMedia = document.getElementById("chk-media");

  // Cargar estado guardado
  browser.storage.local
    .get({
      hideShorts: true,
      eradicateHome: true,
      hideWatchRecs: true,
      enhanceMediaSession: true,
    })
    .then((settings) => {
      chkShorts.checked = settings.hideShorts;
      chkHome.checked = settings.eradicateHome;
      chkWatch.checked = settings.hideWatchRecs;
      chkMedia.checked = settings.enhanceMediaSession;
    });

  // Guardar al cambiar cualquier opción
  chkShorts.addEventListener("change", () => {
    browser.storage.local.set({ hideShorts: chkShorts.checked });
  });

  chkHome.addEventListener("change", () => {
    browser.storage.local.set({ eradicateHome: chkHome.checked });
  });

  chkWatch.addEventListener("change", () => {
    browser.storage.local.set({ hideWatchRecs: chkWatch.checked });
  });

  chkMedia.addEventListener("change", () => {
    browser.storage.local.set({ enhanceMediaSession: chkMedia.checked });
  });
});
