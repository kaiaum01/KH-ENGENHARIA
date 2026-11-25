import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where,
  type Query,
  type DocumentData,
} from 'firebase/firestore';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FilePlus2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  bindClientUidToProject,
  createMilestone,
  createProjectDocument,
  deleteMilestone,
  deleteProjectDocument,
  deleteProjectWithSubcollections,
  fulfillClientDocument,
  sendProjectMessage,
  updateDocumentAsAdmin,
  updateMilestoneStatus,
} from '../lib/portalService';
import {
  BLUEPRINT_LIMITS,
  formatDateShortPtBr,
  formatTimestampPtBr,
} from '../lib/validation';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_META,
  MILESTONE_STATUS_META,
  PROJECT_STATUS_META,
  SERVICE_TYPE_LABELS,
  type DocumentCategory,
  type DocumentStatus,
  type MilestoneStatus,
  type Project,
  type ProjectDocument,
  type ProjectMessage,
  type ProjectMilestone,
} from '../types/portal';

interface ProjectDetailViewProps {
  project: Project;
  user: User;
  userName: string;
  isAdmin: boolean;
  onBack: () => void;
  onEditProject: (project: Project) => void;
  onProjectDeleted: () => void;
}

type DetailSubTab = 'milestones' | 'documents' | 'messages';

