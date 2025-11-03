import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  PackageSearch,
  Users,
  Wallet,
  Plug,
  Settings,
  MessageCircle,
  LifeBuoy,
  LogOut,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// --- util: link do WhatsApp ---
const WA_PHONE = import.meta.env.VITE_WA_PHONE_E164 as string | undefined;
const WA_MSG =
  (import.meta.env.VITE_WA_DEFAULT_MSG as string | undefined) ??
  'Olá! Preciso de ajuda com meu checkout. Pode me orientar?';

function buildWhatsAppHref() {
  if (!WA_PHONE) return null;
  const msg = encodeURIComponent(WA_MSG);
  return `https://wa.me/${WA_PHONE}?text=${msg}`;
}

// --- item base ---
type ItemProps = {
  to?: string;
  icon: React.ElementType;
  label: string;
  externalHref?: string;
  onClick?: () => void;
  disabled?: boolean;
};

function SidebarItem({ to, icon: Icon, label, externalHref, onClick, disabled }: ItemProps) {
  const baseCls =
    'group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ' +
    'text-foreground hover:bg-muted aria-[current=page]:bg-muted aria-[current=page]:font-medium';

  if (externalHref) {
    return (
      <a
        href={externalHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseCls} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        aria-disabled={disabled ? 'true' : 'false'}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseCls}>
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <NavLink to={to!} className={({ isActive }) => (isActive ? `${baseCls} bg-muted font-medium` : baseCls)}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const [email, setEmail] = useState<string | null>(null);

  // Carrega o e-mail do usuário logado
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setEmail(data.user?.email ?? null);
      } catch {
        setEmail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const waHref = useMemo(buildWhatsAppHref, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.assign('/auth');
    }
  };

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-40 w-64 border-r border-border
        bg-background text-foreground
        flex flex-col
      "
      aria-label="Navegação lateral"
    >
      {/* Branding */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-medium text-muted-foreground">RiseCheckout</span>
      </div>

      {/* Conteúdo rolável */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {/* NAVEGAÇÃO */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navegação
          </p>
          <div className="space-y-1">
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/produtos" icon={PackageSearch} label="Produtos" />
            <SidebarItem to="/afiliados" icon={Users} label="Afiliados" />
          </div>
        </div>

        {/* OPERAÇÕES */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operações
          </p>
          <div className="space-y-1">
            <SidebarItem to="/financeiro" icon={Wallet} label="Financeiro" />
            <SidebarItem to="/integracoes" icon={Plug} label="Integrações" />
          </div>
        </div>

        {/* SISTEMA */}
        <div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sistema
          </p>
          <div className="space-y-1">
            <SidebarItem to="/config" icon={Settings} label="Configurações" />
            
            {/* Suporte via WhatsApp */}
            <SidebarItem
              icon={MessageCircle}
              label="Suporte pelo WhatsApp"
              externalHref={waHref ?? undefined}
              disabled={!waHref}
            />

            {/* Ajuda (rota interna) */}
            <SidebarItem to="/ajuda" icon={LifeBuoy} label="Ajuda" />

            {/* Sair (ação) */}
            <SidebarItem icon={LogOut} label="Sair" onClick={handleLogout} />
          </div>
        </div>
      </nav>

      {/* Rodapé do sidebar */}
      <div className="border-t border-border p-3">
        <div className="mb-2 truncate text-xs text-muted-foreground" title={email ?? ''}>
          {email ?? 'Usuário'}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2
                     text-sm text-foreground hover:opacity-85 transition"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
