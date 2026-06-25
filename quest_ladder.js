/* Push 005 — Command Center layer for Step 1 Arcade home. */
(function(){
  const TOTAL_BLOCKS = 8;
  const BLOCK_SIZE = 10;
  const DAILY_GOAL = TOTAL_BLOCKS * BLOCK_SIZE;
  const STORAGE_KEY = "step1_daily_blocks_v1";
  const ACCORDION_KEY = "step1_landing_accordion_v1";

  function todayKey(){
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  }
  function appVersion(){
    return window.STEP1_APP_VERSION || {label:"Push 005", slug:"push-005", name:"Command Center"};
  }
  function appVersionLabel(){
    const v = appVersion();
    return v.name ? `${v.label} · ${v.name}` : v.label;
  }
  function syncVersionSource(){
    if (window.STEP1_APP_VERSION || document.querySelector('script[data-step1-version]')) return;
    const script = document.createElement("script");
    script.src = "app_version.js?v=push-005";
    script.dataset.step1Version = "true";
    script.onload = renderVersion;
    document.head.appendChild(script);
  }
  function readAccordionState(){
    try { return JSON.parse(localStorage.getItem(ACCORDION_KEY)) || {}; }
    catch(error){ return {}; }
  }
  function writeAccordionState(state){
    try { localStorage.setItem(ACCORDION_KEY, JSON.stringify(state || {})); }
    catch(error){}
  }
  function readDaily(){
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      if (raw.day !== todayKey()) return {day:todayKey(), completed:{}, lastBlock:0, lastScore:null, lastCompletedAt:null};
      raw.completed = raw.completed || {};
      return raw;
    } catch(error) {
      return {day:todayKey(), completed:{}, lastBlock:0, lastScore:null, lastCompletedAt:null};
    }
  }
  function completedCount(state){
    return Object.keys(state.completed || {}).filter(k=>state.completed[k]).length;
  }
  function nextBlock(state){
    for (let i=1;i<=TOTAL_BLOCKS;i++) if (!state.completed || !state.completed[i]) return i;
    return TOTAL_BLOCKS;
  }
  function rankTitle(done){
    if (done >= 80) return "Attending Trial Complete";
    if (done >= 60) return "Chief Mode";
    if (done >= 40) return "Resident Rounds";
    if (done >= 20) return "Intern Momentum";
    return "Morning Warmup";
  }
  function installStyles(){
    if (document.getElementById("questLadderStyles")) return;
    const style = document.createElement("style");
    style.id = "questLadderStyles";
    style.textContent = `
.command-center-v5{margin:14px -20px 6px;padding:20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:radial-gradient(circle at 20% 0%,rgba(34,211,238,.16),transparent 34%),linear-gradient(135deg,rgba(34,211,238,.09),rgba(167,139,250,.065) 48%,rgba(251,191,36,.05));position:relative;overflow:hidden}
.command-center-v5::after{content:"";position:absolute;inset:auto -20% 0 -20%;height:1px;background:linear-gradient(90deg,transparent,#22d3ee,#a78bfa,#fbbf24,transparent);opacity:.8}
.command-v5-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:14px;align-items:stretch}
.command-v5-main,.command-v5-side{border:1px solid var(--line);border-radius:18px;background:rgba(8,8,12,.58);padding:16px;position:relative;overflow:hidden}
.command-v5-kicker{font-family:'JetBrains Mono';font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim)}
.command-v5-title{font-family:'Unbounded';font-size:clamp(25px,4.8vw,42px);line-height:1.02;margin-top:8px;letter-spacing:-.8px}
.command-v5-sub{color:var(--dim);font-size:13px;line-height:1.42;margin-top:8px;max-width:560px}
.command-v5-action{display:inline-flex;align-items:center;justify-content:center;margin-top:16px;text-decoration:none;border-radius:14px;padding:13px 16px;background:linear-gradient(135deg,#22d3ee,#a78bfa);color:#08080c;font-weight:900;box-shadow:0 16px 34px rgba(34,211,238,.16)}
.command-v5-action:hover{transform:translateY(-1px)}
.command-v5-meter{height:11px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:16px}
.command-v5-meter span{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#a78bfa,#fbbf24);transition:width .35s ease}
.command-v5-side{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.command-v5-stat{border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.035);padding:12px;min-width:0;min-height:84px}
.command-v5-stat b{display:block;font-family:'Unbounded';font-size:24px;line-height:1;color:var(--text)}
.command-v5-stat span{display:block;color:var(--dim);font-family:'JetBrains Mono';font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-top:6px}
.command-v5-stat.signal{grid-column:1/-1;min-height:92px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,rgba(34,211,238,.055),rgba(167,139,250,.04))}
.command-v5-stat.signal b{font-size:clamp(18px,2.3vw,25px);line-height:1.1;letter-spacing:-.5px;max-width:100%}
.command-v5-stat.signal span{margin-top:9px}
.quest-ladder{margin:14px -20px 6px;padding:18px 20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(255,255,255,.025)}
.quest-ladder-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.quest-ladder-head h2{font-family:'Unbounded';font-size:18px;line-height:1.15}
.quest-ladder-head span{color:var(--dim);font-size:12px;line-height:1.4}
.quest-ladder-path{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:9px;position:relative}
.quest-ladder-card{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:14px;background:rgba(8,8,12,.5);padding:13px 12px;min-width:0;transition:transform .16s ease,border-color .16s ease,background .16s ease;position:relative;overflow:hidden}
.quest-ladder-card:hover{transform:translateY(-2px);border-color:rgba(34,211,238,.42);background:rgba(255,255,255,.055)}
.quest-ladder-card.done{border-color:rgba(52,211,153,.42);background:rgba(52,211,153,.07)}
.quest-ladder-card.current{border-color:rgba(34,211,238,.62);box-shadow:0 0 0 1px rgba(34,211,238,.18),0 12px 28px rgba(34,211,238,.11)}
.quest-ladder-card.locked{opacity:.68}
.quest-ladder-card b{display:block;color:#22d3ee;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
.quest-ladder-card.done b{color:#34d399}
.quest-ladder-card strong{display:block;font-size:14px;line-height:1.2;color:var(--text)}
.quest-ladder-card span{display:block;color:var(--dim);font-size:11.5px;line-height:1.35;margin-top:7px}
.quest-ladder-card em{display:inline-flex;margin-top:10px;font-style:normal;color:#08080c;background:linear-gradient(135deg,#22d3ee,#a78bfa);border-radius:9px;padding:7px 8px;font-weight:900;font-size:11px}
.quest-ladder-card.done em{background:#34d399}
.landing-accordion{position:relative}
.landing-accordion-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;padding:0}
.landing-accordion-toggle:focus-visible{outline:3px solid #fbbf24;outline-offset:4px;border-radius:10px}
.landing-accordion-title{min-width:0}
.landing-accordion-icon{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.045);color:#22d3ee;font-family:'JetBrains Mono';font-size:16px;transition:transform .18s ease,background .18s ease}
.landing-accordion.is-collapsed .landing-accordion-icon{transform:rotate(-90deg);background:rgba(255,255,255,.025);color:var(--dim)}
.landing-accordion-content{overflow:hidden;transition:max-height .24s ease,opacity .18s ease,margin-top .18s ease;max-height:2200px;opacity:1}
.landing-accordion.is-collapsed .landing-accordion-content{max-height:0!important;opacity:0;margin-top:0!important;pointer-events:none}
.command-center-v5 .landing-accordion-content{margin-top:0}
.quest-ladder .landing-accordion-content{margin-top:0}
.sec.landing-accordion,.how.landing-accordion{border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.022);padding:16px;margin-top:18px}
.sec.landing-accordion .sec-head,.how.landing-accordion h2{margin-bottom:0}
.sec.landing-accordion .grid,.how.landing-accordion .row{margin-top:16px}
.how.landing-accordion h2{width:100%}
.version-badge{position:fixed;right:10px;bottom:10px;z-index:50;border:1px solid var(--line);border-radius:999px;background:rgba(8,8,12,.76);backdrop-filter:blur(10px);color:var(--dim);font-family:'JetBrains Mono';font-size:10px;letter-spacing:1px;padding:5px 9px}
@media (max-width:980px){.command-v5-grid{grid-template-columns:1fr}.quest-ladder-path{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:560px){.command-center-v5,.quest-ladder{margin-left:-14px;margin-right:-14px}.command-v5-side{grid-template-columns:1fr 1fr}.command-v5-stat.signal{grid-column:1/-1}.quest-ladder-path{grid-template-columns:1fr}.version-badge{font-size:9px;right:8px;bottom:8px}}
@media (prefers-reduced-motion: reduce){.landing-accordion-content,.landing-accordion-icon{transition:none!important}}
`;
    document.head.appendChild(style);
  }
  function accordionHeader(titleHTML, subtitleHTML){
    return `<button class="landing-accordion-toggle" type="button" aria-expanded="true">
      <span class="landing-accordion-title">${titleHTML}${subtitleHTML || ""}</span>
      <span class="landing-accordion-icon" aria-hidden="true">⌄</span>
    </button>`;
  }
  function applyAccordion(section, key, defaultOpen){
    if (!section || section.dataset.accordionReady) return;
    section.classList.add("landing-accordion");
    section.dataset.accordionKey = key;
    const state = readAccordionState();
    const isOpen = Object.prototype.hasOwnProperty.call(state,key) ? !!state[key] : !!defaultOpen;
    const toggle = section.querySelector(".landing-accordion-toggle");
    const content = section.querySelector(".landing-accordion-content");
    if (!toggle || !content) return;
    function setOpen(open, persist){
      section.classList.toggle("is-collapsed", !open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (persist){
        const next = readAccordionState();
        next[key] = open;
        writeAccordionState(next);
      }
    }
    toggle.addEventListener("click",()=>setOpen(section.classList.contains("is-collapsed"), true));
    section.dataset.accordionReady = "true";
    setOpen(isOpen, false);
  }
  function makeExistingSectionAccordion(section, key, defaultOpen){
    if (!section || section.dataset.accordionReady) return;
    const head = section.querySelector(".sec-head");
    if (!head) return;
    const contentNodes = [];
    let node = head.nextElementSibling;
    while (node){ contentNodes.push(node); node = node.nextElementSibling; }
    const content = document.createElement("div");
    content.className = "landing-accordion-content";
    contentNodes.forEach(child=>content.appendChild(child));
    const titleHTML = head.innerHTML;
    head.innerHTML = accordionHeader(titleHTML, "");
    head.insertAdjacentElement("afterend", content);
    applyAccordion(section, key, defaultOpen);
  }
  function makeHowAccordion(){
    const section = document.querySelector(".how");
    if (!section || section.dataset.accordionReady) return;
    const h2 = section.querySelector("h2");
    const row = section.querySelector(".row");
    if (!h2 || !row) return;
    const content = document.createElement("div");
    content.className = "landing-accordion-content";
    content.appendChild(row);
    h2.innerHTML = accordionHeader(`<span>${h2.textContent}</span>`, "");
    h2.insertAdjacentElement("afterend", content);
    applyAccordion(section, "how-it-works", false);
  }
  function installLandingAccordions(){
    applyAccordion(document.getElementById("command-center-v5"), "command-center", true);
    applyAccordion(document.getElementById("question-ladder"), "question-board", true);
    applyAccordion(document.getElementById("daily-quests"), "coach-recommendations", false);
    applyAccordion(document.querySelector(".coverage-band"), "coverage-heatmap", false);
    applyAccordion(document.querySelector(".coach-panel"), "coach-readout", false);
    document.querySelectorAll(".sec").forEach((section, index)=>makeExistingSectionAccordion(section, `game-section-${index}`, false));
    makeHowAccordion();
  }
  function renderVersion(){
    const existing = document.querySelector(".version-badge");
    if (existing) {
      existing.textContent = appVersionLabel();
      return;
    }
    const badge = document.createElement("div");
    badge.className = "version-badge";
    badge.textContent = appVersionLabel();
    document.body.appendChild(badge);
  }
  function relabelAdaptiveQuestBoard(){
    const board = document.getElementById("daily-quests");
    if (!board) return;
    const title = board.querySelector("h2");
    const subtitle = board.querySelector(".quest-head span");
    if (title) title.textContent = "Coach's Recommendations";
    if (subtitle) subtitle.textContent = "Use this after your 10Q blocks: weak spot, boss case, comeback review, and interpretation reps.";
    const link = document.querySelector('.hero-actions a[href="#daily-quests"]');
    if (link) link.textContent = "Coach";
  }
  function renderCommandCenter(){
    const hero = document.querySelector(".hero");
    if (!hero || document.getElementById("command-center-v5")) return;
    const state = readDaily();
    const complete = completedCount(state);
    const questions = complete * BLOCK_SIZE;
    const pct = Math.round(questions / DAILY_GOAL * 100);
    const next = nextBlock(state);
    const allDone = complete >= TOTAL_BLOCKS;
    const href = allDone ? "review_hub.html" : `random_10_block.html?block=${next}`;
    const action = allDone ? "Open Review Queue" : "▶ Continue Studying";
    const status = allDone ? "Daily question goal complete. Clean up misses or review due cards." : `Next: Random Block ${next}`;
    const last = state.lastScore != null ? `${state.lastScore}% last block` : "No block completed yet";
    const section = document.createElement("section");
    section.className = "command-center-v5";
    section.id = "command-center-v5";
    section.innerHTML = `
      ${accordionHeader(`<div class="command-v5-kicker">Step 1 Arcade · Command Center</div><div class="command-v5-title">${rankTitle(questions)}</div><div class="command-v5-sub">${questions} / ${DAILY_GOAL} questions today · ${status}</div>`, "")}
      <div class="landing-accordion-content">
        <div class="command-v5-grid">
          <div class="command-v5-main">
            <div class="command-v5-meter"><span style="width:${pct}%"></span></div>
            <a class="command-v5-action" href="${href}">${action}</a>
          </div>
          <div class="command-v5-side">
            <div class="command-v5-stat"><b>${questions}</b><span>Questions</span></div>
            <div class="command-v5-stat"><b>${pct}%</b><span>Daily Goal</span></div>
            <div class="command-v5-stat"><b>${complete}/8</b><span>Blocks</span></div>
            <div class="command-v5-stat signal"><b>${last}</b><span>Signal</span></div>
          </div>
        </div>
      </div>`;
    hero.insertAdjacentElement("afterend", section);
  }
  function renderLadder(){
    const command = document.getElementById("command-center-v5") || document.querySelector(".hero");
    if (!command || document.getElementById("question-ladder")) return;
    const state = readDaily();
    const current = nextBlock(state);
    const blocks = Array.from({length:TOTAL_BLOCKS}, (_,i)=>i+1);
    const section = document.createElement("section");
    section.className = "quest-ladder";
    section.id = "question-ladder";
    section.innerHTML = `
      <div class="quest-ladder-head">
        ${accordionHeader(`<div><h2>Today's Question Board</h2><span>Eight mixed 10-question blocks. Clear the path to reach 80 questions today.</span></div>`, "")}
      </div>
      <div class="landing-accordion-content">
        <div class="quest-ladder-path">
          ${blocks.map(n=>{
            const done = !!(state.completed && state.completed[n]);
            const cls = done ? "done" : (n === current ? "current" : "locked");
            const label = done ? "Complete" : (n === current ? "Continue" : "Start");
            const title = n === 1 ? "Warmup" : n === 4 ? "Rounds" : n === 6 ? "Chief" : n === 8 ? "Attending" : "Mixed Rep";
            return `<a class="quest-ladder-card ${cls}" href="random_10_block.html?block=${n}">
              <b>${done ? "✓" : (n === current ? "▶" : "○")} Block ${n}</b>
              <strong>${title}</strong>
              <span>${(n-1)*10 + 1}–${n*10} of ${DAILY_GOAL} daily questions</span>
              <em>${label}</em>
            </a>`;
          }).join("")}
        </div>
      </div>`;
    command.insertAdjacentElement("afterend", section);
  }
  function boot(){
    installStyles();
    syncVersionSource();
    renderVersion();
    renderCommandCenter();
    renderLadder();
    relabelAdaptiveQuestBoard();
    installLandingAccordions();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
  window.addEventListener("load", boot, {once:true});
})();
