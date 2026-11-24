"""Shared helpers: paths, config, .env, ontology access, artifacts, Neo4j driver."""
import hashlib
import json
import os
import re
from functools import lru_cache
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent


def load_env(path=ROOT / ".env"):
    """Tiny .env reader (no dependency). Existing environment variables win."""
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.split(" #")[0].strip())


load_env()


def env(key, default=None):
    return os.environ.get(key, default)


@lru_cache(None)
def config():
    return yaml.safe_load((ROOT / "config" / "demo.yaml").read_text(encoding="utf-8"))


def path_of(key):
    return ROOT / config()["paths"][key]


@lru_cache(None)
def ontology():
    return yaml.safe_load(path_of("ontology").read_text(encoding="utf-8"))


@lru_cache(None)
def lexicon():
    return yaml.safe_load(path_of("lexicon").read_text(encoding="utf-8"))


@lru_cache(None)
def phonetic():
    return yaml.safe_load(path_of("phonetic").read_text(encoding="utf-8"))


@lru_cache(None)
def entities():
    return yaml.safe_load(path_of("entities").read_text(encoding="utf-8"))["entities"]


@lru_cache(None)
def corpus():
    return yaml.safe_load(path_of("corpus").read_text(encoding="utf-8"))["articles"]


def input_def(input_id):
    for i in config()["inputs"]:
        if i["id"] == input_id:
            return i
    raise KeyError(f"unknown input: {input_id}")


def uid(cls, *key_values):
    return f"{cls}:{'/'.join(str(v) for v in key_values)}"


def class_of(u):
    return u.split(":", 1)[0] if isinstance(u, str) and ":" in u else None


def entity_index():
    """uid -> entity dict (from the master list)."""
    return {uid(e["class"], e["code"]): e for e in entities()}


def sha256(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def short_hash(text, n=8):
    return sha256(text)[:n]


def split_front_matter(md):
    """Return (meta dict, body str) for a markdown file with --- front matter ---."""
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?(.*)$", md, re.S)
    if not m:
        return {}, md
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


# ---------------------------------------------------------------- artifacts
def runs_dir():
    d = path_of("runs")
    d.mkdir(parents=True, exist_ok=True)
    return d


def artifact_path(input_id, step):
    d = runs_dir() / input_id
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{step}.json"


def write_artifact(input_id, step, data):
    p = artifact_path(input_id, step)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    return data


def read_artifact(input_id, step):
    p = artifact_path(input_id, step)
    if not p.exists():
        raise FileNotFoundError(f"run step '{step}' for '{input_id}' first")
    return json.loads(p.read_text(encoding="utf-8"))


# ---------------------------------------------------------------- neo4j
_driver = None


def driver():
    global _driver
    if _driver is None:
        from neo4j import GraphDatabase
        _driver = GraphDatabase.driver(
            env("NEO4J_URI", "bolt://localhost:7687"),
            auth=(env("NEO4J_USER", "neo4j"), env("NEO4J_PASSWORD", "")),
            notifications_min_severity="OFF")  # hide "label does not exist yet" warnings
    return _driver


def db_name():
    return env("NEO4J_DATABASE", "neo4j")


def cypher(query, **params):
    """Run a read/write query and return a list of dicts."""
    with driver().session(database=db_name()) as s:
        return [r.data() for r in s.run(query, **params)]
