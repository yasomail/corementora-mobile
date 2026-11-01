// Service worker : l'appli s'ouvre et lit les reçus même sans réseau, après une première visite.
// Modèle complété au build par vite.mobile.config.ts (version et liste des fichiers).
// - À l'installation : l'appli entière et le moteur de lecture sont mis en cache.
// - Pages : réseau d'abord (mise à jour), cache si hors ligne. Autres fichiers : cache d'abord.
const VERSION = 'f70ad8c885';
const APP = `corementora-recus-app-${VERSION}`;
const OCR = 'corementora-recus-ocr-tesseract-6.0.1';
const BASE = new URL('./', self.location).href;
const FICHIERS = ["manifest.webmanifest","icones/icone-192.png","icones/icone-512.png","icones/icone-masquable-512.png","icones/apple-touch-icon.png","assets/index-C6Dcpw1B.js","assets/index-CMrACSHr.css","assets/public-sans-latin-400-normal-8Rpg0ruU.woff2","assets/public-sans-latin-400-normal-SBbinRkI.woff","assets/public-sans-latin-600-normal-BR59oU-I.woff","assets/public-sans-latin-600-normal-Fru-LXNs.woff2","assets/public-sans-latin-700-normal-BqJmxWdE.woff2","assets/public-sans-latin-700-normal-Dm-oTPSL.woff","assets/public-sans-latin-ext-400-normal-B02wwOdZ.woff","assets/public-sans-latin-ext-400-normal-mk90oQqJ.woff2","assets/public-sans-latin-ext-600-normal-DchWdWJ_.woff2","assets/public-sans-latin-ext-600-normal-DfkbVac2.woff","assets/public-sans-latin-ext-700-normal-CgolUQuG.woff2","assets/public-sans-latin-ext-700-normal-jWHjnMgZ.woff","assets/public-sans-vietnamese-400-normal-BO1meqcx.woff","assets/public-sans-vietnamese-400-normal-TxZB8OSn.woff2","assets/public-sans-vietnamese-600-normal-CcnAzmUX.woff","assets/public-sans-vietnamese-600-normal-P4BtCUdw.woff2","assets/public-sans-vietnamese-700-normal-D97ShjGS.woff2","assets/public-sans-vietnamese-700-normal-Dq5VrXjD.woff"];
const MOTEUR = ['ocr/worker.min.js', 'ocr/tesseract-core-lstm.wasm.js', 'ocr/tesseract-core-simd-lstm.wasm.js', 'ocr/fra.traineddata.gz', 'ocr/eng.traineddata.gz'];

self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([
    caches.open(APP).then((c) => c.addAll(['./', ...FICHIERS])),
    caches.open(OCR).then(async (c) => {
      for (const f of MOTEUR) if (!(await c.match(f))) await c.add(f);
    }),
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== APP && k !== OCR).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copie = res.clone(); caches.open(APP).then((c) => c.put('./', copie)); return res; })
        .catch(() => caches.match('./', { ignoreSearch: true, ignoreVary: true })),
    );
    return;
  }
  const cache = req.url.startsWith(`${BASE}ocr/`) ? OCR : APP;
  e.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((trouve) => trouve || fetch(req).then((res) => {
      if (res.ok) { const copie = res.clone(); caches.open(cache).then((c) => c.put(req, copie)); }
      return res;
    })),
  );
});
