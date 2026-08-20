import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { BinBadge, ChannelBadge } from "@/components/bin-badge";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { getItem, listMoves, updateItem } from "@/lib/kerf/api";
import { inr, qty, whenTime } from "@/lib/format";
import { CATEGORIES, type Category } from "@/lib/kerf/types";

export const Route = createFileRoute("/stock/$itemId")({ component: ItemPage });

function ItemPage() {
  const { itemId } = Route.useParams();
  return (
    <RequireAuth>
      <AppShell>
        <ItemDetail itemId={itemId} />
      </AppShell>
    </RequireAuth>
  );
}

function ItemDetail({ itemId }: { itemId: string }) {
  const qc = useQueryClient();
  const itemQ = useQuery({ queryKey: ["item", itemId], queryFn: () => getItem({ data: itemId }) });
  const movesQ = useQuery({
    queryKey: ["moves", itemId],
    queryFn: () => listMoves({ data: { itemId, limit: 80 } }),
  });
  const item = itemQ.data;
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("spares");
  const [unit, setUnit] = useState("pcs");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [reorder, setReorder] = useState("0");
  const [tally, setTally] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!item) return;
    setSku(item.sku);
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setCost(String(item.billedCost));
    setPrice(String(item.sellingPrice));
    setReorder(String(item.reorderLevel));
    setTally(item.tallyName ?? "");
    setNotes(item.notes ?? "");
  }, [item]);

  const mut = useMutation({
    mutationFn: () =>
      updateItem({
        data: {
          id: itemId,
          sku,
          name,
          category,
          unit,
          billedCost: Number(cost) || 0,
          sellingPrice: Number(price) || 0,
          reorderLevel: Number(reorder) || 0,
          tallyName: tally,
          notes,
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["item", itemId] });
      void qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (itemQ.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  if (!item) return <p className="text-muted">Item not found.</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/stock" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" />
          Bins
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight">{item.name}</h1>
        <p className="mt-1 font-mono text-sm text-muted">{item.sku}</p>
      </div>

      <div className="grid gap-1 sm:grid-cols-2">
        <div className="rounded-xl bg-surface px-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-billed">Billed</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{item.billedQty}</p>
          <p className="mt-1 text-sm text-muted">{inr(item.billedQty * item.billedCost)} at cost</p>
        </div>
        <div className="rounded-xl bg-surface px-5 py-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ghost">Ghost</p>
          <p className="mt-2 font-display text-4xl tabular-nums">{item.ghostQty}</p>
          <p className="mt-1 text-sm text-muted">{inr(item.ghostQty * item.sellingPrice)} at cash price</p>
        </div>
      </div>

      <form
        className="grid gap-3 rounded-xl bg-surface p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <Field label="SKU">
          <Input value={sku} onChange={(e) => setSku(e.target.value)} />
        </Field>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
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
          <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Cash price ₹">
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Reorder at">
          <Input type="number" value={reorder} onChange={(e) => setReorder(e.target.value)} />
        </Field>
        <Field label="Tally stock item">
          <Input value={tally} onChange={(e) => setTally(e.target.value)} />
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div>
          <Button type="submit" disabled={mut.isPending}>
            Save
          </Button>
        </div>
      </form>

      <section>
        <h2 className="font-display text-2xl">Movement</h2>
        <ul className="mt-3 divide-y divide-border rounded-xl bg-surface">
          {(movesQ.data ?? []).map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm">
                  {m.kind === "out" ? "Out" : m.kind === "in" ? "In" : "Adjust"} · {m.party || "—"}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <BinBadge bin={m.bin} />
                  <ChannelBadge channel={m.channel} />
                  {m.voucherNo ? (
                    <span className="font-mono text-[11px] text-subtle">{m.voucherNo}</span>
                  ) : null}
                  <span className="text-[11px] text-subtle">{whenTime(m.occurredAt)}</span>
                </p>
              </div>
              <p className="text-right text-sm tabular-nums">
                {m.kind === "out" ? "−" : "+"}
                {qty(m.qty, item.unit)}
                <span className="mt-0.5 block text-[11px] text-muted">{inr(m.qty * m.unitPrice)}</span>
              </p>
            </li>
          ))}
          {(movesQ.data ?? []).length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">No movement yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
