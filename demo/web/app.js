/* Demo UI. No build step, no libraries. Talks to server/app.py (/api/*).
   Graph pictures come from Neo4j Browser (iframe via the :8801 re-serving proxy). */
const S = { cfg: null, tab: "overview", step: "collect", art: {}, devOn: false, dev: null };
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tag = (t, c = "gray") => `<span class="tag ${c}">${esc(t)}</span>`;
const list = (v) => (Array.isArray(v) ? v.join(", ") : v ?? "");
const rowsText = (rows) => !rows || !rows.length ? '<span class="empty">답 없음</span>'
  : rows.map((r) => Object.entries(r).filter(([, v]) => v !== null && !(Array.isArray(v) && !v.length))
      .map(([k, v]) => `<span class="sub">${esc(k)}</span> ${esc(list(v))}`).join(" · ")).join("<br>");

async function api(path, body) {
  const r = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}
function busy(on, text = "실행 중…") { $("#busy").textContent = text; $("#busy").classList.toggle("on", on); }
function showError(e) { $("#view").insertAdjacentHTML("afterbegin", `<div class="err">${esc(e.message || e)}</div>`); }

/* ------------------------------------------------------------ boot */
async function boot() {
  S.cfg = await api("/api/config");
  $("#llm-mode").value = S.cfg.llm.mode === "live" ? "live" : "replay";
  renderStatus();
  const tabs = [["overview", "개요 · 기준 KG"], ...S.cfg.inputs.map((i) => [i.id, i.label]), ["compare", "비교 · 결과"]];
  $("#tabs").innerHTML = tabs.map(([id, l]) => `<button data-tab="${id}">${esc(l)}</button>`).join("");
  $("#tabs").onclick = (e) => { const b = e.target.closest("button"); if (b) selectTab(b.dataset.tab); };
  initLayout();
  try { S.devOn = localStorage.getItem("demo-dev") === "1"; } catch (e) { /* private mode */ }
  $("#btn-dev").onclick = toggleDev;
  document.addEventListener("keydown", (e) => { if ((e.key === "d" || e.key === "D") && !e.target.closest("input,select,textarea")) toggleDev(); });
  if (S.devOn) await loadDev();
  $("#btn-dev").setAttribute("aria-pressed", S.devOn);
  $("#btn-reset").onclick = doReset;
  renderGraphBar();
  selectTab("overview");
}

function renderStatus() {
  const n = S.cfg.neo4j, l = S.cfg.llm;
  $("#st-neo4j").className = "pill " + (n.ok ? "ok" : "bad");
  $("#st-neo4j").innerHTML = `<i class="dot"></i>Neo4j ${n.ok ? `${esc(n.version)} ${esc(n.edition)} · 노드 ${n.nodes}` : "연결 안 됨"}`;
  $("#st-llm").className = "pill " + (l.server_up ? "ok" : "warn");
  $("#st-llm").innerHTML = `<i class="dot"></i>LLM ${esc(l.base_url)} · ${l.server_up ? "응답함" : "응답 없음 (재생만 가능)"}`;
}

async function refreshCfg() { S.cfg = await api("/api/config"); renderStatus(); }

async function doReset() {
  if (!confirm("그래프를 기준 상태(run 0)로 되돌리고 단계 결과를 지웁니다. 계속할까요?")) return;
  busy(true, "초기화 중…");
  try { await api("/api/reset", {}); S.art = {}; await refreshCfg(); selectTab(S.tab); }
  catch (e) { showError(e); } finally { busy(false); }
}

/* ------------------------------------------------------------ tabs & steps */
async function selectTab(tab) {
  S.tab = tab;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  const isInput = S.cfg.inputs.some((i) => i.id === tab);
  $("#stepper").style.display = isInput ? "flex" : "none";
  if (tab === "overview") return renderOverview();
  if (tab === "compare") return renderCompare();
  await loadArtifacts(tab);
  const done = S.cfg.steps.map((s) => s.id).filter((s) => S.art[tab]?.[s]);
  S.step = done.length ? done[done.length - 1] : "collect";
  renderStepper(); renderStep();
}

async function loadArtifacts(input) {
  S.art[input] = S.art[input] || {};
  for (const s of S.cfg.steps) {
    if (S.art[input][s.id]) continue;
    try { S.art[input][s.id] = await api(`/api/artifact?input=${input}&step=${s.id}`); } catch { /* not run yet */ }
  }
}

function renderStepper() {
  const a = S.art[S.tab] || {};
  const steps = S.cfg.steps;
  const nextIdx = steps.findIndex((s) => !a[s.id]);
  $("#stepper").innerHTML = steps.map((s, i) =>
    `${i ? '<span class="arrow">→</span>' : ""}<button class="st ${a[s.id] ? "done" : ""} ${S.step === s.id ? "cur" : ""}" data-step="${s.id}">
       <span class="n">${i + 1}</span>${esc(s.label)}</button>`).join("") +
    `<div class="actions">
       <button class="btn primary" id="btn-next" ${nextIdx < 0 ? "disabled" : ""}>${nextIdx < 0 ? "모든 단계 완료" : `${esc(steps[nextIdx].label)} 실행 ▶`}</button>
       <button class="btn" id="btn-all" ${nextIdx < 0 ? "disabled" : ""}>끝까지 실행</button>
       <button class="btn ghost" id="btn-rerun" title="현재 단계를 다시 실행">현재 단계 다시</button>
     </div>`;
  $("#stepper").querySelectorAll(".st").forEach((b) => b.onclick = () => {
    const sid = b.dataset.step;
    if (a[sid]) { S.step = sid; renderStepper(); renderStep(); }
  });
  if (nextIdx >= 0) {
    $("#btn-next").onclick = () => runStep(steps[nextIdx].id);
    $("#btn-all").onclick = async () => { for (const s of steps.slice(nextIdx)) if (!(await runStep(s.id))) break; };
  }
  $("#btn-rerun").onclick = () => runStep(S.step);
}

