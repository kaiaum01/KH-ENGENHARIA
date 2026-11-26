import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { ServiceType } from '../types/portal';
import {
  createDefaultContractorSettings,
  type ContractClientData,
  type ContractContractorData,
  type ContractSpecificData,
  type ContractStatus,
  type ContractTermsData,
  type ContractorSettings,
  type ServiceContract,
} from '../types/contracts';

const clamp = (val: string | undefined, max: number): string =>
  (val ?? '').trim().slice(0, max);

const normalizeEmail = (val: string): string =>
  (val ?? '').trim().toLowerCase().slice(0, 254);

const sanitizeCode = (val: string): string =>
  (val ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 32);

export function sanitizeClientData(raw: ContractClientData): ContractClientData {
  return {
    personType: raw.personType === 'PJ' ? 'PJ' : 'PF',
    fullName: clamp(raw.fullName, 140),
    nationality: clamp(raw.nationality, 60),
    maritalStatus: clamp(raw.maritalStatus, 40),
    profession: clamp(raw.profession, 80),
    cpf: clamp(raw.cpf, 25),
    rg: clamp(raw.rg, 30),
    email: clamp(raw.email, 254),
    addressStreet: clamp(raw.addressStreet, 180),
    addressNeighborhood: clamp(raw.addressNeighborhood, 100),
    addressCity: clamp(raw.addressCity, 100),
    addressState: clamp(raw.addressState, 10),
    companyName: clamp(raw.companyName, 160),
    legalNature: raw.legalNature === 'publico' ? 'publico' : 'privado',
    cnpj: clamp(raw.cnpj, 30),
    companyAddress: clamp(raw.companyAddress, 240),
    repFullName: clamp(raw.repFullName, 140),
    repNationality: clamp(raw.repNationality, 60),
    repMaritalStatus: clamp(raw.repMaritalStatus, 40),
    repProfession: clamp(raw.repProfession, 80),
    repCpf: clamp(raw.repCpf, 25),
    repRg: clamp(raw.repRg, 30),
    repEmail: clamp(raw.repEmail, 254),
    repAddressStreet: clamp(raw.repAddressStreet, 180),
    repAddressNeighborhood: clamp(raw.repAddressNeighborhood, 100),
    repAddressCity: clamp(raw.repAddressCity, 100),
    repAddressState: clamp(raw.repAddressState, 10),
    propertyStreet: clamp(raw.propertyStreet, 180),
    propertyNeighborhood: clamp(raw.propertyNeighborhood, 100),
    propertyCity: clamp(raw.propertyCity, 100),
    propertyState: clamp(raw.propertyState, 10),
    propertyRegistration: clamp(raw.propertyRegistration, 60),
    propertyMunicipalCode: clamp(raw.propertyMunicipalCode, 60),
  };
}

export function sanitizeContractorData(
  raw: ContractContractorData
): ContractContractorData {
  return {
    fullName: clamp(raw.fullName, 120) || 'KAIO HENRIQUE DA SILVA',
    nationality: clamp(raw.nationality, 60),
    maritalStatus: clamp(raw.maritalStatus, 40),
    creaUf: clamp(raw.creaUf, 10),
    creaNumber: clamp(raw.creaNumber, 40),
    cpf: clamp(raw.cpf, 25),
    rg: clamp(raw.rg, 30),
    email: clamp(raw.email, 254),
    professionalAddress: clamp(raw.professionalAddress, 240),
    city: clamp(raw.city, 100),
    state: clamp(raw.state, 10),
  };
}

export function sanitizeTermsData(raw: ContractTermsData): ContractTermsData {
  return {
    totalValue: clamp(raw.totalValue, 40),
    totalValueWords: clamp(raw.totalValueWords, 220),
    installment1Value: clamp(raw.installment1Value, 40),
    installment1Words: clamp(raw.installment1Words, 220),
    installment2Value: clamp(raw.installment2Value, 40),
    installment2Words: clamp(raw.installment2Words, 220),
    installment3Value: clamp(raw.installment3Value, 40),
    installment3Words: clamp(raw.installment3Words, 220),
    monthlyFee: clamp(raw.monthlyFee, 40),
    monthlyFeeWords: clamp(raw.monthlyFeeWords, 220),
    monthlyVisitsIncluded: clamp(raw.monthlyVisitsIncluded, 140),
    monthlyDueDay: clamp(raw.monthlyDueDay, 10),
    monthlyAdjustmentIndex: clamp(raw.monthlyAdjustmentIndex, 100),
    artFeeIncluded: Boolean(raw.artFeeIncluded),
    correctionIndex: raw.correctionIndex === 'INPC' ? 'INPC' : 'IPCA',
    hourlyRate: clamp(raw.hourlyRate, 40),
    hourlyRateWords: clamp(raw.hourlyRateWords, 180),
    allowImageRights: Boolean(raw.allowImageRights),
    reimbursementOriginCity: clamp(raw.reimbursementOriginCity, 100),
    reimbursementOriginState: clamp(raw.reimbursementOriginState, 10),
    editableFileCondition: clamp(raw.editableFileCondition, 160),
    officeHoursStart: clamp(raw.officeHoursStart, 20),
    officeHoursEnd: clamp(raw.officeHoursEnd, 20),
    outOfHoursFee: clamp(raw.outOfHoursFee, 40),
    forumCity: clamp(raw.forumCity, 100),
    forumState: clamp(raw.forumState, 10),
    signatureCityDate: clamp(raw.signatureCityDate, 120),
    witness1Name: clamp(raw.witness1Name, 120),
    witness1Cpf: clamp(raw.witness1Cpf, 25),
    witness2Name: clamp(raw.witness2Name, 120),
    witness2Cpf: clamp(raw.witness2Cpf, 25),
  };
}

