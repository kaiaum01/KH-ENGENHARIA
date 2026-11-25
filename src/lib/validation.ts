/**
 * Blueprint-synchronized input bounds and sanitization helpers.
 * Mirrors maxLength, minLength, and regex constraints from firebase-blueprint.json.
 */

export const BLUEPRINT_LIMITS = {
  id: 128,
  email: 254,
  displayName: 120,
  phone: 30,
  city: 100,
  code: 32,
  title: 160,
  propertyAddress: 240,
  artNumber: 60,
  protocolNumber: 60,
  summary: 1500,
  nextStep: 300,
  estimatedDelivery: 40,
  description: 2000,
  milestoneDescription: 600,
  revision: 32,
  fileUrl: 1000,
  notes: 600,
  clientNotes: 500,
  adminNotes: 500,
  accessMessage: 1000,
  messageBody: 2000,
  dateField: 40,
} as const;

export const BLUEPRINT_PATTERNS = {
  id: /^[a-zA-Z0-9_-]+$/,
  projectCode: /^[A-Z0-9-]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  fileUrl: /^(|https:\/\/.*|\/projetos\/.*)$/,
} as const;

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase().slice(0, BLUEPRINT_LIMITS.email);
}

export function sanitizeProjectCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, BLUEPRINT_LIMITS.code);
}

export function validateFileUrl(value: string): { valid: boolean; value: string; error?: string } {
  const clean = value.trim().slice(0, BLUEPRINT_LIMITS.fileUrl);
  if (!BLUEPRINT_PATTERNS.fileUrl.test(clean)) {
    return {
      valid: false,
      value: clean,
      error: 'Informe um link seguro começando com https:// (ex.: Google Drive, PDF na nuvem) ou deixe vazio.',
    };
  }
  return { valid: true, value: clean };
}

export function formatTimestampPtBr(ts?: { toDate?: () => Date } | null): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Agora';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts.toDate());
  } catch {
    return '—';
  }
}

export function formatDateShortPtBr(dateStr: string): string {
  if (!dateStr) return 'A definir';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function buildFirestoreSafeId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 14)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${randomPart}`.slice(0, BLUEPRINT_LIMITS.id);
}

export function mapFirebaseAuthErrorPtBr(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos. Verifique os dados informados.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail informado não é válido.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui uma conta cadastrada no Firebase Auth.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar novamente.';
    case 'auth/operation-not-allowed':
      return 'AUTH_EMAIL_PASSWORD_DISABLED';
    case 'auth/requires-recent-login':
      return 'Por segurança, saia e entre novamente antes de alterar sua senha.';
    case 'auth/provider-already-linked':
      return 'Sua conta já possui login por e-mail e senha vinculado.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login foi fechada antes da conclusão.';
    case 'auth/popup-blocked':
      return 'Seu navegador bloqueou a janela de login. Permita pop-ups para continuar.';
    default:
      return err instanceof Error ? err.message : 'Não foi possível concluir a autenticação.';
  }
}
