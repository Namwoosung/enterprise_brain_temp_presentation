"""Demo web server (stdlib only).

:DEMO_PORT (8800)          web UI + JSON API
:BROWSER_PROXY_PORT (8801) re-serves Neo4j Browser (NEO4J_HTTP_URL) without the headers that
                           forbid iframes (X-Frame-Options / CSP frame-ancestors). Local demo use only.

Usage:  python server/app.py
"""
import json
import mimetypes
import os
import sys
import threading
import traceback
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import yaml  # noqa: E402

from pipeline.common import env, config, ontology, corpus, entities, read_artifact  # noqa: E402
from pipeline.steps import ORDER, run_step  # noqa: E402
from pipeline import diff, graph, llm  # noqa: E402
import reset as reset_mod  # noqa: E402

WEB = ROOT / "web"
LOCK = threading.Lock()  # one pipeline action at a time


def json_bytes(obj):
    return json.dumps(obj, ensure_ascii=False, default=str).encode("utf-8")


def neo4j_status():
    try:
        comp = graph.cypher("CALL dbms.components() YIELD versions, edition RETURN versions[0] AS v, edition AS e")[0]
        return {"ok": True, "version": comp["v"], "edition": comp["e"], "demo": graph.is_demo_db(), **graph.stats()}
    except Exception as e:
        return {"ok": False, "error": f"{e.__class__.__name__}: {e}"[:200]}


def app_config():
    port = env("BROWSER_PROXY_PORT", "8801")
    bolt = env("NEO4J_URI", "bolt://localhost:7687")
    docs = {}
    for i in config()["inputs"]:
        try:
            docs[i["id"]] = read_artifact(i["id"], "collect")["meta"].get("doc_id")
        except FileNotFoundError:
            docs[i["id"]] = None
    notes_path = ROOT / "docs" / "dev_notes.yaml"
    return {
        "inputs": config()["inputs"], "steps": config()["steps"], "views": config()["views"], "docs": docs,
        "browser": {"proxy": f"http://localhost:{port}/browser/", "direct": env("NEO4J_HTTP_URL", "") + "/browser/",
                    "bolt": bolt, "database": env("NEO4J_DATABASE", "neo4j")},
        "llm": {"base_url": env("LLM_BASE_URL"), "model": env("LLM_MODEL"), "mode": env("LLM_MODE", "auto"),
                "server_up": llm.server_up(1)},
        "neo4j": neo4j_status(),
        "dev_notes": yaml.safe_load(notes_path.read_text(encoding="utf-8")) if notes_path.exists() else {},
    }


def overview():
    o = ontology()
    return {"ontology": {"version": o["version"], "classes": o["classes"], "relations": o["relations"],
                         "property_facts": o["property_facts"]},
            "corpus": [{k: a.get(k) for k in ("id", "baseline", "date", "publisher", "url", "title", "summary")}
                       | {"facts": len(a["facts"])} for a in corpus()],
            "entities": len(entities()), "cq_run0": diff.load_cq("run0"), "neo4j": neo4j_status()}


class App(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("[web] %s\n" % (fmt % args))

    def send(self, code, body, ctype="application/json; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def api(self, fn):
        try:
            self.send(200, json_bytes(fn()))
        except FileNotFoundError as e:
            self.send(404, json_bytes({"error": str(e)}))
        except Exception as e:
            traceback.print_exc()
            self.send(500, json_bytes({"error": f"{e.__class__.__name__}: {e}"}))

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        if u.path == "/api/config":
            return self.api(app_config)
        if u.path == "/api/overview":
            return self.api(overview)
        if u.path == "/api/artifact":
            return self.api(lambda: read_artifact(q["input"], q["step"]))
        if u.path == "/api/compare":
            return self.api(diff.compare)
        path = WEB / ("index.html" if u.path in ("/", "") else u.path.lstrip("/"))
        if path.is_file() and WEB in path.resolve().parents or path == WEB / "index.html":
            ctype = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype.endswith("javascript"):
                ctype += "; charset=utf-8"
            return self.send(200, path.read_bytes(), ctype)
        self.send(404, b"not found", "text/plain")

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        n = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(n) or b"{}")
        if u.path == "/api/reset":
            def do_reset():
                with LOCK:
                    return {"stats": reset_mod.reset(body.get("force", False))}
            return self.api(do_reset)
        if u.path == "/api/run":
            def do_run():
                step, inp = body["step"], body["input"]
                if step not in ORDER:
                    raise ValueError(f"unknown step {step}")
                with LOCK:
                    old = os.environ.get("LLM_MODE")
                    if body.get("llm_mode") in ("live", "replay", "auto"):
                        os.environ["LLM_MODE"] = body["llm_mode"]
                    try:
                        return run_step(inp, step)
                    finally:
                        if old is None:
                            os.environ.pop("LLM_MODE", None)
                        else:
                            os.environ["LLM_MODE"] = old
            return self.api(do_run)
        self.send(404, b"not found", "text/plain")


# ---------------------------------------------------------------- Neo4j Browser re-serving proxy
DROP = {"x-frame-options", "content-security-policy", "transfer-encoding", "connection", "content-length",
        "content-encoding"}


class BrowserProxy(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _forward(self):
        target = env("NEO4J_HTTP_URL", "http://localhost:7474").rstrip("/") + self.path
        n = int(self.headers.get("Content-Length", "0") or 0)
        data = self.rfile.read(n) if n else None
        hdrs = {k: v for k, v in self.headers.items() if k.lower() not in ("host", "accept-encoding", "connection")}
        req = urllib.request.Request(target, data=data, headers=hdrs, method=self.command)
        try:
            resp = urllib.request.urlopen(req, timeout=30)
        except urllib.error.HTTPError as e:
            resp = e
        except Exception as e:
            body = f"Neo4j Browser unreachable at {target}: {e}".encode()
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        body = resp.read()
        self.send_response(resp.status if hasattr(resp, "status") else resp.code)
        for k, v in resp.headers.items():
            if k.lower() not in DROP:
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    do_GET = do_POST = do_PUT = do_DELETE = do_HEAD = _forward


def main():
    port = int(env("DEMO_PORT", "8800"))
    bport = int(env("BROWSER_PROXY_PORT", "8801"))
    threading.Thread(target=ThreadingHTTPServer(("127.0.0.1", bport), BrowserProxy).serve_forever,
                     daemon=True).start()
    print(f"[web] demo        http://localhost:{port}/")
    print(f"[web] Neo4j Browser (iframe-able) http://localhost:{bport}/browser/  -> {env('NEO4J_HTTP_URL')}")
    ThreadingHTTPServer(("127.0.0.1", port), App).serve_forever()


if __name__ == "__main__":
    main()