export function sanitizeSpecificData(
  raw: ContractSpecificData
): ContractSpecificData {
  const out: Record<string, string | boolean> = {};
  const entries = Object.entries(raw) as Array<[keyof ContractSpecificData, string | boolean]>;
  for (const [key, val] of entries) {
    if (typeof val === 'boolean') {
      out[key] = val;
    } else {
      out[key] = clamp(String(val ?? ''), 240);
    }
  }
  return out as unknown as ContractSpecificData;
}

export async function getContractorSettings(): Promise<ContractorSettings> {
  const path = 'settings/contractorProfile';
  try {
    const ref = doc(db, 'settings', 'contractorProfile');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return createDefaultContractorSettings();
    }
    return {
      ...createDefaultContractorSettings(),
      ...(snap.data() as Partial<ContractorSettings>),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveContractorSettings(
  adminUid: string,
  input: ContractorSettings
): Promise<void> {
  const path = 'settings/contractorProfile';
  try {
    const ref = doc(db, 'settings', 'contractorProfile');
    await setDoc(ref, {
      fullName: clamp(input.fullName, 120) || 'KAIO HENRIQUE DA SILVA',
      nationality: clamp(input.nationality, 60),
      maritalStatus: clamp(input.maritalStatus, 40),
      creaUf: clamp(input.creaUf, 10),
      creaNumber: clamp(input.creaNumber, 40),
      cpf: clamp(input.cpf, 25),
      rg: clamp(input.rg, 30),
      email: clamp(input.email, 254),
      professionalAddress: clamp(input.professionalAddress, 240),
      city: clamp(input.city, 100),
      state: clamp(input.state, 10),
      officeHoursStart: clamp(input.officeHoursStart, 20),
      officeHoursEnd: clamp(input.officeHoursEnd, 20),
      defaultHourlyRate: clamp(input.defaultHourlyRate, 40),
      defaultHourlyRateWords: clamp(input.defaultHourlyRateWords, 160),
      defaultOutOfHoursFee: clamp(input.defaultOutOfHoursFee, 40),
      defaultForumCity: clamp(input.defaultForumCity, 100),
      defaultForumState: clamp(input.defaultForumState, 10),
      updatedBy: adminUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface CreateContractInput {
  contractCode: string;
  serviceType: ServiceType;
  projectId: string;
  clientEmail: string;
  clientUid: string;
  clientName: string;
  clientFilled: boolean;
  adminFilled: boolean;
  status: ContractStatus;
  clientData: ContractClientData;
  contractorData: ContractContractorData;
  termsData: ContractTermsData;
  specificData: ContractSpecificData;
}

export async function createContractAsAdmin(
  adminUid: string,
  input: CreateContractInput
): Promise<string> {
  const path = 'contracts';
  try {
    const code = sanitizeCode(input.contractCode) || `CTR-${Date.now().toString().slice(-6)}`;
    const payload = {
      contractCode: code,
      serviceType: input.serviceType,
      status: input.status,
      projectId: clamp(input.projectId, 128),
      clientEmail: normalizeEmail(input.clientEmail),
      clientUid: clamp(input.clientUid, 128),
      clientName: clamp(input.clientName, 120) || 'Cliente',
      clientFilled: Boolean(input.clientFilled),
      adminFilled: Boolean(input.adminFilled),
      clientData: sanitizeClientData(input.clientData),
      contractorData: sanitizeContractorData(input.contractorData),
      termsData: sanitizeTermsData(input.termsData),
      specificData: sanitizeSpecificData(input.specificData),
      createdBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'contracts'), payload);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateContractAsAdmin(
  contractId: string,
  input: CreateContractInput
): Promise<void> {
  const path = `contracts/${contractId}`;
  try {
    const ref = doc(db, 'contracts', contractId);
    const code = sanitizeCode(input.contractCode) || `CTR-${Date.now().toString().slice(-6)}`;
    await updateDoc(ref, {
      contractCode: code,
      serviceType: input.serviceType,
      status: input.status,
      projectId: clamp(input.projectId, 128),
      clientEmail: normalizeEmail(input.clientEmail),
      clientUid: clamp(input.clientUid, 128),
      clientName: clamp(input.clientName, 120) || 'Cliente',
      clientFilled: Boolean(input.clientFilled),
      adminFilled: Boolean(input.adminFilled),
      clientData: sanitizeClientData(input.clientData),
      contractorData: sanitizeContractorData(input.contractorData),
      termsData: sanitizeTermsData(input.termsData),
      specificData: sanitizeSpecificData(input.specificData),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateContractClientData(
  contract: ServiceContract,
  userUid: string,
  clientData: ContractClientData
): Promise<void> {
  const path = `contracts/${contract.id}`;
  try {
    const clean = sanitizeClientData(clientData);
    const resolvedName =
      clean.personType === 'PJ'
        ? clamp(clean.companyName || contract.clientName, 120) || contract.clientName
        : clamp(clean.fullName || contract.clientName, 120) || contract.clientName;
    const nextStatus: ContractStatus = contract.adminFilled
      ? 'pronto'
      : 'aguardando_admin';

    const ref = doc(db, 'contracts', contract.id);
    // Strictly only the 6 keys allowed by firestore.rules for assigned client update
    await updateDoc(ref, {
      clientUid: contract.clientUid || userUid,
      clientName: resolvedName,
      clientData: clean,
      clientFilled: true,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContractAsAdmin(contractId: string): Promise<void> {
  const path = `contracts/${contractId}`;
  try {
    await deleteDoc(doc(db, 'contracts', contractId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
