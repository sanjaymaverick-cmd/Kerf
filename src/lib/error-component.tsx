import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 text-center text-fg">
      <div className="max-w-md space-y-3">
        <span className="mx-auto grid size-12 place-items-center text-danger" aria-hidden="true">
          <TriangleAlert className="size-8" strokeWidth={1.75} />
        </span>
        <h1 className="font-display text-2xl">Something went wrong</h1>
        <p className="text-sm text-muted break-words">
          {error.message || "An unexpected error occurred. Try reloading the page."}
        </p>
      </div>
    </main>
  );
}
