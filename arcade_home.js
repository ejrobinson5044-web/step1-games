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
  function reasonTotals(save){
    const totals = {};
    Object.values(save.missReasons || {}).forEach(reasons=>{
      Object.entries(reasons || {}).forEach(([reason,count])=>{
        totals[reason] = (totals[reason] || 0) + Number(count || 0);
      });
    });
    return totals;
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
    return {game, save, stats, due, missed, cardCount, best, xp, accuracy, played:Number(save.played || 0), reasons:reasonTotals(save)};
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
.coverage-band,.coach-panel{margin:14px -20px 6px;padding:18px 20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(255,255,255,.025)}
.coverage-head,.coach-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.coverage-head h2,.coach-head h2{font-family:'Unbounded';font-size:18px;line-height:1.15}
.coverage-head span,.coach-head span{color:var(--dim);font-size:12px;line-height:1.4}
.coverage-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.coverage-cell{border:1px solid var(--line);border-radius:12px;background:rgba(8,8,12,.42);padding:12px;min-width:0}
.coverage-cell strong{display:block;font-size:13px;color:var(--text);line-height:1.25}
.coverage-cell .coverage-meta{color:var(--dim);font-size:11px;margin-top:7px;line-height:1.35}
.coverage-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:10px}
.coverage-bar span{display:block;height:100%;background:linear-gradient(90deg,#22d3ee,#a78bfa,#fb923c)}
.coverage-cell.hot{border-color:rgba(251,191,36,.36);box-shadow:0 0 0 1px rgba(251,191,36,.12)}
.coach-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.coach-card{border:1px solid var(--line);border-radius:12px;background:rgba(8,8,12,.46);padding:13px}
.coach-card b{display:block;color:var(--amber-hi);font-size:12px;letter-spacing:1.1px;text-transform:uppercase;margin-bottom:5px}
.coach-card span{display:block;color:var(--text);font-size:13px;line-height:1.45}
.coach-card a{display:inline-flex;margin-top:10px;color:#08080c;background:linear-gradient(135deg,#22d3ee,#a78bfa);border-radius:9px;padding:8px 10px;text-decoration:none;font-weight:800;font-size:12px}
@media (max-width:820px){.command-grid{grid-template-columns:1fr 1fr}.command-main{grid-column:1/-1}}
@media (max-width:820px){.coverage-grid{grid-template-columns:1fr 1fr}.coach-grid{grid-template-columns:1fr}}
@media (max-width:560px){.arcade-command,.coverage-band,.coach-panel{margin-left:-14px;margin-right:-14px}.command-grid,.coverage-grid{grid-template-columns:1fr}.command-rank{font-size:19px}}
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
  function reasonLabel(reason){
    const labels = {
      knowledge:"Knowledge gap",
      confused:"Distractor confusion",
      stem:"Stem misread",
      mechanism:"Mechanism gap"
    };
    return labels[reason] || "Miss pattern";
  }
  function sectionSummaries(pulses){
    const map = new Map();
    pulses.forEach(pulse=>{
      const key = pulse.game.section || "Other";
      if (!map.has(key)) map.set(key, {section:key,games:0,played:0,attempts:0,correct:0,missed:0,due:0,weak:null});
      const item = map.get(key);
      item.games += 1;
      item.played += pulse.played;
      item.attempts += pulse.stats.attempts;
      item.correct += pulse.stats.correct;
      item.missed += pulse.missed;
      item.due += pulse.due;
      if (!item.weak || weakScore(pulse) > weakScore(item.weak)) item.weak = pulse;
    });
    return [...map.values()];
  }
  function renderCoverageHeatmap(pulses){
    const summaries = sectionSummaries(pulses);
    const band = document.createElement("section");
    band.className = "coverage-band";
    band.innerHTML = `
      <div class="coverage-head">
        <div><h2>Coverage Heatmap</h2><span>Shows where you have reps, misses, and due review across the arcade.</span></div>
      </div>
      <div class="coverage-grid">
        ${summaries.map(item=>{
          const accuracy = item.attempts ? Math.round(item.correct / item.attempts * 100) : 0;
          const pct = Math.min(100, Math.round((item.played / Math.max(1,item.games * 3)) * 100));
          const weak = item.weak && weakScore(item.weak) ? item.weak.game.title : "No weak spot yet";
          return `<div class="coverage-cell ${item.missed || item.due ? "hot" : ""}">
            <strong>${escapeHTML(item.section)}</strong>
            <div class="coverage-meta">${item.games} games | ${item.played} runs | ${item.attempts ? accuracy + "% accuracy" : "new"}</div>
            <div class="coverage-meta">${item.due} due | ${item.missed} misses | weak: ${escapeHTML(weak)}</div>
            <div class="coverage-bar"><span style="width:${pct}%"></span></div>
          </div>`;
        }).join("")}
      </div>`;
    const command = document.querySelector(".arcade-command");
    (command || hero).insertAdjacentElement("afterend", band);
    return band;
  }
  function topReason(pulses){
    const totals = {};
    pulses.forEach(pulse=>{
      Object.entries(pulse.reasons || {}).forEach(([reason,count])=>{
        totals[reason] = (totals[reason] || 0) + Number(count || 0);
      });
    });
    return Object.entries(totals).sort((a,b)=>b[1]-a[1])[0] || null;
  }
  function reasonAdvice(reason){
    const advice = {
      knowledge:"Run the Memory Vault for the weak game, then do 8 untimed reps before adding pressure.",
      confused:"Use the post-answer contrast prompt: write why the closest distractor is wrong.",
      stem:"Before answering, underline age/time course/lab direction/negating words in your head.",
      mechanism:"Say cue -> anchor -> mechanism before clicking next."
    };
    return advice[reason] || "Do a short mixed run, then review the misses immediately.";
  }
  function renderCoachPanel(pulses, afterNode){
    const weak = pulses.slice().sort((a,b)=>weakScore(b) - weakScore(a))[0];
    const reason = topReason(pulses);
    const totalMisses = pulses.reduce((sum,pulse)=>sum + pulse.missed, 0);
    const totalDue = pulses.reduce((sum,pulse)=>sum + pulse.due, 0);
    const weakHref = weak && weakScore(weak) ? weak.game.file : "review_hub.html";
    const panel = document.createElement("section");
    panel.className = "coach-panel";
    panel.innerHTML = `
      <div class="coach-head">
        <div><h2>Coach Readout</h2><span>A small nudge from your saved misses, due cards, and accuracy patterns.</span></div>
      </div>
      <div class="coach-grid">
        <div class="coach-card">
          <b>${reason ? reasonLabel(reason[0]) : "No miss pattern yet"}</b>
          <span>${reason ? reasonAdvice(reason[0]) : "Get a few reps in, then the app will start naming your most common miss type."}</span>
          <a href="${weakHref}">${weak && weakScore(weak) ? "Attack " + escapeHTML(weak.game.title) : "Start Review"}</a>
        </div>
        <div class="coach-card">
          <b>${totalDue ? "Spaced review first" : (totalMisses ? "Clean the miss bank" : "Next best rep")}</b>
          <span>${totalDue ? `${totalDue} due card${totalDue === 1 ? "" : "s"} are ready before you add new material.` : (totalMisses ? `${totalMisses} missed item${totalMisses === 1 ? "" : "s"} are waiting to become durable recall.` : "Run Interpretation Lab in one weak game to practice reading tables and diagrams.")}</span>
          <a href="review_hub.html">${totalDue || totalMisses ? "Open Review Hub" : "Review Hub"}</a>
        </div>
      </div>`;
    afterNode.insertAdjacentElement("afterend", panel);
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
  const coverage = renderCoverageHeatmap(pulses);
  renderCoachPanel(pulses, coverage);
  enhanceCards(pulses);
})();
