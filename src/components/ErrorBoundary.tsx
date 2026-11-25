import React from 'react';
import { FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../lib/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
  isDailyReadQuota: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isQuotaError: false,
      isDailyReadQuota: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'Erro inesperado na Área do Cliente.';
    let parsedError = raw;
    try {
      const json = JSON.parse(raw);
      if (json && typeof json.error === 'string') {
        parsedError = json.error;
      }
    } catch {
      // Plain error message
    }

    const isDailyReadQuota = parsedError.includes(
      "Quota exceeded for quota metric 'Free daily read units per project (free tier database)'"
    );
    const isQuotaError = isDailyReadQuota || parsedError.toLowerCase().includes('quota exceeded');

    return {
      hasError: true,
      message: parsedError,
      isQuotaError,
      isDailyReadQuota,
    };
  }

  componentDidCatch(error: Error) {
    console.error('Portal ErrorBoundary:', error);
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      message: '',
      isQuotaError: false,
      isDailyReadQuota: false,
    });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const upgradeUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`;

    return (
      <div className="min-h-screen bg-[#0b0c0c] text-[#f0f1ed] flex items-center justify-center p-6">
        <div className="w-full max-w-lg border border-[#2d352e] bg-[#121513] p-8">
          <p className="text-xs font-mono tracking-wider text-[#9aa49c] mb-3">
            KH ENGENHARIA · ÁREA DO CLIENTE
          </p>
          <h1 className="text-2xl font-semibold text-[#f0f1ed] mb-3">
            {this.state.isQuotaError
              ? 'Limite diário do banco de dados atingido'
              : 'Não foi possível carregar esta operação'}
          </h1>
          <p className="text-sm text-[#aeb6af] leading-relaxed mb-6">
            {this.state.isQuotaError
              ? 'A cota gratuita do Firestore foi excedida hoje e será reiniciada no próximo dia. Você pode consultar os limites do plano Spark na documentação do Cloud Firestore.'
              : 'Ocorreu uma restrição de permissão ou falha de conexão com o servidor de dados. Tente recarregar a página ou entrar novamente com sua conta.'}
          </p>

          {this.state.isDailyReadQuota && (
            <p className="text-xs text-[#c5d1c0] mb-6">
              Para ampliar a cota diretamente no console:{' '}
              <a
                href={upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-white"
              >
                Abrir banco de dados no Firebase Console
              </a>
            </p>
          )}

          {!this.state.isQuotaError && (
            <pre className="text-xs font-mono text-[#8e9890] bg-[#0b0c0c] border border-[#242a25] p-3 mb-6 overflow-x-auto whitespace-pre-wrap">
              {this.state.message}
            </pre>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 text-sm font-semibold bg-[#d8ddd6] text-[#141815] hover:bg-white transition-colors cursor-pointer"
            >
              Recarregar portal
            </button>
            <a
              href="/"
              className="px-5 py-2.5 text-sm font-medium border border-[#374038] text-[#d8ddd6] hover:border-[#6a776c] transition-colors"
            >
              Voltar ao site
            </a>
          </div>
        </div>
      </div>
    );
  }
}
