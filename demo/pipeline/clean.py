"""Step 2 · 정제: remove noise, normalize terms, and find known mentions.

cmms : CSV export -> one chunk per row; duplicate rows dropped, date formats unified.
mail : drop quoted thread, signature, disclaimer, closing lines.
stt  : map speakers, drop fillers / unclear segments, restore Hangul-spelled codes and units.
docs : relative dates (3/6, 금요일, 지난달) -> absolute, units (mTorr -> Torr), lexicon scan
       (rule-based mention detection), "near misses" (similar but different codes, e.g. EQ-017 vs EQ-071).
Every removal keeps a reason so the UI can show exactly what was dropped and why.
"""
import datetime as dt
import difflib
import re

from .common import config, lexicon, phonetic, read_artifact, write_artifact, entities, entity_uid, ontology


# ---------------------------------------------------------------- lexicon index
def alias_index():
    """alias (casefolded) -> list of {ref, pref, kind, ambiguous, context}."""
    idx = {}
    for t in lexicon()["terms"]:
        for kind, names in (("pref", [t["pref"]]), ("alt", t.get("alt", [])), ("hidden", t.get("hidden", []))):
            for a in names:
                idx.setdefault(a.casefold(), []).append({
                    "alias": a, "ref": t["ref"], "pref": t["pref"], "kind": kind,
                    "ambiguous": bool(t.get("ambiguous")), "context": t.get("context", [])})
    # master entities: their name, and their code when the code alone is the key
    # (Equipment codes are NOT added: EQ-017 exists in both fabs, only "fab + code" identifies one)
    prefs = {}
    for t in lexicon()["terms"]:
        prefs.setdefault(t["ref"], t["pref"])
    classes = ontology()["classes"]
    for e in entities():
        ref = entity_uid(e)
        names = [e["name"]] + ([e["code"]] if classes[e["class"]]["key"] == ["code"] else [])
        for a in names:
            if not any(x["ref"] == ref for x in idx.get(a.casefold(), [])):
                idx.setdefault(a.casefold(), []).append({
                    "alias": a, "ref": ref, "pref": prefs.get(ref, a), "kind": "master",
                    "ambiguous": False, "context": []})
    # same alias listed on several terms -> ambiguous even if not flagged
    for k, v in idx.items():
        refs = {x["ref"] for x in v}
        if len(refs) > 1:
            for x in v:
                x["ambiguous"] = True
    return idx


def _is_ascii_alnum(ch):
    return ch.isascii() and ch.isalnum()


def scan_mentions(text, chunk_id, idx):
    taken = [False] * len(text)
    out = []
    low = text.casefold()
    for alias in sorted(idx, key=len, reverse=True):
        start = 0
        while True:
            i = low.find(alias, start)
            if i < 0:
                break
            j = i + len(alias)
            start = j
            if any(taken[i:j]):
                continue
            if _is_ascii_alnum(alias[-1]) and j < len(text) and _is_ascii_alnum(text[j]):
                continue
            if _is_ascii_alnum(alias[0]) and i > 0 and _is_ascii_alnum(text[i - 1]):
                continue
            for k in range(i, j):
                taken[k] = True
            entries = idx[alias]
            refs = sorted({e["ref"] for e in entries})
            out.append({"chunk_id": chunk_id, "start": i, "end": j, "surface": text[i:j],
                        "refs": refs, "ambiguous": len(refs) > 1,
                        "alias_kind": entries[0]["kind"], "pref": entries[0]["pref"]})
    return sorted(out, key=lambda m: m["start"])


def is_code(s):
    """Short part / equipment codes like PT-V42, EQ-017, TV-08: ASCII letters + digits, no spaces."""
    return bool(re.fullmatch(r"[A-Za-z]+[A-Za-z0-9\-]*\d[A-Za-z0-9\-]*", s))


