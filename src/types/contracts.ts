import type { Timestamp } from 'firebase/firestore';
import type { ServiceType } from './portal';

export type PersonType = 'PF' | 'PJ';
export type LegalNature = 'privado' | 'publico';
export type ContractStatus =
  | 'aguardando_cliente'
  | 'aguardando_admin'
  | 'pronto'
  | 'assinado';

export interface ContractorSettings {
  fullName: string;
  nationality: string;
  maritalStatus: string;
  creaUf: string;
  creaNumber: string;
  cpf: string;
  rg: string;
  email: string;
  professionalAddress: string;
  city: string;
  state: string;
  officeHoursStart: string;
  officeHoursEnd: string;
  defaultHourlyRate: string;
  defaultHourlyRateWords: string;
  defaultOutOfHoursFee: string;
  defaultForumCity: string;
  defaultForumState: string;
  updatedBy?: string;
  updatedAt?: Timestamp;
}

export interface ContractClientData {
  personType: PersonType;
  // Pessoa Fisica fields
  fullName: string;
  nationality: string;
  maritalStatus: string;
  profession: string;
  cpf: string;
  rg: string;
  email: string;
  addressStreet: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  // Pessoa Juridica fields
  companyName: string;
  legalNature: LegalNature;
  cnpj: string;
  companyAddress: string;
  repFullName: string;
  repNationality: string;
  repMaritalStatus: string;
  repProfession: string;
  repCpf: string;
  repRg: string;
  repEmail: string;
  repAddressStreet: string;
  repAddressNeighborhood: string;
  repAddressCity: string;
  repAddressState: string;
  // Property identification (client fills & admin can refine)
  propertyStreet: string;
  propertyNeighborhood: string;
  propertyCity: string;
  propertyState: string;
  propertyRegistration: string;
  propertyMunicipalCode: string;
}

export interface ContractContractorData {
  fullName: string;
  nationality: string;
  maritalStatus: string;
  creaUf: string;
  creaNumber: string;
  cpf: string;
  rg: string;
  email: string;
  professionalAddress: string;
  city: string;
  state: string;
}

export interface ContractTermsData {
  totalValue: string;
  totalValueWords: string;
  installment1Value: string;
  installment1Words: string;
  installment2Value: string;
  installment2Words: string;
  installment3Value: string;
  installment3Words: string;
  // For Acompanhamento (monthly fee)
  monthlyFee: string;
  monthlyFeeWords: string;
  monthlyVisitsIncluded: string;
  monthlyDueDay: string;
  monthlyAdjustmentIndex: string;
  // Common commercial clauses
  artFeeIncluded: boolean;
  correctionIndex: 'IPCA' | 'INPC';
  hourlyRate: string;
  hourlyRateWords: string;
  allowImageRights: boolean;
  reimbursementOriginCity: string;
  reimbursementOriginState: string;
  editableFileCondition: string;
  officeHoursStart: string;
  officeHoursEnd: string;
  outOfHoursFee: string;
  forumCity: string;
  forumState: string;
  signatureCityDate: string;
  witness1Name: string;
  witness1Cpf: string;
  witness2Name: string;
  witness2Cpf: string;
}

export interface ContractSpecificData {
  // Common property / building specs
  builtAreaSqm: string;
  lotAreaSqm: string;
  buildingUsage: string; // residencial / comercial / misto
  workType: string; // obra nova / ampliação / reforma
  finality: string;

  // 01 - Regularização de Imóvel
  regOtherOrgans: string;
  regSituation: string;
  regProtocolRounds: string;
  regFinalDocument: string;
  regIncludeCnoReceita: boolean;
  regIncludeCartorio: boolean;
  regIncludeOthersText: string;
  regStage1Days: string;
  regStage2Days: string;
  regStage3Days: string;
  regStage4Days: string;
  regNoticeReplyDays: string;
  regReviewDays: string;
  regCorrectionDays: string;
  regPlannedReviewRounds: string;
  regPlannedReviewDays: string;
  regUpdateChannel: string;
  regUpdateIntervalDays: string;

  // 02 - Projeto Arquitetônico
  arqIncludeApproval: boolean;
  arqComplementaryStatus: string;
  arqCompatibilityClause: string;
  arqInfoHub: string;
  arqPublicRequestsBy: string;
  arqInclude3D: boolean;
  arqIncludeLandscaping: boolean;
  arqIncludeInteriors: boolean;
  arqIncludeModel: boolean;
  arqIncludeOthersText: string;
  arqSoftwareVersion: string;
  arqDeliveryChannel: string;
  arqEstudoDays: string;
  arqAnteprojetoDays: string;
  arqLegalDays: string;
  arqExecutivoDays: string;
  arqExecutivoAfterLegal: boolean;

