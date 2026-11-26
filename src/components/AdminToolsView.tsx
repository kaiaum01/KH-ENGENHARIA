import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Download,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  MessageCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import type { ClientAccount, Project } from '../types/portal';
import type { ServiceContract } from '../types/contracts';
import { parseBrlNumber } from '../lib/contractBuilder';
import {
  buildWhatsAppLink,
  createEmptyVisitReport,
  exportInstallmentsCsv,
  exportLocalAdminBackupJson,
  formatCurrencyBr,
  formatIsoDateBr,
  importInstallmentsFromContracts,
  isInstallmentOverdue,
  loadLocalInstallments,
  loadLocalVisitReports,
  parseLocalAdminBackupJson,
  saveLocalInstallments,
  saveLocalVisitReports,
  todayIsoDate,
  type ChecklistStatus,
  type IssueSeverity,
  type LocalInstallment,
  type SiteVisitReportDraft,
} from '../lib/localAdminStore';
import {
  downloadSiteVisitReportDocx,
  preparePhotoForDocx,
  type VisitReportPhoto,
} from '../lib/visitReportDocxExport';

interface AdminToolsViewProps {
  contracts: ServiceContract[];
  projects: Project[];
  clients: ClientAccount[];
  onLocalFinanceChange?: (pendingCount: number) => void;
}

type ToolSubTab = 'finance' | 'visit_report' | 'delivery_pack';
type FinanceFilter = 'todas' | 'pendentes' | 'vencidas' | 'pagas';

const inputCls =
  'w-full bg-[#0d100e] border border-[#2c342e] px-3.5 py-2.5 text-sm text-[#f0f1ed] placeholder:text-[#667068] focus:outline-none focus:border-[#9baf91] transition-colors';
