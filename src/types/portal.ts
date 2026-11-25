import type { Timestamp } from 'firebase/firestore';

export type ServiceType =
  | 'regularizacao'
  | 'arquitetonico'
  | 'laudo_vistoria'
  | 'complementares'
  | 'acompanhamento';

export type ProjectStatus =
  | 'em_analise'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'aguardando_prefeitura'
  | 'concluido';

export type MilestoneStatus = 'pendente' | 'em_andamento' | 'concluido';

export type DocumentCategory =
  | 'planta'
  | 'art'
  | 'memorial'
  | 'laudo'
  | 'prefeitura'
  | 'documento_cliente';

export type DocumentStatus =
  | 'disponivel'
  | 'pendente_cliente'
  | 'enviado_cliente'
  | 'aprovado';

export type ServiceRequestStatus =
  | 'recebida'
  | 'em_analise'
  | 'convertida'
  | 'arquivada';

export type ClientAccountStatus = 'aprovado' | 'suspenso';
export type ClientAuthMethod = 'email_senha' | 'google';
export type AccessRequestStatus = 'pendente' | 'aprovada' | 'recusada';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  city: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClientAccount {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  city: string;
  notes: string;
  authMethod: ClientAuthMethod;
  status: ClientAccountStatus;
  approvedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AccessRequest {
  id: string;
  applicantUid: string;
  email: string;
  displayName: string;
  phone: string;
  city: string;
  serviceInterest: ServiceType;
  message: string;
  status: AccessRequestStatus;
  adminNotes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ServiceRequest {
  id: string;
  clientUid: string;
  clientEmail: string;
  clientName: string;
  phone: string;
  city: string;
  serviceType: ServiceType;
  propertyAddress: string;
  description: string;
  status: ServiceRequestStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  serviceType: ServiceType;
  status: ProjectStatus;
  progress: number;
  clientEmail: string;
  clientUid: string;
  clientName: string;
  clientPhone: string;
  propertyAddress: string;
  city: string;
  areaSqm: number;
  artNumber: string;
  protocolNumber: string;
  summary: string;
  nextStep: string;
  estimatedDelivery: string;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  clientEmail: string;
  title: string;
  description: string;
  order: number;
  status: MilestoneStatus;
  dueDate: string;
  completedDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  clientEmail: string;
  title: string;
  category: DocumentCategory;
  revision: string;
  status: DocumentStatus;
  fileUrl: string;
  notes: string;
  uploadedByRole: 'engenheiro' | 'cliente';
  uploadedByUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  clientEmail: string;
  authorUid: string;
  authorName: string;
  authorRole: 'engenheiro' | 'cliente';
  body: string;
  createdAt?: Timestamp;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  regularizacao: 'Regularização de imóvel',
  arquitetonico: 'Projeto arquitetônico',
  laudo_vistoria: 'Laudo técnico e vistoria',
  complementares: 'Projetos complementares',
  acompanhamento: 'Acompanhamento de obra',
};

export const CLIENT_STATUS_META: Record<
  ClientAccountStatus,
  { label: string; textClass: string }
> = {
  aprovado: { label: 'Acesso ativo', textClass: 'text-[#86d69d]' },
  suspenso: { label: 'Suspenso', textClass: 'text-[#f09d78]' },
};

export const ACCESS_REQUEST_STATUS_META: Record<
  AccessRequestStatus,
  { label: string; textClass: string }
> = {
  pendente: { label: 'Aguardando aprovação', textClass: 'text-[#e8c67a]' },
  aprovada: { label: 'Aprovada', textClass: 'text-[#86d69d]' },
  recusada: { label: 'Recusada', textClass: 'text-[#f09d78]' },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; textClass: string }
> = {
  em_analise: { label: 'Em análise técnica', textClass: 'text-[#c5d1c0]' },
  em_andamento: { label: 'Em andamento', textClass: 'text-[#e8c67a]' },
  aguardando_cliente: { label: 'Aguardando cliente', textClass: 'text-[#f09d78]' },
  aguardando_prefeitura: { label: 'Aguardando prefeitura', textClass: 'text-[#a9c5e0]' },
  concluido: { label: 'Concluído', textClass: 'text-[#86d69d]' },
};

export const MILESTONE_STATUS_META: Record<
  MilestoneStatus,
  { label: string; textClass: string }
> = {
  pendente: { label: 'Pendente', textClass: 'text-[#8c968e]' },
  em_andamento: { label: 'Em andamento', textClass: 'text-[#e8c67a]' },
  concluido: { label: 'Concluído', textClass: 'text-[#86d69d]' },
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  planta: 'Prancha / Planta',
  art: 'ART CREA-PR',
  memorial: 'Memorial descritivo',
  laudo: 'Laudo técnico',
  prefeitura: 'Prefeitura / Protocolo',
  documento_cliente: 'Documento do cliente',
};

export const DOCUMENT_STATUS_META: Record<
  DocumentStatus,
  { label: string; textClass: string }
> = {
  disponivel: { label: 'Disponível', textClass: 'text-[#d8ddd6]' },
  pendente_cliente: { label: 'Pendente de envio', textClass: 'text-[#f09d78]' },
  enviado_cliente: { label: 'Enviado pelo cliente', textClass: 'text-[#e8c67a]' },
  aprovado: { label: 'Aprovado', textClass: 'text-[#86d69d]' },
};

export const SERVICE_REQUEST_STATUS_META: Record<
  ServiceRequestStatus,
  { label: string; textClass: string }
> = {
  recebida: { label: 'Recebida', textClass: 'text-[#c5d1c0]' },
  em_analise: { label: 'Em análise', textClass: 'text-[#e8c67a]' },
  convertida: { label: 'Convertida em projeto', textClass: 'text-[#86d69d]' },
  arquivada: { label: 'Arquivada', textClass: 'text-[#8c968e]' },
};

export const DEFAULT_MILESTONES_BY_SERVICE: Record<
  ServiceType,
  Array<{ title: string; description: string }>
> = {
  regularizacao: [
    { title: 'Levantamento métrico presencial', description: 'Medição completa da edificação e conferência de recuos e matrícula.' },
    { title: 'Plantas conforme construído (as-built)', description: 'Elaboração das pranchas técnicas e memorial descritivo.' },
    { title: 'Emissão de ART no CREA-PR', description: 'Registro da responsabilidade técnica de regularização.' },
    { title: 'Protocolo e acompanhamento na prefeitura', description: 'Envio da documentação e atendimento a eventuais exigências.' },
    { title: 'Entrega de alvará / Habite-se', description: 'Liberação documental final para averbação em cartório.' },
  ],
  arquitetonico: [
    { title: 'Briefing e análise do terreno', description: 'Estudo das confrontações, legislação municipal e programa de necessidades.' },
    { title: 'Estudo preliminar', description: 'Definição do layout, volumetria e aprovação conceitual com o cliente.' },
    { title: 'Projeto legal e pranchas técnicas', description: 'Plantas baixas, cortes, fachadas, cobertura e memorial descritivo.' },
    { title: 'Emissão de ART e protocolo', description: 'Emissão da ART de projeto e encaminhamento para aprovação municipal.' },
    { title: 'Entrega final compatibilizada', description: 'Disponibilização dos arquivos finais em PDF e DWG para obra.' },
  ],
  laudo_vistoria: [
    { title: 'Vistoria técnica presencial', description: 'Inspeção minuciosa in loco e levantamento fotográfico completo.' },
    { title: 'Análise das manifestações patológicas', description: 'Investigação técnica das causas prováveis e normas ABNT aplicáveis.' },
    { title: 'Redação do laudo e recomendações', description: 'Elaboração do parecer conclusivo com diretrizes de reparo.' },
    { title: 'Emissão de ART e entrega formal', description: 'Registro da ART no CREA-PR e entrega do laudo assinado.' },
  ],
  complementares: [
    { title: 'Recebimento da arquitetura base', description: 'Compatibilização inicial com a planta arquitetônica aprovada.' },
    { title: 'Projeto elétrico de baixa tensão', description: 'Dimensionamento de circuitos, quadros, eletrodutos e pontos.' },
    { title: 'Projeto hidrossanitário e pluvial', description: 'Redes de água fria/quente, esgoto, ventilação e águas pluviais.' },
    { title: 'Quantitativo de materiais e ART', description: 'Lista de materiais para orçamento e emissão das ARTs das disciplinas.' },
  ],
  acompanhamento: [
    { title: 'Planejamento inicial da obra', description: 'Revisão dos projetos executivos e cronograma físico de etapas.' },
    { title: 'Vistorias de fundação e estrutura', description: 'Conferência de armações, concretagens e conformidade em campo.' },
    { title: 'Vistorias de instalações e alvenaria', description: 'Validação da passagem de tubulações, prumos e níveis.' },
    { title: 'Vistoria final e relatório de entrega', description: 'Checagem de acabamentos e encerramento técnico do acompanhamento.' },
  ],
};
