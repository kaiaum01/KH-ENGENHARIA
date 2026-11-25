import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendEmailVerification,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  db,
  getSecondaryAuth,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  BLUEPRINT_LIMITS,
  BLUEPRINT_PATTERNS,
  buildFirestoreSafeId,
  mapFirebaseAuthErrorPtBr,
  sanitizeEmail,
  sanitizeProjectCode,
  sanitizeText,
  validateFileUrl,
} from './validation';
import {
  DEFAULT_MILESTONES_BY_SERVICE,
  type AccessRequest,
  type ClientAccount,
  type ClientAccountStatus,
  type ClientAuthMethod,
  type DocumentCategory,
  type DocumentStatus,
  type MilestoneStatus,
  type Project,
  type ProjectDocument,
  type ProjectMilestone,
  type ProjectStatus,
  type ServiceRequestStatus,
  type ServiceType,
  type UserProfile,
} from '../types/portal';

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const email = sanitizeEmail(user.email || '');
    const displayName = sanitizeText(
      user.displayName || email.split('@')[0] || 'Cliente',
      BLUEPRINT_LIMITS.displayName
    );

    const payload = {
      uid: user.uid,
      email,
      displayName,
      phone: '',
      city: 'Umuarama, PR',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    return {
      uid: user.uid,
      email,
      displayName,
      phone: '',
      city: 'Umuarama, PR',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function checkAdminDocument(uid: string): Promise<boolean> {
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function updateUserProfile(
  uid: string,
  input: { displayName: string; phone: string; city: string }
): Promise<void> {
  const path = `users/${uid}`;
  const displayName = sanitizeText(input.displayName, BLUEPRINT_LIMITS.displayName);
  if (!displayName) {
    throw new Error('Informe seu nome completo.');
  }

  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName,
      phone: sanitizeText(input.phone, BLUEPRINT_LIMITS.phone),
      city: sanitizeText(input.city, BLUEPRINT_LIMITS.city),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Sets or updates the Administrator's Email/Password credential on their active Firebase Auth account.
 * If signed in via Google, links an EmailAuthProvider credential so email+password login works
 * while preserving emailVerified=true.
 */
export async function setOrUpdateAdminPassword(user: User, newPassword: string): Promise<void> {
  if (!user.email) {
    throw new Error('Sua conta não possui um e-mail associado.');
  }
  if (newPassword.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }

  const hasPasswordProvider = user.providerData.some((p) => p.providerId === 'password');
  try {
    if (hasPasswordProvider) {
      await updatePassword(user, newPassword);
    } else {
      const credential = EmailAuthProvider.credential(user.email, newPassword);
      await linkWithCredential(user, credential);
    }
  } catch (err) {
    const mapped = mapFirebaseAuthErrorPtBr(err);
    throw new Error(mapped);
  }
}

// =============================================================================
// CLIENT ACCOUNTS & APPROVAL WORKFLOW (/clients & /accessRequests)
// =============================================================================

export interface CreateClientAccountInput {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  authMethod: ClientAuthMethod;
  password?: string;
  existingUid?: string;
  sourceAccessRequestId?: string;
}

export interface CreateClientResult {
  clientId: string;
  email: string;
  authCreated: boolean;
  verificationEmailSent: boolean;
}

export async function createClientAccountAsAdmin(
  adminUid: string,
  input: CreateClientAccountInput
): Promise<CreateClientResult> {
  const displayName = sanitizeText(input.displayName, BLUEPRINT_LIMITS.displayName);
  const email = sanitizeEmail(input.email);
  const phone = sanitizeText(input.phone, BLUEPRINT_LIMITS.phone);
  const city = sanitizeText(input.city, BLUEPRINT_LIMITS.city);
  const notes = sanitizeText(input.notes, BLUEPRINT_LIMITS.clientNotes);

  if (displayName.length < 2) throw new Error('Informe o nome completo do cliente.');
  if (!BLUEPRINT_PATTERNS.email.test(email)) throw new Error('Informe um e-mail válido.');

  let resolvedUid = input.existingUid && BLUEPRINT_PATTERNS.id.test(input.existingUid)
    ? input.existingUid
    : '';
  let authCreated = false;
  let verificationEmailSent = false;

  if (input.authMethod === 'email_senha') {
    const password = input.password || '';
    if (password.length < 6) {
      throw new Error('Defina uma senha inicial com pelo menos 6 caracteres para o cliente.');
    }

    const secondaryAuth = getSecondaryAuth();
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      resolvedUid = cred.user.uid;
      authCreated = true;

      try {
        await updateProfile(cred.user, { displayName });
      } catch {
        // Optional display name update
      }

      try {
        await sendEmailVerification(cred.user);
        verificationEmailSent = true;
      } catch {
        // Verification email can also be resent by the client on first login
      }
    } catch (err) {
      const mapped = mapFirebaseAuthErrorPtBr(err);
      if (mapped === 'AUTH_EMAIL_PASSWORD_DISABLED') {
        throw new Error('AUTH_EMAIL_PASSWORD_DISABLED');
      }
      throw new Error(mapped);
    } finally {
      try {
        await firebaseSignOut(secondaryAuth);
      } catch {
        // Ignore secondary signout cleanup error
      }
    }
  }

  const clientId = resolvedUid || buildFirestoreSafeId('cli');
  const path = `clients/${clientId}`;

  try {
    await setDoc(doc(db, 'clients', clientId), {
      uid: resolvedUid,
      email,
      displayName,
      phone,
      city,
      notes,
      authMethod: input.authMethod,
      status: 'aprovado' as ClientAccountStatus,
      approvedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (input.sourceAccessRequestId) {
      await updateDoc(doc(db, 'accessRequests', input.sourceAccessRequestId), {
        status: 'aprovada',
        adminNotes: 'Acesso aprovado e conta de cliente liberada.',
        updatedAt: serverTimestamp(),
      });
    }

    return {
      clientId,
      email,
      authCreated,
      verificationEmailSent,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function approveAccessRequestWithGoogle(
  adminUid: string,
  req: AccessRequest
): Promise<string> {
  const clientId = req.applicantUid;
  const path = `clients/${clientId}`;

  try {
    await setDoc(doc(db, 'clients', clientId), {
      uid: req.applicantUid,
      email: sanitizeEmail(req.email),
      displayName: sanitizeText(req.displayName, BLUEPRINT_LIMITS.displayName),
      phone: sanitizeText(req.phone, BLUEPRINT_LIMITS.phone),
      city: sanitizeText(req.city, BLUEPRINT_LIMITS.city),
      notes: sanitizeText(req.message, BLUEPRINT_LIMITS.clientNotes),
      authMethod: 'google' as ClientAuthMethod,
      status: 'aprovado' as ClientAccountStatus,
      approvedBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'accessRequests', req.id), {
      status: 'aprovada',
      adminNotes: 'Aprovado pelo administrador.',
      updatedAt: serverTimestamp(),
    });

    return clientId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function declineAccessRequest(
  requestId: string,
  adminNotes: string
): Promise<void> {
  const path = `accessRequests/${requestId}`;
  try {
    await updateDoc(doc(db, 'accessRequests', requestId), {
      status: 'recusada',
      adminNotes: sanitizeText(adminNotes || 'Solicitação recusada pelo administrador.', BLUEPRINT_LIMITS.adminNotes),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateClientAccountAsAdmin(
  clientId: string,
  updates: Partial<Pick<ClientAccount, 'displayName' | 'phone' | 'city' | 'notes' | 'status'>>
): Promise<void> {
  const path = `clients/${clientId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.displayName !== undefined) {
    const clean = sanitizeText(updates.displayName, BLUEPRINT_LIMITS.displayName);
    if (clean.length < 2) throw new Error('Nome do cliente inválido.');
    payload.displayName = clean;
  }
  if (updates.phone !== undefined) {
    payload.phone = sanitizeText(updates.phone, BLUEPRINT_LIMITS.phone);
  }
  if (updates.city !== undefined) {
    payload.city = sanitizeText(updates.city, BLUEPRINT_LIMITS.city);
  }
  if (updates.notes !== undefined) {
    payload.notes = sanitizeText(updates.notes, BLUEPRINT_LIMITS.clientNotes);
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  try {
    await updateDoc(doc(db, 'clients', clientId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClientAccountAsAdmin(clientId: string): Promise<void> {
  const path = `clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function bindClientUidToClientRecord(
  clientRecord: ClientAccount,
  uid: string
): Promise<void> {
  if (clientRecord.uid || clientRecord.status !== 'aprovado') return;
  try {
    await updateDoc(doc(db, 'clients', clientRecord.id), {
      uid,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking opportunistic binding
  }
}

export async function submitAccessRequest(
  user: User,
  input: {
    displayName: string;
    phone: string;
    city: string;
    serviceInterest: ServiceType;
    message: string;
  }
): Promise<string> {
  const id = buildFirestoreSafeId('acc');
  const path = `accessRequests/${id}`;

  const displayName = sanitizeText(input.displayName, BLUEPRINT_LIMITS.displayName);
  const phone = sanitizeText(input.phone, BLUEPRINT_LIMITS.phone);
  const city = sanitizeText(input.city, BLUEPRINT_LIMITS.city);
  const message = sanitizeText(input.message, BLUEPRINT_LIMITS.accessMessage);

  if (displayName.length < 2) throw new Error('Informe seu nome completo.');
  if (phone.length < 6) throw new Error('Informe um WhatsApp ou telefone válido.');
  if (city.length < 2) throw new Error('Informe sua cidade.');

  try {
    await setDoc(doc(db, 'accessRequests', id), {
      applicantUid: user.uid,
      email: sanitizeEmail(user.email || ''),
      displayName,
      phone,
      city,
      serviceInterest: input.serviceInterest,
      message,
      status: 'pendente',
      adminNotes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// =============================================================================
// SERVICE REQUESTS (/serviceRequests)
// =============================================================================

export async function createServiceRequest(
  user: User,
  input: {
    clientName: string;
    phone: string;
    city: string;
    serviceType: ServiceType;
    propertyAddress: string;
    description: string;
  }
): Promise<string> {
  const id = buildFirestoreSafeId('req');
  const path = `serviceRequests/${id}`;

  const clientName = sanitizeText(input.clientName, BLUEPRINT_LIMITS.displayName);
  const phone = sanitizeText(input.phone, BLUEPRINT_LIMITS.phone);
  const city = sanitizeText(input.city, BLUEPRINT_LIMITS.city);
  const propertyAddress = sanitizeText(input.propertyAddress, BLUEPRINT_LIMITS.propertyAddress);
  const description = sanitizeText(input.description, BLUEPRINT_LIMITS.description);

  if (clientName.length < 2) throw new Error('Informe o nome completo (mínimo 2 caracteres).');
  if (phone.length < 6) throw new Error('Informe um telefone ou WhatsApp válido.');
  if (city.length < 2) throw new Error('Informe a cidade do imóvel.');
  if (propertyAddress.length < 3) throw new Error('Informe o endereço ou referência do imóvel.');
  if (description.length < 5) throw new Error('Descreva brevemente o que você precisa (mínimo 5 caracteres).');

  try {
    await setDoc(doc(db, 'serviceRequests', id), {
      clientUid: user.uid,
      clientEmail: sanitizeEmail(user.email || ''),
      clientName,
      phone,
      city,
      serviceType: input.serviceType,
      propertyAddress,
      description,
      status: 'recebida',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateServiceRequestStatus(
  requestId: string,
  status: ServiceRequestStatus
): Promise<void> {
  const path = `serviceRequests/${requestId}`;
  try {
    await updateDoc(doc(db, 'serviceRequests', requestId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =============================================================================
// PROJECTS & SUBCOLLECTIONS (/projects)
// =============================================================================

export interface ProjectInput {
  code: string;
  title: string;
  serviceType: ServiceType;
  status: ProjectStatus;
  progress: number;
  clientEmail: string;
  clientUid?: string;
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
}

export async function createProject(
  adminUid: string,
  input: ProjectInput,
  options?: { addDefaultMilestones?: boolean; sourceRequestId?: string }
): Promise<string> {
  const projectId = buildFirestoreSafeId('proj');
  const path = `projects/${projectId}`;

  const code = sanitizeProjectCode(input.code);
  const title = sanitizeText(input.title, BLUEPRINT_LIMITS.title);
  const clientEmail = sanitizeEmail(input.clientEmail);
  const clientName = sanitizeText(input.clientName, BLUEPRINT_LIMITS.displayName);
  const propertyAddress = sanitizeText(input.propertyAddress, BLUEPRINT_LIMITS.propertyAddress);
  const city = sanitizeText(input.city, BLUEPRINT_LIMITS.city);

  if (code.length < 3 || !BLUEPRINT_PATTERNS.projectCode.test(code)) {
    throw new Error('Código do projeto inválido. Use letras maiúsculas, números e hífen (ex.: KH-2026-001).');
  }
  if (title.length < 3) throw new Error('Informe um título para o projeto.');
  if (!BLUEPRINT_PATTERNS.email.test(clientEmail)) throw new Error('Informe um e-mail válido do cliente.');
  if (clientName.length < 2) throw new Error('Informe o nome do cliente.');
  if (propertyAddress.length < 3) throw new Error('Informe o endereço do imóvel.');
  if (city.length < 2) throw new Error('Informe a cidade.');

  const progress = Math.max(0, Math.min(100, Math.round(Number(input.progress) || 0)));
  const areaSqm = Math.max(0, Math.min(1000000, Number(input.areaSqm) || 0));

  try {
    await setDoc(doc(db, 'projects', projectId), {
      code,
      title,
      serviceType: input.serviceType,
      status: input.status,
      progress,
      clientEmail,
      clientUid: input.clientUid && BLUEPRINT_PATTERNS.id.test(input.clientUid) ? input.clientUid : '',
      clientName,
      clientPhone: sanitizeText(input.clientPhone, BLUEPRINT_LIMITS.phone),
      propertyAddress,
      city,
      areaSqm,
      artNumber: sanitizeText(input.artNumber, BLUEPRINT_LIMITS.artNumber),
      protocolNumber: sanitizeText(input.protocolNumber, BLUEPRINT_LIMITS.protocolNumber),
      summary: sanitizeText(input.summary, BLUEPRINT_LIMITS.summary),
      nextStep: sanitizeText(input.nextStep, BLUEPRINT_LIMITS.nextStep),
      estimatedDelivery: sanitizeText(input.estimatedDelivery, BLUEPRINT_LIMITS.estimatedDelivery),
      createdBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (options?.addDefaultMilestones) {
      const defaults = DEFAULT_MILESTONES_BY_SERVICE[input.serviceType] || [];
      if (defaults.length > 0) {
        const batch = writeBatch(db);
        defaults.forEach((item, index) => {
          const mId = buildFirestoreSafeId(`etapa${index + 1}`);
          batch.set(doc(db, 'projects', projectId, 'milestones', mId), {
            projectId,
            clientEmail,
            title: sanitizeText(item.title, BLUEPRINT_LIMITS.title),
            description: sanitizeText(item.description, BLUEPRINT_LIMITS.milestoneDescription),
            order: index + 1,
            status: index === 0 ? 'em_andamento' : 'pendente',
            dueDate: '',
            completedDate: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    }

    if (options?.sourceRequestId) {
      await updateServiceRequestStatus(options.sourceRequestId, 'convertida');
    }

    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(
  projectId: string,
  previousClientEmail: string,
  input: ProjectInput
): Promise<void> {
  const path = `projects/${projectId}`;
  const code = sanitizeProjectCode(input.code);
  const title = sanitizeText(input.title, BLUEPRINT_LIMITS.title);
  const clientEmail = sanitizeEmail(input.clientEmail);
  const clientName = sanitizeText(input.clientName, BLUEPRINT_LIMITS.displayName);
  const propertyAddress = sanitizeText(input.propertyAddress, BLUEPRINT_LIMITS.propertyAddress);
  const city = sanitizeText(input.city, BLUEPRINT_LIMITS.city);

  if (code.length < 3 || !BLUEPRINT_PATTERNS.projectCode.test(code)) {
    throw new Error('Código do projeto inválido.');
  }
  if (title.length < 3) throw new Error('Informe um título para o projeto.');
  if (!BLUEPRINT_PATTERNS.email.test(clientEmail)) throw new Error('Informe um e-mail válido do cliente.');

  const progress = Math.max(0, Math.min(100, Math.round(Number(input.progress) || 0)));
  const areaSqm = Math.max(0, Math.min(1000000, Number(input.areaSqm) || 0));

  try {
    await updateDoc(doc(db, 'projects', projectId), {
      code,
      title,
      serviceType: input.serviceType,
      status: input.status,
      progress,
      clientEmail,
      clientUid:
        clientEmail !== previousClientEmail
          ? ''
          : input.clientUid && BLUEPRINT_PATTERNS.id.test(input.clientUid)
            ? input.clientUid
            : '',
      clientName,
      clientPhone: sanitizeText(input.clientPhone, BLUEPRINT_LIMITS.phone),
      propertyAddress,
      city,
      areaSqm,
      artNumber: sanitizeText(input.artNumber, BLUEPRINT_LIMITS.artNumber),
      protocolNumber: sanitizeText(input.protocolNumber, BLUEPRINT_LIMITS.protocolNumber),
      summary: sanitizeText(input.summary, BLUEPRINT_LIMITS.summary),
      nextStep: sanitizeText(input.nextStep, BLUEPRINT_LIMITS.nextStep),
      estimatedDelivery: sanitizeText(input.estimatedDelivery, BLUEPRINT_LIMITS.estimatedDelivery),
      updatedAt: serverTimestamp(),
    });

    if (clientEmail !== previousClientEmail) {
      const [mSnap, dSnap] = await Promise.all([
        getDocs(collection(db, 'projects', projectId, 'milestones')),
        getDocs(collection(db, 'projects', projectId, 'documents')),
      ]);
      const batch = writeBatch(db);
      mSnap.forEach((docSnap) => {
        batch.update(docSnap.ref, { clientEmail, updatedAt: serverTimestamp() });
      });
      dSnap.forEach((docSnap) => {
        batch.update(docSnap.ref, { clientEmail, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function bindClientUidToProject(project: Project, uid: string): Promise<void> {
  if (project.clientUid || project.status === 'concluido') return;
  try {
    await updateDoc(doc(db, 'projects', project.id), {
      clientUid: uid,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking opportunistic binding
  }
}

export async function deleteProjectWithSubcollections(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    const [mSnap, dSnap, msgSnap] = await Promise.all([
      getDocs(collection(db, 'projects', projectId, 'milestones')),
      getDocs(collection(db, 'projects', projectId, 'documents')),
      getDocs(collection(db, 'projects', projectId, 'messages')),
    ]);
    const batch = writeBatch(db);
    mSnap.forEach((s) => batch.delete(s.ref));
    dSnap.forEach((s) => batch.delete(s.ref));
    msgSnap.forEach((s) => batch.delete(s.ref));
    batch.delete(doc(db, 'projects', projectId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createMilestone(
  project: Project,
  input: {
    title: string;
    description: string;
    order: number;
    status: MilestoneStatus;
    dueDate: string;
  }
): Promise<string> {
  const id = buildFirestoreSafeId('etapa');
  const path = `projects/${project.id}/milestones/${id}`;
  const title = sanitizeText(input.title, BLUEPRINT_LIMITS.title);
  if (title.length < 2) throw new Error('Informe o nome da etapa.');

  try {
    await setDoc(doc(db, 'projects', project.id, 'milestones', id), {
      projectId: project.id,
      clientEmail: project.clientEmail,
      title,
      description: sanitizeText(input.description, BLUEPRINT_LIMITS.milestoneDescription),
      order: Math.max(0, Math.min(100, Math.round(Number(input.order) || 1))),
      status: input.status,
      dueDate: sanitizeText(input.dueDate, BLUEPRINT_LIMITS.dateField),
      completedDate: input.status === 'concluido' ? new Date().toISOString().slice(0, 10) : '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMilestoneStatus(
  projectId: string,
  milestoneId: string,
  status: MilestoneStatus,
  allMilestones: ProjectMilestone[]
): Promise<void> {
  const path = `projects/${projectId}/milestones/${milestoneId}`;
  const completedDate = status === 'concluido' ? new Date().toISOString().slice(0, 10) : '';

  try {
    await updateDoc(doc(db, 'projects', projectId, 'milestones', milestoneId), {
      status,
      completedDate,
      updatedAt: serverTimestamp(),
    });

    if (allMilestones.length > 0) {
      const completedCount = allMilestones.filter((m) =>
        m.id === milestoneId ? status === 'concluido' : m.status === 'concluido'
      ).length;
      const newProgress = Math.round((completedCount / allMilestones.length) * 100);
      await updateDoc(doc(db, 'projects', projectId), {
        progress: newProgress,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
  const path = `projects/${projectId}/milestones/${milestoneId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'milestones', milestoneId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createProjectDocument(
  project: Project,
  user: User,
  isAdmin: boolean,
  input: {
    title: string;
    category: DocumentCategory;
    revision: string;
    status: DocumentStatus;
    fileUrl: string;
    notes: string;
  }
): Promise<string> {
  const id = buildFirestoreSafeId('doc');
  const path = `projects/${project.id}/documents/${id}`;
  const title = sanitizeText(input.title, BLUEPRINT_LIMITS.title);
  if (title.length < 2) throw new Error('Informe o título do documento.');

  const urlCheck = validateFileUrl(input.fileUrl);
  if (!urlCheck.valid) {
    throw new Error(urlCheck.error);
  }

  try {
    await setDoc(doc(db, 'projects', project.id, 'documents', id), {
      projectId: project.id,
      clientEmail: project.clientEmail,
      title,
      category: isAdmin ? input.category : 'documento_cliente',
      revision: sanitizeText(input.revision || 'Rev. 01', BLUEPRINT_LIMITS.revision),
      status: isAdmin ? input.status : 'enviado_cliente',
      fileUrl: urlCheck.value,
      notes: sanitizeText(input.notes, BLUEPRINT_LIMITS.notes),
      uploadedByRole: isAdmin ? 'engenheiro' : 'cliente',
      uploadedByUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fulfillClientDocument(
  projectId: string,
  documentId: string,
  input: { fileUrl: string; notes: string }
): Promise<void> {
  const path = `projects/${projectId}/documents/${documentId}`;
  const urlCheck = validateFileUrl(input.fileUrl);
  if (!urlCheck.valid) {
    throw new Error(urlCheck.error);
  }

  try {
    await updateDoc(doc(db, 'projects', projectId, 'documents', documentId), {
      fileUrl: urlCheck.value,
      notes: sanitizeText(input.notes, BLUEPRINT_LIMITS.notes),
      status: 'enviado_cliente',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateDocumentAsAdmin(
  projectId: string,
  documentId: string,
  updates: Partial<Pick<ProjectDocument, 'status' | 'fileUrl' | 'notes' | 'revision'>>
): Promise<void> {
  const path = `projects/${projectId}/documents/${documentId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.revision !== undefined) {
    payload.revision = sanitizeText(updates.revision, BLUEPRINT_LIMITS.revision);
  }
  if (updates.notes !== undefined) {
    payload.notes = sanitizeText(updates.notes, BLUEPRINT_LIMITS.notes);
  }
  if (updates.fileUrl !== undefined) {
    const urlCheck = validateFileUrl(updates.fileUrl);
    if (!urlCheck.valid) throw new Error(urlCheck.error);
    payload.fileUrl = urlCheck.value;
  }

  try {
    await updateDoc(doc(db, 'projects', projectId, 'documents', documentId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProjectDocument(projectId: string, documentId: string): Promise<void> {
  const path = `projects/${projectId}/documents/${documentId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId, 'documents', documentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function sendProjectMessage(
  project: Project,
  user: User,
  isAdmin: boolean,
  authorName: string,
  body: string
): Promise<string> {
  const id = buildFirestoreSafeId('msg');
  const path = `projects/${project.id}/messages/${id}`;
  const cleanBody = sanitizeText(body, BLUEPRINT_LIMITS.messageBody);
  if (!cleanBody) throw new Error('Digite uma mensagem antes de enviar.');

  try {
    await setDoc(doc(db, 'projects', project.id, 'messages', id), {
      projectId: project.id,
      clientEmail: project.clientEmail,
      authorUid: user.uid,
      authorName: sanitizeText(authorName || 'Usuário', BLUEPRINT_LIMITS.displayName),
      authorRole: isAdmin ? 'engenheiro' : 'cliente',
      body: cleanBody,
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function seedSampleEngineeringProject(adminUser: User): Promise<string> {
  const clientEmail = sanitizeEmail(adminUser.email || 'kaiolegal0@gmail.com');
  const projectId = await createProject(adminUser.uid, {
    code: 'KH-2026-001',
    title: 'Residência Unifamiliar · Projeto Arquitetônico e Complementares',
    serviceType: 'arquitetonico',
    status: 'em_andamento',
    progress: 60,
    clientEmail,
    clientUid: adminUser.uid,
    clientName: adminUser.displayName || 'Kaio Henrique (Demonstração)',
    clientPhone: '(44) 99745-3807',
    propertyAddress: 'Zona III · Loteamento Residencial, Umuarama',
    city: 'Umuarama, PR',
    areaSqm: 168.5,
    artNumber: 'PR20260418291',
    protocolNumber: 'PMU-2026/08412',
    summary:
      'Projeto arquitetônico residencial térreo compatibilizado com modelagem elétrica 3D e documentação para aprovação junto à Prefeitura de Umuarama.',
    nextStep: 'Conferência final da fachada e envio da matrícula atualizada do lote.',
    estimatedDelivery: '2026-12-18',
  });

  const batch = writeBatch(db);
  const sampleMilestones: Array<{
    title: string;
    description: string;
    order: number;
    status: MilestoneStatus;
    dueDate: string;
    completedDate: string;
  }> = [
    {
      title: 'Briefing e análise do terreno',
      description: 'Levantamento das medidas do lote, taxa de ocupação e recuos municipais.',
      order: 1,
      status: 'concluido',
      dueDate: '2026-11-05',
      completedDate: '2026-11-04',
    },
    {
      title: 'Planta baixa e estudo preliminar',
      description: 'Distribuição dos ambientes, insolação e dimensionamento preliminar aprovados.',
      order: 2,
      status: 'concluido',
      dueDate: '2026-11-15',
      completedDate: '2026-11-14',
    },
    {
      title: 'Modelagem elétrica e compatibilização',
      description: 'Traçado 3D dos eletrodutos, quadro de distribuição e pontos elétricos.',
      order: 3,
      status: 'concluido',
      dueDate: '2026-11-22',
      completedDate: '2026-11-21',
    },
    {
      title: 'Emissão da ART e protocolo na Prefeitura',
      description: 'Protocolo digital com memorial descritivo e ART CREA-PR registrada.',
      order: 4,
      status: 'em_andamento',
      dueDate: '2026-12-05',
      completedDate: '',
    },
    {
      title: 'Entrega final de pranchas executivas',
      description: 'Liberação das pranchas finais aprovadas para início de obra.',
      order: 5,
      status: 'pendente',
      dueDate: '2026-12-18',
      completedDate: '',
    },
  ];

  sampleMilestones.forEach((m) => {
    const mId = buildFirestoreSafeId(`m${m.order}`);
    batch.set(doc(db, 'projects', projectId, 'milestones', mId), {
      projectId,
      clientEmail,
      ...m,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const sampleDocs: Array<{
    title: string;
    category: DocumentCategory;
    revision: string;
    status: DocumentStatus;
    fileUrl: string;
    notes: string;
  }> = [
    {
      title: 'Planta baixa arquitetônica — Prancha 01/03',
      category: 'planta',
      revision: 'Rev. 02',
      status: 'aprovado',
      fileUrl: '/projetos/planta.png',
      notes: 'Distribuição final dos ambientes com cotas atualizadas.',
    },
    {
      title: 'Modelagem 3D de instalações elétricas',
      category: 'planta',
      revision: 'Rev. 01',
      status: 'disponivel',
      fileUrl: '/projetos/instalacoes.png',
      notes: 'Compatibilização de eletrodutos e pontos de carga.',
    },
    {
      title: 'Perspectiva da fachada residencial',
      category: 'planta',
      revision: 'Rev. 01',
      status: 'disponivel',
      fileUrl: '/projetos/residencia.png',
      notes: 'Renderização de volumetria e acabamentos externos.',
    },
    {
      title: 'Matrícula atualizada do imóvel e carnê IPTU',
      category: 'documento_cliente',
      revision: 'Original',
      status: 'pendente_cliente',
      fileUrl: '',
      notes: 'Necessário anexar link (PDF/Drive) ou enviar para anexarmos ao protocolo da prefeitura.',
    },
  ];

  sampleDocs.forEach((d, idx) => {
    const dId = buildFirestoreSafeId(`doc${idx + 1}`);
    batch.set(doc(db, 'projects', projectId, 'documents', dId), {
      projectId,
      clientEmail,
      ...d,
      uploadedByRole: 'engenheiro',
      uploadedByUid: adminUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const msgId = buildFirestoreSafeId('msg1');
  batch.set(doc(db, 'projects', projectId, 'messages', msgId), {
    projectId,
    clientEmail,
    authorUid: adminUser.uid,
    authorName: 'Eng. Kaio Henrique',
    authorRole: 'engenheiro',
    body: 'Bem-vindo à Área do Cliente da KH Engenharia. As pranchas da planta baixa, modelagem elétrica e fachada já estão disponíveis na aba Documentos e Pranchas. Assim que possível, envie o link da matrícula atualizada para concluirmos o protocolo.',
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return projectId;
}

export async function countAdminProjects(): Promise<number> {
  const path = 'projects';
  try {
    const snap = await getDocs(query(collection(db, 'projects'), where('progress', '>=', 0)));
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
