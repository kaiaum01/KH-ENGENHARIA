import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileSignature,
  FileText,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  SERVICE_TYPE_LABELS,
  type ClientAccount,
  type Project,
  type ServiceType,
} from '../types/portal';
import {
  CONTRACT_MODEL_SHORT,
  CONTRACT_STATUS_META,
  createDefaultClientData,
  createDefaultContractorData,
  createDefaultContractorSettings,
  createDefaultSpecificData,
  createDefaultTermsData,
  type ContractClientData,
  type ContractContractorData,
  type ContractSpecificData,
  type ContractStatus,
  type ContractTermsData,
  type ContractorSettings,
  type ServiceContract,
} from '../types/contracts';
import { brlToWordsPtBr, formatBrlNumber, parseBrlNumber } from '../lib/contractBuilder';
import { downloadContractDoc, downloadContractDocx } from '../lib/contractDocxExport';
import {
  createContractAsAdmin,
  deleteContractAsAdmin,
  saveContractorSettings,
  updateContractAsAdmin,
  updateContractClientData,
} from '../lib/contractService';
import { ContractClientFields } from './ContractClientFields';
import { ContractSpecificFields } from './ContractSpecificFields';
import { ContractPreviewModal } from './ContractPreviewModal';

interface ContractsViewProps {
  isAdmin: boolean;
  user: User;
  contracts: ServiceContract[];
  clients: ClientAccount[];
  projects: Project[];
  contractorSettings: ContractorSettings;
  onContractorSettingsSaved: (next: ContractorSettings) => void;
  loading: boolean;
}

type EditorStep = 'client' | 'contractor' | 'specific' | 'terms';

const inputCls =
  'w-full bg-[#0d100e] border border-[#2c342e] px-3.5 py-2.5 text-sm text-[#f0f1ed] placeholder:text-[#667068] focus:outline-none focus:border-[#9baf91] transition-colors';
const labelCls = 'block text-xs font-medium text-[#b9c2ba] mb-1.5';

const SERVICE_OPTIONS: ServiceType[] = [
  'regularizacao',
  'arquitetonico',
  'laudo_vistoria',
  'complementares',
  'acompanhamento',
];

function generateNextCode(existing: ServiceContract[]): string {
  const year = new Date().getFullYear();
  const nextNum = String(existing.length + 1).padStart(3, '0');
  return `CTR-${year}-${nextNum}`;
}

