// Comprehensive Geographical Indication (GI) data for India, fetched live from
// Wikipedia's maintained "List of geographical indications in India" table
// (603+ registered GIs). Nothing is stored manually — we parse the article via
// the MediaWiki API (CORS-enabled) in the browser and cache it for the session.

const WIKI_API =
  "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_geographical_indications_in_India&prop=text&format=json&formatversion=2&redirects=1&origin=*";

export interface IndiaGI {
  serial: number;
  name: string;
  type: string;
  states: string[];
  year: string;
}

let cache: IndiaGI[] | null = null;
let inflight: Promise<IndiaGI[]> | null = null;

function cleanCell(el: Element | null | undefined): string {
  if (!el) return "";
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll("sup, style, .reference").forEach((n) => n.remove());
  return (clone.textContent ?? "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchIndiaGIs(): Promise<IndiaGI[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(WIKI_API);
    if (!res.ok) throw new Error(`Wikipedia parse failed: ${res.status}`);
    const data = (await res.json()) as { parse?: { text?: string } };
    const html = data.parse?.text ?? "";
    const doc = new DOMParser().parseFromString(html, "text/html");

    // The register is the largest wikitable on the page.
    let best: HTMLTableElement | null = null;
    let bestRows = 0;
    doc.querySelectorAll("table.wikitable").forEach((t) => {
      const n = t.querySelectorAll("tr").length;
      if (n > bestRows) {
        bestRows = n;
        best = t as HTMLTableElement;
      }
    });

    const out: IndiaGI[] = [];
    if (best) {
      (best as HTMLTableElement).querySelectorAll("tr").forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("td"));
        if (cells.length < 6) return; // skip header / malformed rows
        const name = cleanCell(cells[2]);
        if (!name) return;
        const serial = parseInt(cleanCell(cells[0]), 10);
        const stateRaw = cleanCell(cells[4]);
        out.push({
          serial: Number.isNaN(serial) ? out.length + 1 : serial,
          name,
          type: cleanCell(cells[3]) || "Other",
          states: stateRaw
            .split(/,|\/|;|·|&|\band\b/i)
            .map((s) => s.trim())
            .filter(Boolean),
          year: cleanCell(cells[5]),
        });
      });
    }
    cache = out;
    return out;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
