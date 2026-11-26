import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { LogOut } from 'lucide-react';
import {
  auth,
  db,
  handleFirestoreError,
  isBootstrappedAdminUser,
  OperationType,
} from './lib/firebase';
import {
  bindClientUidToClientRecord,
  checkAdminDocument,
  ensureUserProfile,
  seedSampleEngineeringProject,
} from './lib/portalService';
import type {
  AccessRequest,
  ClientAccount,
  Project,
  ServiceRequest,
  UserProfile,
} from './types/portal';
import { AuthGate } from './components/AuthGate';
import { EmailVerificationGate } from './components/EmailVerificationGate';
import { ClientApprovalGate } from './components/ClientApprovalGate';
import type { PortalTab } from './components/Sidebar';
import { KhSiteFooter, KhSiteHeader } from './components/KhSiteHeader';
import { OverviewView } from './components/OverviewView';
import { AdminClientsView } from './components/AdminClientsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { RequestsView } from './components/RequestsView';
import { ProfileView } from './components/ProfileView';
import { ProjectFormModal } from './components/ProjectFormModal';
import { WindowsAppView } from './components/WindowsAppView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

function isAdminAppEntryPath(): boolean {
  if (typeof document !== 'undefined' && document.body?.dataset?.portalMode === 'admin') {
    return true;
  }
  if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
    return true;
  }
  return false;
}

