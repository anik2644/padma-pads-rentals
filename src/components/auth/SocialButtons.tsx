import { Button } from "@/components/ui/button";

interface Props {
  onProvider: (p: "google" | "facebook" | "apple") => void;
  disabled?: boolean;
  mode?: "login" | "signup" | "attach";
}

export function SocialButtons({ onProvider, disabled, mode = "login" }: Props) {
  const verb =
    mode === "signup" ? "Sign up" : mode === "attach" ? "Attach" : "Continue";
  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 justify-center gap-2"
        onClick={() => onProvider("google")}
        disabled={disabled}
      >
        <GoogleIcon /> {verb} with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 justify-center gap-2"
        onClick={() => onProvider("facebook")}
        disabled={disabled}
      >
        <FacebookIcon /> {verb} with Facebook
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 justify-center gap-2"
        onClick={() => onProvider("apple")}
        disabled={disabled}
      >
        <AppleIcon /> {verb} with Apple
      </Button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.55c2.08-1.92 3.23-4.74 3.23-8.33Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.27-2.66l-3.55-2.77c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.85A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.1V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.67-2.85Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.85C6.72 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M16.36 12.78c-.02-2.36 1.93-3.5 2.02-3.55-1.1-1.6-2.81-1.82-3.43-1.85-1.45-.15-2.85.86-3.6.86-.74 0-1.89-.84-3.11-.82-1.6.02-3.08.93-3.91 2.37-1.66 2.88-.42 7.13 1.2 9.46.79 1.14 1.74 2.42 2.97 2.37 1.19-.05 1.64-.77 3.08-.77 1.43 0 1.84.77 3.1.74 1.28-.02 2.09-1.16 2.87-2.3.91-1.32 1.28-2.6 1.3-2.66-.03-.01-2.49-.95-2.51-3.85ZM14.1 5.78c.65-.79 1.09-1.88.97-2.97-.94.04-2.07.62-2.74 1.41-.6.7-1.13 1.81-.99 2.88 1.04.08 2.11-.52 2.76-1.32Z" />
    </svg>
  );
}
