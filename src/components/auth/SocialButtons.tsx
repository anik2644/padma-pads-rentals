import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { EmailProvider } from "@/lib/firestore-user";

type SocialProvider = Exclude<EmailProvider, "self">;

interface Props {
  onProvider: (provider: SocialProvider) => void;
  disabled?: boolean;
  mode?: "login" | "attach";
  only?: SocialProvider[];
}

const providers: SocialProvider[] = ["google", "facebook", "apple"];

export function SocialButtons({ onProvider, disabled, mode = "login", only }: Props) {
  const visibleProviders = only?.length ? only : providers;
  return (
    <div className="grid gap-2">
      {visibleProviders.map((provider) => (
        <Button
          key={provider}
          type="button"
          variant="outline"
          className="h-11 justify-center gap-2"
          onClick={() => onProvider(provider)}
          disabled={disabled}
        >
          <ProviderIcon provider={provider} />
          {mode === "attach"
            ? `Attach with ${label(provider)}`
            : `Continue with ${label(provider)}`}
        </Button>
      ))}
    </div>
  );
}

function label(provider: SocialProvider) {
  if (provider === "google") return "Google";
  if (provider === "facebook") return "Facebook";
  return "Apple";
}

function ProviderIcon({ provider }: { provider: SocialProvider }) {
  if (provider === "google") return <GoogleIcon />;
  if (provider === "facebook") {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-[11px] font-bold text-white">
        f
      </span>
    );
  }
  return <span className="text-sm font-semibold leading-none">A</span>;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.55c2.08-1.92 3.23-4.74 3.23-8.33Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.27-2.66l-3.55-2.77c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.85A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.1V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.67-2.85Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.85C6.72 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
