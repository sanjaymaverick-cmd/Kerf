import type { ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="min-h-screen bg-bg" />;
  }
  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
