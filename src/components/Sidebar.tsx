import React from 'react';
import {
  ClipboardList,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';

export type PortalTab = 'overview' | 'clients' | 'projects' | 'requests' | 'profile';

interface SidebarProps {
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  clientsCount: number;
  pendingApprovalsCount: number;
  projectsCount: number;
  pendingRequestsCount: number;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isAdmin,
  userName,
  userEmail,
  clientsCount,
  pendingApprovalsCount,
  projectsCount,
  pendingRequestsCount,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: PortalTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    highlightCount?: boolean;
  }> = isAdmin
    ? [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        {
          id: 'clients',
          label: 'Clientes e Aprovações',
          icon: Users,
          count: pendingApprovalsCount > 0 ? pendingApprovalsCount : clientsCount,
          highlightCount: pendingApprovalsCount > 0,
        },
        {
          id: 'projects',
          label: 'Projetos',
          icon: FolderKanban,
          count: projectsCount,
        },
        {
          id: 'requests',
          label: 'Solicitações',
          icon: ClipboardList,
          count: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
          highlightCount: pendingRequestsCount > 0,
        },
        { id: 'profile', label: 'Segurança e Senha', icon: ShieldCheck },
      ]
    : [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        {
          id: 'projects',
          label: 'Meus Projetos',
          icon: FolderKanban,
          count: projectsCount,
        },
        {
          id: 'requests',
          label: 'Nova Solicitação',
          icon: ClipboardList,
        },
        { id: 'profile', label: 'Meus Dados e Senha', icon: UserCircle2 },
      ];

  const handleNavClick = (tab: PortalTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0e100f] border-r border-[#242a25] text-[#f0f1ed]">
      {/* Brand Lockup */}
      <div className="h-16 px-5 border-b border-[#242a25] flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 min-w-0">
          <img
            src="/projetos/kh-logo-metal.png"
            alt="Monograma KH"
            className="w-9 h-9 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="font-display font-extrabold text-[13px] tracking-[1.3px] kh-metallic-wordmark truncate">
              KH ENGENHARIA
            </div>
            <div className="text-[10px] text-[#8f9991] truncate">
              {isAdmin ? 'Painel do Administrador' : 'Área do Cliente'}
            </div>
          </div>
        </a>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 text-[#9aa49c] hover:text-white cursor-pointer"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Navegação do portal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#1a201c] text-[#f0f1ed] border border-[#313b33]'
                  : 'text-[#9aa49c] hover:text-[#f0f1ed] hover:bg-[#141815] border border-transparent'
              }`}
            >
              <span className="inline-flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c0d0b8]' : 'text-[#7f8981]'}`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`text-xs font-mono tabular-nums shrink-0 ${
                    item.highlightCount ? 'text-[#e8c67a] font-semibold' : 'text-[#8c968e]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account & Return Links */}
      <div className="p-4 border-t border-[#242a25] space-y-3">
        <div className="px-2">
          <div className="text-xs font-medium text-[#e3e7e1] truncate">{userName}</div>
          <div className="text-[11px] text-[#7f8981] truncate mt-0.5">{userEmail}</div>
        </div>

        <div className="pt-2 border-t border-[#1e231f] space-y-1">
          <a
            href="/"
            className="w-full flex items-center justify-between px-2 py-2 text-xs text-[#9aa49c] hover:text-[#f0f1ed] transition-colors"
          >
            <span>Site institucional</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-between px-2 py-2 text-xs text-[#9aa49c] hover:text-[#f09d78] transition-colors cursor-pointer"
          >
            <span>Sair da conta</span>
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
