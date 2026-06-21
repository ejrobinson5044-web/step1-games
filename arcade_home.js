/* Home-page game-feel layer for Step 1 Arcade. */
(function(){
  const games = window.STEP1_GAMES || [];
  const lib = document.getElementById("lib");
  const hero = document.querySelector(".hero");
  if (!games.length || !lib || !hero) return;

  function readSave(key){
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch(error){ return {}; }
  }
  function escapeHTML(value){
    return String(value == null ? "" : value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }
  function statTotals(save){
    return Object.values(save.stats || {}).reduce((acc, stat)=>{
      acc.attempts += Number(stat.attempts || 0);
      acc.correct += Number(stat.correct || 0);
      acc.wrong += Number(stat.wrong || 0);
      return acc;
    }, {attempts:0, correct:0, wrong:0});
  }
  function bestScore(save){
    const values = Object.values(save.best || {}).map(Number).filter(Number.isFinite);
    return values.length ? Math.max(...values) : null;
  }
  function gamePulse(game){
    const save = readSave(game.saveKey);
    const stats = statTotals(save);
    const cards = save.cards || {};
    const now = Date.now();
    const due = Object.values(cards).filter(card=>card && Number(card.due || 0) <= now).length;
    const missed = Object.keys(save.missed || {}).length;
    const cardCount = Object.keys(cards).length;
    const best = bestScore(save);
    const xpBase = stats.correct * 12 + stats.attempts * 2 + Number(save.played || 0) * 8 + Number(save.endlessBest || 0) * 6 + cardCount * 5;
    const xp = Math.max(Number(save.xp || 0), xpBase);
    const accuracy = stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : null;
    return {game, save, stats, due, missed, cardCount, best, xp, accuracy, played:Number(save.played || 0)};
  }
  function levelInfo(xp){
    const size = 450;
    const level = Math.floor(xp / size) + 1;
    const floor = (level - 1) * size;
    const next = level * size;
    return {level, pct:Math.min(100, Math.round((xp - floor) / (next - floor) * 100)), next};
  }
  function rankTitle(level){
    if (level >= 18) return "Attending Mode";
    if (level >= 12) return "Chief Rounds";
    if (level >= 8) return "Resident Energy";
    if (level >= 4) return "Intern Mode";
    return "MS1 Spark";
  }
  function weakScore(pulse){
    const accGap = pulse.accuracy == null ? 0 : Math.max(0, 80 - pulse.accuracy);
    return pulse.missed * 6 + pulse.stats.wrong * 2 + accGap + (pulse.due ? 8 : 0);
  }
  function installStyles(){
    if (document.getElementById("arcadeHomeStyles")) return;
    const style = document.createElement("style");
    style.id = "arcadeHomeStyles";
    style.textContent = `
.arcade-command{margin:18px -20px 6px;padding:18px 20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:linear-gradient(135deg,rgba(34,211,238,.075),rgba(167,139,250,.055) 45%,rgba(251,146,60,.055))}
.command-grid{display:grid;grid-template-columns:1.35fr repeat(3,minmax(0,.8fr));gap:12px;align-items:stretch}
.command-main,.command-tile{border:1px solid var(--line);border-radius:14px;background:rgba(8,8,12,.48);padding:15px;position:relative;overflow:hidden}
.command-main::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,#22d3ee,#a78bfa,#fb923c)}
.command-kicker{font-family:'JetBrains Mono';font-size:10px;color:var(--dim);letter-spacing:2px;text-transform:uppercase}
.command-rank{font-family:'Unbounded';font-size:22px;line-height:1.1;margin-top:7px}
.command-sub{color:var(--dim);font-size:12px;line-height:1.35;margin-top:8px}
.xp-meter{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:13px}
.xp-meter span{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#a78bfa,#fb923c)}
.command-tile b{display:block;font-family:'Unbounded';font-size:24px;line-height:1.05}
.command-tile span{display:block;color:var(--dim);font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:5px}
.command-tile a{display:inline-flex;margin-top:12px;color:#08080c;background:linear-gradient(135deg,#22d3ee,#a78bfa);border-radius:9px;padding:8px 10px;text-decoration:none;font-weight:800;font-size:12px}
.card-meter{position:relative;margin-top:13px;padding-top:11px;border-top:1px solid var(--line)}
.card-meter .meter-row{display:flex;justify-content:space-between;gap:8px;font-family:'JetBrains Mono';font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase}
.card-meter .meter-row b{color:var(--text);font-weight:800}
.card-meter .meter{height:6px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:8px}
.card-meter .meter span{display:block;height:100%;background:var(--ac)}
.card.hot{box-shadow:0 0 0 1px color-mix(in srgb,var(--ac) 28%,transparent),0 10px 28px rgba(0,0,0,.34)}
@media (max-width:820px){.command-grid{grid-template-columns:1fr 1fr}.command-main{grid-column:1/-1}}
@media (max-width:560px){.arcade-command{margin-left:-14px;margin-right:-14px}.command-grid{grid-template-columns:1fr}.command-rank{font-size:19px}}
`;
    document.head.appendChild(style);
  }
  function renderCommandCenter(pulses){
    const totals = pulses.reduce((acc, pulse)=>{
      acc.xp += pulse.xp;
      acc.due += pulse.due;
      acc.missed += pulse.missed;
      acc.played += pulse.played;
      acc.correct += pulse.stats.correct;
      acc.attempts += pulse.stats.attempts;
      return acc;
    }, {xp:0,due:0,missed:0,played:0,correct:0,attempts:0});
    const level = levelInfo(totals.xp);
    const weak = pulses.slice().sort((a,b)=>weakScore(b) - weakScore(a))[0];
    const weakLabel = weak && weakScore(weak) ? weak.game.title : "Fresh start";
    const weakHref = weak && weakScore(weak) ? weak.game.file : "review_hub.html";
    const accuracy = totals.attempts ? `${Math.round(totals.correct / totals.attempts * 100)}%` : "New";
    const command = document.createElement("section");
    command.className = "arcade-command";
    command.innerHTML = `
      <div class="command-grid">
        <div class="command-main">
          <div class="command-kicker">Player Level</div>
          <div class="command-rank">Level ${level.level} · ${rankTitle(level.level)}</div>
          <div class="command-sub">${totals.xp} XP · ${accuracy} accuracy · ${totals.played} completed runs</div>
          <div class="xp-meter"><span style="width:${level.pct}%"></span></div>
        </div>
        <div class="command-tile"><b>${totals.due}</b><span>Due Cards</span><a href="review_hub.html">Review</a></div>
        <div class="command-tile"><b>${totals.missed}</b><span>Misses Banked</span><a href="review_hub.html">Clean Up</a></div>
        <div class="command-tile"><b>${escapeHTML(weakLabel)}</b><span>Weak Spot</span><a href="${weakHref}">Attack</a></div>
      </div>`;
    hero.insertAdjacentElement("afterend", command);
  }
  function enhanceCards(pulses){
    pulses.forEach(pulse=>{
      const card = document.querySelector(`.card[href="${pulse.game.file}"]`);
      if (!card) return;
      const pct = pulse.best == null ? 0 : Math.max(0, Math.min(100, pulse.best));
      if (pulse.due || pulse.missed) card.classList.add("hot");
      card.insertAdjacentHTML("beforeend", `<div class="card-meter">
        <div class="meter-row"><span>Best <b>${pulse.best == null ? "--" : pulse.best + "%"}</b></span><span>${pulse.due ? pulse.due + " due" : pulse.played + " runs"}</span></div>
        <div class="meter"><span style="width:${pct}%"></span></div>
      </div>`);
    });
  }

  installStyles();
  const pulses = games.map(gamePulse);
  renderCommandCenter(pulses);
  enhanceCards(pulses);
})();
