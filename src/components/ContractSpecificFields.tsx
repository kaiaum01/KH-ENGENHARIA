import React from 'react';
import type { ServiceType } from '../types/portal';
import type { ContractSpecificData } from '../types/contracts';

interface ContractSpecificFieldsProps {
  serviceType: ServiceType;
  value: ContractSpecificData;
  onChange: (next: ContractSpecificData) => void;
}

const inputCls =
  'w-full bg-[#0d100e] border border-[#2c342e] px-3 py-2 text-sm text-[#f0f1ed] placeholder:text-[#667068] focus:outline-none focus:border-[#9baf91] transition-colors';
const labelCls = 'block text-xs font-medium text-[#b9c2ba] mb-1.5';
const checkWrapCls =
  'flex items-start gap-2.5 p-3 border border-[#262d28] bg-[#0e110f] hover:border-[#3d4a3f] cursor-pointer text-xs text-[#dce2db]';

export function ContractSpecificFields({
  serviceType,
  value,
  onChange,
}: ContractSpecificFieldsProps) {
  const set = <K extends keyof ContractSpecificData>(
    key: K,
    val: ContractSpecificData[K]
  ) => {
    onChange({ ...value, [key]: val });
  };

  if (serviceType === 'regularizacao') {
    return (
      <div className="space-y-5">
        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 1 e 2 — Regularização de Imóvel
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Área construída existente informada (m²)</label>
              <input
                type="text"
                value={value.builtAreaSqm}
                onChange={(e) => set('builtAreaSqm', e.target.value)}
                placeholder="Ex.: 185,40"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Área do terreno (m²)</label>
              <input
                type="text"
                value={value.lotAreaSqm}
                onChange={(e) => set('lotAreaSqm', e.target.value)}
                placeholder="Ex.: 360,00"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Situação informada pelo contratante</label>
              <input
                type="text"
                value={value.regSituation}
                onChange={(e) => set('regSituation', e.target.value)}
                placeholder="sem projeto aprovado / construído em área maior / sem habite-se / sem averbação"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Finalidade</label>
              <input
                type="text"
                value={value.finality}
                onChange={(e) => set('finality', e.target.value)}
                placeholder="venda / financiamento / escritura / averbação"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Documento final esperado (Etapa 5)</label>
              <input
                type="text"
                value={value.regFinalDocument}
                onChange={(e) => set('regFinalDocument', e.target.value)}
                placeholder="alvará de regularização / habite-se / certidão de conclusão"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Demais órgãos (opcional — referência)</label>
              <input
                type="text"
                value={value.regOtherOrgans}
                onChange={(e) => set('regOtherOrgans', e.target.value)}
                placeholder="Ex.: Receita Federal e 1º Cartório de Registro de Imóveis"
                className={inputCls}
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <div className="text-xs font-medium text-[#b9c2ba]">
              Cláusula 2.2 — Opcionais incluídos (o que não estiver marcado ficará excluído)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <label className={checkWrapCls}>
                <input
                  type="checkbox"
                  checked={value.regIncludeCnoReceita}
                  onChange={(e) => set('regIncludeCnoReceita', e.target.checked)}
                  className="mt-0.5 accent-[#9baf91]"
                />
                <span>Regularização da obra na Receita Federal (CNO e CND)</span>
              </label>
              <label className={checkWrapCls}>
                <input
                  type="checkbox"
                  checked={value.regIncludeCartorio}
                  onChange={(e) => set('regIncludeCartorio', e.target.checked)}
                  className="mt-0.5 accent-[#9baf91]"
                />
                <span>Acompanhamento da averbação em cartório</span>
              </label>
            </div>
            <div>
              <label className={labelCls}>Outros serviços opcionais incluídos (opcional)</label>
              <input
                type="text"
                value={value.regIncludeOthersText}
                onChange={(e) => set('regIncludeOthersText', e.target.value)}
                placeholder="Deixe vazio se não houver"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 3 e 5.6 — Prazos, Revisões e Acompanhamento (dias corridos)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Etapa 1 (dias)</label>
              <input type="text" value={value.regStage1Days} onChange={(e) => set('regStage1Days', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Etapa 2 (dias)</label>
              <input type="text" value={value.regStage2Days} onChange={(e) => set('regStage2Days', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Etapa 3 (dias)</label>
              <input type="text" value={value.regStage3Days} onChange={(e) => set('regStage3Days', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Protocolo Etapa 4 (dias)</label>
              <input type="text" value={value.regStage4Days} onChange={(e) => set('regStage4Days', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rodadas comunicados</label>
              <input type="text" value={value.regProtocolRounds} onChange={(e) => set('regProtocolRounds', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Atend. comunicado (dias)</label>
              <input type="text" value={value.regNoticeReplyDays} onChange={(e) => set('regNoticeReplyDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Aprovação cliente (dias)</label>
              <input type="text" value={value.regReviewDays} onChange={(e) => set('regReviewDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Correção erro (dias)</label>
              <input type="text" value={value.regCorrectionDays} onChange={(e) => set('regCorrectionDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rodadas revisão/etapa</label>
              <input type="text" value={value.regPlannedReviewRounds} onChange={(e) => set('regPlannedReviewRounds', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prazo revisão (dias)</label>
              <input type="text" value={value.regPlannedReviewDays} onChange={(e) => set('regPlannedReviewDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Canal de andamento</label>
              <input type="text" value={value.regUpdateChannel} onChange={(e) => set('regUpdateChannel', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Informe a cada (dias)</label>
              <input type="text" value={value.regUpdateIntervalDays} onChange={(e) => set('regUpdateIntervalDays', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (serviceType === 'arquitetonico') {
    return (
      <div className="space-y-5">
        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 1 e 2 — Projeto Arquitetônico
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo de intervenção</label>
              <select
                value={value.workType}
                onChange={(e) => set('workType', e.target.value)}
                className={inputCls}
              >
                <option value="obra nova">Obra nova</option>
                <option value="ampliação">Ampliação</option>
                <option value="reforma">Reforma</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Uso da edificação</label>
              <select
                value={value.buildingUsage}
                onChange={(e) => set('buildingUsage', e.target.value)}
                className={inputCls}
              >
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
                <option value="misto (residencial e comercial)">Misto</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Área estimada (m²)</label>
              <input type="text" value={value.builtAreaSqm} onChange={(e) => set('builtAreaSqm', e.target.value)} placeholder="Ex.: 220,00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Área do terreno (m²)</label>
              <input type="text" value={value.lotAreaSqm} onChange={(e) => set('lotAreaSqm', e.target.value)} placeholder="Ex.: 400,00" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Projetos complementares (Cláusula 1.3)</label>
              <input type="text" value={value.arqComplementaryStatus} onChange={(e) => set('arqComplementaryStatus', e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Compatibilização entre projetos (Cláusula 1.3)</label>
              <input type="text" value={value.arqCompatibilityClause} onChange={(e) => set('arqCompatibilityClause', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Centralização de informações</label>
              <input type="text" value={value.arqInfoHub} onChange={(e) => set('arqInfoHub', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Atendimento a órgãos públicos (1.4)</label>
              <input type="text" value={value.arqPublicRequestsBy} onChange={(e) => set('arqPublicRequestsBy', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Software / Versão dos arquivos (2.5)</label>
              <input type="text" value={value.arqSoftwareVersion} onChange={(e) => set('arqSoftwareVersion', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Meio de entrega digital</label>
              <input type="text" value={value.arqDeliveryChannel} onChange={(e) => set('arqDeliveryChannel', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <label className={checkWrapCls}>
              <input
                type="checkbox"
                checked={value.arqIncludeApproval}
                onChange={(e) => set('arqIncludeApproval', e.target.checked)}
                className="mt-0.5 accent-[#9baf91]"
              />
              <span>Incluir aprovação na prefeitura (Projeto Legal — Etapa 4)</span>
            </label>

            <div className="text-xs font-medium text-[#b9c2ba] pt-1">
              Cláusula 2.2 — Opcionais incluídos
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className={checkWrapCls}>
                <input type="checkbox" checked={value.arqInclude3D} onChange={(e) => set('arqInclude3D', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
                <span>Imagens em 3D e renderização</span>
              </label>
              <label className={checkWrapCls}>
                <input type="checkbox" checked={value.arqIncludeLandscaping} onChange={(e) => set('arqIncludeLandscaping', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
                <span>Projeto de paisagismo</span>
              </label>
              <label className={checkWrapCls}>
                <input type="checkbox" checked={value.arqIncludeInteriors} onChange={(e) => set('arqIncludeInteriors', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
                <span>Projeto de interiores e mobiliário</span>
              </label>
              <label className={checkWrapCls}>
                <input type="checkbox" checked={value.arqIncludeModel} onChange={(e) => set('arqIncludeModel', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
                <span>Maquete eletrônica</span>
              </label>
            </div>
            <div>
              <label className={labelCls}>Outros opcionais incluídos (opcional)</label>
              <input type="text" value={value.arqIncludeOthersText} onChange={(e) => set('arqIncludeOthersText', e.target.value)} placeholder="Deixe vazio se não houver" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 3 — Prazos e Revisões (dias corridos)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Estudo preliminar</label>
              <input type="text" value={value.arqEstudoDays} onChange={(e) => set('arqEstudoDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Anteprojeto</label>
              <input type="text" value={value.arqAnteprojetoDays} onChange={(e) => set('arqAnteprojetoDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Projeto legal</label>
              <input type="text" value={value.arqLegalDays} onChange={(e) => set('arqLegalDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Projeto executivo</label>
              <input type="text" value={value.arqExecutivoDays} onChange={(e) => set('arqExecutivoDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Aprovação cliente</label>
              <input type="text" value={value.regReviewDays} onChange={(e) => set('regReviewDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Correção erro</label>
              <input type="text" value={value.regCorrectionDays} onChange={(e) => set('regCorrectionDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rodadas revisão</label>
              <input type="text" value={value.regPlannedReviewRounds} onChange={(e) => set('regPlannedReviewRounds', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prazo revisão</label>
              <input type="text" value={value.regPlannedReviewDays} onChange={(e) => set('regPlannedReviewDays', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (serviceType === 'laudo_vistoria') {
    return (
      <div className="space-y-5">
        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 1 e 2 — Vistoria e Laudo Técnico
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo de laudo</label>
              <input
                type="text"
                value={value.laudoType}
                onChange={(e) => set('laudoType', e.target.value)}
                placeholder="inspeção predial / patologias / vistoria cautelar / avaliação de imóvel"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Área aproximada (m²)</label>
              <input type="text" value={value.builtAreaSqm} onChange={(e) => set('builtAreaSqm', e.target.value)} placeholder="Ex.: 150,00" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Tipo e uso do imóvel</label>
              <input type="text" value={value.laudoPropertyTypeUsage} onChange={(e) => set('laudoPropertyTypeUsage', e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Questão a responder (objetivo do laudo)</label>
              <input type="text" value={value.laudoObjective} onChange={(e) => set('laudoObjective', e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Finalidade e destinatário</label>
              <input type="text" value={value.laudoRecipient} onChange={(e) => set('laudoRecipient', e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Método de vistoria e instrumentos (Cláusula 2.3)</label>
              <input type="text" value={value.laudoMethodTools} onChange={(e) => set('laudoMethodTools', e.target.value)} className={inputCls} />
            </div>
          </div>
          <label className={checkWrapCls}>
            <input
              type="checkbox"
              checked={value.laudoAccessServicesIncluded}
              onChange={(e) => set('laudoAccessServicesIncluded', e.target.checked)}
              className="mt-0.5 accent-[#9baf91]"
            />
            <span>Serviços de acesso a pontos elevados (andaimes, drone, rapel) estão incluídos no preço</span>
          </label>
        </div>

        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 3 e 5.6 — Prazos, Reagendamento e Guarda de Arquivos
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Vistoria em até (dias corridos)</label>
              <input type="text" value={value.laudoInspectionDays} onChange={(e) => set('laudoInspectionDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Entrega do laudo (dias úteis)</label>
              <input type="text" value={value.laudoDeliveryBusinessDays} onChange={(e) => set('laudoDeliveryBusinessDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pedido esclarec. (dias corridos)</label>
              <input type="text" value={value.laudoClarificationRequestDays} onChange={(e) => set('laudoClarificationRequestDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Resposta esclarec. (dias úteis)</label>
              <input type="text" value={value.laudoClarificationReplyDays} onChange={(e) => set('laudoClarificationReplyDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nova visita por impedimento (R$)</label>
              <input type="text" value={value.laudoRescheduleFee} onChange={(e) => set('laudoRescheduleFee', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Guarda de fotos/notas (Cláus. 5.6)</label>
              <input type="text" value={value.laudoArchiveYears} onChange={(e) => set('laudoArchiveYears', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (serviceType === 'complementares') {
    const disciplines: Array<{
      key: keyof ContractSpecificData;
      label: string;
      products: string;
    }> = [
      { key: 'compStructural', label: 'Estrutural', products: 'Memorial de cálculo, formas, armações, detalhes e especificações' },
      { key: 'compFoundations', label: 'Fundações', products: 'Memorial, locação e detalhamento das fundações' },
      { key: 'compPlumbing', label: 'Hidrossanitário', products: 'Plantas, isométricos, detalhes e memorial' },
      { key: 'compElectrical', label: 'Elétrico e telecomunicações', products: 'Plantas, quadros, diagramas, detalhes e memorial' },
      { key: 'compSpda', label: 'SPDA', products: 'Plantas, detalhes e memorial' },
      { key: 'compFire', label: 'Prevenção e combate a incêndio', products: 'Projeto, memorial e formulários do órgão' },
      { key: 'compGas', label: 'Gás', products: 'Plantas, isométrico e memorial' },
      { key: 'compHvac', label: 'Climatização', products: 'Plantas, detalhes e memorial' },
    ];

    return (
      <div className="space-y-5">
        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 1.1 — Disciplinas Incluídas (Tabela S/N)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {disciplines.map((d) => {
              const checked = Boolean(value[d.key]);
              return (
                <label key={d.key} className={checkWrapCls}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => set(d.key, e.target.checked as never)}
                    className="mt-0.5 accent-[#9baf91]"
                  />
                  <div>
                    <div className="font-semibold text-[#f0f1ed]">{d.label}</div>
                    <div className="text-[11px] text-[#8f9991] mt-0.5">{d.products}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className={labelCls}>Outra disciplina (opcional)</label>
              <input type="text" value={value.compOtherName} onChange={(e) => set('compOtherName', e.target.value)} placeholder="Ex.: Drenagem pluvial" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Produtos da outra disciplina</label>
              <input type="text" value={value.compOtherProducts} onChange={(e) => set('compOtherProducts', e.target.value)} placeholder="Plantas, detalhes e memorial" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#232924]">
            <div>
              <label className={labelCls}>Tipo de obra</label>
              <select value={value.workType} onChange={(e) => set('workType', e.target.value)} className={inputCls}>
                <option value="obra nova">Obra nova</option>
                <option value="ampliação">Ampliação</option>
                <option value="reforma">Reforma</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Uso da edificação</label>
              <select value={value.buildingUsage} onChange={(e) => set('buildingUsage', e.target.value)} className={inputCls}>
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
                <option value="misto">Misto</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Área estimada (m²)</label>
              <input type="text" value={value.builtAreaSqm} onChange={(e) => set('builtAreaSqm', e.target.value)} placeholder="Ex.: 240,00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Autor do projeto arquitetônico</label>
              <input type="text" value={value.compArchAuthor} onChange={(e) => set('compArchAuthor', e.target.value)} placeholder="Nome do autor" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Versão / revisão arquitetônico</label>
              <input type="text" value={value.compArchRevision} onChange={(e) => set('compArchRevision', e.target.value)} placeholder="Rev. 01" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Data do arquitetônico</label>
              <input type="text" value={value.compArchDate} onChange={(e) => set('compArchDate', e.target.value)} placeholder="DD/MM/AAAA" className={inputCls} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Compatibilização com arquitetônico e terceiros (1.3)</label>
              <input type="text" value={value.compCompatibilityThirdParty} onChange={(e) => set('compCompatibilityThirdParty', e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Protocolo em concessionárias/órgãos (2.5)</label>
              <input type="text" value={value.compUtilityApprovalText} onChange={(e) => set('compUtilityApprovalText', e.target.value)} placeholder="não estão incluídos / estão incluídos, até 2 rodadas" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
            Cláusula 3 — Prazos e Revisões (dias corridos)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Lançamento/estudo</label>
              <input type="text" value={value.compLaunchDays} onChange={(e) => set('compLaunchDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Projeto executivo</label>
              <input type="text" value={value.compExecDays} onChange={(e) => set('compExecDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rev. compatibilização</label>
              <input type="text" value={value.compCompatDays} onChange={(e) => set('compCompatDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Aprovação cliente</label>
              <input type="text" value={value.regReviewDays} onChange={(e) => set('regReviewDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Correção erro</label>
              <input type="text" value={value.regCorrectionDays} onChange={(e) => set('regCorrectionDays', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rodadas revisão</label>
              <input type="text" value={value.regPlannedReviewRounds} onChange={(e) => set('regPlannedReviewRounds', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prazo revisão</label>
              <input type="text" value={value.regPlannedReviewDays} onChange={(e) => set('regPlannedReviewDays', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 05 - Acompanhamento de Obra
  return (
    <div className="space-y-5">
      <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
        <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
          Cláusula 1 e 2 — Acompanhamento Técnico de Obra
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo de obra</label>
            <select value={value.workType} onChange={(e) => set('workType', e.target.value)} className={inputCls}>
              <option value="construção nova">Construção nova</option>
              <option value="ampliação">Ampliação</option>
              <option value="reforma">Reforma</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Área aproximada (m²)</label>
            <input type="text" value={value.builtAreaSqm} onChange={(e) => set('builtAreaSqm', e.target.value)} placeholder="Ex.: 280,00" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Descrição da obra</label>
            <input type="text" value={value.acompWorkDescription} onChange={(e) => set('acompWorkDescription', e.target.value)} placeholder="Ex.: residência unifamiliar de 2 pavimentos" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Executor da obra (Nome / Construtora)</label>
            <input type="text" value={value.acompExecutorName} onChange={(e) => set('acompExecutorName', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>CPF/CNPJ do executor</label>
            <input type="text" value={value.acompExecutorDoc} onChange={(e) => set('acompExecutorDoc', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Data do contrato de execução</label>
            <input type="text" value={value.acompExecutorContractDate} onChange={(e) => set('acompExecutorContractDate', e.target.value)} placeholder="DD/MM/AAAA" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prazo previsto da obra (meses)</label>
            <input type="text" value={value.acompEstimatedMonths} onChange={(e) => set('acompEstimatedMonths', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Responsável técnico pela execução</label>
            <input type="text" value={value.acompRtName} onChange={(e) => set('acompRtName', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>CREA/CAU do RT da execução</label>
            <input type="text" value={value.acompRtCrea} onChange={(e) => set('acompRtCrea', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="text-xs font-medium text-[#b9c2ba]">
            Cláusula 2.7 — Opcionais incluídos
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <label className={checkWrapCls}>
              <input type="checkbox" checked={value.acompIncludeManagement} onChange={(e) => set('acompIncludeManagement', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
              <span>Gerenciamento da obra (cronograma físico-financeiro, custos e compras)</span>
            </label>
            <label className={checkWrapCls}>
              <input type="checkbox" checked={value.acompIncludeMeasurements} onChange={(e) => set('acompIncludeMeasurements', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
              <span>Conferência de medições e faturas do executor</span>
            </label>
            <label className={checkWrapCls}>
              <input type="checkbox" checked={value.acompIncludeFinalDelivery} onChange={(e) => set('acompIncludeFinalDelivery', e.target.checked)} className="mt-0.5 accent-[#9baf91]" />
              <span>Acompanhamento de entrega e vistoria final</span>
            </label>
          </div>
          <div>
            <label className={labelCls}>Outros opcionais incluídos (opcional)</label>
            <input type="text" value={value.acompIncludeOthersText} onChange={(e) => set('acompIncludeOthersText', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="border border-[#262d28] bg-[#101411] p-5 space-y-4">
        <div className="text-xs font-mono uppercase tracking-[1px] text-[#c0d0b8]">
          Cláusula 2 e 3 — Frequência de Visitas, Relatórios e Vigência
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Frequência das visitas (2.1)</label>
            <input type="text" value={value.acompFrequency} onChange={(e) => set('acompFrequency', e.target.value)} placeholder="Ex.: 1 visita por semana" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duração mín. (horas)</label>
            <input type="text" value={value.acompMinHours} onChange={(e) => set('acompMinHours', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Antecedência (dias)</label>
            <input type="text" value={value.acompAdvanceNoticeDays} onChange={(e) => set('acompAdvanceNoticeDays', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Relatório visita (dias úteis)</label>
            <input type="text" value={value.acompVisitReportDays} onChange={(e) => set('acompVisitReportDays', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Relatório mensal (até dia)</label>
            <input type="text" value={value.acompMonthlyReportDay} onChange={(e) => set('acompMonthlyReportDay', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Início vigência (3.1)</label>
            <input type="text" value={value.acompStartDate} onChange={(e) => set('acompStartDate', e.target.value)} placeholder="DD/MM/AAAA" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Término vigência (3.1)</label>
            <input type="text" value={value.acompEndClause} onChange={(e) => set('acompEndClause', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Visita extra (dias úteis)</label>
            <input type="text" value={value.acompExtraVisitDays} onChange={(e) => set('acompExtraVisitDays', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Paralisação susp. (dias)</label>
            <input type="text" value={value.acompSuspensionDays} onChange={(e) => set('acompSuspensionDays', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Decisão cliente (6.8 dias)</label>
            <input type="text" value={value.acompClientDecisionDays} onChange={(e) => set('acompClientDecisionDays', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Guarda registros (5.6)</label>
            <input type="text" value={value.acompArchiveYears} onChange={(e) => set('acompArchiveYears', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>
    </div>
  );
}
