import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="currentColor" className="text-fg" />
      <rect x="5" y="7" width="22" height="18" rx="1.5" className="fill-bg" />
      <rect x="14.5" y="4" width="3" height="24" className="fill-fg" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-fg", className)}>
      <Mark className="size-7" />
      <span className="font-display text-2xl leading-none tracking-tight">Kerf</span>
    </span>
  );
}

export function KerfSplit({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-1", className)}>
      <div className="rounded-lg bg-elevated px-5 py-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-billed">Billed</p>
        <p className="mt-3 font-display text-2xl leading-tight">Tally. Partner. Paid.</p>
        <p className="mt-2 text-sm text-muted">
          Tools the sister mill sells you with the machine, plus anything you buy
          on invoice. Tally already knows — or you punch it in.
        </p>
      </div>
      <div className="rounded-lg bg-elevated px-5 py-6 shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost">Ghost</p>
        <p className="mt-3 font-display text-2xl leading-tight">Gratis. Cash. No bill.</p>
        <p className="mt-2 text-sm text-muted">
          The hundred spares China throws in the crate. Sold from the drawer, tracked here.
        </p>
      </div>
    </div>
  );
}
