import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { nid, num } from "@/lib/utils";
import { seedWorkshop } from "./seed";
import { classifyVoucher, parseTallyXml, voucherKey } from "./tally";
import type {
  Bin,
  Category,
  Channel,
  Dashboard,
  Item,
  ItemInput,
  Move,
  MoveKind,
  ReceiveInput,
  SaleInput,
  TallyImportReport,
} from "./types";

type ItemRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  billed_qty: number | string;
  ghost_qty: number | string;
  billed_cost: number | string;
  selling_price: number | string;
  reorder_level: number | string;
  tally_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type MoveRow = {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  batch_id: string | null;
  kind: string;
  bin: string;
  qty: number | string;
  unit_price: number | string;
  channel: string;
  party: string | null;
  voucher_no: string | null;
  note: string | null;
  occurred_at: string;
  created_at: string;
};

function mapItem(r: ItemRow): Item {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category as Category,
    unit: r.unit,
    billedQty: num(r.billed_qty),
    ghostQty: num(r.ghost_qty),
    billedCost: num(r.billed_cost),
    sellingPrice: num(r.selling_price),
    reorderLevel: num(r.reorder_level),
    tallyName: r.tally_name,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapMove(r: MoveRow): Move {
  return {
    id: r.id,
    itemId: r.item_id,
    itemName: r.item_name,
    itemSku: r.item_sku,
    batchId: r.batch_id,
    kind: r.kind as MoveKind,
    bin: r.bin as Bin,
    qty: num(r.qty),
    unitPrice: num(r.unit_price),
    channel: r.channel as Channel,
    party: r.party,
    voucherNo: r.voucher_no,
    note: r.note,
    occurredAt: r.occurred_at,
    createdAt: r.created_at,
  };
}

async function ensureSeed(sql: Sql, userId: string) {
  const flag = (process.env.KERF_SEED ?? "").trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return;
  const rows = await sql<{ c: number }>`
    select count(*)::int as c from kerf_items where user_id = ${userId}
  `;
  if (num(rows[0]?.c) === 0) await seedWorkshop(sql, userId);
}

function dateIso(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00.000Z`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function requireLines<T extends { itemId: string; qty: number }>(lines: T[]): T[] {
  const clean = lines.filter((l) => l.itemId && l.qty > 0);
  if (clean.length === 0) throw new Error("Add at least one line with quantity.");
  return clean;
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Dashboard> => {
    const sql = await getSql();
    await ensureSeed(sql, context.userId);
    const items = (await sql<ItemRow>`
      select * from kerf_items where user_id = ${context.userId} order by name
    `).map(mapItem);

    const billedUnits = items.reduce((s, i) => s + i.billedQty, 0);
    const ghostUnits = items.reduce((s, i) => s + i.ghostQty, 0);
    const billedValue = items.reduce((s, i) => s + i.billedQty * i.billedCost, 0);
    const ghostRetailValue = items.reduce((s, i) => s + i.ghostQty * i.sellingPrice, 0);
    const lowStock = items.filter((i) => i.billedQty + i.ghostQty <= i.reorderLevel);

    const recent = (await sql<MoveRow>`
      select m.*, i.name as item_name, i.sku as item_sku
      from kerf_moves m
      join kerf_items i on i.id = m.item_id
      where m.user_id = ${context.userId}
      order by m.occurred_at desc, m.created_at desc
      limit 8
    `).map(mapMove);

    const start = new Date();
    start.setDate(start.getDate() - 56);
    const since = start.toISOString();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const outs = (await sql<MoveRow>`
      select m.*, i.name as item_name, i.sku as item_sku
      from kerf_moves m
      join kerf_items i on i.id = m.item_id
      where m.user_id = ${context.userId}
        and m.kind = 'out'
        and m.occurred_at >= ${since}
    `).map(mapMove);

    const ins = await sql<{ qty: number | string }>`
      select coalesce(sum(qty), 0) as qty
      from kerf_moves
      where user_id = ${context.userId}
        and kind = 'in'
        and bin = 'ghost'
        and occurred_at >= ${monthStart.toISOString()}
    `;

    const weekSeries: Dashboard["weekSeries"] = [];
    for (let i = 7; i >= 0; i -= 1) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const from = new Date(end);
      from.setDate(from.getDate() - 7);
      const label = from.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const slice = outs.filter((m) => {
        const t = new Date(m.occurredAt).getTime();
        return t >= from.getTime() && t < end.getTime();
      });
      weekSeries.push({
        label,
        cash: slice.filter((m) => m.channel === "cash").reduce((s, m) => s + m.qty * m.unitPrice, 0),
        tally: slice
          .filter((m) => m.channel === "tally" || m.channel === "xml")
          .reduce((s, m) => s + m.qty * m.unitPrice, 0),
      });
    }

    const thisMonth = outs.filter((m) => new Date(m.occurredAt) >= monthStart);

    return {
      billedUnits,
      ghostUnits,
      billedValue,
      ghostRetailValue,
      itemCount: items.length,
      billedSkuCount: items.filter((i) => i.billedQty > 0).length,
      ghostSkuCount: items.filter((i) => i.ghostQty > 0).length,
      lowStock,
      recentMoves: recent,
      monthCash: thisMonth
        .filter((m) => m.channel === "cash")
        .reduce((s, m) => s + m.qty * m.unitPrice, 0),
      monthTally: thisMonth
        .filter((m) => m.channel === "tally" || m.channel === "xml")
        .reduce((s, m) => s + m.qty * m.unitPrice, 0),
      monthComplimentaryIn: num(ins[0]?.qty),
      weekSeries,
    };
  });

export const listItems = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Item[]> => {
    const sql = await getSql();
    await ensureSeed(sql, context.userId);
    const rows = await sql<ItemRow>`
      select * from kerf_items where user_id = ${context.userId} order by category, name
    `;
    return rows.map(mapItem);
  });

export const getItem = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }): Promise<Item | null> => {
    const sql = await getSql();
    const rows = await sql<ItemRow>`
      select * from kerf_items where id = ${id} and user_id = ${context.userId} limit 1
    `;
    return rows[0] ? mapItem(rows[0]) : null;
  });

export const listMoves = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { itemId?: string; limit?: number } | undefined) => input ?? {})
  .handler(async ({ context, data }): Promise<Move[]> => {
    const sql = await getSql();
    const limit = Math.min(Math.max(data.limit ?? 200, 1), 500);
    if (data.itemId) {
      const rows = await sql.query<MoveRow>(
        `select m.*, i.name as item_name, i.sku as item_sku
         from kerf_moves m
         join kerf_items i on i.id = m.item_id
         where m.user_id = $1 and m.item_id = $2
         order by m.occurred_at desc, m.created_at desc
         limit $3`,
        [context.userId, data.itemId, limit],
      );
      return rows.map(mapMove);
    }
    const rows = await sql.query<MoveRow>(
      `select m.*, i.name as item_name, i.sku as item_sku
       from kerf_moves m
       join kerf_items i on i.id = m.item_id
       where m.user_id = $1
       order by m.occurred_at desc, m.created_at desc
       limit $2`,
      [context.userId, limit],
    );
    return rows.map(mapMove);
  });

export const createItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ItemInput) => input)
  .handler(async ({ context, data }): Promise<Item> => {
    const sql = await getSql();
    const sku = data.sku.trim().toUpperCase();
    const name = data.name.trim();
    if (!sku || !name) throw new Error("SKU and name are required.");
    const existing = await sql<{ id: string }>`
      select id from kerf_items where user_id = ${context.userId} and sku = ${sku} limit 1
    `;
    if (existing[0]) throw new Error(`SKU ${sku} already exists.`);
    const id = nid();
    await sql`
      insert into kerf_items (
        id, user_id, sku, name, category, unit, billed_cost, selling_price,
        reorder_level, tally_name, notes
      ) values (
        ${id}, ${context.userId}, ${sku}, ${name}, ${data.category}, ${data.unit || "pcs"},
        ${data.billedCost || 0}, ${data.sellingPrice || 0}, ${data.reorderLevel || 0},
        ${data.tallyName.trim() || name}, ${data.notes.trim() || null}
      )
    `;
    const rows = await sql<ItemRow>`select * from kerf_items where id = ${id}`;
    return mapItem(rows[0]);
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string } & Partial<ItemInput>) => input)
  .handler(async ({ context, data }): Promise<Item> => {
    const sql = await getSql();
    const rows = await sql<ItemRow>`
      select * from kerf_items where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    if (!rows[0]) throw new Error("Item not found.");
    const cur = mapItem(rows[0]);
    const sku = (data.sku ?? cur.sku).trim().toUpperCase();
    const name = (data.name ?? cur.name).trim();
    await sql`
      update kerf_items set
        sku = ${sku},
        name = ${name},
        category = ${data.category ?? cur.category},
        unit = ${data.unit ?? cur.unit},
        billed_cost = ${data.billedCost ?? cur.billedCost},
        selling_price = ${data.sellingPrice ?? cur.sellingPrice},
        reorder_level = ${data.reorderLevel ?? cur.reorderLevel},
        tally_name = ${data.tallyName ?? cur.tallyName},
        notes = ${data.notes ?? cur.notes},
        updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    const next = await sql<ItemRow>`select * from kerf_items where id = ${data.id}`;
    return mapItem(next[0]);
  });

async function applyIn(
  sql: Sql,
  userId: string,
  itemId: string,
  bin: Bin,
  qty: number,
  unitPrice: number,
) {
  if (bin === "billed") {
    await sql`
      update kerf_items
      set billed_qty = billed_qty + ${qty},
          billed_cost = case when ${unitPrice} > 0 then ${unitPrice} else billed_cost end,
          updated_at = now()
      where id = ${itemId} and user_id = ${userId}
    `;
  } else {
    await sql`
      update kerf_items
      set ghost_qty = ghost_qty + ${qty}, updated_at = now()
      where id = ${itemId} and user_id = ${userId}
    `;
  }
}

async function applyOut(
  sql: Sql,
  userId: string,
  itemId: string,
  bin: Bin,
  qty: number,
  allowNegative: boolean,
) {
  const rows = await sql<ItemRow>`
    select * from kerf_items where id = ${itemId} and user_id = ${userId} limit 1
  `;
  if (!rows[0]) throw new Error("Item not found.");
  const item = mapItem(rows[0]);
  const have = bin === "billed" ? item.billedQty : item.ghostQty;
  if (!allowNegative && have < qty) {
    throw new Error(`Not enough ${bin} stock for ${item.name}. Have ${have}, need ${qty}.`);
  }
  if (bin === "billed") {
    await sql`
      update kerf_items
      set billed_qty = billed_qty - ${qty}, updated_at = now()
      where id = ${itemId} and user_id = ${userId}
    `;
  } else {
    await sql`
      update kerf_items
      set ghost_qty = ghost_qty - ${qty}, updated_at = now()
      where id = ${itemId} and user_id = ${userId}
    `;
  }
  return item;
}

export const receiveStock = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ReceiveInput) => input)
  .handler(async ({ context, data }): Promise<{ batchId: string }> => {
    const lines = requireLines(data.lines);
    const sql = await getSql();
    const bin: Bin = data.source === "complimentary" ? "ghost" : "billed";
    const channel: Channel =
      data.source === "complimentary"
        ? "complimentary"
        : data.source === "partnership"
          ? "partnership"
          : "purchase";
    const occurredAt = dateIso(data.occurredAt);
    const batchId = nid();
    await sql`
      insert into kerf_batches (id, user_id, kind, channel, party, voucher_no, note, occurred_at)
      values (
        ${batchId}, ${context.userId}, ${"inbound"}, ${channel},
        ${data.party.trim() || null}, ${data.voucherNo.trim() || null},
        ${data.note.trim() || null}, ${occurredAt}
      )
    `;
    for (const line of lines) {
      await applyIn(sql, context.userId, line.itemId, bin, line.qty, line.unitPrice);
      await sql`
        insert into kerf_moves (
          id, user_id, item_id, batch_id, kind, bin, qty, unit_price,
          channel, party, voucher_no, note, occurred_at
        ) values (
          ${nid()}, ${context.userId}, ${line.itemId}, ${batchId}, ${"in"}, ${bin},
          ${line.qty}, ${line.unitPrice}, ${channel},
          ${data.party.trim() || null}, ${data.voucherNo.trim() || null},
          ${data.note.trim() || null}, ${occurredAt}
        )
      `;
    }
    return { batchId };
  });

export const registerSale = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: SaleInput) => input)
  .handler(async ({ context, data }): Promise<{ batchId: string }> => {
    const lines = requireLines(data.lines);
    const sql = await getSql();
    const defaultBin: Bin = data.channel === "cash" ? "ghost" : "billed";
    const occurredAt = dateIso(data.occurredAt);
    const batchId = nid();
    await sql`
      insert into kerf_batches (id, user_id, kind, channel, party, voucher_no, note, occurred_at)
      values (
        ${batchId}, ${context.userId}, ${"sale"}, ${data.channel},
        ${data.party.trim() || null}, ${data.voucherNo.trim() || null},
        ${data.note.trim() || null}, ${occurredAt}
      )
    `;
    for (const line of lines) {
      const bin = line.bin ?? defaultBin;
      await applyOut(sql, context.userId, line.itemId, bin, line.qty, false);
      await sql`
        insert into kerf_moves (
          id, user_id, item_id, batch_id, kind, bin, qty, unit_price,
          channel, party, voucher_no, note, occurred_at
        ) values (
          ${nid()}, ${context.userId}, ${line.itemId}, ${batchId}, ${"out"}, ${bin},
          ${line.qty}, ${line.unitPrice}, ${data.channel},
          ${data.party.trim() || null}, ${data.voucherNo.trim() || null},
          ${data.note.trim() || null}, ${occurredAt}
        )
      `;
    }
    return { batchId };
  });

export const importTallyXml = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { xml: string }) => input)
  .handler(async ({ context, data }): Promise<TallyImportReport> => {
    const sql = await getSql();
    await ensureSeed(sql, context.userId);
    const vouchers = parseTallyXml(data.xml);
    const report: TallyImportReport = {
      vouchers: 0,
      lines: 0,
      matched: 0,
      created: 0,
      short: 0,
      skipped: 0,
      duplicates: 0,
      salesAmount: 0,
      purchaseAmount: 0,
      details: [],
    };
    if (vouchers.length === 0) {
      throw new Error("No inventory vouchers found in that XML.");
    }

    const items = (await sql<ItemRow>`
      select * from kerf_items where user_id = ${context.userId}
    `).map(mapItem);

    const posted = new Set(
      (
        await sql<{ meta: string | null }>`
          select meta from kerf_batches
          where user_id = ${context.userId} and channel = 'xml' and meta is not null
        `
      )
        .map((r) => r.meta)
        .filter((m): m is string => Boolean(m)),
    );

    const findItem = (name: string) => {
      const key = name.trim().toLowerCase();
      return items.find(
        (i) =>
          (i.tallyName ?? "").toLowerCase() === key ||
          i.name.toLowerCase() === key ||
          i.sku.toLowerCase() === key,
      );
    };

    for (const voucher of vouchers) {
      const kind = classifyVoucher(voucher.type);
      if (kind === "skip") {
        report.skipped += 1;
        report.details.push(`Skipped ${voucher.type} ${voucher.number || ""}`.trim());
        continue;
      }
      const key = voucherKey(voucher);
      if (posted.has(key)) {
        report.duplicates += 1;
        report.details.push(`Already posted ${voucher.type} ${voucher.number || key}`);
        continue;
      }
      report.vouchers += 1;
      const occurredAt = dateIso(voucher.date);
      const channel: Channel = "xml";
      const batchKind = kind === "sale" ? "sale" : "inbound";
      const batchId = nid();
      await sql`
        insert into kerf_batches (id, user_id, kind, channel, party, voucher_no, note, occurred_at, meta)
        values (
          ${batchId}, ${context.userId}, ${batchKind}, ${channel},
          ${voucher.party || null}, ${voucher.number || null},
          ${`Tally ${voucher.type}`}, ${occurredAt}, ${key}
        )
      `;
      posted.add(key);

      for (const entry of voucher.entries) {
        report.lines += 1;
        let item = findItem(entry.stockItem);
        if (!item) {
          const id = nid();
          const sku = `TLY-${entry.stockItem.replace(/[^a-zA-Z0-9]+/g, "").slice(0, 10).toUpperCase()}-${id.slice(0, 4).toUpperCase()}`;
          await sql`
            insert into kerf_items (
              id, user_id, sku, name, category, unit, billed_cost, selling_price, tally_name
            ) values (
              ${id}, ${context.userId}, ${sku}, ${entry.stockItem}, ${"spares"}, ${"pcs"},
              ${entry.rate}, ${entry.rate}, ${entry.stockItem}
            )
          `;
          const created = await sql<ItemRow>`select * from kerf_items where id = ${id}`;
          item = mapItem(created[0]);
          items.push(item);
          report.created += 1;
          report.details.push(`Created ${entry.stockItem}`);
        } else {
          report.matched += 1;
        }

        const lineAmount = entry.amount || entry.rate * entry.qty;
        if (kind === "purchase") {
          await applyIn(sql, context.userId, item.id, "billed", entry.qty, entry.rate);
          item.billedQty += entry.qty;
          if (entry.rate > 0) item.billedCost = entry.rate;
          report.purchaseAmount += lineAmount;
          await sql`
            insert into kerf_moves (
              id, user_id, item_id, batch_id, kind, bin, qty, unit_price,
              channel, party, voucher_no, note, occurred_at
            ) values (
              ${nid()}, ${context.userId}, ${item.id}, ${batchId}, ${"in"}, ${"billed"},
              ${entry.qty}, ${entry.rate}, ${channel}, ${voucher.party || null},
              ${voucher.number || null}, ${`Tally ${voucher.type}`}, ${occurredAt}
            )
          `;
        } else {
          if (item.billedQty < entry.qty) {
            report.short += 1;
            report.details.push(
              `Short ${entry.stockItem}: billed ${item.billedQty}, Tally ${entry.qty}`,
            );
          }
          await applyOut(sql, context.userId, item.id, "billed", entry.qty, true);
          item.billedQty -= entry.qty;
          report.salesAmount += lineAmount || entry.qty * item.sellingPrice;
          await sql`
            insert into kerf_moves (
              id, user_id, item_id, batch_id, kind, bin, qty, unit_price,
              channel, party, voucher_no, note, occurred_at
            ) values (
              ${nid()}, ${context.userId}, ${item.id}, ${batchId}, ${"out"}, ${"billed"},
              ${entry.qty}, ${entry.rate || item.sellingPrice}, ${channel},
              ${voucher.party || null}, ${voucher.number || null},
              ${`Tally ${voucher.type}`}, ${occurredAt}
            )
          `;
        }
      }
    }
    return report;
  });

export const exportBook = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
    }): Promise<{
      app: string;
      version: number;
      exportedAt: string;
      items: ItemRow[];
      batches: Array<Record<string, string | number | null>>;
      moves: Array<Record<string, string | number | null>>;
    }> => {
      const sql = await getSql();
      const items = await sql<ItemRow>`
        select * from kerf_items where user_id = ${context.userId} order by name
      `;
      const batches = await sql<Record<string, string | number | null>>`
        select * from kerf_batches where user_id = ${context.userId} order by occurred_at
      `;
      const moves = await sql<Record<string, string | number | null>>`
        select * from kerf_moves where user_id = ${context.userId} order by occurred_at
      `;
      return {
        app: "kerf",
        version: 1,
        exportedAt: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(items)) as ItemRow[],
        batches: JSON.parse(JSON.stringify(batches)) as Array<
          Record<string, string | number | null>
        >,
        moves: JSON.parse(JSON.stringify(moves)) as Array<
          Record<string, string | number | null>
        >,
      };
    },
  );
