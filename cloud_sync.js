/* Optional Supabase cloud sync for Step 1 Arcade progress. */
(function(){
  const cfg = window.STEP1_SUPABASE_CONFIG || {};
  const configured = Boolean(cfg.url && cfg.anonKey && /^https:\/\/.+\.supabase\.co$/i.test(cfg.url));
  const isGame = typeof SAVE_KEY !== "undefined" && typeof save !== "undefined";
  const state = {
    client:null,
    user:null,
    progress:{},
    ready:false,
    busy:false,
    open:false,
    message:"",
    timer:null
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value || {})); }
    catch(e){ return {}; }
  }
  function stamp(obj){
    if (obj && typeof obj === "object") obj.cloudUpdatedAt = new Date().toISOString();
    return obj;
  }
  function maxMap(a,b){
    const out = Object.assign({}, a || {});
    Object.keys(b || {}).forEach(k=>{ out[k] = Math.max(Number(out[k] || 0), Number(b[k] || 0)); });
    return out;
  }
  function mergeStats(a,b){
    const out = clone(a);
    Object.keys(b || {}).forEach(k=>{
      const left = out[k] || {};
      const right = b[k] || {};
      out[k] = {
        attempts:Math.max(Number(left.attempts || 0), Number(right.attempts || 0)),
        correct:Math.max(Number(left.correct || 0), Number(right.correct || 0)),
        wrong:Math.max(Number(left.wrong || 0), Number(right.wrong || 0)),
        streak:Math.max(Number(left.streak || 0), Number(right.streak || 0)),
        last:newerDate(left.last,right.last)
      };
    });
    return out;
  }
  function newerDate(a,b){
    return Date.parse(a || 0) >= Date.parse(b || 0) ? (a || b || null) : (b || a || null);
  }
  function mergeObjectByFreshness(a,b){
    const out = clone(a);
    Object.keys(b || {}).forEach(k=>{
      const left = out[k];
      const right = b[k];
      if (left == null) out[k] = right;
      else if (right && typeof right === "object" && left && typeof left === "object") {
        out[k] = Date.parse(right.last || right.cloudUpdatedAt || 0) > Date.parse(left.last || left.cloudUpdatedAt || 0) ? right : left;
      } else {
        out[k] = Math.max(Number(left || 0), Number(right || 0));
      }
    });
    return out;
  }
  function mergeSave(local, remote){
    const l = clone(local);
    const r = clone(remote);
    const out = Object.assign({}, r, l);
    out.best = maxMap(r.best,l.best);
    out.endlessBest = Math.max(Number(r.endlessBest || 0), Number(l.endlessBest || 0));
    out.played = Math.max(Number(r.played || 0), Number(l.played || 0));
    out.stats = mergeStats(r.stats,l.stats);
    out.cards = mergeObjectByFreshness(r.cards,l.cards);
    out.missed = mergeObjectByFreshness(r.missed,l.missed);
    out.cloudUpdatedAt = newerDate(l.cloudUpdatedAt,r.cloudUpdatedAt) || new Date().toISOString();
    return out;
  }
  function setMessage(msg){
    state.message = msg || "";
    renderCloudBar();
  }
  function syncLabel(){
    if (!configured) return "Local save";
    if (state.busy) return "Syncing";
    if (state.user) return "Synced";
    return "Sign in";
  }
  function userLabel(){
    return state.user && state.user.email ? state.user.email : "";
  }
  function renderCloudBar(){
    if (!configured) return;
    const host = document.getElementById("app") || document.querySelector(".wrap") || document.body;
    if (!host) return;
    let bar = document.getElementById("step1CloudBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "step1CloudBar";
      host.insertBefore(bar, host.firstChild);
    }
    bar.className = `cloud-sync ${state.open ? "open" : ""}`;
    const signedIn = Boolean(state.user);
    bar.innerHTML = `
      <div class="cloud-line">
        <button type="button" class="cloud-chip" onclick="Step1CloudAuth.toggle()">
          <span class="cloud-dot ${signedIn ? "on" : ""}"></span>${syncLabel()}
        </button>
        <span class="cloud-user">${signedIn ? userLabel() : "Local progress stays on this device"}</span>
      </div>
      <div class="cloud-drawer" ${state.open ? "" : "hidden"}>
        ${signedIn ? signedInMarkup() : signedOutMarkup()}
        ${state.message ? `<div class="cloud-msg">${state.message}</div>` : ""}
      </div>`;
  }
  function signedOutMarkup(){
    return `<form class="cloud-form" onsubmit="Step1CloudAuth.submit(event,'signin')">
      <input name="email" type="email" autocomplete="email" placeholder="Email" required>
      <input name="password" type="password" autocomplete="current-password" placeholder="Password" minlength="6" required>
      <div class="cloud-actions">
        <button type="submit">Sign in</button>
        <button type="button" onclick="Step1CloudAuth.submit(event,'signup')">Create account</button>
      </div>
    </form>`;
  }
  function signedInMarkup(){
    return `<div class="cloud-actions signed">
      <button type="button" onclick="Step1CloudAuth.syncNow()">Sync now</button>
      <button type="button" onclick="Step1CloudAuth.signOut()">Sign out</button>
    </div>`;
  }
  function installStyles(){
    if (document.getElementById("step1CloudStyles")) return;
    const style = document.createElement("style");
    style.id = "step1CloudStyles";
    style.textContent = `
.cloud-sync{position:relative;z-index:5;margin:0 0 14px;padding:10px 12px;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:12px;background:rgba(255,255,255,.045);backdrop-filter:blur(10px);font-family:inherit}
.cloud-line{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
.cloud-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:999px;background:rgba(0,0,0,.18);color:var(--text,#fff);padding:7px 11px;font:inherit;font-size:12px;cursor:pointer}
.cloud-dot{width:8px;height:8px;border-radius:50%;background:var(--dim,#7c8aa0);box-shadow:0 0 0 3px rgba(255,255,255,.04)}
.cloud-dot.on{background:var(--green,#34d399);box-shadow:0 0 14px rgba(52,211,153,.65)}
.cloud-user{font-size:12px;color:var(--dim,#94a3b8)}
.cloud-drawer{margin-top:10px;border-top:1px solid var(--line,rgba(255,255,255,.14));padding-top:10px}
.cloud-form{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:8px;align-items:center}
.cloud-form input{min-width:0;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:9px;background:rgba(0,0,0,.24);color:var(--text,#fff);padding:10px 11px;font:inherit;font-size:13px}
.cloud-actions{display:flex;gap:8px;flex-wrap:wrap}
.cloud-actions button{border:1px solid var(--line,rgba(255,255,255,.14));border-radius:9px;background:var(--panel-hi,rgba(255,255,255,.08));color:var(--text,#fff);padding:10px 12px;font:inherit;font-size:12px;cursor:pointer}
.cloud-actions button:hover,.cloud-chip:hover{border-color:var(--amber-hi,#fbbf24)}
.cloud-actions.signed{justify-content:flex-end}
.cloud-msg{font-size:12px;color:var(--amber-hi,#fbbf24);margin-top:9px}
@media (max-width:700px){.cloud-form{grid-template-columns:1fr}.cloud-actions button{flex:1}.cloud-line{align-items:flex-start}.cloud-user{width:100%}}
`;
    document.head.appendChild(style);
  }
  function wrapMenu(){
    if (typeof menu !== "function" || window.__STEP1_CLOUD_MENU_WRAPPED__) return;
    const originalMenu = menu;
    window.menu = function(){
      const result = originalMenu.apply(this, arguments);
      renderCloudBar();
      return result;
    };
    try { menu = window.menu; } catch(e){}
    window.__STEP1_CLOUD_MENU_WRAPPED__ = true;
  }
  function wrapPersist(){
    if (!isGame || typeof persist !== "function" || window.__STEP1_CLOUD_PERSIST_WRAPPED__) return;
    const originalPersist = persist;
    window.persist = function(){
      stamp(window.save || save);
      const result = originalPersist.apply(this, arguments);
      queueSave();
      return result;
    };
    try { persist = window.persist; } catch(e){}
    window.__STEP1_CLOUD_PERSIST_WRAPPED__ = true;
  }
  function currentSave(){
    return clone(window.save || save || {});
  }
  function applyCurrentSave(next){
    if (!isGame) return;
    window.save = next;
    try { save = next; } catch(e){}
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch(e){}
  }
  function queueSave(){
    if (!configured || !state.user || !state.ready || !isGame) return;
    clearTimeout(state.timer);
    state.progress[SAVE_KEY] = stamp(currentSave());
    state.timer = setTimeout(pushProgress, 900);
  }
  async function pullProgress(){
    if (!state.client || !state.user) return;
    state.busy = true;
    renderCloudBar();
    const { data, error } = await state.client
      .from("step1_progress")
      .select("progress")
      .eq("user_id", state.user.id)
      .maybeSingle();
    if (error) throw error;
    state.progress = data && data.progress ? data.progress : {};
    if (isGame) {
      const merged = mergeSave(currentSave(), state.progress[SAVE_KEY]);
      state.progress[SAVE_KEY] = stamp(merged);
      applyCurrentSave(merged);
      await pushProgress();
      if (!window.session && typeof menu === "function") menu();
    }
    state.ready = true;
    state.busy = false;
    setMessage("Progress synced.");
  }
  async function pushProgress(){
    if (!state.client || !state.user) return;
    state.busy = true;
    renderCloudBar();
    if (isGame) state.progress[SAVE_KEY] = stamp(currentSave());
    const { error } = await state.client
      .from("step1_progress")
      .upsert({
        user_id:state.user.id,
        progress:state.progress,
        updated_at:new Date().toISOString()
      }, { onConflict:"user_id" });
    state.busy = false;
    if (error) throw error;
    setMessage("Saved to cloud.");
  }
  async function initCloud(){
    if (!configured) return;
    installStyles();
    wrapMenu();
    wrapPersist();
    renderCloudBar();
    try {
      const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      state.client = mod.createClient(cfg.url, cfg.anonKey, {
        auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
      });
      const { data } = await state.client.auth.getSession();
      state.user = data && data.session ? data.session.user : null;
      state.client.auth.onAuthStateChange(async (_event, session)=>{
        state.user = session ? session.user : null;
        if (state.user) {
          try { await pullProgress(); }
          catch(error){ state.busy = false; setMessage(error.message || "Sync failed."); }
        } else {
          state.ready = false;
          state.progress = {};
          setMessage("");
        }
      });
      if (state.user) await pullProgress();
      else renderCloudBar();
    } catch(error) {
      state.busy = false;
      setMessage(error.message || "Cloud sync unavailable.");
    }
  }

  window.Step1CloudAuth = {
    toggle(){
      state.open = !state.open;
      renderCloudBar();
    },
    async submit(event, mode){
      if (event && event.preventDefault) event.preventDefault();
      if (!state.client) return setMessage("Cloud sync is not configured.");
      const form = event && event.target && event.target.closest ? event.target.closest("form") : document.querySelector("#step1CloudBar form");
      const email = form && form.email ? form.email.value.trim() : "";
      const password = form && form.password ? form.password.value : "";
      if (!email || !password) return;
      state.busy = true;
      renderCloudBar();
      try {
        const result = mode === "signup"
          ? await state.client.auth.signUp({ email, password })
          : await state.client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (result.data && result.data.session) {
          state.user = result.data.user;
          state.open = false;
          await pullProgress();
        } else {
          state.busy = false;
          state.open = false;
          setMessage("Check your email to confirm the account.");
        }
      } catch(error) {
        state.busy = false;
        setMessage(error.message || "Sign in failed.");
      }
    },
    async syncNow(){
      try { await pullProgress(); }
      catch(error){ state.busy = false; setMessage(error.message || "Sync failed."); }
    },
    async signOut(){
      if (!state.client) return;
      await state.client.auth.signOut();
      state.user = null;
      state.ready = false;
      state.progress = {};
      state.open = false;
      setMessage("");
    }
  };

  installStyles();
  wrapMenu();
  wrapPersist();
  initCloud();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderCloudBar);
  else renderCloudBar();
})();