const labelCls = 'block text-xs font-medium text-[#b9c2ba] mb-1.5';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AdminToolsView({
  contracts,
  projects,
  clients,
  onLocalFinanceChange,
}: AdminToolsViewProps) {
  const [subTab, setSubTab] = useState<ToolSubTab>('finance');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // =========================================================================
  // 1. LOCAL FINANCE STATE
  // =========================================================================
  const [installments, setInstallments] = useState<LocalInstallment[]>(() => loadLocalInstallments());
  const [financeFilter, setFinanceFilter] = useState<FinanceFilter>('todas');
  const [financeSearch, setFinanceSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteFinId, setConfirmDeleteFinId] = useState<string | null>(null);

  // New manual installment fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState(todayIsoDate());
  const [newNotes, setNewNotes] = useState('');

  const backupInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveLocalInstallments(installments);
    const pendingCount = installments.filter((i) => i.status === 'pendente').length;
    onLocalFinanceChange?.(pendingCount);
  }, [installments, onLocalFinanceChange]);

  const financeStats = useMemo(() => {
    let received = 0;
    let pending = 0;
    let overdue = 0;
    let overdueCount = 0;
    for (const item of installments) {
      if (item.status === 'pago') {
        received += item.amount;
      } else {
        pending += item.amount;
        if (isInstallmentOverdue(item)) {
          overdue += item.amount;
          overdueCount += 1;
        }
      }
    }
    return {
      received,
      pending,
      overdue,
      overdueCount,
      total: received + pending,
    };
  }, [installments]);

  const filteredInstallments = useMemo(() => {
    const q = financeSearch.trim().toLowerCase();
    return installments
      .filter((item) => {
        if (financeFilter === 'pendentes' && item.status !== 'pendente') return false;
        if (financeFilter === 'pagas' && item.status !== 'pago') return false;
        if (financeFilter === 'vencidas' && !isInstallmentOverdue(item)) return false;
        if (!q) return true;
        return (
          item.clientName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.contractCode || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [installments, financeFilter, financeSearch]);

  const handleImportFromContracts = () => {
    setFeedback(null);
    if (contracts.length === 0) {
      setFeedback({
        type: 'err',
        text: 'Nenhum contrato cadastrado ainda na aba Contratos para importar.',
      });
      return;
    }
    const { next, addedCount } = importInstallmentsFromContracts(installments, contracts, clients);
    if (addedCount === 0) {
      setFeedback({
        type: 'ok',
        text: 'Todos os contratos com valores preenchidos já estão importados neste controle financeiro.',
      });
      return;
    }
    setInstallments(next);
    setFeedback({
      type: 'ok',
      text: `${addedCount} parcela(s) importada(s) dos seus contratos para o controle local.`,
    });
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const parsedAmount = parseBrlNumber(newAmount);
    if (!newClientName.trim() || !newDescription.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({
        type: 'err',
        text: 'Preencha cliente, descrição e um valor válido em reais (ex.: 1.500,00).',
      });
      return;
    }

    const created: LocalInstallment = {
      id: `fin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      clientName: newClientName.trim(),
      clientPhone: newClientPhone.trim(),
      description: newDescription.trim(),
      amount: parsedAmount,
      dueDate: newDueDate || todayIsoDate(),
      status: 'pendente',
      notes: newNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    setInstallments((prev) => [created, ...prev]);
    setNewClientName('');
    setNewClientPhone('');
    setNewDescription('');
    setNewAmount('');
    setNewNotes('');
    setShowAddForm(false);
    setFeedback({ type: 'ok', text: 'Lançamento adicionado ao controle financeiro local.' });
  };

  const handleTogglePaid = (id: string) => {
    setInstallments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus = item.status === 'pago' ? 'pendente' : 'pago';
        return {
          ...item,
          status: nextStatus,
          paidAt: nextStatus === 'pago' ? todayIsoDate() : undefined,
        };
      })
    );
  };

  const handleDeleteInstallment = (id: string) => {
    setInstallments((prev) => prev.filter((item) => item.id !== id));
    setConfirmDeleteFinId(null);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    try {
      const text = await file.text();
      const restored = parseLocalAdminBackupJson(text);
      setInstallments(restored.installments);
      setSavedReports(restored.visitReports);
      saveLocalVisitReports(restored.visitReports);
      setFeedback({
        type: 'ok',
        text: `Backup restaurado: ${restored.installments.length} lançamento(s) e ${restored.visitReports.length} rascunho(s) de visita.`,
      });
    } catch {
      setFeedback({
        type: 'err',
        text: 'Arquivo de backup inválido. Selecione um arquivo .json exportado por este painel.',
      });
    } finally {
      e.target.value = '';
    }
  };

  // =========================================================================
  // 2. SITE VISIT REPORT (WORD .DOCX + LOCAL PHOTOS)
  // =========================================================================
  const [savedReports, setSavedReports] = useState<SiteVisitReportDraft[]>(() =>
    loadLocalVisitReports()
  );
  const [visitDraft, setVisitDraft] = useState<SiteVisitReportDraft>(() =>
    createEmptyVisitReport(loadLocalVisitReports().length)
  );
  const [visitPhotos, setVisitPhotos] = useState<VisitReportPhoto[]>([]);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);

  // Revoke object URLs on unmount
  const photosRef = useRef<VisitReportPhoto[]>([]);
  photosRef.current = visitPhotos;
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const handleSelectProjectForVisit = (pid: string) => {
    const found = projects.find((p) => p.id === pid);
    if (!found) {
      setVisitDraft((prev) => ({ ...prev, projectId: '' }));
      return;
    }
    setVisitDraft((prev) => ({
      ...prev,
      projectId: found.id,
      projectCode: found.code,
      projectTitle: found.title,
      clientName: found.clientName,
      propertyAddress: found.propertyAddress,
      city: found.city || 'Umuarama - PR',
      progressPercent: found.progress,
    }));
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setProcessingPhotos(true);
    setFeedback(null);
    try {
      const prepared: VisitReportPhoto[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const photo = await preparePhotoForDocx(file);
        prepared.push(photo);
      }
      setVisitPhotos((prev) => [...prev, ...prepared]);
      if (prepared.length > 0) {
        setFeedback({
          type: 'ok',
          text: `${prepared.length} foto(s) preparada(s) localmente para o relatório em Word.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao processar uma das imagens.',
      });
    } finally {
      setProcessingPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setVisitPhotos((prev) => {
      const target = prev.find((p) => p.id === photoId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== photoId);
    });
  };

  const handleSaveVisitDraft = () => {
    const stamped: SiteVisitReportDraft = {
      ...visitDraft,
      updatedAt: new Date().toISOString(),
    };
    const next = [stamped, ...savedReports.filter((r) => r.id !== stamped.id)].slice(0, 30);
    setSavedReports(next);
    saveLocalVisitReports(next);
    setFeedback({
      type: 'ok',
      text: `Rascunho ${stamped.reportNumber} salvo localmente neste computador.`,
    });
  };

  const handleGenerateVisitDocx = async () => {
    setGeneratingDocx(true);
    setFeedback(null);
    try {
      await downloadSiteVisitReportDocx(visitDraft, visitPhotos);
      handleSaveVisitDraft();
      setFeedback({
        type: 'ok',
        text: `Relatório ${visitDraft.reportNumber}.docx baixado com ${visitPhotos.length} foto(s) incorporada(s).`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Não foi possível gerar o arquivo Word.',
      });
    } finally {
      setGeneratingDocx(false);
    }
  };

  const handleDeleteSavedReport = (id: string) => {
    const next = savedReports.filter((r) => r.id !== id);
    setSavedReports(next);
    saveLocalVisitReports(next);
  };

  // =========================================================================
  // 3. LOCAL DELIVERY PACK CHECKLIST (ZERO CLOUD UPLOAD)
  // =========================================================================
  const [packProjectId, setPackProjectId] = useState('');
  const [packClientName, setPackClientName] = useState('');
  const [packClientPhone, setPackClientPhone] = useState('');
  const [packNote, setPackNote] = useState('');
  const [packFiles, setPackFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [copiedPack, setCopiedPack] = useState(false);

  const handleSelectProjectForPack = (pid: string) => {
    setPackProjectId(pid);
    const proj = projects.find((p) => p.id === pid);
    if (!proj) return;
    setPackClientName(proj.clientName);
    const matchedClient = clients.find(
      (c) =>
        (proj.clientUid && c.uid === proj.clientUid) ||
        c.email.toLowerCase() === proj.clientEmail.toLowerCase()
    );
    setPackClientPhone(matchedClient?.phone || '');
  };

  const deliveryMessage = useMemo(() => {
    const proj = projects.find((p) => p.id === packProjectId);
    const lines: string[] = [
      `Olá ${packClientName.trim() || 'cliente'}, tudo bem?`,
      `Segue a relação de arquivos técnicos da KH Engenharia${proj ? ` (${proj.code} — ${proj.title})` : ''}:`,
    ];
    if (packFiles.length > 0) {
      lines.push('');
      packFiles.forEach((f, idx) => {
        lines.push(`${idx + 1}. ${f.name} (${formatFileSize(f.size)})`);
      });
    }
    if (packNote.trim()) {
      lines.push('', `Observações técnicas: ${packNote.trim()}`);
    }
    lines.push(
      '',
      'Qualquer dúvida técnica, estou à disposição.',
      'Eng. Civil Kaio Henrique da Silva · CREA-PR PR-232385/D'
    );
    return lines.join('\n');
  }, [packClientName, packFiles, packNote, packProjectId, projects]);

  const handleCopyDeliveryMessage = async () => {
    try {
      await navigator.clipboard.writeText(deliveryMessage);
      setCopiedPack(true);
      setTimeout(() => setCopiedPack(false), 1800);
    } catch {
      setFeedback({ type: 'err', text: 'Não foi possível copiar automaticamente.' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-[#232924] pb-6">
        <div>
          <div className="kh-eyebrow">Produtividade do engenheiro · Armazenamento local</div>
          <h1 className="font-display text-3xl sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#f0f1ed] mt-3">
            Gestão local <span className="text-[#c0d0b8]">&amp; Relatórios.</span>
          </h1>
          <p className="text-sm text-[#9aa49c] mt-3 max-w-2xl">
            Controle de parcelas, geração de relatórios fotográficos de visita de obra em Word (.docx)
            e checklist de entrega — funcionando diretamente neste computador sem exigir Firebase Storage
            ou alterações no banco de dados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={exportLocalAdminBackupJson}
            className="inline-flex items-center gap-2 border border-[#3d483f] px-3.5 py-2.5 text-xs font-semibold text-[#d8ddd6] hover:border-[#9baf91] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Backup local (.json)
          </button>
          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            className="inline-flex items-center gap-2 border border-[#3d483f] px-3.5 py-2.5 text-xs font-semibold text-[#c5cdc6] hover:border-[#9baf91] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Restaurar backup
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleRestoreBackup}
            className="hidden"
          />
        </div>
      </div>

      {/* Subtle Local Storage Notice */}
      <div className="border border-[#2b342d] bg-[#101411] px-4 py-3 flex items-start gap-3 text-xs text-[#a5b0a7]">
        <HardDrive className="w-4 h-4 text-[#a8baa4] shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong className="text-[#e3e7e1]">Modo local (sem custo extra no Firebase):</strong> os
          lançamentos financeiros e rascunhos de visita ficam salvos neste navegador. Use{' '}
          <strong className="text-[#e3e7e1]">Backup local (.json)</strong> se quiser transferir seus
          registros para outro computador.
        </span>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#232924] pb-3">
        {[
          { id: 'finance' as const, label: '01. Financeiro de Parcelas' },
          { id: 'visit_report' as const, label: '02. Relatório de Visita de Obra (.docx + Fotos)' },
          { id: 'delivery_pack' as const, label: '03. Checklist de Entrega Local' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSubTab(tab.id);
              setFeedback(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
              subTab === tab.id
                ? 'bg-[#1b231d] border-[#9baf91] text-[#f0f1ed]'
                : 'bg-[#0e110f] border-[#262d28] text-[#9aa49c] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-4 border text-sm ${
            feedback.type === 'ok'
              ? 'border-[#3a5c42] bg-[#132017] text-[#a7dfb5]'
              : 'border-[#6d3b2c] bg-[#21130f] text-[#f4b096]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: FINANCEIRO DE PARCELAS                                       */}
      {/* =================================================================== */}
      {subTab === 'finance' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#262d28] bg-[#121613] p-5">
              <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
                Recebido
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#86d69d] mt-2 tabular-nums">
                {formatCurrencyBr(financeStats.received)}
              </div>
            </div>
            <div className="border border-[#262d28] bg-[#121613] p-5">
              <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
                A receber
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#f0f1ed] mt-2 tabular-nums">
                {formatCurrencyBr(financeStats.pending)}
              </div>
            </div>
            <div className="border border-[#262d28] bg-[#121613] p-5">
              <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
                Em atraso ({financeStats.overdueCount})
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#f09d78] mt-2 tabular-nums">
                {formatCurrencyBr(financeStats.overdue)}
              </div>
            </div>
            <div className="border border-[#262d28] bg-[#121613] p-5">
              <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
                Total previsto
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#c0d0b8] mt-2 tabular-nums">
                {formatCurrencyBr(financeStats.total)}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleImportFromContracts}
                className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-4 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Importar parcelas dos contratos ({contracts.length})
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="inline-flex items-center gap-2 border border-[#465246] px-4 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddForm ? 'Fechar formulário' : 'Nova parcela manual'}
              </button>
              {installments.length > 0 && (
                <button
                  type="button"
                  onClick={() => exportInstallmentsCsv(installments)}
                  className="inline-flex items-center gap-2 border border-[#3d483f] px-3.5 py-2.5 text-xs font-semibold text-[#c5cdc6] hover:border-[#9baf91] transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Excel (.csv)
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['todas', 'pendentes', 'vencidas', 'pagas'] as FinanceFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFinanceFilter(f)}
                  className={`px-3 py-1.5 text-xs border capitalize cursor-pointer ${
                    financeFilter === f
                      ? 'bg-[#1b231d] border-[#9baf91] text-[#f0f1ed] font-semibold'
                      : 'bg-[#0e110f] border-[#262d28] text-[#8f9991] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Add Manual Installment Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddInstallment}
              className="border border-[#303a32] bg-[#121613] p-5 space-y-4"
            >
              <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                Novo lançamento financeiro local
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Cliente *</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nome do cliente ou empresa"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp do cliente (opcional)</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="(44) 99999-9999"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Vencimento *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Descrição da parcela / serviço *</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Ex.: 1ª Parcela — Regularização residencial"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Valor (R$) *</label>
                  <input
                    type="text"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Ex.: 1.800,00"
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={labelCls}>Observações (opcional)</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ex.: Chave PIX enviada, pagamento na entrega da planta"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-[#3a443c] text-xs font-semibold text-[#c5cdc6] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-2 text-xs font-bold hover:bg-white cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar lançamento
                </button>
              </div>
            </form>
          )}

          {/* Search */}
          <input
            type="text"
            value={financeSearch}
            onChange={(e) => setFinanceSearch(e.target.value)}
            placeholder="Buscar parcela por cliente, descrição ou código de contrato..."
            className={inputCls}
          />

          {/* Installments List */}
          {filteredInstallments.length === 0 ? (
            <div className="p-10 border border-[#232924] bg-[#101411] text-center space-y-3">
              <div className="text-base font-semibold text-[#e3e7e1]">
                Nenhuma parcela cadastrada neste filtro
              </div>
              <p className="text-sm text-[#8f9991] max-w-lg mx-auto">
                Clique em &ldquo;Importar parcelas dos contratos&rdquo; para puxar automaticamente os
                valores já preenchidos nos seus contratos, ou adicione um lançamento manual.
              </p>
            </div>
          ) : (
            <div className="border border-[#262d28] bg-[#121613] divide-y divide-[#232924]">
              {filteredInstallments.map((item) => {
                const overdue = isInstallmentOverdue(item);
                const reminderMsg = [
                  `Olá ${item.clientName}, tudo bem?`,
                  `Passando para lembrar sobre a parcela da KH Engenharia: ${item.description}, no valor de ${formatCurrencyBr(item.amount)}, com vencimento em ${formatIsoDateBr(item.dueDate)}.`,
                  'Qualquer dúvida, fico à disposição!',
                ].join('\n');
                const waUrl = buildWhatsAppLink(item.clientPhone, reminderMsg);

                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#151a16] transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                        <span
                          className={
                            item.status === 'pago'
                              ? 'text-[#86d69d] font-semibold'
                              : overdue
                                ? 'text-[#f09d78] font-semibold'
                                : 'text-[#e8c67a] font-semibold'
                          }
                        >
                          {item.status === 'pago'
                            ? `PAGO (${formatIsoDateBr(item.paidAt || '')})`
                            : overdue
                              ? 'VENCIDA'
                              : 'PENDENTE'}
                        </span>
                        <span className="text-[#4a544c]">/</span>
                        <span className="text-[#9aa49c]">
                          Venc.: {formatIsoDateBr(item.dueDate)}
                        </span>
                        {item.contractCode && (
                          <>
                            <span className="text-[#4a544c]">/</span>
                            <span className="text-[#c0d0b8]">{item.contractCode}</span>
                          </>
                        )}
                      </div>
                      <div className="text-base font-semibold text-[#f0f1ed] truncate">
                        {item.clientName} — {formatCurrencyBr(item.amount)}
                      </div>
                      <div className="text-xs text-[#9aa49c]">{item.description}</div>
                      {item.notes && <div className="text-[11px] text-[#7c877f]">{item.notes}</div>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePaid(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                          item.status === 'pago'
                            ? 'border border-[#3d483f] text-[#c5cdc6] hover:border-[#9baf91]'
                            : 'bg-[#d8ddd6] text-[#141815] hover:bg-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status === 'pago' ? 'Reabrir' : 'Marcar como pago'}
                      </button>

                      {item.status === 'pendente' && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 border border-[#3d483f] px-3 py-2 text-xs font-semibold text-[#c0d0b8] hover:border-[#9baf91] hover:text-white transition-colors"
                          title="Enviar lembrete amigável no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Lembrete
                        </a>
                      )}

                      {confirmDeleteFinId === item.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteInstallment(item.id)}
                            className="px-2.5 py-2 bg-[#7f2d21] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteFinId(null)}
                            className="px-2 py-2 border border-[#3c473e] text-xs text-[#9aa49c] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFinId(item.id)}
                          className="p-2 border border-[#323a34] text-[#8f9991] hover:text-[#f09d78] hover:border-[#6d3b2c] transition-colors cursor-pointer"
                          aria-label="Excluir lançamento"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: RELATÓRIO FOTOGRÁFICO DE VISITA DE OBRA (.DOCX)              */}
      {/* =================================================================== */}
      {subTab === 'visit_report' && (
        <div className="space-y-6">
          {/* Saved Drafts Bar */}
          {savedReports.length > 0 && (
            <div className="border border-[#262d28] bg-[#101411] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono uppercase tracking-[1px] text-[#a8baa4]">
                  Rascunhos salvos localmente ({savedReports.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVisitDraft(createEmptyVisitReport(savedReports.length));
                    setVisitPhotos([]);
                  }}
                  className="text-xs text-[#c0d0b8] hover:text-white underline cursor-pointer"
                >
                  + Novo relatório em branco
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedReports.map((rep) => (
                  <div
                    key={rep.id}
                    className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs ${
                      visitDraft.id === rep.id
                        ? 'border-[#9baf91] bg-[#1a221c] text-[#f0f1ed]'
                        : 'border-[#2c342e] bg-[#121613] text-[#aeb7af]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setVisitDraft(rep)}
                      className="cursor-pointer hover:text-white text-left"
                    >
                      {rep.reportNumber} · {rep.clientName || rep.projectTitle || 'Sem título'} (
                      {formatIsoDateBr(rep.visitDate)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedReport(rep.id)}
                      className="text-[#7c877f] hover:text-[#f09d78] cursor-pointer"
                      aria-label={`Remover rascunho ${rep.reportNumber}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Visit Form */}
          <div className="border border-[#262d28] bg-[#121613] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#232924] pb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                  Relatório Técnico e Fotográfico de Visita de Obra
                </div>
                <p className="text-xs text-[#8f9991] mt-1">
                  As fotos selecionadas do seu computador são incorporadas diretamente no Word (.docx)
                  sem subir nada para a nuvem.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveVisitDraft}
                  className="inline-flex items-center gap-2 border border-[#465246] px-4 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar rascunho
                </button>
                <button
                  type="button"
                  disabled={generatingDocx}
                  onClick={handleGenerateVisitDocx}
                  className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  {generatingDocx ? 'Gerando Word...' : 'Baixar Relatório Word (.docx)'}
                </button>
              </div>
            </div>

            {/* Identification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className={labelCls}>Preencher a partir de um projeto cadastrado (opcional)</label>
                <select
                  value={visitDraft.projectId || ''}
                  onChange={(e) => handleSelectProjectForVisit(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Preencher obra manualmente...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title} ({p.clientName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Número do relatório</label>
                <input
                  type="text"
                  value={visitDraft.reportNumber}
                  onChange={(e) =>
                    setVisitDraft({ ...visitDraft, reportNumber: e.target.value.toUpperCase() })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Nome da obra / empreendimento</label>
                <input
                  type="text"
                  value={visitDraft.projectTitle}
                  onChange={(e) => setVisitDraft({ ...visitDraft, projectTitle: e.target.value })}
                  placeholder="Ex.: Residência Unifamiliar — Zona III"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Cliente / Contratante</label>
                <input
                  type="text"
                  value={visitDraft.clientName}
                  onChange={(e) => setVisitDraft({ ...visitDraft, clientName: e.target.value })}
                  placeholder="Nome do proprietário"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Data da visita</label>
                <input
                  type="date"
                  value={visitDraft.visitDate}
                  onChange={(e) => setVisitDraft({ ...visitDraft, visitDate: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Endereço da obra</label>
                <input
                  type="text"
                  value={visitDraft.propertyAddress}
                  onChange={(e) =>
                    setVisitDraft({ ...visitDraft, propertyAddress: e.target.value })
                  }
                  placeholder="Rua, nº, bairro"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Cidade / UF</label>
                <input
                  type="text"
                  value={visitDraft.city}
                  onChange={(e) => setVisitDraft({ ...visitDraft, city: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Etapa atual da obra</label>
                <input
                  type="text"
                  value={visitDraft.stage}
                  onChange={(e) => setVisitDraft({ ...visitDraft, stage: e.target.value })}
                  placeholder="Ex.: Fundação, Alvenaria, Reboco..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Condições climáticas</label>
                <input
                  type="text"
                  value={visitDraft.weather}
                  onChange={(e) => setVisitDraft({ ...visitDraft, weather: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Avanço físico estimado (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={visitDraft.progressPercent}
                  onChange={(e) =>
                    setVisitDraft({
                      ...visitDraft,
                      progressPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    })
                  }
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Equipe presente em campo</label>
                <input
                  type="text"
                  value={visitDraft.teamOnSite}
                  onChange={(e) => setVisitDraft({ ...visitDraft, teamOnSite: e.target.value })}
                  placeholder="Ex.: 1 mestre de obras, 2 pedreiros, 2 serventes"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Previsão da próxima visita</label>
                <input
                  type="date"
                  value={visitDraft.nextVisitDate}
                  onChange={(e) =>
                    setVisitDraft({ ...visitDraft, nextVisitDate: e.target.value })
                  }
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelCls}>Resumo técnico da vistoria</label>
                <textarea
                  rows={3}
                  value={visitDraft.summary}
                  onChange={(e) => setVisitDraft({ ...visitDraft, summary: e.target.value })}
                  placeholder="Descreva os serviços em execução, conferências realizadas e evolução observada no canteiro..."
                  className={inputCls}
                />
              </div>
            </div>

            {/* Technical Checklist */}
            <div className="space-y-3 border-t border-[#232924] pt-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                  Checklist técnico de campo
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setVisitDraft((prev) => ({
                      ...prev,
                      checklist: [
                        ...prev.checklist,
                        {
                          id: `chk-${Date.now().toString(36)}`,
                          item: '',
                          status: 'conforme',
                          note: '',
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#c0d0b8] hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar item
                </button>
              </div>
              <div className="space-y-2">
                {visitDraft.checklist.map((chk, idx) => (
                  <div key={chk.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={chk.item}
                      onChange={(e) => {
                        const next = [...visitDraft.checklist];
                        next[idx] = { ...chk, item: e.target.value };
                        setVisitDraft({ ...visitDraft, checklist: next });
                      }}
                      placeholder="Item verificado"
                      className={`md:col-span-5 ${inputCls}`}
                    />
                    <select
                      value={chk.status}
                      onChange={(e) => {
                        const next = [...visitDraft.checklist];
                        next[idx] = { ...chk, status: e.target.value as ChecklistStatus };
                        setVisitDraft({ ...visitDraft, checklist: next });
                      }}
                      className={`md:col-span-3 ${inputCls}`}
                    >
                      <option value="conforme">Conforme</option>
                      <option value="pendente">Pendente / Atenção</option>
                      <option value="nao_aplicavel">Não aplicável</option>
                    </select>
                    <input
                      type="text"
                      value={chk.note}
                      onChange={(e) => {
                        const next = [...visitDraft.checklist];
                        next[idx] = { ...chk, note: e.target.value };
                        setVisitDraft({ ...visitDraft, checklist: next });
                      }}
                      placeholder="Observação"
                      className={`md:col-span-3 ${inputCls}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVisitDraft({
                          ...visitDraft,
                          checklist: visitDraft.checklist.filter((c) => c.id !== chk.id),
                        })
                      }
                      className="md:col-span-1 p-2.5 border border-[#323a34] text-[#8f9991] hover:text-[#f09d78] justify-self-end cursor-pointer"
                      aria-label="Remover item do checklist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Conformities */}
            <div className="space-y-3 border-t border-[#232924] pt-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                  Não conformidades / pendências corretivas
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setVisitDraft((prev) => ({
                      ...prev,
                      nonConformities: [
                        ...prev.nonConformities,
                        {
                          id: `nc-${Date.now().toString(36)}`,
                          location: '',
                          description: '',
                          severity: 'media',
                          action: '',
                        },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#c0d0b8] hover:text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar pendência
                </button>
              </div>
              {visitDraft.nonConformities.length === 0 ? (
                <p className="text-xs text-[#7c877f]">
                  Nenhuma pendência registrada. Clique em &ldquo;Registrar pendência&rdquo; se
                  encontrou algum ajuste necessário em campo.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {visitDraft.nonConformities.map((nc, idx) => (
                    <div key={nc.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={nc.location}
                        onChange={(e) => {
                          const next = [...visitDraft.nonConformities];
                          next[idx] = { ...nc, location: e.target.value };
                          setVisitDraft({ ...visitDraft, nonConformities: next });
                        }}
                        placeholder="Local (ex.: Viga V4)"
                        className={`md:col-span-2 ${inputCls}`}
                      />
                      <input
                        type="text"
                        value={nc.description}
                        onChange={(e) => {
                          const next = [...visitDraft.nonConformities];
                          next[idx] = { ...nc, description: e.target.value };
                          setVisitDraft({ ...visitDraft, nonConformities: next });
                        }}
                        placeholder="Descrição da pendência"
                        className={`md:col-span-4 ${inputCls}`}
                      />
                      <select
                        value={nc.severity}
                        onChange={(e) => {
                          const next = [...visitDraft.nonConformities];
                          next[idx] = { ...nc, severity: e.target.value as IssueSeverity };
                          setVisitDraft({ ...visitDraft, nonConformities: next });
                        }}
                        className={`md:col-span-2 ${inputCls}`}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                      <input
                        type="text"
                        value={nc.action}
                        onChange={(e) => {
                          const next = [...visitDraft.nonConformities];
                          next[idx] = { ...nc, action: e.target.value };
                          setVisitDraft({ ...visitDraft, nonConformities: next });
                        }}
                        placeholder="Ação corretiva recomendada"
                        className={`md:col-span-3 ${inputCls}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisitDraft({
                            ...visitDraft,
                            nonConformities: visitDraft.nonConformities.filter(
                              (item) => item.id !== nc.id
                            ),
                          })
                        }
                        className="md:col-span-1 p-2.5 border border-[#323a34] text-[#8f9991] hover:text-[#f09d78] justify-self-end cursor-pointer"
                        aria-label="Remover pendência"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Local Photos Uploader */}
            <div className="space-y-3 border-t border-[#232924] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                    Registro fotográfico ({visitPhotos.length} foto{visitPhotos.length === 1 ? '' : 's'})
                  </div>
                  <p className="text-xs text-[#8f9991] mt-0.5">
                    As fotos são otimizadas automaticamente no navegador e inseridas no Word (.docx).
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 border border-[#465246] bg-[#161c17] px-4 py-2 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  {processingPhotos ? 'Processando fotos...' : 'Selecionar fotos do computador'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddPhotos}
                    className="hidden"
                  />
                </label>
              </div>

              {visitPhotos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visitPhotos.map((photo, index) => (
                    <div key={photo.id} className="border border-[#2c342e] bg-[#0e110f] p-3 space-y-2.5">
                      <div className="relative aspect-[4/3] bg-[#090b0a] overflow-hidden border border-[#232924]">
                        <img
                          src={photo.previewUrl}
                          alt={photo.caption || photo.fileName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 text-[10px] font-mono text-[#d8ddd6]">
                          FOTO {String(index + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="absolute top-2 right-2 bg-black/75 p-1.5 text-[#f0f1ed] hover:text-[#f09d78] cursor-pointer"
                          aria-label="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(e) =>
                          setVisitPhotos((prev) =>
                            prev.map((p) =>
                              p.id === photo.id ? { ...p, caption: e.target.value } : p
                            )
                          )
                        }
                        placeholder="Legenda da foto no relatório..."
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="border-t border-[#232924] pt-5">
              <label className={labelCls}>Recomendações técnicas finais</label>
              <textarea
                rows={3}
                value={visitDraft.recommendations}
                onChange={(e) => setVisitDraft({ ...visitDraft, recommendations: e.target.value })}
                placeholder="Orientações para a equipe de execução até a próxima vistoria..."
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: CHECKLIST DE ENTREGA LOCAL (SEM STORAGE)                     */}
      {/* =================================================================== */}
      {subTab === 'delivery_pack' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-[#262d28] bg-[#121613] p-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
              Montar relação de arquivos entregues (local)
            </div>
            <p className="text-xs text-[#8f9991]">
              Selecione no seu computador as pranchas PDF, DWG, memoriais ou ARTs que você está
              entregando. Nenhum arquivo é enviado para a nuvem — o sistema apenas lista os nomes e
              gera a mensagem técnica pronta para WhatsApp ou e-mail.
            </p>

            <div>
              <label className={labelCls}>Projeto (opcional)</label>
              <select
                value={packProjectId}
                onChange={(e) => handleSelectProjectForPack(e.target.value)}
                className={inputCls}
              >
                <option value="">Selecionar projeto...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title} ({p.clientName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nome do cliente</label>
                <input
                  type="text"
                  value={packClientName}
                  onChange={(e) => setPackClientName(e.target.value)}
                  placeholder="Nome do destinatário"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>WhatsApp do cliente</label>
                <input
                  type="text"
                  value={packClientPhone}
                  onChange={(e) => setPackClientPhone(e.target.value)}
                  placeholder="(44) 99999-9999"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Selecionar arquivos da pasta do computador</label>
              <label className="flex items-center justify-center gap-2 border border-dashed border-[#465246] bg-[#0d100e] px-4 py-5 text-xs text-[#c0d0b8] hover:border-[#9baf91] cursor-pointer">
                <FolderOpen className="w-4 h-4" />
                Escolher arquivos (PDF, DWG, DOCX, imagens...)
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const list = Array.from(e.target.files || []).map((f) => ({
                      name: f.name,
                      size: f.size,
                    }));
                    setPackFiles((prev) => [...prev, ...list]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {packFiles.length > 0 && (
              <div className="border border-[#262d28] divide-y divide-[#202621]">
                {packFiles.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="truncate text-[#e3e7e1]">{f.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[11px] text-[#8f9991]">
                        {formatFileSize(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPackFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-[#8f9991] hover:text-[#f09d78] cursor-pointer"
                        aria-label={`Remover ${f.name}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className={labelCls}>Observações da entrega (opcional)</label>
              <textarea
                rows={3}
                value={packNote}
                onChange={(e) => setPackNote(e.target.value)}
                placeholder="Ex.: Pranchas revisadas na versão R02 prontas para protocolo na prefeitura."
                className={inputCls}
              />
            </div>
          </div>

          <div className="border border-[#262d28] bg-[#101411] p-6 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                Prévia da mensagem de entrega técnica
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#d8ddd6] bg-[#0b0e0c] border border-[#262d28] p-4">
                {deliveryMessage}
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyDeliveryMessage}
                className="inline-flex items-center gap-2 border border-[#465246] px-4 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] cursor-pointer"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                {copiedPack ? 'Copiado!' : 'Copiar texto'}
              </button>
              <a
                href={buildWhatsAppLink(packClientPhone, deliveryMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-2.5 text-xs font-bold hover:bg-white transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Enviar resumo no WhatsApp ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
