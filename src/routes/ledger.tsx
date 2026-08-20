import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { BinBadge, ChannelBadge } from "@/components/bin-badge";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { exportBook, listMoves } from "@/lib/kerf/api";
import { inr, qty, whenTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Bin, Channel } from "@/lib/kerf/types";

export const Route = createFileRoute("/ledger")({ component: LedgerPage });

function LedgerPage() {
  return (
    <RequireAuth>
      <AppShell>
        <Ledger />
      </AppShell>
    </RequireAuth>
  );
}

function Ledger() {
  const movesQ = useQuery({ queryKey: ["moves"], queryFn: () => listMoves({ data: { limit: 400 } }) });
  const [q, setQ] = useState("");
  const [bin, setBin] = useState<"all" | Bin>("all");
  const [kind, setKind] = useState<"all" | "in" | "out">("all");
  const [channel, setChannel] = useState<"all" | Channel>("all");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (movesQ.data ?? []).filter((m) => {
      if (bin !== "all" && m.bin !== bin) return false;
      if (kind !== "all" && m.kind !== kind) return false;
      if (channel !== "all" && m.channel !== channel) return false;
      if (!s) return true;
      return (
        m.itemName.toLowerCase().includes(s) ||
        m.itemSku.toLowerCase().includes(s) ||
        (m.party ?? "").toLowerCase().includes(s) ||
        (m.voucherNo ?? "").toLowerCase().includes(s)
      );
    });
  }, [movesQ.data, q, bin, kind, channel]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Ledger</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Every cut</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void exportBook().then((book) => {
              const blob = new Blob([JSON.stringify(book, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `kerf-book-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Book exported");
            }).catch((e: Error) => toast.error(e.message));
          }}
        >
          Export book
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          className="flex-1"
          placeholder="Search item, party, voucher"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="w-28">
            <option value="all">In + out</option>
            <option value="in">In</option>
            <option value="out">Out</option>
          </Select>
          <Select value={bin} onChange={(e) => setBin(e.target.value as typeof bin)} className="w-28">
            <option value="all">Both bins</option>
            <option value="billed">Billed</option>
            <option value="ghost">Ghost</option>
          </Select>
          <Select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="w-36"
          >
            <option value="all">All channels</option>
            <option value="cash">Cash</option>
            <option value="tally">Tally</option>
            <option value="xml">XML</option>
            <option value="complimentary">Gratis</option>
            <option value="partnership">Partner</option>
            <option value="purchase">Purchase</option>
            <option value="opening">Opening</option>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-surface shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-subtle">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Cut</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-xs text-muted">{whenTime(m.occurredAt)}</td>
                <td className="px-4 py-3">
                  <Link
                    to="/stock/$itemId"
                    params={{ itemId: m.itemId }}
                    className={cn("hover:underline")}
                  >
                    {m.itemName}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[11px] text-subtle">
                    {m.itemSku}
                    {m.party ? ` · ${m.party}` : ""}
                    {m.voucherNo ? ` · ${m.voucherNo}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1.5">
                    <BinBadge bin={m.bin} />
                    <ChannelBadge channel={m.channel} />
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {m.kind === "out" ? "−" : "+"}
                  {qty(m.qty, "")}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-muted">
                  {inr(m.qty * m.unitPrice)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No movement in this cut.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
