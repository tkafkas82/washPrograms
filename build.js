/* Builds index.html (the installable PWA) from app.html (the artifact source).
   app.html is content-only — no <html>/<head> — so everything PWA-specific
   lives here and never leaks into the published artifact.
   Run: node build.js */

const fs = require("fs");
const path = require("path");

const dir = __dirname;
const src = fs.readFileSync(path.join(dir, "app.html"), "utf8");

const lines = src.split("\n");
const cut = lines.findIndex(l => l.trim() === "</style>");
if (cut < 0) throw new Error("app.html: no </style> line to split on");

const head = lines.slice(0, cut + 1).join("\n"); // title, fonts, styles
const body = lines.slice(cut + 1).join("\n");    // sprite, markup, script

const out = `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Διάλεξε τι πλένεις και δες ποιο πρόγραμμα, θερμοκρασία και στροφές να βάλεις στο πλυντήριο.">
<meta name="theme-color" content="#EFF1F0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1215" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Πλύση">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="icons/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>html{color-scheme:light dark}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${head}
<style>
  /* install chip — only shown when the browser offers installation */
  #install{
    position:fixed;
    left:50%;
    bottom:calc(16px + env(safe-area-inset-bottom));
    transform:translateX(-50%);
    display:none;
    align-items:center;
    gap:8px;
    font:inherit;
    font-size:14px;
    font-weight:500;
    color:var(--surface);
    background:var(--ink);
    border:0;
    border-radius:24px;
    padding:11px 18px;
    box-shadow:0 6px 24px -8px rgba(0,0,0,.45);
    cursor:pointer;
    z-index:20;
  }
  #install.show{display:inline-flex}
  #install:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
  #install svg{width:16px;height:16px}
</style>
</head>
<body>
${body}
<button id="install" type="button">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>
  </svg>
  Εγκατάσταση στην αρχική
</button>
<script>
/* PWA plumbing. Needs an http(s) origin — from file:// the app still works,
   it just is not installable and has no offline cache. */
(function () {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  var chip = document.getElementById("install");
  var prompt = null;

  addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    prompt = e;
    chip.classList.add("show");
  });

  chip.addEventListener("click", function () {
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice.finally(function () {
      prompt = null;
      chip.classList.remove("show");
    });
  });

  addEventListener("appinstalled", function () {
    prompt = null;
    chip.classList.remove("show");
  });
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(dir, "index.html"), out);
console.log("index.html written (" + out.length + " bytes)");
