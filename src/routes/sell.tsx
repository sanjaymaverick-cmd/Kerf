import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { emptyLine, LineRows, type DraftLine } from "@/components/line-rows";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { listItems, registerSale } from "@/lib/kerf/api";
import { toInputDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sell")({ component: SellPage });

function SellPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Sell />
      </AppShell>
    </RequireAuth>
  );
}

function Sell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const itemsQ = useQuery({ queryKey: ["items"], queryFn: () => listItems() });
  const [channel, setChannel] = useState<"cash" | "tally">("cash");
  const [party, setParty] = useState("");
  const [voucher, setVoucher] = useState("");
  const [date, setDate] = useState(toInputDate());
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine("ghost")]);

  const mut = useMutation({
    mutationFn: () =>
      registerSale({
        data: {
          channel,
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
              bin: l.bin ?? (channel === "cash" ? "ghost" : "billed"),
            })),
        },
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success(channel === "cash" ? "Cash sale posted. Ghost deducted." : "Tally sale posted. Billed deducted.");
      void navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="mx-auto max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Sell</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Stock out</h1>
        <p className="mt-2 text-sm text-muted">
          Cash tickets default to Ghost. Tally invoices default to Billed. Override a line if you must.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => {
            setChannel("cash");
            setLines((ls) => ls.map((l) => ({ ...l, bin: "ghost" })));
          }}
          className={cn(
            "rounded-lg px-4 py-4 text-left",
            channel === "cash" ? "bg-ghost/15 text-fg" : "bg-surface text-muted",
          )}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-ghost">Ghost</p>
          <p className="mt-1 font-display text-xl">Cash</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setChannel("tally");
            setLines((ls) => ls.map((l) => ({ ...l, bin: "billed" })));
          }}
          className={cn(
            "rounded-lg px-4 py-4 text-left",
            channel === "tally" ? "bg-billed/15 text-fg" : "bg-surface text-muted",
          )}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-billed">Billed</p>
          <p className="mt-1 font-display text-xl">Tally</p>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Party">
          <Input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Workshop / customer" />
        </Field>
        <Field label={channel === "cash" ? "Cash slip no." : "Tally voucher no."}>
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
        showBin
        defaultBin={channel === "cash" ? "ghost" : "billed"}
      />

      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? "Posting…" : "Post sale"}
      </Button>
    </form>
  );
}