  // 03 - Laudo Técnico e Vistoria
  laudoType: string;
  laudoPropertyTypeUsage: string;
  laudoObjective: string;
  laudoRecipient: string;
  laudoMethodTools: string;
  laudoInspectionDays: string;
  laudoDeliveryBusinessDays: string;
  laudoClarificationRequestDays: string;
  laudoClarificationReplyDays: string;
  laudoRescheduleFee: string;
  laudoAccessServicesIncluded: boolean;
  laudoArchiveYears: string;

  // 04 - Projetos Complementares
  compStructural: boolean;
  compFoundations: boolean;
  compPlumbing: boolean;
  compElectrical: boolean;
  compSpda: boolean;
  compFire: boolean;
  compGas: boolean;
  compHvac: boolean;
  compOtherName: string;
  compOtherProducts: string;
  compArchAuthor: string;
  compArchRevision: string;
  compArchDate: string;
  compCompatibilityThirdParty: string;
  compUtilityApprovalText: string;
  compLaunchDays: string;
  compExecDays: string;
  compCompatDays: string;

  // 05 - Acompanhamento de Obra
  acompWorkDescription: string;
  acompExecutorName: string;
  acompExecutorDoc: string;
  acompExecutorContractDate: string;
  acompRtName: string;
  acompRtCrea: string;
  acompEstimatedMonths: string;
  acompFrequency: string;
  acompMinHours: string;
  acompAdvanceNoticeDays: string;
  acompVisitReportDays: string;
  acompMonthlyReportDay: string;
  acompIncludeMeasurements: boolean;
  acompMeasurementDays: string;
  acompIncludeManagement: boolean;
  acompIncludeFinalDelivery: boolean;
  acompIncludeOthersText: string;
  acompStartDate: string;
  acompEndClause: string;
  acompExtraVisitDays: string;
  acompSuspensionDays: string;
  acompRescheduleVisitDays: string;
  acompReportAcceptDays: string;
  acompArchiveYears: string;
  acompClientDecisionDays: string;
}

