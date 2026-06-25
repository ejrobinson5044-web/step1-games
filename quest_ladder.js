/* 80-question daily ladder for Step 1 Arcade home. */
(function(){
  const APP_VERSION = "v2026.06.25-random10";
  function installStyles(){
    if (document.getElementById("questLadderStyles")) return;
    const style = document.createElement("style");
    style.id = "questLadderStyles";
    style.textContent = `
.quest-ladder{margin:14px -20px 6px;padding:18px 20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:linear-gradient(135deg,rgba(34,211,238,.07),rgba(167,139,250,.055) 48%,rgba(251,191,36,.045))}
.quest-ladder-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.quest-ladder-head h2{font-family:'Unbounded';font-size:18px;line-height:1.15}
.quest-ladder-head span{color:var(--dim);font-size:12px;line-height:1.4}
.quest-ladder-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.quest-ladder-card{display:block;text-decoration:none;color:inherit;border:1px solid var(--line);border-radius:12px;background:rgba(8,8,12,.5);padding:13px;min-width:0;transition:transform .16s ease,border-color .16s ease,background .16s ease}
.quest-ladder-card:hover{transform:translateY(-2px);border-color:rgba(34,211,238,.42);background:rgba(255,255,255,.055)}
.quest-ladder-card b{display:block;color:#22d3ee;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
.quest-ladder-card strong{display:block;font-size:15px;line-height:1.2;color:var(--text)}
.quest-ladder-card span{display:block;color:var(--dim);font-size:12px;line-height:1.4;margin-top:7px}
.quest-ladder-card em{display:inline-flex;margin-top:10px;font-style:normal;color:#08080c;background:linear-gradient(135deg,#22d3ee,#a78bfa);border-radius:9px;padding:7px 9px;font-weight:800;font-size:12px}
.version-badge{position:fixed;right:10px;bottom:10px;z-index:50;border:1px solid var(--line);border-radius:999px;background:rgba(8,8,12,.76);backdrop-filter:blur(10px);color:var(--dim);font-family:'JetBrains Mono';font-size:10px;letter-spacing:1px;padding:5px 9px}
@media (max-width:980px){.quest-ladder-grid{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.quest-ladder{margin-left:-14px;margin-right:-14px}.quest-ladder-grid{grid-template-columns:1fr}.version-badge{font-size:9px;right:8px;bottom:8px}}
`;
    document.head.appendChild(style);
  }
  function renderVersion(){
    if (document.querySelector(".version-badge")) return;
    const badge = document.createElement("div");
    badge.className = "version-badge";
    badge.textContent = APP_VERSION;
    document.body.appendChild(badge);
  }
  function renderLadder(){
    const target = document.getElementById("daily-quests") || document.querySelector(".arcade-command") || document.querySelector(".hero");
    if (!target || document.getElementById("question-ladder")) return;
    const section = document.createElement("section");
    section.className = "quest-ladder";
    section.id = "question-ladder";
    const blocks = Array.from({length:8}, (_,i)=>i+1);
    section.innerHTML = `
      <div class="quest-ladder-head">
        <div><h2>Random 10Q Blocks</h2><span>Eight mixed 10-question blocks. Complete Blocks 1–8 to build toward an 80-question day.</span></div>
      </div>
      <div class="quest-ladder-grid">
        ${blocks.map(n=>`<a class="quest-ladder-card" href="random_10_block.html?block=${n}">
          <b>Block ${n}</b>
          <strong>Random 10 questions</strong>
          <span>${(n-1)*10 + 1}–${n*10} of 80 daily questions. Mixed Step 1 recall across the arcade.</span>
          <em>Start 10Q</em>
        </a>`).join("")}
      </div>`;
    target.insertAdjacentElement("afterend", section);
  }
  installStyles();
  renderVersion();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderLadder, {once:true});
  else renderLadder();
  window.addEventListener("load", renderLadder, {once:true});
})();
