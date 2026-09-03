/* Service worker: the app is fully static, so it is offline-first.
   Bump CACHE whenever the shell changes — the old cache is dropped on activate. */

const CACHE = "washprograms-v2";

/* The app must not load offline without these: */
const CORE = [
  "./",
  "index.html",
  "manifest.webmanifest"
];

/* Nice to have offline, but a failure here must not block the install: */
const EXTRA = [
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

/* fetch + put rather than cache.add: put overwrites, so installing over a warm
   cache cannot fail with "Entry already exists". */
async function precache(cache, url) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(response.status + " " + url);
  await cache.put(url, response);
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map(url => precache(cache, url)));
    await Promise.all(EXTRA.map(url => precache(cache, url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Serve from cache, then refresh the entry in the background. Fonts are
   cross-origin and come back opaque, which the Cache API stores fine. */
function staleWhileRevalidate(request) {
  return caches.open(CACHE).then(cache =>
    cache.match(request).then(hit => {
      const fresh = fetch(request)
        .then(response => {
          if (response && (response.ok || response.type === "opaque")) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => hit);
      return hit || fresh;
    })
  );
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = FONT_HOSTS.includes(url.hostname);
  if (!sameOrigin && !isFont) return;

  if (request.mode === "navigate") {
    event.respondWith(
      staleWhileRevalidate(request).catch(() => caches.match("index.html"))
    );
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
