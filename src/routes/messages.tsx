import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMessage,
  listMessages,
  type PropertyMessage,
} from "@/lib/property-messages";
import { useAuthStore } from "@/store/authStore";
import { useLanguageStore } from "@/store/languageStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — HomeBee" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    owner: typeof search.owner === "string" ? search.owner : undefined,
    property: typeof search.property === "string" ? search.property : undefined,
    advertisementId: typeof search.advertisementId === "string" ? search.advertisementId : undefined,
    propertyId: typeof search.propertyId === "string" ? search.propertyId : undefined,
    receiverId: typeof search.receiverId === "string" ? search.receiverId : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    avatar: typeof search.avatar === "string" ? search.avatar : undefined,
  }),
  component: MessagesPage,
});

interface MessageThread {
  id: string;
  advertisementId: string;
  propertyId: string;
  receiverId?: string;
  name: string;
  property: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  phone?: string;
}

function MessagesPage() {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const search = Route.useSearch();
  const user = useAuthStore((s) => s.user);
  const [apiMessages, setApiMessages] = useState<PropertyMessage[]>([]);
  const [active, setActive] = useState<MessageThread | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await listMessages({
        propertyId: search.propertyId,
        advertisementId: search.advertisementId,
      });
      setApiMessages(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("messages.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [search.advertisementId, search.propertyId]);

  const threads = useMemo(() => {
    const grouped = new Map<string, MessageThread>();

    if (search.advertisementId && search.propertyId) {
      grouped.set(`${search.advertisementId}:${search.propertyId}:${search.receiverId ?? "owner"}`, {
        id: `${search.advertisementId}:${search.propertyId}:${search.receiverId ?? "owner"}`,
        advertisementId: search.advertisementId,
        propertyId: search.propertyId,
        receiverId: search.receiverId,
        name: search.owner ?? t("messages.owner"),
        property: search.property ?? search.propertyId,
        lastMessage: t("messages.start"),
        time: t("messages.now"),
        unread: 0,
        avatar: search.avatar || initialsFrom(search.owner ?? "Owner"),
        phone: search.phone,
      });
    }

    for (const message of apiMessages) {
      const peerId = message.senderId === user?.id ? message.receiverId : message.senderId;
      const key = `${message.advertisementId}:${message.propertyId}:${peerId}`;
      const existing = grouped.get(key);
      grouped.set(key, {
        id: key,
        advertisementId: message.advertisementId,
        propertyId: message.propertyId,
        receiverId: peerId,
        name: existing?.name ?? t("messages.user", { id: peerId.slice(0, 8) }),
        property: existing?.property ?? message.propertyId,
        lastMessage: message.message,
        time: formatTime(message.audit.createdAt, lang),
        unread: message.isRead ? 0 : 1,
        avatar: existing?.avatar ?? initialsFrom(peerId),
        phone: existing?.phone,
      });
    }

    return [...grouped.values()];
  }, [apiMessages, search, user?.id]);

  useEffect(() => {
    setActive((current) => {
      if (current) {
        const next = threads.find((thread) => thread.id === current.id);
        if (next) return next;
      }
      return threads[0] ?? null;
    });
  }, [threads]);

  const activeMessages = useMemo(() => {
    if (!active) return [];
    return apiMessages.filter(
      (message) =>
        message.advertisementId === active.advertisementId &&
        message.propertyId === active.propertyId &&
        (!active.receiverId ||
          message.senderId === active.receiverId ||
          message.receiverId === active.receiverId),
    );
  }, [active, apiMessages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    if (!active.receiverId) {
      toast.error(t("messages.receiverMissing"));
      return;
    }

    try {
      await createMessage({
        advertisementId: active.advertisementId,
        propertyId: active.propertyId,
        receiverId: active.receiverId,
        senderRole: "TENANT",
        receiverRole: "OWNER",
        message: draft.trim(),
      });
      setDraft("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("messages.sendError"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-0 md:px-6 md:py-6">
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden border-border bg-card md:grid-cols-[320px_1fr] md:rounded-3xl md:border md:shadow-card">
        <aside className="border-r border-border">
          <div className="border-b border-border p-4">
            <h1 className="text-xl font-bold">{t("messages.title")}</h1>
            {loading && <p className="text-xs text-muted-foreground">{t("common.loading")}</p>}
          </div>
          <ul>
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  onClick={() => setActive(thread)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent",
                    active?.id === thread.id && "bg-accent",
                  )}
                >
                  <Avatar><AvatarFallback>{thread.avatar}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{thread.name}</p>
                      <span className="text-[11px] text-muted-foreground">{thread.time}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{thread.property}</p>
                    <p className="truncate text-xs text-muted-foreground">{thread.lastMessage}</p>
                  </div>
                  {thread.unread > 0 && <Badge className="h-5 min-w-5 px-1.5">{thread.unread}</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex min-h-0 flex-col">
          {active ? (
            <>
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
                {activeMessages.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    {t("messages.emptyThread")}
                  </p>
                )}
                {activeMessages.map((message) => {
                  const mine = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "border border-border bg-card",
                        )}
                      >
                        {message.message}
                        <div
                          className={cn(
                            "mt-1 text-[10px]",
                            mine ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {formatTime(message.audit.createdAt, lang)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form className="flex items-center gap-2 border-t border-border p-3" onSubmit={send}>
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("messages.placeholder")} className="h-11" />
                <Button type="submit" size="icon" className="h-11 w-11"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              {t("messages.noConversations")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}

function formatTime(value: string, lang: "en" | "bn") {
  return new Intl.DateTimeFormat(lang, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
