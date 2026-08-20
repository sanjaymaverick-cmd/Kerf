import { Plus, Trash2 } from "lucide-react";
import type { Bin, Item } from "@/lib/kerf/types";
import { nid } from "@/lib/utils";
import { ItemPicker } from "./item-picker";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/input";

export type DraftLine = {
  key: string;
  itemId: string;
  qty: string;
  unitPrice: string;
  bin?: Bin;
};

export function emptyLine(bin?: Bin): DraftLine {
  return { key: nid(), itemId: "", qty: "1", unitPrice: "", bin };
}

export function LineRows({
  items,
  lines,
  onChange,
  showBin,
  defaultBin,
}: {
  items: Item[];
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  showBin?: boolean;
  defaultBin?: Bin;
}) {
  const patch = (key: string, next: Partial<DraftLine>) => {
    onChange(lines.map((l) => (l.key === key ? { ...l, ...next } : l)));
  };

  return (
    <div className="space-y-3">
      {lines.map((line) => {
        const item = items.find((i) => i.id === line.itemId);
        return (
          <div
            key={line.key}
            className="grid gap-2 rounded-lg bg-surface p-3 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] md:grid-cols-[1fr_5.5rem_7.5rem_auto] md:items-end"
          >
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">
                Item
              </p>
              <ItemPicker
                items={items}
                value={line.itemId}
                onChange={(itemId) => {
                  const found = items.find((i) => i.id === itemId);
                  patch(line.key, {
                    itemId,
                    unitPrice:
                      line.unitPrice ||
                      (found ? String(defaultBin === "billed" ? found.billedCost : found.sellingPrice) : ""),
                  });
                }}
              />
              {item ? (
                <p className="mt-1 text-[11px] tabular-nums text-subtle">
                  On shelf · billed {item.billedQty} · ghost {item.ghostQty} {item.unit}
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">
                Qty
              </p>
              <Input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => patch(line.key, { qty: e.target.value })}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">
                Rate ₹
              </p>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => patch(line.key, { unitPrice: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              {showBin ? (
                <Select
                  value={line.bin ?? defaultBin ?? "ghost"}
                  onChange={(e) => patch(line.key, { bin: e.target.value as Bin })}
                  className="w-28"
                >
                  <option value="ghost">Ghost</option>
                  <option value="billed">Billed</option>
                </Select>
              ) : null}
              <Button
                type="button"
                variant="quiet"
                size="icon"
                className="size-11 shrink-0"
                onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
                disabled={lines.length === 1}
                aria-label="Remove line"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...lines, emptyLine(defaultBin)])}
      >
        <Plus className="size-4" />
        Add line
      </Button>
    </div>
  );
}