export interface ServiceContract {
  id: string;
  contractCode: string;
  serviceType: ServiceType;
  status: ContractStatus;
  projectId: string;
  clientEmail: string;
  clientUid: string;
  clientName: string;
  clientFilled: boolean;
  adminFilled: boolean;
  clientData: ContractClientData;
  contractorData: ContractContractorData;
  termsData: ContractTermsData;
  specificData: ContractSpecificData;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const CONTRACT_MODEL_TITLES: Record<ServiceType, string> = {
  regularizacao: 'CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE REGULARIZAÇÃO DE IMÓVEL',
  arquitetonico: 'CONTRATO PARTICULAR DE ELABORAÇÃO DE PROJETO ARQUITETÔNICO',
  laudo_vistoria: 'CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE VISTORIA E LAUDO TÉCNICO',
  complementares: 'CONTRATO PARTICULAR DE ELABORAÇÃO DE PROJETOS COMPLEMENTARES DE ENGENHARIA',
  acompanhamento: 'CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ACOMPANHAMENTO DE OBRA',
};

export const CONTRACT_MODEL_SHORT: Record<ServiceType, string> = {
  regularizacao: '01 · Regularização de Imóvel',
  arquitetonico: '02 · Projeto Arquitetônico',
  laudo_vistoria: '03 · Vistoria e Laudo Técnico',
  complementares: '04 · Projetos Complementares',
  acompanhamento: '05 · Acompanhamento de Obra',
};

export const CONTRACT_STATUS_META: Record<
  ContractStatus,
  { label: string; textClass: string; desc: string }
> = {
  aguardando_cliente: {
    label: 'Aguardando cliente',
    textClass: 'text-[#f09d78]',
    desc: 'Aguardando o cliente preencher os dados PF/PJ e do imóvel.',
  },
  aguardando_admin: {
    label: 'Aguardando engenheiro',
    textClass: 'text-[#e8c67a]',
    desc: 'Cliente já preencheu; aguardando conclusão das cláusulas comerciais.',
  },
  pronto: {
    label: 'Pronto para Word',
    textClass: 'text-[#86d69d]',
    desc: 'Dados do cliente e do engenheiro preenchidos e prontos para download.',
  },
  assinado: {
    label: 'Assinado',
    textClass: 'text-[#a9c5e0]',
    desc: 'Contrato finalizado e assinado pelas partes.',
  },
};

export function createDefaultContractorSettings(): ContractorSettings {
  return {
    fullName: 'KAIO HENRIQUE DA SILVA',
    nationality: 'brasileiro',
    maritalStatus: 'solteiro',
    creaUf: 'PR',
    creaNumber: 'PR-232385/D',
    cpf: '',
    rg: '',
    email: 'kaiolegal0@gmail.com',
    professionalAddress: '',
    city: 'Umuarama',
    state: 'PR',
    officeHoursStart: '8h00min',
    officeHoursEnd: '18h',
    defaultHourlyRate: '250,00',
    defaultHourlyRateWords: 'duzentos e cinquenta reais',
    defaultOutOfHoursFee: '300,00',
    defaultForumCity: 'Umuarama',
    defaultForumState: 'PR',
  };
}

export function createDefaultClientData(overrides?: Partial<ContractClientData>): ContractClientData {
  return {
    personType: 'PF',
    fullName: '',
    nationality: 'brasileiro(a)',
    maritalStatus: '',
    profession: '',
    cpf: '',
    rg: '',
    email: '',
    addressStreet: '',
    addressNeighborhood: '',
    addressCity: 'Umuarama',
    addressState: 'PR',
    companyName: '',
    legalNature: 'privado',
    cnpj: '',
    companyAddress: '',
    repFullName: '',
    repNationality: 'brasileiro(a)',
    repMaritalStatus: '',
    repProfession: '',
    repCpf: '',
    repRg: '',
    repEmail: '',
    repAddressStreet: '',
    repAddressNeighborhood: '',
    repAddressCity: 'Umuarama',
    repAddressState: 'PR',
    propertyStreet: '',
    propertyNeighborhood: '',
    propertyCity: 'Umuarama',
    propertyState: 'PR',
    propertyRegistration: '',
    propertyMunicipalCode: '',
    ...overrides,
  };
}

export function createDefaultContractorData(
  settings?: ContractorSettings | null
): ContractContractorData {
  const s = settings || createDefaultContractorSettings();
  return {
    fullName: s.fullName || 'KAIO HENRIQUE DA SILVA',
    nationality: s.nationality || 'brasileiro',
    maritalStatus: s.maritalStatus || '',
    creaUf: s.creaUf || 'PR',
    creaNumber: s.creaNumber || 'PR-232385/D',
    cpf: s.cpf || '',
    rg: s.rg || '',
    email: s.email || 'kaiolegal0@gmail.com',
    professionalAddress: s.professionalAddress || '',
    city: s.city || 'Umuarama',
    state: s.state || 'PR',
  };
}

export function createDefaultTermsData(
  settings?: ContractorSettings | null
): ContractTermsData {
  const s = settings || createDefaultContractorSettings();
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return {
    totalValue: '',
    totalValueWords: '',
    installment1Value: '',
    installment1Words: '',
    installment2Value: '',
    installment2Words: '',
    installment3Value: '',
    installment3Words: '',
    monthlyFee: '',
    monthlyFeeWords: '',
    monthlyVisitsIncluded: '4 visitas por mês e o relatório mensal',
    monthlyDueDay: '10',
    monthlyAdjustmentIndex: 'reajustados anualmente pelo IPCA',
    artFeeIncluded: false,
    correctionIndex: 'IPCA',
    hourlyRate: s.defaultHourlyRate || '250,00',
    hourlyRateWords: s.defaultHourlyRateWords || 'duzentos e cinquenta reais',
    allowImageRights: true,
    reimbursementOriginCity: s.city || 'Umuarama',
    reimbursementOriginState: s.state || 'PR',
    editableFileCondition: 'mediante termo de responsabilidade técnica',
    officeHoursStart: s.officeHoursStart || '8h00min',
    officeHoursEnd: s.officeHoursEnd || '18h',
    outOfHoursFee: s.defaultOutOfHoursFee || '300,00',
    forumCity: s.defaultForumCity || 'Umuarama',
    forumState: s.defaultForumState || 'PR',
    signatureCityDate: `${s.defaultForumCity || 'Umuarama'}/${s.defaultForumState || 'PR'}, ${todayFormatted}.`,
    witness1Name: '',
    witness1Cpf: '',
    witness2Name: '',
    witness2Cpf: '',
  };
}

export function createDefaultSpecificData(): ContractSpecificData {
  return {
    builtAreaSqm: '',
    lotAreaSqm: '',
    buildingUsage: 'residencial',
    workType: 'obra nova',
    finality: 'averbação na matrícula',

    // 01 - Regularização
    regOtherOrgans: '',
    regSituation: 'sem projeto aprovado / sem habite-se',
    regProtocolRounds: '2',
    regFinalDocument: 'alvará de regularização e habite-se',
    regIncludeCnoReceita: false,
    regIncludeCartorio: false,
    regIncludeOthersText: '',
    regStage1Days: '7',
    regStage2Days: '10',
    regStage3Days: '15',
    regStage4Days: '5',
    regNoticeReplyDays: '10',
    regReviewDays: '7',
    regCorrectionDays: '5',
    regPlannedReviewRounds: '2',
    regPlannedReviewDays: '7',
    regUpdateChannel: 'WhatsApp e e-mail',
    regUpdateIntervalDays: '15',

    // 02 - Arquitetônico
    arqIncludeApproval: true,
    arqComplementaryStatus: 'serão contratados posteriormente',
    arqCompatibilityClause: 'não está incluída, cabendo a coordenação ao CONTRATANTE',
    arqInfoHub: 'e-mail oficial da KH Engenharia',
    arqPublicRequestsBy: 'o CONTRATADO, limitado ao seu projeto',
    arqInclude3D: false,
    arqIncludeLandscaping: false,
    arqIncludeInteriors: false,
    arqIncludeModel: false,
    arqIncludeOthersText: '',
    arqSoftwareVersion: 'AutoCAD / Revit (DWG e PDF)',
    arqDeliveryChannel: 'e-mail e nuvem (Área do Cliente)',
    arqEstudoDays: '15',
    arqAnteprojetoDays: '15',
    arqLegalDays: '15',
    arqExecutivoDays: '20',
    arqExecutivoAfterLegal: true,

    // 03 - Laudo e Vistoria
    laudoType: 'inspeção predial',
    laudoPropertyTypeUsage: 'edificação residencial unifamiliar',
    laudoObjective: 'constatação das condições técnicas e manifestações patológicas aparentes',
    laudoRecipient: 'uso particular do CONTRATANTE',
    laudoMethodTools: 'visual e não destrutivo, com uso de trena a laser, nível, fissurômetro e registro fotográfico',
    laudoInspectionDays: '7',
    laudoDeliveryBusinessDays: '10',
    laudoClarificationRequestDays: '15',
    laudoClarificationReplyDays: '5',
    laudoRescheduleFee: '300,00',
    laudoAccessServicesIncluded: false,
    laudoArchiveYears: '5 anos',

    // 04 - Projetos Complementares
    compStructural: true,
    compFoundations: true,
    compPlumbing: true,
    compElectrical: true,
    compSpda: false,
    compFire: false,
    compGas: false,
    compHvac: false,
    compOtherName: '',
    compOtherProducts: '',
    compArchAuthor: '',
    compArchRevision: 'Rev. 00',
    compArchDate: '',
    compCompatibilityThirdParty: 'não está incluída, cabendo a coordenação ao CONTRATANTE',
    compUtilityApprovalText: 'não estão incluídos',
    compLaunchDays: '15',
    compExecDays: '20',
    compCompatDays: '10',

    // 05 - Acompanhamento de Obra
    acompWorkDescription: 'construção residencial',
    acompExecutorName: '',
    acompExecutorDoc: '',
    acompExecutorContractDate: '',
    acompRtName: '',
    acompRtCrea: '',
    acompEstimatedMonths: '12',
    acompFrequency: '1 visita por semana',
    acompMinHours: '2',
    acompAdvanceNoticeDays: '2',
    acompVisitReportDays: '3',
    acompMonthlyReportDay: '5',
    acompIncludeMeasurements: false,
    acompMeasurementDays: '5',
    acompIncludeManagement: false,
    acompIncludeFinalDelivery: true,
    acompIncludeOthersText: '',
    acompStartDate: '',
    acompEndClause: 'a conclusão da obra',
    acompExtraVisitDays: '3',
    acompSuspensionDays: '30',
    acompRescheduleVisitDays: '5',
    acompReportAcceptDays: '7',
    acompArchiveYears: '5 anos',
    acompClientDecisionDays: '5',
  };
}
