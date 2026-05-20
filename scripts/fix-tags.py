import pathlib

root = pathlib.Path(__file__).resolve().parents[1] / "src"
for path in root.rglob("*.tsx"):
    text = path.read_text(encoding="utf-8")
    fixed = text.replace("<motion", "<div").replace("</motion>", "</div>")
    if fixed != text:
        path.write_text(fixed, encoding="utf-8")
        print(path)