async function runStep(step) {
  busy(true, `${S.cfg.steps.find((s) => s.id === step).label} 실행 중…`);
  try {
    const out = await api("/api/run", { input: S.tab, step, llm_mode: $("#llm-mode").value });
    S.art[S.tab][step] = out;
    const order = S.cfg.steps.map((s) => s.id);
    for (const later of order.slice(order.indexOf(step) + 1)) delete S.art[S.tab][later];  // later steps are stale
    S.step = step;
    if (step === "collect" || step === "load") await refreshCfg();
    renderStepper(); renderStep();
    if (step === "load") showView("document");
    return true;
  } catch (e) { renderStep(); showError(e); return false; } finally { busy(false); }
}

function renderStep() {
  const a = S.art[S.tab]?.[S.step];
  const R = { collect: vCollect, clean: vClean, extract: vExtract, resolve: vResolve, validate: vValidate, load: vLoad }[S.step];
  $("#view").innerHTML = a ? R(a) : `<div class="card"><p class="empty">아직 실행하지 않은 단계입니다. 위의 실행 버튼을 누르세요.</p></div>`;
  addDev(S.step);
  renderOverlay();
}

/* ------------------------------------------------------------ helpers for highlighting */
function highlight(text, spans) {
  // spans: [{start,end,cls,title}] non-overlapping
  spans = spans.filter((s) => s.start >= 0).sort((a, b) => a.start - b.start);
  let out = "", i = 0;
  for (const s of spans) {
    if (s.start < i) continue;
    out += esc(text.slice(i, s.start)) + `<mark class="${s.cls || ""}" title="${esc(s.title || "")}">${esc(text.slice(s.start, s.end))}</mark>`;
    i = s.end;
  }
  return out + esc(text.slice(i));
}
function decisionTag(d) {
  const m = { same: ["같음", "mint"], new: ["새 개체", "blue"], review: ["검토", "orange"], nil: ["미연결", "red"],
    approve: ["승인", "mint"], hold: ["보류", "orange"], reject: ["거절", "red"], question: ["질문 큐", "purple"],
    term_candidate: ["용어 후보", "purple"], drop: ["제외", "gray"], new_entity: ["새 개체", "blue"], resolved_by_link: ["연결로 해결", "mint"] };
  const [t, c] = m[d] || [d, "gray"];
  return tag(t, c);
}
const scoreBar = (v) => `<span class="score"><i style="width:${Math.round((v || 0) * 100)}%"></i></span><span class="mono small">${(v ?? 0).toFixed(2)}</span>`;

/* ------------------------------------------------------------ step views */
function vCollect(a) {
  const r = a.record;
  return `<h2>1 · 수집</h2><p class="lead">원본을 그대로 보관하고, 어디서 · 언제 · 어떤 버전을 받았는지 기록합니다.</p>
  <div class="cols"><div class="card"><h4>원본 (수정하지 않음) · ${esc(r.file)}</h4><pre class="raw">${esc(a.raw)}</pre></div>
  <div><div class="card"><h4>수집 기록</h4><div class="kv">
    ${Object.entries(r).map(([k, v]) => `<span class="k">${esc(k)}</span><span class="${k === "sha256" ? "mono small" : ""}">${esc(v)}</span>`).join("")}
  </div></div>
  <div class="card"><h4>머리말 메타데이터</h4><pre class="raw">${esc(JSON.stringify(a.meta, null, 2))}</pre></div>
  <div class="card small sub">같은 파일을 다시 받으면 해시가 같아 같은 버전으로 봅니다 (unchanged_since_last). 내용이 바뀌면 version이 올라갑니다.</div></div></div>`;
}

