import type { Sql } from "@/lib/db";
import { nid } from "@/lib/utils";
import type { Category } from "./types";

type SeedItem = {
  sku: string;
  name: string;
  category: Category;
  unit: string;
  billed: number;
  ghost: number;
  cost: number;
  sell: number;
  reorder: number;
  tally: string;
};

const CATALOG: SeedItem[] = [
  {
    sku: "BLD-300",
    name: "TCT Saw Blade 300×3.2",
    category: "tools",
    unit: "pcs",
    billed: 12,
    ghost: 64,
    cost: 980,
    sell: 1850,
    reorder: 20,
    tally: "TCT Saw Blade 300x3.2",
  },
  {
    sku: "BLD-120",
    name: "Scoring Blade 120mm",
    category: "tools",
    unit: "pcs",
    billed: 8,
    ghost: 16,
    cost: 640,
    sell: 1250,
    reorder: 6,
    tally: "Scoring Blade 120mm",
  },
  {
    sku: "BIT-12",
    name: "Router Bit Set 12pc",
    category: "tools",
    unit: "set",
    billed: 6,
    ghost: 28,
    cost: 1100,
    sell: 2400,
    reorder: 8,
    tally: "Router Bit Set 12pc",
  },
  {
    sku: "FORST-5",
    name: "Forstner Bit Set 5pc",
    category: "tools",
    unit: "set",
    billed: 4,
    ghost: 10,
    cost: 890,
    sell: 1750,
    reorder: 4,
    tally: "Forstner Bit Set 5pc",
  },
  {
    sku: "ER32-SET",
    name: "ER32 Collet Set",
    category: "tools",
    unit: "set",
    billed: 5,
    ghost: 18,
    cost: 780,
    sell: 1650,
    reorder: 4,
    tally: "ER32 Collet Set",
  },
  {
    sku: "CHS-MOR",
    name: "Mortise Chisel Set",
    category: "tools",
    unit: "set",
    billed: 3,
    ghost: 8,
    cost: 1450,
    sell: 2800,
    reorder: 2,
    tally: "Mortise Chisel Set",
  },
  {
    sku: "CUT-30",
    name: "Spindle Cutter Block 30mm",
    category: "tools",
    unit: "pcs",
    billed: 4,
    ghost: 6,
    cost: 3200,
    sell: 5400,
    reorder: 2,
    tally: "Spindle Cutter Block 30mm",
  },
  {
    sku: "KN-400",
    name: "HSS Planer Knife 400mm",
    category: "tools",
    unit: "pcs",
    billed: 10,
    ghost: 24,
    cost: 420,
    sell: 890,
    reorder: 8,
    tally: "HSS Planer Knife 400mm",
  },
  {
    sku: "DIAL-01",
    name: "Dial Indicator 0.01mm",
    category: "tools",
    unit: "pcs",
    billed: 6,
    ghost: 4,
    cost: 780,
    sell: 1450,
    reorder: 3,
    tally: "Dial Indicator 0.01mm",
  },
  {
    sku: "BRG-6205",
    name: "Spindle Bearing 6205-2RS",
    category: "spares",
    unit: "pcs",
    billed: 0,
    ghost: 96,
    cost: 0,
    sell: 280,
    reorder: 24,
    tally: "Spindle Bearing 6205-2RS",
  },
  {
    sku: "BLT-A48",
    name: "Drive Belt A-48",
    category: "spares",
    unit: "pcs",
    billed: 0,
    ghost: 48,
    cost: 0,
    sell: 180,
    reorder: 12,
    tally: "Drive Belt A-48",
  },
  {
    sku: "LS-TZ",
    name: "Limit Switch TZ-8108",
    category: "spares",
    unit: "pcs",
    billed: 0,
    ghost: 72,
    cost: 0,
    sell: 95,
    reorder: 20,
    tally: "Limit Switch TZ-8108",
  },
  {
    sku: "ESTOP-22",
    name: "E-Stop Mushroom 22mm",
    category: "spares",
    unit: "pcs",
    billed: 8,
    ghost: 36,
    cost: 90,
    sell: 220,
    reorder: 10,
    tally: "E-Stop Mushroom 22mm",
  },
  {
    sku: "HOSE-100",
    name: "Dust Hose 100mm × 5m",
    category: "spares",
    unit: "pcs",
    billed: 4,
    ghost: 12,
    cost: 540,
    sell: 1200,
    reorder: 6,
    tally: "Dust Hose 100mm x 5m",
  },
  {
    sku: "SOL-4V",
    name: "Solenoid Valve 4V210",
    category: "spares",
    unit: "pcs",
    billed: 0,
    ghost: 40,
    cost: 0,
    sell: 420,
    reorder: 10,
    tally: "Solenoid Valve 4V210",
  },
  {
    sku: "CYL-32",
    name: "Pneumatic Cylinder 32×100",
    category: "spares",
    unit: "pcs",
    billed: 0,
    ghost: 22,
    cost: 0,
    sell: 780,
    reorder: 6,
    tally: "Pneumatic Cylinder 32x100",
  },
  {
    sku: "TNUT-M8",
    name: "T-Slot Nut M8 pack 20",
    category: "spares",
    unit: "pack",
    billed: 0,
    ghost: 80,
    cost: 0,
    sell: 160,
    reorder: 20,
    tally: "T-Slot Nut M8 pack 20",
  },
  {
    sku: "SAND-80",
    name: "Sanding Belt 80 Grit pack 10",
    category: "consumables",
    unit: "pack",
    billed: 10,
    ghost: 48,
    cost: 220,
    sell: 540,
    reorder: 15,
    tally: "Sanding Belt 80 Grit pack 10",
  },
  {
    sku: "OIL-5L",
    name: "Spindle Oil 5L",
    category: "consumables",
    unit: "can",
    billed: 6,
    ghost: 18,
    cost: 280,
    sell: 650,
    reorder: 8,
    tally: "Spindle Oil 5L",
  },
  {
    sku: "PUSH-PR",
    name: "Push Stick Pair",
    category: "accessories",
    unit: "pair",
    billed: 0,
    ghost: 30,
    cost: 0,
    sell: 180,
    reorder: 8,
    tally: "Push Stick Pair",
  },
  {
    sku: "FENCE-CL",
    name: "Fence Clamp",
    category: "accessories",
    unit: "pcs",
    billed: 0,
    ghost: 24,
    cost: 0,
    sell: 320,
    reorder: 6,
    tally: "Fence Clamp",
  },
];

