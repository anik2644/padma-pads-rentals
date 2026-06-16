import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — HomeBee" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on listings and messages</p>
        </div>
      </header>
      <ul className="space-y-2">
        {MOCK_NOTIFICATIONS.map((n) => (
          <li key={n.id} className={cn(
            "flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-card",
            n.unread && "border-l-4 border-l-primary",
          )}>
            <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.unread ? "bg-primary" : "bg-transparent")} />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{n.title}</p>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
