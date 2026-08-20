import { cn } from "@/lib/utils";
import type { Bin, Channel, Category } from "@/lib/kerf/types";

export function BinBadge({ bin, className }: { bin: Bin; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        bin === "billed" ? "bg-billed/15 text-billed" : "bg-ghost/15 text-ghost",
        className,
      )}
    >
      {bin === "billed" ? "Billed" : "Ghost"}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: Channel | string }) {
  const label =
    channel === "complimentary"
      ? "Gratis"
      : channel === "partnership"
        ? "Partner"
        : channel === "xml"
          ? "Tally XML"
          : channel.charAt(0).toUpperCase() + channel.slice(1);
  return (
    <span className="inline-flex items-center rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted shadow-[0_0_0_1px_rgb(236_234_228/0.08)]">
      {label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category | string }) {
  return (
    <span className="text-[11px] uppercase tracking-wider text-subtle">{category}</span>
  );
}