export default function App() {
  const adminAppMode = useMemo(() => isAdminAppEntryPath(), []);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [emailVerifiedTick, setEmailVerifiedTick] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Client access verification state (for non-admin users)
  const [clientAccessReady, setClientAccessReady] = useState(false);
  const [clientRecord, setClientRecord] = useState<ClientAccount | null>(null);
  const [myAccessRequest, setMyAccessRequest] = useState<AccessRequest | null>(null);

  // Admin & Portal collections
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Admin modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [convertingRequest, setConvertingRequest] = useState<ServiceRequest | null>(null);
  const [projectForClient, setProjectForClient] = useState<ClientAccount | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setIsAdmin(false);
        setClientRecord(null);
        setMyAccessRequest(null);
        setClientAccessReady(false);
        setClients([]);
        setAccessRequests([]);
        setProjects([]);
        setRequests([]);
        setSelectedProjectId(null);
        setAuthReady(true);
        setDataLoading(false);
        return;
      }

      if (!nextUser.emailVerified) {
        setIsAdmin(false);
        setAuthReady(true);
        setDataLoading(false);
        return;
      }

      try {
        const [loadedProfile, hasAdminDoc] = await Promise.all([
          ensureUserProfile(nextUser),
          checkAdminDocument(nextUser.uid),
        ]);
        const resolvedAdmin = isBootstrappedAdminUser(nextUser) || hasAdminDoc;
        setProfile(loadedProfile);
        setIsAdmin(resolvedAdmin);
        setActiveTab(resolvedAdmin ? 'clients' : 'overview');
      } catch (err) {
        console.error('Erro ao inicializar perfil:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [emailVerifiedTick]);

  // Step A: For non-admin verified users, check real-time approval status in /clients & /accessRequests
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || isAdmin) {
      if (isAdmin) setClientAccessReady(true);
      return;
    }

    setClientAccessReady(false);
    const emailLower = (user.email || '').toLowerCase();

    let gotClients = false;
    let gotAccessReq = false;
    const maybeReady = () => {
      if (gotClients && gotAccessReq) setClientAccessReady(true);
    };

    const unsubClientCheck = onSnapshot(
      query(collection(db, 'clients'), where('email', '==', emailLower)),
      (snap) => {
        const match = snap.docs[0]
          ? ({ id: snap.docs[0].id, ...(snap.docs[0].data() as Omit<ClientAccount, 'id'>) })
          : null;
        setClientRecord(match);
        if (match && match.status === 'aprovado' && !match.uid) {
          bindClientUidToClientRecord(match, user.uid);
        }
        gotClients = true;
        maybeReady();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
    );

    const unsubMyAccessReq = onSnapshot(
      query(collection(db, 'accessRequests'), where('applicantUid', '==', user.uid)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AccessRequest, 'id'>) }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setMyAccessRequest(list[0] || null);
        gotAccessReq = true;
        maybeReady();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'accessRequests')
    );

    return () => {
      unsubClientCheck();
      unsubMyAccessReq();
    };
  }, [authReady, user, isAdmin]);

  const isApprovedClient = !isAdmin && clientRecord?.status === 'aprovado';

  // Step B: Attach portal data listeners only for Admin OR approved Clients
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;
    if (!isAdmin && !isApprovedClient) return;

    setDataLoading(true);
    const emailLower = (user.email || '').toLowerCase();

    const projectsQuery: Query<DocumentData> = isAdmin
      ? query(collection(db, 'projects'))
      : query(collection(db, 'projects'), where('clientEmail', '==', emailLower));

    const requestsQuery: Query<DocumentData> = isAdmin
      ? query(collection(db, 'serviceRequests'))
      : query(collection(db, 'serviceRequests'), where('clientUid', '==', user.uid));

    let receivedProjects = false;
    let receivedRequests = false;
    let receivedClients = !isAdmin;
    let receivedAccessRequests = !isAdmin;

    const maybeStopLoading = () => {
      if (receivedProjects && receivedRequests && receivedClients && receivedAccessRequests) {
        setDataLoading(false);
      }
    };

    const unsubProjects = onSnapshot(
      projectsQuery,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Project, 'id'>) }))
          .sort((a, b) => {
            const ta = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
            const tb = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setProjects(items);
        receivedProjects = true;
        maybeStopLoading();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

    const unsubRequests = onSnapshot(
      requestsQuery,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceRequest, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setRequests(items);
        receivedRequests = true;
        maybeStopLoading();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'serviceRequests')
    );

    let unsubAdminClients = () => {};
    let unsubAdminAccessReqs = () => {};

    if (isAdmin) {
      unsubAdminClients = onSnapshot(
        query(collection(db, 'clients')),
        (snap) => {
          const items = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<ClientAccount, 'id'>) }))
            .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
          setClients(items);
          receivedClients = true;
          maybeStopLoading();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
      );

      unsubAdminAccessReqs = onSnapshot(
        query(collection(db, 'accessRequests')),
        (snap) => {
          const items = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<AccessRequest, 'id'>) }))
            .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
          setAccessRequests(items);
          receivedAccessRequests = true;
          maybeStopLoading();
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'accessRequests')
      );
    }

    return () => {
      unsubProjects();
      unsubRequests();
      unsubAdminClients();
      unsubAdminAccessReqs();
    };
  }, [authReady, user, isAdmin, isApprovedClient]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const pendingRequestsCount = useMemo(
    () => requests.filter((r) => r.status === 'recebida' || r.status === 'em_analise').length,
    [requests]
  );

  const pendingApprovalsCount = useMemo(
    () => accessRequests.filter((r) => r.status === 'pendente').length,
    [accessRequests]
  );

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSeedDemo = async () => {
    if (!user || !isAdmin) return;
    setSeedingDemo(true);
    try {
      const createdId = await seedSampleEngineeringProject(user);
      setActiveTab('projects');
      setSelectedProjectId(createdId);
    } finally {
      setSeedingDemo(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <img
            src="/projetos/kh-logo-metal.png"
            alt="Monograma KH"
            className="w-12 h-12 object-contain mx-auto opacity-85"
            referrerPolicy="no-referrer"
          />
          <p className="text-xs font-mono tracking-wider text-[#8f9991]">
            CARREGANDO PORTAL KH ENGENHARIA...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthGate adminAppMode={adminAppMode} />
        <OfflineIndicator />
      </>
    );
  }

  if (!user.emailVerified) {
    return (
      <EmailVerificationGate
        user={user}
        onVerified={() => setEmailVerifiedTick((t) => t + 1)}
        onSignOut={handleSignOut}
      />
    );
  }

  // Wait for client approval status before rendering client workspace
  if (!isAdmin && !clientAccessReady) {
    return (
      <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <img
            src="/projetos/kh-logo-metal.png"
            alt="Monograma KH"
            className="w-12 h-12 object-contain mx-auto opacity-85"
            referrerPolicy="no-referrer"
          />
          <p className="text-xs font-mono tracking-wider text-[#8f9991]">
            VERIFICANDO LIBERAÇÃO DO ACESSO...
          </p>
        </div>
      </div>
    );
  }

  // Enforce Admin approval for all non-admin clients
  if (!isAdmin && !isApprovedClient) {
    return (
      <ClientApprovalGate
        user={user}
        clientRecord={clientRecord}
        existingRequest={myAccessRequest}
        onSignOut={handleSignOut}
      />
    );
  }

  const displayUserName =
    profile?.displayName || clientRecord?.displayName || user.displayName || 'Cliente';
  const displayUserEmail = user.email || '';

  const breadcrumbLabel = (() => {
    if (selectedProject) {
      return `Projetos / ${selectedProject.code}`;
    }
    if (activeTab === 'clients') return 'Clientes e Aprovações';
    if (activeTab === 'overview' || activeTab === 'projects') {
      return isAdmin ? 'Projetos' : 'Meus Projetos';
    }
    if (activeTab === 'requests') return isAdmin ? 'Solicitações' : 'Nova Solicitação';
    if (activeTab === 'windows_app') return 'App Windows';
    return isAdmin ? 'Segurança e Senha' : 'Meus Dados e Senha';
  })();

  const handlePrimaryHeaderAction = () => {
    if (isAdmin) {
      setEditingProject(null);
      setConvertingRequest(null);
      setProjectForClient(null);
      setShowProjectModal(true);
    } else {
      setSelectedProjectId(null);
      setActiveTab('requests');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex flex-col">
      <KhSiteHeader
        variant="portal"
        isAdmin={isAdmin}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedProjectId(null);
        }}
        clientsCount={clients.length}
        pendingApprovalsCount={pendingApprovalsCount}
        projectsCount={projects.length}
        pendingRequestsCount={pendingRequestsCount}
        onPrimaryAction={handlePrimaryHeaderAction}
        onOpenWindowsGuide={() => {
          setSelectedProjectId(null);
          setActiveTab('windows_app');
        }}
      />

      {/* Quiet Account & Context Bar aligned to exact .kh-wrap width */}
      <div className="border-b border-[#232924] bg-[#0e110f]">
        <div className="kh-wrap py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#8f9991] min-w-0">
            <span className="font-mono text-[11px] tracking-[1px] uppercase text-[#a8baa4] shrink-0">
              {isAdmin ? 'Painel do Administrador' : 'Área do Cliente'}
            </span>
            <span className="text-[#4c554e]" aria-hidden="true">
              /
            </span>
            <span className="text-[#e3e7e1] font-medium truncate">{breadcrumbLabel}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {isAdmin && (
              <PWAInstallButton
                compact
                onOpenWindowsGuide={() => {
                  setSelectedProjectId(null);
                  setActiveTab('windows_app');
                }}
              />
            )}
            <span className="hidden sm:inline text-[#8f9991]">
              {displayUserName}
              {displayUserEmail ? ` · ${displayUserEmail}` : ''}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-[#aeb5ac] hover:text-[#f09d78] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content aligned to exact min(1200px, 88%) width of the homepage */}
      <main className="flex-1 py-10 sm:py-12">
        <div className="kh-wrap">
          {selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              user={user}
              userName={displayUserName}
              isAdmin={isAdmin}
              onBack={() => setSelectedProjectId(null)}
              onEditProject={(proj) => {
                setEditingProject(proj);
                setConvertingRequest(null);
                setProjectForClient(null);
                setShowProjectModal(true);
              }}
              onProjectDeleted={() => setSelectedProjectId(null)}
            />
          ) : isAdmin && activeTab === 'clients' ? (
            <AdminClientsView
              adminUid={user.uid}
              clients={clients}
              accessRequests={accessRequests}
              projects={projects}
              loading={dataLoading}
              onCreateProjectForClient={(client) => {
                setEditingProject(null);
                setConvertingRequest(null);
                setProjectForClient(client);
                setShowProjectModal(true);
              }}
            />
          ) : activeTab === 'overview' || activeTab === 'projects' ? (
            <OverviewView
              isAdmin={isAdmin}
              userName={displayUserName}
              projects={projects}
              requests={requests}
              loading={dataLoading}
              onOpenProject={(id) => {
                setActiveTab('projects');
                setSelectedProjectId(id);
              }}
              onNewProject={() => {
                setEditingProject(null);
                setConvertingRequest(null);
                setProjectForClient(null);
                setShowProjectModal(true);
              }}
              onNewRequest={() => setActiveTab('requests')}
              onSeedDemoProject={handleSeedDemo}
              seedingDemo={seedingDemo}
            />
          ) : activeTab === 'requests' ? (
            <RequestsView
              user={user}
              profile={profile}
              isAdmin={isAdmin}
              requests={requests}
              loading={dataLoading}
              onConvertRequest={(req) => {
                setEditingProject(null);
                setConvertingRequest(req);
                setProjectForClient(null);
                setShowProjectModal(true);
              }}
            />
          ) : isAdmin && activeTab === 'windows_app' ? (
            <WindowsAppView />
          ) : (
            <ProfileView
              user={user}
              profile={profile}
              isAdmin={isAdmin}
              onProfileUpdated={(updated) => setProfile(updated)}
            />
          )}
        </div>
      </main>

      <KhSiteFooter />

      {/* Create / Edit Project Modal (Admin) */}
      {isAdmin && showProjectModal && (
        <ProjectFormModal
          adminUid={user.uid}
          editingProject={editingProject}
          fromRequest={convertingRequest}
          fromClient={projectForClient}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
            setConvertingRequest(null);
            setProjectForClient(null);
          }}
          onSaved={(projectId) => {
            setShowProjectModal(false);
            setEditingProject(null);
            setConvertingRequest(null);
            setProjectForClient(null);
            if (projectId) {
              setActiveTab('projects');
              setSelectedProjectId(projectId);
            }
          }}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
