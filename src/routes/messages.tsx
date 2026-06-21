import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  Clock3,
  ImageIcon,
  MoreVertical,
  Phone,
  Play,
  Reply,
  Search,
  Send,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguageStore } from "@/store/languageStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — HomeBee" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    owner: typeof search.owner === "string" ? search.owner : undefined,
    property: typeof search.property === "string" ? search.property : undefined,
    advertisementId:
      typeof search.advertisementId === "string" ? search.advertisementId : undefined,
    propertyId: typeof search.propertyId === "string" ? search.propertyId : undefined,
    receiverId: typeof search.receiverId === "string" ? search.receiverId : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    avatar: typeof search.avatar === "string" ? search.avatar : undefined,
  }),
  component: MessagesPage,
});

type ParticipantRole = "owner" | "viewer";
type MessageKind = "text" | "photo" | "video";
type ReadState = "sent" | "delivered" | "seen";

interface ChatParticipant {
  id: string;
  name: string;
  role: ParticipantRole;
  avatarUrl?: string;
  phone?: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  text?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  readState: ReadState;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  advertisementId: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyImage: string;
  listingStatus: "ACTIVE" | "BOOKED" | "RENTED";
  participants: ChatParticipant[];
  unreadCount: number;
  messages: ChatMessage[];
}

const CURRENT_VIEWER_ID = "viewer-current";
const OWNER_ID = "owner-current";

const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: "conv-green-view",
    advertisementId: "ad-green-view",
    propertyId: "hostel-101",
    propertyName: "Green View Hostel",
    propertyAddress: "Mirpur 10, Dhaka",
    propertyImage:
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=80",
    listingStatus: "ACTIVE",
    unreadCount: 2,
    participants: [
      { id: CURRENT_VIEWER_ID, name: "You", role: "viewer" },
      { id: "owner-rahim", name: "Rahim Uddin", role: "owner", phone: "+8801712345678" },
    ],
    messages: [
      {
        id: "m-101",
        conversationId: "conv-green-view",
        senderId: CURRENT_VIEWER_ID,
        kind: "text",
        text: "Hi, is one seat still available for this month?",
        readState: "seen",
        createdAt: minutesAgo(140),
      },
      {
        id: "m-102",
        conversationId: "conv-green-view",
        senderId: "owner-rahim",
        kind: "photo",
        mediaUrl:
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80",
        caption: "Yes. This is the available two-person room.",
        readState: "seen",
        createdAt: minutesAgo(134),
      },
      {
        id: "m-103",
        conversationId: "conv-green-view",
        senderId: CURRENT_VIEWER_ID,
        kind: "text",
        text: "Looks good. Does the rent include meals?",
        replyToId: "m-102",
        editedAt: minutesAgo(126),
        readState: "seen",
        createdAt: minutesAgo(128),
      },
      {
        id: "m-104",
        conversationId: "conv-green-view",
        senderId: "owner-rahim",
        kind: "text",
        text: "Meal is separate, but Wi-Fi and cleaning are included.",
        readState: "delivered",
        createdAt: minutesAgo(18),
      },
      {
        id: "m-105",
        conversationId: "conv-green-view",
        senderId: "owner-rahim",
        kind: "text",
        text: "You can visit today after 6 PM if you want.",
        readState: "delivered",
        createdAt: minutesAgo(8),
      },
    ],
  },
  {
    id: "conv-lake-view",
    advertisementId: "ad-lake-view",
    propertyId: "flat-204",
    propertyName: "Lake View Family Flat",
    propertyAddress: "Dhanmondi, Dhaka",
    propertyImage:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    listingStatus: "ACTIVE",
    unreadCount: 0,
    participants: [
      { id: CURRENT_VIEWER_ID, name: "You", role: "viewer" },
      { id: "owner-sadia", name: "Sadia Rahman", role: "owner", phone: "+8801812345678" },
    ],
    messages: [
      {
        id: "m-201",
        conversationId: "conv-lake-view",
        senderId: "owner-sadia",
        kind: "text",
        text: "Thanks for your interest. The flat is available from July 1.",
        readState: "seen",
        createdAt: minutesAgo(420),
      },
      {
        id: "m-202",
        conversationId: "conv-lake-view",
        senderId: CURRENT_VIEWER_ID,
        kind: "video",
        mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        caption: "Can you confirm if this is the balcony view from the listing?",
        readState: "seen",
        createdAt: minutesAgo(390),
      },
      {
        id: "m-203",
        conversationId: "conv-lake-view",
        senderId: "owner-sadia",
        kind: "text",
        text: "Yes, that is the same balcony. The lake is visible from the living room too.",
        replyToId: "m-202",
        readState: "seen",
        createdAt: minutesAgo(365),
      },
    ],
  },
  {
    id: "conv-office-space",
    advertisementId: "ad-office-space",
    propertyId: "office-77",
    propertyName: "Banani Office Space",
    propertyAddress: "Banani 11, Dhaka",
    propertyImage:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    listingStatus: "BOOKED",
    unreadCount: 1,
    participants: [
      { id: OWNER_ID, name: "You", role: "owner" },
      { id: "viewer-tanvir", name: "Tanvir Ahmed", role: "viewer", phone: "+8801912345678" },
    ],
    messages: [
      {
        id: "m-301",
        conversationId: "conv-office-space",
        senderId: "viewer-tanvir",
        kind: "text",
        text: "Is parking included with the monthly rent?",
        readState: "delivered",
        createdAt: minutesAgo(74),
      },
      {
        id: "m-302",
        conversationId: "conv-office-space",
        senderId: OWNER_ID,
        kind: "text",
        text: "One parking slot is included. Extra slots are negotiable.",
        readState: "sent",
        createdAt: minutesAgo(62),
      },
      {
        id: "m-303",
        conversationId: "conv-office-space",
        senderId: "viewer-tanvir",
        kind: "text",
        text: "This message was deleted",
        deletedAt: minutesAgo(40),
        readState: "delivered",
        createdAt: minutesAgo(45),
      },
      {
        id: "m-304",
        conversationId: "conv-office-space",
        senderId: "viewer-tanvir",
        kind: "text",
        text: "Can I schedule a visit tomorrow morning?",
        readState: "delivered",
        createdAt: minutesAgo(24),
      },
    ],
  },
];

