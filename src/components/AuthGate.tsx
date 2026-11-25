import React, { useState } from 'react';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  FileCheck2,
  FolderKanban,
  KeyRound,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  auth,
  FIREBASE_PROJECT_ID,
  googleProvider,
} from '../lib/firebase';
import { mapFirebaseAuthErrorPtBr } from '../lib/validation';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthGateProps {
  adminAppMode?: boolean;
}

export function AuthGate({ adminAppMode = false }: AuthGateProps) {
  const [email, setEmail] = useState(adminAppMode ? ADMIN_EMAIL : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [signingIn, setSigningIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsEmailProviderSetup, setNeedsEmailProviderSetup] = useState(false);

  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`;

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError(null);
    setResetSent(false);
    setNeedsEmailProviderSetup(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setAuthError('Informe seu e-mail e sua senha para continuar.');
      setSigningIn(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (err) {
      const mapped = mapFirebaseAuthErrorPtBr(err);
      if (mapped === 'AUTH_EMAIL_PASSWORD_DISABLED') {
        setNeedsEmailProviderSetup(true);
        setAuthError(null);
      } else {
        setAuthError(mapped);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    setResetSent(false);
    setNeedsEmailProviderSetup(false);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(mapFirebaseAuthErrorPtBr(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setAuthError('Digite seu e-mail acima antes de solicitar a redefinição de senha.');
      return;
    }
    setAuthError(null);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSent(true);
    } catch (err) {
      const mapped = mapFirebaseAuthErrorPtBr(err);
      if (mapped === 'AUTH_EMAIL_PASSWORD_DISABLED') {
        setNeedsEmailProviderSetup(true);
      } else {
        setAuthError(mapped);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] grid lg:grid-cols-12">
      {/* Left Column: Authentication Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-14 border-b lg:border-b-0 lg:border-r border-[#242a25]">
        {/* Brand Row */}
        <div className="flex items-center justify-between gap-4">
          <a
            href="/"
            className="flex items-center gap-3 group whitespace-nowrap shrink-0"
            aria-label="KH Engenharia — voltar ao site"
          >
            <img
              src="/projetos/kh-logo-metal.png"
              alt="Monograma KH"
              className="w-11 h-11 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="font-display font-extrabold text-[15px] tracking-[1.4px] kh-metallic-wordmark leading-none">
                KAIO HENRIQUE
              </div>
              <div className="text-[9px] font-semibold tracking-[2px] text-[#aeb6af] mt-1.5">
                ENGENHEIRO CIVIL
              </div>
            </div>
          </a>

          <div className="flex items-center gap-3 shrink-0">
            {adminAppMode && <PWAInstallButton compact />}
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#aeb6af] hover:text-[#f0f1ed] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Voltar ao site
            </a>
          </div>
        </div>

        {/* Login Form */}
        <div className="py-10 lg:py-12 max-w-md w-full">
          <div className="flex items-center gap-3 text-[11px] tracking-[2.2px] uppercase text-[#a8baa4] mb-4">
            <span className="w-6 h-px bg-current" aria-hidden="true" />
            {adminAppMode ? 'KH Admin · Acesso Direto' : 'Área do Cliente'}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#f0f1ed] leading-[1.12] mb-3">
            {adminAppMode
              ? 'Bem-vindo de volta, Eng. Kaio.'
              : 'Acompanhe o seu projeto com clareza.'}
          </h1>

          <p className="text-sm text-[#aeb6af] leading-relaxed mb-7">
            {adminAppMode
              ? 'Digite sua senha de administrador abaixo para abrir diretamente a gestão de clientes, aprovações e projetos.'
              : 'Entre com seu e-mail e senha de acesso ou conecte sua conta Google para acompanhar projetos, documentos e solicitações.'}
          </p>

          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs text-[#aeb6af] mb-1.5">
                E-mail
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#121513] border border-[#2c342d] text-[#f0f1ed] placeholder:text-[#6d776f] focus:border-[#8fa38c]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="text-xs text-[#aeb6af]">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[11px] text-[#95a491] hover:text-[#e3e7e1] underline underline-offset-4 cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus={adminAppMode}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#121513] border border-[#2c342d] text-[#f0f1ed] placeholder:text-[#6d776f] focus:border-[#8fa38c]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8981] hover:text-[#e3e7e1] cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="w-full inline-flex items-center justify-between gap-4 px-5 py-3.5 bg-[#d8ddd6] text-[#141815] text-sm font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5">
                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                {signingIn
                  ? 'Verificando acesso...'
                  : adminAppMode
                    ? 'Entrar no Painel Admin'
                    : 'Entrar no portal'}
              </span>
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </form>

          {resetSent && (
            <div className="mt-4 p-3 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Enviamos um link de redefinição de senha para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </span>
            </div>
          )}

          {authError && (
            <div
              className="mt-4 p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78] leading-relaxed"
              role="alert"
            >
              {authError}
            </div>
          )}

          {needsEmailProviderSetup && (
            <div className="mt-4 p-4 border border-[#5e4d29] bg-[#1d1910] text-xs text-[#e8c67a] space-y-2 leading-relaxed">
              <div className="font-semibold text-[#f3dca2]">
                Ative o provedor "E-mail/senha" no Firebase Console
              </div>
              <p className="text-[#d4c49c]">
                Para usar login por e-mail e senha, habilite o método{' '}
                <strong>E-mail/senha</strong> em Authentication → Sign-in method. Enquanto isso, você pode entrar com Google abaixo.
              </p>
              <a
                href={firebaseProvidersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-white underline underline-offset-4"
              >
                Abrir Firebase Authentication
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          )}

          {/* Divider + Google Sign-In */}
          <div className="my-5 flex items-center gap-3 text-[11px] text-[#737d75]">
            <span className="h-px flex-1 bg-[#242a25]" />
            <span>ou</span>
            <span className="h-px flex-1 bg-[#242a25]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-[#323c34] bg-[#121513] text-[#e3e7e1] text-xs font-medium hover:border-[#788a76] hover:bg-[#171c19] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#d8ddd6"
                d="M21.35 11.1H12v2.98h5.35c-.23 1.48-1.74 4.35-5.35 4.35-3.22 0-5.85-2.67-5.85-5.93s2.63-5.93 5.85-5.93c1.83 0 3.06.78 3.76 1.45l2.56-2.48C16.68 4 14.54 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.19 0 8.64-3.65 8.64-8.79 0-.59-.07-1.04-.29-1.11z"
              />
            </svg>
            {googleLoading
              ? 'Conectando Google...'
              : adminAppMode
                ? 'Entrar com Google (Admin)'
                : 'Continuar com Google'}
          </button>

          {!adminAppMode && (
            <p className="mt-3 text-[11px] text-[#858f87] leading-relaxed">
              Ainda não tem acesso liberado? Entre com sua conta Google para enviar sua solicitação de cadastro ao engenheiro responsável.
            </p>
          )}
        </div>

        {/* Footer Legal Note */}
        <div className="pt-6 border-t border-[#1e231f] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#7f8981]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#95a791]" aria-hidden="true" />
            Acesso privado e autenticado
          </span>
          <span className="font-mono">CREA-PR PR-232385/D</span>
        </div>
      </div>

      {/* Right Column: Architectural Visual Showcase */}
      <div className="lg:col-span-6 xl:col-span-7 relative min-h-[340px] lg:min-h-screen bg-[#111412] flex flex-col justify-between overflow-hidden">
        <img
          src={adminAppMode ? '/projetos/instalacoes.png' : '/projetos/residencia.png'}
          alt={
            adminAppMode
              ? 'Modelagem técnica de instalações de autoria de Kaio Henrique'
              : 'Projeto arquitetônico residencial de autoria de Kaio Henrique'
          }
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45"
          referrerPolicy="no-referrer"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0b0c0c] via-[#0b0c0c]/75 to-[#0b0c0c]/55"
          aria-hidden="true"
        />

        <div className="relative z-10 p-8 lg:p-12 flex items-center justify-between text-xs text-[#cbd2cb]">
          <span className="font-mono tracking-wider">KH ENGENHARIA · UMUARAMA, PR</span>
          <a
            href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Preciso%20de%20ajuda%20com%20o%20acesso%20ao%20portal%20KH%20Engenharia."
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-white transition-colors"
          >
            Suporte via WhatsApp
          </a>
        </div>

        <div className="relative z-10 p-8 lg:p-12 max-w-xl space-y-6">
          <div>
            <p className="text-xs font-mono text-[#b3c4ad] mb-3">
              {adminAppMode
                ? 'APLICATIVO ADMINISTRATIVO · GESTÃO DIÁRIA'
                : 'REGULARIZAÇÃO · PROJETOS · LAUDOS · COMPLEMENTARES'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed] leading-snug mb-3">
              {adminAppMode
                ? 'Gestão centralizada de clientes, aprovações e obras.'
                : 'Acesso exclusivo mediante aprovação do engenheiro responsável.'}
            </h2>
            <p className="text-sm text-[#c4cbc4] leading-relaxed">
              {adminAppMode
                ? 'Aprove novos clientes, crie credenciais de acesso sem sair do painel, acompanhe prazos técnicos e publique pranchas e ARTs em tempo real.'
                : 'Centralizamos etapas técnicas, pranchas, laudos, protocolos de prefeitura e a comunicação direta com o Eng. Kaio Henrique em um ambiente seguro.'}
            </p>
          </div>

          <div className="pt-5 border-t border-white/10 grid sm:grid-cols-2 gap-4 text-xs text-[#cbd2cb]">
            {adminAppMode ? (
              <>
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-[#b3c4ad] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Aprovação e criação imediata de usuários de clientes.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-[#b3c4ad] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Acesso rápido com e-mail pré-preenchido e sessão protegida.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <FolderKanban className="w-4 h-4 text-[#b3c4ad] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Cronograma técnico atualizado em tempo real.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-[#b3c4ad] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Pranchas, laudos, protocolos e ARTs organizados por revisão.</span>
                </div>
                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MessageSquare className="w-4 h-4 text-[#b3c4ad] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Canal direto registrado dentro de cada projeto com o Eng. Kaio Henrique.</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
