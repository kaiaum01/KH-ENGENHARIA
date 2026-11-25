import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  Clock,
  ExternalLink,
  LogOut,
  Send,
  ShieldAlert,
} from 'lucide-react';
import {
  ACCESS_REQUEST_STATUS_META,
  SERVICE_TYPE_LABELS,
  type AccessRequest,
  type ClientAccount,
  type ServiceType,
} from '../types/portal';
import { submitAccessRequest } from '../lib/portalService';
import { BLUEPRINT_LIMITS, formatTimestampPtBr } from '../lib/validation';

interface ClientApprovalGateProps {
  user: User;
  clientRecord: ClientAccount | null;
  existingRequest: AccessRequest | null;
  onSignOut: () => void;
}

export function ClientApprovalGate({
  user,
  clientRecord,
  existingRequest,
  onSignOut,
}: ClientApprovalGateProps) {
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    phone: '',
    city: 'Umuarama, PR',
    serviceInterest: 'regularizacao' as ServiceType,
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const isSuspended = clientRecord?.status === 'suspenso';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitAccessRequest(user, form);
      setJustSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação de acesso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex flex-col">
      {/* Minimal Header */}
      <header className="h-16 px-6 border-b border-[#242a25] flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img
            src="/projetos/kh-logo-metal.png"
            alt="Monograma KH"
            className="w-9 h-9 object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="font-display font-extrabold text-xs tracking-[1.4px] kh-metallic-wordmark">
              KH ENGENHARIA
            </div>
            <div className="text-[10px] text-[#8f9991]">Área do Cliente · Aprovação de acesso</div>
          </div>
        </a>

        <div className="flex items-center gap-4 text-xs">
          <span className="hidden sm:inline text-[#8f9991]">{user.email}</span>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 text-[#aeb6af] hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl border border-[#242a25] bg-[#121513] p-6 sm:p-8 space-y-6">
          {isSuspended ? (
            <div className="space-y-4">
              <ShieldAlert className="w-7 h-7 text-[#f09d78]" aria-hidden="true" />
              <h1 className="font-display text-2xl font-medium text-[#f0f1ed]">
                Seu acesso está temporariamente suspenso
              </h1>
              <p className="text-sm text-[#aeb6af] leading-relaxed">
                O cadastro associado ao e-mail <strong>{user.email}</strong> encontra-se suspenso no momento. Entre em contato com o Eng. Kaio Henrique para reativação.
              </p>
              <a
                href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Gostaria%20de%20verificar%20a%20reativa%C3%A7%C3%A3o%20do%20meu%20acesso%20na%20%C3%81rea%20do%20Cliente."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white"
              >
                Falar com Eng. Kaio no WhatsApp
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          ) : existingRequest || justSubmitted ? (
            <div className="space-y-5">
              <Clock className="w-7 h-7 text-[#e8c67a]" aria-hidden="true" />
              <div>
                <p className="text-xs font-mono text-[#95a491] mb-1.5">
                  SOLICITAÇÃO REGISTRADA
                </p>
                <h1 className="font-display text-2xl font-medium text-[#f0f1ed]">
                  {existingRequest?.status === 'recusada'
                    ? 'Solicitação de acesso não aprovada'
                    : 'Aguardando aprovação do administrador'}
                </h1>
              </div>

              <p className="text-sm text-[#aeb6af] leading-relaxed">
                {existingRequest?.status === 'recusada'
                  ? 'O administrador revisou sua solicitação e não liberou o acesso no momento. Caso acredite que houve engano, entre em contato pelo WhatsApp.'
                  : 'Recebemos seu pedido de acesso à Área do Cliente da KH Engenharia. Assim que o Eng. Kaio Henrique aprovar seu cadastro no painel administrativo, esta página será liberada automaticamente.'}
              </p>

              {existingRequest && (
                <div className="pt-4 border-t border-[#202621] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#858f87]">Situação</span>
                    <span className={`font-medium ${ACCESS_REQUEST_STATUS_META[existingRequest.status].textClass}`}>
                      {ACCESS_REQUEST_STATUS_META[existingRequest.status].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#858f87]">Serviço informado</span>
                    <span className="text-[#e3e7e1]">
                      {SERVICE_TYPE_LABELS[existingRequest.serviceInterest]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#858f87]">Enviada em</span>
                    <span className="font-mono tabular-nums text-[#aeb6af]">
                      {formatTimestampPtBr(existingRequest.createdAt)}
                    </span>
                  </div>
                  {existingRequest.adminNotes && (
                    <div className="pt-2 border-t border-[#1e2420] text-[#cbd2cb]">
                      <strong>Observação da KH:</strong> {existingRequest.adminNotes}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/5544997453807?text=${encodeURIComponent(
                    `Olá Kaio! Acabei de solicitar aprovação de acesso na Área do Cliente com o e-mail ${user.email || ''}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white"
                >
                  Avisar no WhatsApp
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a
                  href="/"
                  className="px-4 py-2.5 border border-[#374038] text-xs text-[#d8ddd6] hover:border-[#788a76]"
                >
                  Voltar ao site
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-mono text-[#95a491] mb-1.5">
                  ACESSO EXCLUSIVO PARA CLIENTES APROVADOS
                </p>
                <h1 className="font-display text-2xl font-medium text-[#f0f1ed]">
                  Solicite a liberação do seu acesso
                </h1>
                <p className="text-sm text-[#aeb6af] leading-relaxed mt-1.5">
                  Seu e-mail (<strong>{user.email}</strong>) ainda não está cadastrado como cliente ativo. Preencha os dados abaixo para que o Eng. Kaio Henrique aprove e crie seu acesso.
                </p>
              </div>

              {error && (
                <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Nome completo *</label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.displayName}
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Seu nome"
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
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Cidade *</label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.city}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#aeb6af] mb-1.5">Serviço contratado ou desejado *</label>
                  <select
                    value={form.serviceInterest}
                    onChange={(e) =>
                      setForm({ ...form, serviceInterest: e.target.value as ServiceType })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                  >
                    {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((key) => (
                      <option key={key} value={key}>
                        {SERVICE_TYPE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#aeb6af] mb-1.5">
                  Informações do projeto ou imóvel (opcional)
                </label>
                <textarea
                  rows={3}
                  maxLength={BLUEPRINT_LIMITS.accessMessage}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Informe o endereço do imóvel ou número de atendimento combinado com a KH Engenharia."
                  className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#7f8981] inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#95a491]" aria-hidden="true" />
                  Aprovação manual pelo engenheiro
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  {submitting ? 'Enviando...' : 'Solicitar aprovação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
