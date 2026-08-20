import type { TallyVoucher } from "./types";

function decode(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function tag(xml: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "i");
  const m = xml.match(re);
  return m ? decode(m[1]) : "";
}

function blocks(xml: string, name: string): string[] {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

export function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, " ").replace(/[^\d.-]+/g, " ");
  const m = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!m) return 0;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : 0;
}

export function parseTallyDate(value: string): string {
  const t = value.trim();
  if (/^\d{8}$/.test(t)) {
    return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export function classifyVoucher(type: string): "sale" | "purchase" | "skip" {
  const t = type.toLowerCase();
  if (t.includes("purchase return") || t.includes("debit note")) return "sale";
  if (
    t.includes("purchase") ||
    t.includes("receipt note") ||
    t.includes("credit note") ||
    t.includes("sales return")
  ) {
    return "purchase";
  }
  if (t.includes("sales") || t.includes("invoice") || t.includes("pos")) return "sale";
  return "skip";
}

function parseEntries(voucherXml: string): TallyVoucher["entries"] {
  const chunks = [
    ...blocks(voucherXml, "ALLINVENTORYENTRIES.LIST"),
    ...blocks(voucherXml, "INVENTORYENTRIES.LIST"),
    ...blocks(voucherXml, "INVENTORYENTRIESIN.LIST"),
  ];
  const entries: TallyVoucher["entries"] = [];
  for (const chunk of chunks) {
    const stockItem = tag(chunk, "STOCKITEMNAME");
    if (!stockItem) continue;
    const qtyRaw = tag(chunk, "BILLEDQTY") || tag(chunk, "ACTUALQTY") || tag(chunk, "QTY");
    const qty = Math.round(parseNumber(qtyRaw));
    if (qty === 0) continue;
    const rate = parseNumber(tag(chunk, "RATE"));
    const amount = parseNumber(tag(chunk, "AMOUNT")) || rate * qty;
    entries.push({ stockItem, qty: Math.abs(qty), rate, amount: Math.abs(amount) });
  }
  return entries;
}

function isCancelled(xml: string): boolean {
  const raw = tag(xml, "ISCANCELLED") || tag(xml, "CANCELLED");
  return /^(yes|y|true|1)$/i.test(raw);
}

export function voucherKey(v: TallyVoucher): string {
  if (v.guid) return `guid:${v.guid}`;
  const lines = v.entries.map((e) => `${e.stockItem}:${e.qty}:${e.amount}`).join(";");
  return `xml:${v.date}|${v.type}|${v.number}|${v.party}|${lines}`;
}

export function parseTallyXml(xml: string): TallyVoucher[] {
  const stripped = xml.replace(/^\uFEFF/, "");
  const vouchers = blocks(stripped, "VOUCHER");
  const out: TallyVoucher[] = [];
  for (const v of vouchers) {
    if (isCancelled(v)) continue;
    const type = tag(v, "VOUCHERTYPENAME") || tag(v, "VOUCHERTYPE") || "Unknown";
    const entries = parseEntries(v);
    if (entries.length === 0) continue;
    out.push({
      type,
      date: parseTallyDate(tag(v, "DATE")),
      number: tag(v, "VOUCHERNUMBER") || tag(v, "REFERENCE") || "",
      party: tag(v, "PARTYLEDGERNAME") || tag(v, "PARTYNAME") || "",
      guid: tag(v, "GUID") || tag(v, "REMOTEID") || "",
      entries,
    });
  }
  return out;
}

export async function readXmlFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(u8);
  }
  if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(u8);
  }
  return new TextDecoder("utf-8").decode(u8);
}
