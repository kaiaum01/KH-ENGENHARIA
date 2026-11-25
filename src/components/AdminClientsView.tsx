import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  FolderPlus,
  KeyRound,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import {
  ACCESS_REQUEST_STATUS_META,
  CLIENT_STATUS_META,
  SERVICE_TYPE_LABELS,
  type AccessRequest,
  type ClientAccount,
  type ClientAuthMethod,
  type Project,
} from '../types/portal';
import {
  approveAccessRequestWithGoogle,
  createClientAccountAsAdmin,
  declineAccessRequest,
  deleteClientAccountAsAdmin,
  updateClientAccountAsAdmin,
} from '../lib/portalService';
import { FIREBASE_PROJECT_ID } from '../lib/firebase';
import { BLUEPRINT_LIMITS, formatTimestampPtBr } from '../lib/validation';

interface AdminClientsViewProps {
  adminUid: string;
  clients: ClientAccount[];
  accessRequests: AccessRequest[];
  projects: Project[];
  loading: boolean;
  onCreateProjectForClient: (client: ClientAccount) => void;
}

function generateStrongInitialPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#';
  const bytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function AdminClientsView({
  adminUid,
  clients,
  accessRequests,
  projects,
  loading,
  onCreateProjectForClient,
}: AdminClientsViewProps) {
  const [subTab, setSubTab] = useState<'clients' | 'approvals'>('clients');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Client Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<AccessRequest | null>(null);
  const [createForm, setCreateForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    city: 'Umuarama, PR',
    notes: '',
    authMethod: 'email_senha' as ClientAuthMethod,
    password: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [creatingClient, setCreatingClient] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [needsEmailProvider, setNeedsEmailProvider] = useState(false);

  // Success summary after creating client login (for copying / sharing via WhatsApp)
  const [createdCredentials, setCreatedCredentials] = useState<{
    displayName: string;
    email: string;
    password?: string;
    phone: string;
    authMethod: ClientAuthMethod;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Delete confirmation (in-app)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`;

  const pendingApprovals = useMemo(
    () => accessRequests.filter((r) => r.status === 'pendente'),
    [accessRequests]
  );

  const activeClientsCount = useMemo(
    () => clients.filter((c) => c.status === 'aprovado').length,
    [clients]
  );

  const suspendedClientsCount = useMemo(
    () => clients.filter((c) => c.status === 'suspenso').length,
    [clients]
  );

  const projectCountByEmail = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => {
      const key = p.clientEmail.toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [projects]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const openNewClientModal = (fromRequest?: AccessRequest) => {
    setApprovingRequest(fromRequest || null);
    setCreateForm({
      displayName: fromRequest?.displayName || '',
      email: fromRequest?.email || '',
      phone: fromRequest?.phone || '',
      city: fromRequest?.city || 'Umuarama, PR',
      notes: fromRequest
        ? `${SERVICE_TYPE_LABELS[fromRequest.serviceInterest]}${fromRequest.message ? ` · ${fromRequest.message}` : ''}`.slice(
            0,
            BLUEPRINT_LIMITS.clientNotes
          )
        : '',
      authMethod: 'email_senha',
      password: generateStrongInitialPassword(),
    });
    setCreateError(null);
    setNeedsEmailProvider(false);
    setCreatedCredentials(null);
    setCopiedInvite(false);
    setShowCreateModal(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    setCreateError(null);
    setNeedsEmailProvider(false);

    try {
      await createClientAccountAsAdmin(adminUid, {
        displayName: createForm.displayName,
        email: createForm.email,
        phone: createForm.phone,
        city: createForm.city,
        notes: createForm.notes,
        authMethod: createForm.authMethod,
        password: createForm.authMethod === 'email_senha' ? createForm.password : undefined,
        existingUid: approvingRequest?.applicantUid,
        sourceAccessRequestId: approvingRequest?.id,
      });

      setCreatedCredentials({
        displayName: createForm.displayName.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.authMethod === 'email_senha' ? createForm.password : undefined,
        phone: createForm.phone.trim(),
        authMethod: createForm.authMethod,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível criar o usuário do cliente.';
      if (msg === 'AUTH_EMAIL_PASSWORD_DISABLED') {
        setNeedsEmailProvider(true);
      } else {
        setCreateError(msg);
      }
    } finally {
      setCreatingClient(false);
    }
  };

  const handleQuickApproveGoogle = async (req: AccessRequest) => {
    setBusyId(req.id);
    setFeedbackError(null);
    try {
      await approveAccessRequestWithGoogle(adminUid, req);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao aprovar solicitação.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeclineRequest = async (req: AccessRequest) => {
    setBusyId(req.id);
    setFeedbackError(null);
    try {
      await declineAccessRequest(req.id, 'Solicitação recusada pelo administrador.');
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao recusar solicitação.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleClientStatus = async (client: ClientAccount) => {
    setBusyId(client.id);
    setFeedbackError(null);
    try {
      await updateClientAccountAsAdmin(client.id, {
        status: client.status === 'aprovado' ? 'suspenso' : 'aprovado',
      });
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao atualizar status do cliente.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setBusyId(clientId);
    setFeedbackError(null);
    try {
      await deleteClientAccountAsAdmin(clientId);
      setConfirmDeleteId(null);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Erro ao remover cliente.');
    } finally {
      setBusyId(null);
    }
  };

  const buildInviteText = () => {
    if (!createdCredentials) return '';
    const portalUrl = `${window.location.origin}/cliente/index.html`;
    if (createdCredentials.authMethod === 'email_senha') {
      return `Olá ${createdCredentials.displayName}! Seu acesso à Área do Cliente da KH Engenharia foi aprovado e criado.\n\nAcesse: ${portalUrl}\nE-mail: ${createdCredentials.email}\nSenha inicial: ${createdCredentials.password}\n\nImportante: confirme o link enviado no seu e-mail antes do primeiro acesso.`;
    }
    return `Olá ${createdCredentials.displayName}! Seu acesso à Área do Cliente da KH Engenharia foi aprovado.\n\nAcesse: ${portalUrl}\nEntre com sua conta Google (${createdCredentials.email}).`;
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(buildInviteText());
      setCopiedInvite(true);
    } catch {
      // Fallback silent
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#242a25]">
        <div>
          <p className="text-xs font-mono tracking-wider text-[#95a491] mb-2">
            ADMINISTRAÇÃO · CONTROLE DE ACESSOS
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed]">
            Clientes e aprovações
          </h1>
          <p className="text-sm text-[#9aa49c] mt-1.5">
            Aprove pedidos de cadastro, crie contas de acesso com e-mail e senha para seus clientes e gerencie permissões.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openNewClientModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Criar usuário de cliente
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#242a25] bg-[#121513] divide-y lg:divide-y-0 lg:divide-x divide-[#242a25]">
        <div className="p-5">
          <div className="text-xs text-[#8f9991] mb-2">Clientes ativos</div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : activeClientsCount}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Aprovados no portal</div>
        </div>

        <div className="p-5 border-l border-[#242a25] lg:border-l-0">
          <div className="text-xs text-[#8f9991] mb-2">Aprovações pendentes</div>
          <div
            className={`font-mono text-2xl sm:text-3xl font-medium tabular-nums ${
              pendingApprovals.length > 0 ? 'text-[#e8c67a]' : 'text-[#f0f1ed]'
            }`}
          >
            {loading ? '—' : pendingApprovals.length}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Aguardando sua revisão</div>
        </div>

        <div className="p-5">
          <div className="text-xs text-[#8f9991] mb-2">Acessos suspensos</div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : suspendedClientsCount}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Bloqueados temporariamente</div>
        </div>

        <div className="p-5 border-l border-[#242a25] lg:border-l-0">
          <div className="text-xs text-[#8f9991] mb-2">Projetos vinculados</div>
          <div className="font-mono text-2xl sm:text-3xl font-medium tabular-nums text-[#f0f1ed]">
            {loading ? '—' : projects.length}
          </div>
          <div className="text-xs text-[#7f8981] mt-1.5">Em toda a carteira</div>
        </div>
      </div>

      {feedbackError && (
        <div className="p-3.5 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
          {feedbackError}
        </div>
      )}

      {/* Segmented Tabs + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-[#121513] border border-[#242a25] w-fit">
          <button
            type="button"
            onClick={() => setSubTab('clients')}
            className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'clients'
                ? 'bg-[#232b25] text-[#f0f1ed]'
                : 'text-[#8f9991] hover:text-[#e3e7e1]'
            }`}
          >
            Clientes cadastrados ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('approvals')}
            className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'approvals'
                ? 'bg-[#232b25] text-[#f0f1ed]'
                : 'text-[#8f9991] hover:text-[#e3e7e1]'
            }`}
          >
            Fila de aprovações ({pendingApprovals.length})
          </button>
        </div>

        {subTab === 'clients' && (
          <div className="relative w-full md:w-72">
            <Search
              className="w-4 h-4 text-[#7f8981] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nome, e-mail ou cidade..."
              aria-label="Buscar clientes"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#121513] border border-[#242a25] text-[#f0f1ed] placeholder:text-[#737d75] focus:border-[#788a76]"
            />
          </div>
        )}
      </div>

      {/* TAB 1: CLIENTS TABLE */}
      {subTab === 'clients' && (
        <>
          {loading ? (
            <div className="border border-[#242a25] bg-[#121513] p-6 text-xs text-[#8f9991]">
              Carregando carteira de clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="border border-[#242a25] bg-[#121513] p-10 text-center space-y-4">
              <p className="text-sm text-[#9aa49c]">
                {clients.length === 0
                  ? 'Nenhum cliente aprovado ainda. Crie o primeiro usuário de cliente clicando abaixo.'
                  : 'Nenhum cliente encontrado com esse termo de busca.'}
              </p>
              {clients.length === 0 && (
                <button
                  type="button"
                  onClick={() => openNewClientModal()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Criar primeiro cliente
                </button>
              )}
            </div>
          ) : (
            <div className="border border-[#242a25] bg-[#121513] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="border-b border-[#242a25] text-[11px] font-mono text-[#858f87]">
                    <th className="py-3.5 px-5 font-medium">Cliente</th>
                    <th className="py-3.5 px-4 font-medium">Contato / Cidade</th>
                    <th className="py-3.5 px-4 font-medium">Login</th>
                    <th className="py-3.5 px-4 font-medium">Situação</th>
                    <th className="py-3.5 px-4 font-medium text-right">Projetos</th>
                    <th className="py-3.5 px-5 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2420] text-sm">
                  {filteredClients.map((client) => {
                    const stMeta = CLIENT_STATUS_META[client.status];
                    const projCount = projectCountByEmail.get(client.email.toLowerCase()) || 0;
                    const isDeleting = confirmDeleteId === client.id;
                    const isBusy = busyId === client.id;

                    return (
                      <tr key={client.id} className="hover:bg-[#171c19] transition-colors">
                        <td className="py-4 px-5 align-top">
                          <div className="font-medium text-[#f0f1ed]">{client.displayName}</div>
                          <div className="text-xs text-[#8f9991] mt-0.5">{client.email}</div>
                          {client.notes && (
                            <div className="text-[11px] text-[#737d75] mt-1 max-w-xs truncate">
                              {client.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 align-top text-xs">
                          <div className="text-[#cfd6ce]">{client.phone || 'Não informado'}</div>
                          <div className="text-[#7f8981] mt-0.5">{client.city || '—'}</div>
                        </td>

                        <td className="py-4 px-4 align-top text-xs text-[#aeb6af] whitespace-nowrap">
                          {client.authMethod === 'email_senha' ? 'E-mail e senha' : 'Conta Google'}
                        </td>

                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <span className={`text-xs font-medium ${stMeta.textClass}`}>
                            {stMeta.label}
                          </span>
                        </td>

                        <td className="py-4 px-4 align-top text-right font-mono tabular-nums text-xs text-[#e3e7e1]">
                          {projCount}
                        </td>

                        <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                          {isDeleting ? (
                            <div className="inline-flex items-center gap-2 text-xs">
                              <span className="text-[#f09d78]">Remover?</span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteClient(client.id)}
                                className="font-semibold text-white underline underline-offset-4 cursor-pointer"
                              >
                                Sim
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[#9aa49c] hover:text-white cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onCreateProjectForClient(client)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#323c34] text-xs text-[#d8ddd6] hover:border-[#788a76] cursor-pointer"
                                title="Criar novo projeto para este cliente"
                              >
                                <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                Projeto
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleClientStatus(client)}
                                className="px-2.5 py-1.5 border border-[#29302a] text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                              >
                                {client.status === 'aprovado' ? 'Suspender' : 'Reativar'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(client.id)}
                                aria-label={`Remover cliente ${client.displayName}`}
                                className="p-1.5 text-[#758077] hover:text-[#f09d78] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: APPROVAL QUEUE */}
      {subTab === 'approvals' && (
        <>
          {loading ? (
            <div className="border border-[#242a25] bg-[#121513] p-6 text-xs text-[#8f9991]">
              Carregando fila de aprovações...
            </div>
          ) : accessRequests.length === 0 ? (
            <div className="border border-[#242a25] bg-[#121513] p-10 text-center text-sm text-[#8f9991]">
              Nenhum pedido de aprovação de acesso recebido ainda. Quando novos clientes solicitarem cadastro pela Área do Cliente, eles aparecerão aqui.
            </div>
          ) : (
            <div className="border border-[#242a25] bg-[#121513] divide-y divide-[#202621]">
              {accessRequests.map((req) => {
                const stMeta = ACCESS_REQUEST_STATUS_META[req.status];
                const isBusy = busyId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-5"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8f9991]">
                        <span className={`font-medium ${stMeta.textClass}`}>{stMeta.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#cfd6ce]">
                          {SERVICE_TYPE_LABELS[req.serviceInterest]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatTimestampPtBr(req.createdAt)}
                        </span>
                      </div>

                      <div className="text-base font-medium text-[#f0f1ed]">{req.displayName}</div>
                      <div className="text-xs text-[#aeb6af]">
                        {req.email} · {req.phone} · {req.city}
                      </div>

                      {req.message && (
                        <p className="text-xs text-[#9aa49c] leading-relaxed pt-1 whitespace-pre-line">
                          {req.message}
                        </p>
                      )}
                    </div>

                    {req.status === 'pendente' && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleQuickApproveGoogle(req)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white whitespace-nowrap cursor-pointer disabled:opacity-60"
                        >
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          Aprovar acesso
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => openNewClientModal(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                          Aprovar com senha
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeclineRequest(req)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs text-[#8f9991] hover:text-[#f09d78] whitespace-nowrap cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE CLIENT USER MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-client-modal-title"
        >
          <div className="w-full max-w-xl bg-[#121513] border border-[#2f3830] my-8">
            <div className="px-6 py-4 border-b border-[#242a25] flex items-center justify-between">
              <div>
                <h2
                  id="create-client-modal-title"
                  className="font-display text-lg font-medium text-[#f0f1ed]"
                >
                  {createdCredentials
                    ? 'Usuário do cliente criado com sucesso'
                    : approvingRequest
                      ? `Aprovar e criar acesso · ${approvingRequest.displayName}`
                      : 'Criar usuário de cliente'}
                </h2>
                <p className="text-xs text-[#8f9991] mt-0.5">
                  {createdCredentials
                    ? 'Envie as credenciais abaixo para o cliente acessar a Área do Cliente.'
                    : 'Você permanecerá conectado ao painel administrativo enquanto cria a conta.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-[#9aa49c] hover:text-white cursor-pointer"
                aria-label="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              <div className="p-6 space-y-5">
                <div className="p-4 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-start gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Acesso aprovado e registrado para{' '}
                    <strong>{createdCredentials.displayName}</strong>.
                    {createdCredentials.authMethod === 'email_senha' &&
                      ' Um e-mail de confirmação foi enviado automaticamente para validar o login.'}
                  </span>
                </div>

                <div className="border border-[#242a25] bg-[#0b0c0c] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#858f87]">Link do portal</span>
                    <span className="font-mono text-[#e3e7e1] truncate">
                      {window.location.origin}/cliente/index.html
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#858f87]">E-mail de acesso</span>
                    <span className="font-mono text-[#f0f1ed]">{createdCredentials.email}</span>
                  </div>
                  {createdCredentials.password && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#858f87]">Senha inicial</span>
                      <span className="font-mono text-[#c0d0b8] font-medium">
                        {createdCredentials.password}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] cursor-pointer"
                    >
                      {copiedInvite ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#86d69d]" aria-hidden="true" />
                          Convite copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          Copiar convite
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/${createdCredentials.phone.replace(/\D/g, '') ? `55${createdCredentials.phone.replace(/\D/g, '').replace(/^55/, '')}` : ''}?text=${encodeURIComponent(buildInviteText())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white"
                    >
                      Enviar pelo WhatsApp
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-2 text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                {createError && (
                  <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
                    {createError}
                  </div>
                )}

                {needsEmailProvider && (
                  <div className="p-4 border border-[#5e4d29] bg-[#1d1910] text-xs text-[#e8c67a] space-y-2 leading-relaxed">
                    <div className="font-semibold text-[#f3dca2]">
                      Ative "E-mail/senha" no Firebase Authentication
                    </div>
                    <p className="text-[#d4c49c]">
                      Para criar contas de clientes com senha, habilite o provedor{' '}
                      <strong>E-mail/senha</strong> no Firebase Console. Você também pode escolher a opção{' '}
                      <strong>Liberar acesso via Google</strong> abaixo imediatamente.
                    </p>
                    <a
                      href={firebaseProvidersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-white underline underline-offset-4"
                    >
                      Abrir Firebase Authentication
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                )}

                {/* Auth Method Selector */}
                <div>
                  <label className="block text-xs text-[#aeb6af] mb-2">Método de login do cliente</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, authMethod: 'email_senha' })}
                      className={`p-3 text-left border transition-colors cursor-pointer ${
                        createForm.authMethod === 'email_senha'
                          ? 'bg-[#1c231e] border-[#788a76] text-[#f0f1ed]'
                          : 'bg-[#0b0c0c] border-[#262d27] text-[#8f9991]'
                      }`}
                    >
                      <div className="text-xs font-semibold">Criar e-mail e senha</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        Define uma senha inicial para o cliente
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, authMethod: 'google' })}
                      className={`p-3 text-left border transition-colors cursor-pointer ${
                        createForm.authMethod === 'google'
                          ? 'bg-[#1c231e] border-[#788a76] text-[#f0f1ed]'
                          : 'bg-[#0b0c0c] border-[#262d27] text-[#8f9991]'
                      }`}
                    >
                      <div className="text-xs font-semibold">Liberar acesso Google</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        Cliente entra com o e-mail Google dele
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#aeb6af] mb-1.5">Nome completo *</label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.displayName}
                      value={createForm.displayName}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, displayName: e.target.value })
                      }
                      placeholder="Nome do cliente"
                      className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#aeb6af] mb-1.5">E-mail do cliente *</label>
                    <input
                      type="email"
                      required
                      maxLength={BLUEPRINT_LIMITS.email}
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="cliente@exemplo.com"
                      className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                    />
                  </div>
                </div>

                {createForm.authMethod === 'email_senha' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-[#aeb6af]">Senha inicial do cliente *</label>
                      <button
                        type="button"
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            password: generateStrongInitialPassword(),
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-[#a8baa4] hover:text-white cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" aria-hidden="true" />
                        Gerar nova senha
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-3 pr-10 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8981] hover:text-white cursor-pointer"
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#aeb6af] mb-1.5">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.phone}
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="(44) 99999-0000"
                      className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#aeb6af] mb-1.5">Cidade</label>
                    <input
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.city}
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="Umuarama, PR"
                      className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Observações internas</label>
                  <input
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.clientNotes}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Ex.: Contrato assinado em 25/11 · Regularização residencial"
                    className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  />
                </div>

                <div className="pt-3 border-t border-[#242a25] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {creatingClient ? 'Criando acesso...' : 'Aprovar e criar cliente'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