function vClean(a) {
  const isStt = a.kind === "meeting_stt";
  const lines = a.lines.filter((l) => l.status !== "blank").map((l) => {
    const removed = l.status === "removed";
    const txt = isStt ? `${l.ts ? `[${l.ts}] ` : ""}${l.speaker_label || ""}${l.speaker ? ` → ${l.speaker}` : ""}: ${l.cleaned ?? l.text}` : l.text;
    const toks = (l.removed_tokens || []).length ? ` ${tag("지움: " + l.removed_tokens.join(" · "), "orange")}` : "";
    return `<div class="line"><span class="ln">${l.n}</span><span class="tx ${removed ? "strike" : ""}">${esc(isStt ? l.text : txt)}</span>
      <span class="rs">${removed ? tag(l.reason, "red") : ""}${toks}</span></div>`;
  }).join("");
  const mByChunk = {};
  a.mentions.forEach((m) => (mByChunk[m.chunk_id] = mByChunk[m.chunk_id] || []).push({ start: m.start, end: m.end, cls: m.ambiguous ? "amb" : "", title: m.refs.join(" / ") }));
  const chunks = a.chunks.map((c) => `<div class="chunk"><div class="cid">${esc(c.chunk_id)}${c.speaker ? ` · ${esc(c.speaker)} · ${esc(c.ts)}` : ""}</div>${highlight(c.text, mByChunk[c.chunk_id] || [])}</div>`).join("");
  const norms = a.normalizations.map((n) => `<tr><td>${esc(n.surface)}</td><td>${esc(n.result)}</td><td>${tag(n.method, n.method.startsWith("발음") ? "blue" : n.method.includes("동음") ? "orange" : n.method.startsWith("규칙") ? "purple" : "mint")}</td><td class="sub small">${esc(n.note || "")}</td></tr>`).join("");
  const near = a.near_misses.map((n) => `<tr><td class="mono">${esc(n.surface)}</td><td>${n.similar.map((s) => `${esc(s.alias)} <span class="mono small sub">${s.score}</span>`).join(", ")}</td><td class="small">${esc(n.note)}</td></tr>`).join("");
  return `<h2>2 · 정제</h2><p class="lead">${isStt ? "화자를 사람으로 바꾸고, 간투사 · 반복 · 불명확 구간을 지우고, 한글로 적힌 영문 약어를 되돌립니다." : "회신 체인 · 인용 · 서명 · 고지문을 지웁니다. 지우지 않으면 같은 사실이 회신 수만큼 추출됩니다."}</p>
  <div class="cols"><div class="card"><h4>원문 · 지운 줄과 이유 (${a.stats.removed}/${a.stats.lines})</h4>${lines}</div>
  <div><div class="card"><h4>정제본 · 조각 ${a.chunks.length}개 <span class="small sub">(초록: 사전에서 찾은 언급, 주황: 동음 후보 여럿)</span></h4>${chunks}</div>
  <div class="card"><h4>정규화 표</h4><table><tr><th>원문</th><th>결과</th><th>방법</th><th>메모</th></tr>${norms || `<tr><td class="empty" colspan="4">없음</td></tr>`}</table></div>
  ${near ? `<div class="card"><h4>비슷하지만 다른 코드</h4><table><tr><th>언급</th><th>비슷한 것</th><th></th></tr>${near}</table></div>` : ""}</div></div>`;
}

function vExtract(a) {
  const cl = S.art[S.tab].clean;
  const evBy = {};
  a.facts.forEach((f) => {
    const c = cl?.chunks.find((x) => x.chunk_id === f.chunk_id);
    if (!c) return;
    const ev = (f.evidence || "").replace(/\.$/, "");
    const i = c.text.indexOf(ev);
    if (i >= 0) (evBy[c.chunk_id] = evBy[c.chunk_id] || []).push({ start: i, end: i + ev.length, cls: "ev", title: f.fact_id });
  });
  const chunks = (cl?.chunks || []).map((c) => `<div class="chunk"><div class="cid">${esc(c.chunk_id)}</div>${highlight(c.text, evBy[c.chunk_id] || [])}</div>`).join("");
  const facts = a.facts.map((f) => `<tr><td class="mono">${f.fact_id}</td><td>${esc(f.subject)} <span class="sub small">${esc(f.subject_class || "")}</span></td>
    <td class="mono" style="color:var(--purple)">${esc(f.predicate)}</td>
    <td>${esc(f.object ?? f.value ?? "")}${f.props && Object.keys(f.props).length ? ` <span class="sub small">${esc(JSON.stringify(f.props))}</span>` : ""}</td>
    <td>${f.certainty === "confirmed" ? tag("확정", "mint") : tag("추정", "orange")}</td>
    <td class="small">${esc(f.evidence)}${f.new_entity_name ? `<br>${tag("새 이름 제안: " + f.new_entity_name, "blue")}` : ""}</td></tr>`).join("");
  const oo = a.out_of_ontology.map((o) => `<tr><td>${esc(o.subject)}</td><td>${esc(o.relation_phrase)}</td><td>${esc(o.object)}</td><td class="mono">${esc(o.suggested_relation)}</td></tr>`).join("");
  const unk = a.unknown_terms.map((t) => `${tag(t.term + " · " + (t.guess_class || ""), "purple")}`).join(" ");
  const ref = a.unresolved_references.map((q) => `<tr><td>${esc(q.text)}</td><td class="small">${esc(q.why)}</td></tr>`).join("");
  const L = a.llm;
  return `<h2>3 · 추출</h2><p class="lead">LLM이 온톨로지의 관계 목록 안에서만 사실 후보를 뽑습니다. 목록 밖의 관계와 모르는 용어는 버리지 않고 따로 모읍니다.</p>
  <div class="card small">${tag(L.mode === "live" ? "실시간 호출" : "이전 호출 재생", L.mode === "live" ? "mint" : "blue")}
    모델 <span class="mono">${esc(L.model)}</span> · ${esc(L.base_url || "")} · ${esc(L.seconds)}초 · 호출 시각 ${esc(L.recorded_at)} · 프롬프트 ${esc(a.prompt_version)}
    ${L.prompt_changed ? tag("프롬프트가 저장 이후 바뀜 — 실시간 호출로 다시 호출해 저장하세요", "orange") : ""}
    <details style="margin-top:6px"><summary>프롬프트 보기</summary><pre class="raw">${esc(a.prompt.system)}\n\n---- user ----\n${esc(a.prompt.user)}</pre></details></div>
  <div class="cols" style="margin-top:12px"><div class="card"><h4>정제본 · 파란 밑줄 = 사실의 근거 구절</h4>${chunks}</div>
  <div><div class="card"><h4>사실 후보 ${a.facts.length}개</h4><table><tr><th></th><th>주어</th><th>관계</th><th>목적어 · 값</th><th>확신도</th><th>근거</th></tr>${facts}</table></div>
  <div class="card"><h4>온톨로지 밖 관계</h4>${oo ? `<table><tr><th>주어</th><th>표현</th><th>대상</th><th>제안 이름</th></tr>${oo}</table>` : '<p class="empty">없음</p>'}</div>
  <div class="card"><h4>모르는 용어</h4>${unk || '<p class="empty">없음</p>'}</div>
  <div class="card"><h4>대상을 알 수 없는 표현</h4>${ref ? `<table>${ref}</table>` : '<p class="empty">없음</p>'}</div></div></div>`;
}

