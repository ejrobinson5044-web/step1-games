const CACHE_NAME = "step1-arcade-v4";
const CORE_ASSETS = [
  "./",
  "index.html",
  "review_hub.html",
  "author.html",
  "games_manifest.js",
  "arcade_upgrade.js",
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
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});
