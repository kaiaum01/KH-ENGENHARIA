import React, { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  Laptop,
  Monitor,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const SAFE_LAUNCH_URL_PATTERN =
  /^https?:\/\/[a-zA-Z0-9.-]+(?::\d{1,5})?(?:\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/;

function sanitizeWindowsBatchUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 300) return null;
  // Block any shell metacharacters that could break out of quotes in .bat / VBScript
  if (/["&|<>%^;`\r\n]/.test(trimmed)) return null;
  if (!SAFE_LAUNCH_URL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function buildWindowsLauncherBat(targetUrl: string): string {
  return [
    '@echo off',
    'title KH Engenharia - Painel do Administrador',
    `set "TARGET_URL=${targetUrl}"`,
    '',
    'set "BROWSER="',
    'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"',
    'if not defined BROWSER if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"',
    'if not defined BROWSER if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"',
    'if not defined BROWSER if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"',
    'if not defined BROWSER if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"',
    '',
    'if defined BROWSER (',
    '  start "" "%BROWSER%" --app="%TARGET_URL%" --window-size=1360,860',
    ') else (',
    '  start "" "%TARGET_URL%"',
    ')',
    'exit /b 0',
    '',
  ].join('\r\n');
}

function buildDesktopShortcutInstallerBat(targetUrl: string): string {
  return [
    '@echo off',
    'chcp 65001 >nul',
    'title Instalador de Atalho - KH Engenharia Admin',
    `set "TARGET_URL=${targetUrl}"`,
    'set "BROWSER="',
    '',
    'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"',
    'if not defined BROWSER if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"',
    'if not defined BROWSER if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"',
    'if not defined BROWSER if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"',
    'if not defined BROWSER if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"',
    '',
    'if not defined BROWSER (',
    '  echo Microsoft Edge ou Google Chrome nao encontrado.',
    '  pause',
    '  exit /b 1',
    ')',
    '',
    'set "VBS=%TEMP%\\kh_admin_shortcut.vbs"',
    '(',
    '  echo Set WshShell = CreateObject^("WScript.Shell"^)',
    '  echo DesktopPath = WshShell.SpecialFolders^("Desktop"^)',
    '  echo Set Shortcut = WshShell.CreateShortcut^(DesktopPath ^& "\\KH Engenharia Admin.lnk"^)',
    '  echo Shortcut.TargetPath = "%BROWSER%"',
    '  echo Shortcut.Arguments = "--app=%TARGET_URL% --window-size=1360,860"',
    '  echo Shortcut.Description = "Painel do Administrador - KH Engenharia"',
    '  echo Shortcut.IconLocation = "%BROWSER%,0"',
    '  echo Shortcut.Save',
    ') > "%VBS%"',
    '',
    'cscript //nologo "%VBS%"',
    'del "%VBS%" >nul 2>&1',
    'echo.',
    'echo Atalho "KH Engenharia Admin" criado na sua Area de Trabalho!',
    'echo Abrindo o painel agora...',
    'start "" "%BROWSER%" --app="%TARGET_URL%" --window-size=1360,860',
    'timeout /t 3 >nul',
    'exit /b 0',
    '',
  ].join('\r\n');
}

function triggerFileDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function WindowsAppView() {
  const { isInstallable, isInstalled, isEmbeddedFrame, install } = usePWAInstall();

  const defaultAdminUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/admin/index.html';
    return `${window.location.origin}/admin/index.html`;
  }, []);

  const [targetUrl, setTargetUrl] = useState(defaultAdminUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [downloadedName, setDownloadedName] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showScriptPreview, setShowScriptPreview] = useState(false);

  const safePreviewUrl = sanitizeWindowsBatchUrl(targetUrl) || defaultAdminUrl;

  const handleDownloadLauncher = () => {
    const validated = sanitizeWindowsBatchUrl(targetUrl);
    if (!validated) {
      setUrlError(
        'Informe um endereço válido começando com https:// (sem aspas ou caracteres especiais).'
      );
      return;
    }
    setUrlError(null);
    triggerFileDownload('KH-Engenharia-Admin.bat', buildWindowsLauncherBat(validated));
    setDownloadedName('KH-Engenharia-Admin.bat');
  };

  const handleDownloadShortcutInstaller = () => {
    const validated = sanitizeWindowsBatchUrl(targetUrl);
    if (!validated) {
      setUrlError(
        'Informe um endereço válido começando com https:// (sem aspas ou caracteres especiais).'
      );
      return;
    }
    setUrlError(null);
    triggerFileDownload(
      'Instalar-Atalho-KH-Admin.bat',
      buildDesktopShortcutInstallerBat(validated)
    );
    setDownloadedName('Instalar-Atalho-KH-Admin.bat');
  };

  const handleCopyAdminUrl = async () => {
    try {
      await navigator.clipboard.writeText(safePreviewUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="space-y-9 max-w-4xl">
      {/* Header */}
      <div className="pb-7 border-b border-[#303333] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="kh-eyebrow">Windows 10 / 11 · Acesso direto</div>
          <h1 className="font-display text-3xl sm:text-[42px] font-medium tracking-[-1.5px] leading-[1.12] text-[#f0f1ed] mt-4">
            Aplicativo KH Admin <em className="not-italic text-[#c0d0b8]">para Windows.</em>
          </h1>
          <p className="text-sm sm:text-[15px] text-[#aab5ac] mt-2 max-w-2xl leading-relaxed">
            Abra o seu painel administrativo em uma janela dedicada no Windows (sem barra de endereço ou abas), já carregando direto na sua tela de login com seu e-mail preenchido.
          </p>
        </div>

        {isInstalled && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#3a5741] bg-[#142117] text-xs font-medium text-[#a5e0b3] whitespace-nowrap shrink-0">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            App Windows ativo
          </div>
        )}
      </div>

      {/* Method 1: Native Windows PWA Install (Edge / Chrome) */}
      <section className="border border-[#303a32] bg-[#121613] p-6 sm:p-8 space-y-5">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#202621]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#b3c4ad]">
              <Monitor className="w-4 h-4" aria-hidden="true" />
              OPÇÃO 1 · RECOMENDADA (ICONE + MENU INICIAR + BARRA DE TAREFAS)
            </div>
            <h2 className="font-display text-lg font-medium text-[#f0f1ed]">
              Instalar diretamente pelo navegador (Microsoft Edge ou Chrome)
            </h2>
            <p className="text-xs text-[#9aa49c] leading-relaxed max-w-2xl">
              Instala o aplicativo <strong className="text-[#e3e7e1]">KH Admin</strong> com o monograma da KH Engenharia na sua Área de Trabalho, Menu Iniciar e Barra de Tarefas, usando o motor do próprio navegador e mantendo tudo atualizado automaticamente.
            </p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-center gap-2.5">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            Você já está usando o aplicativo KH Admin instalado em modo janela independente no Windows.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Instalar KH Admin no Windows agora
                </button>
              ) : (
                <a
                  href="/admin/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  Abrir endereço do App em nova aba para instalar
                </a>
              )}

              <button
                type="button"
                onClick={() => void handleCopyAdminUrl()}
                className="inline-flex items-center gap-2 px-4 py-3 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] transition-colors cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#86d69d]" aria-hidden="true" />
                    Link copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copiar link do App Admin
                  </>
                )}
              </button>
            </div>

            {isEmbeddedFrame && (
              <p className="text-xs text-[#e8c67a] bg-[#1d1910] border border-[#5e4d29] p-3 leading-relaxed">
                O botão de instalação direta do Windows só aparece quando o endereço é aberto em uma aba normal do Edge ou Chrome (fora de janelas embutidas). Clique em{' '}
                <strong>Abrir endereço do App em nova aba para instalar</strong> acima.
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-[#222823] bg-[#0e100f] space-y-1.5">
                <div className="text-xs font-medium text-[#f0f1ed]">No Microsoft Edge (Windows 10/11)</div>
                <p className="text-xs text-[#9aa49c] leading-relaxed">
                  Abra o link do App Admin → clique no ícone de aplicativo na barra de endereço (ou{' '}
                  <span className="text-[#d8ddd6]">⋯ → Aplicativos → Instalar este site como um aplicativo</span>) → marque{' '}
                  <span className="text-[#d8ddd6]">Fixar na Barra de Tarefas</span> e{' '}
                  <span className="text-[#d8ddd6]">Criar atalho na Área de Trabalho</span>.
                </p>
              </div>
              <div className="p-4 border border-[#222823] bg-[#0e100f] space-y-1.5">
                <div className="text-xs font-medium text-[#f0f1ed]">No Google Chrome</div>
                <p className="text-xs text-[#9aa49c] leading-relaxed">
                  Abra o link do App Admin → clique no ícone de instalar na direita da barra de endereço (ou{' '}
                  <span className="text-[#d8ddd6]">⋮ → Transmitir, salvar e compartilhar → Instalar página como aplicativo</span>).
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Method 2: Downloadable Windows Native App Window Launcher (.bat) */}
      <section className="border border-[#242a25] bg-[#121513] p-6 sm:p-8 space-y-5">
        <div className="space-y-1 pb-4 border-b border-[#202621]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#b3c4ad]">
            <Laptop className="w-4 h-4" aria-hidden="true" />
            OPÇÃO 2 · EXECUTÁVEL LEVE PARA WINDOWS (.BAT)
          </div>
          <h2 className="font-display text-lg font-medium text-[#f0f1ed]">
            Baixar lançador direto em modo aplicativo para Windows
          </h2>
          <p className="text-xs text-[#9aa49c] leading-relaxed max-w-2xl">
            Prefere apenas baixar um arquivo no seu computador? Baixe o lançador abaixo: ele usa o Microsoft Edge (já instalado no Windows) ou o Chrome em modo aplicativo puro (<code className="text-[#cbd2cb]">--app</code>), abrindo uma janela limpa direto na sua tela de login administrativa.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="win-app-url" className="block text-xs text-[#aeb6af]">
            Endereço do seu Painel Administrativo (pode manter o atual ou usar seu domínio próprio)
          </label>
          <input
            id="win-app-url"
            type="url"
            value={targetUrl}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              setUrlError(null);
            }}
            placeholder="https://seudominio.com.br/admin/index.html"
            className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#0b0c0c] border border-[#2c342d] text-[#f0f1ed] focus:border-[#8fa38c]"
          />
          {urlError && (
            <p className="text-xs text-[#f09d78]" role="alert">
              {urlError}
            </p>
          )}
        </div>

        {downloadedName && (
          <div className="p-3 border border-[#3a5741] bg-[#142117] text-xs text-[#a5e0b3] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Arquivo <strong>{downloadedName}</strong> baixado. Dê dois cliques nele no Windows para abrir ou criar o atalho na sua Área de Trabalho.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadShortcutInstaller}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Baixar criador de atalho na Área de Trabalho (.bat)
          </button>

          <button
            type="button"
            onClick={handleDownloadLauncher}
            className="inline-flex items-center gap-2 px-4 py-3 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Baixar lançador direto (KH-Engenharia-Admin.bat)
          </button>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowScriptPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-[#8f9991] hover:text-[#e3e7e1] cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            {showScriptPreview ? 'Ocultar código do arquivo .bat' : 'Ver código do arquivo .bat antes de baixar'}
          </button>

          {showScriptPreview && (
            <pre className="mt-3 p-4 bg-[#0b0c0c] border border-[#242a25] text-[11px] font-mono text-[#aeb6af] overflow-x-auto leading-relaxed">
              {buildWindowsLauncherBat(safePreviewUrl)}
            </pre>
          )}
        </div>

        <div className="pt-4 border-t border-[#202621] flex items-start gap-2.5 text-xs text-[#8f9991]">
          <ShieldCheck className="w-4 h-4 text-[#95a791] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Sua sessão fica salva com segurança pelo Firebase Authentication no próprio Windows. Ao abrir o aplicativo no dia a dia, você entra direto no Painel Admin — e se precisar autenticar novamente, seu e-mail já vem preenchido com o cursor pronto no campo de senha.
          </span>
        </div>
      </section>
    </div>
  );
}
