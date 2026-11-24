/* Demo UI. No build step, no libraries. Talks to server/app.py (/api/*).
   Graph pictures come from Neo4j Browser (iframe via the :8801 re-serving proxy). */
const S = { cfg: null, tab: "overview", step: "collect", art: {}, notesOn: false };
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
  $("#btn-notes").onclick = () => { S.notesOn = !S.notesOn; renderNotes(); };
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
  wireDetails();
  renderOverlay();
  if (S.notesOn) renderNotes();
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
  const leadByKind = { meeting_stt: "화자를 사람으로 바꾸고, 간투사 · 반복 · 불명확 구간을 지우고, 한글로 적힌 코드 · 단위를 되돌립니다 (피티 브이 사십이 → PT-V42).",
    mail: "회신 체인 · 인용 · 서명 · 고지문을 지웁니다. 지우지 않으면 같은 사실이 회신 수만큼 추출됩니다.",
    cmms_csv: "행 하나를 조각 하나로 만듭니다. 같은 행이 두 번 오면 한 번만 처리하고, 날짜 형식을 맞추고, 부품 표기는 사전으로 표준 코드에 연결합니다." };
  return `<h2>2 · 정제</h2><p class="lead">${leadByKind[a.kind] || ""}</p>
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
  if (a.method === "rule") {
    const m = a.mapping;
    const rules = m.facts.map((r) => `<tr><td class="mono" style="color:var(--purple)">${esc(r.p)}</td><td class="mono small">${esc(r.value_from ? r.value_from + " → 값" : (r.from || []).join(" + ") + " → " + r.object_class)}</td></tr>`).join("");
    return `<h2>3 · 추출 (규칙 매핑)</h2><p class="lead">정형 데이터는 정답이 정해져 있어 LLM을 쓰지 않습니다. 열 → 관계 매핑 규칙으로 후보를 만들고, 같은 입력이면 항상 같은 결과가 나옵니다.</p>
    <div class="card small">${tag("규칙 · LLM 없음", "purple")} 매퍼 <span class="mono">${esc(a.prompt_version)}</span> · 규칙 위치 config/demo.yaml <span class="mono">cmms_mapping</span></div>
    <div class="cols" style="margin-top:12px"><div class="card"><h4>매핑 규칙 · 주어 = ${esc(m.subject.from)} (${esc(m.subject.class)})</h4><table><tr><th>관계</th><th>열</th></tr>${rules}</table>
      <p class="small sub">노드 속성으로 옮기는 열: ${esc(m.props.join(", "))}</p></div>
    <div class="card"><h4>사실 후보 ${a.facts.length}개 · 모두 아직 후보</h4><table><tr><th></th><th>행</th><th>주어</th><th>관계</th><th>목적어 · 값</th></tr>${a.facts.map((f) =>
      `<tr><td class="mono">${f.fact_id}</td><td class="mono small">${f.row_line}</td><td>${esc(f.subject)}</td><td class="mono" style="color:var(--purple)">${esc(f.predicate)}</td><td>${esc(f.object ?? f.value ?? "")}</td></tr>`).join("")}</table></div></div>`;
  }
  return `<h2>3 · 추출</h2><p class="lead">LLM이 온톨로지의 관계 목록 안에서만 사실 후보를 뽑습니다. 목록 밖의 관계와 모르는 용어는 버리지 않고 따로 모읍니다.</p>
  <div class="card small">${tag(L.mode === "live" ? "실시간 호출" : "녹화본 재생", L.mode === "live" ? "mint" : "blue")}
    모델 <span class="mono">${esc(L.model)}</span> · ${esc(L.base_url || "")} · ${esc(L.seconds)}초 · 녹화 ${esc(L.recorded_at)} · 프롬프트 ${esc(a.prompt_version)}
    ${L.prompt_changed ? tag("프롬프트가 녹화 이후 바뀜 — 실시간 호출로 다시 녹화하세요", "orange") : ""}
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
  <div class="card small sub">증거 순서: 정확한 별칭 · 마스터 코드 → 주변 문장의 맥락 단어(EQ-017은 FAB마다 있음) → 번호 없는 정비 작업은 CMMS의 같은 설비 · 부품 · 날짜 작업 → 문자열 유사도. 코드(EQ-017 · EQ-071)는 유사도만으로 확정하지 않습니다. 애매하면 합치지 않고 검토로 남깁니다.</div>`;
}

// a confident link shows the entity; an unsure one shows the text and the candidate with "?"
const linkName = (l, raw) => !l ? esc(raw) : (l.decision === "same" || l.decision === "new") ? esc(l.name || raw)
  : `<span class="sub">'${esc(l.surface)}'</span> → ${esc(l.name || "?")}?`;

function vValidate(a) {
  const ck = (c) => `<span class="chk ${c.ok === true ? "ok" : c.ok === false ? "no" : "q"}" title="${esc(c.detail)}">${c.ok === true ? "✓" : c.ok === false ? "✗" : "?"} ${esc(c.name)}</span>`;
  const facts = a.results.map((r) => {
    const f = r.fact, s = r.subject, o = r.object;
    return `<div class="card"><div class="factline"><span class="mono sub">${r.fact_id}</span> ${linkName(s, f.subject)}<span class="p">${esc(f.predicate)}</span>${o ? linkName(o, f.object) : esc(f.value)}
      &nbsp; ${decisionTag(r.decision)} <span class="small">${esc(r.reason)}</span> ${r.risk === "high" ? tag("고위험 관계", "red") : ""}</div>
      <div class="checks">${r.checks.map(ck).join("")}</div>
      <div class="small sub">${r.checks.map((c) => `${esc(c.name)}: ${esc(c.detail)}`).join(" · ")}</div></div>`;
  }).join("");
  const oc = a.ontology_candidates.map((c) => `<tr><td class="mono">${esc(c.name)}</td><td>${esc(c.between.join(" · "))}</td><td>${esc(c.topic)}</td>
    <td class="small">${esc(c.phrase || "")}</td></tr>`).join("");
  const tc = a.term_candidates.map((t) => `<tr><td>${esc(t.term)}</td><td>${decisionTag(t.decision)}</td><td class="small">${esc(t.reason)}</td></tr>`).join("");
  const qs = a.questions.map((q) => `<tr><td>${esc(q.text)}</td><td>${decisionTag(q.decision)}</td><td class="small">${esc(q.reason)}</td></tr>`).join("");
  const lx = a.lexicon_candidates.map((l) => `<tr><td>${esc(l.spoken)}</td><td>${esc(l.pref)}</td><td class="mono small">${esc(l.ref)}</td></tr>`).join("");
  return `<h2>5 · 검증</h2><p class="lead">스키마 · 개체 연결 · 근거 문장 · 확신도(추정 · 예정 표현) · 기준 시스템(CMMS · 알람 로그) · 문서 대조를 보고 승인 / 보류 / 거절을 정합니다. 문서가 기준 시스템과 다르면 덮어쓰지 않고 보류합니다. 추정은 근거가 있어도 확정으로 올리지 않습니다.</p>
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
    const arts = o.reference.map((a) => `<tr><td class="mono">${a.id}</td><td>${a.official ? tag("기준 시스템 · " + a.official, "mint") : tag("문서", "blue")}</td><td>${esc(a.date)}</td>
      <td>${esc(a.title)}<br><span class="sub small">${esc(a.summary)}</span></td><td class="small">${esc(a.system)}<br><span class="sub mono">${esc(a.source || "")}</span></td></tr>`).join("");
    const cq = (o.cq_run0 || []).map((q) => `<tr><td class="mono">${q.id}</td><td>${esc(q.question)}</td><td class="small">${rowsText(q.rows)}</td></tr>`).join("");
    $("#view").innerHTML = `<h2>기준 상태 (run 0)</h2><p class="lead">가상 팹(FAB-A · FAB-B)의 설비 마스터와 CMMS 이력 · 알람 로그 · SOP · 회의자료로 만든 KG입니다. 여기에 CMMS 증분 1건, 메일 1건, 회의록 STT 1건을 넣어 무엇이 달라지는지 봅니다.</p>
    <div class="counters" style="grid-template-columns:repeat(4,1fr)">
      <div class="counter"><div class="v">${o.neo4j.nodes ?? "-"}</div><div class="l">노드 (현재)</div></div>
      <div class="counter"><div class="v">${o.neo4j.relationships ?? "-"}</div><div class="l">관계 (현재)</div></div>
      <div class="counter"><div class="v">${o.entities}</div><div class="l">마스터 개체</div></div>
      <div class="counter"><div class="v">${o.reference.filter((a) => a.official).length} + ${o.reference.filter((a) => !a.official).length}</div><div class="l">기준 자료 (시스템 + 문서)</div></div></div>
    <div class="cols"><div><div class="card"><h4>온톨로지 v${esc(o.ontology.version)} · 클래스</h4>${cls}</div>
      <div class="card"><h4>관계</h4><table>${rels}</table><p class="small sub">속성 사실: ${Object.entries(o.ontology.property_facts).map(([k, v]) => `${esc(k)} → ${esc(v.class)}.${esc(v.property)}`).join(" · ")}. 증상 · PM 주기 같은 개념은 v1에 없습니다.</p></div></div>
      <div><div class="card"><h4>업무 질문 (CQ) · run 0 답</h4><table>${cq || '<tr><td class="empty">초기화를 먼저 실행하세요</td></tr>'}</table></div></div></div>
    <div class="card"><h4>기준 자료 (모두 가상 데이터 · 부품 · 고장 용어는 공개된 식각 설비 지식 기준)</h4><table><tr><th></th><th></th><th>날짜</th><th>내용</th><th>시스템 · 위치</th></tr>${arts}</table></div>`;
    showView("baseline"); renderOverlay();
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
      <div class="card"><h4>상태가 바뀐 사실</h4>${tbl(g.changed, ["이름", "속성", "이전", "현재", "근거"])}</div>
      <div class="card"><h4>새 관계</h4>${tbl(g.new_rels, ["주어", "관계", "목적어", "근거"])}</div>
      <div class="card"><h4>새 개체</h4>${tbl(g.new_nodes, ["클래스", "이름", "run"])}</div></div>
    <div><div class="card"><h4>보류 · 질문 (그래프의 ReviewItem)</h4>${tbl(g.reviews, ["종류", "내용", "사유"])}</div>
      <div class="card"><h4>온톨로지 v1 → v1.1 제안</h4><p class="small sub">v1 관계: ${v1rels}</p>
        <table>${addRel || '<tr><td class="empty">관계 추가 없음</td></tr>'}</table>
        <h4 style="margin-top:10px">용어</h4><table>${addTerm || '<tr><td class="empty">없음</td></tr>'}</table>
        <h4 style="margin-top:10px">동의어 (hidden label)</h4><table>${addLab || '<tr><td class="empty">없음</td></tr>'}</table>
        <p class="small sub">제안 파일: runs/ontology.v1.1.proposal.yaml · ${esc(p.status)}</p></div></div></div>`;
    showView("diff"); renderOverlay();
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
  const v = [["baseline", "기준 KG"], ["focus", "EQ-017 주변"], ["document", "이 문서"], ["diff", "변화 (색 표시)"], ["diff_rels", "이 입력의 새 관계"]];
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

/* ------------------------------------------------------------ implementation notes */
function renderNotes() {
  const el = $("#notes");
  el.classList.toggle("on", S.notesOn);
  if (!S.notesOn) return;
  const key = S.tab === "compare" ? "compare" : S.tab === "overview" ? null : S.step;
  const N = S.cfg.dev_notes || {};
  const sec = (title, arr, color) => arr && arr.length ? `<h3 style="color:var(--${color})">${title}</h3><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  const one = (k) => { const n = N[k] || {}; return sec("가져다 쓴 것 (플랫폼 · 라이브러리)", n.used, "blue") + sec("직접 만든 것", n.built, "mint") + sec("어려웠던 점", n.hard, "orange") + sec("신경 쓴 점", n.care, "purple"); };
  const label = key ? (S.cfg.steps.find((s) => s.id === key)?.label || "비교") : "전체";
  el.innerHTML = `<div style="display:flex;align-items:center"><h2>구현 노트 · ${esc(label)}</h2><button class="btn ghost" style="margin-left:auto" onclick="S.notesOn=false;renderNotes()">닫기</button></div>
    <p class="sub small">docs/dev_notes.yaml · 자세한 결정 기록은 docs/DEV_NOTES.md</p>
    ${key ? one(key) : Object.keys(N).map((k) => `<h2 style="margin-top:18px">${esc(k)}</h2>${one(k)}`).join("")}`;
}
function wireDetails() { /* placeholder for future interactions */ }

boot().catch(showError);