async function insertItem(sql: Sql, userId: string, item: SeedItem): Promise<string> {
  const id = nid();
  await sql`
    insert into kerf_items (
      id, user_id, sku, name, category, unit,
      billed_qty, ghost_qty, billed_cost, selling_price,
      reorder_level, tally_name, notes
    ) values (
      ${id}, ${userId}, ${item.sku}, ${item.name}, ${item.category}, ${item.unit},
      ${item.billed}, ${item.ghost}, ${item.cost}, ${item.sell},
      ${item.reorder}, ${item.tally}, ${null}
    )
  `;
  return id;
}

async function move(
  sql: Sql,
  args: {
    userId: string;
    itemId: string;
    batchId: string;
    kind: "in" | "out";
    bin: "billed" | "ghost";
    qty: number;
    unitPrice: number;
    channel: string;
    party: string;
    voucherNo: string;
    note: string;
    occurredAt: string;
  },
) {
  await sql`
    insert into kerf_moves (
      id, user_id, item_id, batch_id, kind, bin, qty, unit_price,
      channel, party, voucher_no, note, occurred_at
    ) values (
      ${nid()}, ${args.userId}, ${args.itemId}, ${args.batchId}, ${args.kind}, ${args.bin},
      ${args.qty}, ${args.unitPrice}, ${args.channel}, ${args.party}, ${args.voucherNo},
      ${args.note}, ${args.occurredAt}
    )
  `;
}

async function batch(
  sql: Sql,
  userId: string,
  kind: string,
  channel: string,
  party: string,
  voucherNo: string,
  note: string,
  occurredAt: string,
): Promise<string> {
  const id = nid();
  await sql`
    insert into kerf_batches (
      id, user_id, kind, channel, party, voucher_no, note, occurred_at
    ) values (
      ${id}, ${userId}, ${kind}, ${channel}, ${party}, ${voucherNo}, ${note}, ${occurredAt}
    )
  `;
  return id;
}

