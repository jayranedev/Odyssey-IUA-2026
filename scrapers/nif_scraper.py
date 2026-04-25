import requests
from bs4 import BeautifulSoup
import json
import time
import re
from pathlib import Path

OUTPUT = Path("data/raw/nif_innovations.jsonl")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

BASE = "https://innovation.nif.org.in/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; JugaadGPT-research/1.0)",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://innovation.nif.org.in/search/Agriculture",
}

TARGET = 800
PAGE_SIZE = 9          # items per "Load More" batch
CAT_IDS = [1, 2, 3, 4, 5]
MAX_RETRIES = 3


def _post(path: str, data: dict, timeout: int = 20) -> requests.Response | None:
    url = BASE + path
    for attempt in range(MAX_RETRIES):
        try:
            return requests.post(url, data=data, headers=HEADERS, timeout=timeout)
        except requests.exceptions.Timeout:
            wait = 5 * (attempt + 1)
            print(f"  Timeout (attempt {attempt+1}/{MAX_RETRIES}), retrying in {wait}s…")
            time.sleep(wait)
        except Exception as e:
            print(f"  Error: {e}")
            return None
    return None


def _get(url: str, timeout: int = 20) -> requests.Response | None:
    for attempt in range(MAX_RETRIES):
        try:
            return requests.get(url, headers=HEADERS, timeout=timeout)
        except requests.exceptions.Timeout:
            wait = 5 * (attempt + 1)
            print(f"  Timeout (attempt {attempt+1}/{MAX_RETRIES}), retrying in {wait}s…")
            time.sleep(wait)
        except Exception as e:
            print(f"  Error: {e}")
            return None
    return None


def load_seen_urls() -> set:
    seen = set()
    if OUTPUT.exists():
        with open(OUTPUT, encoding="utf-8") as f:
            for line in f:
                try:
                    seen.add(json.loads(line)["source_url"])
                except Exception:
                    pass
    return seen


def fetch_listing_page(cat_id: int, start: int) -> list[dict]:
    """Return list of {title, detail_url} from one API page."""
    resp = _post("innovation/serach", {
        "start": start,
        "cat_id": cat_id,
        "inno_title": "",
        "view_type": "list",
        "get_keywords": "",
        "sub_cat_id": "",
    })
    if resp is None or resp.status_code != 200:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    seen_hrefs: dict[str, str] = {}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/innovation/detail/" not in href:
            continue
        if not href.startswith("http"):
            href = BASE.rstrip("/") + href
        title = a.get_text(strip=True)
        if href not in seen_hrefs and title and title.lower() != "view more":
            seen_hrefs[href] = title

    return [{"title": t, "detail_url": u} for u, t in seen_hrefs.items()]


def scrape_detail(detail_url: str) -> dict | None:
    resp = _get(detail_url)
    if resp is None or resp.status_code != 200:
        return None

    try:
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "header", "footer"]):
            tag.decompose()

        title_el = soup.find("h1") or soup.find("h2") or soup.find("h3")
        title = title_el.get_text(strip=True) if title_el else "Unknown"

        main = (
            soup.find("main")
            or soup.find("article")
            or soup.find("div", class_=re.compile(r"content|detail", re.I))
        )
        full_text = (main or soup).get_text(separator="\n", strip=True)

        return {
            "title": title,
            "source_url": detail_url,
            "source_name": "National Innovation Foundation India",
            "raw_full_text": full_text[:5000],
            "scraped_at": time.time(),
        }
    except Exception as e:
        print(f"  Parse error: {e}")
        return None


if __name__ == "__main__":
    seen_urls = load_seen_urls()
    already = len(seen_urls)
    print(f"Resuming: {already} records saved, need {max(0, TARGET - already)} more.\n")

    # --- Phase 1: collect listing URLs across all categories ---
    all_listings: list[dict] = []
    queued: set[str] = set()

    for cat_id in CAT_IDS:
        print(f"Category {cat_id}:")
        for start in range(0, 10_000, PAGE_SIZE):
            print(f"  start={start}", end=" ", flush=True)
            listings = fetch_listing_page(cat_id, start)
            if not listings:
                print("→ empty, stopping category")
                break

            new = [l for l in listings if l["detail_url"] not in seen_urls and l["detail_url"] not in queued]
            for l in new:
                queued.add(l["detail_url"])
            all_listings.extend(new)
            print(f"→ +{len(new)} new  (total queued: {len(all_listings)})")
            time.sleep(1.5)

            if already + len(all_listings) >= TARGET:
                break

        if already + len(all_listings) >= TARGET:
            print("Target listings collected, stopping category scan.")
            break

    print(f"\nQueued {len(all_listings)} detail pages to fetch (have {already} saved).\n")

    # --- Phase 2: fetch detail pages ---
    saved = already
    with open(OUTPUT, "a", encoding="utf-8") as f:
        for i, item in enumerate(all_listings):
            if saved >= TARGET:
                print(f"Reached target of {TARGET}.")
                break
            label = f"[{i+1}/{len(all_listings)}] total={saved+1}"
            print(f"{label}  {item['title'][:65]}")
            detail = scrape_detail(item["detail_url"])
            if detail:
                f.write(json.dumps(detail, ensure_ascii=False) + "\n")
                f.flush()
                saved += 1
            time.sleep(1.5)

    print(f"\nDone. {saved} records in {OUTPUT}")
