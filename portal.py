"""Tiny helper for the Comune di Milano open data portal (CKAN API, no key needed).

    python portal.py search residenza
    python portal.py show ds549-sedi-dei-servizi-anagrafici
    python portal.py download ds549-sedi-dei-servizi-anagrafici --format CSV
"""
import argparse
import json
import pathlib
import urllib.parse
import urllib.request

BASE = "https://dati.comune.milano.it/api/3/action/"


def call(action: str, **params) -> dict:
    url = BASE + action + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as resp:
        data = json.load(resp)
    if not data.get("success"):
        raise RuntimeError(data.get("error"))
    return data["result"]


def search(query: str, rows: int = 20) -> list[dict]:
    """Return [{slug, title, formats}] for datasets matching the query."""
    result = call("package_search", q=query, rows=rows)
    return [
        {
            "slug": d["name"],
            "title": d["title"],
            "formats": sorted({r.get("format", "") for r in d.get("resources", [])}),
        }
        for d in result["results"]
    ]


def show(slug: str) -> dict:
    """Return title, notes and resources (name, format, url) of a dataset."""
    d = call("package_show", id=slug)
    return {
        "title": d["title"],
        "notes": d.get("notes", ""),
        "resources": [
            {"name": r["name"], "format": r.get("format"), "url": r["url"], "id": r["id"]}
            for r in d.get("resources", [])
        ],
    }


def download(slug: str, fmt: str = "CSV", out_dir: str = "data") -> pathlib.Path:
    """Download the first resource of the given format into out_dir."""
    for r in show(slug)["resources"]:
        if (r["format"] or "").upper() == fmt.upper():
            out = pathlib.Path(out_dir)
            out.mkdir(exist_ok=True)
            target = out / f"{slug}.{fmt.lower()}"
            urllib.request.urlretrieve(r["url"], target)
            return target
    raise FileNotFoundError(f"No {fmt} resource in {slug}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("command", choices=["search", "show", "download"])
    p.add_argument("arg")
    p.add_argument("--format", default="CSV")
    a = p.parse_args()
    if a.command == "search":
        for d in search(a.arg):
            print(f"{d['slug']}  |  {d['title']}  |  {', '.join(d['formats'])}")
    elif a.command == "show":
        print(json.dumps(show(a.arg), indent=2, ensure_ascii=False))
    else:
        print(download(a.arg, a.format))
