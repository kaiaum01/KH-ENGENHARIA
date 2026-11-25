import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  PROJECT_STATUS_META,
  SERVICE_TYPE_LABELS,
  type ClientAccount,
  type Project,
  type ProjectStatus,
  type ServiceRequest,
  type ServiceType,
} from '../types/portal';
import { createProject, updateProject, type ProjectInput } from '../lib/portalService';
import { BLUEPRINT_LIMITS } from '../lib/validation';

interface ProjectFormModalProps {
  adminUid: string;
  editingProject?: Project | null;
  fromRequest?: ServiceRequest | null;
  fromClient?: ClientAccount | null;
  onClose: () => void;
  onSaved: (projectId?: string) => void;
}

export function ProjectFormModal({
  adminUid,
  editingProject,
  fromRequest,
  fromClient,
  onClose,
  onSaved,
}: ProjectFormModalProps) {
  const isEditing = Boolean(editingProject);
  const year = new Date().getFullYear();

  const [form, setForm] = useState<ProjectInput>({
    code: editingProject?.code || `KH-${year}-${String(Math.floor(100 + Math.random() * 899))}`,
    title:
      editingProject?.title ||
      (fromRequest
        ? `${SERVICE_TYPE_LABELS[fromRequest.serviceType]} · ${fromRequest.clientName}`
        : fromClient
          ? `Projeto · ${fromClient.displayName}`
          : ''),
    serviceType: editingProject?.serviceType || fromRequest?.serviceType || 'regularizacao',
    status: editingProject?.status || 'em_analise',
    progress: editingProject?.progress ?? 10,
    clientEmail: editingProject?.clientEmail || fromRequest?.clientEmail || fromClient?.email || '',
    clientUid: editingProject?.clientUid || fromRequest?.clientUid || fromClient?.uid || '',
    clientName: editingProject?.clientName || fromRequest?.clientName || fromClient?.displayName || '',
    clientPhone: editingProject?.clientPhone || fromRequest?.phone || fromClient?.phone || '',
    propertyAddress: editingProject?.propertyAddress || fromRequest?.propertyAddress || '',
    city: editingProject?.city || fromRequest?.city || fromClient?.city || 'Umuarama, PR',
    areaSqm: editingProject?.areaSqm ?? 0,
    artNumber: editingProject?.artNumber || '',
    protocolNumber: editingProject?.protocolNumber || '',
    summary: editingProject?.summary || fromRequest?.description || '',
    nextStep:
      editingProject?.nextStep || 'Levantamento inicial e conferência de documentação do imóvel.',
    estimatedDelivery: editingProject?.estimatedDelivery || '',
  });

  const [addDefaultMilestones, setAddDefaultMilestones] = useState(!isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditing && editingProject) {
        await updateProject(editingProject.id, editingProject.clientEmail, form);
        onSaved(editingProject.id);
      } else {
        const newId = await createProject(adminUid, form, {
          addDefaultMilestones,
          sourceRequestId: fromRequest?.id,
        });
        onSaved(newId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#121513] border border-[#2f3830] my-8">
        <div className="px-6 py-4 border-b border-[#242a25] flex items-center justify-between">
          <div>
            <h2 id="project-modal-title" className="font-display text-lg font-medium text-[#f0f1ed]">
              {isEditing
                ? `Editar projeto ${editingProject?.code}`
                : fromRequest
                  ? 'Converter solicitação em projeto'
                  : 'Novo projeto de cliente'}
            </h2>
            <p className="text-xs text-[#8f9991] mt-0.5">
              O cliente terá acesso imediato ao entrar com o e-mail informado abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#9aa49c] hover:text-white cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Código do projeto *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.code}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="KH-2026-001"
                className="w-full px-3 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-[#aeb6af] mb-1.5">Título do projeto *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.title}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Regularização Residencial — Jardim Panorama"
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Serviço *</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              >
                {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((key) => (
                  <option key={key} value={key}>
                    {SERVICE_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Situação *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              >
                {(Object.keys(PROJECT_STATUS_META) as ProjectStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {PROJECT_STATUS_META[key].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Progresso (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#202621] grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Nome do cliente *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.displayName}
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Nome completo"
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">E-mail Google do cliente *</label>
              <input
                type="email"
                required
                maxLength={BLUEPRINT_LIMITS.email}
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                placeholder="cliente@gmail.com"
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Telefone / WhatsApp</label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.phone}
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                placeholder="(44) 99999-0000"
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-[#aeb6af] mb-1.5">Endereço / referência do imóvel *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.propertyAddress}
                value={form.propertyAddress}
                onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
                placeholder="Rua, número, bairro ou lote/quadra"
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Cidade *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.city}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Umuarama, PR"
                className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Área (m²)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.areaSqm}
                onChange={(e) => setForm({ ...form, areaSqm: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Número da ART</label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.artNumber}
                value={form.artNumber}
                onChange={(e) => setForm({ ...form, artNumber: e.target.value })}
                placeholder="PR2026..."
                className="w-full px-3 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Protocolo Prefeitura</label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.protocolNumber}
                value={form.protocolNumber}
                onChange={(e) => setForm({ ...form, protocolNumber: e.target.value })}
                placeholder="PMU-2026/..."
                className="w-full px-3 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Previsão entrega</label>
              <input
                type="date"
                value={form.estimatedDelivery}
                onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">Próximo passo visível ao cliente</label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.nextStep}
              value={form.nextStep}
              onChange={(e) => setForm({ ...form, nextStep: e.target.value })}
              placeholder="Ex.: Aguardando aprovação da planta baixa para protocolar na prefeitura."
              className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">Resumo técnico do escopo</label>
            <textarea
              rows={3}
              maxLength={BLUEPRINT_LIMITS.summary}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Descreva o escopo contratado, disciplinas incluídas e observações técnicas."
              className="w-full px-3 py-2 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>

          {!isEditing && (
            <label className="flex items-center gap-2.5 text-xs text-[#cbd2cb] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={addDefaultMilestones}
                onChange={(e) => setAddDefaultMilestones(e.target.checked)}
                className="accent-[#c0d0b8] w-4 h-4"
              />
              Criar cronograma padrão de etapas técnicas para este tipo de serviço
            </label>
          )}

          <div className="pt-4 border-t border-[#242a25] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#aeb6af] hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
