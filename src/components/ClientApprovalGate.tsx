import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  Clock,
  ExternalLink,
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
import { KhSiteFooter, KhSiteHeader } from './KhSiteHeader';

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
      <KhSiteHeader variant="public" signedInEmail={user.email} onSignOut={onSignOut} />

      <main className="flex-1 kh-hero-backdrop py-12 md:py-16">
        <div className="kh-wrap">
          <div className="max-w-2xl border border-[#303a32] bg-[#121613]/95 p-7 sm:p-10 space-y-6">
            {isSuspended ? (
              <div className="space-y-4">
                <div className="kh-eyebrow">Acesso suspenso</div>
                <div className="flex items-center gap-3 pt-1">
                  <ShieldAlert className="w-6 h-6 text-[#f09d78] shrink-0" aria-hidden="true" />
                  <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed]">
                    Seu acesso está temporariamente suspenso
                  </h1>
                </div>
                <p className="text-sm text-[#aab5ac] leading-relaxed">
                  O cadastro associado ao e-mail <strong>{user.email}</strong> encontra-se suspenso no momento. Entre em contato com o Eng. Kaio Henrique para reativação.
                </p>
                <a
                  href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Gostaria%20de%20verificar%20a%20reativa%C3%A7%C3%A3o%20do%20meu%20acesso%20na%20%C3%81rea%20do%20Cliente."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-bold hover:bg-white"
                >
                  Falar com Eng. Kaio no WhatsApp
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            ) : existingRequest || justSubmitted ? (
              <div className="space-y-5">
                <div className="kh-eyebrow">Solicitação registrada</div>
                <div className="flex items-center gap-3 pt-1">
                  <Clock className="w-6 h-6 text-[#e8c67a] shrink-0" aria-hidden="true" />
                  <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed]">
                    {existingRequest?.status === 'recusada'
                      ? 'Solicitação de acesso não aprovada'
                      : 'Aguardando aprovação do administrador'}
                  </h1>
                </div>

                <p className="text-sm text-[#aab5ac] leading-relaxed">
                  {existingRequest?.status === 'recusada'
                    ? 'O administrador revisou sua solicitação e não liberou o acesso no momento. Caso acredite que houve engano, entre em contato pelo WhatsApp.'
                    : 'Recebemos seu pedido de acesso à Área do Cliente da KH Engenharia. Assim que o Eng. Kaio Henrique aprovar seu cadastro no painel administrativo, esta página será liberada automaticamente.'}
                </p>

                {existingRequest && (
                  <div className="pt-4 border-t border-[#303a32] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8f9991]">Situação</span>
                      <span
                        className={`font-medium ${
                          ACCESS_REQUEST_STATUS_META[existingRequest.status].textClass
                        }`}
                      >
                        {ACCESS_REQUEST_STATUS_META[existingRequest.status].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8f9991]">Serviço informado</span>
                      <span className="text-[#e3e7e1]">
                        {SERVICE_TYPE_LABELS[existingRequest.serviceInterest]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8f9991]">Enviada em</span>
                      <span className="font-mono tabular-nums text-[#aab5ac]">
                        {formatTimestampPtBr(existingRequest.createdAt)}
                      </span>
                    </div>
                    {existingRequest.adminNotes && (
                      <div className="pt-2.5 border-t border-[#252d27] text-[#cbd2cb]">
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
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-bold hover:bg-white"
                  >
                    Avisar no WhatsApp
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href="/"
                    className="px-4 py-3 border border-[#465246] text-xs text-[#d8ddd6] hover:border-[#9baf91]"
                  >
                    Voltar ao site
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="kh-eyebrow">Acesso exclusivo</div>
                  <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed] mt-3">
                    Solicite a liberação do seu acesso
                  </h1>
                  <p className="text-sm text-[#aab5ac] leading-relaxed mt-2">
                    Seu e-mail (<strong>{user.email}</strong>) ainda não está cadastrado como cliente ativo. Preencha os dados abaixo para que o Eng. Kaio Henrique aprove e crie seu acesso.
                  </p>
                </div>

                {error && (
                  <div
                    className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#aab5ac] mb-1.5">Nome completo *</label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.displayName}
                      value={form.displayName}
                      onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                      placeholder="Seu nome"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#aab5ac] mb-1.5">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.phone}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(44) 99999-0000"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#aab5ac] mb-1.5">Cidade *</label>
                    <input
                      type="text"
                      required
                      maxLength={BLUEPRINT_LIMITS.city}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#aab5ac] mb-1.5">
                      Serviço contratado ou desejado *
                    </label>
                    <select
                      value={form.serviceInterest}
                      onChange={(e) =>
                        setForm({ ...form, serviceInterest: e.target.value as ServiceType })
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed]"
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
                  <label className="block text-xs text-[#aab5ac] mb-1.5">
                    Informações do projeto ou imóvel (opcional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={BLUEPRINT_LIMITS.accessMessage}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Informe o endereço do imóvel ou número de atendimento combinado com a KH Engenharia."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed]"
                  />
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-[#8f9991] inline-flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#95a791]" aria-hidden="true" />
                    Aprovação manual pelo engenheiro
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-bold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    {submitting ? 'Enviando...' : 'Solicitar aprovação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <KhSiteFooter />
    </div>
  );
}
