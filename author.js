(function(){
  const form = document.getElementById("form");
  const out = document.getElementById("output");
  const checks = document.getElementById("checks");
  const select = form.elements.game;
  (window.STEP1_GAMES || []).forEach(game=>{
    const opt = document.createElement("option");
    opt.value = game.file;
    opt.textContent = `${game.title} - ${game.deck}`;
    select.appendChild(opt);
  });

  function escapeObject(value){
    return String(value || "").replace(/\s+/g," ").trim();
  }
  function makeObject(){
    const q = {
      m:escapeObject(form.elements.mode.value || "misc"),
      q:escapeObject(form.elements.question.value),
      c:[
        escapeObject(form.elements.correct.value),
        escapeObject(form.elements.d1.value),
        escapeObject(form.elements.d2.value),
        escapeObject(form.elements.d3.value)
      ],
      a:0,
      why:escapeObject(form.elements.why.value)
    };
    const pearl = escapeObject(form.elements.pearl.value);
    const vignette = escapeObject(form.elements.vignette.value);
    if (pearl) q.p = pearl;
    if (vignette) q.v = vignette;
    return q;
  }
  function leakCheck(q){
    const answer = q.c[0];
    const stem = `${q.q} ${q.v || ""}`.toLowerCase();
    const exact = answer && stem.includes(answer.toLowerCase());
    const tooShort = q.q.length < 40;
    const dupes = new Set(q.c.map(x=>x.toLowerCase())).size !== q.c.length;
    return {exact, tooShort, dupes};
  }
  function render(){
    const q = makeObject();
    const issues = leakCheck(q);
    const bad = issues.exact || issues.tooShort || issues.dupes;
    checks.className = bad ? "check bad" : "check";
    checks.innerHTML = [
      issues.exact ? "Answer appears in the stem or vignette." : "No exact answer leak found.",
      issues.tooShort ? "Stem may be too short for Step-style transfer." : "Stem length looks usable.",
      issues.dupes ? "Two answer choices are duplicates." : "Answer choices are distinct."
    ].join("<br>");
    out.textContent = JSON.stringify(q, null, 2).replace(/\n/g,"").replace(/\s{2,}/g," ");
  }
  form.addEventListener("input", render);
  form.addEventListener("submit", event=>{ event.preventDefault(); render(); });
  document.getElementById("copyBtn").addEventListener("click", async ()=>{
    await navigator.clipboard.writeText(out.textContent);
    document.getElementById("copyBtn").textContent = "Copied";
    setTimeout(()=>document.getElementById("copyBtn").textContent = "Copy Object",900);
  });
  render();
})();
