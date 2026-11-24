"""Step 2 · 정제: remove noise, normalize terms, and find known mentions.

mail : drop quoted thread, signature, disclaimer, closing lines.
stt  : map speakers, drop fillers / unclear segments, restore Hangul-spelled acronyms.
both : relative dates -> absolute, lexicon scan (rule-based mention detection),
       "near misses" (similar but different codes, e.g. H20 vs H200).
Every removal keeps a reason so the UI can show exactly what was dropped and why.
"""
import datetime as dt
import difflib
import re

from .common import config, lexicon, phonetic, read_artifact, write_artifact


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
    """Short product/part codes like H20, B200, HBM3E: ASCII letters + digits, no spaces."""
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
    # "HBM3E 는" -> "HBM3E는": STT leaves a space before Korean particles
    text = re.sub(r"(\S) (는|를|을|에|가|은|도|의|와|과)(?=\s|$)", r"\1\2", text)
    return text


def resolve_dates(text, chunk_id, doc_date, norms):
    if not doc_date:
        return
    base = dt.date(doc_date.year, doc_date.month, doc_date.day)
    for word, delta in (("어제", -1), ("오늘", 0), ("내일", 1)):
        if word in text:
            norms.append({"chunk_id": chunk_id, "surface": word, "result": str(base + dt.timedelta(days=delta)),
                          "method": "규칙 · 상대 날짜", "note": f"문서 작성일 {base} 기준"})
    for m in re.finditer(r"(\d{1,2})월", text):
        mon = int(m.group(1))
        year = base.year if mon <= base.month else base.year - 1
        norms.append({"chunk_id": chunk_id, "surface": m.group(0), "result": f"{year}-{mon:02d}",
                      "method": "규칙 · 월 → 연월", "note": f"작성일 {base} 이전의 가장 가까운 {mon}월"})
    for m in re.finditer(r"(상반기|하반기|연내)", text):
        norms.append({"chunk_id": chunk_id, "surface": m.group(0), "result": f"{base.year} {m.group(0)}",
                      "method": "규칙 · 기간", "note": "연도는 작성일 기준 추정 — 확정 아님"})


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


# ---------------------------------------------------------------- step
def run(input_id):
    col = read_artifact(input_id, "collect")
    meta, body = col["meta"], col["body"]
    kind = meta.get("kind")
    cfg = config()["cleaning"]
    if kind == "mail":
        lines, chunks = clean_mail(meta, body, cfg["mail"])
    elif kind == "meeting_stt":
        lines, chunks = clean_stt(meta, body, cfg["stt"])
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
        resolve_dates(text, c["chunk_id"], doc_date, norms)
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
