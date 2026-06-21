import { createFileRoute, Outlet } from "@tanstack/react-router";
import { HomeBeeLogo } from "@/components/brand/HomeBeeLogo";
import { LanguageToggle, ThemeToggle } from "@/components/common/Toggles";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — HomeBee" }] }),
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <HomeBeeLogo />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
