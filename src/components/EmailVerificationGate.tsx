import React, { useState } from 'react';
import { sendEmailVerification, type User } from 'firebase/auth';
import { Check, LogOut, MailCheck, RefreshCw } from 'lucide-react';

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
        setError('Seu e-mail ainda consta como pendente. Clique no link enviado na sua caixa de entrada e tente novamente.');
      }
    } catch {
      setError('Não foi possível atualizar o status da conta agora. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex items-center justify-center p-6">
      <div className="w-full max-w-lg border border-[#2a322c] bg-[#121513] p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/projetos/kh-logo-metal.png"
              alt="Monograma KH"
              className="w-9 h-9 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-display font-extrabold text-xs tracking-[1.4px] kh-metallic-wordmark">
              KH ENGENHARIA
            </span>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 text-xs text-[#9aa49c] hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Sair
          </button>
        </div>

        <div className="space-y-3">
          <MailCheck className="w-7 h-7 text-[#b3c4ad]" aria-hidden="true" />
          <h1 className="font-display text-2xl font-medium text-[#f0f1ed]">
            Confirme seu e-mail para liberar o acesso
          </h1>
          <p className="text-sm text-[#aeb6af] leading-relaxed">
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
          <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            {checking ? 'Verificando...' : 'Já confirmei meu e-mail'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="px-4 py-2.5 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] disabled:opacity-60 cursor-pointer"
          >
            {sending ? 'Reenviando...' : 'Reenviar e-mail'}
          </button>
        </div>
      </div>
    </div>
  );
}
