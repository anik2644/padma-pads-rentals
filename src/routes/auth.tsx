import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { HomeBeeLogo } from "@/components/brand/HomeBeeLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — HomeBee" }] }),
  component: AuthLayout,
});

function AuthLayout() {
  const { pathname } = useLocation();
  const tab = pathname.endsWith("/signup") ? "signup" : pathname.endsWith("/forgot") ? "forgot" : "login";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <HomeBeeLogo />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          {tab !== "forgot" && (
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
              <Link
                to="/auth/login"
                className={`rounded-lg px-3 py-2 text-center transition ${
                  tab === "login" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Log in
              </Link>
              <Link
                to="/auth/signup"
                className={`rounded-lg px-3 py-2 text-center transition ${
                  tab === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Sign up
              </Link>
            </div>
          )}
          <Outlet />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Mock auth flow — no real account is created. Use code{" "}
          <span className="font-mono font-semibold text-foreground">123456</span> to verify.
        </p>
      </div>
    </div>
  );
}
