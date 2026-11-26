import React, { useState } from 'react';
import { sendEmailVerification, type User } from 'firebase/auth';
import { Check, MailCheck, RefreshCw } from 'lucide-react';
import { KhSiteFooter, KhSiteHeader } from './KhSiteHeader';

interface EmailVerificationGateProps {
  user: User;
  onVerified: () => void;
  onSignOut: () => void;
}

export function EmailVerificationGate({
  user,
  onVerified,
  onSignOut,
}: EmailVerificationGateProps) {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setSending(true);
    setError(null);
    setSentMessage(null);
    try {
      await sendEmailVerification(user);
      setSentMessage('E-mail de confirmação reenviado. Verifique sua caixa de entrada e spam.');
    } catch {
      setError('Aguarde alguns instantes antes de solicitar um novo e-mail de verificação.');
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setError(null);
    try {
      await user.reload();
      if (user.emailVerified) {
        await user.getIdToken(true);
        onVerified();
      } else {
        setError(
          'Seu e-mail ainda consta como pendente. Clique no link enviado na sua caixa de entrada e tente novamente.'
        );
      }
    } catch {
      setError('Não foi possível atualizar o status da conta agora. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex flex-col">
      <KhSiteHeader variant="public" signedInEmail={user.email} onSignOut={onSignOut} />

      <main className="flex-1 kh-hero-backdrop flex items-center py-12">
        <div className="kh-wrap">
          <div className="max-w-xl border border-[#303a32] bg-[#121613]/95 p-8 sm:p-10 space-y-6">
            <div className="space-y-3">
              <div className="kh-eyebrow">Confirmação de conta</div>
              <div className="pt-1 flex items-center gap-3">
                <MailCheck className="w-6 h-6 text-[#c0d0b8] shrink-0" aria-hidden="true" />
                <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed]">
                  Confirme seu e-mail para liberar o acesso
                </h1>
              </div>
              <p className="text-sm text-[#aab5ac] leading-relaxed">
                Por segurança, enviamos um link de verificação para{' '}
                <strong className="text-[#f0f1ed] font-medium">{user.email}</strong>. Abra o link no seu e-mail e depois clique no botão abaixo para entrar no portal.
              </p>
            </div>

            {sentMessage && (
              <div className="p-3 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{sentMessage}</span>
              </div>
            )}

            {error && (
              <div
                className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={checking}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-bold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                {checking ? 'Verificando...' : 'Já confirmei meu e-mail'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                className="px-4 py-3 border border-[#465246] text-xs font-medium text-[#d8ddd6] hover:border-[#9baf91] disabled:opacity-60 cursor-pointer"
              >
                {sending ? 'Reenviando...' : 'Reenviar e-mail'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <KhSiteFooter />
    </div>
  );
}
