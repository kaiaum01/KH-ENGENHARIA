import type { ClientAccount } from '../types/portal';
import type { ServiceContract } from '../types/contracts';
import { CONTRACT_MODEL_SHORT } from '../types/contracts';
import { parseBrlNumber } from './contractBuilder';

export type InstallmentStatus = 'pendente' | 'pago';

export interface LocalInstallment {
  id: string;
  contractId?: string;
  contractCode?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: InstallmentStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export type ChecklistStatus = 'conforme' | 'pendente' | 'nao_aplicavel';
export type IssueSeverity = 'baixa' | 'media' | 'alta';

export interface VisitChecklistItem {
  id: string;
  item: string;
  status: ChecklistStatus;
  note: string;
}

export interface VisitNonConformity {
  id: string;
  location: string;
  description: string;
  severity: IssueSeverity;
  action: string;
}

export interface SiteVisitReportDraft {
  id: string;
  reportNumber: string;
  projectId?: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  propertyAddress: string;
  city: string;
  visitDate: string; // YYYY-MM-DD
  stage: string;
  weather: string;
  teamOnSite: string;
  progressPercent: number;
  summary: string;
  checklist: VisitChecklistItem[];
  nonConformities: VisitNonConformity[];
  recommendations: string;
  nextVisitDate: string;
  updatedAt: string;
}

const FINANCE_KEY = 'kh_admin_finance_v1';
const VISIT_REPORTS_KEY = 'kh_admin_visit_reports_v1';

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIsoDate(baseIso: string, days: number): string {
  const dt = new Date(`${baseIso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return todayIsoDate();
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoDateBr(iso: string): string {
  if (!iso) return '—';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatCurrencyBr(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function isInstallmentOverdue(item: LocalInstallment): boolean {
  if (item.status === 'pago' || !item.dueDate) return false;
  return item.dueDate < todayIsoDate();
}

export function normalizeBrazilianWhatsAppPhone(raw?: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: string | undefined, message: string): string {
  const normalized = normalizeBrazilianWhatsAppPhone(phone);
  const encoded = encodeURIComponent(message);
  return normalized
    ? `https://wa.me/${normalized}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export function loadLocalInstallments(): LocalInstallment[] {
  try {
    const raw = window.localStorage.getItem(FINANCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalInstallment[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalInstallments(items: LocalInstallment[]): void {
  try {
    window.localStorage.setItem(FINANCE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors silently
  }
}

export function importInstallmentsFromContracts(
  existing: LocalInstallment[],
  contracts: ServiceContract[],
  clients: ClientAccount[]
): { next: LocalInstallment[]; addedCount: number } {
  const next = [...existing];
  let addedCount = 0;
  const today = todayIsoDate();

  for (const contract of contracts) {
    const alreadyImported = next.some(
      (item) => item.contractId === contract.id || item.contractCode === contract.contractCode
    );
    if (alreadyImported) continue;

    const matchedClient = clients.find(
      (c) =>
        (contract.clientUid && c.uid === contract.clientUid) ||
        c.email.toLowerCase() === contract.clientEmail.toLowerCase()
    );
    const phone = matchedClient?.phone || '';
    const modelLabel = CONTRACT_MODEL_SHORT[contract.serviceType];

    if (contract.serviceType === 'acompanhamento') {
      const monthly = parseBrlNumber(contract.termsData.monthlyFee || contract.termsData.totalValue);
      if (Number.isFinite(monthly) && monthly > 0) {
        next.unshift({
          id: createLocalId('fin'),
          contractId: contract.id,
          contractCode: contract.contractCode,
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          clientPhone: phone,
          description: `Mensalidade 01 — ${modelLabel} (${contract.contractCode})`,
          amount: monthly,
          dueDate: addDaysIsoDate(today, 15),
          status: 'pendente',
          notes: `Vencimento contratual dia ${contract.termsData.monthlyDueDay || '10'}`,
          createdAt: new Date().toISOString(),
        });
        addedCount += 1;
      }
      continue;
    }

    const entries: Array<{ label: string; rawValue: string; offsetDays: number }> = [
      { label: '1ª Parcela (Entrada)', rawValue: contract.termsData.installment1Value, offsetDays: 5 },
      { label: '2ª Parcela (Intermediária)', rawValue: contract.termsData.installment2Value, offsetDays: 30 },
      { label: '3ª Parcela (Entrega final)', rawValue: contract.termsData.installment3Value, offsetDays: 60 },
    ];

    let createdAnyForContract = false;
    for (const entry of entries) {
      const amount = parseBrlNumber(entry.rawValue);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      next.unshift({
        id: createLocalId('fin'),
        contractId: contract.id,
        contractCode: contract.contractCode,
        clientName: contract.clientName,
        clientEmail: contract.clientEmail,
        clientPhone: phone,
        description: `${entry.label} — ${modelLabel} (${contract.contractCode})`,
        amount,
        dueDate: addDaysIsoDate(today, entry.offsetDays),
        status: 'pendente',
        createdAt: new Date().toISOString(),
      });
      createdAnyForContract = true;
      addedCount += 1;
    }

    if (!createdAnyForContract) {
      const total = parseBrlNumber(contract.termsData.totalValue);
      if (Number.isFinite(total) && total > 0) {
        next.unshift({
          id: createLocalId('fin'),
          contractId: contract.id,
          contractCode: contract.contractCode,
          clientName: contract.clientName,
          clientEmail: contract.clientEmail,
          clientPhone: phone,
          description: `Honorários — ${modelLabel} (${contract.contractCode})`,
          amount: total,
          dueDate: addDaysIsoDate(today, 10),
          status: 'pendente',
          createdAt: new Date().toISOString(),
        });
        addedCount += 1;
      }
    }
  }

  return { next, addedCount };
}

export function createDefaultChecklist(): VisitChecklistItem[] {
  return [
    {
      id: createLocalId('chk'),
      item: 'Execução em conformidade com os projetos aprovados',
      status: 'conforme',
      note: '',
    },
    {
      id: createLocalId('chk'),
      item: 'Organização, limpeza e segurança do canteiro de obras',
      status: 'conforme',
      note: '',
    },
    {
      id: createLocalId('chk'),
      item: 'Qualidade dos materiais recebidos e armazenamento adequado',
      status: 'conforme',
      note: '',
    },
    {
      id: createLocalId('chk'),
      item: 'Conferência de estrutura, prumos, níveis e esquadros',
      status: 'conforme',
      note: '',
    },
    {
      id: createLocalId('chk'),
      item: 'Compatibilização de passagens elétricas e hidrossanitárias',
      status: 'nao_aplicavel',
      note: '',
    },
  ];
}

export function createEmptyVisitReport(existingCount = 0): SiteVisitReportDraft {
  const year = new Date().getFullYear();
  const seq = String(existingCount + 1).padStart(3, '0');
  return {
    id: createLocalId('vis'),
    reportNumber: `RVO-${year}-${seq}`,
    projectCode: '',
    projectTitle: '',
    clientName: '',
    propertyAddress: '',
    city: 'Umuarama - PR',
    visitDate: todayIsoDate(),
    stage: 'Estrutura / Alvenaria',
    weather: 'Tempo firme / ensolarado',
    teamOnSite: '',
    progressPercent: 0,
    summary: '',
    checklist: createDefaultChecklist(),
    nonConformities: [],
    recommendations: '',
    nextVisitDate: addDaysIsoDate(todayIsoDate(), 7),
    updatedAt: new Date().toISOString(),
  };
}

export function loadLocalVisitReports(): SiteVisitReportDraft[] {
  try {
    const raw = window.localStorage.getItem(VISIT_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SiteVisitReportDraft[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalVisitReports(reports: SiteVisitReportDraft[]): void {
  try {
    window.localStorage.setItem(VISIT_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage quota errors silently
  }
}

export function exportInstallmentsCsv(items: LocalInstallment[]): void {
  const headers = [
    'Cliente',
    'Contrato',
    'Descricao',
    'Valor (R$)',
    'Vencimento',
    'Status',
    'Data Pagamento',
    'Observacoes',
  ];
  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows = items.map((item) => [
    item.clientName,
    item.contractCode || '',
    item.description,
    item.amount.toFixed(2).replace('.', ','),
    formatIsoDateBr(item.dueDate),
    item.status === 'pago' ? 'Pago' : isInstallmentOverdue(item) ? 'Vencida' : 'Pendente',
    item.paidAt ? formatIsoDateBr(item.paidAt) : '',
    item.notes || '',
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kh-engenharia-financeiro-${todayIsoDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportLocalAdminBackupJson(): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    installments: loadLocalInstallments(),
    visitReports: loadLocalVisitReports(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kh-engenharia-backup-local-${todayIsoDate()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseLocalAdminBackupJson(rawText: string): {
  installments: LocalInstallment[];
  visitReports: SiteVisitReportDraft[];
} {
  const parsed = JSON.parse(rawText);
  const installments = Array.isArray(parsed?.installments)
    ? (parsed.installments as LocalInstallment[])
    : [];
  const visitReports = Array.isArray(parsed?.visitReports)
    ? (parsed.visitReports as SiteVisitReportDraft[])
    : [];
  return { installments, visitReports };
}
