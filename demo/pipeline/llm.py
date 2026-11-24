"""OpenAI-compatible chat client with record / replay.

The demo only knows LLM_BASE_URL (a vLLM-style server). Modes (LLM_MODE):
  live   - always call the server; save the response as a recording
  replay - never call; use runs/recorded/<name>.json
  auto   - call if the server answers /models, otherwise replay
Recordings make the presentation deterministic and let it run offline.
"""
import json
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


def _call(messages, json_mode):
    body = {"model": env("LLM_MODEL", "local-llm"), "messages": messages,
            "temperature": config()["llm"]["temperature"], "max_tokens": config()["llm"]["max_tokens"]}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    req = urllib.request.Request(_base() + "/chat/completions", data=json.dumps(body).encode("utf-8"),
                                 headers=_headers(), method="POST")
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read())
    return data["choices"][0]["message"]["content"], data.get("model"), round(time.time() - t0, 2), data.get("usage")


def chat(name, messages, json_mode=True):
    """Return dict(content, mode, model, seconds, prompt_hash, recorded_at)."""
    mode = env("LLM_MODE", "auto")
    rec_path = REC_DIR / f"{name}.json"
    prompt_hash = sha256(json.dumps(messages, ensure_ascii=False))[:12]
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
