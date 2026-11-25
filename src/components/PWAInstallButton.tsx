import React, { useState } from 'react';
import { Download, Monitor, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  onOpenWindowsGuide?: () => void;
}

export function PWAInstallButton({
  compact = false,
  onOpenWindowsGuide,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress button when already running as an installed standalone desktop/mobile app
  if (isInstalled) {
    return null;
  }

  // Native Chromium / Edge / Windows 1-click install prompt
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center gap-1.5 border border-[#5a6d58] bg-[#1a221c] text-[#dce4d8] hover:border-[#9eb399] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs font-medium' : 'px-4 py-2.5 text-xs font-semibold'
        }`}
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        Instalar App Windows
      </button>
    );
  }

  // iOS Safari guided modal
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#374038] text-xs font-medium text-[#d8ddd6] hover:border-[#788a76] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Instalar no iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm border border-[#2c342d] bg-[#121513] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-medium text-[#f0f1ed]">
                  Instalar no iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#8f9991] hover:text-white cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-[#aeb6af] space-y-2 list-decimal pl-4 leading-relaxed">
                <li>
                  Toque no botão <strong className="text-[#f0f1ed]">Compartilhar</strong> na barra do Safari.
                </li>
                <li>
                  Role até encontrar <strong className="text-[#f0f1ed]">Adicionar à Tela de Início</strong>.
                </li>
                <li>
                  Confirme em <strong className="text-[#f0f1ed]">Adicionar</strong> para abrir direto no painel.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-[#d8ddd6] text-[#141815] text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop browsers (e.g. iframe preview or before prompt fires)
  if (onOpenWindowsGuide) {
    return (
      <button
        type="button"
        onClick={onOpenWindowsGuide}
        className={`inline-flex items-center gap-1.5 border border-[#374038] text-[#d8ddd6] hover:border-[#788a76] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs font-medium' : 'px-4 py-2.5 text-xs font-semibold'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
        App Windows
      </button>
    );
  }

  return null;
}
