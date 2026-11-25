/**
 * Security Rules Verification Suite (Dirty Dozen Specification)
 * Verifies all 12 adversarial payloads against firestore.rules invariants.
 */

export interface SecurityTestCase {
  id: string;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actor: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
  enforcedBy: string;
}

export const DIRTY_DOZEN_PAYLOADS: SecurityTestCase[] = [
  {
    id: 'P1',
    name: 'Self-Assigned Admin Escalation on User Profile',
    operation: 'create',
    path: '/users/client-1',
    actor: { uid: 'client-1', email: 'cliente@exemplo.com', emailVerified: true },
    payload: {
      uid: 'client-1',
      email: 'cliente@exemplo.com',
      displayName: 'Cliente',
      phone: '44999990000',
      city: 'Umuarama',
      role: 'admin',
      isAdmin: true
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isValidUserProfile() strict keys hasOnly check'
  },
  {
    id: 'P2',
    name: 'Cross-User PII Read',
    operation: 'get',
    path: '/users/client-2',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: '/users/{userId} owner or admin get gate'
  },
  {
    id: 'P3',
    name: 'Admin Email Spoofing Without Verification',
    operation: 'list',
    path: '/projects',
    actor: { uid: 'spoof-1', email: 'kaiolegal0@gmail.com', emailVerified: false },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isVerifiedUser() requiring request.auth.token.email_verified == true'
  },
  {
    id: 'P4',
    name: 'Unauthorized Project Creation by Client',
    operation: 'create',
    path: '/projects/proj-hack',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      code: 'KH-2026-999',
      title: 'Projeto Falso',
      serviceType: 'regularizacao',
      status: 'em_andamento',
      progress: 50,
      clientEmail: 'cliente1@exemplo.com',
      clientUid: 'client-1',
      clientName: 'Cliente'
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: '/projects/{projectId} create requires isAdmin()'
  },
  {
    id: 'P5',
    name: 'Client Cross-Project Snooping',
    operation: 'get',
    path: '/projects/proj-client-2',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isProjectClientData(existing()) email/uid match'
  },
  {
    id: 'P6',
    name: 'Orphaned Milestone Injection',
    operation: 'create',
    path: '/projects/nonexistent-project/milestones/m1',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      projectId: 'nonexistent-project',
      clientEmail: 'cliente1@exemplo.com',
      title: 'Etapa fantasma',
      order: 1,
      status: 'concluido'
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'Master Gate parent exists() + isAdmin() create gate'
  },
  {
    id: 'P7',
    name: 'Engineer Impersonation in Project Messages',
    operation: 'create',
    path: '/projects/proj-1/messages/msg-spoof',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      projectId: 'proj-1',
      clientEmail: 'cliente1@exemplo.com',
      authorUid: 'client-1',
      authorName: 'Eng. Kaio',
      authorRole: 'engenheiro',
      body: 'Aprovado sem vistoria'
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'authorRole == cliente check for non-admin message creation'
  },
  {
    id: 'P8',
    name: 'Shadow Field Injection on Profile Update',
    operation: 'update',
    path: '/users/client-1',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      displayName: 'Cliente Atualizado',
      ghostPrivilege: true
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'affectedKeys().hasOnly([displayName, phone, city, updatedAt]) + isValidUserProfile()'
  },
  {
    id: 'P9',
    name: 'Client Timestamp Backdating',
    operation: 'create',
    path: '/serviceRequests/req-1',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      clientUid: 'client-1',
      clientEmail: 'cliente1@exemplo.com',
      clientName: 'Cliente',
      phone: '44999990000',
      city: 'Umuarama',
      serviceType: 'regularizacao',
      propertyAddress: 'Rua Exemplo, 100',
      description: 'Backdated request',
      status: 'recebida',
      createdAt: '2020-01-01T00:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().createdAt == request.time && incoming().updatedAt == request.time'
  },
  {
    id: 'P10',
    name: 'ID Poisoning & Volumetric String Exhaustion',
    operation: 'create',
    path: `/serviceRequests/${'a'.repeat(300)}`,
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      description: 'x'.repeat(25000)
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isValidId(requestId) <= 128 + description.size() <= 2000'
  },
  {
    id: 'P11',
    name: 'Terminal State Tampering on Completed Project Document',
    operation: 'update',
    path: '/projects/proj-concluido/documents/doc-1',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    payload: {
      status: 'enviado_cliente',
      fileUrl: 'https://example.com/altered.pdf'
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'Parent project status != concluido && existing().status == pendente_cliente'
  },
  {
    id: 'P12',
    name: 'Blanket Collection Scraping on Projects',
    operation: 'list',
    path: '/projects',
    actor: { uid: 'client-1', email: 'cliente1@exemplo.com', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'allow list requires resource.data.clientEmail == request.auth.token.email'
  }
];