export function ContractsView({
  isAdmin,
  user,
  contracts,
  clients,
  projects,
  contractorSettings,
  onContractorSettingsSaved,
  loading,
}: ContractsViewProps) {
  // List filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState<ServiceType | 'todos'>('todos');

  // Preview modal
  const [previewContract, setPreviewContract] = useState<ServiceContract | null>(null);

  // Admin Contractor Defaults modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<ContractorSettings>(contractorSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Admin editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorStep, setEditorStep] = useState<EditorStep>('client');
  const [contractCode, setContractCode] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('regularizacao');
  const [projectId, setProjectId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientUid, setClientUid] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientFilled, setClientFilled] = useState(false);
  const [adminFilled, setAdminFilled] = useState(true);
  const [status, setStatus] = useState<ContractStatus>('aguardando_cliente');
  const [clientData, setClientData] = useState<ContractClientData>(createDefaultClientData());
  const [contractorData, setContractorData] = useState<ContractContractorData>(
    createDefaultContractorData(contractorSettings)
  );
  const [termsData, setTermsData] = useState<ContractTermsData>(
    createDefaultTermsData(contractorSettings)
  );
  const [specificData, setSpecificData] = useState<ContractSpecificData>(
    createDefaultSpecificData()
  );

  // Client fill view state
  const [activeClientContract, setActiveClientContract] = useState<ServiceContract | null>(null);
  const [clientFormDraft, setClientFormDraft] = useState<ContractClientData>(
    createDefaultClientData()
  );

  // Action feedback / loading states
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredContracts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return contracts.filter((c) => {
      if (filterModel !== 'todos' && c.serviceType !== filterModel) return false;
      if (!q) return true;
      return (
        c.contractCode.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.clientEmail.toLowerCase().includes(q) ||
        SERVICE_TYPE_LABELS[c.serviceType].toLowerCase().includes(q)
      );
    });
  }, [contracts, searchTerm, filterModel]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const awaitingClient = contracts.filter((c) => c.status === 'aguardando_cliente').length;
    const ready = contracts.filter((c) => c.status === 'pronto').length;
    const signed = contracts.filter((c) => c.status === 'assinado').length;
    return { total, awaitingClient, ready, signed };
  }, [contracts]);

  const openNewContractEditor = () => {
    setEditingId(null);
    setEditorStep('client');
    setContractCode(generateNextCode(contracts));
    setServiceType('regularizacao');
    setProjectId('');
    setClientEmail('');
    setClientUid('');
    setClientName('');
    setClientFilled(false);
    setAdminFilled(true);
    setStatus('aguardando_cliente');
    setClientData(createDefaultClientData());
    setContractorData(createDefaultContractorData(contractorSettings));
    setTermsData(createDefaultTermsData(contractorSettings));
    setSpecificData(createDefaultSpecificData());
    setFeedback(null);
    setEditorOpen(true);
  };

  const openEditContractEditor = (item: ServiceContract) => {
    setEditingId(item.id);
    setEditorStep('client');
    setContractCode(item.contractCode);
    setServiceType(item.serviceType);
    setProjectId(item.projectId || '');
    setClientEmail(item.clientEmail);
    setClientUid(item.clientUid || '');
    setClientName(item.clientName);
    setClientFilled(item.clientFilled);
    setAdminFilled(item.adminFilled);
    setStatus(item.status);
    setClientData({ ...createDefaultClientData(), ...item.clientData });
    setContractorData({
      ...createDefaultContractorData(contractorSettings),
      ...item.contractorData,
    });
    setTermsData({ ...createDefaultTermsData(contractorSettings), ...item.termsData });
    setSpecificData({ ...createDefaultSpecificData(), ...item.specificData });
    setFeedback(null);
    setEditorOpen(true);
  };

  const handleSelectClientAccount = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    if (!found) return;
    setClientEmail(found.email);
    setClientUid(found.uid || '');
    setClientName(found.displayName);
    setClientData((prev) => ({
      ...prev,
      fullName: prev.fullName || found.displayName,
      email: prev.email || found.email,
      addressCity: prev.addressCity || found.city || 'Umuarama',
      propertyCity: prev.propertyCity || found.city || 'Umuarama',
    }));
  };

  const handleSelectProject = (pid: string) => {
    setProjectId(pid);
    const proj = projects.find((p) => p.id === pid);
    if (!proj) return;
    setServiceType(proj.serviceType);
    if (!clientEmail) {
      setClientEmail(proj.clientEmail);
      setClientUid(proj.clientUid || '');
      setClientName(proj.clientName);
    }
    setClientData((prev) => ({
      ...prev,
      fullName: prev.fullName || proj.clientName,
      email: prev.email || proj.clientEmail,
      propertyStreet: prev.propertyStreet || proj.propertyAddress,
      propertyCity: prev.propertyCity || proj.city || 'Umuarama',
    }));
    if (proj.areaSqm > 0) {
      setSpecificData((prev) => ({
        ...prev,
        builtAreaSqm: prev.builtAreaSqm || String(proj.areaSqm),
      }));
    }
  };

  const handleAutoCalculateFees = () => {
    if (serviceType === 'acompanhamento') {
      const monthlyNum = parseBrlNumber(termsData.monthlyFee || termsData.totalValue);
      if (Number.isFinite(monthlyNum) && monthlyNum > 0) {
        const formatted = formatBrlNumber(monthlyNum);
        setTermsData((prev) => ({
          ...prev,
          monthlyFee: formatted,
          monthlyFeeWords: brlToWordsPtBr(formatted),
          hourlyRateWords: prev.hourlyRate ? brlToWordsPtBr(prev.hourlyRate) : prev.hourlyRateWords,
        }));
      }
      return;
    }

    const totalNum = parseBrlNumber(termsData.totalValue);
    if (!Number.isFinite(totalNum) || totalNum <= 0) return;

    const totalFmt = formatBrlNumber(totalNum);
    let p1 = 0.3;
    let p2 = 0.4;
    let p3 = 0.3;
    if (serviceType === 'arquitetonico') {
      p1 = 0.2;
      p2 = 0.3;
      p3 = 0.5;
    } else if (serviceType === 'laudo_vistoria') {
      p1 = 0.5;
      p2 = 0.5;
      p3 = 0;
    } else if (serviceType === 'complementares') {
      p1 = 0.3;
      p2 = 0.3;
      p3 = 0.4;
    }

    const v1 = Math.round(totalNum * p1 * 100) / 100;
    const v2 = p3 === 0 ? Math.round((totalNum - v1) * 100) / 100 : Math.round(totalNum * p2 * 100) / 100;
    const v3 = p3 === 0 ? 0 : Math.round((totalNum - v1 - v2) * 100) / 100;

    const v1Fmt = formatBrlNumber(v1);
    const v2Fmt = formatBrlNumber(v2);
    const v3Fmt = v3 > 0 ? formatBrlNumber(v3) : '';

    setTermsData((prev) => ({
      ...prev,
      totalValue: totalFmt,
      totalValueWords: brlToWordsPtBr(totalFmt),
      installment1Value: v1Fmt,
      installment1Words: brlToWordsPtBr(v1Fmt),
      installment2Value: v2Fmt,
      installment2Words: brlToWordsPtBr(v2Fmt),
      installment3Value: v3Fmt,
      installment3Words: v3Fmt ? brlToWordsPtBr(v3Fmt) : '',
      hourlyRateWords: prev.hourlyRate ? brlToWordsPtBr(prev.hourlyRate) : prev.hourlyRateWords,
    }));
  };

  const buildDraftSnapshot = (): ServiceContract => ({
    id: editingId || 'preview',
    contractCode: contractCode || 'CTR-PREVIEW',
    serviceType,
    status,
    projectId,
    clientEmail: clientEmail.trim().toLowerCase(),
    clientUid,
    clientName:
      clientData.personType === 'PJ'
        ? clientData.companyName.trim() || clientName || 'Cliente'
        : clientData.fullName.trim() || clientName || 'Cliente',
    clientFilled,
    adminFilled,
    clientData,
    contractorData,
    termsData,
    specificData,
    createdBy: user.uid,
  });

  const handleSaveAdminContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const emailClean = clientEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setFeedback({ type: 'err', text: 'Informe um e-mail válido para vincular o contrato ao cliente.' });
      setEditorStep('client');
      return;
    }

    const resolvedClientName =
      clientData.personType === 'PJ'
        ? clientData.companyName.trim() || clientName.trim()
        : clientData.fullName.trim() || clientName.trim();
    if (resolvedClientName.length < 2) {
      setFeedback({ type: 'err', text: 'Informe o nome do cliente (ou razão social) antes de salvar.' });
      setEditorStep('client');
      return;
    }

    const clientHasCoreData =
      clientData.personType === 'PJ'
        ? Boolean(clientData.companyName.trim() && clientData.cnpj.trim() && clientData.repFullName.trim())
        : Boolean(clientData.fullName.trim() && clientData.cpf.trim());

    const finalClientFilled = clientFilled || clientHasCoreData;
    const computedStatus: ContractStatus =
      status === 'assinado'
        ? 'assinado'
        : finalClientFilled && adminFilled
          ? 'pronto'
          : finalClientFilled
            ? 'aguardando_admin'
            : 'aguardando_cliente';

    setSaving(true);
    try {
      const payload = {
        contractCode: contractCode.trim() || generateNextCode(contracts),
        serviceType,
        projectId,
        clientEmail: emailClean,
        clientUid,
        clientName: resolvedClientName,
        clientFilled: finalClientFilled,
        adminFilled,
        status: computedStatus,
        clientData,
        contractorData,
        termsData,
        specificData,
      };
      if (editingId) {
        await updateContractAsAdmin(editingId, payload);
        setFeedback({ type: 'ok', text: 'Contrato atualizado com sucesso.' });
      } else {
        const newId = await createContractAsAdmin(user.uid, payload);
        setEditingId(newId);
        setStatus(computedStatus);
        setClientFilled(finalClientFilled);
        setFeedback({
          type: 'ok',
          text: 'Contrato criado e disponibilizado para o cliente preencher os dados PF/PJ.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Não foi possível salvar o contrato.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContractorDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      const nextSettings: ContractorSettings = {
        ...settingsDraft,
        defaultHourlyRateWords:
          settingsDraft.defaultHourlyRateWords.trim() ||
          brlToWordsPtBr(settingsDraft.defaultHourlyRate),
      };
      await saveContractorSettings(user.uid, nextSettings);
      onContractorSettingsSaved(nextSettings);
      setSettingsFeedback('Dados padrão do contratado salvos com sucesso.');
      setTimeout(() => {
        setShowSettingsModal(false);
        setSettingsFeedback(null);
      }, 900);
    } catch (err) {
      setSettingsFeedback(
        err instanceof Error ? err.message : 'Erro ao salvar os dados padrão.'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadWord = async (item: ServiceContract, format: 'docx' | 'doc') => {
    const key = `${item.id}-${format}`;
    setDownloadingKey(key);
    try {
      if (format === 'docx') {
        await downloadContractDocx(item);
      } else {
        downloadContractDoc(item);
      }
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDeleteContract = async (id: string) => {
    setConfirmDeleteId(null);
    await deleteContractAsAdmin(id);
  };

  // Client submission handler
  const handleSaveClientForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClientContract) return;
    setFeedback(null);

    if (clientFormDraft.personType === 'PF') {
      if (!clientFormDraft.fullName.trim() || !clientFormDraft.cpf.trim()) {
        setFeedback({
          type: 'err',
          text: 'Preencha pelo menos seu nome completo e CPF para Pessoa Física.',
        });
        return;
      }
    } else {
      if (
        !clientFormDraft.companyName.trim() ||
        !clientFormDraft.cnpj.trim() ||
        !clientFormDraft.repFullName.trim() ||
        !clientFormDraft.repCpf.trim()
      ) {
        setFeedback({
          type: 'err',
          text: 'Preencha Razão Social, CNPJ e os dados do sócio administrador para Pessoa Jurídica.',
        });
        return;
      }
    }

    if (!clientFormDraft.propertyStreet.trim() || !clientFormDraft.propertyCity.trim()) {
      setFeedback({
        type: 'err',
        text: 'Informe o endereço e a cidade do imóvel objeto do contrato.',
      });
      return;
    }

    setSaving(true);
    try {
      await updateContractClientData(activeClientContract, user.uid, clientFormDraft);
      setFeedback({
        type: 'ok',
        text: 'Seus dados foram enviados com sucesso para a KH Engenharia gerar o contrato.',
      });
      setActiveClientContract(null);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Não foi possível enviar os dados.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ===========================================================================
  // CLIENT VIEW
  // ===========================================================================
  if (!isAdmin) {
    if (activeClientContract) {
      const isSigned = activeClientContract.status === 'assinado';
      return (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232924] pb-6">
            <div>
              <button
                type="button"
                onClick={() => {
                  setActiveClientContract(null);
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#a8baa4] hover:text-white mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para meus contratos
              </button>
              <div className="kh-eyebrow">
                {activeClientContract.contractCode} · {CONTRACT_MODEL_SHORT[activeClientContract.serviceType]}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f0f1ed] mt-2">
                Preenchimento dos dados do <span className="text-[#c0d0b8]">contratante.</span>
              </h1>
              <p className="text-sm text-[#9aa49c] mt-2 max-w-2xl">
                Escolha Pessoa Física ou Pessoa Jurídica e preencha os campos abaixo. Assim que enviar,
                o engenheiro Kaio Henrique poderá gerar o contrato completo em Word pronto para assinatura.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setPreviewContract({
                  ...activeClientContract,
                  clientData: clientFormDraft,
                })
              }
              className="inline-flex items-center gap-2 border border-[#465246] px-4 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Pré-visualizar contrato
            </button>
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

          <form onSubmit={handleSaveClientForm} className="space-y-6">
            <ContractClientFields
              value={clientFormDraft}
              onChange={setClientFormDraft}
              disabled={isSigned}
            />

            {!isSigned && (
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#232924]">
                <button
                  type="button"
                  onClick={() => setActiveClientContract(null)}
                  className="px-5 py-3 border border-[#3a443c] text-xs font-semibold text-[#c5cdc6] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-6 py-3 text-xs font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Enviando dados...' : 'Enviar dados para o contrato'}
                </button>
              </div>
            )}
          </form>

          {previewContract && (
            <ContractPreviewModal
              contract={previewContract}
              isAdmin={false}
              onClose={() => setPreviewContract(null)}
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="border-b border-[#232924] pb-6">
          <div className="kh-eyebrow">Documentação contratual · PF e PJ</div>
          <h1 className="font-display text-3xl sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#f0f1ed] mt-3">
            Meus <span className="text-[#c0d0b8]">contratos.</span>
          </h1>
          <p className="text-sm text-[#9aa49c] mt-3 max-w-2xl">
            Preencha seus dados de Pessoa Física ou Pessoa Jurídica nos contratos enviados pela KH Engenharia.
            Após o envio, o engenheiro revisa as cláusulas e gera o documento final.
          </p>
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

        {loading ? (
          <div className="p-10 border border-[#232924] bg-[#101411] text-center text-xs font-mono text-[#8f9991]">
            CARREGANDO CONTRATOS...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-10 border border-[#232924] bg-[#101411] text-center space-y-2">
            <FileSignature className="w-8 h-8 text-[#6e7970] mx-auto" />
            <div className="text-base font-semibold text-[#e3e7e1]">
              Nenhum contrato disponível no momento
            </div>
            <p className="text-sm text-[#8f9991] max-w-md mx-auto">
              Quando a KH Engenharia preparar um contrato para o seu projeto, ele aparecerá aqui para
              preenchimento dos seus dados de Pessoa Física ou Pessoa Jurídica.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contracts.map((item) => {
              const meta = CONTRACT_STATUS_META[item.status];
              return (
                <div
                  key={item.id}
                  className="border border-[#262d28] bg-[#121613] p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="text-[#c0d0b8]">{item.contractCode}</span>
                      <span className="text-[#4a544c]">/</span>
                      <span className={meta.textClass}>{meta.label}</span>
                      <span className="text-[#4a544c]">/</span>
                      <span className="text-[#9aa49c]">
                        {item.clientData.personType === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#f0f1ed]">
                      {CONTRACT_MODEL_SHORT[item.serviceType]}
                    </h2>
                    <p className="text-xs text-[#8f9991]">{meta.desc}</p>
                    {item.clientFilled && (
                      <div className="inline-flex items-center gap-1.5 text-xs text-[#86d69d] pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Dados do contratante preenchidos
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewContract(item)}
                      className="inline-flex items-center gap-2 border border-[#3d483f] px-4 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Visualizar
                    </button>
                    {item.status !== 'assinado' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveClientContract(item);
                          setClientFormDraft({
                            ...createDefaultClientData(),
                            ...item.clientData,
                            email: item.clientData.email || user.email || '',
                          });
                          setFeedback(null);
                        }}
                        className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        {item.clientFilled ? 'Editar meus dados' : 'Preencher meus dados (PF / PJ)'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {previewContract && (
          <ContractPreviewModal
            contract={previewContract}
            isAdmin={false}
            onClose={() => setPreviewContract(null)}
          />
        )}
      </div>
    );
  }

  // ===========================================================================
  // ADMIN EDITOR VIEW
  // ===========================================================================
  if (editorOpen) {
    const draftSnapshot = buildDraftSnapshot();
    const steps: Array<{ id: EditorStep; label: string }> = [
      { id: 'client', label: '1. Contratante (PF / PJ)' },
      { id: 'contractor', label: '2. Contratado (Eng. Kaio)' },
      { id: 'specific', label: '3. Objeto e Escopo' },
      { id: 'terms', label: '4. Honorários, Prazos e Foro' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#232924] pb-6">
          <div>
            <button
              type="button"
              onClick={() => {
                setEditorOpen(false);
                setFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#a8baa4] hover:text-white mb-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para lista de contratos
            </button>
            <div className="kh-eyebrow">
              {editingId ? `Editando ${contractCode}` : 'Novo contrato de engenharia'}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f0f1ed] mt-2">
              {CONTRACT_MODEL_SHORT[serviceType]}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPreviewContract(draftSnapshot)}
              className="inline-flex items-center gap-2 border border-[#465246] px-4 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Pré-visualizar
            </button>
            <button
              type="button"
              disabled={downloadingKey !== null}
              onClick={() => handleDownloadWord(draftSnapshot, 'docx')}
              className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-4 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Word (.docx)
            </button>
            <button
              type="button"
              disabled={downloadingKey !== null}
              onClick={() => handleDownloadWord(draftSnapshot, 'doc')}
              className="inline-flex items-center gap-2 border border-[#465246] px-3.5 py-2.5 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer disabled:opacity-60"
            >
              <FileText className="w-3.5 h-3.5" />
              Baixar (.doc)
            </button>
          </div>
        </div>

        {/* Model + Linking Header Card */}
        <div className="border border-[#262d28] bg-[#121613] p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Modelo do contrato *</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className={inputCls}
            >
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {CONTRACT_MODEL_SHORT[opt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Código do contrato *</label>
            <input
              type="text"
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value.toUpperCase())}
              placeholder="CTR-2026-001"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status do contrato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContractStatus)}
              className={inputCls}
            >
              <option value="aguardando_cliente">Aguardando cliente</option>
              <option value="aguardando_admin">Aguardando engenheiro</option>
              <option value="pronto">Pronto para Word</option>
              <option value="assinado">Assinado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Vincular a cliente cadastrado (opcional)</label>
            <select
              value={clients.find((c) => c.email === clientEmail)?.id || ''}
              onChange={(e) => handleSelectClientAccount(e.target.value)}
              className={inputCls}
            >
              <option value="">Selecionar cliente aprovado...</option>
              {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.displayName} ({cl.email})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Vincular a projeto existente (opcional)</label>
            <select
              value={projectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className={inputCls}
            >
              <option value="">Nenhum projeto vinculado</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title} ({p.clientName})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>E-mail de acesso do cliente na Área do Cliente *</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="cliente@email.com (o cliente usará este e-mail para preencher PF/PJ)"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Nome de exibição do cliente *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome ou Razão Social"
              className={inputCls}
            />
          </div>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#232924] pb-3">
          {steps.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setEditorStep(st.id)}
              className={`px-4 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                editorStep === st.id
                  ? 'bg-[#1b231d] border-[#9baf91] text-[#f0f1ed]'
                  : 'bg-[#0e110f] border-[#262d28] text-[#9aa49c] hover:text-white'
              }`}
            >
              {st.label}
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

        <form onSubmit={handleSaveAdminContract} className="space-y-6">
          {/* STEP 1: CLIENT PF/PJ */}
          {editorStep === 'client' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#2b352d] bg-[#101511] text-xs text-[#b5c0b7]">
                Você pode deixar os campos abaixo em branco para o próprio cliente preencher na Área do
                Cliente (escolhendo Pessoa Física ou Pessoa Jurídica), ou já preencher/ajustar por aqui.
              </div>
              <ContractClientFields value={clientData} onChange={setClientData} />
            </div>
          )}

          {/* STEP 2: CONTRACTOR (ENG. KAIO) */}
          {editorStep === 'contractor' && (
            <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                  Qualificação do Contratado (Engenheiro Civil)
                </div>
                <button
                  type="button"
                  onClick={() => setContractorData(createDefaultContractorData(contractorSettings))}
                  className="text-xs text-[#a8baa4] hover:text-white underline cursor-pointer"
                >
                  Recarregar meus dados padrão
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>Nome completo do engenheiro</label>
                  <input
                    type="text"
                    value={contractorData.fullName}
                    onChange={(e) => setContractorData({ ...contractorData, fullName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nacionalidade</label>
                  <input
                    type="text"
                    value={contractorData.nationality}
                    onChange={(e) => setContractorData({ ...contractorData, nationality: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Estado civil</label>
                  <input
                    type="text"
                    value={contractorData.maritalStatus}
                    onChange={(e) => setContractorData({ ...contractorData, maritalStatus: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CREA — UF</label>
                  <input
                    type="text"
                    value={contractorData.creaUf}
                    onChange={(e) => setContractorData({ ...contractorData, creaUf: e.target.value.toUpperCase() })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CREA — Registro nº</label>
                  <input
                    type="text"
                    value={contractorData.creaNumber}
                    onChange={(e) => setContractorData({ ...contractorData, creaNumber: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CPF</label>
                  <input
                    type="text"
                    value={contractorData.cpf}
                    onChange={(e) => setContractorData({ ...contractorData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Documento de Identidade (RG)</label>
                  <input
                    type="text"
                    value={contractorData.rg}
                    onChange={(e) => setContractorData({ ...contractorData, rg: e.target.value })}
                    placeholder="0.000.000-0"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>E-mail profissional</label>
                  <input
                    type="email"
                    value={contractorData.email}
                    onChange={(e) => setContractorData({ ...contractorData, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Endereço profissional (Rua, nº, bairro)</label>
                  <input
                    type="text"
                    value={contractorData.professionalAddress}
                    onChange={(e) =>
                      setContractorData({ ...contractorData, professionalAddress: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input
                    type="text"
                    value={contractorData.city}
                    onChange={(e) => setContractorData({ ...contractorData, city: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={contractorData.state}
                    onChange={(e) => setContractorData({ ...contractorData, state: e.target.value.toUpperCase() })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SERVICE SPECIFIC */}
          {editorStep === 'specific' && (
            <ContractSpecificFields
              serviceType={serviceType}
              value={specificData}
              onChange={setSpecificData}
            />
          )}

          {/* STEP 4: FEES, FORUM, WITNESSES */}
          {editorStep === 'terms' && (
            <div className="space-y-5">
              <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                    Cláusula 4 — Honorários e Forma de Pagamento
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoCalculateFees}
                    className="inline-flex items-center gap-1.5 border border-[#4a574c] bg-[#161c17] px-3 py-1.5 text-xs font-semibold text-[#c0d0b8] hover:border-[#9baf91] cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Calcular parcelas e extenso automaticamente
                  </button>
                </div>

                {serviceType === 'acompanhamento' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Honorários mensais (R$)</label>
                      <input
                        type="text"
                        value={termsData.monthlyFee}
                        onChange={(e) => setTermsData({ ...termsData, monthlyFee: e.target.value })}
                        placeholder="Ex.: 2.500,00"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Valor mensal por extenso</label>
                      <input
                        type="text"
                        value={termsData.monthlyFeeWords}
                        onChange={(e) => setTermsData({ ...termsData, monthlyFeeWords: e.target.value })}
                        placeholder="dois mil e quinhentos reais"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Visitas incluídas no mês (4.1)</label>
                      <input
                        type="text"
                        value={termsData.monthlyVisitsIncluded}
                        onChange={(e) => setTermsData({ ...termsData, monthlyVisitsIncluded: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Vencimento (dia)</label>
                        <input
                          type="text"
                          value={termsData.monthlyDueDay}
                          onChange={(e) => setTermsData({ ...termsData, monthlyDueDay: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Reajuste anual</label>
                        <input
                          type="text"
                          value={termsData.monthlyAdjustmentIndex}
                          onChange={(e) =>
                            setTermsData({ ...termsData, monthlyAdjustmentIndex: e.target.value })
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Valor total dos honorários (R$)</label>
                      <input
                        type="text"
                        value={termsData.totalValue}
                        onChange={(e) => setTermsData({ ...termsData, totalValue: e.target.value })}
                        placeholder="Ex.: 6.000,00"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Valor total por extenso</label>
                      <input
                        type="text"
                        value={termsData.totalValueWords}
                        onChange={(e) => setTermsData({ ...termsData, totalValueWords: e.target.value })}
                        placeholder="seis mil reais"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>1ª Parcela (R$)</label>
                      <input
                        type="text"
                        value={termsData.installment1Value}
                        onChange={(e) => setTermsData({ ...termsData, installment1Value: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>1ª Parcela por extenso</label>
                      <input
                        type="text"
                        value={termsData.installment1Words}
                        onChange={(e) => setTermsData({ ...termsData, installment1Words: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>2ª Parcela (R$)</label>
                      <input
                        type="text"
                        value={termsData.installment2Value}
                        onChange={(e) => setTermsData({ ...termsData, installment2Value: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>2ª Parcela por extenso</label>
                      <input
                        type="text"
                        value={termsData.installment2Words}
                        onChange={(e) => setTermsData({ ...termsData, installment2Words: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    {serviceType !== 'laudo_vistoria' && (
                      <>
                        <div>
                          <label className={labelCls}>3ª Parcela (R$)</label>
                          <input
                            type="text"
                            value={termsData.installment3Value}
                            onChange={(e) => setTermsData({ ...termsData, installment3Value: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>3ª Parcela por extenso</label>
                          <input
                            type="text"
                            value={termsData.installment3Words}
                            onChange={(e) => setTermsData({ ...termsData, installment3Words: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#232924]">
                  <div>
                    <label className={labelCls}>Hora técnica (R$)</label>
                    <input
                      type="text"
                      value={termsData.hourlyRate}
                      onChange={(e) => setTermsData({ ...termsData, hourlyRate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Hora técnica por extenso</label>
                    <input
                      type="text"
                      value={termsData.hourlyRateWords}
                      onChange={(e) => setTermsData({ ...termsData, hourlyRateWords: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Índice de correção (4.3)</label>
                    <select
                      value={termsData.correctionIndex}
                      onChange={(e) =>
                        setTermsData({
                          ...termsData,
                          correctionIndex: e.target.value as 'IPCA' | 'INPC',
                        })
                      }
                      className={inputCls}
                    >
                      <option value="IPCA">IPCA</option>
                      <option value="INPC">INPC</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-start gap-2.5 p-3 border border-[#262d28] bg-[#0e110f] cursor-pointer text-xs text-[#dce2db]">
                    <input
                      type="checkbox"
                      checked={termsData.artFeeIncluded}
                      onChange={(e) => setTermsData({ ...termsData, artFeeIncluded: e.target.checked })}
                      className="mt-0.5 accent-[#9baf91]"
                    />
                    <span>Taxa de emissão da ART incluída no preço</span>
                  </label>
                  <label className="flex items-start gap-2.5 p-3 border border-[#262d28] bg-[#0e110f] cursor-pointer text-xs text-[#dce2db]">
                    <input
                      type="checkbox"
                      checked={termsData.allowImageRights}
                      onChange={(e) => setTermsData({ ...termsData, allowImageRights: e.target.checked })}
                      className="mt-0.5 accent-[#9baf91]"
                    />
                    <span>Cláusula 6.5 — Concede direito de imagem para portfólio (sem dados pessoais)</span>
                  </label>
                </div>
              </div>

              <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
                <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
                  Cláusula 6, 8, Foro e Testemunhas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Horário início atendimento</label>
                    <input
                      type="text"
                      value={termsData.officeHoursStart}
                      onChange={(e) => setTermsData({ ...termsData, officeHoursStart: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Horário fim atendimento</label>
                    <input
                      type="text"
                      value={termsData.officeHoursEnd}
                      onChange={(e) => setTermsData({ ...termsData, officeHoursEnd: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Visita fora do horário (R$)</label>
                    <input
                      type="text"
                      value={termsData.outOfHoursFee}
                      onChange={(e) => setTermsData({ ...termsData, outOfHoursFee: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Município base reembolso (6.6)</label>
                    <input
                      type="text"
                      value={termsData.reimbursementOriginCity}
                      onChange={(e) =>
                        setTermsData({ ...termsData, reimbursementOriginCity: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Comarca / Foro — Cidade</label>
                    <input
                      type="text"
                      value={termsData.forumCity}
                      onChange={(e) => setTermsData({ ...termsData, forumCity: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Comarca / Foro — UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={termsData.forumState}
                      onChange={(e) =>
                        setTermsData({ ...termsData, forumState: e.target.value.toUpperCase() })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className={labelCls}>Local e data da assinatura</label>
                    <input
                      type="text"
                      value={termsData.signatureCityDate}
                      onChange={(e) => setTermsData({ ...termsData, signatureCityDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Testemunha 1 — Nome</label>
                    <input
                      type="text"
                      value={termsData.witness1Name}
                      onChange={(e) => setTermsData({ ...termsData, witness1Name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Testemunha 1 — CPF</label>
                    <input
                      type="text"
                      value={termsData.witness1Cpf}
                      onChange={(e) => setTermsData({ ...termsData, witness1Cpf: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="hidden md:block" />
                  <div>
                    <label className={labelCls}>Testemunha 2 — Nome</label>
                    <input
                      type="text"
                      value={termsData.witness2Name}
                      onChange={(e) => setTermsData({ ...termsData, witness2Name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Testemunha 2 — CPF</label>
                    <input
                      type="text"
                      value={termsData.witness2Cpf}
                      onChange={(e) => setTermsData({ ...termsData, witness2Cpf: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#232924]">
            <label className="inline-flex items-center gap-2 text-xs text-[#b9c2ba] cursor-pointer">
              <input
                type="checkbox"
                checked={adminFilled}
                onChange={(e) => setAdminFilled(e.target.checked)}
                className="accent-[#9baf91]"
              />
              <span>Cláusulas do engenheiro concluídas</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="px-4 py-2.5 border border-[#3a443c] text-xs font-semibold text-[#c5cdc6] hover:text-white cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-6 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar contrato'}
              </button>
            </div>
          </div>
        </form>

        {previewContract && (
          <ContractPreviewModal
            contract={previewContract}
            isAdmin={true}
            onClose={() => setPreviewContract(null)}
          />
        )}
      </div>
    );
  }

  // ===========================================================================
  // ADMIN LIST VIEW
  // ===========================================================================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[#232924] pb-6">
        <div>
          <div className="kh-eyebrow">Contratos · 5 modelos oficiais PF e PJ</div>
          <h1 className="font-display text-3xl sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#f0f1ed] mt-3">
            Gestão de <span className="text-[#c0d0b8]">contratos.</span>
          </h1>
          <p className="text-sm text-[#9aa49c] mt-3 max-w-2xl">
            Crie contratos nos 5 modelos da KH Engenharia, libere para o cliente preencher Pessoa Física
            ou Pessoa Jurídica e baixe o documento já preenchido em Word (.docx ou .doc).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSettingsDraft({
                ...createDefaultContractorSettings(),
                ...contractorSettings,
              });
              setSettingsFeedback(null);
              setShowSettingsModal(true);
            }}
            className="inline-flex items-center gap-2 border border-[#465246] px-4 py-3 text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Meus dados de Contratado
          </button>
          <button
            type="button"
            onClick={openNewContractEditor}
            className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-3 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo contrato
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-[#262d28] bg-[#121613] p-5">
          <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
            Total de contratos
          </div>
          <div className="font-display text-3xl font-bold text-[#f0f1ed] mt-2 tabular-nums">
            {stats.total}
          </div>
        </div>
        <div className="border border-[#262d28] bg-[#121613] p-5">
          <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
            Aguardando cliente
          </div>
          <div className="font-display text-3xl font-bold text-[#f09d78] mt-2 tabular-nums">
            {stats.awaitingClient}
          </div>
        </div>
        <div className="border border-[#262d28] bg-[#121613] p-5">
          <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
            Prontos para baixar
          </div>
          <div className="font-display text-3xl font-bold text-[#86d69d] mt-2 tabular-nums">
            {stats.ready}
          </div>
        </div>
        <div className="border border-[#262d28] bg-[#121613] p-5">
          <div className="text-[11px] font-mono uppercase tracking-[1px] text-[#8f9991]">
            Assinados
          </div>
          <div className="font-display text-3xl font-bold text-[#a9c5e0] mt-2 tabular-nums">
            {stats.signed}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por código, cliente ou e-mail..."
          className={`md:col-span-2 ${inputCls}`}
        />
        <select
          value={filterModel}
          onChange={(e) => setFilterModel(e.target.value as ServiceType | 'todos')}
          className={inputCls}
        >
          <option value="todos">Todos os 5 modelos</option>
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {CONTRACT_MODEL_SHORT[opt]}
            </option>
          ))}
        </select>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="p-10 border border-[#232924] bg-[#101411] text-center text-xs font-mono text-[#8f9991]">
          CARREGANDO CONTRATOS...
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="p-10 border border-[#232924] bg-[#101411] text-center space-y-3">
          <FileSignature className="w-8 h-8 text-[#6e7970] mx-auto" />
          <div className="text-base font-semibold text-[#e3e7e1]">
            Nenhum contrato encontrado
          </div>
          <p className="text-sm text-[#8f9991] max-w-md mx-auto">
            Clique em &ldquo;Novo contrato&rdquo; para gerar um dos 5 modelos oficiais, enviar ao
            cliente e baixar preenchido em Word (.docx / .doc).
          </p>
          <button
            type="button"
            onClick={openNewContractEditor}
            className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-2.5 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar primeiro contrato
          </button>
        </div>
      ) : (
        <div className="border border-[#262d28] bg-[#121613] divide-y divide-[#232924]">
          {filteredContracts.map((item) => {
            const meta = CONTRACT_STATUS_META[item.status];
            return (
              <div
                key={item.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#151a16] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                    <span className="text-[#c0d0b8] font-semibold">{item.contractCode}</span>
                    <span className="text-[#4a544c]">/</span>
                    <span className={meta.textClass}>{meta.label}</span>
                    <span className="text-[#4a544c]">/</span>
                    <span className="text-[#9aa49c]">
                      {item.clientData.personType === 'PJ' ? 'PJ' : 'PF'}
                    </span>
                    <span className="text-[#4a544c]">/</span>
                    <span className="text-[#8f9991]">
                      Cliente: {item.clientFilled ? 'Preenchido' : 'Pendente'}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-[#f0f1ed] truncate">
                    {item.clientName} — {CONTRACT_MODEL_SHORT[item.serviceType]}
                  </div>
                  <div className="text-xs text-[#8f9991] truncate">
                    {item.clientEmail}
                    {item.termsData.totalValue
                      ? ` · Honorários: R$ ${item.termsData.totalValue}`
                      : item.termsData.monthlyFee
                        ? ` · Mensalidade: R$ ${item.termsData.monthlyFee}`
                        : ''}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditContractEditor(item)}
                    className="px-3.5 py-2 border border-[#3c473e] text-xs font-semibold text-[#e3e7e1] hover:border-[#9baf91] transition-colors cursor-pointer"
                  >
                    Editar / Preencher
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewContract(item)}
                    className="p-2 border border-[#3c473e] text-[#c5cdc6] hover:text-white hover:border-[#9baf91] transition-colors cursor-pointer"
                    title="Pré-visualizar contrato"
                    aria-label="Pré-visualizar contrato"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={downloadingKey === `${item.id}-docx`}
                    onClick={() => handleDownloadWord(item, 'docx')}
                    className="inline-flex items-center gap-1.5 bg-[#d8ddd6] text-[#141815] px-3.5 py-2 text-xs font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    .docx
                  </button>
                  <button
                    type="button"
                    disabled={downloadingKey === `${item.id}-doc`}
                    onClick={() => handleDownloadWord(item, 'doc')}
                    className="inline-flex items-center gap-1.5 border border-[#4a574c] px-3 py-2 text-xs font-semibold text-[#d8ddd6] hover:border-[#9baf91] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    .doc
                  </button>
                  {confirmDeleteId === item.id ? (
                    <div className="inline-flex items-center gap-1.5 pl-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteContract(item.id)}
                        className="px-2.5 py-2 bg-[#7f2d21] text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-2 border border-[#3c473e] text-xs text-[#9aa49c] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-2 border border-[#323a34] text-[#8f9991] hover:text-[#f09d78] hover:border-[#6d3b2c] transition-colors cursor-pointer"
                      title="Excluir contrato"
                      aria-label="Excluir contrato"
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

      {/* Contractor Defaults Modal (Admin) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121613] border border-[#303a32] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-[#262d28] flex items-center justify-between">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[1px] text-[#a8baa4]">
                  Configuração padrão · Contratado
                </div>
                <h2 className="font-display text-lg font-bold text-[#f0f1ed]">
                  Meus dados profissionais (Eng. Kaio Henrique)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-[#9aa49c] hover:text-white cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveContractorDefaults}
              className="p-6 overflow-y-auto space-y-4"
            >
              <p className="text-xs text-[#9aa49c]">
                Estes dados são salvos de forma privada (acesso exclusivo do administrador) e preenchem
                automaticamente a qualificação do CONTRATADO, horário de atendimento, hora técnica e foro
                em todos os novos contratos.
              </p>

              {settingsFeedback && (
                <div className="p-3 border border-[#3a5c42] bg-[#132017] text-xs text-[#a7dfb5]">
                  {settingsFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome completo</label>
                  <input
                    type="text"
                    value={settingsDraft.fullName}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, fullName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nacionalidade</label>
                  <input
                    type="text"
                    value={settingsDraft.nationality}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, nationality: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Estado civil</label>
                  <input
                    type="text"
                    value={settingsDraft.maritalStatus}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, maritalStatus: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CREA UF</label>
                  <input
                    type="text"
                    value={settingsDraft.creaUf}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, creaUf: e.target.value.toUpperCase() })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CREA nº</label>
                  <input
                    type="text"
                    value={settingsDraft.creaNumber}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, creaNumber: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CPF</label>
                  <input
                    type="text"
                    value={settingsDraft.cpf}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Documento de Identidade (RG)</label>
                  <input
                    type="text"
                    value={settingsDraft.rg}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, rg: e.target.value })}
                    placeholder="0.000.000-0"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>E-mail profissional</label>
                  <input
                    type="email"
                    value={settingsDraft.email}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Endereço profissional (Rua, nº, bairro)</label>
                  <input
                    type="text"
                    value={settingsDraft.professionalAddress}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, professionalAddress: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input
                    type="text"
                    value={settingsDraft.city}
                    onChange={(e) => setSettingsDraft({ ...settingsDraft, city: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={settingsDraft.state}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, state: e.target.value.toUpperCase() })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Horário início</label>
                  <input
                    type="text"
                    value={settingsDraft.officeHoursStart}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, officeHoursStart: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Horário fim</label>
                  <input
                    type="text"
                    value={settingsDraft.officeHoursEnd}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, officeHoursEnd: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Hora técnica padrão (R$)</label>
                  <input
                    type="text"
                    value={settingsDraft.defaultHourlyRate}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, defaultHourlyRate: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Visita fora do horário (R$)</label>
                  <input
                    type="text"
                    value={settingsDraft.defaultOutOfHoursFee}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, defaultOutOfHoursFee: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Foro padrão — Cidade</label>
                  <input
                    type="text"
                    value={settingsDraft.defaultForumCity}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, defaultForumCity: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Foro padrão — UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={settingsDraft.defaultForumState}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        defaultForumState: e.target.value.toUpperCase(),
                      })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#232924]">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 border border-[#3a443c] text-xs font-semibold text-[#c5cdc6] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-5 py-2.5 text-xs font-bold hover:bg-white cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingSettings ? 'Salvando...' : 'Salvar dados padrão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewContract && (
        <ContractPreviewModal
          contract={previewContract}
          isAdmin={true}
          onClose={() => setPreviewContract(null)}
        />
      )}
    </div>
  );
}
