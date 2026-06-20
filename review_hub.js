(function(){
  const games = window.STEP1_GAMES || [];
  const state = { decks:[], items:[], session:null };
  const reasons = [
    ["knowledge","Didn't know the fact"],
    ["confused","Confused two answers"],
    ["stem","Misread the stem"],
    ["mechanism","Forgot the mechanism"]
  ];

  const $ = id => document.getElementById(id);
  const shuffle = arr => {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  };
  const clone = value => {
    try { return JSON.parse(JSON.stringify(value || {})); }
    catch(e){ return {}; }
  };
  const slugFromKey = key => String(key || "").replace(/_v\d+$/,"").replace(/[^a-z0-9]+/gi,"_").replace(/^_|_$/g,"").toLowerCase();
  const arcadeId = (game, q, index) => {
    const hint = String(q.q || "").slice(0,32).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
    return `${slugFromKey(game.saveKey)}_${index}_${hint}`;
  };
  const escapeHTML = value => String(value == null ? "" : value)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const saveTemplate = () => ({best:{},endlessBest:0,played:0,missed:{},cards:{},stats:{},missReasons:{}});
  function readSave(game){
    const cloud = window.Step1CloudAuth && Step1CloudAuth.progress ? Step1CloudAuth.progress()[game.saveKey] : null;
    let local = null;
    try { local = JSON.parse(localStorage.getItem(game.saveKey)); } catch(e){}
    return Object.assign(saveTemplate(), clone(cloud), clone(local));
  }
  function writeSave(game, save){
    save.cloudUpdatedAt = new Date().toISOString();
    localStorage.setItem(game.saveKey, JSON.stringify(save));
    if (window.Step1CloudAuth && Step1CloudAuth.saveProgress) Step1CloudAuth.saveProgress(game.saveKey, save);
  }
  function statFor(item){
    return readSave(item.game).stats[item.id] || {attempts:0,correct:0,wrong:0,streak:0};
  }
  function cardFor(item){
    return readSave(item.game).cards[item.id] || null;
  }
  function missedFor(item){
    return Boolean(readSave(item.game).missed[item.id]);
  }
  async function loadDeck(game){
    const html = await fetch(game.file, {cache:"no-store"}).then(r=>r.text());
    const match = html.match(/const QBANK\s*=\s*(\[[\s\S]*?\]);\s*(?:\/\*[\s\S]*?\*\/\s*)?const VAULT/);
    if (!match) throw new Error(`Could not read ${game.title}`);
    const qbank = Function(`"use strict"; return (${match[1]});`)();
    const items = qbank.map((q,index)=>Object.assign({}, q, {game, index, id:arcadeId(game,q,index)}));
    return {game, items};
  }
  async function init(){
    $("dailyBtn").addEventListener("click", startDaily);
    $("cardsBtn").addEventListener("click", startCards);
    $("refreshBtn").addEventListener("click", renderAll);
    try {
      state.decks = await Promise.all(games.map(loadDeck));
      state.items = state.decks.flatMap(d=>d.items);
      renderAll();
    } catch(error) {
      $("workspace").textContent = error.message || "Could not load review data.";
    }
  }
  function dueItems(){
    const now = Date.now();
    return state.items.filter(item => {
      const card = cardFor(item);
      return card && card.due <= now;
    }).sort((a,b)=>(cardFor(a).due||0)-(cardFor(b).due||0));
  }
  function missedItems(){
    return state.items.filter(missedFor);
  }
  function weakItems(){
    return state.items
      .map(item=>({item, stat:statFor(item)}))
      .filter(row=>row.stat.wrong > 0 || row.stat.attempts === 0)
      .sort((a,b)=>{
        const aw = a.stat.wrong * 3 - a.stat.correct;
        const bw = b.stat.wrong * 3 - b.stat.correct;
        return bw - aw;
      })
      .map(row=>row.item);
  }
  function uniqueItems(items){
    const seen = new Set();
    return items.filter(item=>!seen.has(item.game.saveKey + ":" + item.id) && seen.add(item.game.saveKey + ":" + item.id));
  }
  function dailyItems(){
    const priority = uniqueItems([...dueItems(), ...missedItems(), ...weakItems()]);
    const fresh = shuffle(state.items.filter(item=>statFor(item).attempts === 0));
    const filler = shuffle(state.items);
    return uniqueItems([...priority.slice(0,14), ...fresh, ...filler]).slice(0,20);
  }
  function aggregate(){
    const due = dueItems().length;
    const missed = missedItems().length;
    let attempts = 0, correct = 0, wrong = 0, cards = 0;
    state.items.forEach(item=>{
      const s = statFor(item);
      attempts += Number(s.attempts || 0);
      correct += Number(s.correct || 0);
      wrong += Number(s.wrong || 0);
      if (cardFor(item)) cards++;
    });
    return {due, missed, attempts, correct, wrong, cards, pct:attempts ? Math.round(correct/attempts*100) : 0};
  }
  function weakByGame(){
    return games.map(game=>{
      const save = readSave(game);
      const stats = Object.values(save.stats || {});
      const wrong = stats.reduce((n,s)=>n+Number(s.wrong||0),0);
      const correct = stats.reduce((n,s)=>n+Number(s.correct||0),0);
      const missed = Object.keys(save.missed || {}).length;
      const score = wrong * 2 + missed - correct * .25;
      return {game, wrong, correct, missed, score};
    }).filter(row=>row.wrong || row.missed).sort((a,b)=>b.score-a.score).slice(0,8);
  }
  function renderAll(){
    const a = aggregate();
    $("summary").innerHTML = `
      <div class="metric"><b>${a.due}</b><span>cards due now</span></div>
      <div class="metric"><b>${a.missed}</b><span>missed or shaky items</span></div>
      <div class="metric"><b>${a.pct}%</b><span>overall answered accuracy</span></div>
      <div class="metric"><b>${a.attempts}</b><span>total attempts tracked</span></div>`;
    renderWeak();
    $("workspace").innerHTML = `<div class="mini">Today's 20 is ready. It prioritizes due cards, missed items, weak areas, then fresh questions.</div>`;
  }
  function renderWeak(){
    const rows = weakByGame();
    if (!rows.length) {
      $("weak").innerHTML = `<div class="mini">No weak areas yet. Play a few games or start Today's 20.</div>`;
      return;
    }
    const max = Math.max(...rows.map(r=>r.score),1);
    $("weak").innerHTML = `<div class="weak-list">${rows.map(r=>`
      <div class="weak-row">
        <div>
          <b>${r.game.title}</b>
          <div class="mini">${r.game.deck} - ${r.missed} saved - ${r.wrong} wrong</div>
          <div class="bar"><span style="width:${Math.max(7,Math.round(r.score/max*100))}%"></span></div>
        </div>
        <a class="btn" href="${r.game.file}">Open</a>
      </div>`).join("")}</div>`;
  }
  function startDaily(){
    const items = dailyItems();
    if (!items.length) return;
    state.session = {mode:"daily", items, i:0, correct:0, responses:[], answered:false};
    renderQuestion();
  }
  function startCards(){
    const items = uniqueItems([...dueItems(), ...missedItems()]);
    if (!items.length) {
      $("workspace").innerHTML = `<div class="mini">No cards are due. Miss or mark items unsure inside any game to build this queue.</div>`;
      return;
    }
    state.session = {mode:"cards", items:items.slice(0,30), i:0, correct:0, responses:[], revealed:false};
    renderCard();
  }
  function renderQuestion(){
    const s = state.session;
    if (!s || s.i >= s.items.length) return results();
    const item = s.items[s.i];
    const order = shuffle(item.c.map((text,idx)=>({text,idx})));
    s.order = order;
    s.correctPos = order.findIndex(o=>o.idx === item.a);
    s.answered = false;
    $("workspace").innerHTML = `<div class="question">
      <div class="quiz-head"><span>Q ${s.i+1} / ${s.items.length}</span><span>${item.game.title}</span></div>
      <span class="tag">${item.game.deck}</span>
      <div class="stem">${item.q}</div>
      <div class="choices">${order.map((o,i)=>`<button class="choice" data-pos="${i}"><b>${String.fromCharCode(65+i)}.</b> ${o.text}</button>`).join("")}</div>
      <div id="post"></div>
    </div>`;
    document.querySelectorAll(".choice").forEach(btn=>btn.addEventListener("click",()=>answerQuestion(Number(btn.dataset.pos))));
  }
  function recordAttempt(item, correct){
    const save = readSave(item.game);
    save.stats = save.stats || {};
    const stat = save.stats[item.id] || {attempts:0,correct:0,wrong:0,streak:0};
    stat.attempts += 1;
    if (correct) { stat.correct += 1; stat.streak += 1; }
    else { stat.wrong += 1; stat.streak = 0; save.missed = save.missed || {}; save.missed[item.id] = (save.missed[item.id] || 0) + 1; addCard(save,item,"again"); }
    stat.last = new Date().toISOString();
    save.stats[item.id] = stat;
    writeSave(item.game, save);
  }
  function addCard(save, item, grade){
    save.cards = save.cards || {};
    const now = Date.now();
    const card = save.cards[item.id] || {reps:0,lapses:0,ease:2.2,due:now};
    if (grade === "again") { card.lapses += 1; card.due = now + 60*60*1000; }
    else if (grade === "hard") { card.reps += 1; card.due = now + 24*60*60*1000; }
    else { card.reps += 1; card.due = now + (card.reps <= 1 ? 3 : Math.min(14, Math.round(3 * card.reps * card.ease))) * 24*60*60*1000; }
    card.lastGrade = grade;
    card.last = new Date(now).toISOString();
    save.cards[item.id] = card;
  }
  function answerQuestion(pos){
    const s = state.session;
    if (!s || s.answered) return;
    s.answered = true;
    const item = s.items[s.i];
    const correct = pos === s.correctPos;
    if (correct) s.correct += 1;
    recordAttempt(item, correct);
    document.querySelectorAll(".choice").forEach((btn,i)=>{
      btn.disabled = true;
      if (i === s.correctPos) btn.classList.add("correct");
      if (i === pos && !correct) btn.classList.add("wrong");
    });
    $("post").innerHTML = `<div class="explain">
      <b>${correct ? "Correct" : "Review"}</b><br>${item.why}
      ${item.p ? `<div class="mini">${item.p}</div>` : ""}
      ${correct ? "" : reasonMarkup(item)}
    </div>
    <button class="primary" id="nextBtn">${s.i+1 >= s.items.length ? "Finish" : "Next"}</button>`;
    $("nextBtn").addEventListener("click",()=>{ s.i++; renderQuestion(); });
  }
  function reasonMarkup(item){
    return `<div class="reason-row">${reasons.map(r=>`<button data-reason="${r[0]}" data-game="${item.game.saveKey}" data-id="${item.id}">${r[1]}</button>`).join("")}</div>`;
  }
  document.addEventListener("click", event=>{
    const btn = event.target.closest("[data-reason]");
    if (!btn) return;
    const game = games.find(g=>g.saveKey === btn.dataset.game);
    if (!game) return;
    const save = readSave(game);
    save.missReasons = save.missReasons || {};
    save.missReasons[btn.dataset.id] = save.missReasons[btn.dataset.id] || {};
    save.missReasons[btn.dataset.id][btn.dataset.reason] = (save.missReasons[btn.dataset.id][btn.dataset.reason] || 0) + 1;
    writeSave(game, save);
    btn.textContent = "Saved";
    btn.disabled = true;
  });
  function renderCard(){
    const s = state.session;
    if (!s || s.i >= s.items.length) return results();
    const item = s.items[s.i];
    const front = item.v || item.q;
    s.revealed = false;
    $("workspace").innerHTML = `<div class="question">
      <div class="quiz-head"><span>Card ${s.i+1} / ${s.items.length}</span><span>${item.game.title}</span></div>
      <span class="tag">${item.game.deck}</span>
      <div class="flash-front">${front}</div>
      <button class="primary" id="revealBtn">Reveal Answer</button>
      <div id="post"></div>
    </div>`;
    $("revealBtn").addEventListener("click",()=>revealCard());
  }
  function revealCard(){
    const s = state.session;
    const item = s.items[s.i];
    $("post").innerHTML = `<div class="flash-back">
      <b>Answer:</b> ${item.c[item.a]}<br>
      <b>Why:</b> ${item.why}
      ${item.p ? `<div class="mini">${item.p}</div>` : ""}
      <div class="reason-row">
        <button data-grade="again">Again - 1 hour</button>
        <button data-grade="hard">Hard - tomorrow</button>
        <button data-grade="good">Good - later</button>
      </div>
    </div>`;
    document.querySelectorAll("[data-grade]").forEach(btn=>btn.addEventListener("click",()=>gradeCard(btn.dataset.grade)));
  }
  function gradeCard(grade){
    const s = state.session;
    const item = s.items[s.i];
    const save = readSave(item.game);
    addCard(save,item,grade);
    if (grade === "good" && save.missed) delete save.missed[item.id];
    writeSave(item.game, save);
    if (grade === "good") s.correct += 1;
    s.i += 1;
    renderCard();
  }
  function results(){
    const s = state.session;
    const pct = s.items.length ? Math.round(s.correct/s.items.length*100) : 0;
    $("workspace").innerHTML = `<div class="question">
      <h2>${s.mode === "cards" ? "Cards Complete" : "Daily Block Complete"}</h2>
      <p class="sub">${s.correct} of ${s.items.length} strong (${pct}%).</p>
      <div class="actions"><button class="primary" id="againBtn">Run Another</button><button id="doneBtn">Back to Summary</button></div>
    </div>`;
    $("againBtn").addEventListener("click",()=>s.mode === "cards" ? startCards() : startDaily());
    $("doneBtn").addEventListener("click",renderAll);
    renderWeak();
  }

  init();
})();
