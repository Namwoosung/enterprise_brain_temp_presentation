"""Unit tests that need no Neo4j and no LLM (run: python -m pytest -q)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pipeline import clean, resolve, validate  # noqa: E402
from pipeline.common import config  # noqa: E402

CFG = config()["cleaning"]


def test_mail_drops_thread_quote_signature():
    body = "본문 한 줄입니다 길게.\n\n김리서치 | 팀 | 내선 0000\n본 메일은 사내용\n-----Original Message-----\n> 옛 내용\n"
    lines, chunks = clean.clean_mail({}, body, CFG["mail"])
    reasons = {l["text"].strip(): l["reason"] for l in lines if l["status"] == "removed"}
    assert reasons["김리서치 | 팀 | 내선 0000"] == "서명"
    assert reasons["본 메일은 사내용"] == "고지문"
    assert reasons["> 옛 내용"] == "이전 메일 (회신 체인)"
    assert [c["text_clean"] for c in chunks] == ["본문 한 줄입니다 길게."]


def test_stt_fillers_repeats_unclear():
    meta = {"attendees": {"화자1": "박팀장"}}
    body = "[00:00:01] 화자1: 네 어 그 그 HBM 이야기를 하겠습니다\n[00:00:09] 화자1: (불명확) 그 (불명확)\n"
    lines, chunks = clean.clean_stt(meta, body, CFG["stt"])
    assert chunks[0]["text_clean"] == "HBM 이야기를 하겠습니다"
    assert chunks[0]["speaker"] == "박팀장"
    assert lines[1]["status"] == "removed"


def test_phonetic_restore_needs_previous_word():
    norms = []
    assert clean.restore_phonetic("씨오더블유오에스 엘 패키징", "c", norms) == "CoWoS-L 패키징"
    assert clean.restore_phonetic("에이치비엠 쓰리 이 는", "c", norms) == "HBM3E는"
    # '엘' alone is a normal syllable and must stay
    assert clean.restore_phonetic("엘리베이터", "c", []) == "엘리베이터"


def test_code_boundary_h20_vs_h200():
    idx = clean.alias_index()
    ms = clean.scan_mentions("H200에 들어가죠", "c", idx)
    assert [m["refs"] for m in ms] == [["Product:nvidia-h200"]]


def test_ambiguous_alias_uses_context():
    chunks = [{"chunk_id": "c1", "text": "삼성도 HBM3E 퀄 테스트를 통과"}]
    r = resolve.Resolver(chunks).resolve("삼성", "Company", "c1")
    assert r["uid"] == "Company:samsung-elec"
    assert r["decision"] in ("same", "review")
    chunks = [{"chunk_id": "c1", "text": "삼성 배터리 전기차 공급"}]
    r = resolve.Resolver(chunks).resolve("삼성", "Company", "c1")
    assert r["uid"] == "Company:samsung-sdi"


def test_fuzzy_code_never_auto_accepted():
    r = resolve.Resolver([{"chunk_id": "c1", "text": "H2000"}]).resolve("H2000", "Product", "c1")
    assert r["decision"] != "same"


def test_corpus_support_and_reverse_direction():
    hits, rev = validate.supporting_articles("USES_COMPONENT", "Product:mu-hbm3e-8h", "", "Product:nvidia-h200", "")
    assert not hits and [a["id"] for a in rev] == ["A02"]
    hits, _ = validate.supporting_articles("PRODUCT_STATUS", "Product:skh-hbm3e-8h", "", None, None, "mass_production")
    assert [a["id"] for a in hits] == ["B01"]
