/* --- Step 1 Arcade upgrade layer: adaptive review, timed blocks, accessibility --- */
(function(){
  if (window.__STEP1_ARCADE_UPGRADE__) return;
  window.__STEP1_ARCADE_UPGRADE__ = "2026-06-21-game-feel";

  const QUICK_KEYS = new Set(["daily","block","clinical","endless","missed","cards"]);
  const rawTitle = (document.title || "Step 1 Game").replace(/\s+/g, " ").trim();
  const titleParts = rawTitle.split(/\s+[—-]\s+/);
  const GAME_TITLE = (titleParts[0] || "Step 1 Game").trim();
  const GAME_SUBTITLE = (titleParts.slice(1).join(" - ") || "Step 1 active recall").trim();
  const GAME_SLUG = (typeof SAVE_KEY !== "undefined" ? SAVE_KEY : GAME_TITLE)
    .replace(/_v\d+$/,"")
    .replace(/[^a-z0-9]+/gi,"_")
    .replace(/^_|_$/g,"")
    .toLowerCase();

  function upgradeStyles(){
    const style = document.createElement("style");
    style.textContent = `
button.tile,button.choice,button.back,a.back{font:inherit;color:inherit;text-align:left}
button.tile,button.choice{width:100%}
button.tile{display:block}
button.back,a.back{background:transparent;border:0;padding:0}
a.back{text-decoration:none}
.game-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.game-nav .back{margin-bottom:0}
.game-nav .home{margin-left:auto;color:var(--cyan)}
.game-nav .home:hover{color:var(--amber-hi)}
.tile:focus-visible,.choice:focus-visible,.back:focus-visible,.btn:focus-visible{outline:3px solid var(--amber-hi);outline-offset:3px}
.tile:disabled{opacity:.48;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.choice.chosen{border-color:var(--amber);background:rgba(251,191,36,.12)}
.quiz-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;font-family:inherit}
.timer{font-family:inherit;color:var(--amber-hi);border:1px solid var(--line);border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.03)}
.review-list{display:grid;gap:12px;margin-top:18px;text-align:left}
.review-card{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:12px;padding:14px 15px}
.review-card b{color:var(--amber-hi)}
.review-card .mini{font-size:12px;color:var(--dim);margin-top:8px;line-height:1.45}
.study-visual{margin:0 0 18px;padding:13px 14px;background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:12px;font-size:14px;line-height:1.45}
.study-visual table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
.study-visual th,.study-visual td{border:1px solid var(--line);padding:7px 8px;text-align:left}
.study-visual th{color:var(--amber-hi);font-weight:700}
.confidence-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.reason-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.reason-row .btn{font-size:12px;padding:8px 10px;letter-spacing:.8px}
.flashcard{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;margin-top:14px}
.flashcard .front{font-size:18px;line-height:1.5}
.flashcard .answer{margin-top:14px;border-top:1px solid var(--line);padding-top:14px;font-size:14.5px;line-height:1.55}
.flashcard .mini{font-size:11px;color:var(--dim)}
.card-grades{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
.card-grades .btn{width:100%;padding:11px 10px;font-size:13px}
.due-pill{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;padding:3px 9px;color:var(--amber-hi);font-size:11px;margin-left:8px}
.game-pulse{position:relative;margin:0 0 22px;border:1px solid var(--line);border-radius:15px;padding:15px;background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.025));overflow:hidden}
.game-pulse::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent,rgba(255,255,255,.08),transparent);transform:translateX(-120%);animation:pulse-sheen 4.5s ease-in-out infinite;pointer-events:none}
.pulse-top{position:relative;display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
.pulse-kicker{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim)}
.pulse-rank{font-family:inherit;font-weight:800;color:var(--amber-hi);font-size:19px;margin-top:4px}
.pulse-grid{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:13px}
.pulse-stat{border:1px solid var(--line);border-radius:11px;padding:10px;background:rgba(0,0,0,.14)}
.pulse-stat b{display:block;font-size:18px;color:var(--text)}
.pulse-stat span{display:block;font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-top:2px}
.xp-track{position:relative;margin-top:12px;height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
.xp-track span{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--amber-hi));box-shadow:0 0 18px var(--glow,rgba(34,211,238,.35))}
.mission-strip{position:relative;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-top:13px;border-top:1px solid var(--line);padding-top:13px}
.mission-strip b{display:block;font-size:14px;color:var(--text)}
.mission-strip span{display:block;font-size:12px;color:var(--dim);line-height:1.35;margin-top:3px}
.mission-strip .btn{margin-top:0;padding:10px 13px;font-size:12px;white-space:nowrap}
.combo-badge{border:1px solid var(--line);border-radius:999px;padding:4px 10px;color:var(--amber-hi);background:rgba(251,191,36,.08);font-size:12px}
.reward-toast{margin:14px 0 0;border:1px solid var(--line);border-radius:13px;padding:11px 13px;background:rgba(255,255,255,.055);color:var(--text);animation:reward-pop .28s ease both}
.reward-toast.good{border-color:rgba(52,211,153,.36);box-shadow:0 0 24px rgba(52,211,153,.14)}
.reward-toast.miss{border-color:rgba(248,113,113,.34)}
.reward-toast b{color:var(--amber-hi)}
.xp-summary{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.045);padding:13px;margin:0 auto 18px;max-width:360px}
.xp-summary b{display:block;font-size:24px;color:var(--amber-hi)}
.xp-summary span{display:block;font-size:12px;color:var(--dim);margin-top:3px}
@keyframes pulse-sheen{0%,55%{transform:translateX(-120%)}78%,100%{transform:translateX(120%)}}
@keyframes reward-pop{from{opacity:0;transform:translateY(7px) scale(.98)}to{opacity:1;transform:none}}
@media (max-width:640px){.pulse-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mission-strip{grid-template-columns:1fr}.mission-strip .btn{width:100%}}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
`;
    document.head.appendChild(style);
  }
  upgradeStyles();

  function arcadeHomeHref(){
    return "index.html";
  }
  function renderHomeNav(){
    return `<div class="game-nav"><a class="back home" href="${arcadeHomeHref()}">&lsaquo; ALL GAMES</a></div>`;
  }
  function renderGameNav(){
    return `<div class="game-nav">
      <button type="button" class="back" onclick="menu()">&lsaquo; GAME MENU</button>
      <a class="back home" href="${arcadeHomeHref()}">ALL GAMES</a>
    </div>`;
  }
  function buildGameNavNode(){
    const nav = document.createElement("div");
    nav.className = "game-nav";
    nav.innerHTML = `<button type="button" class="back" onclick="menu()">&lsaquo; GAME MENU</button><a class="back home" href="${arcadeHomeHref()}">ALL GAMES</a>`;
    return nav;
  }
  function todayKey(){
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  }
  function plural(n, one, many){
    return `${n} ${n === 1 ? one : many}`;
  }
  function statTotals(){
    ensureSave();
    return Object.values(save.stats || {}).reduce((acc, stat)=>{
      acc.attempts += Number(stat.attempts || 0);
      acc.correct += Number(stat.correct || 0);
      acc.wrong += Number(stat.wrong || 0);
      acc.longest = Math.max(acc.longest, Number(stat.streak || 0));
      return acc;
    }, {attempts:0, correct:0, wrong:0, longest:0});
  }
  function computedXP(){
    const totals = statTotals();
    const cardCount = Object.keys(save.cards || {}).length;
    return totals.correct * 12 + totals.attempts * 2 + Number(save.played || 0) * 8 + Number(save.endlessBest || 0) * 6 + cardCount * 5;
  }
  function profileXP(){
    ensureSave();
    return Math.max(Number(save.xp || 0), computedXP());
  }
  function levelInfo(){
    const xp = profileXP();
    const size = 260;
    const level = Math.floor(xp / size) + 1;
    const floor = (level - 1) * size;
    const next = level * size;
    return {xp, level, floor, next, pct:Math.min(100, Math.round((xp - floor) / (next - floor) * 100))};
  }
  function rankTitle(level){
    if (level >= 18) return "Attending Mode";
    if (level >= 12) return "Chief Rounds";
    if (level >= 8) return "Resident Energy";
    if (level >= 4) return "Intern Mode";
    return "MS1 Spark";
  }
  function addXP(amount){
    ensureSave();
    save.xp = profileXP() + amount;
    if (session) session.xpEarned = (session.xpEarned || 0) + amount;
    persist();
    return amount;
  }
  function missionForGame(){
    const due = dueCards(false).length;
    const misses = missedQuestions().length;
    if (due) return {key:"cards", title:`Clear ${plural(due,"due card","due cards")}`, detail:"Flip, grade, and move shaky facts forward."};
    if (save.lastPlayedDate !== todayKey() && MODES.daily) return {key:"daily", title:"Start today's warm-up", detail:"A short run keeps this system active."};
    if (misses) return {key:"missed", title:`Rescue ${plural(misses,"miss","misses")}`, detail:"Turn misses into future points."};
    if (MODES.block) return {key:"block", title:"Run a timed rep", detail:"Pressure-test recall without changing the content."};
    return {key:"daily", title:"Quick recall run", detail:"Keep the streak alive."};
  }
  function renderGamePulse(){
    const totals = statTotals();
    const info = levelInfo();
    const accuracy = totals.attempts ? `${Math.round(totals.correct / totals.attempts * 100)}%` : "New";
    const mission = missionForGame();
    const due = dueCards(false).length;
    const misses = missedQuestions().length;
    return `<section class="game-pulse">
      <div class="pulse-top">
        <div>
          <div class="pulse-kicker">Arcade Pulse</div>
          <div class="pulse-rank">Level ${info.level} · ${rankTitle(info.level)}</div>
        </div>
        <div class="combo-badge">${info.xp} XP</div>
      </div>
      <div class="xp-track" aria-label="Level progress"><span style="width:${info.pct}%"></span></div>
      <div class="pulse-grid">
        <div class="pulse-stat"><b>${accuracy}</b><span>Accuracy</span></div>
        <div class="pulse-stat"><b>${save.played || 0}</b><span>Runs</span></div>
        <div class="pulse-stat"><b>${due}</b><span>Due</span></div>
        <div class="pulse-stat"><b>${misses}</b><span>Misses</span></div>
      </div>
      <div class="mission-strip">
        <div><b>${mission.title}</b><span>${mission.detail}</span></div>
        <button type="button" class="btn btn-next" onclick="start('${mission.key}')">START MISSION</button>
      </div>
    </section>`;
  }
  function rewardMarkup(correct, amount, streak){
    if (correct) {
      const combo = streak > 1 ? `Combo x${streak}` : "Clean hit";
      return `<div class="reward-toast good"><b>+${amount} XP</b> · ${combo}</div>`;
    }
    return `<div class="reward-toast miss"><b>+${amount} XP</b> · Saved to review</div>`;
  }

  function ensureSave(){
    save.best = save.best || {};
    save.missed = save.missed || {};
    save.cards = save.cards || {};
    save.stats = save.stats || {};
    save.played = save.played || 0;
    save.xp = Number(save.xp || 0) || 0;
    save.badges = save.badges || {};
  }
  ensureSave();

  QBANK.forEach((q,i)=>{
    if (!q._arcadeId) {
      const hint = String(q.q || "").slice(0,32).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
      q._arcadeId = `${GAME_SLUG}_${i}_${hint}`;
    }
  });

  function escapeHTML(value){
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }
  function missedQuestions(){
    ensureSave();
    return QBANK.filter(q=>save.missed && save.missed[q._arcadeId]);
  }
  function cardState(q){
    ensureSave();
    return save.cards[q._arcadeId] || null;
  }
  function addCard(q, grade){
    ensureSave();
    const now = Date.now();
    const existing = save.cards[q._arcadeId] || {reps:0,lapses:0,ease:2.2,due:now};
    if (grade === "again") {
      existing.lapses += 1;
      existing.due = now + 60*60*1000;
    } else if (grade === "hard") {
      existing.reps += 1;
      existing.due = now + 24*60*60*1000;
    } else {
      existing.reps += 1;
      const days = existing.reps <= 1 ? 3 : Math.min(14, Math.round(3 * existing.reps * existing.ease));
      existing.due = now + days*24*60*60*1000;
    }
    existing.lastGrade = grade;
    existing.last = new Date(now).toISOString();
    save.cards[q._arcadeId] = existing;
    persist();
  }
  function dueCards(includeFuture){
    ensureSave();
    const now = Date.now();
    return QBANK
      .filter(q=>save.cards[q._arcadeId] && (includeFuture || save.cards[q._arcadeId].due <= now))
      .sort((a,b)=>(save.cards[a._arcadeId].due || 0) - (save.cards[b._arcadeId].due || 0));
  }
  function cardPool(){
    const due = dueCards(false);
    if (due.length) return due;
    const missed = missedQuestions();
    if (missed.length) return missed;
    return [];
  }
  function nextScheduledCard(){
    return dueCards(true).find(q=>cardState(q) && cardState(q).due > Date.now()) || null;
  }
  function isClinicalStem(q){
    return /\b(patient|year-old|presents|comes to|history|physical exam|examination|serum|labs?|blood pressure|pulse|respirations|ct|x-ray|biopsy|microscopy|diagnostic studies|fever|pain|weakness|fatigue|rash)\b/i.test(q.q || "");
  }
  function clinicalQuestions(){
    return QBANK
      .filter(q=>q.v || isClinicalStem(q))
      .map(q=>q.v ? Object.assign({}, q, {
        q:q.v,
        _recallStem:q.q,
        _clinical:true
      }) : Object.assign({}, q, {_clinical:true}));
  }
  function clinicalMeta(){
    const n = QBANK.filter(q=>q.v).length;
    return n ? `${n} vignettes` : "Add vignettes";
  }
  function cardMeta(){
    const due = dueCards(false).length;
    const ready = missedQuestions().length;
    const total = Object.keys(save.cards || {}).length;
    if (due) return `${due} due`;
    if (ready) return `${ready} ready`;
    if (total) return `${total} later`;
    return "None yet";
  }
  function addMissed(q){
    ensureSave();
    save.missed[q._arcadeId] = (save.missed[q._arcadeId] || 0) + 1;
    addCard(q,"again");
    persist();
  }
  function clearMissed(q){
    ensureSave();
    if (save.missed[q._arcadeId]) {
      delete save.missed[q._arcadeId];
      persist();
    }
  }
  function recordAttempt(q, correct){
    ensureSave();
    const stat = save.stats[q._arcadeId] || {attempts:0,correct:0,wrong:0,streak:0};
    stat.attempts += 1;
    if (correct) {
      stat.correct += 1;
      stat.streak += 1;
    } else {
      stat.wrong += 1;
      stat.streak = 0;
    }
    stat.last = new Date().toISOString();
    save.stats[q._arcadeId] = stat;
    persist();
  }
  function reasonButtons(q){
    const id = q && q._arcadeId ? q._arcadeId : "";
    const opts = [
      ["knowledge","Didn't know fact"],
      ["confused","Confused answers"],
      ["stem","Misread stem"],
      ["mechanism","Forgot mechanism"]
    ];
    return `<div class="reason-row">${opts.map(o=>`<button class="btn btn-ghost" onclick="tagMissReason('${id}','${o[0]}',this)">${o[1]}</button>`).join("")}</div>`;
  }
  function formatTime(ms){
    const total = Math.max(0, Math.ceil(ms/1000));
    const m = Math.floor(total/60);
    const s = String(total%60).padStart(2,"0");
    return `${m}:${s}`;
  }
  function stopTimer(){
    if (session && session.timerId) {
      clearInterval(session.timerId);
      session.timerId = null;
    }
  }
  function updateTimer(){
    if (!session || !session.mode || !session.mode.timed) return;
    const left = session.timeLimitMs - (Date.now() - session.startedAt);
    const node = document.getElementById("timer");
    if (node) node.textContent = `Time ${formatTime(left)}`;
    if (left <= 0) results();
  }
  function startTimer(){
    stopTimer();
    if (!session || !session.mode || !session.mode.timed) return;
    updateTimer();
    session.timerId = setInterval(updateTimer, 250);
  }
  function renderSupport(q){
    let out = "";
    if (q.figure) out += `<div class="study-visual"><b>Figure prompt:</b> ${q.figure}</div>`;
    if (q.table && Array.isArray(q.table.rows)) {
      const headers = q.table.headers || [];
      out += `<div class="study-visual"><b>${q.table.title || "Data"}</b><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${q.table.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return out;
  }
  function answerText(q, answerIdx){
    const found = (session.order || []).find(o=>o.idx === answerIdx);
    return found ? found.t : (q.c && q.c[answerIdx]) || "";
  }
  function topicKeys(){
    return Object.keys(MODES).filter(k=>!QUICK_KEYS.has(k));
  }
  function missedMeta(){
    const n = missedQuestions().length;
    return n ? `${n} saved` : "None yet";
  }
  function renderNoCardsDue(){
    const next = nextScheduledCard();
    const when = next ? new Date(cardState(next).due).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "";
    app.innerHTML = `
      ${renderGameNav()}
      <div class="result">
        <div class="score-big" style="color:var(--cyan)">0</div>
        <div class="rank" style="color:var(--cyan)">NO CARDS DUE</div>
        <div class="mini">${when ? `Next review: ${when}` : "Miss a question or mark one unsure to create cards."}</div>
        <button class="btn btn-ghost" style="max-width:300px;margin:18px auto 0" onclick="menu()">BACK TO MENU</button>
      </div>`;
  }

  MODES.block = {
    name:"Timed 20Q Block",
    ic:"20",
    desc:"Exam-style 30-minute block with review held until the end.",
    timed:true,
    deferReview:true,
    timeLimit:30*60,
    pick:()=>shuffle([...QBANK]).slice(0,Math.min(20,QBANK.length))
  };
  MODES.clinical = {
    name:"Clinical Transfer",
    ic:"Pt",
    desc:"Short vignette variants for moving facts into patient scenarios.",
    clinical:true,
    pick:()=>shuffle(clinicalQuestions()).slice(0,Math.min(15,clinicalQuestions().length))
  };
  MODES.missed = {
    name:"Missed Items",
    ic:"!",
    desc:"Review questions you missed or marked unsure.",
    review:true,
    pick:()=>shuffle(missedQuestions())
  };
  MODES.cards = {
    name:"Missed Flashcards",
    ic:"FC",
    desc:"Flip missed or shaky items, then grade Again, Hard, or Good.",
    flashcards:true,
    pick:()=>shuffle(cardPool()).slice(0,Math.min(20,cardPool().length))
  };

  tile = function(key,mode,cls){
    const disabled = (key === "missed" && missedQuestions().length === 0) ||
      (key === "cards" && cardPool().length === 0) ||
      (key === "clinical" && clinicalQuestions().length === 0);
    const best = key === "endless"
      ? (save.endlessBest || 0)
      : (save.best[key] != null ? save.best[key] + "%" : "—");
    const bestLbl = key === "missed" ? missedMeta() :
      key === "cards" ? cardMeta() :
      key === "clinical" ? clinicalMeta() :
      (key === "endless" ? `Best streak: ${best}` : `Best: ${best}`);
    return `<button type="button" class="tile ${cls || ""}" onclick="start('${key}')" ${disabled ? "disabled" : ""}>
      <div class="ic">${mode.ic}</div>
      <h3>${mode.name}</h3>
      <p>${mode.desc}</p>
      <div class="meta">${bestLbl}</div>
    </button>`;
  };

  menu = function(){
    stopTimer();
    session = null;
    const keys = topicKeys();
    app.innerHTML = `
      ${renderHomeNav()}
      <div class="hdr">
        <div class="badge">${MODES.daily && MODES.daily.ic ? MODES.daily.ic : "+"}</div>
        <h1>${GAME_TITLE}</h1>
        <div class="sub">${GAME_SUBTITLE} — ${QBANK.length} questions</div>
      </div>
      ${renderGamePulse()}
      <div class="section-label">Quick Play</div>
      <div class="grid">
        ${MODES.daily ? tile("daily",MODES.daily,"") : ""}
        ${tile("block",MODES.block,"special")}
        ${tile("clinical",MODES.clinical,"")}
        ${MODES.endless ? tile("endless",MODES.endless,"amber") : ""}
        ${tile("missed",MODES.missed,"amber")}
        ${tile("cards",MODES.cards,"amber")}
      </div>
      <div class="section-label">Topic Drills</div>
      <div class="grid">${keys.map(k=>tile(k,MODES[k],k===keys[0]?"special":"")).join("")}</div>
      <div class="section-label">Reinforce</div>
      <div class="grid">
        <button type="button" class="tile amber" onclick="vault()">
          <div class="ic">◆</div>
          <h3>Memory Vault</h3>
          <p>Catchy memory tools and exam traps for this game.</p>
          <div class="meta">${VAULT.length} memory tools</div>
        </button>
      </div>
      <footer>Saves to this browser via localStorage · ${save.played || 0} rounds · Endless best: ${save.endlessBest || 0}</footer>`;
  };

  start = function(key){
    ensureSave();
    const mode = MODES[key];
    let qs = mode.pick();
    if (!qs.length && key === "missed") qs = shuffle([...QBANK]).slice(0,Math.min(10,QBANK.length));
    if (!qs.length && key === "cards") return renderNoCardsDue();
    session = {
      key, mode, qs, i:0, correct:0, streak:0, answered:false,
      responses:[], startedAt:Date.now(), timeLimitMs:(mode.timeLimit || 0) * 1000,
      timerId:null, revealed:false, xpEarned:0
    };
    if (mode.flashcards) renderCard();
    else renderQ();
    startTimer();
  };

  function renderCard(){
    const s = session;
    if (!s || !s.mode.flashcards) return;
    if (s.i >= s.qs.length) return results();
    const q = s.qs[s.i];
    const state = cardState(q);
    const dueText = save.missed && save.missed[q._arcadeId]
      ? "missed item"
      : (state && state.due > Date.now() ? `scheduled ${new Date(state.due).toLocaleDateString()}` : "due now");
    app.innerHTML = `
      ${renderGameNav()}
      <div class="quiz-tools">
        <div class="quiz-top" style="margin-bottom:0"><span class="qcount">Card ${s.i+1} / ${s.qs.length}</span><span class="due-pill">${dueText}</span></div>
      </div>
      <span class="modtag">${MODE_TAGS[q.m] || "Mixed"}</span>
      <div class="flashcard">
        <div class="front">${q.v || q.q}</div>
        <div id="cardBack"><button class="btn btn-next" style="margin-top:16px" onclick="revealCard()">REVEAL ANSWER</button></div>
      </div>`;
  }

  window.revealCard = function(){
    if (!session || !session.mode.flashcards) return;
    const q = session.qs[session.i];
    const back = document.getElementById("cardBack");
    if (!back) return;
    session.revealed = true;
    back.innerHTML = `<div class="answer">
      <b>Answer:</b> ${q.c[q.a]}<br>
      <b>Why:</b> ${q.why}
      ${q.p ? `<div class="pearl"><b>Pearl:</b> ${q.p}</div>` : ""}
      <div class="card-grades">
        <button class="btn btn-ghost" onclick="gradeCard('again')">Again<br><span class="mini">1 hour</span></button>
        <button class="btn btn-ghost" onclick="gradeCard('hard')">Hard<br><span class="mini">tomorrow</span></button>
        <button class="btn btn-next" onclick="gradeCard('good')">Good<br><span class="mini">later</span></button>
      </div>
    </div>`;
  };

  window.gradeCard = function(grade){
    if (!session || !session.mode.flashcards) return;
    const q = session.qs[session.i];
    addCard(q,grade);
    if (grade === "good") clearMissed(q);
    addXP(grade === "good" ? 12 : (grade === "hard" ? 6 : 3));
    session.responses.push({q, selectedText:grade, correctText:q.c[q.a], correct:grade === "good"});
    session.correct += grade === "good" ? 1 : 0;
    session.i++;
    session.revealed = false;
    renderCard();
  };

  renderQ = function(){
    const s = session;
    if (!s) return menu();
    if (s.mode.flashcards) return renderCard();
    if (!s.mode.endless && s.i >= s.qs.length) return results();
    if (s.mode.endless && s.i >= s.qs.length) { s.qs = shuffle([...QBANK]); s.i = 0; }
    const q = s.qs[s.i];
    const order = shuffle(q.c.map((t,idx)=>({t,idx})));
    s.order = order;
    s.correctPos = order.findIndex(o=>o.idx === q.a);
    const total = s.mode.endless ? "∞" : s.qs.length;
    const num = s.i + 1;
    const pct = s.mode.endless ? Math.min(100,(s.streak%15)/15*100) : (num-1)/s.qs.length*100;
    const tag = MODE_TAGS[q.m] || "Mixed";
    app.innerHTML = `
      ${renderGameNav()}
      <div class="quiz-tools">
        <div class="quiz-top" style="margin-bottom:0"><span class="qcount">Q ${num} / ${total}</span><span class="streak"> Streak ${s.streak}</span></div>
        ${s.streak ? `<div class="combo-badge">Combo x${s.streak}</div>` : ""}
        ${s.mode.timed ? `<div class="timer" id="timer">Time ${formatTime(s.timeLimitMs - (Date.now() - s.startedAt))}</div>` : ""}
      </div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <span class="modtag">${tag}</span>
      ${renderSupport(q)}
      <div class="stem">${q.q}</div>
      ${q._clinical && q._recallStem ? `<div class="study-visual"><b>Core recall:</b> ${q._recallStem}</div>` : ""}
      <div class="choices" id="ch" role="group" aria-label="Answer choices">
        ${order.map((o,i)=>`<button type="button" class="choice" data-i="${i}" onclick="answer(${i})">
          <span class="k">${String.fromCharCode(65+i)}</span><span>${o.t}</span></button>`).join("")}
      </div>
      <div id="post" aria-live="polite"></div>`;
    updateTimer();
  };

  answer = function(pos){
    const s = session;
    if (!s || s.answered) return;
    s.answered = true;
    const q = s.qs[s.i];
    const correct = pos === s.correctPos;
    const selectedText = s.order[pos] ? s.order[pos].t : "";
    const correctText = answerText(q,q.a);
    document.querySelectorAll(".choice").forEach((n,i)=>{
      n.classList.add("disabled");
      n.disabled = true;
      if (s.mode.deferReview) {
        if (i === pos) n.classList.add("chosen");
      } else {
        if (i === s.correctPos) n.classList.add("correct");
        if (i === pos && !correct) n.classList.add("wrong");
      }
    });
    if (correct) {
      s.correct++;
      s.streak++;
      if (s.key === "missed") clearMissed(q);
    } else {
      s.streak = 0;
      addMissed(q);
    }
    recordAttempt(q, correct);
    const xpGain = addXP(correct ? 12 + Math.min(s.streak, 8) : 3);
    s.responses.push({q, selectedText, correctText, correct});
    const post = document.getElementById("post");
    if (s.mode.deferReview) {
      post.innerHTML = `${rewardMarkup(correct, xpGain, s.streak)}<div class="explain"><div class="lab">Answer saved</div><div class="why">Review is held until the end of this timed block.</div></div>
        <button class="btn btn-next" onclick="nextQ()">${s.i+1>=s.qs.length ? "FINISH BLOCK" : "NEXT ›"}</button>`;
      return;
    }
    const pearl = q.p ? `<div class="pearl"><b>Pearl:</b> ${q.p}</div>` : "";
    const selected = correct ? "" : `<div class="mini"><b>Selected:</b> ${selectedText}<br><b>Correct:</b> ${correctText}</div>`;
    const confidence = correct ? `<div class="confidence-row"><button class="btn btn-ghost" onclick="markUnsureCurrent(this)">MARK UNSURE</button></div>` : reasonButtons(q);
    post.innerHTML = `${rewardMarkup(correct, xpGain, s.streak)}<div class="explain ${correct ? "" : "miss"}">
        <div class="lab">${correct ? "Correct" : "Review"}</div>
        <div class="why">${q.why}</div>${selected}${pearl}${confidence}
      </div>`;
    if (s.mode.endless && !correct) {
      if (s.correct > (save.endlessBest || 0)) { save.endlessBest = s.correct; persist(); }
      post.innerHTML += `<button class="btn btn-ghost" onclick="results()">End Run — Streak ${s.correct}</button>`;
      return;
    }
    if (s.mode.endless && correct && s.correct > (save.endlessBest || 0)) {
      save.endlessBest = s.correct;
      persist();
    }
    post.innerHTML += `<button class="btn btn-next" onclick="nextQ()">${(!s.mode.endless && s.i+1>=s.qs.length) ? "SEE RESULTS" : "NEXT ›"}</button>`;
  };

  window.markUnsureCurrent = function(btn){
    if (!session) return;
    const q = session.qs[session.i];
    addMissed(q);
    if (btn) {
      btn.textContent = "SAVED TO MISSED";
      btn.disabled = true;
    }
  };

  window.tagMissReason = function(id, reason, btn){
    ensureSave();
    save.missReasons = save.missReasons || {};
    save.missReasons[id] = save.missReasons[id] || {};
    save.missReasons[id][reason] = (save.missReasons[id][reason] || 0) + 1;
    persist();
    if (btn) {
      btn.textContent = "SAVED";
      btn.disabled = true;
    }
  };

  nextQ = function(){
    if (!session) return menu();
    if (session.mode.flashcards) {
      if (!session.revealed) return revealCard();
      return;
    }
    session.i++;
    session.answered = false;
    renderQ();
  };

  function renderReviewCards(responses, onlyMisses){
    const list = responses.filter(r=>!onlyMisses || !r.correct);
    if (!list.length) return `<div class="review-card"><b>No misses.</b><div class="mini">Clean block. Anything you felt shaky on can still be marked during ordinary review mode.</div></div>`;
    return list.map((r,idx)=>`<div class="review-card">
      <b>${idx+1}. ${r.correct ? "Correct" : "Missed"}</b>
      <div class="mini">${r.q.q}</div>
      <div class="mini"><b>Your answer:</b> ${r.selectedText || "—"}<br><b>Best answer:</b> ${r.correctText}</div>
      <div class="mini">${r.q.why}</div>
      ${r.q.p ? `<div class="pearl"><b>Pearl:</b> ${r.q.p}</div>` : ""}
      ${r.correct ? "" : reasonButtons(r.q)}
    </div>`).join("");
  }

  results = function(){
    const s = session;
    if (!s) return menu();
    stopTimer();
    const got = s.correct;
    const pctNum = s.mode.endless ? null : Math.round(got/s.qs.length*100);
    if (!s.mode.endless) save.best[s.key] = Math.max(save.best[s.key] || 0, pctNum);
    save.played = (save.played || 0) + 1;
    save.lastPlayedDate = todayKey();
    persist();
    const p = s.mode.endless ? Math.min(100,got*5) : pctNum;
    let rank, col;
    if (p >= 90) { rank = "ATTENDING — DOMINATED"; col = "var(--green)"; }
    else if (p >= 75) { rank = "RESIDENT — SOLID"; col = "var(--cyan)"; }
    else if (p >= 55) { rank = "INTERN — GETTING THERE"; col = "var(--amber-hi)"; }
    else { rank = "MS1 — DRILL AGAIN"; col = "var(--red)"; }
    const timedMeta = s.mode.timed ? `<div><b>${formatTime(Date.now()-s.startedAt)}</b>used</div>` : "";
    const missedButton = missedQuestions().length ? `<button class="btn btn-ghost" style="max-width:300px;margin:14px auto 0" onclick="start('missed')">REVIEW MISSED (${missedQuestions().length})</button>` : "";
    const cardsButton = cardPool().length ? `<button class="btn btn-ghost" style="max-width:300px;margin:14px auto 0" onclick="start('cards')">FLASHCARDS (${cardMeta()})</button>` : "";
    const review = s.mode.deferReview ? `<div class="section-label">Block Review</div><div class="review-list">${renderReviewCards(s.responses,false)}</div>` : "";
    const info = levelInfo();
    app.innerHTML = `
      ${renderGameNav()}
      <div class="result">
        <div class="xp-summary"><b>+${s.xpEarned || 0} XP</b><span>Level ${info.level} · ${info.xp} total XP</span></div>
        <div class="score-big" style="color:${col}">${s.mode.endless ? got : pctNum+"%"}</div>
        <div class="rank" style="color:${col}">${s.mode.endless ? "STREAK: "+got : rank}</div>
        <div class="statrow">
          <div><b>${got}</b>${s.mode.endless ? "in a row" : "correct"}</div>
          ${s.mode.endless ? "" : `<div><b>${s.qs.length-got}</b>missed</div>`}
          ${timedMeta}
          <div><b>${s.mode.endless ? (save.endlessBest || 0) : (save.best[s.key]+"%")}</b>best</div>
        </div>
        <button class="btn btn-next" style="max-width:300px;margin:0 auto" onclick="start('${s.key}')">RUN IT AGAIN</button>
        ${missedButton}
        ${cardsButton}
        <button class="btn btn-ghost" style="max-width:300px;margin:14px auto 0" onclick="menu()">BACK TO MENU</button>
        ${review}
      </div>`;
  };

  const oldVault = vault;
  vault = function(){
    oldVault();
    const oldBacks = app.querySelectorAll(".back");
    oldBacks.forEach(node=>{
      node.replaceWith(buildGameNavNode());
    });
  };

  window.answer = answer;
  window.nextQ = nextQ;
  window.results = results;
  window.start = start;
  window.menu = menu;
  window.vault = vault;
})();
window.__STEP1_ARCADE_UPGRADE_APPLIED__ = true;
