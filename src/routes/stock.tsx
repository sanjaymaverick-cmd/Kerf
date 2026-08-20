import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createItem, listItems } from "@/lib/kerf/api";
import { CATEGORIES, type Category, type Item } from "@/lib/kerf/types";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stock")({ component: StockPage });

function StockPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Stock />
      </AppShell>
    </RequireAuth>
  );
}

function Stock() {
  const itemsQ = useQuery({ queryKey: ["items"], queryFn: () => listItems() });
  const [q, setQ] = useState("");
  const [bin, setBin] = useState<"all" | "billed" | "ghost" | "low">("all");
  const [cat, setCat] = useState<"all" | Category>("all");
  const [open, setOpen] = useState(false);

  const items = itemsQ.data ?? [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (bin === "billed" && i.billedQty <= 0) return false;
      if (bin === "ghost" && i.ghostQty <= 0) return false;
      if (bin === "low" && i.billedQty + i.ghostQty > i.reorderLevel) return false;
      if (!s) return true;
      return (
        i.name.toLowerCase().includes(s) ||
        i.sku.toLowerCase().includes(s) ||
        (i.tallyName ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q, bin, cat]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Bins</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">On the shelf</h1>
        </div>
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-4" /> : <Plus className="size-4" />}
          {open ? "Close" : "New SKU"}
        </Button>
      </div>

      {open ? <NewItemForm onDone={() => setOpen(false)} /> : null}

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            className="pl-10"
            placeholder="Search SKU, name, Tally name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "billed", "ghost", "low"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBin(key)}
              className={cn(
                "h-11 rounded-md px-3 text-sm capitalize",
                bin === key ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
              )}
            >
              {key}
            </button>
          ))}
          <Select value={cat} onChange={(e) => setCat(e.target.value as "all" | Category)} className="w-40">
            <option value="all">All kinds</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {itemsQ.isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-subtle">
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium text-right">Billed</th>
                <th className="px-4 py-3 font-medium text-right">Ghost</th>
                <th className="px-4 py-3 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    Nothing in this cut.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: Item }) {
  const low = item.billedQty + item.ghostQty <= item.reorderLevel;
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 font-mono text-xs text-muted">{item.sku}</td>
      <td className="px-4 py-3">
        <Link to="/stock/$itemId" params={{ itemId: item.id }} className="hover:underline">
          {item.name}
        </Link>
        <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-subtle">
          {item.category}
          {low ? " · low" : ""}
        </span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-billed">{item.billedQty}</td>
      <td className="px-4 py-3 text-right tabular-nums text-ghost">{item.ghostQty}</td>
      <td className="px-4 py-3 text-right tabular-nums text-muted">
        {inr(item.billedQty * item.billedCost + item.ghostQty * item.sellingPrice, { compact: true })}
      </td>
    </tr>
  );
}

function NewItemForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("spares");
  const [unit, setUnit] = useState("pcs");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [reorder, setReorder] = useState("0");
  const [tally, setTally] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      createItem({
        data: {
          sku,
          name,
          category,
          unit,
          billedCost: Number(cost) || 0,
          sellingPrice: Number(price) || 0,
          reorderLevel: Number(reorder) || 0,
          tallyName: tally,
          notes: "",
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["items"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("SKU on the shelf");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="grid gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)] md:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <Field label="SKU">
        <Input required value={sku} onChange={(e) => setSku(e.target.value)} />
      </Field>
      <Field label="Name" className="md:col-span-2">
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Kind">
        <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Unit">
        <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
      </Field>
      <Field label="Billed cost ₹">
        <Input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
      </Field>
      <Field label="Cash price ₹">
        <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      <Field label="Reorder at">
        <Input type="number" min={0} value={reorder} onChange={(e) => setReorder(e.target.value)} />
      </Field>
      <Field label="Tally stock item" className="md:col-span-3">
        <Input
          value={tally}
          onChange={(e) => setTally(e.target.value)}
          placeholder="Name as it appears in Tally"
        />
      </Field>
      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={mut.isPending}>
          Save SKU
        </Button>
      </div>
    </form>
  );
}
