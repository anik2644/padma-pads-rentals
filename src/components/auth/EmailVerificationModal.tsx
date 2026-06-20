import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { deleteUser, reload, sendEmailVerification } from "firebase/auth";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CHECK_INTERVAL_MS = 3_000;
const AUTO_CHECK_MS = 90_000;
const MAX_RESENDS = 3;

type Status = "checking" | "expired" | "resend-limit" | "error";

interface Props {
  open: boolean;
  user: User | null;
  onVerified: (user: User) => Promise<void> | void;
  onCancel: () => Promise<void> | void;
  deleteUserOnCancel?: boolean;
}

export function EmailVerificationModal({
  open,
  user,
  onVerified,
  onCancel,
  deleteUserOnCancel = true,
}: Props) {
  const [status, setStatus] = useState<Status>("checking");
  const [remaining, setRemaining] = useState(AUTO_CHECK_MS / 1000);
  const [resends, setResends] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const email = user?.email ?? "";

  useEffect(() => {
    if (!open || !user) return;
    setStatus("checking");
    setRemaining(AUTO_CHECK_MS / 1000);
    let completed = false;
    const startedAt = Date.now();

    const check = async () => {
      if (completed) return;
      try {
        await reload(user);
        if (user.emailVerified) {
          completed = true;
          await onVerified(user);
          return;
        }
        const elapsed = Date.now() - startedAt;
        setRemaining(Math.max(0, Math.ceil((AUTO_CHECK_MS - elapsed) / 1000)));
        if (elapsed >= AUTO_CHECK_MS) {
          completed = true;
          setStatus("expired");
        }
      } catch {
        setStatus("error");
      }
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      completed = true;
      window.clearInterval(interval);
    };
  }, [attempt, onVerified, open, user]);

  useEffect(() => {
    if (!open) return;
    setResends(0);
    setAttempt(0);
  }, [open, user?.uid]);

  const description = useMemo(() => {
    if (status === "checking") {
      return `We sent a verification email to ${email}. This dialog will continue automatically after verification.`;
    }
    if (status === "expired") {
      return "Email not verified yet. You can check again or resend the verification email.";
    }
    if (status === "resend-limit") {
      return "Maximum email resend limit reached. Please try again later.";
    }
    return "Could not check email verification. Please try again.";
  }, [email, status]);

  async function checkAgain() {
    if (!user) return;
    setBusy(true);
    try {
      await reload(user);
      if (user.emailVerified) await onVerified(user);
      else setStatus("expired");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!user) return;
    if (resends >= MAX_RESENDS) {
      setStatus("resend-limit");
      if (deleteUserOnCancel) await deleteUser(user).catch(() => {});
      await onCancel();
      return;
    }
    setBusy(true);
    try {
      await sendEmailVerification(user);
      setResends((n) => n + 1);
      setStatus("checking");
      setRemaining(AUTO_CHECK_MS / 1000);
      setAttempt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (user && deleteUserOnCancel) await deleteUser(user).catch(() => {});
    await onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Verify your email</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted px-3 py-2 text-center text-sm">
          {status === "checking" ? `Auto-checking for ${remaining}s` : "Verification pending"}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" variant="outline" onClick={checkAgain} disabled={busy || !user}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Check Again
          </Button>
          <Button type="button" variant="outline" onClick={resend} disabled={busy || !user}>
            Resend Email
          </Button>
          <Button type="button" variant="destructive" onClick={cancel} disabled={busy}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
