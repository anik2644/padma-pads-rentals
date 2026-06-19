import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  visitRequestsApi,
  type VisitRequest,
  type VisitRequestStatus,
} from "@/lib/property-visit-requests";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/languageStore";

interface VisitRequestPanelProps {
  advertisementId: string;
  propertyId: string;
  requesterName: string;
  showOwnerActions?: boolean;
}

const STATUS_META: Record<VisitRequestStatus, { className: string }> = {
  PENDING: { className: "border-amber-200 bg-amber-50 text-amber-700" },
  APPROVED: { className: "border-green-200 bg-green-50 text-green-700" },
  REJECTED: { className: "border-red-200 bg-red-50 text-red-700" },
  CANCELLED: { className: "border-muted bg-muted text-muted-foreground" },
};

const HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

export function VisitRequestPanel({
  advertisementId,
  propertyId,
  requesterName,
  showOwnerActions = true,
}: VisitRequestPanelProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("10:00");
  const [alternateDate, setAlternateDate] = useState("");
  const [alternateTime, setAlternateTime] = useState("");
  const [message, setMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);

  const activeRequest = useMemo(
    () =>
      requests.find(
        (request) =>
          request.status === "PENDING" || request.status === "APPROVED",
      ) ?? null,
    [requests],
  );

  async function refresh() {
    try {
      setRequests(await visitRequestsApi.list(propertyId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("visit.loadError"));
    }
  }

  useEffect(() => {
    refresh();
  }, [propertyId]);

  function resetForm() {
    setPreferredDate("");
    setPreferredTime("10:00");
    setAlternateDate("");
    setAlternateTime("");
    setMessage("");
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!preferredDate || !preferredTime) {
      toast.error(t("visit.required"));
      return;
    }

    setSaving(true);
    try {
      await visitRequestsApi.create({
        advertisementId,
        propertyId,
        preferredDate,
        preferredTime,
        alternateDate: alternateDate || undefined,
        alternateTime: alternateTime || undefined,
        message: message.trim() || undefined,
      });
      resetForm();
      await refresh();
      toast.success(t("visit.created"));
    } finally {
      setSaving(false);
    }
  }

  async function cancelRequest(requestId: string) {
    try {
      await visitRequestsApi.cancel(requestId);
      await refresh();
      toast.success(t("visit.cancelled"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("visit.cancelError"));
    }
  }

  async function approveRequest(requestId: string) {
    try {
      await visitRequestsApi.approve(requestId);
      await refresh();
      toast.success(t("visit.approved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("visit.approveError"));
    }
  }

  async function rejectRequest(requestId: string) {
    const reason = rejectionReason.trim();
    if (!reason) {
      toast.error(t("visit.reasonRequired"));
      return;
    }
    try {
      await visitRequestsApi.reject(requestId, reason);
      setRejectionReason("");
      await refresh();
      toast.success(t("visit.rejected"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("visit.rejectError"));
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("visit.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("visit.subtitle")}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {requests.length}
        </Badge>
      </div>

      {activeRequest ? (
        <RequestSummary
          request={activeRequest}
          onCancel={() => cancelRequest(activeRequest.id)}
        />
      ) : (
        <form onSubmit={createRequest} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`preferred-date-${propertyId}`}>{t("visit.preferredDate")}</Label>
              <Input
                id={`preferred-date-${propertyId}`}
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`preferred-time-${propertyId}`}>{t("visit.preferredTime")}</Label>
              <select
                id={`preferred-time-${propertyId}`}
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`alternate-date-${propertyId}`}>{t("visit.alternateDate")}</Label>
              <Input
                id={`alternate-date-${propertyId}`}
                type="date"
                value={alternateDate}
                onChange={(e) => setAlternateDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`alternate-time-${propertyId}`}>{t("visit.alternateTime")}</Label>
              <select
                id={`alternate-time-${propertyId}`}
                value={alternateTime}
                onChange={(e) => setAlternateTime(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("visit.any")}</option>
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`visit-message-${propertyId}`}>{t("visit.message")}</Label>
            <Textarea
              id={`visit-message-${propertyId}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("visit.messagePlaceholder")}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {t("visit.create")}
          </Button>
        </form>
      )}

      {requests.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("visit.history")}
          </p>
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl border border-border bg-card p-3">
              <RequestDetails request={request} />
              {showOwnerActions && request.status === "PENDING" && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => approveRequest(request.id)}>
                      {t("visit.approve")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectRequest(request.id)}>
                      {t("visit.reject")}
                    </Button>
                  </div>
                  <Input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t("visit.rejectionReason")}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RequestSummary({
  request,
  onCancel,
}: {
  request: VisitRequest;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-3">
      <RequestDetails request={request} />
      {(request.status === "PENDING" || request.status === "APPROVED") && (
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={onCancel}>
          {t("visit.cancelRequest")}
        </Button>
      )}
    </div>
  );
}

function RequestDetails({ request }: { request: VisitRequest }) {
  const { t } = useTranslation();
  const { lang } = useLanguageStore();
  const status = STATUS_META[request.status];
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{t("visit.requester", { id: request.requesterId })}</p>
        <Badge variant="outline" className={cn("border", status.className)}>
          {t(`visit.statuses.${request.status}`)}
        </Badge>
      </div>
      <p className="flex items-center gap-1 text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        {formatDateOnly(request.preferredDate, lang)}
        <Clock className="ml-2 h-3.5 w-3.5" />
        {request.preferredTime}
      </p>
      {request.alternateDate && (
        <p className="text-muted-foreground">
          {t("visit.alternate", { date: formatDateOnly(request.alternateDate, lang) })}
          {request.alternateTime ? ` ${t("visit.at", { time: request.alternateTime })}` : ""}
        </p>
      )}
      {request.message && <p className="rounded-md bg-muted p-2">{request.message}</p>}
      {request.rejectionReason && (
        <p className="rounded-md bg-destructive/10 p-2 text-destructive">
          {t("visit.rejectionReason")}: {request.rejectionReason}
        </p>
      )}
      <div className="space-y-0.5 text-[11px] text-muted-foreground">
        <p>{t("visit.createdAt", { date: formatDateTime(request.audit.createdAt, lang) })}</p>
        <p>{t("visit.updatedAt", { date: formatDateTime(request.audit.updatedAt, lang) })}</p>
        {request.audit.approvedAt && <p>{t("visit.approvedAt", { date: formatDateTime(request.audit.approvedAt, lang) })}</p>}
        {request.audit.rejectedAt && <p>{t("visit.rejectedAt", { date: formatDateTime(request.audit.rejectedAt, lang) })}</p>}
        {request.audit.cancelledAt && <p>{t("visit.cancelledAt", { date: formatDateTime(request.audit.cancelledAt, lang) })}</p>}
      </div>
    </div>
  );
}

function formatDateTime(value: string, lang: "en" | "bn") {
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string, lang: "en" | "bn") {
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date(value));
}
