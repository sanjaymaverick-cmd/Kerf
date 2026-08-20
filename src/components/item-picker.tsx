import { useMemo, useState } from "react";
import type { Item } from "@/lib/kerf/types";
import { cn } from "@/lib/utils";

export function ItemPicker({
  items,
  value,
  onChange,
  placeholder = "Search SKU or name",
}: {
  items: Item[];
  value: string;
  onChange: (itemId: string) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === value);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 12);
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.sku.toLowerCase().includes(s) ||
          (i.tallyName ?? "").toLowerCase().includes(s),
      )
      .slice(0, 12);
  }, [items, q]);

  return (
    <div className="relative">
      <input
        value={open ? q : selected ? `${selected.sku}  ${selected.name}` : q}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        className="h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[0_0_0_1px_rgb(236_234_228/0.1)] placeholder:text-subtle outline-none focus:shadow-[0_0_0_1px_rgb(216_212_204/0.55)]"
      />
      {open ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md bg-elevated py-1 shadow-[0_0_0_1px_rgb(236_234_228/0.12),0_12px_32px_rgb(0_0_0/0.45)]">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No match</li>
          ) : (
            filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface",
                    item.id === value && "bg-surface",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <span>
                    <span className="font-mono text-xs text-muted">{item.sku}</span>
                    <span className="mt-0.5 block text-fg">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {item.billedQty}/{item.ghostQty}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