function vResolve(a) {
  const roleKo = { subject: "주어", object: "목적어", oo_subject: "밖-주어", oo_object: "밖-대상", term: "용어", reference: "지시어" };
  const rows = a.links.map((l) => `<tr><td class="mono small">${l.link_id}<br><span class="sub">${esc(l.owner)} ${roleKo[l.role] || l.role}</span></td>
    <td>${esc(l.surface)}${l.class_hint ? ` <span class="sub small">${esc(l.class_hint)}</span>` : ""}</td>
    <td>${decisionTag(l.decision)}</td><td>${l.uid ? `${esc(l.name || "")}<br><span class="mono small sub">${esc(l.uid)}</span>` : '<span class="sub">-</span>'}</td>
    <td>${scoreBar(l.score)}</td><td class="small">${(l.reasons || []).map(esc).join("<br>")}
    ${(l.alternatives || []).length ? `<br><span class="sub">다른 후보: ${l.alternatives.map((x) => `${esc(x.name)} ${x.score}`).join(", ")}</span>` : ""}</td></tr>`).join("");
  const st = a.stats;
  return `<h2>4 · 연결 (Entity resolution)</h2><p class="lead">텍스트 표현을 그래프의 개체 ID로 연결합니다. 점수 ${a.thresholds.accept} 이상은 같음, ${a.thresholds.review}–${a.thresholds.accept}는 사람 검토, 그 아래는 연결하지 않습니다.</p>
  <div class="checks">${Object.entries(st).map(([k, v]) => `${decisionTag(k)} <b>${v}</b>`).join(" &nbsp; ")}</div>
  <div class="card"><table><tr><th></th><th>표현</th><th>판정</th><th>개체</th><th>점수</th><th>근거</th></tr>${rows}</table></div>
  <div class="card small sub">증거 순서: 정확한 별칭 → 주변 문장의 맥락 단어(동음 후보) → 회사 이름으로 제품 지칭 → 문자열 유사도. 코드(H20 · H200)는 유사도만으로 확정하지 않습니다. 애매하면 합치지 않고 검토로 남깁니다.</div>`;
}

