// src/components/layout/Topbar.tsx
import { Bell } from "lucide-react";
import clsx from "clsx";
import ThemeToggle from "@/components/ThemeToggle";

type TopbarProps = {
  scrolled?: boolean;
  onNotificationsClick?: () => void;
};

export function Topbar({ scrolled, onNotificationsClick }: TopbarProps) {
  return (
    <header
      className={clsx(
        "sticky top-0 z-40",
        // fundo translúcido e blur para efeito premium
        "backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "bg-background/70",
        // só mostra separador/sombra quando scrolled = true
        scrolled ? "shadow-sm border-b border-border/60" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-end gap-2 px-4">
        {/* Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          onClick={onNotificationsClick}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent hover:bg-foreground/5 transition"
        >
          <Bell className="h-5 w-5" />
          {/* Badge de não lidas (exemplo opcional) */}
          {/* <span className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 rounded-full bg-red-500" /> */}
        </button>

        {/* Toggle de tema */}
        <ThemeToggle />
      </div>
    </header>
  );
}
