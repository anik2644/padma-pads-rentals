import { useEffect, type ReactNode } from "react";
import { useLanguageStore } from "@/store/languageStore";
import { initI18n } from "@/i18n";
import { Navbar } from "./Navbar";
import { BottomTabBar } from "./BottomTabBar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children }: { children: ReactNode }) {
  const { lang } = useLanguageStore();

  useEffect(() => {
    initI18n(lang);
  }, [lang]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomTabBar />
      <Toaster position="top-right" />
    </div>
  );
}