function vValidate(a) {
  const ck = (c) => `<span class="chk ${c.ok === true ? "ok" : c.ok === false ? "no" : "q"}" title="${esc(c.detail)}">${c.ok === true ? "✓" : c.ok === false ? "✗" : "?"} ${esc(c.name)}</span>`;
  const facts = a.results.map((r) => {
    const f = r.fact, s = r.subject, o = r.object;
    return `<div class="card"><div class="factline"><span class="mono sub">${r.fact_id}</span> ${esc(s?.name || f.subject)}<span class="p">${esc(f.predicate)}</span>${esc(o ? (o.name || f.object) : f.value)}
      &nbsp; ${decisionTag(r.decision)} <span class="small">${esc(r.reason)}</span> ${r.risk === "high" ? tag("고위험 관계", "red") : ""}</div>
      <div class="checks">${r.checks.map(ck).join("")}</div>
      <div class="small sub">${r.checks.map((c) => `${esc(c.name)}: ${esc(c.detail)}`).join(" · ")}</div></div>`;
  }).join("");
  const oc = a.ontology_candidates.map((c) => `<tr><td class="mono">${esc(c.name)}</td><td>${esc(c.between.join(" · "))}</td><td>${esc(c.topic)}</td>
    <td class="small">${c.sources.length ? `기사 ${esc(c.sources.join(", "))} (기사 표기: ${esc(c.corpus_names.join(", "))})` : "기사 근거 없음"}</td></tr>`).join("");
  const tc = a.term_candidates.map((t) => `<tr><td>${esc(t.term)}</td><td>${decisionTag(t.decision)}</td><td class="small">${esc(t.reason)}</td></tr>`).join("");
  const qs = a.questions.map((q) => `<tr><td>${esc(q.text)}</td><td>${decisionTag(q.decision)}</td><td class="small">${esc(q.reason)}</td></tr>`).join("");
  const lx = a.lexicon_candidates.map((l) => `<tr><td>${esc(l.spoken)}</td><td>${esc(l.pref)}</td><td class="mono small">${esc(l.ref)}</td></tr>`).join("");
  return `<h2>5 · 검증</h2><p class="lead">스키마 · 개체 연결 · 근거 문장 · 기사 대조 · 확신도를 보고 승인 / 보류 / 거절을 정합니다. 추정은 근거가 있어도 확정으로 올리지 않습니다.</p>
  <div class="checks">${Object.entries(a.summary).map(([k, v]) => `${decisionTag(k)} <b>${v}</b>`).join(" &nbsp; ")}</div>
  ${facts}
  <div class="cols" style="margin-top:12px"><div>
    <div class="card"><h4>온톨로지 변경 후보 · 관계</h4>${oc ? `<table><tr><th>제안 이름</th><th>사이</th><th>대상</th><th>근거</th></tr>${oc}</table>` : '<p class="empty">없음</p>'}</div>
    <div class="card"><h4>용어</h4>${tc ? `<table>${tc}</table>` : '<p class="empty">없음</p>'}</div></div>
  <div><div class="card"><h4>질문 큐</h4>${qs ? `<table>${qs}</table>` : '<p class="empty">없음</p>'}</div>
    <div class="card"><h4>동의어 후보 (STT 발음 → 표준어)</h4>${lx ? `<table><tr><th>들린 말</th><th>표준어</th><th>개체</th></tr>${lx}</table>` : '<p class="empty">없음</p>'}</div></div></div>`;
}

function vLoad(a) {
  const opKo = { create_node: "노드 생성", create_chunk: "조각 생성", mention: "언급 연결", set_status: "상태 변경", create_rel: "관계 생성",
    add_source: "근거 추가", review: "검토 항목", candidate: "온톨로지 후보", noop: "변경 없음" };
  const rows = a.plan.filter((o) => o.op !== "create_chunk" && o.op !== "mention").map((o) =>
    `<tr class="${o.change ? "" : "removed"}"><td>${tag(opKo[o.op] || o.op, o.change ? (o.op === "review" || o.op === "candidate" ? "orange" : "mint") : "gray")}</td>
     <td class="small">${esc(o.target)}</td><td class="small">${esc(o.detail)}</td><td class="mono small sub">${esc(o.cypher)}</td></tr>`).join("");
  const nChunk = a.plan.filter((o) => o.op === "create_chunk").length, nMen = a.plan.filter((o) => o.op === "mention").length;
  return `<h2>6 · 적재</h2><p class="lead">먼저 변경 계획(staging)을 계산하고, 그대로 반영(publish)합니다. 같은 입력을 다시 넣으면 변경이 0이어야 합니다.</p>
  <div class="counters" style="grid-template-columns:repeat(4,1fr)">
    <div class="counter"><div class="v">${a.before.nodes} → ${a.after.nodes}</div><div class="l">노드</div></div>
    <div class="counter"><div class="v">${a.before.relationships} → ${a.after.relationships}</div><div class="l">관계</div></div>
    <div class="counter"><div class="v">${Object.values(a.counts).reduce((x, y) => x + y, 0)}</div><div class="l">반영한 변경</div></div>
    <div class="counter"><div class="v" style="color:${a.idempotent ? "var(--mint)" : "var(--red)"}">${a.rerun_changes}</div><div class="l">재실행 시 변경 ${a.idempotent ? "(멱등 ✓)" : "(멱등 아님)"}</div></div></div>
  <div class="card"><h4>변경 계획 · 문서 조각 ${nChunk}개 · 언급 연결 ${nMen}개는 접어 둠</h4>
  <table><tr><th>작업</th><th>대상</th><th>내용</th><th>Cypher (요약)</th></tr>${rows}</table></div>
  <div class="card small sub">노드는 키(uid)로 하나씩 MERGE한 뒤 관계를 MERGE합니다. 상태는 덮어쓰지 않고 이전 값을 status_prev에 남깁니다. 오른쪽 그래프 패널에서 "이 문서"를 눌러 Neo4j Browser로 확인하세요.</div>`;
}

