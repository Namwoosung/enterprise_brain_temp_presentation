"""Static checks for the deck. Python 3.8+, no packages, no browser.

    python tools/check_deck.py          (run inside presentation/)

What it checks (exit code 1 if any ERROR):
  - every id in js/deck.js ORDER has js/slides/<id>.js, and the file registers that same id
  - no duplicate ids in ORDER; slide files not in ORDER are listed (WARN)
  - steps: N is present; step numbers used in data-v / data-c / data-t / data-tr are <= N
  - notes.script exists and the number of paragraphs starting with '(→)' == steps - 1
  - quotes / brackets / backticks are balanced (cheap syntax sanity check)
  - if Node.js is installed: `node --check` on every slide file (real syntax check)
Step numbers built with ${...} at runtime cannot be checked here; open the deck in a browser:
a slide with a problem shows a red '⚠' badge at the top right (hover for details).
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLIDES = ROOT / "js" / "slides"
errors, warns = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warns.append(msg)


def read_order():
    txt = (ROOT / "js" / "deck.js").read_text(encoding="utf-8")
    m = re.search(r"ORDER\s*:\s*\[(.*?)\]", txt, re.S)
    if not m:
        err("js/deck.js: ORDER: [...] 를 찾을 수 없음")
        return []
    body = re.sub(r"/\*.*?\*/|//[^\n]*", "", m.group(1), flags=re.S)
    return re.findall(r"['\"]([^'\"]+)['\"]", body)


class _Bad(Exception):
    pass


def strip_strings(code):
    """Remove comments and string/template contents (keeping code inside ${...}) so bracket
    counting is meaningful. Regex literals are not handled; slide files rarely need them."""
    n = len(code)

    def near(i):
        return repr(code[i:i + 40])

    def scan(i, out, stop_at_brace):
        """Scan code from i. If stop_at_brace, return at the '}' closing a ${...}."""
        depth = 0
        while i < n:
            c = code[i]
            if code.startswith("//", i):
                j = code.find("\n", i)
                i = n if j < 0 else j
                continue
            if code.startswith("/*", i):
                j = code.find("*/", i + 2)
                if j < 0:
                    raise _Bad("닫히지 않은 /* 주석")
                i = j + 2
                continue
            if c in "'\"":
                j = i + 1
                while j < n and code[j] != c:
                    if code[j] == "\\":
                        j += 1
                    elif code[j] == "\n":
                        raise _Bad(f"줄이 끝나기 전에 닫히지 않은 따옴표 {c} (근처: {near(i)})")
                    j += 1
                if j >= n:
                    raise _Bad(f"닫히지 않은 {c} (근처: {near(i)})")
                out.append('""')
                i = j + 1
                continue
            if c == "`":
                start, j = i, i + 1
                while True:
                    if j >= n:
                        raise _Bad(f"닫히지 않은 ` (근처: {near(start)})")
                    if code[j] == "\\":
                        j += 2
                        continue
                    if code[j] == "`":
                        break
                    if code.startswith("${", j):
                        j = scan(j + 2, out, True)
                        continue
                    j += 1
                out.append('""')
                i = j + 1
                continue
            if stop_at_brace:
                if c == "{":
                    depth += 1
                elif c == "}":
                    if depth == 0:
                        return i + 1
                    depth -= 1
            out.append(c)
            i += 1
        if stop_at_brace:
            raise _Bad("닫히지 않은 ${ ... }")
        return i

    out = []
    try:
        scan(0, out, False)
    except _Bad as e:
        return None, str(e)
    return "".join(out), None


def balanced(code):
    stripped, problem = strip_strings(code)
    if problem:
        return problem
    pairs, stack = {")": "(", "]": "[", "}": "{"}, []
    for k, c in enumerate(stripped):
        if c in "([{":
            stack.append(c)
        elif c in ")]}":
            if not stack or stack[-1] != pairs[c]:
                return f"괄호 짝이 맞지 않음: '{c}' (앞부분: {stripped[max(0, k - 60):k]!r})"
            stack.pop()
    return f"닫히지 않은 괄호 {stack}" if stack else None


def step_numbers(txt):
    used = []
    for m in re.finditer(r'data-v="(\d+)(?:-(\d+))?"', txt):
        used += [int(x) for x in m.groups() if x]
    for m in re.finditer(r'data-c="([^"$]*)"', txt):
        for rule in m.group(1).split(";"):
            if "@" in rule:
                used += [int(x) for x in re.findall(r"\d+", rule.split("@")[1])]
    for m in re.finditer(r'data-(?:t|tr)="([^"]*)"', txt):
        used += [int(x) for x in re.findall(r"(?:^|[|;])(\d+):", m.group(1))]
    return used


def notes_script(txt):
    m = re.search(r"\bscript\s*:\s*\[(.*?)\n\s*\]", txt, re.S)
    if not m:
        return None
    return re.findall(r"^\s*(['\"])(.*?)\1\s*,?\s*$", m.group(1), re.M)


def check_slide(sid, path):
    txt = path.read_text(encoding="utf-8")
    ids = re.findall(r"\bid\s*:\s*['\"]([^'\"]+)['\"]", txt)
    if ids[:1] != [sid]:
        err(f"{path.name}: 파일 안의 id가 {ids[:1]} — 파일 이름({sid})과 같아야 함")
    if txt.count("DECK.register(") != 1:
        err(f"{path.name}: DECK.register( 가 정확히 1번 있어야 함")
    m = re.search(r"\bsteps\s*:\s*(\d+)", txt)
    if not m:
        err(f"{path.name}: steps: 숫자 가 없음")
        return
    steps = int(m.group(1))
    used = step_numbers(txt)
    if used and max(used) > steps:
        err(f"{path.name}: 화면이 스텝 {max(used)}까지 쓰는데 steps가 {steps}")
    dynamic = "data-v=\"${" in txt or "data-v='${" in txt
    if not dynamic and steps > 1:
        starts = {int(x) for x in re.findall(r'data-v="(\d+)', txt)}
        starts |= {u for u in used}
        missing = [s for s in range(2, steps + 1) if s not in starts]
        if missing:
            warn(f"{path.name}: 스텝 {missing}에서 새로 나타나거나 바뀌는 요소가 안 보임(의도한 것이면 무시)")
    script = notes_script(txt)
    if script is None:
        err(f"{path.name}: notes: {{ script: [ ... ] }} 를 찾을 수 없음")
    else:
        arrows = sum(1 for _, line in script if line.startswith("(→)"))
        if arrows != steps - 1:
            err(f"{path.name}: 노트 script의 '(→)' 문단이 {arrows}개 — steps({steps}) - 1 = {steps - 1}개여야 함")
        if script and script[0][1].startswith("(→)"):
            err(f"{path.name}: 노트 script의 첫 문단은 '(→)'로 시작하면 안 됨(스텝 1)")
    problem = balanced(txt)
    if problem:
        err(f"{path.name}: {problem}")


def main():
    if not sys.stdout.isatty():  # captured by a tool / agent: print UTF-8 so Korean is readable
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    order = read_order()
    seen = set()
    for sid in order:
        if not re.fullmatch(r"[A-Za-z0-9_]+", sid):
            err(f"ORDER의 id '{sid}': 영문 · 숫자 · 밑줄만 쓸 수 있음")
        if sid in seen:
            err(f"ORDER에 '{sid}'가 두 번 있음")
        seen.add(sid)
        p = SLIDES / f"{sid}.js"
        if not p.exists():
            err(f"ORDER의 '{sid}': js/slides/{sid}.js 파일이 없음")
            continue
        check_slide(sid, p)
    for p in sorted(SLIDES.glob("*.js")):
        if p.stem not in seen and not p.stem.startswith("_"):
            warn(f"{p.name}: ORDER에 없어서 화면에 나오지 않음")
    node = shutil.which("node")
    if node:
        for sid in order:
            p = SLIDES / f"{sid}.js"
            if p.exists():
                r = subprocess.run([node, "--check", str(p)], capture_output=True, text=True, encoding="utf-8")
                if r.returncode:
                    err(f"{p.name}: node --check 실패\n{r.stderr.strip()}")
    print(f"slides: {len(order)}  ({'node 문법 검사 포함' if node else 'node 없음: 괄호·따옴표만 검사'})")
    for w in warns:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print("OK" if not errors else f"{len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