def near_misses(mentions, idx):
    """For code-like mentions (contain digits), list other aliases that look similar."""
    fmin = max(config()["resolve"]["fuzzy_min"], 0.75)
    out, seen = [], set()
    for m in mentions:
        s = m["surface"]
        if not is_code(s) or s in seen:
            continue
        seen.add(s)
        sims = []
        for a, entries in idx.items():
            if entries[0]["ref"] in m["refs"]:
                continue
            r = difflib.SequenceMatcher(None, s.casefold(), a).ratio()
            if r >= fmin and is_code(a):
                sims.append({"alias": entries[0]["alias"], "ref": entries[0]["ref"], "score": round(r, 2)})
        if sims:
            out.append({"surface": s, "chosen": m["refs"], "similar": sorted(sims, key=lambda x: -x["score"])[:3],
                        "note": "코드가 비슷해도 정확히 일치하지 않으면 같은 대상으로 보지 않음"})
    return out


# ---------------------------------------------------------------- normalization rules
def restore_phonetic(text, chunk_id, norms):
    ph = phonetic()
    for say in sorted(ph.get("map", {}), key=len, reverse=True):
        write = ph["map"][say]
        if say in text and say != write:
            text = text.replace(say, write)
            norms.append({"chunk_id": chunk_id, "surface": say, "result": write, "method": "발음 복원"})
    for rule in ph.get("after", []):
        pat = re.compile(re.escape(rule["prev"]) + r"\s*" + re.escape(rule["say"]) + r"(?![가-힣])")
        if pat.search(text):
            text = pat.sub(rule["prev"] + rule["write"], text)
            spoken_prev = next((k for k, v in ph.get("map", {}).items() if v == rule["prev"]), rule["prev"])
            norms.append({"chunk_id": chunk_id, "surface": f"{rule['prev']} {rule['say']}",
                          "result": rule["prev"] + rule["write"], "method": "발음 복원 (앞 단어 조건)",
                          "spoken": f"{spoken_prev} {rule['say']}"})
    # "PT-V42 는" -> "PT-V42는": STT leaves a space before Korean particles
    text = re.sub(r"(\S) (는|를|을|에|가|은|도|의|와|과)(?=\s|$)", r"\1\2", text)
    return text


WEEKDAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]


# CUSTOMIZE: date expressions your documents use. Results are shown, never silently replaced in the text.
def resolve_dates(text, chunk_id, doc_date, norms):
    if not doc_date:
        return
    base = dt.date(doc_date.year, doc_date.month, doc_date.day)
    for word, delta in (("어제", -1), ("오늘", 0), ("내일", 1)):
        if word in text:
            norms.append({"chunk_id": chunk_id, "surface": word, "result": str(base + dt.timedelta(days=delta)),
                          "method": "규칙 · 상대 날짜", "note": f"문서 작성일 {base} 기준"})
    for m in re.finditer(r"(?<![\d/])(\d{1,2})/(\d{1,2})(?![\d/])", text):
        mon, day = int(m.group(1)), int(m.group(2))
        if 1 <= mon <= 12 and 1 <= day <= 31:
            year = base.year if mon <= base.month else base.year - 1
            norms.append({"chunk_id": chunk_id, "surface": m.group(0), "result": f"{year}-{mon:02d}-{day:02d}",
                          "method": "규칙 · 월/일 → 날짜", "note": f"문서 작성일 {base} 기준 연도"})
    for k, w in enumerate(WEEKDAYS):
        if w in text:
            d = base + dt.timedelta(days=(k - base.weekday()) % 7)
            norms.append({"chunk_id": chunk_id, "surface": w, "result": str(d),
                          "method": "규칙 · 요일 → 날짜", "note": f"작성일 {base}({WEEKDAYS[base.weekday()]}) 이후 첫 {w}"})
    if "지난달" in text:
        prev = (base.replace(day=1) - dt.timedelta(days=1))
        norms.append({"chunk_id": chunk_id, "surface": "지난달", "result": f"{prev.year}-{prev.month:02d}",
                      "method": "규칙 · 상대 기간", "note": f"작성일 {base} 기준 · 일자는 모름"})
    if "이번 주" in text:
        mon = base - dt.timedelta(days=base.weekday())
        norms.append({"chunk_id": chunk_id, "surface": "이번 주", "result": f"{mon} ~ {mon + dt.timedelta(days=6)}",
                      "method": "규칙 · 상대 기간", "note": f"작성일 {base} 기준"})