/* ------------------------------------------------------------ overview & compare */
async function renderOverview() {
  $("#view").innerHTML = '<p class="sub">불러오는 중…</p>';
  try {
    const o = await api("/api/overview");
    const cls = Object.entries(o.ontology.classes).map(([k, v]) => tag(`${k} · ${v.label_ko}`, "mint")).join(" ");
    const rels = Object.entries(o.ontology.relations).map(([k, v]) => `<tr><td class="mono">${k}</td><td>${esc(v.from)} → ${esc(v.to)}</td><td>${esc(v.label_ko)}</td><td>${v.fact ? tag("추출 대상", "purple") : ""}</td></tr>`).join("");
    const arts = o.corpus.map((a) => `<tr><td class="mono">${a.id}</td><td>${a.baseline ? tag("기준 KG", "mint") : tag("새 기사 · 대조용", "blue")}</td><td>${esc(a.date)}</td>
      <td>${esc(a.title)}<br><span class="sub small">${esc(a.summary)}</span></td><td class="small"><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.publisher)}</a></td></tr>`).join("");
    const cq = (o.cq_run0 || []).map((q) => `<tr><td class="mono">${q.id}</td><td>${esc(q.question)}</td><td class="small">${rowsText(q.rows)}</td></tr>`).join("");
    $("#view").innerHTML = `<h2>기준 상태 (run 0)</h2><p class="lead">팀이 스크랩해 온 기사로 만든 KG입니다. 여기에 메일 1건과 STT 회의록 1건을 넣어 무엇이 달라지는지 봅니다.</p>
    <div class="counters" style="grid-template-columns:repeat(4,1fr)">
      <div class="counter"><div class="v">${o.neo4j.nodes ?? "-"}</div><div class="l">노드 (현재)</div></div>
      <div class="counter"><div class="v">${o.neo4j.relationships ?? "-"}</div><div class="l">관계 (현재)</div></div>
      <div class="counter"><div class="v">${o.entities}</div><div class="l">마스터 개체</div></div>
      <div class="counter"><div class="v">${o.corpus.filter((a) => a.baseline).length} + ${o.corpus.filter((a) => !a.baseline).length}</div><div class="l">기사 (기준 + 대조용)</div></div></div>
    <div class="cols"><div><div class="card"><h4>온톨로지 v${esc(o.ontology.version)} · 클래스</h4>${cls}</div>
      <div class="card"><h4>관계</h4><table>${rels}</table><p class="small sub">속성 사실: Product.status ∈ announced · sampling · mass_production. 회사 간 협력 관계는 v1에 없습니다.</p></div></div>
      <div><div class="card"><h4>업무 질문 (CQ) · run 0 답</h4><table>${cq || '<tr><td class="empty">초기화를 먼저 실행하세요</td></tr>'}</table></div></div></div>
    <div class="card"><h4>기사 코퍼스 (요약은 직접 작성 · 본문은 복제하지 않음)</h4><table><tr><th></th><th></th><th>날짜</th><th>내용</th><th>출처</th></tr>${arts}</table></div>`;
    addDev("overview"); showView("baseline"); renderOverlay();
  } catch (e) { $("#view").innerHTML = ""; showError(e); }
}

