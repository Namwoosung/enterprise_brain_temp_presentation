"""OpenAI-compatible chat client with record / replay.

The demo only knows LLM_BASE_URL (a vLLM-style server). Modes (LLM_MODE):
  live   - always call the server; save the response as a recording
  replay - never call; use runs/recorded/<name>.json
  auto   - call if the server answers /models, otherwise replay
Recordings make the presentation deterministic and let it run offline.
"""
import json
import re
import time
import urllib.error
import urllib.request

from .common import env, config, ROOT, sha256

REC_DIR = ROOT / "runs" / "recorded"


def _base():
    return env("LLM_BASE_URL", "http://localhost:10000/v1").rstrip("/")


def _headers():
    return {"Content-Type": "application/json",
            "Authorization": "Bearer " + env("LLM_API_KEY", "EMPTY")}


def server_up(timeout=2):
    try:
        with urllib.request.urlopen(urllib.request.Request(_base() + "/models", headers=_headers()),
                                    timeout=timeout) as r:
            return r.status == 200
    except Exception:
        return False


def _extra_body():
    """LLM_EXTRA_BODY: JSON merged into the request, for server/model specific switches, e.g.
    {"chat_template_kwargs": {"enable_thinking": false}} to turn off thinking on Qwen3-style models."""
    raw = env("LLM_EXTRA_BODY", "").strip()
    if not raw:
        return {}
    try:
        v = json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"LLM_EXTRA_BODY in .env is not valid JSON: {e}") from e
    if not isinstance(v, dict):
        raise RuntimeError("LLM_EXTRA_BODY must be a JSON object")
    return v


def _post(body):
    req = urllib.request.Request(_base() + "/chat/completions", data=json.dumps(body).encode("utf-8"),
                                 headers=_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=float(env("LLM_TIMEOUT", "300"))) as r:
        return json.loads(r.read())


def _call(messages, json_mode):
    body = {"model": env("LLM_MODEL", "local-llm"), "messages": messages,
            "temperature": config()["llm"]["temperature"], "max_tokens": config()["llm"]["max_tokens"]}
    use_json = json_mode and env("LLM_JSON_MODE", "true").lower() not in ("0", "false", "no")
    if use_json:
        body["response_format"] = {"type": "json_object"}
    body.update(_extra_body())
    t0 = time.time()
    try:
        data = _post(body)
    except urllib.error.HTTPError as e:
        # some servers / models reject response_format: retry once without it (the prompt still asks for JSON)
        if e.code in (400, 422) and "response_format" in body:
            body.pop("response_format")
            data = _post(body)
        else:
            detail = e.read().decode("utf-8", "replace")[:500]
            raise RuntimeError(f"LLM server returned HTTP {e.code}: {detail}") from e
    msg = data["choices"][0]["message"]
    content = msg.get("content") or ""
    return content, data.get("model"), round(time.time() - t0, 2), data.get("usage")


_THINK = re.compile(r"<think>.*?</think>", re.S | re.I)
_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.I)


def parse_json(text):
    """Parse a JSON object from a model reply. Open-weight models often wrap it:
    <think>...</think>, ```json fences, or a sentence before/after the object."""
    t = _THINK.sub("", text or "").strip()
    if "<think>" in t:                       # unterminated thinking block: keep what follows it, if any
        t = t.split("</think>")[-1]
    t = _FENCE.sub("", t).strip()
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        pass
    start = t.find("{")
    while start >= 0:                        # first balanced {...} that parses
        depth, in_str, esc = 0, False, False
        for i in range(start, len(t)):
            c = t[i]
            if in_str:
                esc = (c == "\\") and not esc
                if c == '"' and not esc:
                    in_str = False
                continue
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(t[start:i + 1])
                    except json.JSONDecodeError:
                        break
        start = t.find("{", start + 1)
    raise ValueError("no JSON object found in the LLM reply: " + (text or "")[:300])


def hash_messages(messages):
    """Same hash as stored in recordings: tells whether a recording still matches the prompt."""
    return sha256(json.dumps(messages, ensure_ascii=False))[:12]


def recording(name):
    p = REC_DIR / f"{name}.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def chat(name, messages, json_mode=True):
    """Return dict(content, mode, model, seconds, prompt_hash, recorded_at)."""
    mode = env("LLM_MODE", "auto")
    rec_path = REC_DIR / f"{name}.json"
    prompt_hash = hash_messages(messages)
    use_live = mode == "live" or (mode == "auto" and server_up())
    if use_live:
        content, model, secs, usage = _call(messages, json_mode)
        rec = {"name": name, "source": "live", "model": model, "base_url": _base(), "seconds": secs,
               "usage": usage, "prompt_hash": prompt_hash, "recorded_at": time.strftime("%Y-%m-%d %H:%M:%S"),
               "messages": messages, "content": content}
        REC_DIR.mkdir(parents=True, exist_ok=True)
        rec_path.write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")
        return {**rec, "mode": "live"}
    if not rec_path.exists():
        raise RuntimeError(f"LLM server not reachable at {_base()} and no recording {rec_path.name}")
    rec = json.loads(rec_path.read_text(encoding="utf-8"))
    rec["mode"] = "replay"
    rec["prompt_changed"] = rec.get("prompt_hash") != prompt_hash
    return rec
