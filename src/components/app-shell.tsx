import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileCode2,
  LayoutGrid,
  MoreHorizontal,
  ScrollText,
  Layers,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import { Wordmark } from "./logo";

const NAV = [
  { to: "/", label: "Floor", icon: LayoutGrid, end: true },
  { to: "/stock", label: "Bins", icon: Layers },
  { to: "/receive", label: "Receive", icon: ArrowDownToLine },
  { to: "/sell", label: "Sell", icon: ArrowUpFromLine },
] as const;

const MORE = [
  { to: "/tally", label: "Tally XML", icon: FileCode2 },
  { to: "/ledger", label: "Ledger", icon: ScrollText },
] as const;

function NavLink({
  to,
  label,
  icon: Icon,
  end,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  end?: boolean;
  onClick?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
        active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="h-8 w-8 animate-pulse rounded-full bg-elevated" />;
  return user ? <UserButton /> : null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const moreActive = MORE.some((m) => pathname === m.to);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-bg px-3 py-5 md:flex">
        <Link to="/" className="mb-8 px-2">
          <Wordmark />
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
          <div className="mt-4 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-subtle">
            Books
          </div>
          {MORE.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-auto border-t border-border px-1 pt-4">
          <AuthSlot />
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/">
          <Wordmark />
        </Link>
        <AuthSlot />
      </header>

      <main className="pb-24 md:ml-56 md:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur md:hidden">
        <div className="relative grid grid-cols-5">
          {NAV.map((item) => {
            const active =
              "end" in item && item.end
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-fg" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
              moreActive || moreOpen ? "text-fg" : "text-muted",
            )}
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
            More
          </button>
          {moreOpen ? (
            <div className="absolute bottom-full right-2 mb-2 w-44 rounded-lg bg-elevated p-1 shadow-[0_0_0_1px_rgb(236_234_228/0.1),0_12px_32px_rgb(0_0_0/0.4)]">
              {MORE.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-fg hover:bg-surface"
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
