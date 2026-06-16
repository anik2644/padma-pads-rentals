import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Phone, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_MESSAGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — HomeBee" }] }),
  component: MessagesPage,
});

const CHAT_HISTORY = [
  { from: "them", text: "Hi! Is the property still available?", time: "10:01" },
  { from: "me", text: "Yes it is. Would you like to schedule a viewing?", time: "10:03" },
  { from: "them", text: "Sure, you can visit tomorrow at 5 PM.", time: "10:05" },
];

function MessagesPage() {
  const [active, setActive] = useState(MOCK_MESSAGES[0]);
  const [draft, setDraft] = useState("");

  return (
    <div className="mx-auto w-full max-w-7xl px-0 md:px-6 md:py-6">
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden border-border bg-card md:grid-cols-[320px_1fr] md:rounded-3xl md:border md:shadow-card">
        {/* List */}
        <aside className="border-r border-border">
          <div className="border-b border-border p-4">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <ul>
            {MOCK_MESSAGES.map((m) => (
              <li key={m.id}>
                <button onClick={() => setActive(m)} className={cn(
                  "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent",
                  active.id === m.id && "bg-accent",
                )}>
                  <Avatar><AvatarFallback>{m.avatar}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-sm">{m.name}</p>
                      <span className="text-[11px] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{m.property}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.lastMessage}</p>
                  </div>
                  {m.unread > 0 && <Badge className="h-5 min-w-5 px-1.5">{m.unread}</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Conversation */}
        <section className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar><AvatarFallback>{active.avatar}</AvatarFallback></Avatar>
              <div>
                <p className="font-semibold">{active.name}</p>
                <p className="text-xs text-muted-foreground">{active.property}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost"><Phone className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background p-4">
            {CHAT_HISTORY.map((c, i) => (
              <div key={i} className={cn("flex", c.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  c.from === "me" ? "bg-primary text-primary-foreground" : "bg-card border border-border",
                )}>
                  {c.text}
                  <div className={cn("mt-1 text-[10px]", c.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>{c.time}</div>
                </div>
              </div>
            ))}
          </div>

          <form className="flex items-center gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); setDraft(""); }}>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." className="h-11" />
            <Button type="submit" size="icon" className="h-11 w-11"><Send className="h-4 w-4" /></Button>
          </form>
        </section>
      </div>
    </div>
  );
}