function MessagesPage() {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const search = Route.useSearch();
  const [conversations, setConversations] = useState<ChatConversation[]>(() =>
    buildInitialConversations(search),
  );
  const [activeId, setActiveId] = useState(() => conversations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const filteredConversations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const peer = getPeer(conversation);
      return [peer.name, conversation.propertyName, conversation.propertyAddress]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [conversations, query]);

  useEffect(() => {
    if (!filteredConversations.some((conversation) => conversation.id === activeId)) {
      setActiveId(filteredConversations[0]?.id ?? "");
    }
  }, [activeId, filteredConversations]);

  const active = conversations.find((conversation) => conversation.id === activeId) ?? null;

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    const self = getSelfParticipant(active);
    const nextMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      conversationId: active.id,
      senderId: self.id,
      kind: "text",
      text: draft.trim(),
      readState: "sent",
      createdAt: new Date().toISOString(),
    };
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === active.id
          ? { ...conversation, messages: [...conversation.messages, nextMessage], unreadCount: 0 }
          : conversation,
      ),
    );
    setDraft("");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-0 md:px-6 md:py-6">
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden border-border bg-card md:grid-cols-[360px_1fr] md:rounded-3xl md:border md:shadow-card">
        <aside className="flex min-h-0 flex-col border-r border-border">
          <InboxHeader query={query} setQuery={setQuery} />
          <ConversationList
            conversations={filteredConversations}
            activeId={activeId}
            lang={lang}
            onSelect={(conversation) => {
              setActiveId(conversation.id);
              setConversations((current) =>
                current.map((item) =>
                  item.id === conversation.id ? { ...item, unreadCount: 0 } : item,
                ),
              );
            }}
          />
        </aside>

        <section className="flex min-h-0 flex-col">
          {active ? (
            <>
              <ChatHeader conversation={active} />
              <MessageTimeline conversation={active} lang={lang} />
              <form
                className="flex items-center gap-2 border-t border-border bg-card p-3"
                onSubmit={send}
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("messages.placeholder")}
                  className="h-11"
                />
                <Button type="submit" size="icon" className="h-11 w-11" disabled={!draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
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

function InboxHeader({
  query,
  setQuery,
}: {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 border-b border-border p-4">
      <div>
        <h1 className="text-xl font-bold">{t("messages.title")}</h1>
        <p className="text-xs text-muted-foreground">Property conversations and visit enquiries</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations"
          className="h-10 pl-9"
        />
      </div>
    </div>
  );
}

function ConversationList({
  conversations,
  activeId,
  lang,
  onSelect,
}: {
  conversations: ChatConversation[];
  activeId: string;
  lang: "en" | "bn";
  onSelect: (conversation: ChatConversation) => void;
}) {
  return (
    <ul className="min-h-0 flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const peer = getPeer(conversation);
        const latest = latestMessage(conversation);
        return (
          <li key={conversation.id}>
            <button
              onClick={() => onSelect(conversation)}
              className={cn(
                "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent",
                activeId === conversation.id && "bg-accent",
              )}
            >
              <Avatar className="mt-1 h-11 w-11">
                {peer.avatarUrl && <AvatarImage src={peer.avatarUrl} alt={peer.name} />}
                <AvatarFallback>{initialsFrom(peer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{conversation.propertyName}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {latest ? shortTime(latest.createdAt, lang) : ""}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-muted-foreground">{peer.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs",
                      conversation.unreadCount > 0
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {latest ? messagePreview(latest) : "No messages yet"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px]">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ChatHeader({ conversation }: { conversation: ChatConversation }) {
  const peer = getPeer(conversation);
  return (
    <header className="flex items-center justify-between border-b border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={conversation.propertyImage}
          alt={conversation.propertyName}
          className="h-12 w-14 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{peer.name}</p>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {peer.role === "owner" ? "Owner" : "Viewer"}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{conversation.propertyName}</p>
          <p className="truncate text-xs text-muted-foreground">{conversation.propertyAddress}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Badge className="hidden border-0 bg-secondary/15 text-secondary sm:inline-flex">
          {conversation.listingStatus}
        </Badge>
        <Button size="icon" variant="ghost" aria-label="Call">
          <Phone className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="More">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function MessageTimeline({
  conversation,
  lang,
}: {
  conversation: ChatConversation;
  lang: "en" | "bn";
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-muted/30 px-4 py-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="mx-auto mb-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground">
          Conversation about {conversation.propertyName}
        </div>
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            conversation={conversation}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  conversation,
  lang,
}: {
  message: ChatMessage;
  conversation: ChatConversation;
  lang: "en" | "bn";
}) {
  const advertiser = getParticipantRole(conversation, message.senderId) === "owner";
  const reply = message.replyToId
    ? conversation.messages.find((item) => item.id === message.replyToId)
    : null;

  if (message.deletedAt) {
    return (
      <div className={cn("flex", advertiser ? "justify-end" : "justify-start")}>
        <div className="max-w-[78%] rounded-2xl border border-dashed border-border bg-card/70 px-4 py-2 text-sm italic text-muted-foreground">
          This message was deleted
          <p className="mt-1 text-[10px] not-italic">{shortTime(message.createdAt, lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", advertiser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] overflow-hidden rounded-2xl text-sm shadow-sm",
          advertiser ? "bg-primary text-primary-foreground" : "border border-border bg-card",
        )}
      >
        {reply && <ReplyPreview message={reply} advertiser={advertiser} />}
        <MessageMedia message={message} />
        {(message.text || message.caption) && (
          <div className="space-y-1 px-4 py-2">
            {message.text && <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>}
            {message.caption && (
              <p className="whitespace-pre-wrap leading-relaxed">{message.caption}</p>
            )}
          </div>
        )}
        <div
          className={cn(
            "flex items-center justify-end gap-1 px-4 pb-2 text-[10px]",
            advertiser ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {message.editedAt && <span>edited</span>}
          <span>{shortTime(message.createdAt, lang)}</span>
          {advertiser && <ReadIcon state={message.readState} />}
        </div>
      </div>
    </div>
  );
}

function ReplyPreview({ message, advertiser }: { message: ChatMessage; advertiser: boolean }) {
  return (
    <div
      className={cn(
        "mx-3 mt-3 rounded-xl border-l-2 px-3 py-2 text-xs",
        advertiser
          ? "border-primary-foreground/70 bg-primary-foreground/10 text-primary-foreground/85"
          : "border-primary bg-muted text-muted-foreground",
      )}
    >
      <div className="mb-1 flex items-center gap-1 font-medium">
        <Reply className="h-3 w-3" />
        Replying to {message.kind}
      </div>
      <p className="line-clamp-2">{messagePreview(message)}</p>
    </div>
  );
}

function MessageMedia({ message }: { message: ChatMessage }) {
  if (message.kind === "photo" && message.mediaUrl) {
    return (
      <div className="relative bg-black/5">
        <img
          src={message.mediaUrl}
          alt={message.caption ?? "Photo message"}
          className="max-h-80 w-full object-cover"
        />
        <Badge className="absolute left-3 top-3 gap-1 border-0 bg-background/90 text-foreground">
          <ImageIcon className="h-3 w-3" /> Photo
        </Badge>
      </div>
    );
  }

  if (message.kind === "video" && message.mediaUrl) {
    return (
      <div className="relative bg-black">
        <video
          src={message.mediaUrl}
          poster={message.thumbnailUrl}
          controls
          className="max-h-80 w-full bg-black object-cover"
        />
        <Badge className="absolute left-3 top-3 gap-1 border-0 bg-background/90 text-foreground">
          <Video className="h-3 w-3" /> Video
        </Badge>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/45 p-3 text-white">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </div>
      </div>
    );
  }

  return null;
}

function ReadIcon({ state }: { state: ReadState }) {
  if (state === "seen") return <CheckCheck className="h-3.5 w-3.5" />;
  if (state === "delivered") return <CheckCheck className="h-3.5 w-3.5 opacity-70" />;
  return <Check className="h-3.5 w-3.5 opacity-70" />;
}

function buildInitialConversations(search: ReturnType<typeof Route.useSearch>) {
  const seeded = [...MOCK_CONVERSATIONS];
  if (!search.advertisementId || !search.propertyId) return seeded;
  const existing = seeded.some(
    (conversation) =>
      conversation.advertisementId === search.advertisementId &&
      conversation.propertyId === search.propertyId,
  );
  if (existing) return seeded;
  return [
    {
      id: `conv-${search.advertisementId}-${search.propertyId}`,
      advertisementId: search.advertisementId,
      propertyId: search.propertyId,
      propertyName: search.property ?? search.propertyId,
      propertyAddress: "Property enquiry",
      propertyImage:
        "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=80",
      listingStatus: "ACTIVE",
      unreadCount: 0,
      participants: [
        { id: CURRENT_VIEWER_ID, name: "You", role: "viewer" },
        {
          id: search.receiverId ?? "owner-new",
          name: search.owner ?? "Property owner",
          role: "owner",
          phone: search.phone,
        },
      ],
      messages: [
        {
          id: `intro-${search.advertisementId}`,
          conversationId: `conv-${search.advertisementId}-${search.propertyId}`,
          senderId: search.receiverId ?? "owner-new",
          kind: "text",
          text: "Thanks for your interest. Send a message to start the conversation.",
          readState: "delivered",
          createdAt: new Date().toISOString(),
        },
      ],
    },
    ...seeded,
  ];
}

function getSelfParticipant(conversation: ChatConversation) {
  return (
    conversation.participants.find((participant) => participant.name === "You") ??
    conversation.participants[0]
  );
}

function getPeer(conversation: ChatConversation) {
  const self = getSelfParticipant(conversation);
  return (
    conversation.participants.find((participant) => participant.id !== self.id) ??
    conversation.participants[0]
  );
}

function getParticipantRole(conversation: ChatConversation, participantId: string) {
  return (
    conversation.participants.find((participant) => participant.id === participantId)?.role ??
    "viewer"
  );
}

function latestMessage(conversation: ChatConversation) {
  return conversation.messages[conversation.messages.length - 1] ?? null;
}

function messagePreview(message: ChatMessage) {
  if (message.deletedAt) return "Message deleted";
  if (message.kind === "photo")
    return message.caption ? `Photo: ${message.caption}` : "Photo message";
  if (message.kind === "video")
    return message.caption ? `Video: ${message.caption}` : "Video message";
  return message.text ?? "";
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}

function shortTime(value: string, lang: "en" | "bn") {
  const date = new Date(value);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 60 * 60_000) {
    return new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(date);
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