export async function seedWorkshop(sql: Sql, userId: string): Promise<void> {
  const ids = new Map<string, string>();
  for (const item of CATALOG) {
    ids.set(item.sku, await insertItem(sql, userId, item));
  }

  const openingAt = "2026-04-12T08:30:00.000Z";
  const crateId = await batch(
    sql,
    userId,
    "inbound",
    "complimentary",
    "Qingdao Linyi WoodTech",
    "PL-8821",
    "Complimentary spares packed with the sister mill's machine container. No invoice.",
    openingAt,
  );
  const partnerId = await batch(
    sql,
    userId,
    "inbound",
    "partnership",
    "Sister mill (machines)",
    "PTN-0441",
    "Tooling that rode with the machines, sold across in partnership.",
    openingAt,
  );

  for (const item of CATALOG) {
    const itemId = ids.get(item.sku);
    if (!itemId) continue;
    if (item.ghost > 0) {
      const soldGhost =
        item.sku === "BLD-300" ? 16 : item.sku === "BRG-6205" ? 24 : item.sku === "SAND-80" ? 12 : 0;
      await move(sql, {
        userId,
        itemId,
        batchId: crateId,
        kind: "in",
        bin: "ghost",
        qty: item.ghost + soldGhost,
        unitPrice: 0,
        channel: "complimentary",
        party: "Qingdao Linyi WoodTech",
        voucherNo: "PL-8821",
        note: "Crate extras",
        occurredAt: openingAt,
      });
    }
    if (item.billed > 0) {
      const soldBilled = item.sku === "ER32-SET" ? 1 : item.sku === "BLD-300" ? 4 : 0;
      await move(sql, {
        userId,
        itemId,
        batchId: partnerId,
        kind: "in",
        bin: "billed",
        qty: item.billed + soldBilled,
        unitPrice: item.cost,
        channel: "partnership",
        party: "Sister mill (machines)",
        voucherNo: "PTN-0441",
        note: "Partnership transfer",
        occurredAt: openingAt,
      });
    }
  }

  const cash1 = await batch(
    sql,
    userId,
    "sale",
    "cash",
    "Sharma Joinery",
    "CASH-0814",
    "Walk-in cash. Ghost bin.",
    "2026-08-14T11:10:00.000Z",
  );
  await move(sql, {
    userId,
    itemId: ids.get("BLD-300")!,
    batchId: cash1,
    kind: "out",
    bin: "ghost",
    qty: 10,
    unitPrice: 1850,
    channel: "cash",
    party: "Sharma Joinery",
    voucherNo: "CASH-0814",
    note: "",
    occurredAt: "2026-08-14T11:10:00.000Z",
  });
  await move(sql, {
    userId,
    itemId: ids.get("BRG-6205")!,
    batchId: cash1,
    kind: "out",
    bin: "ghost",
    qty: 16,
    unitPrice: 280,
    channel: "cash",
    party: "Sharma Joinery",
    voucherNo: "CASH-0814",
    note: "",
    occurredAt: "2026-08-14T11:10:00.000Z",
  });

  const cash2 = await batch(
    sql,
    userId,
    "sale",
    "cash",
    "Kanakpura Carpentry",
    "CASH-0808",
    "Cash against delivery.",
    "2026-08-08T16:40:00.000Z",
  );
  await move(sql, {
    userId,
    itemId: ids.get("SAND-80")!,
    batchId: cash2,
    kind: "out",
    bin: "ghost",
    qty: 12,
    unitPrice: 540,
    channel: "cash",
    party: "Kanakpura Carpentry",
    voucherNo: "CASH-0808",
    note: "",
    occurredAt: "2026-08-08T16:40:00.000Z",
  });
  await move(sql, {
    userId,
    itemId: ids.get("BLD-300")!,
    batchId: cash2,
    kind: "out",
    bin: "ghost",
    qty: 6,
    unitPrice: 1850,
    channel: "cash",
    party: "Kanakpura Carpentry",
    voucherNo: "CASH-0808",
    note: "",
    occurredAt: "2026-08-08T16:40:00.000Z",
  });
  await move(sql, {
    userId,
    itemId: ids.get("BRG-6205")!,
    batchId: cash2,
    kind: "out",
    bin: "ghost",
    qty: 8,
    unitPrice: 280,
    channel: "cash",
    party: "Kanakpura Carpentry",
    voucherNo: "CASH-0808",
    note: "",
    occurredAt: "2026-08-08T16:40:00.000Z",
  });

  const tally1 = await batch(
    sql,
    userId,
    "sale",
    "tally",
    "Rosewood Interiors",
    "S-1042",
    "Entered from Tally sales voucher.",
    "2026-07-28T09:00:00.000Z",
  );
  await move(sql, {
    userId,
    itemId: ids.get("ER32-SET")!,
    batchId: tally1,
    kind: "out",
    bin: "billed",
    qty: 1,
    unitPrice: 1650,
    channel: "tally",
    party: "Rosewood Interiors",
    voucherNo: "S-1042",
    note: "",
    occurredAt: "2026-07-28T09:00:00.000Z",
  });
  await move(sql, {
    userId,
    itemId: ids.get("BLD-300")!,
    batchId: tally1,
    kind: "out",
    bin: "billed",
    qty: 4,
    unitPrice: 1850,
    channel: "tally",
    party: "Rosewood Interiors",
    voucherNo: "S-1042",
    note: "",
    occurredAt: "2026-07-28T09:00:00.000Z",
  });
}
