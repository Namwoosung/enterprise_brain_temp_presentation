"""Check the LLM server the demo talks to (LLM_BASE_URL in .env, e.g. a vLLM behind :10000).

Usage:  python scripts/check_llm.py

1. GET /models            -> is the server up, which model names does it serve
2. LLM_MODEL in that list -> otherwise every call fails with 404 / "model does not exist"
3. one small JSON call    -> does the model answer in JSON (response_format + our parser)
Nothing is recorded; runs/recorded/ is not touched.
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.common import env  # noqa: E402
from pipeline import llm  # noqa: E402


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    base = env("LLM_BASE_URL", "http://localhost:10000/v1").rstrip("/")
    model = env("LLM_MODEL", "local-llm")
    print(f"base_url : {base}")
    print(f"model    : {model}   (LLM_MODE={env('LLM_MODE', 'auto')}, LLM_JSON_MODE={env('LLM_JSON_MODE', 'true')}, "
          f"LLM_EXTRA_BODY={env('LLM_EXTRA_BODY', '') or '-'})")
    try:
        req = urllib.request.Request(base + "/models", headers=llm._headers())
        with urllib.request.urlopen(req, timeout=5) as r:
            served = [m.get("id") for m in json.loads(r.read()).get("data", [])]
    except Exception as e:  # noqa: BLE001
        print(f"FAIL     : {base}/models 에 연결할 수 없음 ({e.__class__.__name__}: {e})")
        print("hint     : 프록시(:10000)나 vLLM이 떠 있는지, .env의 LLM_BASE_URL 끝이 /v1 인지 확인")
        print("           LLM 없이도 이전 호출 재생(LLM_MODE=replay)으로 데모는 돌아갑니다.")
        return 1
    print(f"served   : {served}")
    if model not in served:
        print(f"FAIL     : LLM_MODEL='{model}' 이 서버 목록에 없음 → .env의 LLM_MODEL을 위 이름 중 하나로 바꾸세요")
        return 1
    messages = [{"role": "system", "content": "반드시 JSON 객체 하나만 출력한다."},
                {"role": "user", "content": '다음 형식으로 답하라: {"ok": true, "items": ["사과", "배"], "count": 2}'}]
    t0 = time.time()
    try:
        content, served_model, secs, usage = llm._call(messages, json_mode=True)
    except Exception as e:  # noqa: BLE001
        print(f"FAIL     : chat/completions 호출 실패 ({e})")
        return 1
    print(f"reply    : {secs}s · {len(content)} chars · usage={usage}")
    if "<think>" in content.lower():
        print("WARN     : 답에 <think> 블록이 있음. 파서가 걷어 내지만 느리고 토큰을 씁니다.")
        print('           Qwen3 계열이면 .env에 LLM_EXTRA_BODY={"chat_template_kwargs": {"enable_thinking": false}}')
    try:
        out = llm.parse_json(content)
    except ValueError as e:
        print(f"FAIL     : JSON을 읽을 수 없음 — {e}")
        return 1
    print(f"parsed   : {json.dumps(out, ensure_ascii=False)}")
    if not content.strip().startswith("{"):
        print("WARN     : JSON 앞뒤에 다른 글자가 붙어 옴(파서가 처리함). 추출 품질이 낮으면 더 큰 모델을 고려하세요.")
    print(f"OK       : {round(time.time() - t0, 1)}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
