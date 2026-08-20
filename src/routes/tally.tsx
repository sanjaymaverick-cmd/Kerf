import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { importTallyXml } from "@/lib/kerf/api";
import { parseTallyXml, readXmlFile, classifyVoucher } from "@/lib/kerf/tally";
import type { TallyImportReport, TallyVoucher } from "@/lib/kerf/types";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/tally")({ component: TallyPage });

function TallyPage() {
  return (
    <RequireAuth>
      <AppShell>
        <TallyImport />
      </AppShell>
    </RequireAuth>
  );
}

function TallyImport() {
  const qc = useQueryClient();
  const [xml, setXml] = useState("");
  const [preview, setPreview] = useState<TallyVoucher[]>([]);
  const [report, setReport] = useState<TallyImportReport | null>(null);
  const [fileName, setFileName] = useState("");

  const mut = useMutation({
    mutationFn: () => importTallyXml({ data: { xml } }),
    onSuccess: (r) => {
      setReport(r);
      void qc.invalidateQueries();
      toast.success(`Imported ${r.vouchers} vouchers`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    setReport(null);
    const text = await readXmlFile(file);
    setXml(text);
    setPreview(parseTallyXml(text));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Tally</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">XML drop</h1>
        <p className="mt-2 text-sm text-muted">
          Kerf is the book. Tally is a feed. Export sales or purchase vouchers from
          Tally Prime as XML — Gateway → Export, or Alt+E from a voucher list.
          Kerf posts each inventory line into Billed, updates the shelf, and rolls
          the rupees into billed sales. Drop the same file twice and already-posted
          vouchers are skipped. Cash / ghost never comes from Tally.
        </p>
      </div>

      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFile(e.dataTransfer.files[0] ?? null);
        }}
      >
        <FileUp className="size-6 text-muted" />
        <span className="mt-3 text-sm">{fileName || "Drop a Tally XML, or click to browse"}</span>
        <span className="mt-1 text-xs text-subtle">UTF-8 or UTF-16. Sales and purchase vouchers.</span>
        <input
          type="file"
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={!xml || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? "Importing…" : "Import into billed"}
        </Button>
        <Button asChild variant="outline">
          <a href="/sample-tally-sales.xml" download>
            Sample XML
          </a>
        </Button>
      </div>

      {preview.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl">Preview · {preview.length} vouchers</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl bg-surface">
            {preview.map((v, i) => (
              <li key={`${v.number}-${i}`} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">
                    <span className="text-muted">{v.date}</span>
                    {" · "}
                    {v.type} {v.number}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-subtle">
                    {classifyVoucher(v.type)}
                  </p>
                </div>
                <p className="text-sm text-muted">{v.party || "No party"}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {v.entries.map((e, j) => (
                    <li key={j} className="flex justify-between gap-3 tabular-nums">
                      <span>
                        {e.stockItem} × {e.qty}
                      </span>
                      <span className="text-muted">{inr(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report ? (
        <section className="rounded-xl bg-surface p-5">
          <h2 className="font-display text-2xl">Report</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            <Fact k="Vouchers" v={String(report.vouchers)} />
            <Fact k="Lines" v={String(report.lines)} />
            <Fact k="Matched" v={String(report.matched)} />
            <Fact k="Created" v={String(report.created)} />
            <Fact k="Short" v={String(report.short)} />
            <Fact k="Already in book" v={String(report.duplicates)} />
            <Fact k="Billed sales" v={inr(report.salesAmount)} />
            <Fact k="Billed purchases" v={inr(report.purchaseAmount)} />
          </dl>
          {report.details.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {report.details.slice(0, 20).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-subtle">{k}</dt>
      <dd className="font-display text-2xl tabular-nums">{v}</dd>
    </div>
  );
}