def resolve_units(text, chunk_id, norms):
    """Pressure to the base unit (Torr); the original value stays in the text."""
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*mTorr", text):
        v = float(m.group(1)) / 1000
        norms.append({"chunk_id": chunk_id, "surface": m.group(0), "result": f"{v:g} Torr",
                      "method": "규칙 · 단위 환산", "note": "기준 단위 Torr · 원래 값 보존"})


def _as_date(v):
    if isinstance(v, (dt.date, dt.datetime)):
        return v
    try:
        return dt.datetime.fromisoformat(str(v)[:10])
    except Exception:
        return None


# ---------------------------------------------------------------- mail
# CUSTOMIZE: patterns come from config/demo.yaml (cleaning.mail). Add a new clean_<kind>() for other sources.
def clean_mail(meta, body, cfg):
    lines, chunks = [], []
    in_thread = False
    for n, line in enumerate(body.splitlines(), 1):
        s = line.strip()
        status, reason = "keep", ""
        if any(s.startswith(t) for t in cfg["thread_markers"]):
            in_thread = True
        if in_thread:
            status, reason = "removed", "이전 메일 (회신 체인)"
        elif s.startswith(">"):
            status, reason = "removed", "인용 본문"
        elif any(re.search(p, s) for p in cfg["signature_patterns"]):
            status, reason = "removed", "서명"
        elif any(re.search(p, s) for p in cfg["disclaimer_patterns"]):
            status, reason = "removed", "고지문"
        elif s in cfg["closing_lines"]:
            status, reason = "removed", "맺음말"
        elif not s:
            status, reason = "blank", ""
        lines.append({"n": n, "text": line, "status": status, "reason": reason})
        if status == "keep":
            chunks.append({"text_clean": s, "line": n})
    return lines, chunks


# ---------------------------------------------------------------- stt
SEG = re.compile(r"^\[(\d{2}:\d{2}:\d{2})\]\s*([^:]+):\s*(.*)$")


# CUSTOMIZE: line format "[hh:mm:ss] speaker: text". Convert other STT outputs to this, or edit SEG.
def clean_stt(meta, body, cfg):
    attendees = meta.get("attendees") or {}
    lines, chunks = [], []
    for n, line in enumerate(body.splitlines(), 1):
        m = SEG.match(line.strip())
        if not m:
            if line.strip():
                lines.append({"n": n, "text": line, "status": "removed", "reason": "형식 밖 줄"})
            continue
        ts, spk, text = m.groups()
        removed = []
        unclear = cfg["unclear_marker"] in text
        t = text.replace(cfg["unclear_marker"], " ")
        if unclear:
            removed.append(cfg["unclear_marker"])
        # repeated words ("그 그") -> one, then standalone fillers
        t2 = re.sub(r"\b(\S+)( \1\b)+", r"\1", t)
        if t2 != t:
            removed.append("반복")
        t = t2
        toks = t.split()
        while toks and toks[0] in cfg["leading_fillers"] + cfg["fillers"]:
            removed.append(toks.pop(0))
        kept = []
        for w in toks:
            if w in cfg["fillers"]:
                removed.append(w)
            else:
                kept.append(w)
        t = " ".join(kept)
        speaker = attendees.get(spk.strip(), spk.strip())
        status, reason = "keep", ""
        if len(t.replace(" ", "")) < cfg["min_chars_after_clean"]:
            status, reason = "removed", "불명확 · 내용 부족" if unclear else "너무 짧음"
        lines.append({"n": n, "text": line, "ts": ts, "speaker_label": spk.strip(), "speaker": speaker,
                      "status": status, "reason": reason, "removed_tokens": removed, "cleaned": t})
        if status == "keep":
            chunks.append({"text_clean": t, "line": n, "ts": ts, "speaker": speaker})
    return lines, chunks


# ---------------------------------------------------------------- cmms (structured export)
def _norm_dt(v, formats):
    v = (v or "").strip()
    if not v:
        return None, None
    for f in formats:
        try:
            out = dt.datetime.strptime(v, f).strftime("%Y-%m-%d %H:%M")
            return out, (None if f == formats[0] else f)
        except ValueError:
            continue
    return v, "형식 모름"


