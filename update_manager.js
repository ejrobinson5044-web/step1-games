/* Push 006 — Smart Updates for Step 1 Arcade. */
(function(){
  const VERSION_URL = "app_version.js";
  const CHECK_KEY = "step1_last_update_check_v1";
  const DISMISS_KEY = "step1_update_dismissed_v1";
  const CHECK_INTERVAL_MS = 1000 * 60 * 15;

  function currentVersion(){
    return window.STEP1_APP_VERSION || {push:0,label:"Unknown",slug:"unknown",name:"Local Build",notes:[]};
  }
  function versionLabel(v){
    if (!v) return "Unknown";
    return v.name ? `${v.label} · ${v.name}` : v.label;
  }
  function parseVersionScript(text){
    const match = text.match(/window\.STEP1_APP_VERSION\s*=\s*({[\s\S]*?});/);
    if (!match) throw new Error("Version payload not found");
    return Function(`"use strict"; return (${match[1]});`)();
  }
  async function fetchLatestVersion(){
    const stamp = Date.now();
    const res = await fetch(`${VERSION_URL}?check=${stamp}`, {cache:"no-store"});
    if (!res.ok) throw new Error(`Version check failed: ${res.status}`);
    return parseVersionScript(await res.text());
  }
  function shouldAutoCheck(){
    const last = Number(localStorage.getItem(CHECK_KEY) || 0);
    return Date.now() - last > CHECK_INTERVAL_MS;
  }
  function markChecked(){
    try { localStorage.setItem(CHECK_KEY, String(Date.now())); } catch(error){}
  }
  function dismissedSlug(){
    try { return localStorage.getItem(DISMISS_KEY) || ""; } catch(error){ return ""; }
  }
  function dismiss(slug){
    try { localStorage.setItem(DISMISS_KEY, slug || ""); } catch(error){}
  }
  function latestIsNewer(latest){
    const current = currentVersion();
    return Number(latest && latest.push || 0) > Number(current.push || 0);
  }
  function installStyles(){
    if (document.getElementById("smartUpdateStyles")) return;
    const style = document.createElement("style");
    style.id = "smartUpdateStyles";
    style.textContent = `
.update-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:80;width:min(520px,calc(100vw - 24px));border:1px solid rgba(34,211,238,.34);border-radius:18px;background:rgba(8,8,12,.92);backdrop-filter:blur(14px);box-shadow:0 20px 60px rgba(0,0,0,.55),0 0 30px rgba(34,211,238,.12);color:#eef0f7;padding:15px;font-family:'Hanken Grotesk',system-ui,sans-serif}
.update-toast-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.update-toast-title{font-weight:900;font-size:16px}.update-toast-sub{font-size:12px;color:#8b8aa3;margin-top:3px;line-height:1.35}.update-toast ul{margin:10px 0 0 18px;color:#d9dcf0;font-size:13px;line-height:1.45}.update-toast-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.update-btn{border:0;border-radius:11px;padding:10px 12px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#22d3ee,#a78bfa);color:#08080c}.update-btn.secondary{background:transparent;color:#8b8aa3;border:1px solid rgba(255,255,255,.1)}.update-btn:hover{filter:brightness(1.05)}.update-status-pill{position:fixed;left:10px;bottom:10px;z-index:55;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(8,8,12,.76);backdrop-filter:blur(10px);color:#8b8aa3;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.7px;padding:5px 9px;display:inline-flex;gap:7px;align-items:center}.update-status-pill button{border:0;background:transparent;color:#22d3ee;font:inherit;cursor:pointer;padding:0}.update-status-pill button:hover{text-decoration:underline}.update-status-pill.is-new{border-color:rgba(251,191,36,.38);color:#fbbf24}
@media(max-width:560px){.update-toast{bottom:44px}.update-status-pill{bottom:38px;font-size:9px}}
`;
    document.head.appendChild(style);
  }
  function notesList(notes){
    const list = Array.isArray(notes) ? notes.slice(0,5) : [];
    return list.length ? `<ul>${list.map(n=>`<li>${escapeHTML(n)}</li>`).join("")}</ul>` : "";
  }
  function escapeHTML(v){
    return String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");
  }
  function showToast(latest){
    installStyles();
    document.querySelectorAll(".update-toast").forEach(n=>n.remove());
    const current = currentVersion();
    const toast = document.createElement("div");
    toast.className = "update-toast";
    toast.innerHTML = `
      <div class="update-toast-head">
        <div><div class="update-toast-title">Update available</div><div class="update-toast-sub">Current: ${escapeHTML(versionLabel(current))}<br>Latest: ${escapeHTML(versionLabel(latest))}</div></div>
        <button class="update-btn secondary" type="button" data-update-close>Later</button>
      </div>
      ${notesList(latest.notes)}
      <div class="update-toast-actions">
        <button class="update-btn" type="button" data-update-now>Update App</button>
        <button class="update-btn secondary" type="button" data-update-dismiss>Skip for now</button>
      </div>`;
    document.body.appendChild(toast);
    toast.querySelector("[data-update-now]").addEventListener("click",()=>updateNow(latest));
    toast.querySelector("[data-update-close]").addEventListener("click",()=>toast.remove());
    toast.querySelector("[data-update-dismiss]").addEventListener("click",()=>{dismiss(latest.slug);toast.remove();renderStatus("dismissed", latest);});
  }
  function renderStatus(status, latest){
    installStyles();
    const existing = document.querySelector(".update-status-pill");
    if (existing) existing.remove();
    const current = currentVersion();
    const pill = document.createElement("div");
    pill.className = "update-status-pill" + (status === "new" ? " is-new" : "");
    const label = status === "new" ? `${escapeHTML(latest.label)} available` : `${escapeHTML(current.label || "Build")} · up to date`;
    pill.innerHTML = `<span>${label}</span><button type="button">Check</button>`;
    pill.querySelector("button").addEventListener("click",()=>checkForUpdates({manual:true}));
    document.body.appendChild(pill);
  }
  async function clearBrowserCaches(){
    if (!window.caches || !caches.keys) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    } catch(error){}
  }
  async function updateNow(latest){
    dismiss("");
    await clearBrowserCaches();
    const url = new URL(window.location.href);
    url.searchParams.set("v", latest && latest.slug ? latest.slug : String(Date.now()));
    window.location.replace(url.toString());
  }
  async function checkForUpdates(opts){
    const manual = !!(opts && opts.manual);
    try {
      markChecked();
      const latest = await fetchLatestVersion();
      if (latestIsNewer(latest)) {
        renderStatus("new", latest);
        if (manual || dismissedSlug() !== latest.slug) showToast(latest);
      } else {
        renderStatus("current", latest);
        if (manual) showCurrentToast(latest);
      }
    } catch(error) {
      renderStatus("error");
      if (manual) showErrorToast(error);
    }
  }
  function showCurrentToast(latest){
    installStyles();
    document.querySelectorAll(".update-toast").forEach(n=>n.remove());
    const toast = document.createElement("div");
    toast.className = "update-toast";
    toast.innerHTML = `<div class="update-toast-head"><div><div class="update-toast-title">You are up to date</div><div class="update-toast-sub">Running ${escapeHTML(versionLabel(latest || currentVersion()))}</div></div><button class="update-btn secondary" type="button">Close</button></div>`;
    toast.querySelector("button").addEventListener("click",()=>toast.remove());
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),3000);
  }
  function showErrorToast(error){
    installStyles();
    document.querySelectorAll(".update-toast").forEach(n=>n.remove());
    const toast = document.createElement("div");
    toast.className = "update-toast";
    toast.innerHTML = `<div class="update-toast-head"><div><div class="update-toast-title">Update check failed</div><div class="update-toast-sub">${escapeHTML(error && error.message ? error.message : "Could not check for updates.")}</div></div><button class="update-btn secondary" type="button">Close</button></div>`;
    toast.querySelector("button").addEventListener("click",()=>toast.remove());
    document.body.appendChild(toast);
  }
  function boot(){
    installStyles();
    renderStatus("current");
    if (shouldAutoCheck()) checkForUpdates({manual:false});
  }
  window.Step1UpdateManager = {check:()=>checkForUpdates({manual:true}), updateNow};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
