import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  FolderPlus,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  PROJECT_STATUS_META,
  SERVICE_TYPE_LABELS,
  type Project,
  type ProjectStatus,
  type ServiceRequest,
} from '../types/portal';
import { formatDateShortPtBr } from '../lib/validation';

interface OverviewViewProps {
  isAdmin: boolean;
  userName: string;
  projects: Project[];
  requests: ServiceRequest[];
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
  onNewRequest: () => void;
  onSeedDemoProject: () => Promise<void>;
  seedingDemo: boolean;
}

export function OverviewView({
  isAdmin,
  userName,
  projects,
  requests,
  loading,
  onOpenProject,
  onNewProject,
  onNewRequest,
  onSeedDemoProject,
  seedingDemo,
}: OverviewViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | ProjectStatus>('todos');

  const firstName = userName.split(' ')[0] || 'Cliente';

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'concluido').length;
    const completed = projects.filter((p) => p.status === 'concluido').length;
    const avgProgress =
      projects.length > 0
        ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
        : 0;
    const openRequests = requests.filter(
      (r) => r.status === 'recebida' || r.status === 'em_analise'
    ).length;

    return { active, completed, avgProgress, openRequests };
  }, [projects, requests]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.clientEmail.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.artNumber.toLowerCase().includes(q)
      );
    });
  }, [projects, searchQuery, statusFilter]);

  const filterOptions: Array<{ id: 'todos' | ProjectStatus; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'em_andamento', label: 'Em andamento' },
    { id: 'aguardando_cliente', label: 'Aguardando cliente' },
    { id: 'aguardando_prefeitura', label: 'Prefeitura' },
    { id: 'concluido', label: 'Concluídos' },
  ];

  return (
    <div className="space-y-9">
      {/* Page Intro matching /index.html editorial rhythm */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-7 border-b border-[#303333]">
        <div>
          <div className="kh-eyebrow">
            {isAdmin ? 'Gestão Técnica · KH Engenharia' : 'Portal do Cliente · KH Engenharia'}
          </div>
          <h1 className="font-display text-3xl sm:text-[42px] font-medium tracking-[-1.5px] leading-[1.12] text-[#f0f1ed] mt-4">
            Olá, <em className="not-italic text-[#c0d0b8]">{firstName}.</em>
          </h1>
          <p className="text-sm sm:text-[15px] text-[#aab5ac] mt-2 max-w-2xl leading-relaxed">
            {isAdmin
              ? 'Gerencie os projetos ativos, atualize etapas técnicas, publique pranchas e responda solicitações.'
              : 'Acompanhe o andamento dos seus projetos, consulte pranchas e ARTs ou envie uma nova solicitação.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isAdmin ? (
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-bold hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Novo projeto
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewRequest}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-bold hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nova solicitação
            </button>
          )}
        </div>
      </div>

      {/* 4-Column KPI Strip (Single elevation, hairline borders matching .service-detail) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#303a32] bg-[#121613] divide-y lg:divide-y-0 lg:divide-x divide-[#303a32]">
        <div className="p-5">
          <div className="text-xs text-[#8f9991] mb-2">Projetos ativos</div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : stats.active}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Em acompanhamento</div>
        </div>

        <div className="p-5 border-l border-[#242a25] lg:border-l-0">
          <div className="text-xs text-[#8f9991] mb-2">Progresso médio</div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : `${stats.avgProgress}%`}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Avanço das etapas</div>
        </div>

        <div className="p-5">
          <div className="text-xs text-[#8f9991] mb-2">Projetos concluídos</div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : stats.completed}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Entregues com ART</div>
        </div>

        <div className="p-5 border-l border-[#242a25] lg:border-l-0">
          <div className="text-xs text-[#8f9991] mb-2">
            {isAdmin ? 'Solicitações pendentes' : 'Minhas solicitações'}
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : stats.openRequests}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Aguardando retorno</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#121513] border border-[#242a25] overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatusFilter(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === opt.id
                  ? 'bg-[#232b25] text-[#f0f1ed]'
                  : 'text-[#8f9991] hover:text-[#e3e7e1]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-[#7f8981] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar código, imóvel ou ART..."
            aria-label="Buscar projetos"
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#121513] border border-[#242a25] text-[#f0f1ed] placeholder:text-[#737d75] focus:border-[#788a76]"
          />
        </div>
      </div>

      {/* Projects Table / State Views */}
      {loading ? (
        <div className="border border-[#242a25] bg-[#121513] divide-y divide-[#242a25]">
          {[1, 2, 3].map((row) => (
            <div key={row} className="p-5 flex items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-36 bg-[#1e2420]" />
                <div className="h-4 w-72 max-w-full bg-[#1a1f1c]" />
              </div>
              <div className="h-4 w-24 bg-[#1e2420]" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-[#242a25] bg-[#121513] p-8 sm:p-12 text-center">
          <FolderPlus className="w-8 h-8 text-[#8f9991] mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-display text-xl font-medium text-[#f0f1ed] mb-2">
            {isAdmin ? 'Nenhum projeto cadastrado ainda' : 'Nenhum projeto vinculado ao seu e-mail'}
          </h2>
          <p className="text-sm text-[#9aa49c] max-w-md mx-auto leading-relaxed mb-7">
            {isAdmin
              ? 'Crie o primeiro projeto de um cliente ou carregue um projeto modelo com as pranchas da KH Engenharia para testar toda a experiência.'
              : 'Assim que o Eng. Kaio Henrique cadastrar seu projeto para este e-mail, ele aparecerá aqui automaticamente. Você também pode abrir uma nova solicitação agora.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={onNewProject}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Criar primeiro projeto
                </button>
                <button
                  type="button"
                  onClick={onSeedDemoProject}
                  disabled={seedingDemo}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#374038] text-[#d8ddd6] text-xs font-medium hover:border-[#788a76] transition-colors whitespace-nowrap disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  {seedingDemo ? 'Carregando modelo...' : 'Carregar projeto modelo'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onNewRequest}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Solicitar orçamento ou serviço
                </button>
                <a
                  href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Acessei%20a%20%C3%81rea%20do%20Cliente%20e%20gostaria%20de%20vincular%20meu%20projeto."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#374038] text-[#d8ddd6] text-xs font-medium hover:border-[#788a76] transition-colors whitespace-nowrap"
                >
                  Falar no WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="border border-[#242a25] bg-[#121513] p-8 text-center">
          <p className="text-sm text-[#9aa49c] mb-3">
            Nenhum projeto encontrado com os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('todos');
            }}
            className="text-xs text-[#d8ddd6] underline underline-offset-4 hover:text-white cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="border border-[#242a25] bg-[#121513] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[740px]">
            <thead>
              <tr className="border-b border-[#242a25] text-[11px] font-mono text-[#858f87]">
                <th className="py-3.5 px-5 font-medium">Código / Projeto</th>
                {isAdmin && <th className="py-3.5 px-4 font-medium">Cliente</th>}
                <th className="py-3.5 px-4 font-medium">Situação</th>
                <th className="py-3.5 px-4 font-medium">Avanço</th>
                <th className="py-3.5 px-4 font-medium text-right">Previsão</th>
                <th className="py-3.5 px-5 font-medium text-right">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2420] text-sm">
              {filteredProjects.map((project) => {
                const statusMeta = PROJECT_STATUS_META[project.status];
                return (
                  <tr
                    key={project.id}
                    onClick={() => onOpenProject(project.id)}
                    className="hover:bg-[#171c19] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 text-xs text-[#8f9991] mb-1">
                        <span className="font-mono text-[#c5d1c0]">{project.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{SERVICE_TYPE_LABELS[project.serviceType]}</span>
                        {project.artNumber && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">ART {project.artNumber}</span>
                          </>
                        )}
                      </div>
                      <div className="font-medium text-[#f0f1ed] group-hover:text-white">
                        {project.title}
                      </div>
                      <div className="text-xs text-[#858f87] mt-0.5">
                        {project.propertyAddress} · {project.city}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-4 align-top">
                        <div className="text-xs font-medium text-[#e3e7e1]">
                          {project.clientName}
                        </div>
                        <div className="text-[11px] text-[#7f8981] mt-0.5">
                          {project.clientEmail}
                        </div>
                      </td>
                    )}

                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <span className={`text-xs font-medium ${statusMeta.textClass}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div className="flex-1 h-1.5 bg-[#232a25] overflow-hidden">
                          <div
                            className="h-full bg-[#c0d0b8]"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono tabular-nums text-[#cfd6ce] w-9 text-right">
                          {project.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                      <span className="text-xs font-mono tabular-nums text-[#aeb6af]">
                        {formatDateShortPtBr(project.estimatedDelivery)}
                      </span>
                    </td>

                    <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#d8ddd6] group-hover:text-white">
                        Abrir
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
