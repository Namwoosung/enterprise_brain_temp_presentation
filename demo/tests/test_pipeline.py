"""Unit tests that need no Neo4j and no LLM (run: python -m pytest -q)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline import clean, resolve, validate, official  # noqa: E402
from pipeline.common import config, entity_index  # noqa: E402

CFG = config()["cleaning"]


def test_mail_drops_thread_quote_signature():
    body = "본문 한 줄입니다 길게.\n\n김OO 책임 | 설비기술팀 | 내선 0000\n본 메일은 사내용\n-----Original Message-----\n> 옛 내용\n"
    lines, chunks = clean.clean_mail({}, body, CFG["mail"])
    reasons = {l["text"].strip(): l["reason"] for l in lines if l["status"] == "removed"}
    assert reasons["김OO 책임 | 설비기술팀 | 내선 0000"] == "서명"
    assert reasons["본 메일은 사내용"] == "고지문"
    assert reasons["> 옛 내용"] == "이전 메일 (회신 체인)"
    assert [c["text_clean"] for c in chunks] == ["본문 한 줄입니다 길게."]


def test_stt_fillers_repeats_unclear():
    meta = {"attendees": {"화자1": "이OO 파트장"}}
    body = "[00:00:01] 화자1: 네 어 그 그 챔버 압력 이야기를 하겠습니다\n[00:00:09] 화자1: (불명확) 그 (불명확)\n"
    lines, chunks = clean.clean_stt(meta, body, CFG["stt"])
    assert chunks[0]["text_clean"] == "그 챔버 압력 이야기를 하겠습니다"
    assert chunks[0]["speaker"] == "이OO 파트장"
    assert lines[1]["status"] == "removed"


def test_phonetic_restore_codes_and_units():
    norms = []
    out = clean.restore_phonetic("에이동 십칠 호기 피티 브이 사십이 열화 오백 밀리토르", "c", norms)
    assert out == "A동 17호기 PT-V42 열화 500 mTorr"
    units = []
    clean.resolve_units(out, "c", units)
    assert units[0]["result"] == "0.5 Torr"


def test_cmms_duplicate_row_and_date_format():
    body = ("wo_id,fab,eq_code,serial,work_type,part,status,started_at,completed_at,technician,description,updated_at\n"
            "WO-1,FAB-A,EQ-017,SN-A017,CM,P/T V-42,completed,2026/03/06 13:10,2026/03/07 10:20,a,b,2026-03-07 10:25\n"
            "WO-1,FAB-A,EQ-017,SN-A017,CM,P/T V-42,completed,2026/03/06 13:10,2026/03/07 10:20,a,b,2026-03-07 10:25\n")
    lines, chunks, norms = clean.clean_cmms({}, body, CFG["cmms"])
    assert [l["status"] for l in lines] == ["header", "keep", "removed"]
    assert chunks[0]["row"]["completed_at"] == "2026-03-07 10:20"
    assert any(n["method"] == "규칙 · 날짜 형식" for n in norms)


def test_equipment_key_is_fab_plus_code():
    idx = entity_index()
    assert "Equipment:FAB-A/EQ-017" in idx and "Equipment:FAB-B/EQ-017" in idx
    # the bare code is never a master alias: it must go through context
    assert len({e["ref"] for e in clean.alias_index()["eq-017"]}) == 2


def test_ambiguous_equipment_code_uses_context():
    chunks = [{"chunk_id": "c1", "text": "A동 라인 EQ-017 압력 이상"}]
    r = resolve.Resolver(chunks).resolve("EQ-017", "Equipment", "c1")
    assert r["uid"] == "Equipment:FAB-A/EQ-017"
    chunks = [{"chunk_id": "c1", "text": "B동 EQ-017 RF 점검"}]
    r = resolve.Resolver(chunks).resolve("EQ-017", "Equipment", "c1")
    assert r["uid"] == "Equipment:FAB-B/EQ-017"
    r = resolve.Resolver([{"chunk_id": "c1", "text": "EQ-017 점검"}]).resolve("EQ-017", "Equipment", "c1")
    assert r["decision"] != "same"   # no context -> not merged by name


def test_unknown_equipment_code_never_auto_fixed():
    chunks = [{"chunk_id": "c1", "text": "WO-9 · FAB-A EQ-071 · serial SN-A017"}]
    r = resolve.Resolver(chunks).resolve("FAB-A EQ-071", "Equipment", "c1")
    assert r["decision"] != "same"
    assert r["alternatives"][0]["uid"] == "Equipment:FAB-A/EQ-017"   # the serial points here, shown first


def test_work_without_number_matches_cmms_by_date():
    norms = [{"chunk_id": "c1", "surface": "3/6", "result": "2026-03-06", "method": "규칙 · 월/일 → 날짜"}]
    R = resolve.Resolver([{"chunk_id": "c1", "text": "3/6 오후에 P/T V-42 교체 완료"}], norms)
    r = R.match_work("P/T V-42 교체", "c1", "Equipment:FAB-A/EQ-017", "PartType:PT-V42", "completed")
    assert r["uid"] == "MaintenanceWork:WO-1042" and r["decision"] == "review"   # CMMS completed on 3/7
    r = R.match_work("P/T V-42 교체", "c1", "Equipment:FAB-A/EQ-017", "PartType:PT-V42", "planned")
    assert r["decision"] == "same"   # a plan is compared with the CMMS start (3/6)


def test_official_works_include_export_rows():
    w = official.works()
    assert w["WO-1042"]["part"] == "PartType:PT-V42"          # "P/T V-42" normalized through the lexicon
    assert w["WO-1042"]["equipment"] == "Equipment:FAB-A/EQ-017"
    assert w["WO-1041"]["equipment"] == "Equipment:FAB-A/EQ-017"


def test_reference_support_and_reverse_direction():
    hits, rev = validate.reference_support("ON_EQUIPMENT", "Equipment:FAB-A/EQ-017", "MaintenanceWork:WO-1041")
    assert not hits and [a["id"] for a in rev] == ["CMMS-HIST"]
    hits, _ = validate.reference_support("RAISED_ALARM", "Equipment:FAB-A/EQ-017", "Alarm:ALM-312")
    assert [a["id"] for a in hits] == ["ALM-LOG-0305"]
