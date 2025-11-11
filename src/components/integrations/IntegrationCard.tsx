import { LucideIcon } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick: () => void;
}

export function IntegrationCard({ name, icon: Icon, iconColor = "#6366f1", onClick }: IntegrationCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-6 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      <div 
        className="flex items-center justify-center w-12 h-12 rounded-lg mb-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon className="h-6 w-6" style={{ color: iconColor }} />
      </div>
      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
        {name}
      </span>
    </button>
  );
}