# CUSTOMIZE: column names come from your CMMS export (see config cmms_mapping).
def clean_cmms(meta, body, cfg):
    import csv
    import io
    rows = list(csv.reader(io.StringIO(body)))
    header, lines, chunks, seen, norms_dt = rows[0], [], [], set(), []
    lines.append({"n": 1, "text": ",".join(header), "status": "header", "reason": "열 이름"})
    for n, cells in enumerate(rows[1:], 2):
        text = ",".join(cells)
        if not any(c.strip() for c in cells):
            lines.append({"n": n, "text": text, "status": "blank", "reason": ""})
            continue
        row = dict(zip(header, cells))
        key = tuple(row.get(k) for k in cfg["key_columns"])
        if key in seen:
            lines.append({"n": n, "text": text, "status": "removed",
                          "reason": f"중복 행 ({' · '.join(cfg['key_columns'])} 같음) → 한 번만 처리"})
            continue
        seen.add(key)
        for col in ("started_at", "completed_at", "updated_at"):
            v, how = _norm_dt(row.get(col), cfg["datetime_formats"])
            if how and row.get(col):
                norms_dt.append({"line": n, "surface": row[col], "result": v, "method": "규칙 · 날짜 형식",
                                 "note": f"{col} · {how} → YYYY-MM-DD HH:MM"})
            row[col] = v
        lines.append({"n": n, "text": text, "status": "keep", "reason": ""})
        parts = [row["wo_id"], f"{row['fab']} {row['eq_code']}", f"serial {row['serial']}", row["work_type"],
                 row["part"], row["status"]]
        if row.get("started_at"):
            parts.append(f"시작 {row['started_at']}")
        if row.get("completed_at"):
            parts.append(f"완료 {row['completed_at']}")
        parts.append(row.get("description") or "")
        chunks.append({"text_clean": " · ".join(p for p in parts if p), "line": n, "row": row})
    return lines, chunks, norms_dt


# ---------------------------------------------------------------- step
def run(input_id):
    col = read_artifact(input_id, "collect")
    meta, body = col["meta"], col["body"]
    kind = meta.get("kind")
    cfg = config()["cleaning"]
    row_norms = []
    if kind == "mail":
        lines, chunks = clean_mail(meta, body, cfg["mail"])
    elif kind == "meeting_stt":
        lines, chunks = clean_stt(meta, body, cfg["stt"])
    elif kind == "cmms_csv":
        lines, chunks, row_norms = clean_cmms(meta, body, cfg["cmms"])
    else:
        raise ValueError(f"unknown kind: {kind}")
    doc_id = meta["doc_id"]
    doc_date = _as_date(meta.get("date"))
    idx = alias_index()
    norms, mentions = [], []
    for i, c in enumerate(chunks, 1):
        c["chunk_id"] = f"{doc_id}#c{i:02d}"
        text = restore_phonetic(c["text_clean"], c["chunk_id"], norms) if kind == "meeting_stt" else c["text_clean"]
        c["text"] = text
        for rn in row_norms:
            if rn["line"] == c["line"]:
                norms.append({k: v for k, v in rn.items() if k != "line"} | {"chunk_id": c["chunk_id"]})
        if kind != "cmms_csv":
            resolve_dates(text, c["chunk_id"], doc_date, norms)
            resolve_units(text, c["chunk_id"], norms)
        ms = scan_mentions(text, c["chunk_id"], idx)
        for m in ms:
            if not m["ambiguous"] and m["surface"] == m["pref"]:
                continue  # already the standard name: nothing to show
            norms.append({"chunk_id": c["chunk_id"], "surface": m["surface"],
                          "result": " / ".join(m["refs"]) if m["ambiguous"] else m["pref"],
                          "method": "사전 · 동음 후보 여럿" if m["ambiguous"] else f"사전 ({m['alias_kind']})"})
        mentions += ms
    for k, m in enumerate(mentions, 1):
        m["mention_id"] = f"M{k:02d}"
    removed = [l for l in lines if l["status"] == "removed"]
    return write_artifact(input_id, "clean", {
        "step": "clean", "input": input_id, "kind": kind, "doc_id": doc_id, "meta": meta,
        "lines": lines, "chunks": chunks, "normalizations": norms, "mentions": mentions,
        "near_misses": near_misses(mentions, idx),
        "stats": {"lines": len(lines), "removed": len(removed), "chunks": len(chunks),
                  "mentions": len(mentions), "normalizations": len(norms)}})
