import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { getDashboard } from "@/lib/kerf/api";
import { inr, qty, whenTime } from "@/lib/format";
import { BinBadge, ChannelBadge } from "./bin-badge";
import { Button } from "./ui/button";

export function Dashboard() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

  if (q.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
  }
  if (q.error) {
    return <p className="text-sm text-danger">{(q.error as Error).message}</p>;
  }
  const d = q.data;
  if (!d) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Floor</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Both sides of the cut</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/receive">Receive</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/sell">Sell</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-1 md:grid-cols-2">
        <BinCard
          tone="billed"
          label="Billed"
          units={d.billedUnits}
          value={d.billedValue}
          hint={`${d.billedSkuCount} SKUs at cost`}
        />
        <BinCard
          tone="ghost"
          label="Ghost"
          units={d.ghostUnits}
          value={d.ghostRetailValue}
          hint={`${d.ghostSkuCount} SKUs at cash price`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Cash this month" value={inr(d.monthCash, { compact: true })} />
        <Stat label="Billed sales this month" value={inr(d.monthTally, { compact: true })} />
        <Stat label="Gratis units in" value={new Intl.NumberFormat("en-IN").format(d.monthComplimentaryIn)} />
      </div>

      <section className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
        <h2 className="text-sm font-medium text-muted">Out the door — last eight weeks</h2>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.weekSeries} barGap={2}>
              <XAxis dataKey="label" tick={{ fill: "#9a9890", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(236,234,228,0.04)" }}
                contentStyle={{
                  background: "#1c1c19",
                  border: "1px solid rgba(236,234,228,0.1)",
                  borderRadius: 8,
                  color: "#eceae4",
                }}
                formatter={(value) => inr(Number(value ?? 0))}
              />
              <Bar dataKey="cash" fill="#9aada0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tally" fill="#8a9aaa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block size-2 rounded-sm bg-ghost" /> Cash / ghost
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block size-2 rounded-sm bg-billed" /> Tally / billed
          </span>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Low on the shelf</h2>
            <Link to="/stock" className="text-xs text-muted hover:text-fg">
              All bins
            </Link>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="text-sm text-muted">Nothing under reorder.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl bg-surface shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
              {d.lowStock.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link
                    to="/stock/$itemId"
                    params={{ itemId: item.id }}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-elevated"
                  >
                    <span>
                      <span className="block text-sm">{item.name}</span>
                      <span className="font-mono text-[11px] text-subtle">{item.sku}</span>
                    </span>
                    <span className="text-right text-xs tabular-nums text-muted">
                      {item.billedQty} / {item.ghostQty}
                      <span className="mt-0.5 block text-warn">need {item.reorderLevel}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Latest cuts</h2>
            <Link to="/ledger" className="text-xs text-muted hover:text-fg">
              Ledger
            </Link>
          </div>
          <ul className="divide-y divide-border rounded-xl bg-surface shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
            {d.recentMoves.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm">{m.itemName}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5">
                    <BinBadge bin={m.bin} />
                    <ChannelBadge channel={m.channel} />
                    <span className="text-[11px] text-subtle">{whenTime(m.occurredAt)}</span>
                  </p>
                </div>
                <p className="text-right text-sm tabular-nums">
                  {m.kind === "out" ? "−" : "+"}
                  {qty(m.qty, "")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function BinCard({
  tone,
  label,
  units,
  value,
  hint,
}: {
  tone: "billed" | "ghost";
  label: string;
  units: number;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-surface px-5 py-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      <p
        className={
          tone === "billed"
            ? "text-[11px] font-medium uppercase tracking-[0.18em] text-billed"
            : "text-[11px] font-medium uppercase tracking-[0.18em] text-ghost"
        }
      >
        {label}
      </p>
      <p className="mt-3 font-display text-4xl tabular-nums tracking-tight">{inr(value, { compact: true })}</p>
      <p className="mt-2 text-sm text-muted">
        {new Intl.NumberFormat("en-IN").format(units)} units · {hint}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      <p className="text-[11px] uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