async function renderCompare() {
  $("#view").innerHTML = '<p class="sub">비교 계산 중…</p>';
  try {
    const c = await api("/api/compare");
    const g = c.graph;
    const tbl = (rows, cols) => rows.length ? `<table><tr>${cols.map((x) => `<th>${esc(x)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${cols.map((x) => `<td class="small">${esc(list(r[x]))}</td>`).join("")}</tr>`).join("")}</table>` : '<p class="empty">없음</p>';
    const cq = c.cq.map((q) => `<tr><td class="mono">${q.id}</td><td>${esc(q.question)}</td><td class="small">${rowsText(q.before)}</td>
      <td class="small">${JSON.stringify(q.before) !== JSON.stringify(q.after) ? tag("바뀜", "mint") + "<br>" : ""}${rowsText(q.after)}</td></tr>`).join("");
    const p = c.ontology.proposal;
    const v1rels = c.ontology.v1.relations.map((r) => tag(r, "gray")).join(" ");
    const addRel = p.relations_add.map((r) => `<tr><td class="mono">${tag("+ " + r.name, "orange")}</td><td>${esc(r.from)} → ${esc(r.to)}</td><td class="small">${esc(r.example)}<br><span class="sub">${esc(r.note)}</span></td></tr>`).join("");
    const addTerm = p.terms_add.map((t) => `<tr><td>${tag("+ " + t.term, "purple")}</td><td>${esc(t.guess_class)}</td><td class="small sub">${esc(t.seen_in)}</td></tr>`).join("");
    const addLab = p.hidden_labels_add.map((l) => `<tr><td>${esc(l.pref)}</td><td>${tag("+ hidden: " + l.hidden, "blue")}</td></tr>`).join("");
    $("#view").innerHTML = `<h2>비교 · 기준 상태(run 0) 대비</h2><p class="lead">메일과 STT 회의록을 넣은 뒤 그래프와 온톨로지가 어떻게 달라졌는지 봅니다. 온톨로지 변경은 제안일 뿐 자동 반영하지 않습니다.</p>
    <div class="counters">
      <div class="counter"><div class="v">${g.new_nodes.length}</div><div class="l">새 개체</div></div>
      <div class="counter"><div class="v">${g.changed.length}</div><div class="l">상태 변경</div></div>
      <div class="counter"><div class="v">${g.new_rels.length}</div><div class="l">새 관계</div></div>
      <div class="counter"><div class="v">${g.reviews.length}</div><div class="l">보류 · 질문</div></div>
      <div class="counter"><div class="v">${g.candidates.length}</div><div class="l">온톨로지 후보</div></div>
      <div class="counter"><div class="v">${g.stats.nodes}</div><div class="l">현재 노드</div></div></div>
    <div class="card"><h4>업무 질문 (CQ) 전 / 후</h4><table><tr><th></th><th>질문</th><th>run 0</th><th>지금</th></tr>${cq}</table></div>
    <div class="cols" style="margin-top:12px"><div>
      <div class="card"><h4>상태가 바뀐 사실</h4>${tbl(g.changed, ["이름", "이전", "현재", "근거"])}</div>
      <div class="card"><h4>새 관계</h4>${tbl(g.new_rels, ["주어", "관계", "목적어", "근거"])}</div>
      <div class="card"><h4>새 개체</h4>${tbl(g.new_nodes, ["클래스", "이름", "run"])}</div></div>
    <div><div class="card"><h4>보류 · 질문 (그래프의 ReviewItem)</h4>${tbl(g.reviews, ["종류", "내용", "사유"])}</div>
      <div class="card"><h4>온톨로지 v1 → v1.1 제안</h4><p class="small sub">v1 관계: ${v1rels}</p>
        <table>${addRel || '<tr><td class="empty">관계 추가 없음</td></tr>'}</table>
        <h4 style="margin-top:10px">용어</h4><table>${addTerm || '<tr><td class="empty">없음</td></tr>'}</table>
        <h4 style="margin-top:10px">동의어 (hidden label)</h4><table>${addLab || '<tr><td class="empty">없음</td></tr>'}</table>
        <p class="small sub">제안 파일: runs/ontology.v1.1.proposal.yaml · ${esc(p.status)}</p></div></div></div>`;
    addDev("compare"); showView("diff"); renderOverlay();
  } catch (e) { $("#view").innerHTML = ""; showError(e); }
}

/* ------------------------------------------------------------ Neo4j Browser panel */
function viewQuery(name) {
  let q = S.cfg.views[name] || "";
  const inp = S.cfg.inputs.some((i) => i.id === S.tab) ? S.tab : S.cfg.inputs[0].id;
  const doc = S.cfg.docs[inp] || "";
  return q.replace(/\$doc_id/g, `'${doc}'`).replace(/\$run_id/g, `'${inp}'`).trim();
}
function browserUrl(base, q) {
  const b = S.cfg.browser;
  return `${base}?dbms=${encodeURIComponent(b.bolt)}&db=${encodeURIComponent(b.database)}&cmd=edit&arg=${encodeURIComponent(q)}`;
}
function showView(name) {
  const q = viewQuery(name);
  $("#browser").src = browserUrl(S.cfg.browser.proxy, q);
  $("#graph-hint").innerHTML = `질의가 입력창에 채워집니다 — Browser에서 ▶(실행)을 누르세요. 처음 한 번은 로그인이 필요합니다.
    · <a href="${esc(browserUrl(S.cfg.browser.direct, q))}" target="_blank" rel="noopener">새 탭에서 열기</a>`;
  document.querySelectorAll("#graph-bar [data-view]").forEach((b) => b.classList.toggle("primary", b.dataset.view === name));
}
function renderGraphBar() {
  const v = [["baseline", "기준 KG"], ["document", "이 문서"], ["diff", "변화 (색 표시)"], ["diff_rels", "이 입력의 새 관계"]];
  $("#graph-bar").innerHTML = `<b>Neo4j Browser</b>` + v.map(([k, l]) => `<button class="btn" data-view="${k}">${l}</button>`).join("");
  $("#graph-bar").onclick = (e) => {
    const b = e.target.closest("[data-view]");
    if (b) return showView(b.dataset.view);
  };
}

/* ------------------------------------------------------------ layout modes
   설명(text) : explanation only · 나란히(split) : both, splitter-resizable · 그래프(graph) : graph full width
   with the current step's summary floating on top. Default = split with the graph at ~62%.
   The explanation column switches to one column when narrow (CSS container query), so text stays readable. */
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const DEFAULT_LEFT = 38;
function setMode(mode) {
  S.mode = mode;
  const L = $("#layout");
  L.classList.toggle("m-text", mode === "text");
  L.classList.toggle("m-graph", mode === "graph");
  document.querySelectorAll("#layout-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
  store.set("eb.mode", mode);
  renderOverlay();
}
function setLeft(pct) {
  pct = Math.max(22, Math.min(70, pct));
  $("#layout").style.setProperty("--left", pct + "%");
  store.set("eb.left", String(Math.round(pct)));
}
function initLayout() {
  setLeft(Number(store.get("eb.left", DEFAULT_LEFT)));
  setMode(store.get("eb.mode", "split"));
  $("#layout-mode").onclick = (e) => { const b = e.target.closest("[data-mode]"); if (b) setMode(b.dataset.mode); };
  const sp = $("#splitter"), L = $("#layout");
  sp.onpointerdown = (e) => {
    e.preventDefault(); sp.setPointerCapture(e.pointerId); sp.classList.add("drag"); L.classList.add("dragging");
    const r = L.getBoundingClientRect();
    sp.onpointermove = (m) => setLeft(((m.clientX - r.left) / r.width) * 100);
    sp.onpointerup = () => { sp.onpointermove = null; sp.classList.remove("drag"); L.classList.remove("dragging"); };
  };
  sp.ondblclick = () => setLeft(DEFAULT_LEFT);
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const m = { 1: "text", 2: "split", 3: "graph" }[e.key];
    if (m) setMode(m);
  });
}
/* summary card over the graph (그래프 mode): title, lead and the first counters / decision chips of the current view */
function renderOverlay() {
  const ov = $("#overlay");
  if (!ov || S.mode !== "graph") return;
  const v = $("#view");
  const pick = (sel) => { const el = v.querySelector(sel); return el ? el.outerHTML : ""; };
  const title = v.querySelector("h2")?.textContent || "";
  const tabLabel = document.querySelector("#tabs button.on")?.textContent || "";
  ov.innerHTML = `<div class="ov-head"><span class="tag mint">${esc(tabLabel)}</span><b>${esc(title)}</b>
      <button class="btn ghost" id="ov-toggle">${ov.classList.contains("min") ? "펼치기" : "접기"}</button></div>
    <div class="ov-body">${pick(".lead")}${pick(".counters")}${pick(".checks")}
      <p class="small sub" style="margin:8px 0 0">자세한 표는 <b>1 설명</b> · <b>2 나란히</b>에서 봅니다.</p></div>`;
  $("#ov-toggle").onclick = () => { ov.classList.toggle("min"); renderOverlay(); };
}

