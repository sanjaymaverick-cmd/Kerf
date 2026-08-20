export const CATEGORIES = ["tools", "spares", "consumables", "accessories"] as const;
export type Category = (typeof CATEGORIES)[number];

export const BINS = ["billed", "ghost"] as const;
export type Bin = (typeof BINS)[number];

export const MOVE_KINDS = ["in", "out", "adjust"] as const;
export type MoveKind = (typeof MOVE_KINDS)[number];

export const CHANNELS = [
  "cash",
  "tally",
  "xml",
  "complimentary",
  "purchase",
  "partnership",
  "opening",
  "adjust",
] as const;
export type Channel = (typeof CHANNELS)[number];

export type Item = {
  id: string;
  sku: string;
  name: string;
  category: Category;
  unit: string;
  billedQty: number;
  ghostQty: number;
  billedCost: number;
  sellingPrice: number;
  reorderLevel: number;
  tallyName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Move = {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  batchId: string | null;
  kind: MoveKind;
  bin: Bin;
  qty: number;
  unitPrice: number;
  channel: Channel;
  party: string | null;
  voucherNo: string | null;
  note: string | null;
  occurredAt: string;
  createdAt: string;
};

export type LineInput = {
  itemId: string;
  qty: number;
  unitPrice: number;
  bin?: Bin;
};

export type ItemInput = {
  sku: string;
  name: string;
  category: Category;
  unit: string;
  billedCost: number;
  sellingPrice: number;
  reorderLevel: number;
  tallyName: string;
  notes: string;
};

export type ReceiveInput = {
  source: "purchase" | "complimentary" | "partnership";
  party: string;
  voucherNo: string;
  note: string;
  occurredAt: string;
  lines: LineInput[];
};

export type SaleInput = {
  channel: "cash" | "tally";
  party: string;
  voucherNo: string;
  note: string;
  occurredAt: string;
  lines: LineInput[];
};

export type Dashboard = {
  billedUnits: number;
  ghostUnits: number;
  billedValue: number;
  ghostRetailValue: number;
  itemCount: number;
  billedSkuCount: number;
  ghostSkuCount: number;
  lowStock: Item[];
  recentMoves: Move[];
  monthCash: number;
  monthTally: number;
  monthComplimentaryIn: number;
  weekSeries: { label: string; cash: number; tally: number }[];
};

export type TallyVoucher = {
  type: string;
  date: string;
  number: string;
  party: string;
  guid: string;
  entries: {
    stockItem: string;
    qty: number;
    rate: number;
    amount: number;
  }[];
};

export type TallyImportReport = {
  vouchers: number;
  lines: number;
  matched: number;
  created: number;
  short: number;
  skipped: number;
  duplicates: number;
  salesAmount: number;
  purchaseAmount: number;
  details: string[];
};
