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
    recovery:false,
    message:"",
    timer:null,
    authTimer:null,
    authRun:0,
    emailDraft:"",
    syncTimer:null,
    syncing:false
  };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value || {})); }
    catch(e){ return {}; }
  }
  function escapeHTML(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      "\"":"&quot;",
      "'":"&#39;"
    }[ch]));
  }
  function escapeAttr(value){
    return escapeHTML(value);
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
  function mergeNestedCounts(a,b){
    const out = clone(a);
    Object.keys(b || {}).forEach(k=>{ out[k] = maxMap(out[k], b[k]); });
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
    out.missReasons = mergeNestedCounts(r.missReasons,l.missReasons);
    out.cloudUpdatedAt = newerDate(l.cloudUpdatedAt,r.cloudUpdatedAt) || new Date().toISOString();
    return out;
  }
  function setMessage(msg){
    state.message = msg || "";
    renderCloudBar();
  }
  function beginAuthAction(label, timeoutLabel){
    const run = ++state.authRun;
    clearTimeout(state.authTimer);
    state.busy = true;
    state.open = true;
    setMessage(label);
    state.authTimer = setTimeout(()=>{
      if (state.authRun !== run || !state.busy) return;
      state.busy = false;
      state.open = true;
      setMessage(timeoutLabel || "Still waiting for Supabase after 12 seconds. Open Debug login for the raw response, or use local-only mode and keep studying.");
    }, 12000);
    return run;
  }
  function clearAuthWatchdog(run){
    if (run && state.authRun !== run) return;
    clearTimeout(state.authTimer);
    state.authTimer = null;
  }
  function authRunActive(run){
    return state.authRun === run;
  }
  function explainAuthError(error, fallback){
    const msg = error && error.message ? error.message : (fallback || "Auth failed.");
    if (/confirm|verified|verification/i.test(msg)) {
      return "Supabase is still requiring email confirmation for this user. Turn Confirm email off, delete the old unconfirmed user in Supabase Auth > Users, run Fix sign-in, then create the account again.";
    }
    if (/invalid login credentials/i.test(msg)) {
      return "No matching confirmed account/password was found. If this is your first time, click Create account. If the user already exists but is unconfirmed, delete it in Supabase Auth > Users and create it again with Confirm email off.";
    }
    if (/user already registered|already registered|already exists/i.test(msg)) {
      return "That email already exists in Supabase. Try Sign in, or delete the old user in Supabase Auth > Users and create it again.";
    }
    return msg;
  }
  function withTimeout(promise, label, ms){
    let timer;
    const timeout = new Promise((_, reject)=>{
      timer = setTimeout(()=>reject(new Error(label || "Request timed out.")), ms || 15000);
    });
    return Promise.race([promise, timeout]).finally(()=>clearTimeout(timer));
  }
  function authCall(promise, label){
    return withTimeout(promise, label || "Auth request timed out. Refresh and try again.", 15000);
  }
  function authUrl(path, query){
    const url = new URL(`/auth/v1/${path}`, cfg.url);
    Object.keys(query || {}).forEach(key=>url.searchParams.set(key, query[key]));
    return url.href;
  }
  async function directAuth(path, body, query){
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 15000);
    try {
      const response = await fetch(authUrl(path, query), {
        method:"POST",
        headers:{
          apikey:cfg.anonKey,
          Authorization:`Bearer ${cfg.anonKey}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify(body),
        signal:controller.signal
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; }
      catch(error){ data = {message:text}; }
      if (!response.ok || data.error || data.error_description) {
        throw new Error(data.error_description || data.message || data.msg || data.error || `Supabase auth failed (${response.status}).`);
      }
      return data;
    } catch(error) {
      if (error && error.name === "AbortError") throw new Error("Supabase auth timed out. This is usually a network/auth-provider issue, not your password. Run Fix sign-in, refresh, and try again.");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  async function startSessionFromAuth(data){
    const session = data && (data.session || (data.access_token ? data : null));
    const user = data && (data.user || (session && session.user));
    if (!session || !session.access_token || !session.refresh_token) return {user, session:null};
    if (state.client) {
      const result = await authCall(
        state.client.auth.setSession({access_token:session.access_token, refresh_token:session.refresh_token}),
        "Signed in, but saving the session timed out. Run Fix sign-in and try again."
      );
      if (result && result.error) throw result.error;
    }
    return {user:user || session.user, session};
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
  function authRedirectUrl(){
    const url = new URL(location.href);
    url.hash = "";
    url.search = "";
    return url.href;
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
    const disabled = state.busy ? "disabled" : "";
    const email = escapeAttr(state.emailDraft || "");
    return `<form class="cloud-form" onsubmit="Step1CloudAuth.submit(event,'signin')">
      <input name="email" type="email" autocomplete="email" placeholder="Email" value="${email}" required ${disabled}>
      <input name="password" type="password" autocomplete="current-password" placeholder="Password" minlength="6" required ${disabled}>
      <div class="cloud-actions">
        <button type="submit" ${disabled}>Sign in</button>
        <button type="button" onclick="Step1CloudAuth.submit(event,'signup')" ${disabled}>Create account</button>
        <button type="button" onclick="Step1CloudAuth.forgotPassword(event)" ${disabled}>Reset password</button>
        <button type="button" onclick="Step1CloudAuth.openAuthDebug()">Debug login</button>
        <button type="button" onclick="Step1CloudAuth.repairSignIn()">Fix sign-in</button>
        <button type="button" onclick="Step1CloudAuth.useLocal()">Use local only</button>
      </div>
    </form>
    <div class="cloud-privacy">For now, keep Supabase email confirmation and custom SMTP off while testing. If login gets stuck, open Debug login.</div>`;
  }
  function signedInMarkup(){
    if (state.recovery) {
      return `<form class="cloud-form" onsubmit="Step1CloudAuth.updatePassword(event)">
        <input name="password" type="password" autocomplete="new-password" placeholder="New password" minlength="6" required>
        <div class="cloud-actions"><button type="submit">Update password</button></div>
      </form>`;
    }
    return `<div class="cloud-actions signed">
      <button type="button" onclick="Step1CloudAuth.syncNow()">Sync now</button>
      <button type="button" onclick="Step1CloudAuth.exportProgress()">Export</button>
      <button type="button" onclick="Step1CloudAuth.deleteCloudProgress()">Delete progress</button>
      <button type="button" class="danger" onclick="Step1CloudAuth.deleteAccount()">Delete account</button>
      <button type="button" onclick="Step1CloudAuth.signOut()">Sign out</button>
    </div>
    <div class="cloud-privacy">Signed in as ${escapeHTML(userLabel())}. Progress sync is private to this account.</div>`;
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
.cloud-actions button:disabled,.cloud-form input:disabled{opacity:.58;cursor:not-allowed}
.cloud-actions.signed{justify-content:flex-end}
.cloud-actions .danger{border-color:rgba(248,113,113,.4);color:var(--red,#f87171)}
.cloud-msg{font-size:12px;color:var(--amber-hi,#fbbf24);margin-top:9px}
.cloud-privacy{font-size:11px;color:var(--dim,#94a3b8);line-height:1.45;margin-top:9px}
@media (max-width:700px){.cloud-form{grid-template-columns:1fr}.cloud-actions button{flex:1}.cloud-line{align-items:flex-start}.cloud-user{width:100%}}
`;
    document.head.appendChild(style);
  }
  function installPwa(){
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "manifest.webmanifest";
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "#22d3ee";
      document.head.appendChild(meta);
    }
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("service_worker.js")
        .then(registration=>registration.update().catch(()=>{}))
        .catch(()=>{});
    }
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
    if (!configured || !state.user || !state.ready) return;
    clearTimeout(state.timer);
    if (isGame) state.progress[SAVE_KEY] = stamp(currentSave());
    state.timer = setTimeout(pushProgress, 900);
  }
  async function pullProgress(){
    if (!state.client || !state.user) return;
    state.busy = true;
    renderCloudBar();
    const { data, error } = await withTimeout(state.client
      .from("step1_progress")
      .select("progress")
      .eq("user_id", state.user.id)
      .maybeSingle(), "Progress sync timed out. Refresh and try again.", 15000);
    if (error) throw error;
    state.progress = data && data.progress ? data.progress : {};
    if (isGame) {
      const merged = mergeSave(currentSave(), state.progress[SAVE_KEY]);
      state.progress[SAVE_KEY] = stamp(merged);
      applyCurrentSave(merged);
      await pushProgress();
      if (!window.session && typeof menu === "function") menu();
    } else {
      const local = collectLocalProgress();
      Object.keys(local).forEach(key=>{
        state.progress[key] = stamp(mergeSave(local[key], state.progress[key]));
      });
      if (Object.keys(local).length) await pushProgress();
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
    const { error } = await withTimeout(state.client
      .from("step1_progress")
      .upsert({
        user_id:state.user.id,
        progress:state.progress,
        updated_at:new Date().toISOString()
      }, { onConflict:"user_id" }), "Progress save timed out. Refresh and try again.", 15000);
    state.busy = false;
    if (error) throw error;
    setMessage("Saved to cloud.");
  }
  function looksLikeProgress(value){
    return value && typeof value === "object" && (
      value.best || value.cards || value.missed || value.stats || value.played != null || value.endlessBest != null
    );
  }
  function collectLocalProgress(){
    const out = {};
    for (let i=0;i<localStorage.length;i++) {
      const key = localStorage.key(i);
      try {
        const value = JSON.parse(localStorage.getItem(key));
        if (looksLikeProgress(value)) out[key] = value;
      } catch(e){}
    }
    return out;
  }
  function clearLocalProgress(){
    Object.keys(collectLocalProgress()).forEach(key=>localStorage.removeItem(key));
  }
  function scheduleProgressSync(){
    clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(syncProgress, 0);
  }
  async function syncProgress(){
    if (!state.client || !state.user || state.syncing) return;
    state.syncing = true;
    try {
      await pullProgress();
    } catch(error) {
      state.busy = false;
      setMessage(error.message || "Sync failed.");
    } finally {
      state.syncing = false;
    }
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
      state.client.auth.onAuthStateChange((_event, session)=>{
        if (_event === "PASSWORD_RECOVERY") {
          state.recovery = true;
          state.open = true;
        }
        state.user = session ? session.user : null;
        if (state.user) {
          if (["INITIAL_SESSION","SIGNED_IN","USER_UPDATED","PASSWORD_RECOVERY"].includes(_event)) scheduleProgressSync();
          else renderCloudBar();
        } else {
          state.ready = false;
          state.progress = {};
          state.recovery = false;
          setMessage("");
        }
      });
      if (state.user) scheduleProgressSync();
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
      state.emailDraft = email;
      const run = beginAuthAction(
        mode === "signup" ? "Creating account..." : "Signing in...",
        mode === "signup"
          ? "Account creation is still waiting on Supabase. Open Debug login to see whether the browser is timing out, email confirmation is still on, or custom SMTP is blocking mail."
          : "Sign-in is still waiting on Supabase. Open Debug login to see the raw response, or use local-only mode and keep studying."
      );
      try {
        const authData = mode === "signup"
          ? await directAuth("signup", {email, password}, {redirect_to:authRedirectUrl()})
          : await directAuth("token", {email, password}, {grant_type:"password"});
        if (!authRunActive(run)) return;
        const sessionData = await startSessionFromAuth(authData);
        if (!authRunActive(run)) return;
        clearAuthWatchdog(run);
        if (sessionData.session) {
          state.user = sessionData.user;
          state.open = false;
          setMessage(mode === "signup" ? "Account created. Syncing progress..." : "Signed in. Syncing progress...");
          scheduleProgressSync();
        } else {
          state.busy = false;
          state.open = true;
          setMessage("Supabase did not return a signed-in session. Confirm email is probably still on, or this email is already an old unconfirmed user. Turn Confirm email off, delete the user in Supabase Auth > Users, run Fix sign-in, then Create account again.");
        }
      } catch(error) {
        if (!authRunActive(run)) return;
        clearAuthWatchdog(run);
        state.busy = false;
        state.open = true;
        setMessage(explainAuthError(error, mode === "signup" ? "Account creation failed." : "Sign in failed."));
      }
    },
    async forgotPassword(event){
      if (event && event.preventDefault) event.preventDefault();
      if (!state.client) return setMessage("Cloud sync is not configured.");
      const form = event && event.target && event.target.closest ? event.target.closest("form") : document.querySelector("#step1CloudBar form");
      const email = form && form.email ? form.email.value.trim() : "";
      if (!email) return setMessage("Enter your email first.");
      state.emailDraft = email;
      state.busy = true;
      renderCloudBar();
      try {
        const { error } = await authCall(state.client.auth.resetPasswordForEmail(email, { redirectTo:authRedirectUrl() }));
        state.busy = false;
        if (error) return setMessage(error.message || "Reset email failed.");
        setMessage("Password reset email sent.");
      } catch(error) {
        state.busy = false;
        setMessage(error.message || "Reset email failed.");
      }
    },
    async resendConfirmation(event){
      if (event && event.preventDefault) event.preventDefault();
      if (!state.client) return setMessage("Cloud sync is not configured.");
      const form = event && event.target && event.target.closest ? event.target.closest("form") : document.querySelector("#step1CloudBar form");
      const email = form && form.email ? form.email.value.trim() : "";
      if (!email) return setMessage("Enter your email first.");
      state.busy = true;
      renderCloudBar();
      try {
        const { error } = await authCall(state.client.auth.resend({
          type:"signup",
          email,
          options:{ emailRedirectTo:authRedirectUrl() }
        }));
        state.busy = false;
        if (error) return setMessage(error.message || "Confirmation email failed.");
        setMessage("Confirmation email sent.");
      } catch(error) {
        state.busy = false;
        setMessage(error.message || "Confirmation email failed.");
      }
    },
    async updatePassword(event){
      if (event && event.preventDefault) event.preventDefault();
      if (!state.client) return;
      const form = event.target.closest("form");
      const password = form && form.password ? form.password.value : "";
      if (!password) return;
      state.busy = true;
      renderCloudBar();
      try {
        const { error } = await authCall(state.client.auth.updateUser({ password }));
        state.busy = false;
        if (error) return setMessage(error.message || "Password update failed.");
        state.recovery = false;
        state.open = false;
        setMessage("Password updated.");
      } catch(error) {
        state.busy = false;
        setMessage(error.message || "Password update failed.");
      }
    },
    async syncNow(){
      await syncProgress();
    },
    progress(){
      return clone(state.progress || {});
    },
    saveProgress(key, value){
      if (!key) return;
      state.progress[key] = stamp(clone(value));
      queueSave();
    },
    exportProgress(){
      const payload = {
        exportedAt:new Date().toISOString(),
        signedInAs:userLabel() || null,
        cloud:state.progress || {},
        local:collectLocalProgress()
      };
      const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `step1-arcade-progress-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Progress export downloaded.");
    },
    async deleteCloudProgress(){
      if (!state.client || !state.user) return;
      if (!confirm("Delete cloud study progress for this account? Your login remains active.")) return;
      state.busy = true;
      renderCloudBar();
      const { error } = await state.client.from("step1_progress").delete().eq("user_id", state.user.id);
      state.busy = false;
      if (error) return setMessage(error.message || "Could not delete cloud progress.");
      state.progress = {};
      clearLocalProgress();
      setMessage("Study progress deleted.");
    },
    async deleteAccount(){
      if (!state.client || !state.user) return;
      if (!confirm("Delete this account and all Step 1 Arcade progress? This cannot be undone.")) return;
      state.busy = true;
      renderCloudBar();
      const { error } = await state.client.rpc("delete_current_user");
      state.busy = false;
      if (error) return setMessage("Account deletion needs the latest SQL setup. " + (error.message || ""));
      clearLocalProgress();
      state.user = null;
      state.progress = {};
      await state.client.auth.signOut();
      setMessage("Account deleted.");
      setTimeout(()=>location.reload(),700);
    },
    async signOut(){
      if (!state.client) return;
      await state.client.auth.signOut();
      state.user = null;
      state.ready = false;
      state.progress = {};
      state.recovery = false;
      state.open = false;
      setMessage("");
    },
    repairSignIn(){
      const target = encodeURIComponent(location.pathname.split("/").pop() || "index.html");
      location.href = `auth_repair.html?next=${target}`;
    },
    openAuthDebug(){
      const target = new URL("auth_debug.html", location.href);
      const from = (location.pathname.split("/").pop() || "index.html").replace(/[^a-z0-9_.-]/gi,"") || "index.html";
      if (state.emailDraft) target.searchParams.set("email", state.emailDraft);
      target.searchParams.set("from", from);
      location.href = target.href;
    },
    useLocal(){
      state.authRun += 1;
      clearAuthWatchdog();
      state.busy = false;
      state.open = false;
      setMessage("Using local progress only. Your study data still saves on this device.");
    }
  };

  installStyles();
  installPwa();
  wrapMenu();
  wrapPersist();
  initCloud();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderCloudBar);
  else renderCloudBar();
})();
