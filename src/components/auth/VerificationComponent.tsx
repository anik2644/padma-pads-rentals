import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { mockAuth } from "@/lib/mock-auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type VerificationType = "email" | "phone";

interface Props {
  type: VerificationType;
  target: string;
  onVerified: () => void;
  onChangeTarget?: () => void;
  onCancel?: () => void;
  title?: string;
}

export function VerificationComponent({
  type,
  target,
  onVerified,
  onChangeTarget,
  onCancel,
  title,
}: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(90);
  const [resends, setResends] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void mockAuth.sendOtp().then(({ code }) => {
      toast.info(
        t("auth.verify.demoSent", {
          method: t(type === "email" ? "auth.verify.emailLink" : "auth.verify.otp"),
          code,
        }),
      );
    });
    startCountdown();
    return () => stopCountdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    stopCountdown();
    setCountdown(90);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          stopCountdown();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }
  function stopCountdown() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function handleVerify(value?: string) {
    const v = value ?? code;
    if (v.length < 6) return;
    setStatus("verifying");
    setError(null);
    const ok = await mockAuth.verifyOtp(v);
    setAttempts((a) => a + 1);
    if (ok) {
      setStatus("verified");
      toast.success(t("auth.verify.verified"));
      setTimeout(onVerified, 400);
    } else {
      setStatus("error");
      setError(t("auth.verify.invalid"));
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResends((r) => r + 1);
    const { code } = await mockAuth.sendOtp();
    toast.info(t("auth.verify.resent", { code }));
    startCountdown();
  }

  const mm = String(Math.floor(countdown / 60)).padStart(1, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {title ?? t(type === "email" ? "auth.verify.verifyEmail" : "auth.verify.verifyPhone")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.verify.sentTo")} <span className="font-medium text-foreground">{target}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) handleVerify(v);
          }}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {t("auth.verify.attempts", { attempts })} · {t("auth.verify.resends", { resends })}
        </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0}
          className="inline-flex items-center gap-1 font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          <RefreshCw className="h-3 w-3" />
          {countdown > 0
            ? t("auth.verify.resendIn", { time: `${mm}:${ss}` })
            : t("auth.verify.resendCode")}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      {status === "verified" && (
        <p className="flex items-center gap-2 rounded-md bg-secondary/15 px-3 py-2 text-xs text-secondary">
          <CheckCircle2 className="h-4 w-4" /> {t("auth.verify.success")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={() => handleVerify()}
          disabled={code.length < 6 || status === "verifying"}
          className="h-11"
        >
          {status === "verifying" && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("auth.verify.verify")}
        </Button>
        <div className="flex justify-between text-xs text-muted-foreground">
          {onChangeTarget && (
            <button type="button" onClick={onChangeTarget} className="hover:underline">
              {t(type === "email" ? "auth.verify.changeEmail" : "auth.verify.changePhone")}
            </button>
          )}
          {onCancel && (
            <button type="button" onClick={onCancel} className="ml-auto hover:underline">
              {t("actions.cancel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
