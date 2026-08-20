import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { emptyLine, LineRows, type DraftLine } from "@/components/line-rows";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { listItems, receiveStock } from "@/lib/kerf/api";
import { toInputDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/receive")({ component: ReceivePage });

function ReceivePage() {
  return (
    <RequireAuth>
      <AppShell>
        <Receive />
      </AppShell>
    </RequireAuth>
  );
}

function Receive() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const itemsQ = useQuery({ queryKey: ["items"], queryFn: () => listItems() });
  const [source, setSource] = useState<"complimentary" | "partnership" | "purchase">(
    "complimentary",
  );
  const [party, setParty] = useState("");
  const [voucher, setVoucher] = useState("");
  const [date, setDate] = useState(toInputDate());
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine("ghost")]);

  const billed = source !== "complimentary";

  const mut = useMutation({
    mutationFn: () =>
      receiveStock({
        data: {
          source,
          party,
          voucherNo: voucher,
          note,
          occurredAt: date,
          lines: lines
            .filter((l) => l.itemId && Number(l.qty) > 0)
            .map((l) => ({
              itemId: l.itemId,
              qty: Number(l.qty),
              unitPrice: Number(l.unitPrice) || 0,
            })),
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success(billed ? "Billed bin credited" : "Ghost bin credited");
      void navigate({ to: "/stock" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function pickSource(next: typeof source) {
    setSource(next);
    const bin = next === "complimentary" ? "ghost" : "billed";
    setLines((ls) => ls.map((l) => ({ ...l, bin })));
  }

  const partyLabel =
    source === "complimentary"
      ? "Factory / packing list from"
      : source === "partnership"
        ? "Sister mill"
        : "Supplier";
  const voucherLabel =
    source === "complimentary"
      ? "Packing list no."
      : source === "partnership"
        ? "Partnership chalan / voucher"
        : "Invoice / Tally voucher";
  const partyPlaceholder =
    source === "partnership" ? "Sister mill (machines)" : "Qingdao Linyi WoodTech";

  return (
    <form
      className="mx-auto max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Receive</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Stock in</h1>
        <p className="mt-2 text-sm text-muted">
          Partnership tooling from the sister mill, and paid purchases, go to Billed.
          Complimentary crate extras go to Ghost.
        </p>
      </div>

      <div className="grid gap-1 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => pickSource("complimentary")}
          className={cn(
            "rounded-lg px-4 py-4 text-left",
            source === "complimentary" ? "bg-ghost/15 text-fg" : "bg-surface text-muted",
          )}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-ghost">Ghost</p>
          <p className="mt-1 font-display text-xl">Gratis</p>
        </button>
        <button
          type="button"
          onClick={() => pickSource("partnership")}
          className={cn(
            "rounded-lg px-4 py-4 text-left",
            source === "partnership" ? "bg-billed/15 text-fg" : "bg-surface text-muted",
          )}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-billed">Billed</p>
          <p className="mt-1 font-display text-xl">Partnership</p>
        </button>
        <button
          type="button"
          onClick={() => pickSource("purchase")}
          className={cn(
            "rounded-lg px-4 py-4 text-left",
            source === "purchase" ? "bg-billed/15 text-fg" : "bg-surface text-muted",
          )}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-billed">Billed</p>
          <p className="mt-1 font-display text-xl">Purchase</p>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={partyLabel}>
          <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder={partyPlaceholder} />
        </Field>
        <Field label={voucherLabel}>
          <Input value={voucher} onChange={(e) => setVoucher(e.target.value)} />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Note">
          <Textarea className="min-h-11" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>

      <LineRows
        items={itemsQ.data ?? []}
        lines={lines}
        onChange={setLines}
        defaultBin={billed ? "billed" : "ghost"}
      />

      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? "Posting…" : "Post inbound"}
      </Button>
    </form>
  );
}
