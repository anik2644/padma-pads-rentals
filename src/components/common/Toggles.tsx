import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useLanguageStore } from "@/store/languageStore";
import { initI18n } from "@/i18n";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useThemeStore();
  // Re-apply on mount in case of SSR mismatch
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggle } = useLanguageStore();
  useEffect(() => {
    initI18n(lang);
  }, [lang]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle language"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      {lang === "en" ? "EN" : "বাং"}
      <span className="mx-1 text-muted-foreground">|</span>
      <span className="text-muted-foreground">{lang === "en" ? "বাং" : "EN"}</span>
    </button>
  );
}