export function ProjectDetailView({
  project,
  user,
  userName,
  isAdmin,
  onBack,
  onEditProject,
  onProjectDeleted,
}: ProjectDetailViewProps) {
  const [subTab, setSubTab] = useState<DetailSubTab>('milestones');
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirm delete project state (in-app, never window.confirm)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Milestone form (Admin)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pendente' as MilestoneStatus,
  });
  const [savingMilestone, setSavingMilestone] = useState(false);

  // Document form (Admin & Client)
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: (isAdmin ? 'planta' : 'documento_cliente') as DocumentCategory,
    revision: 'Rev. 01',
    status: (isAdmin ? 'disponivel' : 'enviado_cliente') as DocumentStatus,
    fileUrl: '',
    notes: '',
  });
  const [savingDoc, setSavingDoc] = useState(false);

  // Client fulfilling a pending document
  const [fulfillingDocId, setFulfillingDocId] = useState<string | null>(null);
  const [fulfillUrl, setFulfillUrl] = useState('');
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [savingFulfill, setSavingFulfill] = useState(false);

  // Message composer
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (!isAdmin && !project.clientUid) {
      bindClientUidToProject(project, user.uid);
    }
  }, [isAdmin, project, user.uid]);

  useEffect(() => {
    const emailLower = (user.email || '').toLowerCase();
    const milestonesPath = `projects/${project.id}/milestones`;
    const documentsPath = `projects/${project.id}/documents`;
    const messagesPath = `projects/${project.id}/messages`;

    const buildSubQuery = (subPath: string): Query<DocumentData> => {
      const colRef = collection(db, subPath);
      if (isAdmin) {
        return query(colRef);
      }
      return query(colRef, where('clientEmail', '==', emailLower));
    };

    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 3) setLoadingData(false);
    };

    const unsubMilestones = onSnapshot(
      buildSubQuery(milestonesPath),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectMilestone, 'id'>) }))
          .sort((a, b) => a.order - b.order);
        setMilestones(items);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, milestonesPath)
    );

    const unsubDocs = onSnapshot(
      buildSubQuery(documentsPath),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectDocument, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setDocuments(items);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, documentsPath)
    );

    const unsubMessages = onSnapshot(
      buildSubQuery(messagesPath),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectMessage, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return ta - tb;
          });
        setMessages(items);
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, messagesPath)
    );

    return () => {
      unsubMilestones();
      unsubDocs();
      unsubMessages();
    };
  }, [project.id, isAdmin, user.email]);

  const statusMeta = PROJECT_STATUS_META[project.status];
  const pendingDocsCount = documents.filter((d) => d.status === 'pendente_cliente').length;

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMilestone(true);
    setActionError(null);
    try {
      const nextOrder =
        milestones.length > 0 ? Math.max(...milestones.map((m) => m.order)) + 1 : 1;
      await createMilestone(project, {
        title: milestoneForm.title,
        description: milestoneForm.description,
        dueDate: milestoneForm.dueDate,
        status: milestoneForm.status,
        order: nextOrder,
      });
      setMilestoneForm({ title: '', description: '', dueDate: '', status: 'pendente' });
      setShowMilestoneForm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao criar etapa.');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleMilestoneStatus = async (milestoneId: string, status: MilestoneStatus) => {
    setActionError(null);
    try {
      await updateMilestoneStatus(project.id, milestoneId, status, milestones);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar etapa.');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    setActionError(null);
    try {
      await deleteMilestone(project.id, milestoneId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao excluir etapa.');
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoc(true);
    setActionError(null);
    try {
      await createProjectDocument(project, user, isAdmin, docForm);
      setDocForm({
        title: '',
        category: isAdmin ? 'planta' : 'documento_cliente',
        revision: 'Rev. 01',
        status: isAdmin ? 'disponivel' : 'enviado_cliente',
        fileUrl: '',
        notes: '',
      });
      setShowDocForm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao salvar documento.');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleFulfillSubmit = async (e: React.FormEvent, docId: string) => {
    e.preventDefault();
    setSavingFulfill(true);
    setActionError(null);
    try {
      await fulfillClientDocument(project.id, docId, {
        fileUrl: fulfillUrl,
        notes: fulfillNotes,
      });
      setFulfillingDocId(null);
      setFulfillUrl('');
      setFulfillNotes('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao enviar documento.');
    } finally {
      setSavingFulfill(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSendingMsg(true);
    setActionError(null);
    try {
      const senderLabel = isAdmin ? 'Eng. Kaio Henrique' : userName;
      await sendProjectMessage(project, user, isAdmin, senderLabel, messageText);
      setMessageText('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao enviar mensagem.');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    setActionError(null);
    try {
      await deleteProjectWithSubcollections(project.id);
      onProjectDeleted();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao excluir projeto.');
      setDeletingProject(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action / Back Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#aeb6af] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar para lista de projetos
        </button>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#323c34] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              Editar projeto
            </button>

            {!confirmDeleteProject ? (
              <button
                type="button"
                onClick={() => setConfirmDeleteProject(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-[#8f9991] hover:text-[#f09d78] whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Excluir
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 border border-[#6e3a2d] bg-[#241411] px-3 py-1.5">
                <span className="text-xs text-[#f09d78]">Confirmar exclusão?</span>
                <button
                  type="button"
                  disabled={deletingProject}
                  onClick={handleDeleteProject}
                  className="text-xs font-semibold text-white underline underline-offset-4 cursor-pointer"
                >
                  {deletingProject ? 'Excluindo...' : 'Sim, excluir'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProject(false)}
                  className="text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3.5 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
          {actionError}
        </div>
      )}

      {/* Project Technical Header */}
      <div className="border border-[#242a25] bg-[#121513] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#8f9991]">
              <span className="font-mono text-[#c5d1c0]">{project.code}</span>
              <span aria-hidden="true">·</span>
              <span>{SERVICE_TYPE_LABELS[project.serviceType]}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-medium ${statusMeta.textClass}`}>{statusMeta.label}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed]">
              {project.title}
            </h1>

            <p className="text-sm text-[#9aa49c]">
              {project.propertyAddress} · {project.city}
              {isAdmin && ` · Cliente: ${project.clientName} (${project.clientEmail})`}
            </p>
          </div>

          <div className="w-full lg:w-64 shrink-0 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-[#8f9991]">Avanço técnico</span>
              <span className="font-mono text-lg font-medium tabular-nums text-[#f0f1ed]">
                {project.progress}%
              </span>
            </div>
            <div className="h-2 bg-[#232a25] overflow-hidden">
              <div
                className="h-full bg-[#c0d0b8] transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <div className="text-[11px] text-[#858f87] font-mono tabular-nums">
              Previsão: {formatDateShortPtBr(project.estimatedDelivery)}
            </div>
          </div>
        </div>

        {/* Technical Metadata Grid */}
        <div className="pt-5 border-t border-[#202621] grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <div className="text-[11px] text-[#7f8981] mb-1">ART CREA-PR</div>
            <div className="text-sm font-mono tabular-nums text-[#e3e7e1]">
              {project.artNumber || 'Em emissão'}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#7f8981] mb-1">Protocolo Prefeitura</div>
            <div className="text-sm font-mono tabular-nums text-[#e3e7e1]">
              {project.protocolNumber || 'Não protocolado'}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#7f8981] mb-1">Área do imóvel</div>
            <div className="text-sm font-mono tabular-nums text-[#e3e7e1]">
              {project.areaSqm > 0 ? `${project.areaSqm.toLocaleString('pt-BR')} m²` : 'A levantar'}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#7f8981] mb-1">Responsável técnico</div>
            <div className="text-sm text-[#e3e7e1]">Eng. Kaio Henrique</div>
          </div>
        </div>

        {(project.summary || project.nextStep) && (
          <div className="pt-5 border-t border-[#202621] grid lg:grid-cols-2 gap-6">
            {project.summary && (
              <div>
                <div className="text-xs font-medium text-[#cbd2cb] mb-1.5">Escopo técnico</div>
                <p className="text-xs text-[#9aa49c] leading-relaxed whitespace-pre-line">
                  {project.summary}
                </p>
              </div>
            )}
            {project.nextStep && (
              <div>
                <div className="text-xs font-medium text-[#cbd2cb] mb-1.5">Próximo passo</div>
                <p className="text-xs text-[#c0d0b8] leading-relaxed">{project.nextStep}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-Navigation Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#121513] border border-[#242a25] w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab('milestones')}
          className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'milestones'
              ? 'bg-[#232b25] text-[#f0f1ed]'
              : 'text-[#8f9991] hover:text-[#e3e7e1]'
          }`}
        >
          Cronograma ({milestones.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('documents')}
          className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'documents'
              ? 'bg-[#232b25] text-[#f0f1ed]'
              : 'text-[#8f9991] hover:text-[#e3e7e1]'
          }`}
        >
          Documentos e Pranchas ({documents.length}
          {pendingDocsCount > 0 ? ` · ${pendingDocsCount} pend.` : ''})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('messages')}
          className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            subTab === 'messages'
              ? 'bg-[#232b25] text-[#f0f1ed]'
              : 'text-[#8f9991] hover:text-[#e3e7e1]'
          }`}
        >
          Acompanhamento ({messages.length})
        </button>
      </div>

      {/* TAB 1: CRONOGRAMA / MILESTONES */}
      {subTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-medium text-[#f0f1ed]">
              Etapas técnicas do projeto
            </h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowMilestoneForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#323c34] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Adicionar etapa
              </button>
            )}
          </div>

          {isAdmin && showMilestoneForm && (
            <form
              onSubmit={handleAddMilestone}
              className="border border-[#2e3830] bg-[#141916] p-5 space-y-4"
            >
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Nome da etapa *</label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.title}
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    placeholder="Ex.: Protocolo do projeto na Prefeitura"
                    className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Prazo estimado</label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#aeb6af] mb-1.5">Descrição da etapa</label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.milestoneDescription}
                  value={milestoneForm.description}
                  onChange={(e) =>
                    setMilestoneForm({ ...milestoneForm, description: e.target.value })
                  }
                  placeholder="Detalhe o que será entregue ou validado nesta fase."
                  className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="px-3 py-2 text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMilestone}
                  className="px-4 py-2 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white cursor-pointer"
                >
                  {savingMilestone ? 'Salvando...' : 'Salvar etapa'}
                </button>
              </div>
            </form>
          )}

          {loadingData ? (
            <div className="border border-[#242a25] bg-[#121513] p-6 text-xs text-[#8f9991]">
              Carregando cronograma...
            </div>
          ) : milestones.length === 0 ? (
            <div className="border border-[#242a25] bg-[#121513] p-8 text-center text-sm text-[#8f9991]">
              Nenhuma etapa cadastrada neste projeto ainda.
            </div>
          ) : (
            <div className="border border-[#242a25] bg-[#121513] divide-y divide-[#202621]">
              {milestones.map((m, idx) => {
                const mMeta = MILESTONE_STATUS_META[m.status];
                return (
                  <div
                    key={m.id}
                    className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 max-w-2xl">
                      <span className="font-mono text-xs tabular-nums text-[#7f8981] pt-0.5 w-6 shrink-0">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-sm font-medium text-[#f0f1ed]">{m.title}</span>
                          <span aria-hidden="true" className="text-[#566058]">
                            ·
                          </span>
                          <span className={`font-medium ${mMeta.textClass}`}>{mMeta.label}</span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-[#9aa49c] leading-relaxed">{m.description}</p>
                        )}
                        <div className="text-[11px] font-mono tabular-nums text-[#7f8981] pt-1">
                          {m.dueDate && `Previsão: ${formatDateShortPtBr(m.dueDate)}`}
                          {m.dueDate && m.completedDate && ' · '}
                          {m.completedDate && `Concluído em: ${formatDateShortPtBr(m.completedDate)}`}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-10 md:pl-0 shrink-0">
                        {(['pendente', 'em_andamento', 'concluido'] as MilestoneStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleMilestoneStatus(m.id, st)}
                              className={`px-2.5 py-1.5 text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                                m.status === st
                                  ? 'bg-[#232b25] border-[#4f5e52] text-[#f0f1ed]'
                                  : 'border-[#242a25] text-[#858f87] hover:text-[#e3e7e1]'
                              }`}
                            >
                              {MILESTONE_STATUS_META[st].label}
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(m.id)}
                          aria-label={`Excluir etapa ${m.title}`}
                          className="p-1.5 text-[#758077] hover:text-[#f09d78] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENTOS E PRANCHAS */}
      {subTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-lg font-medium text-[#f0f1ed]">
              Pranchas, ARTs e documentos do projeto
            </h2>
            {(isAdmin || project.status !== 'concluido') && (
              <button
                type="button"
                onClick={() => setShowDocForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#323c34] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
                {isAdmin ? 'Publicar ou solicitar documento' : 'Enviar documento'}
              </button>
            )}
          </div>

          {showDocForm && (
            <form
              onSubmit={handleAddDocument}
              className="border border-[#2e3830] bg-[#141916] p-5 space-y-4"
            >
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[#aeb6af] mb-1.5">
                    Título do documento *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.title}
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder={
                      isAdmin
                        ? 'Ex.: Planta baixa arquitetônica — Prancha 01'
                        : 'Ex.: Matrícula atualizada do imóvel'
                    }
                    className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Revisão / Versão</label>
                  <input
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.revision}
                    value={docForm.revision}
                    onChange={(e) => setDocForm({ ...docForm, revision: e.target.value })}
                    placeholder="Rev. 01"
                    className="w-full px-3 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#aeb6af] mb-1.5">Categoria</label>
                    <select
                      value={docForm.category}
                      onChange={(e) =>
                        setDocForm({ ...docForm, category: e.target.value as DocumentCategory })
                      }
                      className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                    >
                      {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {DOCUMENT_CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#aeb6af] mb-1.5">Situação</label>
                    <select
                      value={docForm.status}
                      onChange={(e) =>
                        setDocForm({ ...docForm, status: e.target.value as DocumentStatus })
                      }
                      className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                    >
                      {(Object.keys(DOCUMENT_STATUS_META) as DocumentStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {DOCUMENT_STATUS_META[st].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-[#aeb6af] mb-1.5">
                  Link do arquivo (Google Drive, PDF na nuvem — https://...)
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.fileUrl}
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#aeb6af] mb-1.5">Observações</label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.notes}
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="Instruções, detalhes da revisão ou referência do arquivo."
                  className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDocForm(false)}
                  className="px-3 py-2 text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="px-4 py-2 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white cursor-pointer"
                >
                  {savingDoc ? 'Salvando...' : 'Salvar documento'}
                </button>
              </div>
            </form>
          )}

          {loadingData ? (
            <div className="border border-[#242a25] bg-[#121513] p-6 text-xs text-[#8f9991]">
              Carregando documentos...
            </div>
          ) : documents.length === 0 ? (
            <div className="border border-[#242a25] bg-[#121513] p-8 text-center text-sm text-[#8f9991]">
              Nenhum documento publicado neste projeto ainda.
            </div>
          ) : (
            <div className="border border-[#242a25] bg-[#121513] divide-y divide-[#202621]">
              {documents.map((docItem) => {
                const docMeta = DOCUMENT_STATUS_META[docItem.status];
                const isFulfilling = fulfillingDocId === docItem.id;

                return (
                  <div key={docItem.id} className="p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#8f9991]">
                          <span className="text-[#cbd2cb]">
                            {DOCUMENT_CATEGORY_LABELS[docItem.category]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{docItem.revision}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-medium ${docMeta.textClass}`}>
                            {docMeta.label}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-[#f0f1ed]">{docItem.title}</div>
                        {docItem.notes && (
                          <p className="text-xs text-[#9aa49c] leading-relaxed">{docItem.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {docItem.fileUrl && (
                          <a
                            href={docItem.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap"
                          >
                            Visualizar
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        )}

                        {!isAdmin &&
                          docItem.status === 'pendente_cliente' &&
                          project.status !== 'concluido' && (
                            <button
                              type="button"
                              onClick={() => {
                                setFulfillingDocId(isFulfilling ? null : docItem.id);
                                setFulfillUrl(docItem.fileUrl || '');
                                setFulfillNotes(docItem.notes || '');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white whitespace-nowrap cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                              Enviar link
                            </button>
                          )}

                        {isAdmin && docItem.status !== 'aprovado' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateDocumentAsAdmin(project.id, docItem.id, { status: 'aprovado' })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-[#354c3a] text-xs text-[#98dba8] hover:border-[#6da87b] whitespace-nowrap cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            Aprovar
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => deleteProjectDocument(project.id, docItem.id)}
                            aria-label={`Excluir documento ${docItem.title}`}
                            className="p-1.5 text-[#758077] hover:text-[#f09d78] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isFulfilling && (
                      <form
                        onSubmit={(e) => handleFulfillSubmit(e, docItem.id)}
                        className="pt-4 border-t border-[#242a25] grid sm:grid-cols-2 gap-3"
                      >
                        <div>
                          <label className="block text-xs text-[#aeb6af] mb-1">
                            Link do documento (https://...)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={BLUEPRINT_LIMITS.fileUrl}
                            value={fulfillUrl}
                            onChange={(e) => setFulfillUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full px-3 py-2 text-xs bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#aeb6af] mb-1">Observação</label>
                          <input
                            type="text"
                            maxLength={BLUEPRINT_LIMITS.notes}
                            value={fulfillNotes}
                            onChange={(e) => setFulfillNotes(e.target.value)}
                            placeholder="Ex.: Matrícula atualizada emitida esta semana"
                            className="w-full px-3 py-2 text-xs bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setFulfillingDocId(null)}
                            className="px-3 py-1.5 text-xs text-[#aeb6af] hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={savingFulfill}
                            className="px-4 py-1.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white cursor-pointer"
                          >
                            {savingFulfill ? 'Enviando...' : 'Confirmar envio'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACOMPANHAMENTO / MESSAGES */}
      {subTab === 'messages' && (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-medium text-[#f0f1ed]">
            Diário técnico e mensagens
          </h2>

          <div className="border border-[#242a25] bg-[#121513]">
            <div className="divide-y divide-[#1f2520] max-h-[440px] overflow-y-auto">
              {loadingData ? (
                <div className="p-6 text-xs text-[#8f9991]">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#8f9991]">
                  Nenhuma atualização registrada ainda. Use o campo abaixo para enviar uma mensagem ao{' '}
                  {isAdmin ? 'cliente' : 'Eng. Kaio Henrique'}.
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-5 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#f0f1ed]">{msg.authorName}</span>
                        <span aria-hidden="true" className="text-[#566058]">
                          ·
                        </span>
                        <span
                          className={
                            msg.authorRole === 'engenheiro' ? 'text-[#b3c4ad]' : 'text-[#9aa49c]'
                          }
                        >
                          {msg.authorRole === 'engenheiro' ? 'KH Engenharia' : 'Cliente'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-[#7f8981]">
                        {formatTimestampPtBr(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[#cfd6ce] leading-relaxed whitespace-pre-line">
                      {msg.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-[#242a25] bg-[#0e100f] flex flex-col sm:flex-row gap-3"
            >
              <textarea
                rows={2}
                maxLength={BLUEPRINT_LIMITS.messageBody}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  isAdmin
                    ? 'Registre uma atualização técnica ou resposta para o cliente...'
                    : 'Escreva uma dúvida ou comentário sobre o andamento do projeto...'
                }
                className="flex-1 px-3 py-2 text-sm bg-[#121513] border border-[#2c342d] text-[#f0f1ed] resize-none"
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageText.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 sm:self-end cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                {sendingMsg ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
