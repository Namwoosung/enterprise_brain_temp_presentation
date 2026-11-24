"""Insert or merge a step in one slide, renumbering everything mechanically.

    python tools/step.py insert P07 3     # new empty step 3; old steps 3.. become 4..
    python tools/step.py merge  P07 3     # step 3 is merged into step 2; old steps 4.. become 3..
    python tools/step.py insert P07 3 --dry-run   # show what would change, write nothing

What it changes in js/slides/<id>.js:
  - steps: N                          -> N+1 (insert) / N-1 (merge)
  - data-v="a" / "a-b"                 step numbers >= k shift by +1 / -1
  - data-c="cls@a-b;..."              same
  - data-t="a:html|b:html", data-tr="a:dx,dy;..."   same
  - notes.script                       insert: adds a '(→) ' placeholder paragraph where step k starts
                                       merge : removes the '(→) ' that starts step k (joins it to step k-1)
After 'insert', put the new content on the slide with data-v="k" and write the placeholder paragraph.
Step numbers computed in code (data-v="${...}") are NOT changed: the tool lists them so you can
edit those arrays / expressions by hand. Run python tools/check_deck.py afterwards.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLACEHOLDER = "(→) [새 스텝 대본을 여기에 씁니다]"


def shift_num(n, k, mode):
    if mode == "insert":
        return n + 1 if n >= k else n
    return n - 1 if n >= k else n          # merge: k -> k-1, k+1 -> k, ...


def shift_range(spec, k, mode):
    parts = spec.split("-")
    out = [str(shift_num(int(p), k, mode)) for p in parts]
    if len(out) == 2 and out[0] == out[1] and mode == "merge" and spec.count("-") == 1:
        return f"{out[0]}-{out[1]}"
    return "-".join(out)


def rewrite(txt, k, mode):
    changes = []

    def note(old, new):
        if old != new:
            changes.append(f"{old}  ->  {new}")
        return new

    def v_attr(m):
        return note(m.group(0), f'data-v="{shift_range(m.group(1), k, mode)}"')

    txt = re.sub(r'data-v="(\d+(?:-\d+)?)"', v_attr, txt)

    def c_attr(m):
        rules = []
        for rule in m.group(1).split(";"):
            if "@" in rule:
                cls, rng = rule.split("@", 1)
                if re.fullmatch(r"\d+(?:-\d+)?", rng.strip()):
                    rng = shift_range(rng.strip(), k, mode)
                rule = f"{cls}@{rng}"
            rules.append(rule)
        return note(m.group(0), 'data-c="' + ";".join(rules) + '"')

    txt = re.sub(r'data-c="([^"]*)"', c_attr, txt)

    def keyed(sep):
        def f(m):
            items = []
            for it in m.group(2).split(sep):
                mm = re.match(r"^(\d+):", it)
                if mm:
                    it = f"{shift_num(int(mm.group(1)), k, mode)}:{it[mm.end():]}"
                items.append(it)
            return note(m.group(0), f'data-{m.group(1)}="' + sep.join(items) + '"')
        return f

    txt = re.sub(r'data-(t)="([^"]*)"', keyed("|"), txt)
    txt = re.sub(r'data-(tr)="([^"]*)"', keyed(";"), txt)
    return txt, changes


def main(argv):
    dry = "--dry-run" in argv
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 3 or args[0] not in ("insert", "merge"):
        print(__doc__)
        return 2
    mode, sid, k = args[0], args[1], int(args[2])
    path = ROOT / "js" / "slides" / f"{sid}.js"
    if not path.exists():
        print(f"ERROR: {path} 없음")
        return 1
    with open(path, encoding="utf-8", newline="") as fh:   # keep the file's line endings
        txt = fh.read()
    m = re.search(r"\bsteps\s*:\s*(\d+)", txt)
    steps = int(m.group(1))
    if mode == "insert" and not 2 <= k <= steps + 1:
        print(f"ERROR: insert 위치는 2..{steps + 1} (스텝 1 앞에는 넣을 수 없음: 대신 insert {sid} 2 후 내용을 옮기세요)")
        return 1
    if mode == "merge" and not 2 <= k <= steps:
        print(f"ERROR: merge 할 스텝은 2..{steps}")
        return 1
    new_steps = steps + 1 if mode == "insert" else steps - 1
    txt = txt[:m.start()] + f"steps: {new_steps}" + txt[m.end():]
    txt, changes = rewrite(txt, k, mode)

    # notes.script: paragraph list; step s (s>=2) starts at the (s-1)-th paragraph beginning with '(→)'
    sm = re.search(r"(\bscript\s*:\s*\[\n)(.*?)(\n\s*\])", txt, re.S)
    if not sm:
        print("WARN: notes.script 를 찾지 못해 노트는 그대로 둠")
    else:
        lines = sm.group(2).split("\n")
        arrow_idx = [i for i, l in enumerate(lines) if re.match(r"^\s*['\"]\(→\)", l)]
        indent = re.match(r"^(\s*)", lines[0]).group(1) if lines else "        "
        if mode == "insert":
            pos = arrow_idx[k - 2] if k - 2 < len(arrow_idx) else len(lines)
            lines.insert(pos, f'{indent}"{PLACEHOLDER}",')
            changes.append(f"notes.script: {pos + 1}번째 문단 자리에 새 스텝 {k} 자리표시 문단 추가")
        else:
            i = arrow_idx[k - 2]
            lines[i] = re.sub(r"^(\s*['\"])\(→\)\s*", r"\1", lines[i])
            changes.append(f"notes.script: 스텝 {k}의 첫 문단에서 '(→)' 제거(스텝 {k - 1}에 합침)")
        txt = txt[:sm.start(2)] + "\n".join(lines) + txt[sm.end(2):]

    dynamic = sorted({mm.group(0) for mm in re.finditer(r'data-[vct]r?="[^"]*\$\{[^"]*"', txt)})
    print(f"{sid}: steps {steps} -> {new_steps} ({mode} {k})")
    for c in changes:
        print("  ", c)
    if dynamic:
        print("확인 필요: 코드로 계산하는 스텝 번호는 바꾸지 않았습니다. 이 식이 쓰는 배열/숫자를 직접 고치세요:")
        for d in dynamic:
            print("  ", d)
    if dry:
        print("(dry-run: 파일을 쓰지 않음)")
    else:
        with open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(txt)
    return 0


if __name__ == "__main__":
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except Exception:
            pass
    sys.exit(main(sys.argv[1:]))