/* ------------------------------------------------------------ 구현 내용 */
/* docs/dev_work.yaml + 실제 코드 · 정의 파일 (server: /api/devwork, pipeline/devwork.py) */
const KIND = {
  code: ["직접 짠 코드", "mint"], define: ["직접 정의한 기준", "purple"], prompt: ["직접 쓴 프롬프트", "blue"],
  config: ["설정값", "gray"], llm: ["LLM이 맡은 일", "orange"], platform: ["가져다 쓴 것", "gray"],
};
async function loadDev() { S.dev = await api("/api/devwork"); }
async function toggleDev() {
  S.devOn = !S.devOn;
  try { localStorage.setItem("demo-dev", S.devOn ? "1" : "0"); } catch (e) { /* private mode */ }
  $("#btn-dev").setAttribute("aria-pressed", S.devOn);
  if (S.devOn) { try { await loadDev(); } catch (e) { showError(e); } }
  if (S.tab === "overview") renderOverview(); else if (S.tab === "compare") renderCompare(); else renderStep();
}
function addDev(key) {
  if (!S.devOn || !S.dev) return;
  $("#view").insertAdjacentHTML("afterbegin", devPanel(key));
}
function devSnippet(sn) {
  if (!sn) return "";
  const range = sn.path.includes("·") ? "" : ` · ${sn.start}–${sn.end}행${sn.truncated ? ` (앞 ${sn.text.split("\n").length}행만 표시)` : ""}`;
  return `<details class="dev-code"><summary><span class="mono">${esc(sn.path)}</span>${esc(range)}</summary><pre class="raw">${esc(sn.text)}</pre></details>`;
}
function devPanel(key) {
  const d = S.dev.steps[key];
  if (!d) return "";
  const counts = Object.keys(KIND).filter((k) => d.counts[k]).map((k) => tag(`${KIND[k][0]} ${d.counts[k]}`, KIND[k][1])).join(" ");
  const items = d.items.map((it) => {
    const [label, color] = KIND[it.kind];
    let body = it.what ? `<p>${esc(it.what)}</p>` : "";
    if (it.kind === "platform") {
      body = `<p><b>연동 작업</b> ${esc(it.did)}</p>${it.gave && it.gave.length ? `<p><b>해 준 것</b> ${it.gave.map((g) => tag(g, "gray")).join(" ")}</p>` : ""}`;
    }
    return `<div class="dev-item k-${it.kind}"><div class="dev-it-h">${tag(label, color)} <b>${esc(it.title)}</b></div>${body}${devSnippet(it.snippet)}</div>`;
  }).join("");
  const flow = (d.flow || []).map((f) => `<li>${esc(f)}</li>`).join("");
  const n = d.notes || {};
  const notes = (n.hard || n.care) ? `<details class="dev-notes"><summary>만들면서 어려웠던 점 · 신경 쓴 점</summary>
      ${n.hard ? `<h4>어려웠던 점</h4><ul>${n.hard.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${n.care ? `<h4>신경 쓴 점</h4><ul>${n.care.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</details>` : "";
  const total = Object.values(S.dev.code_files).reduce((a, b) => a + b, 0);
  return `<section class="dev">
    <div class="dev-h"><h3>구현 내용 · ${esc(d.label)}</h3>${d.llm ? tag("이 단계는 LLM 사용", "orange") : tag("이 단계는 LLM 안 씀", "mint")}
      <span class="dev-counts">${counts}</span><button class="btn ghost small" onclick="toggleDev()">닫기 (D)</button></div>
    <p class="dev-sum">${esc(d.summary)}</p>
    <div class="dev-grid"><div class="card dev-flow"><h4>이 단계의 처리 순서</h4><ol>${flow}</ol>${d.later ? `<p class="small sub">실서비스에서 더 필요한 것: ${esc(d.later)}</p>` : ""}</div>
      <div class="dev-items">${items}</div></div>
    ${notes}
    <p class="small sub">각 항목의 코드 · 정의는 지금 저장소 파일에서 바로 읽어 온 것입니다 (docs/dev_work.yaml). 이 데모에서 직접 짠 코드는 전체 ${total.toLocaleString()}행입니다(화면 web/ 포함).</p>
  </section>`;
}
boot().catch(showError);
