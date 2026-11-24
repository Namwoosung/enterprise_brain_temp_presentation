"""Create a new slide from js/slides/_TEMPLATE.js and put it into the ORDER of js/deck.js.

    python tools/new_slide.py P11a --after P11      # new file js/slides/P11a.js, placed after P11
    python tools/new_slide.py APPX1 --end           # placed at the end
    python tools/new_slide.py P11b --after P11 --copy P11   # start from a copy of P11 instead of the template

Then edit js/slides/<id>.js (title, html(), notes) and run python tools/check_deck.py.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    flags = [a for a in argv if a.startswith("--")]
    if not args or not re.fullmatch(r"[A-Za-z0-9_]+", args[0]):
        print(__doc__)
        return 2
    sid = args[0]
    after = argv[argv.index("--after") + 1] if "--after" in flags else None
    copy = argv[argv.index("--copy") + 1] if "--copy" in flags else None
    if not after and "--end" not in flags:
        print("ERROR: --after <id> 또는 --end 를 주세요")
        return 2
    dst = ROOT / "js" / "slides" / f"{sid}.js"
    if dst.exists():
        print(f"ERROR: {dst.name} 이 이미 있음")
        return 1
    src = ROOT / "js" / "slides" / (f"{copy}.js" if copy else "_TEMPLATE.js")
    if not src.exists():
        print(f"ERROR: {src.name} 없음")
        return 1
    txt = src.read_text(encoding="utf-8")
    old_id = copy or "NEW_ID"
    txt, n = re.subn(r"(\bid\s*:\s*)['\"]" + re.escape(old_id) + r"['\"]", rf"\1'{sid}'", txt, count=1)
    if n != 1:
        print(f"ERROR: {src.name} 에서 id: '{old_id}' 를 찾지 못함")
        return 1
    if copy:
        txt = re.sub(r"^/\* " + re.escape(copy) + r" ·", f"/* {sid} ·", txt, count=1)

    deck = ROOT / "js" / "deck.js"
    d = deck.read_text(encoding="utf-8")
    m = re.search(r"(ORDER\s*:\s*\[)(.*?)(\])", d, re.S)
    ids = re.findall(r"['\"]([^'\"]+)['\"]", re.sub(r"/\*.*?\*/|//[^\n]*", "", m.group(2), flags=re.S))
    if sid in ids:
        print(f"ERROR: ORDER에 {sid} 가 이미 있음")
        return 1
    if after:
        if after not in ids:
            print(f"ERROR: ORDER에 {after} 가 없음")
            return 1
        ids.insert(ids.index(after) + 1, sid)
    else:
        ids.append(sid)
    rows = ["    " + ", ".join(f"'{x}'" for x in ids[i:i + 10]) + "," for i in range(0, len(ids), 10)]
    d = d[:m.start(2)] + "\n" + "\n".join(rows) + "\n  " + d[m.end(2):]
    dst.write_text(txt, encoding="utf-8", newline="\n")
    deck.write_text(d, encoding="utf-8", newline="\n")
    pos = ids.index(sid) + 1
    print(f"created js/slides/{sid}.js (from {src.name}) · ORDER {pos}/{len(ids)}")
    return 0


if __name__ == "__main__":
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8")
        except Exception:
            pass
    sys.exit(main(sys.argv[1:]))
