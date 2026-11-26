import React, { useMemo, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import type { ServiceContract } from '../types/contracts';
import { buildContractDocument } from '../lib/contractBuilder';
import { downloadContractDoc, downloadContractDocx } from '../lib/contractDocxExport';

interface ContractPreviewModalProps {
  contract: ServiceContract;
  isAdmin: boolean;
  onClose: () => void;
}

export function ContractPreviewModal({
  contract,
  isAdmin,
  onClose,
}: ContractPreviewModalProps) {
  const assembled = useMemo(() => buildContractDocument(contract), [contract]);
  const [downloading, setDownloading] = useState<'docx' | 'doc' | null>(null);

  const handleDocx = async () => {
    setDownloading('docx');
    try {
      await downloadContractDocx(contract);
    } finally {
      setDownloading(null);
    }
  };

  const handleDoc = () => {
    setDownloading('doc');
    try {
      downloadContractDoc(contract);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#121613] border border-[#303a32] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Top Action Bar */}
        <div className="px-6 py-4 border-b border-[#262d28] flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-[1px] text-[#a8baa4]">
              Pré-visualização · {contract.contractCode}
            </div>
            <div className="text-sm font-semibold text-[#f0f1ed] truncate mt-0.5">
              {assembled.title}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isAdmin && (
              <>
                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={handleDocx}
                  className="inline-flex items-center gap-2 bg-[#d8ddd6] text-[#141815] px-4 py-2 text-xs font-bold hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  {downloading === 'docx' ? 'Gerando...' : 'Baixar Word (.docx)'}
                </button>
                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={handleDoc}
                  className="inline-flex items-center gap-2 border border-[#4a574c] text-[#e3e7e1] px-3.5 py-2 text-xs font-semibold hover:border-[#9baf91] transition-colors cursor-pointer disabled:opacity-60"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  {downloading === 'doc' ? 'Gerando...' : 'Baixar (.doc)'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#9aa49c] hover:text-white cursor-pointer"
              aria-label="Fechar pré-visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto bg-[#0b0d0c] p-4 sm:p-8">
          <article className="bg-[#f8f8f5] text-[#141815] max-w-[780px] mx-auto px-6 py-8 sm:px-12 sm:py-12 shadow-xl space-y-4 text-[13.5px] leading-[1.65]">
            <div className="text-center border-b border-[#d7dbd4] pb-4 mb-6">
              <div className="text-[10px] font-bold tracking-[2px] text-[#455646] uppercase">
                KH Engenharia · Eng. Civil Kaio Henrique da Silva
              </div>
              <h1 className="font-display font-extrabold text-base sm:text-lg text-[#111] mt-2">
                {assembled.title}
              </h1>
            </div>

            <p className="text-justify">
              <strong>REFERÊNCIA: </strong>
              {assembled.reference}
            </p>
            <p className="text-justify">
              <strong>CONTRATANTE: </strong>
              {assembled.contratante}
            </p>
            <p className="text-justify">
              <strong>CONTRATADO: </strong>
              {assembled.contratado}
            </p>
            <p className="text-justify">{assembled.preamble}</p>

            {assembled.blocks.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h2
                    key={idx}
                    className="font-display font-bold text-[15px] text-[#111] border-b border-[#d7dbd4] pb-1 pt-4"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === 'table') {
                return (
                  <div key={idx} className="overflow-x-auto py-1">
                    <table className="w-full border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-[#e8ece6]">
                          {block.headers.map((h, hi) => (
                            <th
                              key={hi}
                              className="border border-[#aeb5ac] px-2.5 py-2 text-left font-bold text-[#141815]"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="border border-[#c7cdc5] px-2.5 py-1.5 align-top"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              if (block.type === 'bullet') {
                return (
                  <p key={idx} className="pl-5 text-justify">
                    <span>&bull;&nbsp;</span>
                    {block.leadBold && <strong>{block.leadBold}</strong>}
                    {block.text}
                  </p>
                );
              }
              return (
                <p key={idx} className="text-justify">
                  {block.leadBold && <strong>{block.leadBold}</strong>}
                  {block.text}
                </p>
              );
            })}

            <div className="border-t border-[#c7cdc5] pt-5 mt-8 space-y-4">
              <p className="text-justify">{assembled.closing}</p>
              <p>{assembled.localAndDate}</p>

              <div className="pt-8 space-y-8 text-center text-xs">
                <div>
                  <div>____________________________________________________</div>
                  <div className="mt-1">
                    <strong>CONTRATANTE</strong> — {assembled.contratanteSignatureLabel}
                  </div>
                </div>
                <div>
                  <div>____________________________________________________</div>
                  <div className="mt-1">
                    <strong>CONTRATADO</strong> — {assembled.contratadoSignatureLabel}
                  </div>
                </div>
              </div>

              <div className="pt-6 text-xs space-y-1.5">
                <div className="font-bold">Testemunhas:</div>
                <div>{assembled.witness1}</div>
                <div>{assembled.witness2}</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
