import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ArrowUpRight, Check, ExternalLink, Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import type { UserProfile } from '../types/portal';
import { setOrUpdateAdminPassword, updateUserProfile } from '../lib/portalService';
import { FIREBASE_PROJECT_ID } from '../lib/firebase';
import { BLUEPRINT_LIMITS } from '../lib/validation';

interface ProfileViewProps {
  user: User;
  profile: UserProfile | null;
  isAdmin: boolean;
  onProfileUpdated: (updated: UserProfile) => void;
}

export function ProfileView({
  user,
  profile,
  isAdmin,
  onProfileUpdated,
}: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || 'Umuarama, PR');
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password setup / change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdSavedOk, setPwdSavedOk] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [needsEmailProvider, setNeedsEmailProvider] = useState(false);
  const [hasPasswordLinked, setHasPasswordLinked] = useState(() =>
    user.providerData.some((p) => p.providerId === 'password')
  );
  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/providers`;

  useEffect(() => {
    setHasPasswordLinked(user.providerData.some((p) => p.providerId === 'password'));
  }, [user]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPhone(profile.phone);
      setCity(profile.city);
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);
    setError(null);
    try {
      await updateUserProfile(user.uid, { displayName, phone, city });
      onProfileUpdated({
        uid: user.uid,
        email: (user.email || '').toLowerCase(),
        displayName: displayName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      setSavedOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar seus dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSavedOk(false);
    setNeedsEmailProvider(false);

    if (newPassword.length < 6) {
      setPwdError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('As duas senhas digitadas não conferem.');
      return;
    }

    setSavingPwd(true);
    try {
      await setOrUpdateAdminPassword(user, newPassword);
      setHasPasswordLinked(true);
      setNewPassword('');
      setConfirmPassword('');
      setPwdSavedOk(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar senha.';
      if (msg === 'AUTH_EMAIL_PASSWORD_DISABLED') {
        setNeedsEmailProvider(true);
      } else {
        setPwdError(msg);
      }
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="pb-6 border-b border-[#242a25]">
        <p className="text-xs font-mono tracking-wider text-[#95a491] mb-2">
          CONTA PRIVADA · {isAdmin ? 'ADMINISTRADOR · ENGENHEIRO RESPONSÁVEL' : 'CLIENTE'}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#f0f1ed]">
          {isAdmin ? 'Segurança e senha do administrador' : 'Meus dados e senha'}
        </h1>
        <p className="text-sm text-[#9aa49c] mt-1.5">
          {isAdmin
            ? 'Configure sua senha pessoal de administrador para entrar no painel com e-mail e senha, e mantenha seus dados atualizados.'
            : 'Atualize seus dados de contato ou defina uma nova senha de acesso à Área do Cliente.'}
        </p>
      </div>

      {/* Password Management Section */}
      <form
        onSubmit={handleSavePassword}
        className="border border-[#242a25] bg-[#121513] p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#202621]">
          <div>
            <h2 className="font-display text-base font-medium text-[#f0f1ed] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#b3c4ad]" aria-hidden="true" />
              {hasPasswordLinked
                ? 'Alterar senha de acesso'
                : isAdmin
                  ? 'Definir minha senha de administrador'
                  : 'Definir senha de acesso'}
            </h2>
            <p className="text-xs text-[#8f9991] mt-1">
              {hasPasswordLinked
                ? `Login por e-mail e senha ativo para ${user.email}.`
                : `Vincule uma senha à conta ${user.email} para entrar diretamente pelo formulário de e-mail e senha.`}
            </p>
          </div>
          <span
            className={`text-xs font-medium whitespace-nowrap ${
              hasPasswordLinked ? 'text-[#86d69d]' : 'text-[#e8c67a]'
            }`}
          >
            {hasPasswordLinked ? 'Senha configurada' : 'Somente Google'}
          </span>
        </div>

        {pwdError && (
          <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
            {pwdError}
          </div>
        )}

        {needsEmailProvider && (
          <div className="p-4 border border-[#5e4d29] bg-[#1d1910] text-xs text-[#e8c67a] space-y-2 leading-relaxed">
            <div className="font-semibold text-[#f3dca2]">
              Ative "E-mail/senha" no Firebase Authentication primeiro
            </div>
            <p className="text-[#d4c49c]">
              Acesse o Firebase Console em Authentication → Sign-in method, habilite o provedor{' '}
              <strong>E-mail/senha</strong> e salve. Depois volte aqui e salve sua senha normalmente.
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

        {pwdSavedOk && (
          <div className="p-3 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            Senha salva com sucesso. Você já pode entrar com seu e-mail e esta senha no login do painel.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">Nova senha *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-3 pr-10 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8981] hover:text-white cursor-pointer"
                aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">Confirmar nova senha *</label>
            <input
              type={showPwd ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="submit"
            disabled={savingPwd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors disabled:opacity-60 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            {savingPwd
              ? 'Salvando senha...'
              : hasPasswordLinked
                ? 'Atualizar senha'
                : 'Definir senha'}
          </button>
        </div>
      </form>

      {/* Profile Information Form */}
      <form
        onSubmit={handleSaveProfile}
        className="border border-[#242a25] bg-[#121513] p-6 sm:p-8 space-y-5"
      >
        <div className="pb-4 border-b border-[#202621]">
          <h2 className="font-display text-base font-medium text-[#f0f1ed]">
            Informações cadastrais
          </h2>
        </div>

        {error && (
          <div className="p-3 border border-[#733c2e] bg-[#241411] text-xs text-[#f09d78]" role="alert">
            {error}
          </div>
        )}

        {savedOk && (
          <div className="p-3 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            Dados atualizados com sucesso.
          </div>
        )}

        <div>
          <label className="block text-xs text-[#aeb6af] mb-1.5">E-mail da conta</label>
          <input
            type="email"
            disabled
            value={user.email || ''}
            className="w-full px-3 py-2.5 text-sm bg-[#0e100f] border border-[#202621] text-[#858f87] cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs text-[#aeb6af] mb-1.5">Nome completo *</label>
          <input
            type="text"
            required
            maxLength={BLUEPRINT_LIMITS.displayName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">WhatsApp / Telefone</label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(44) 99999-0000"
              className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#aeb6af] mb-1.5">Cidade</label>
            <input
              type="text"
              maxLength={BLUEPRINT_LIMITS.city}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Umuarama, PR"
              className="w-full px-3 py-2.5 text-sm bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed]"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            {saving ? 'Salvando...' : 'Salvar dados'}
          </button>
        </div>
      </form>

      {/* Direct KH Support Block */}
      <div className="border border-[#242a25] bg-[#121513] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-[#f0f1ed]">KH Engenharia · Responsável Técnico</div>
          <p className="text-xs text-[#8f9991] mt-1">
            Kaio Henrique da Silva · Engenheiro Civil · CREA-PR PR-232385/D · Umuarama, PR
          </p>
        </div>
        <a
          href="https://wa.me/5544997453807?text=Ol%C3%A1%20Kaio!%20Estou%20na%20%C3%81rea%20do%20Cliente%20da%20KH%20Engenharia."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap shrink-0"
        >
          WhatsApp (44) 99745-3807
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
