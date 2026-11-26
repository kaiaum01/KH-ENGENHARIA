import React, { useState } from 'react';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  auth,
  FIREBASE_PROJECT_ID,
  googleProvider,
} from '../lib/firebase';
import { mapFirebaseAuthErrorPtBr } from '../lib/validation';
import { KhSiteFooter, KhSiteHeader } from './KhSiteHeader';

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

  const highlights = adminAppMode
    ? [
        {
          num: '01 / CLIENTES',
          title: 'Aprovação e criação de acessos',
          text: 'Aprove pedidos pendentes e crie contas de clientes com senha diretamente pelo painel.',
        },
        {
          num: '02 / PROJETOS',
          title: 'Cronograma, pranchas e ARTs',
          text: 'Atualize etapas técnicas, publique documentos por revisão e acompanhe prazos.',
        },
        {
          num: '03 / ACESSO DIRETO',
          title: 'Login pronto para o dia a dia',
          text: 'Seu e-mail de administrador já vem preenchido para entrada rápida no aplicativo.',
        },
      ]
    : [
        {
          num: '01 / ACOMPANHAMENTO',
          title: 'Cronograma em tempo real',
          text: 'Veja o avanço de cada etapa técnica do seu imóvel, da vistoria à aprovação.',
        },
        {
          num: '02 / DOCUMENTAÇÃO',
          title: 'Pranchas, laudos e ARTs',
          text: 'Consulte arquivos, protocolos de prefeitura e documentos organizados por revisão.',
        },
        {
          num: '03 / COMUNICAÇÃO',
          title: 'Canal direto com a engenharia',
          text: 'Mensagens e solicitações registradas dentro do seu projeto com o Eng. Kaio Henrique.',
        },
      ];

  return (
    <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex flex-col">
      <KhSiteHeader variant="public" adminAppMode={adminAppMode} />

      {/* Hero Band with exact same architectural banner backdrop & .kh-wrap width as /index.html */}
      <main className="flex-1 kh-hero-backdrop flex flex-col justify-between">
        <div className="kh-wrap pt-12 pb-10 md:pt-[72px] md:pb-12 flex-1 flex flex-col justify-between">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-14 items-center">
            {/* Left Column: Editorial Headline matching /index.html */}
            <div>
              <div className="kh-eyebrow">
                {adminAppMode ? 'KH Admin · Acesso Direto' : 'Área do Cliente'}
              </div>

              <h1 className="font-display font-medium text-[clamp(40px,5vw,66px)] leading-[1.06] tracking-[-2.5px] sm:tracking-[-3.5px] mt-6 mb-6 text-[#f0f1ed]">
                {adminAppMode ? (
                  <>
                    Painel de gestão
                    <br />
                    <em className="not-italic text-[#c0d0b8]">KH Engenharia.</em>
                  </>
                ) : (
                  <>
                    Acompanhe o seu projeto
                    <br />
                    <em className="not-italic text-[#c0d0b8]">com clareza.</em>
                  </>
                )}
              </h1>

              <p className="text-[#d3dad3] text-[15px] sm:text-[16px] leading-[1.8] max-w-[490px] mb-9">
                {adminAppMode
                  ? 'Digite sua senha de administrador para gerenciar clientes, aprovações, projetos e documentos técnicos.'
                  : 'Ambiente exclusivo para clientes da KH Engenharia acompanharem etapas técnicas, pranchas, ARTs e solicitações.'}
              </p>

              {/* Editorial 3-Row Detail Strip matching /index.html .step/.service-detail */}
              <div className="border-t border-[#303333] divide-y divide-[#303333] max-w-[520px]">
                {highlights.map((item) => (
                  <div key={item.num} className="py-4 grid sm:grid-cols-[150px_1fr] gap-2 sm:gap-5 items-baseline">
                    <span className="font-mono text-[11px] tracking-[1px] text-[#8d9a91]">
                      {item.num}
                    </span>
                    <div>
                      <div className="font-display text-[15px] font-medium text-[#f0f1ed]">
                        {item.title}
                      </div>
                      <p className="text-[13px] text-[#aab5ac] leading-[1.7] mt-0.5">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Architectural Login Box matching .service-detail / .contact-box */}
            <div className="bg-[#121613]/95 border border-[#303a32] p-7 sm:p-9">
              <div className="pb-5 mb-6 border-b border-[#303a32] flex items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] tracking-[1.2px] text-[#8d9a91] block">
                    {adminAppMode ? 'ACESSO ADMINISTRATIVO' : 'ACESSO AO PORTAL'}
                  </span>
                  <h2 className="font-display text-[22px] font-medium tracking-[-0.5px] text-[#f0f1ed] mt-1">
                    {adminAppMode ? 'Bem-vindo, Eng. Kaio' : 'Entrar na sua conta'}
                  </h2>
                </div>
                <img
                  src="/projetos/kh-logo-metal.png"
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 object-contain opacity-90 shrink-0"
                  referrerPolicy="no-referrer"
                />
              </div>

              <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                <div>
                  <label htmlFor="auth-email" className="block text-xs text-[#aab5ac] mb-1.5">
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
                    className="w-full px-3.5 py-3 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed] placeholder:text-[#6d776f] focus:border-[#9baf91]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password" className="text-xs text-[#aab5ac]">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-[11px] text-[#b3c4ad] hover:text-white underline underline-offset-4 cursor-pointer"
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
                      className="w-full pl-3.5 pr-10 py-3 text-sm bg-[#0b0c0c] border border-[#303a32] text-[#f0f1ed] placeholder:text-[#6d776f] focus:border-[#9baf91]"
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
                  className="w-full inline-flex items-center justify-between gap-4 px-5 py-4 bg-[#d8ddd6] text-[#141815] text-[13px] font-bold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
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

              <div className="my-5 flex items-center gap-3 text-[11px] text-[#737d75]">
                <span className="h-px flex-1 bg-[#303a32]" />
                <span>ou</span>
                <span className="h-px flex-1 bg-[#303a32]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-[#465246] bg-[#151b17] text-[#e3e7e1] text-xs font-medium hover:border-[#9baf91] hover:bg-[#1e2620] transition-colors disabled:opacity-60 cursor-pointer"
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
                <p className="mt-4 text-[11px] text-[#8f9991] leading-relaxed">
                  Ainda não possui cadastro liberado? Entre com Google para solicitar aprovação diretamente ao Eng. Kaio Henrique.
                </p>
              )}

              <div className="mt-5 pt-4 border-t border-[#252d27] flex items-center justify-between text-[11px] text-[#858f87]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#95a791]" aria-hidden="true" />
                  Acesso protegido
                </span>
                <span className="font-mono">CREA-PR PR-232385/D</span>
              </div>
            </div>
          </div>

          {/* Hero Bottom Strip matching /index.html .hero-bottom */}
          <div className="border-t border-white/20 mt-12 pt-5 flex flex-wrap items-center justify-between gap-4 text-[11px] tracking-[1px] text-[#c0c9c0]">
            <span>PRECISÃO EM CADA DETALHE.</span>
            <a
              href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Preciso%20de%20ajuda%20com%20o%20acesso%20ao%20portal%20KH%20Engenharia."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              SUPORTE VIA WHATSAPP ↗
            </a>
          </div>
        </div>
      </main>

      <KhSiteFooter />
    </div>
  );
}
