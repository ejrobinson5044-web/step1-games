const CACHE_NAME = "step1-arcade-v11";
const CORE_ASSETS = [
  "./",
  "auth_debug.html",
  "auth_repair.html",
  "index.html",
  "review_hub.html",
  "author.html",
  "games_manifest.js",
  "arcade_upgrade.js",
  "arcade_home.js",
  "cloud_sync.js",
  "review_hub.js",
  "author.js",
  "supabase_config.js",
  "manifest.webmanifest",
  "icon.svg",
  "anatomy_atlas.html",
  "breath_of_death.html",
  "cardio_quest.html",
  "cellular_chaos.html",
  "cytokine_city.html",
  "dissection_dojo.html",
  "gut_check.html",
  "heme_hustle.html",
  "hormone_hunter.html",
  "inheritance_island.html",
  "localize_it.html",
  "microbe_mayhem.html",
  "name_that_risk.html",
  "nephron_ninja.html",
  "pathway_panic.html",
  "pharm_arsenal.html",
  "psych_ward.html",
  "pvalue_panic.html",
  "suffix_showdown.html",
  "the_right_call.html"
];

function offlineFallback(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match("index.html");
    return new Response("", {status:504, statusText:"Offline"});
  });
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  const networkFirst = request.mode === "navigate" || /\.(?:html|js|css|json|webmanifest)$/i.test(url.pathname);
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });

      if (networkFirst) return network.catch(()=>offlineFallback(request));

      return caches.match(request).then(cached => cached || network.catch(()=>offlineFallback(request)));
    })
  );
});
