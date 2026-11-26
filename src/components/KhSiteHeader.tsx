import React, { useState } from 'react';
import { LogOut, Menu, Plus, X } from 'lucide-react';
import type { PortalTab } from './Sidebar';
import { PWAInstallButton } from './PWAInstallButton';

interface PublicHeaderProps {
  variant: 'public';
  adminAppMode?: boolean;
  signedInEmail?: string | null;
  onSignOut?: () => void;
}

interface PortalHeaderProps {
  variant: 'portal';
  isAdmin: boolean;
  activeTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  clientsCount: number;
  pendingApprovalsCount: number;
  projectsCount: number;
  contractsCount: number;
  pendingContractsCount: number;
  pendingRequestsCount: number;
  onPrimaryAction: () => void;
  onOpenWindowsGuide: () => void;
}

type KhSiteHeaderProps = PublicHeaderProps | PortalHeaderProps;

export function KhSiteHeader(props: KhSiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const portalNavItems: Array<{
    id: PortalTab;
    label: string;
    count?: number;
    highlightCount?: boolean;
  }> =
    props.variant === 'portal'
      ? props.isAdmin
        ? [
            {
              id: 'clients',
              label: 'Clientes',
              count:
                props.pendingApprovalsCount > 0
                  ? props.pendingApprovalsCount
                  : props.clientsCount,
              highlightCount: props.pendingApprovalsCount > 0,
            },
            {
              id: 'projects',
              label: 'Projetos',
              count: props.projectsCount,
            },
            {
              id: 'contracts',
              label: 'Contratos',
              count:
                props.pendingContractsCount > 0
                  ? props.pendingContractsCount
                  : props.contractsCount,
              highlightCount: props.pendingContractsCount > 0,
            },
            {
              id: 'requests',
              label: 'Solicitações',
              count: props.pendingRequestsCount > 0 ? props.pendingRequestsCount : undefined,
              highlightCount: props.pendingRequestsCount > 0,
            },
            { id: 'windows_app', label: 'App Windows' },
            { id: 'profile', label: 'Segurança' },
          ]
        : [
            {
              id: 'overview',
              label: 'Meus Projetos',
              count: props.projectsCount,
            },
            {
              id: 'contracts',
              label: 'Contratos',
              count:
                props.pendingContractsCount > 0
                  ? props.pendingContractsCount
                  : props.contractsCount > 0
                    ? props.contractsCount
                    : undefined,
              highlightCount: props.pendingContractsCount > 0,
            },
            { id: 'requests', label: 'Solicitações' },
            { id: 'profile', label: 'Meus Dados' },
          ]
      : [];

  return (
    <div className="bg-[#0b0c0c] relative z-30">
      <div className="kh-wrap">
        <header className="h-[80px] md:h-[100px] border-b border-[#303333] flex items-center justify-between gap-6">
          {/* Exact Brand Lockup matching /index.html */}
          <a
            href="/"
            className="flex items-center gap-[13px] whitespace-nowrap shrink-0 group"
            aria-label="Kaio Henrique — início"
          >
            <img
              src="/projetos/kh-logo-metal.png"
              alt="Monograma KH"
              className="w-[44px] h-[44px] md:w-[55px] md:h-[55px] object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="font-display font-extrabold text-[15px] md:text-[17px] tracking-[1.1px] md:tracking-[1.5px] leading-none kh-metallic-wordmark">
                KAIO HENRIQUE
              </div>
              <span className="block text-[9px] md:text-[10px] font-semibold tracking-[1.6px] md:tracking-[2.1px] text-[#cbd1d6] mt-[5px] md:mt-[6px] leading-none">
                ENGENHEIRO CIVIL
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          {props.variant === 'public' ? (
            <nav
              aria-label="Principal"
              className="hidden md:flex items-center gap-[22px] lg:gap-[25px] text-[13px] text-[#b9bebb]"
            >
              <a href="/sobre/index.html" className="hover:text-[#f0f1ed] transition-colors whitespace-nowrap">
                Sobre mim
              </a>
              <a href="/#servicos" className="hover:text-[#f0f1ed] transition-colors whitespace-nowrap">
                Serviços
              </a>
              <a href="/#referencias" className="hover:text-[#f0f1ed] transition-colors whitespace-nowrap">
                Referências
              </a>
              <a href="/#duvidas" className="hover:text-[#f0f1ed] transition-colors whitespace-nowrap">
                Dúvidas
              </a>
              <a href="/#contato" className="hover:text-[#f0f1ed] transition-colors whitespace-nowrap">
                Contato
              </a>

              {props.signedInEmail && props.onSignOut ? (
                <button
                  type="button"
                  onClick={props.onSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#465246] text-[#f0f1ed] text-[13px] font-medium hover:border-[#9baf91] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sair
                </button>
              ) : props.adminAppMode ? (
                <PWAInstallButton compact />
              ) : (
                <span className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-[18px] py-[11px] font-bold tracking-[0.2px] border border-[#d8ddd6] whitespace-nowrap">
                  Área do Cliente
                </span>
              )}
            </nav>
          ) : (
            <nav
              aria-label="Navegação do portal"
              className="hidden lg:flex items-center gap-6 text-[13px] text-[#b9bebb]"
            >
              {portalNavItems.map((item) => {
                const isActive =
                  props.activeTab === item.id ||
                  (!props.isAdmin && item.id === 'overview' && props.activeTab === 'projects') ||
                  (props.isAdmin && item.id === 'projects' && props.activeTab === 'overview');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => props.onSelectTab(item.id)}
                    className={`relative py-2 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'text-[#f0f1ed] font-medium'
                        : 'text-[#aeb5af] hover:text-[#f0f1ed]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {typeof item.count === 'number' && (
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          item.highlightCount ? 'text-[#e8c67a] font-semibold' : 'text-[#8c968e]'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-[#c0d0b8]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}

              {!props.isAdmin && (
                <a
                  href="/"
                  className="text-[#aeb5af] hover:text-[#f0f1ed] transition-colors whitespace-nowrap"
                >
                  Site ↗
                </a>
              )}

              <button
                type="button"
                onClick={props.onPrimaryAction}
                className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-[18px] py-[11px] text-[13px] font-bold tracking-[0.2px] hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {props.isAdmin ? 'Novo projeto' : 'Solicitar serviço'}
              </button>
            </nav>
          )}

          {/* Mobile Menu Toggle (matches /index.html style) */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            className={`${
              props.variant === 'public' ? 'md:hidden' : 'lg:hidden'
            } inline-flex items-center gap-2 border border-[#555] text-[#f0f1ed] px-3 py-2 text-[13px] cursor-pointer`}
          >
            {mobileOpen ? (
              <>
                <X className="w-4 h-4" aria-hidden="true" />
                Fechar
              </>
            ) : (
              <>
                <Menu className="w-4 h-4" aria-hidden="true" />
                Menu
              </>
            )}
          </button>
        </header>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      {mobileOpen && (
        <div
          className={`${
            props.variant === 'public' ? 'md:hidden' : 'lg:hidden'
          } absolute top-[80px] left-0 right-0 bg-[#121512] border-b border-[#303a32] z-40 shadow-2xl`}
        >
          <div className="kh-wrap py-6 flex flex-col gap-4 text-sm text-[#cbd2cb]">
            {props.variant === 'public' ? (
              <>
                <a href="/" className="py-1 hover:text-white">
                  Início
                </a>
                <a href="/sobre/index.html" className="py-1 hover:text-white">
                  Sobre mim
                </a>
                <a href="/#servicos" className="py-1 hover:text-white">
                  Serviços
                </a>
                <a href="/#referencias" className="py-1 hover:text-white">
                  Referências
                </a>
                <a href="/#duvidas" className="py-1 hover:text-white">
                  Dúvidas
                </a>
                <a href="/#contato" className="py-1 hover:text-white">
                  Contato
                </a>
                {props.signedInEmail && props.onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      props.onSignOut?.();
                    }}
                    className="mt-2 inline-flex items-center justify-center gap-2 py-2.5 border border-[#465246] text-xs font-medium text-[#f0f1ed] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sair ({props.signedInEmail})
                  </button>
                )}
              </>
            ) : (
              <>
                {portalNavItems.map((item) => {
                  const isActive =
                    props.activeTab === item.id ||
                    (!props.isAdmin && item.id === 'overview' && props.activeTab === 'projects') ||
                    (props.isAdmin && item.id === 'projects' && props.activeTab === 'overview');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        props.onSelectTab(item.id);
                        setMobileOpen(false);
                      }}
                      className={`py-1.5 flex items-center justify-between text-left cursor-pointer ${
                        isActive ? 'text-[#f0f1ed] font-semibold' : 'text-[#aeb5af]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {typeof item.count === 'number' && (
                        <span
                          className={`text-xs font-mono tabular-nums ${
                            item.highlightCount ? 'text-[#e8c67a]' : 'text-[#8c968e]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
                <a href="/" className="py-1.5 text-[#aeb5af] hover:text-white">
                  Voltar ao site ↗
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    props.onPrimaryAction();
                  }}
                  className="mt-2 inline-flex items-center justify-center gap-2 bg-[#d8ddd6] text-[#141815] py-3 text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  {props.isAdmin ? 'Novo projeto' : 'Solicitar serviço'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function KhSiteFooter() {
  return (
    <div className="bg-[#0b0c0c] mt-auto">
      <div className="kh-wrap">
        <footer className="border-t border-[#303333] py-[30px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-[#939b95]">
          <a
            href="/"
            className="font-display font-bold text-[14px] tracking-[2px] text-[#f0f1ed] leading-tight"
          >
            KH
            <span className="block text-[10px] font-normal tracking-[3.8px] mt-[3px] text-[#cbd1d6]">
              ENGENHARIA
            </span>
          </a>

          <span>KH Engenharia · Umuarama, PR · CREA-PR PR-232385/D</span>

          <div className="flex items-center gap-[22px] flex-wrap">
            <a href="/" className="hover:text-[#f0f1ed] transition-colors">
              Site institucional ↗
            </a>
            <a
              href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Estou%20na%20%C3%81rea%20do%20Cliente%20da%20KH%20Engenharia."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#f0f1ed] transition-colors"
            >
              WhatsApp ↗
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
