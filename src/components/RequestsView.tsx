import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowRight, Check, Send } from 'lucide-react';
import {
  SERVICE_REQUEST_STATUS_META,
  SERVICE_TYPE_LABELS,
  type ServiceRequest,
  type ServiceRequestStatus,
  type ServiceType,
  type UserProfile,
} from '../types/portal';
import { createServiceRequest, updateServiceRequestStatus } from '../lib/portalService';
import { BLUEPRINT_LIMITS, formatTimestampPtBr } from '../lib/validation';

interface RequestsViewProps {
  user: User;
  profile: UserProfile | null;
  isAdmin: boolean;
  requests: ServiceRequest[];
  loading: boolean;
  onConvertRequest: (req: ServiceRequest) => void;
}

export function RequestsView({
  user,
  profile,
  isAdmin,
  requests,
  loading,
  onConvertRequest,
}: RequestsViewProps) {
  const [form, setForm] = useState({
    clientName: profile?.displayName || user.displayName || '',
    phone: profile?.phone || '',
    city: profile?.city || 'Umuarama, PR',
    serviceType: 'regularizacao' as ServiceType,
    propertyAddress: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todas' | ServiceRequestStatus>('todas');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSubmittedOk(false);
    try {
      await createServiceRequest(user, form);
      setForm((prev) => ({
        ...prev,
        propertyAddress: '',
        description: '',
      }));
      setSubmittedOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (requestId: string, status: ServiceRequestStatus) => {
    try {
      await updateServiceRequestStatus(requestId, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar situação.');
    }
  };

  const visibleRequests =
    statusFilter === 'todas'
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-9">
      <div className="pb-7 border-b border-[#303333]">
        <div className="kh-eyebrow">
          {isAdmin ? 'Atendimento · Novas demandas' : 'Orçamento e escopo'}
        </div>
        <h1 className="font-display text-3xl sm:text-[42px] font-medium tracking-[-1.5px] leading-[1.12] text-[#f0f1ed] mt-4">
          {isAdmin ? (
            <>
              Solicitações de <em className="not-italic text-[#c0d0b8]">clientes.</em>
            </>
          ) : (
            <>
              Solicitar novo <em className="not-italic text-[#c0d0b8]">serviço.</em>
            </>
          )}
        </h1>
        <p className="text-sm sm:text-[15px] text-[#aab5ac] mt-2 max-w-2xl leading-relaxed">
          {isAdmin
            ? 'Analise os pedidos enviados pelos clientes e converta demandas aprovadas diretamente em projetos ativos.'
            : 'Descreva o que você precisa construir, regularizar ou avaliar. O Eng. Kaio Henrique analisará e retornará com escopo e próximos passos.'}
        </p>
      </div>

      {!isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="border border-[#303a32] bg-[#121613] p-6 sm:p-8 space-y-5 max-w-3xl"
        >
          <div className="pb-3 border-b border-[#202621]">
            <h2 className="font-display text-base font-medium text-[#f0f1ed]">
              Dados da solicitação
            </h2>
          </div>

          {error && (
            <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
              {error}
            </div>
          )}

          {submittedOk && (
            <div className="p-3 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              Solicitação registrada com sucesso. Você pode acompanhar o retorno abaixo.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Nome completo *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.displayName}
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">WhatsApp / Telefone *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.phone}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(44) 99999-0000"
                className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Tipo de serviço *</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}
                className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              >
                {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((key) => (
                  <option key={key} value={key}>
                    {SERVICE_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#aeb6af] mb-1.5">Cidade do imóvel *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.city}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Umuarama, PR"
                className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">Endereço ou referência do imóvel *</label>
            <input
              type="text"
              required
              maxLength={BLUEPRINT_LIMITS.propertyAddress}
              value={form.propertyAddress}
              onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
              placeholder="Rua, bairro, lote/quadra ou condomínio"
              className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">
              Descrição do projeto ou necessidade *
            </label>
            <textarea
              rows={4}
              required
              maxLength={BLUEPRINT_LIMITS.description}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Conte a área aproximada, se já existe construção no terreno, documentos disponíveis (matrícula, IPTU) e prazos desejados."
              className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        </form>
      )}

      {/* List of Requests */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-medium text-[#f0f1ed]">
            {isAdmin ? 'Fila de solicitações' : 'Histórico de solicitações'}
          </h2>

          {isAdmin && (
            <div className="flex items-center gap-1 p-1 bg-[#121513] border border-[#242a25] overflow-x-auto">
              {(['todas', 'recebida', 'em_analise', 'convertida', 'arquivada'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#232b25] text-[#f0f1ed]'
                        : 'text-[#8f9991] hover:text-[#e3e7e1]'
                    }`}
                  >
                    {st === 'todas' ? 'Todas' : SERVICE_REQUEST_STATUS_META[st].label}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="border border-[#242a25] bg-[#121513] p-6 text-xs text-[#8f9991]">
            Carregando solicitações...
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="border border-[#242a25] bg-[#121513] p-8 text-center text-sm text-[#8f9991]">
            {isAdmin
              ? 'Nenhuma solicitação encontrada para este filtro.'
              : 'Você ainda não enviou nenhuma solicitação pelo portal.'}
          </div>
        ) : (
          <div className="border border-[#242a25] bg-[#121513] divide-y divide-[#202621]">
            {visibleRequests.map((req) => {
              const statusMeta = SERVICE_REQUEST_STATUS_META[req.status];
              return (
                <div key={req.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#8f9991]">
                      <span className={`font-medium ${statusMeta.textClass}`}>
                        {statusMeta.label}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#cfd6ce]">{SERVICE_TYPE_LABELS[req.serviceType]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{formatTimestampPtBr(req.createdAt)}</span>
                    </div>

                    <div className="text-sm font-medium text-[#f0f1ed]">
                      {req.propertyAddress} · {req.city}
                    </div>

                    {isAdmin && (
                      <div className="text-xs text-[#aeb6af]">
                        {req.clientName} · {req.clientEmail} · {req.phone}
                      </div>
                    )}

                    <p className="text-xs text-[#9aa49c] leading-relaxed whitespace-pre-line">
                      {req.description}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {req.status === 'recebida' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'em_analise')}
                          className="px-3 py-2 text-xs border border-[#323c34] text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap cursor-pointer"
                        >
                          Marcar em análise
                        </button>
                      )}
                      {req.status !== 'convertida' && (
                        <button
                          type="button"
                          onClick={() => onConvertRequest(req)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white whitespace-nowrap cursor-pointer"
                        >
                          Converter em projeto
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                      {req.status !== 'arquivada' && req.status !== 'convertida' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'arquivada')}
                          className="px-3 py-2 text-xs text-[#8f9991] hover:text-[#f09d78] whitespace-nowrap cursor-pointer"
                        >
                          Arquivar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
