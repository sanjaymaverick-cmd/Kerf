import { Link } from "@tanstack/react-router";
import { KerfSplit, Wordmark } from "./logo";
import { Button } from "./ui/button";

export function Landing() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Wordmark />
        <Button asChild variant="outline" size="sm">
          <Link to="/login">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-8 md:pt-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          Dual-bin inventory
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Two bins.
          <br />
          One cut.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          Sister mill imports the machines. The tooling that rides with them is sold
          to you in partnership — that is Billed. China still throws a hundred
          complimentary spares in the crate with no bill — that is Ghost. Kerf
          holds both, and takes them off the shelf when they leave.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/login">Enter the workshop</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#bins">How it works</a>
          </Button>
        </div>

        <div id="bins" className="mt-16 md:mt-24">
          <div className="mb-1 h-px w-full bg-fg/80" aria-hidden="true" />
          <KerfSplit className="gap-1 max-md:grid-cols-1" />
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-3">
          <Step n="01" title="Receive">
            Partnership tools from the sister mill, and paid purchases, land in
            Billed. Complimentary crate extras land in Ghost.
          </Step>
          <Step n="02" title="Sell">
            Cash tickets pull from Ghost. Tally invoices pull from Billed. Stock
            deducts the moment you post.
          </Step>
          <Step n="03" title="Import">
            Drop a Tally XML export. Kerf matches stock items, writes the sale,
            and flags anything short.
          </Step>
        </section>
      </main>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-subtle">{n}</p>
      <h2 className="mt-2 font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
