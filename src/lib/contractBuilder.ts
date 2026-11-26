import {
  CONTRACT_MODEL_TITLES,
  type ContractClientData,
  type ContractContractorData,
  type ServiceContract,
} from '../types/contracts';

export interface ContractBlockHeading {
  type: 'heading';
  text: string;
}

export interface ContractBlockParagraph {
  type: 'paragraph';
  leadBold?: string;
  text: string;
}

export interface ContractBlockBullet {
  type: 'bullet';
  leadBold?: string;
  text: string;
}

export interface ContractBlockTable {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export type ContractBlock =
  | ContractBlockHeading
  | ContractBlockParagraph
  | ContractBlockBullet
  | ContractBlockTable;

export interface AssembledContractDocument {
  title: string;
  reference: string;
  contratante: string;
  contratado: string;
  preamble: string;
  blocks: ContractBlock[];
  closing: string;
  localAndDate: string;
  contratanteSignatureLabel: string;
  contratadoSignatureLabel: string;
  witness1: string;
  witness2: string;
}

function v(val: string | undefined, fallback: string): string {
  const cleaned = (val ?? '').trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

export function parseBrlNumber(input: string): number {
  const cleaned = (input || '')
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .trim();
  if (!cleaned) return NaN;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/\.(?=\d{3}(\D|$))/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function formatBrlNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const UNITS = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
];
const TEENS = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const TENS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];
const HUNDREDS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function underThousandToWords(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]);
  if (rem >= 10 && rem <= 19) {
    parts.push(TEENS[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    if (t > 0) parts.push(TENS[t]);
    if (u > 0) parts.push(UNITS[u]);
  }
  return parts.join(' e ');
}

function integerToWordsPtBr(n: number): string {
  if (n === 0) return 'zero';
  if (n >= 1_000_000_000) return String(n);

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const segments: string[] = [];
  if (millions > 0) {
    segments.push(
      millions === 1 ? 'um milhão' : `${underThousandToWords(millions)} milhões`
    );
  }
  if (thousands > 0) {
    segments.push(
      thousands === 1 ? 'mil' : `${underThousandToWords(thousands)} mil`
    );
  }
  if (rest > 0) {
    segments.push(underThousandToWords(rest));
  }

  if (segments.length === 1) return segments[0];
  if (segments.length === 2) {
    const lastIsSimple = rest > 0 && (rest < 100 || rest % 100 === 0);
    return lastIsSimple || rest === 0
      ? `${segments[0]} e ${segments[1]}`
      : `${segments[0]}, ${segments[1]}`;
  }
  const lastIsSimple = rest < 100 || rest % 100 === 0;
  return lastIsSimple
    ? `${segments[0]}, ${segments[1]} e ${segments[2]}`
    : `${segments[0]}, ${segments[1]}, ${segments[2]}`;
}

export function brlToWordsPtBr(valueStr: string): string {
  const num = parseBrlNumber(valueStr);
  if (!Number.isFinite(num) || num < 0) return '';
  const rounded = Math.round(num * 100);
  const reais = Math.floor(rounded / 100);
  const centavos = rounded % 100;

  const parts: string[] = [];
  if (reais > 0) {
    const label =
      reais === 1
        ? 'real'
        : reais >= 1_000_000 && reais % 1_000_000 === 0
          ? 'de reais'
          : 'reais';
    parts.push(`${integerToWordsPtBr(reais)} ${label}`);
  }
  if (centavos > 0) {
    parts.push(
      `${integerToWordsPtBr(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`
    );
  }
  if (parts.length === 0) return 'zero reais';
  return parts.join(' e ');
}

export function formatAddress(
  street: string,
  neighborhood: string,
  city: string,
  state: string
): string {
  const s = v(street, 'XXXXXXXXXXXXXXXX');
  const b = v(neighborhood, 'XXXXXXXXXX');
  const c = v(city, 'Cidade');
  const u = v(state, 'UF');
  return `${s} – ${b} – ${c} – ${u}`;
}

export function formatContratanteQualification(c: ContractClientData): string {
  if (c.personType === 'PJ') {
    const natureText =
      c.legalNature === 'publico' ? 'direito público' : 'direito privado';
    const repAddr = formatAddress(
      c.repAddressStreet,
      c.repAddressNeighborhood,
      c.repAddressCity,
      c.repAddressState
    );
    return `${v(c.companyName, 'NOME DA EMPRESA').toUpperCase()}, pessoa jurídica de ${natureText}, inscrita no CNPJ nº ${v(c.cnpj, 'XX.XXX.XXX/XXXX-XX')}, com sede à ${v(c.companyAddress, '(endereço completo)')}, neste ato representada por seu sócio administrador, ${v(c.repFullName, 'NOME COMPLETO').toUpperCase()}, ${v(c.repNationality, 'nacionalidade')}, ${v(c.repMaritalStatus, 'estado civil')}, ${v(c.repProfession, 'profissão')}, portador do CPF ${v(c.repCpf, 'XXX.XXX.XXX-XX')} e Documento de Identidade ${v(c.repRg, 'X.XXX.XXX')}, endereço eletrônico ${v(c.repEmail, 'endereço eletrônico')}, residente e domiciliado à ${repAddr}.`;
  }

  const pfAddr = formatAddress(
    c.addressStreet,
    c.addressNeighborhood,
    c.addressCity,
    c.addressState
  );
  return `${v(c.fullName, 'NOME COMPLETO').toUpperCase()}, ${v(c.nationality, 'nacionalidade')}, ${v(c.maritalStatus, 'estado civil')}, ${v(c.profession, 'profissão')}, portador do CPF ${v(c.cpf, 'XXX.XXX.XXX-XX')} e Documento de Identidade ${v(c.rg, 'X.XXX.XXX')}, endereço eletrônico ${v(c.email, 'endereço eletrônico')}, residente e domiciliado à ${pfAddr}.`;
}

export function formatContratadoQualification(k: ContractContractorData): string {
  const addr = k.professionalAddress.trim()
    ? `${k.professionalAddress.trim()} – ${v(k.city, 'Cidade')} – ${v(k.state, 'UF')}`
    : `XXXXXXXXXXXXXXXX – XXXXXXXXXX – ${v(k.city, 'Cidade')} – ${v(k.state, 'UF')}`;
  return `${v(k.fullName, 'KAIO HENRIQUE DA SILVA').toUpperCase()}, ${v(k.nationality, 'nacionalidade')}, ${v(k.maritalStatus, 'estado civil')}, engenheiro civil, registrado no CREA-${v(k.creaUf, 'PR')} sob nº ${v(k.creaNumber, 'XXXXXXXX')}, portador do CPF ${v(k.cpf, 'XXX.XXX.XXX-XX')} e Documento de Identidade ${v(k.rg, 'X.XXX.XXX')}, endereço eletrônico ${v(k.email, 'endereço eletrônico')}, com endereço profissional à ${addr}.`;
}

function moneyWithWords(val: string, words: string, placeholder = 'XXXX,XX'): string {
  const displayVal = v(val, placeholder);
  const resolvedWords = words.trim() || brlToWordsPtBr(val) || 'VALOR POR EXTENSO';
  return `R$ ${displayVal} (${resolvedWords})`;
}

export function buildContractDocument(contract: ServiceContract): AssembledContractDocument {
  const { serviceType, clientData: c, contractorData: k, termsData: t, specificData: s } = contract;
  const title = CONTRACT_MODEL_TITLES[serviceType];
  const propertyFullAddress = formatAddress(
    c.propertyStreet,
    c.propertyNeighborhood,
    c.propertyCity,
    c.propertyState
  );
  const contratante = formatContratanteQualification(c);
  const contratado = formatContratadoQualification(k);
  const artClause = t.artFeeIncluded
    ? 'já incluída no preço'
    : 'não incluída no preço';
  const indexLabel = t.correctionIndex || 'IPCA';
  const reimbCityUf = `${v(t.reimbursementOriginCity, v(k.city, 'XXXXXX'))} (${v(t.reimbursementOriginState, v(k.state, 'UF'))})`;
  const forumCityUf = `${v(t.forumCity, v(k.city, 'XXXXXX'))}/${v(t.forumState, v(k.state, 'UF'))}`;
  const hourlyDisplay = moneyWithWords(t.hourlyRate, t.hourlyRateWords, 'XXX,XX');

  const contratanteSigName =
    c.personType === 'PJ'
      ? `${v(c.companyName, 'CONTRATANTE')} (Rep. ${v(c.repFullName, 'Sócio Administrador')})`
      : v(c.fullName, 'CONTRATANTE');

  const commonClosing =
    'E por estarem justos, contratados, cientes e de acordo com todas as cláusulas e condições do presente contrato, as partes assinam este instrumento em 2 (duas) vias de igual teor, para um só efeito.';

  const blocks: ContractBlock[] = [];
  let reference = '';
  let preamble = '';

  // ===========================================================================
  // MODEL 01: REGULARIZAÇÃO DE IMÓVEL
  // ===========================================================================
  if (serviceType === 'regularizacao') {
    const otherOrgansText = s.regOtherOrgans.trim()
      ? ` e ${s.regOtherOrgans.trim()}`
      : '';
    reference = `Regularização da edificação do imóvel localizado à ${propertyFullAddress}, junto à Prefeitura Municipal de ${v(c.propertyCity, 'XXXXXX')}${otherOrgansText}.`;
    preamble =
      'As partes acima qualificadas têm entre si justo e acordado o presente contrato de prestação de serviço de regularização de imóvel, que se regerá pelas seguintes cláusulas:';

    const optCno = s.regIncludeCnoReceita ? '(X)' : '( )';
    const optCart = s.regIncludeCartorio ? '(X)' : '( )';
    const optOther = s.regIncludeOthersText.trim() ? '(X)' : '( )';

    blocks.push(
      { type: 'heading', text: '1 – Do objeto' },
      {
        type: 'paragraph',
        leadBold: '1.1 – ',
        text: 'O CONTRATADO obriga-se a prestar os serviços técnicos de regularização da edificação descrita abaixo, nos modos e prazos desta contratação (cláusulas 2 e 3), mediante o pagamento conforme a cláusula 4:',
      },
      {
        type: 'bullet',
        leadBold: 'Imóvel: ',
        text: `endereço ${propertyFullAddress}; matrícula nº ${v(c.propertyRegistration, 'XXXXX')}; inscrição municipal nº ${v(c.propertyMunicipalCode, 'XXXXX')};`,
      },
      {
        type: 'bullet',
        leadBold: 'Situação informada pelo CONTRATANTE: ',
        text: `${v(s.regSituation, 'sem projeto aprovado / construído em área maior que a aprovada / sem habite-se / sem averbação na matrícula')};`,
      },
      {
        type: 'bullet',
        leadBold: 'Área construída existente informada: ',
        text: `${v(s.builtAreaSqm, 'XXX')} m²; área do terreno: ${v(s.lotAreaSqm, 'XXX')} m²;`,
      },
      {
        type: 'bullet',
        leadBold: 'Finalidade: ',
        text: `${v(s.finality, 'venda / financiamento / escritura / averbação / outros')}.`,
      },
      {
        type: 'paragraph',
        leadBold: '1.2 – ',
        text: 'Integram o objeto somente os serviços descritos na cláusula 2. O termo “regularização” designa o conjunto de atividades ali relacionadas e não constitui promessa de resultado;',
      },
      {
        type: 'paragraph',
        leadBold: '1.3 – ',
        text: 'A possibilidade de regularização depende da legislação urbanística e edilícia do município, da situação do terreno e da documentação do imóvel. O CONTRATADO apresentará, na etapa 1, análise técnica de viabilidade, informando por escrito se a regularização é viável, viável mediante adequações ou inviável;',
      },

      { type: 'heading', text: '2 – Descrição dos serviços' },
      {
        type: 'paragraph',
        leadBold: '2.1 – ',
        text: 'Os serviços serão prestados nas seguintes etapas:',
      },
      {
        type: 'table',
        headers: ['Etapa', 'Nome', 'Conteúdo', 'Produto'],
        rows: [
          ['1', 'Diagnóstico e vistoria', 'Análise da matrícula, certidões e projetos anteriores; consulta à legislação; vistoria ao imóvel', 'Relatório de viabilidade'],
          ['2', 'Levantamento cadastral', 'Medição em campo da edificação existente e do que se apresenta no terreno', 'Desenho cadastral (PDF e DWG)'],
          ['3', 'Projeto de regularização', 'Pranchas, quadro de áreas, memorial e ART', 'Projeto (PDF e DWG)'],
          ['4', 'Protocolo e acompanhamento', `Protocolo no órgão e atendimento a comunicados, até ${v(s.regProtocolRounds, 'XX')} rodadas`, 'Protocolo e registro de andamento'],
          ['5', 'Conclusão', `Obtenção do ${v(s.regFinalDocument, 'alvará de regularização / habite-se / certidão de conclusão')}, conforme o município`, 'Documento emitido pelo órgão'],
        ],
      },
      {
        type: 'paragraph',
        leadBold: '2.2 – ',
        text: `Serviços opcionais incluídos: ${optCno} Regularização da obra na Receita Federal (CNO e certidão negativa de débitos); ${optCart} acompanhamento da averbação em cartório; ${optOther} outros: ${v(s.regIncludeOthersText, 'nenhum')}. O que não estiver marcado está excluído;`,
      },
      {
        type: 'paragraph',
        leadBold: '2.3 – ',
        text: 'O levantamento cadastral registra o que existe na data da medição, dentro das tolerâncias usuais de medição. Não equivale a levantamento topográfico, certificação ou registro do imóvel; se o terreno exigir levantamento topográfico, será contratado à parte;',
      },
      {
        type: 'paragraph',
        leadBold: '2.4 – ',
        text: 'Se a análise de viabilidade exigir adequações físicas na edificação (demolição, recuos, correção de instalações, medidas de segurança), elas constarão do relatório de viabilidade, e sua execução, custo e responsabilidade técnica pela execução cabem ao CONTRATANTE, mediante contrato à parte;',
      },
      {
        type: 'paragraph',
        leadBold: '2.5 – ',
        text: 'Estão excluídos, salvo previsão expressa: projetos complementares, laudos estruturais, ensaios, sondagens, levantamento topográfico, projeto de prevenção contra incêndio, licenças ambientais, retificação de área ou de matrícula, usucapião, regularização fundiária e quaisquer medidas judiciais;',
      },
      {
        type: 'paragraph',
        leadBold: '2.6 – ',
        text: 'Nos termos do art. 610, § 2º, do Código Civil, a contratação da elaboração de projeto não implica a obrigação de executá-lo nem de fiscalizar sua execução. A execução da obra e o acompanhamento ou fiscalização da execução serão objeto de contrato à parte;',
      },
      {
        type: 'paragraph',
        leadBold: '2.7 – ',
        text: 'A emissão do documento final depende da análise e da decisão do órgão competente, não havendo garantia de aprovação.',
      },

      { type: 'heading', text: '3 – Dos prazos' },
      {
        type: 'paragraph',
        leadBold: '3.1 – ',
        text: `As etapas serão desenvolvidas nos seguintes prazos, contados em dias corridos: etapa 1, ${v(s.regStage1Days, 'XX')} dias após a assinatura e o recebimento dos documentos; etapa 2, ${v(s.regStage2Days, 'XX')} dias após o agendamento e o acesso integral ao imóvel; etapa 3, ${v(s.regStage3Days, 'XX')} dias após a aprovação da etapa 2 e a decisão do CONTRATANTE sobre o relatório de viabilidade; etapa 4, protocolo em ${v(s.regStage4Days, 'XX')} dias após a conclusão da etapa 3 e o pagamento das taxas pelo CONTRATANTE;`,
      },
      {
        type: 'paragraph',
        leadBold: '3.2 – ',
        text: `Os prazos de análise do órgão não são controlados pelo CONTRATADO e não integram os prazos acima. Comunicados relativos ao projeto serão atendidos em até ${v(s.regNoticeReplyDays, 'XX')} dias corridos de seu conhecimento, até o limite de ${v(s.regProtocolRounds, 'XX')} rodadas. Exigências decorrentes de alteração da legislação, de fato novo ou de documento a cargo do CONTRATANTE são serviço adicional;`,
      },
      {
        type: 'paragraph',
        leadBold: '3.3 – ',
        text: `O CONTRATANTE terá o prazo de ${v(s.regReviewDays, 'XX')} dias corridos, contados da apresentação de cada etapa, para aprovar ou apresentar ressalvas por escrito, por meio de interlocutor único. Decorrido o prazo sem manifestação, o CONTRATADO notificará o CONTRATANTE e, persistindo o silêncio por mais 5 dias úteis, a etapa será considerada aceita comercialmente, com as ressalvas documentadas;`,
      },
      {
        type: 'paragraph',
        leadBold: 'Revisões. ',
        text: 'Distinguem-se três situações, que não se confundem:',
      },
      {
        type: 'bullet',
        leadBold: 'Correção de problema da entrega: ',
        text: `ajuste de erro, omissão ou inconsistência de responsabilidade do CONTRATADO em relação ao que foi contratado e entregue. É feita sem custo adicional, em até ${v(s.regCorrectionDays, 'XX')} dias corridos;`,
      },
      {
        type: 'bullet',
        leadBold: 'Revisão prevista: ',
        text: `ajuste, dentro das premissas já aprovadas, limitado a ${v(s.regPlannedReviewRounds, 'XX')} rodadas por etapa, cada uma em até ${v(s.regPlannedReviewDays, 'XX')} dias corridos após o pedido. Excedido o limite, as rodadas adicionais serão cobradas por hora técnica (cláusula 4);`,
      },
      {
        type: 'bullet',
        leadBold: 'Alteração de premissa ou ampliação de escopo: ',
        text: 'mudança de programa, de área, de uso, de disciplinas ou de qualquer informação que fundamentou o trabalho já desenvolvido. O CONTRATADO registrará a nova premissa em versão identificável e avaliará o impacto em escopo, prazo e preço, que serão ajustados por aditivo antes do início do trabalho adicional.',
      },
      {
        type: 'paragraph',
        leadBold: '3.4 – ',
        text: 'Os prazos ficam suspensos, em relação à etapa afetada, enquanto perdurar pendência de informação, documento, acesso ou pagamento do CONTRATANTE, sem prejuízo da continuidade das etapas já liberadas. O atraso por informação pendente será distinguido do atraso em etapa já liberada no controle do cronograma;',
      },
      {
        type: 'paragraph',
        leadBold: '3.5 – ',
        text: 'O aceite é comercial: confirma a etapa e suas ressalvas, mas não substitui a responsabilidade técnica nem comprova aprovação de órgão público, concessionária ou instituição financeira;',
      },

      { type: 'heading', text: '4 – Dos honorários' },
      {
        type: 'paragraph',
        leadBold: '4.1 – ',
        text: `O CONTRATANTE pagará ao CONTRATADO o valor de ${moneyWithWords(t.totalValue, t.totalValueWords)} para a execução dos serviços deste contrato, da seguinte forma:`,
      },
      {
        type: 'bullet',
        leadBold: '1ª Parcela: ',
        text: `${moneyWithWords(t.installment1Value, t.installment1Words)}, equivalente a 30%, na assinatura do contrato;`,
      },
      {
        type: 'bullet',
        leadBold: '2ª Parcela: ',
        text: `${moneyWithWords(t.installment2Value, t.installment2Words)}, equivalente a 40%, na entrega do projeto de regularização (etapa 3);`,
      },
      {
        type: 'bullet',
        leadBold: '3ª Parcela: ',
        text: `${moneyWithWords(t.installment3Value, t.installment3Words)}, equivalente a 30%, no protocolo do processo (etapa 4).`,
      },
      {
        type: 'paragraph',
        leadBold: '4.2 – ',
        text: `Não se incluem no preço, e serão pagos diretamente pelo CONTRATANTE: taxas, multas, outorgas e tributos municipais; contribuições previdenciárias e demais valores apurados pela Receita Federal; emolumentos de cartório; custos de execução de adequações; projetos e estudos complementares; levantamento topográfico; certidões; e a taxa de emissão da ART (${artClause});`,
      },
      {
        type: 'paragraph',
        leadBold: '4.3 – ',
        text: `Os pagamentos efetuados após o vencimento sofrerão multa de 2% (dois por cento) sobre o valor da parcela, juros de 1% ao mês e correção monetária pelo ${indexLabel};`,
      },
      {
        type: 'paragraph',
        leadBold: '4.4 – ',
        text: 'Persistindo o inadimplemento de parcela por mais de 20 dias, o CONTRATADO poderá suspender os trabalhos e, após notificação, considerar rescindido o contrato (cláusula 7);',
      },
      {
        type: 'paragraph',
        leadBold: '4.5 – ',
        text: `Serviços extraordinários, alterações posteriores a etapa já aprovada, rodadas de revisão excedentes e visitas adicionais serão cobrados por hora técnica, no valor de ${hourlyDisplay}, mediante aprovação prévia do orçamento pelo CONTRATANTE;`,
      },
      {
        type: 'paragraph',
        leadBold: '4.6 – ',
        text: 'Os produtos finais e o documento de responsabilidade técnica serão liberados após a quitação das parcelas vencidas.',
      },

      { type: 'heading', text: '5 – Das declarações e obrigações do CONTRATADO' },
      { type: 'paragraph', leadBold: '5.1 – ', text: 'O CONTRATADO assume o compromisso de bem executar as atribuições descritas neste instrumento, adotando o cuidado e a diligência recomendados pela boa técnica profissional, com observância dos prazos da cláusula 3;' },
      { type: 'paragraph', leadBold: '5.2 – ', text: 'O CONTRATADO respeitará as normas técnicas e a legislação vigentes aplicáveis ao serviço, responsabilizando-se pelos serviços prestados;' },
      { type: 'paragraph', leadBold: '5.3 – ', text: 'O CONTRATADO é o responsável técnico pelas atividades descritas na cláusula 1 e providenciará o registro correspondente no conselho profissional competente (ART no CREA ou documento equivalente, conforme a atividade e o conselho), vinculado a este contrato, antes da entrega final. O documento deve corresponder exatamente à atividade contratada e será retificado se o escopo for alterado;' },
      { type: 'paragraph', leadBold: '5.4 – ', text: 'O CONTRATADO poderá se valer de outros profissionais de sua confiança, sob sua supervisão e orientação, para cooperar na prestação do serviço;' },
      { type: 'paragraph', leadBold: '5.5 – ', text: 'O CONTRATADO obriga-se a manter sigilo sobre os termos deste instrumento e sobre as informações, documentos e dados a que tiver acesso em razão dele, não podendo revelá-los, reproduzi-los ou dar conhecimento a terceiros, salvo por exigência legal ou de órgão competente;' },
      { type: 'paragraph', leadBold: '5.6 – ', text: `O CONTRATADO informará o CONTRATANTE sobre o andamento do processo por ${v(s.regUpdateChannel, 'e-mail / WhatsApp')} a cada ${v(s.regUpdateIntervalDays, 'XX')} dias e sempre que houver comunicado do órgão;` },

      { type: 'heading', text: '6 – Das declarações e obrigações do CONTRATANTE' },
      { type: 'paragraph', leadBold: '6.1 – ', text: 'O CONTRATANTE se obriga a pagar o valor fixado na cláusula 4, nos prazos e condições ali expressos;' },
      { type: 'paragraph', leadBold: '6.2 – ', text: 'O CONTRATANTE se obriga a colocar à disposição do CONTRATADO as informações e documentos necessários, nos prazos acordados, garantir o acesso ao imóvel sempre que necessário, indicar interlocutor único com poderes para aprovar e decidir e manter atualizados seus dados de endereço e contato;' },
      { type: 'paragraph', leadBold: '6.3 – ', text: 'O CONTRATANTE declara que os documentos e informações fornecidos são verdadeiros e que, após a extração de cópias, lhe foram devolvidos os originais;' },
      { type: 'paragraph', leadBold: '6.4 – ', text: 'Caso necessário, é dever do CONTRATANTE providenciar e arcar com os custos de profissionais, serviços, taxas, tributos e emolumentos não incluídos no preço;' },
      {
        type: 'paragraph',
        leadBold: '6.5 – ',
        text: t.allowImageRights
          ? 'O CONTRATANTE concede direito de imagem do trabalho e da execução para divulgação em redes sociais, site e portfólio, sem exposição de dados pessoais ou do endereço exato;'
          : 'Não há concessão de direito de imagem do trabalho para divulgação em redes sociais, site ou portfólio sem autorização prévia e expressa do CONTRATANTE;',
      },
      { type: 'paragraph', leadBold: '6.6 – ', text: `O CONTRATANTE reembolsará despesas de deslocamento, hospedagem (no limite de R$ 100,00 por diária) e alimentação (no limite de R$ 20,00 por refeição) contraídas pelo CONTRATADO em diligências fora do município de ${reimbCityUf}, relativas ao objeto deste contrato;` },
      { type: 'paragraph', leadBold: '6.7 – ', text: 'O CONTRATANTE declara ser proprietário ou possuidor legítimo do imóvel e autoriza o CONTRATADO a protocolar e acompanhar processos em seu nome, devendo fornecer procuração ou autorização quando exigida;' },
      { type: 'paragraph', leadBold: '6.8 – ', text: 'O CONTRATANTE declarará com veracidade as áreas, usos e construções do imóvel, inclusive as que não estejam visíveis, e não iniciará novas obras no imóvel durante o processo sem comunicar o CONTRATADO;' },

      { type: 'heading', text: '7 – Das penalidades e da rescisão contratual' },
      { type: 'paragraph', leadBold: '7.1 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATANTE, este não terá direito à devolução dos valores já pagos pelas etapas concluídas e pagará os serviços executados e em andamento, apurados proporcionalmente, além de multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.2 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATADO sem concluir o serviço, este restituirá os valores recebidos referentes às etapas não executadas, deduzidos os serviços já prestados, e pagará multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.3 – ', text: 'Qualquer das partes poderá rescindir o contrato mediante notificação por escrito com antecedência de 15 dias, aplicando-se as regras acima conforme o caso;' },
      { type: 'paragraph', leadBold: '7.4 – ', text: 'Em qualquer hipótese de rescisão, o CONTRATADO entregará os trabalhos concluídos até a data, com identificação de versão e situação de uso, observada a liberação mediante quitação (cláusula 4);' },
      { type: 'paragraph', leadBold: '7.5 – ', text: 'Os direitos de uso das etapas concluídas e pagas poderão ser transferidos a outro profissional que o CONTRATANTE vier a contratar, mediante assunção, por este, da responsabilidade técnica sobre a continuidade do trabalho;' },

      { type: 'heading', text: '8 – Das disposições finais e eleição do foro' },
      { type: 'paragraph', leadBold: '8.1 – ', text: 'Os desenhos, memoriais e demais documentos técnicos são obra intelectual do CONTRATADO (Lei nº 9.610/98, art. 7º, inc. X). Com o pagamento integral, o CONTRATANTE poderá utilizá-los exclusivamente para o imóvel e a finalidade descritos na cláusula 1, na versão entregue, sendo vedada a reutilização em outro local ou empreendimento sem autorização por escrito. Este contrato não importa cessão irrestrita de direitos;' },
      { type: 'paragraph', leadBold: '8.2 – ', text: `Os documentos técnicos serão disponibilizados ao CONTRATANTE em PDF ou outro formato inalterável, e em formato editável somente aos responsáveis pelos projetos complementares ou ao CONTRATANTE, ${v(t.editableFileCondition, 'mediante solicitação formal')}. Alterações posteriores por outro profissional serão feitas sob responsabilidade técnica própria desse profissional, e o CONTRATADO não responde por modificações que não tenha realizado ou autorizado;` },
      { type: 'paragraph', leadBold: '8.3 – ', text: 'A regularização perante o município não sana eventual irregularidade dominial ou fundiária, nem direitos de vizinhança, e não substitui a regularização em cartório, que segue regras próprias;' },
      { type: 'paragraph', leadBold: '8.4 – ', text: 'A execução de obras e adequações, bem como a fiscalização delas, será objeto de contrato à parte;' },
      { type: 'paragraph', leadBold: '8.5 – ', text: `Os atendimentos ao CONTRATANTE ocorrerão de segunda a sexta, entre ${v(t.officeHoursStart, 'XhXXmin')} e ${v(t.officeHoursEnd, 'XXh')}. Atendimento fora desse horário será cobrado como visita técnica, no valor de R$ ${v(t.outOfHoursFee, 'XXX,XX')} por ocorrência;` },
      { type: 'paragraph', leadBold: '8.6 – ', text: 'A prestação de serviços pelo CONTRATADO não implica vínculo trabalhista entre as partes, garantida a autonomia profissional;' },
      { type: 'paragraph', leadBold: '8.7 – ', text: 'Os dados pessoais serão tratados exclusivamente para a execução do contrato, conforme a Lei nº 13.709/2018 (LGPD);' },
      { type: 'paragraph', leadBold: '8.8 – ', text: 'Integram este contrato, como anexos: Anexo I – Proposta técnica e lista de entregáveis; Anexo II – Cronograma; Anexo III – Dados de entrada e documentos recebidos; Anexo IV – Registro de versões, relatórios e solicitações. Alterações deste contrato dependem de aditivo escrito, e as comunicações por e-mail para os endereços da qualificação são válidas;' },
      { type: 'paragraph', leadBold: '8.9 – ', text: `Fica eleito o foro da Comarca de ${forumCityUf} para dirimir quaisquer dúvidas ou conflitos oriundos do presente contrato.` }
    );
  }

  // ===========================================================================
  // MODEL 02: PROJETO ARQUITETÔNICO
  // ===========================================================================
  if (serviceType === 'arquitetonico') {
    reference = `Projeto arquitetônico ${v(s.buildingUsage, 'residencial / comercial')} do imóvel localizado à ${propertyFullAddress}.`;
    preamble =
      'As partes acima qualificadas têm entre si justo e acordado o presente contrato de prestação de serviço de elaboração de projeto arquitetônico, que se regerá pelas seguintes cláusulas:';

    const opt3d = s.arqInclude3D ? '(X)' : '( )';
    const optPaisag = s.arqIncludeLandscaping ? '(X)' : '( )';
    const optInter = s.arqIncludeInteriors ? '(X)' : '( )';
    const optMaq = s.arqIncludeModel ? '(X)' : '( )';
    const optOther = s.arqIncludeOthersText.trim() ? '(X)' : '( )';
    const approvalSuffix = s.arqIncludeApproval ? ' e aprovação na prefeitura' : '';

    blocks.push(
      { type: 'heading', text: '1 – Do objeto' },
      { type: 'paragraph', leadBold: '1.1 – ', text: 'O CONTRATADO obriga-se a elaborar o projeto arquitetônico do empreendimento descrito abaixo, nos modos e prazos estabelecidos neste instrumento (cláusulas 2 e 3), mediante o pagamento conforme a cláusula 4:' },
      { type: 'bullet', leadBold: 'Empreendimento: ', text: `${v(s.workType, 'obra nova / ampliação / reforma')} de edificação ${v(s.buildingUsage, 'residencial / comercial')} com área estimada de ${v(s.builtAreaSqm, 'XXX')} m²;` },
      { type: 'bullet', leadBold: 'Endereço: ', text: `${propertyFullAddress}; matrícula/inscrição: ${v(c.propertyRegistration || c.propertyMunicipalCode, 'XXXXX')}; área do terreno: ${v(s.lotAreaSqm, 'XXX')} m²;` },
      { type: 'bullet', leadBold: 'Programa de necessidades: ', text: 'conforme Anexo III, assinado pelas partes;' },
      { type: 'bullet', leadBold: 'Finalidade: ', text: `execução da obra${approvalSuffix};` },
      { type: 'paragraph', leadBold: '1.2 – ', text: 'Integram o objeto somente os produtos listados na cláusula 2. A expressão “projeto completo” não amplia o escopo para disciplinas, estudos, aprovações ou serviços que não estejam descritos;' },
      { type: 'paragraph', leadBold: '1.3 – ', text: `Interfaces. Os projetos complementares (estrutural, instalações e outros) ${v(s.arqComplementaryStatus, 'serão contratados posteriormente')}. A existência de vários projetos para o mesmo empreendimento não significa que foi contratada a compatibilização entre eles. A compatibilização ${v(s.arqCompatibilityClause, 'não está incluída')}. As trocas de informação entre os profissionais serão centralizadas em ${v(s.arqInfoHub, 'XXXXX')}, e as decisões sobre interferências serão registradas por escrito;` },
      { type: 'paragraph', leadBold: '1.4 – ', text: `As solicitações e exigências de órgãos públicos relativas ao projeto serão atendidas por ${v(s.arqPublicRequestsBy, 'o CONTRATADO, limitado ao seu projeto')};` },

      { type: 'heading', text: '2 – Descrição dos serviços' },
      { type: 'paragraph', leadBold: '2.1 – ', text: 'Os serviços serão divididos nas seguintes etapas:' },
      {
        type: 'table',
        headers: ['Etapa', 'Nome', 'Conteúdo', 'Produto'],
        rows: [
          ['1', 'Levantamento', 'Medição e cadastro da edificação ou do terreno existente, quando houver', 'Desenho cadastral'],
          ['2', 'Estudo preliminar', 'Implantação, volumetria, layout, ergonomia e acessibilidade, croquis e soluções alternativas', 'Estudo em PDF'],
          ['3', 'Anteprojeto', 'Plantas, cortes, elevações, quadro de áreas e memorial justificativo em versão preliminar, suficientes para estimativa aproximada de custos e prazos', 'Pranchas preliminares'],
          ['4', 'Projeto legal', s.arqIncludeApproval ? 'Projeto para aprovação no órgão competente (incluído)' : 'Projeto para aprovação no órgão competente (quando contratado)', 'Pranchas e formulários'],
          ['5', 'Projeto executivo', 'Plantas, cortes, elevações, detalhamentos construtivos, esquadrias, cobertura, memorial descritivo e especificações, em caráter definitivo', 'Caderno em PDF e DWG'],
        ],
      },
      { type: 'paragraph', leadBold: '2.2 – ', text: `Serviços opcionais incluídos: ${opt3d} imagens em 3D e renderização; ${optPaisag} projeto de paisagismo; ${optInter} projeto de interiores e mobiliário; ${optMaq} maquete eletrônica; ${optOther} outros: ${v(s.arqIncludeOthersText, 'nenhum')}. O que não estiver marcado está excluído;` },
      { type: 'paragraph', leadBold: '2.3 – ', text: 'Dados de entrada. O CONTRATANTE fornecerá, nos prazos do Anexo III: programa de necessidades, documentos do imóvel, projetos anteriores, levantamento topográfico, sondagem e demais estudos indicados pela equipe técnica, identificando cada item como documento recebido, informação declarada ou item a investigar. Desenhos antigos são informação de partida e não retrato confirmado da construção atual;' },
      { type: 'paragraph', leadBold: '2.4 – ', text: 'Em caso de dado ausente, inconsistente ou incompatível, o CONTRATADO avisará o CONTRATANTE por escrito, fará a avaliação técnica do impacto, as partes ajustarão o reflexo no cronograma e, se for o caso, no preço, e a decisão será registrada por escrito. O CONTRATADO não está obrigado a presumir condições desconhecidas para prosseguir;' },
      { type: 'paragraph', leadBold: '2.5 – ', text: `Os arquivos digitais serão entregues na versão ${v(s.arqSoftwareVersion, 'AutoCAD / Revit')}, por ${v(s.arqDeliveryChannel, 'e-mail / nuvem')}, sem garantia de uso em outros sistemas além dos formatos indicados;` },
      { type: 'paragraph', leadBold: '2.6 – ', text: 'Nos termos do art. 610, § 2º, do Código Civil, a contratação da elaboração de projeto não implica a obrigação de executá-lo nem de fiscalizar sua execução. A execução da obra e o acompanhamento ou fiscalização da execução serão objeto de contrato à parte;' },

      { type: 'heading', text: '3 – Dos prazos' },
      { type: 'paragraph', leadBold: '3.1 – ', text: `As etapas serão desenvolvidas nos seguintes prazos, em dias corridos: estudo preliminar, ${v(s.arqEstudoDays, 'XX')} dias após a assinatura e o recebimento dos dados de entrada; anteprojeto, ${v(s.arqAnteprojetoDays, 'XX')} dias após a aprovação do estudo preliminar; projeto legal, ${v(s.arqLegalDays, 'XX')} dias após a aprovação do anteprojeto; projeto executivo, ${v(s.arqExecutivoDays, 'XX')} dias após a aprovação do ${s.arqExecutivoAfterLegal ? 'projeto legal' : 'anteprojeto'};` },
      { type: 'paragraph', leadBold: '3.2 – ', text: `O CONTRATANTE terá ${v(s.regReviewDays, 'XX')} dias corridos, contados da apresentação de cada etapa, para aprovar ou apresentar ressalvas por escrito, por meio de interlocutor único. Os comentários serão consolidados, e pedidos contraditórios de pessoas diferentes serão devolvidos para consolidação. Decorrido o prazo sem manifestação, o CONTRATADO notificará o CONTRATANTE e, persistindo o silêncio por mais 5 dias úteis, a etapa será considerada aceita comercialmente, com as ressalvas documentadas;` },
      { type: 'paragraph', leadBold: '3.3 – ', text: 'O período em que o projeto estiver retido para análise do CONTRATANTE ou de órgão público não integra os prazos do CONTRATADO;' },
      { type: 'paragraph', leadBold: 'Revisões. ', text: 'Distinguem-se três situações, que não se confundem:' },
      { type: 'bullet', leadBold: 'Correção de problema da entrega: ', text: `ajuste de erro, omissão ou inconsistência de responsabilidade do CONTRATADO em relação ao que foi contratado e entregue. É feita sem custo adicional, em até ${v(s.regCorrectionDays, 'XX')} dias corridos;` },
      { type: 'bullet', leadBold: 'Revisão prevista: ', text: `ajuste, dentro das premissas já aprovadas, limitado a ${v(s.regPlannedReviewRounds, 'XX')} rodadas por etapa, cada uma em até ${v(s.regPlannedReviewDays, 'XX')} dias corridos após o pedido. Excedido o limite, as rodadas adicionais serão cobradas por hora técnica (cláusula 4);` },
      { type: 'bullet', leadBold: 'Alteração de premissa ou ampliação de escopo: ', text: 'mudança de programa, de área, de uso, de disciplinas ou de qualquer informação que fundamentou o trabalho já desenvolvido. O CONTRATADO registrará a nova premissa em versão identificável e avaliará o impacto em escopo, prazo e preço, que serão ajustados por aditivo antes do início do trabalho adicional. Exemplo: acrescentar um pavimento após o anteprojeto é alteração de premissa, enquanto corrigir uma cota errada em prancha entregue é correção;' },
      { type: 'paragraph', leadBold: '3.4 – ', text: 'Cada arquivo entregue terá identificação de revisão e data, e o CONTRATADO indicará qual é a versão válida. Arquivos preliminares não poderão ser usados para obra;' },
      { type: 'paragraph', leadBold: '3.5 – ', text: 'Os prazos ficam suspensos, em relação à etapa afetada, enquanto perdurar pendência de informação, documento, acesso ou pagamento do CONTRATANTE, sem prejuízo da continuidade das etapas já liberadas. O atraso por informação pendente será distinguido do atraso em etapa já liberada no controle do cronograma;' },
      { type: 'paragraph', leadBold: '3.6 – ', text: 'O aceite é comercial: confirma a etapa e suas ressalvas, mas não substitui a responsabilidade técnica nem comprova aprovação de órgão público, concessionária ou instituição financeira;' },

      { type: 'heading', text: '4 – Dos honorários' },
      { type: 'paragraph', leadBold: '4.1 – ', text: `O CONTRATANTE pagará ao CONTRATADO o valor de ${moneyWithWords(t.totalValue, t.totalValueWords)} para o desenvolvimento do projeto, da seguinte forma:` },
      { type: 'bullet', leadBold: '1ª Parcela: ', text: `${moneyWithWords(t.installment1Value, t.installment1Words)}, equivalente a 20%, na assinatura do contrato;` },
      { type: 'bullet', leadBold: '2ª Parcela: ', text: `${moneyWithWords(t.installment2Value, t.installment2Words)}, equivalente a 30%, na entrega do anteprojeto;` },
      { type: 'bullet', leadBold: '3ª Parcela: ', text: `${moneyWithWords(t.installment3Value, t.installment3Words)}, equivalente a 50%, na entrega do projeto executivo.` },
      { type: 'paragraph', leadBold: '4.2 – ', text: 'Não se incluem no preço, e serão pagos diretamente pelo CONTRATANTE, quando necessários: projetos complementares e estudos (estrutural, instalações, fundação, impacto de vizinhança, ambiental, bombeiros); sondagem e levantamento topográfico; execução e acompanhamento da obra; impostos, taxas, emolumentos e registros; segundas vias, plotagens e cópias; maquetes e plantas de comercialização; e alterações em etapas já aprovadas;' },
      { type: 'paragraph', leadBold: '4.3 – ', text: `Os pagamentos efetuados após o vencimento sofrerão multa de 2% (dois por cento) sobre o valor da parcela, juros de 1% ao mês e correção monetária pelo ${indexLabel};` },
      { type: 'paragraph', leadBold: '4.4 – ', text: 'Persistindo o inadimplemento de parcela por mais de 20 dias, o CONTRATADO poderá suspender os trabalhos e, após notificação, considerar rescindido o contrato (cláusula 7);' },
      { type: 'paragraph', leadBold: '4.5 – ', text: `Serviços extraordinários, alterações posteriores a etapa já aprovada, rodadas de revisão excedentes e visitas adicionais serão cobrados por hora técnica, no valor de ${hourlyDisplay}, mediante aprovação prévia do orçamento pelo CONTRATANTE;` },
      { type: 'paragraph', leadBold: '4.6 – ', text: 'Os produtos finais e o documento de responsabilidade técnica serão liberados após a quitação das parcelas vencidas.' },

      { type: 'heading', text: '5 – Das declarações e obrigações do CONTRATADO' },
      { type: 'paragraph', leadBold: '5.1 – ', text: 'O CONTRATADO assume o compromisso de bem executar as atribuições descritas neste instrumento, adotando o cuidado e a diligência recomendados pela boa técnica profissional, com observância dos prazos da cláusula 3;' },
      { type: 'paragraph', leadBold: '5.2 – ', text: 'O CONTRATADO respeitará as normas técnicas e a legislação vigentes aplicáveis ao serviço, responsabilizando-se pelos serviços prestados;' },
      { type: 'paragraph', leadBold: '5.3 – ', text: 'O CONTRATADO é o responsável técnico pelas atividades descritas na cláusula 1 e providenciará o registro correspondente no conselho profissional competente (ART no CREA ou documento equivalente, conforme a atividade e o conselho), vinculado a este contrato, antes da entrega final. O documento deve corresponder exatamente à atividade contratada e será retificado se o escopo for alterado;' },
      { type: 'paragraph', leadBold: '5.4 – ', text: 'O CONTRATADO poderá se valer de outros profissionais de sua confiança, sob sua supervisão e orientação, para cooperar na prestação do serviço;' },
      { type: 'paragraph', leadBold: '5.5 – ', text: 'O CONTRATADO obriga-se a manter sigilo sobre os termos deste instrumento e sobre as informações, documentos e dados a que tiver acesso em razão dele, não podendo revelá-los, reproduzi-los ou dar conhecimento a terceiros, salvo por exigência legal ou de órgão competente;' },
      { type: 'paragraph', leadBold: '5.6 – ', text: 'O CONTRATADO fornecerá, na entrega final, um original impresso e digital do projeto executivo, com índice dos arquivos finais (revisão, data e situação de uso) e registro das pendências, dos produtos não contratados e dos documentos que o CONTRATANTE precisará fornecer;' },

      { type: 'heading', text: '6 – Das declarações e obrigações do CONTRATANTE' },
      { type: 'paragraph', leadBold: '6.1 – ', text: 'O CONTRATANTE se obriga a pagar o valor fixado na cláusula 4, nos prazos e condições ali expressos;' },
      { type: 'paragraph', leadBold: '6.2 – ', text: 'O CONTRATANTE se obriga a colocar à disposição do CONTRATADO as informações e documentos necessários, nos prazos acordados, garantir o acesso ao imóvel sempre que necessário, indicar interlocutor único com poderes para aprovar e decidir e manter atualizados seus dados de endereço e contato;' },
      { type: 'paragraph', leadBold: '6.3 – ', text: 'O CONTRATANTE declara que os documentos e informações fornecidos são verdadeiros e que, após a extração de cópias, lhe foram devolvidos os originais;' },
      { type: 'paragraph', leadBold: '6.4 – ', text: 'Caso necessário, é dever do CONTRATANTE providenciar e arcar com os custos de profissionais, serviços, taxas, tributos e emolumentos não incluídos no preço;' },
      {
        type: 'paragraph',
        leadBold: '6.5 – ',
        text: t.allowImageRights
          ? 'O CONTRATANTE concede direito de imagem do trabalho e da execução para divulgação em redes sociais, site e portfólio, sem exposição de dados pessoais ou do endereço exato;'
          : 'Não há concessão de direito de imagem do trabalho para divulgação em redes sociais, site ou portfólio sem autorização prévia e expressa do CONTRATANTE;',
      },
      { type: 'paragraph', leadBold: '6.6 – ', text: `O CONTRATANTE reembolsará despesas de deslocamento, hospedagem (no limite de R$ 100,00 por diária) e alimentação (no limite de R$ 20,00 por refeição) contraídas pelo CONTRATADO em diligências fora do município de ${reimbCityUf}, relativas ao objeto deste contrato;` },
      { type: 'paragraph', leadBold: '6.7 – ', text: 'O CONTRATANTE não utilizará arquivos preliminares para obra e comunicará ao CONTRATADO qualquer fato relevante sobre o imóvel ou sobre os demais projetos;' },

      { type: 'heading', text: '7 – Das penalidades e da rescisão contratual' },
      { type: 'paragraph', leadBold: '7.1 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATANTE, este não terá direito à devolução dos valores já pagos pelas etapas concluídas e pagará os serviços executados e em andamento, apurados proporcionalmente, além de multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.2 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATADO sem concluir o serviço, este restituirá os valores recebidos referentes às etapas não executadas, deduzidos os serviços já prestados, e pagará multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.3 – ', text: 'Qualquer das partes poderá rescindir o contrato mediante notificação por escrito com antecedência de 15 dias, aplicando-se as regras acima conforme o caso;' },
      { type: 'paragraph', leadBold: '7.4 – ', text: 'Em qualquer hipótese de rescisão, o CONTRATADO entregará os trabalhos concluídos até a data, com identificação de versão e situação de uso, observada a liberação mediante quitação (cláusula 4);' },
      { type: 'paragraph', leadBold: '7.5 – ', text: 'Os direitos de uso das etapas concluídas e pagas poderão ser transferidos a outro profissional que o CONTRATANTE vier a contratar, mediante assunção, por este, da responsabilidade técnica sobre a continuidade do trabalho;' },

      { type: 'heading', text: '8 – Das disposições finais e eleição do foro' },
      { type: 'paragraph', leadBold: '8.1 – ', text: 'Os desenhos, memoriais e demais documentos técnicos são obra intelectual do CONTRATADO (Lei nº 9.610/98, art. 7º, inc. X). Com o pagamento integral, o CONTRATANTE poderá utilizá-los exclusivamente para o imóvel e a finalidade descritos na cláusula 1, na versão entregue, sendo vedada a reutilização em outro local ou empreendimento sem autorização por escrito. Este contrato não importa cessão irrestrita de direitos;' },
      { type: 'paragraph', leadBold: '8.2 – ', text: `Os documentos técnicos serão disponibilizados ao CONTRATANTE em PDF ou outro formato inalterável, e em formato editável somente aos responsáveis pelos projetos complementares ou ao CONTRATANTE, ${v(t.editableFileCondition, 'mediante solicitação formal')}. Alterações posteriores por outro profissional serão feitas sob responsabilidade técnica própria desse profissional, e o CONTRATADO não responde por modificações que não tenha realizado ou autorizado;` },
      { type: 'paragraph', leadBold: '8.3 – ', text: 'A responsabilidade do CONTRATADO limita-se à elaboração do projeto e não se estende ao acompanhamento da execução, à contratação de serviços e profissionais da obra, à compra de materiais ou aos encargos de executores e prestadores. Isso não afasta as responsabilidades próprias do serviço assumido neste contrato;' },
      { type: 'paragraph', leadBold: '8.4 – ', text: 'Não há identidade ou solidariedade entre a responsabilidade do CONTRATADO e a de outros profissionais contratados para projetos correlativos ou para a execução da obra, cada qual respondendo pelo seu trabalho;' },
      { type: 'paragraph', leadBold: '8.5 – ', text: 'O CONTRATADO não se responsabiliza por alterações durante a obra em desacordo com o projeto, nem por alterações solicitadas pelo CONTRATANTE em desacordo com a legislação vigente;' },
      { type: 'paragraph', leadBold: '8.6 – ', text: `Os atendimentos ao CONTRATANTE ocorrerão de segunda a sexta, entre ${v(t.officeHoursStart, 'XhXXmin')} e ${v(t.officeHoursEnd, 'XXh')}. Atendimento fora desse horário será cobrado como visita técnica, no valor de R$ ${v(t.outOfHoursFee, 'XXX,XX')} por ocorrência;` },
      { type: 'paragraph', leadBold: '8.7 – ', text: 'A prestação de serviços pelo CONTRATADO não implica vínculo trabalhista entre as partes, garantida a autonomia profissional;' },
      { type: 'paragraph', leadBold: '8.8 – ', text: 'Os dados pessoais serão tratados exclusivamente para a execução do contrato, conforme a Lei nº 13.709/2018 (LGPD);' },
      { type: 'paragraph', leadBold: '8.9 – ', text: 'Integram este contrato, como anexos: Anexo I – Proposta técnica e lista de entregáveis; Anexo II – Cronograma; Anexo III – Dados de entrada e documentos recebidos; Anexo IV – Registro de versões, relatórios e solicitações. Alterações deste contrato dependem de aditivo escrito, e as comunicações por e-mail para os endereços da qualificação são válidas;' },
      { type: 'paragraph', leadBold: '8.10 – ', text: `Fica eleito o foro da Comarca de ${forumCityUf} para dirimir quaisquer dúvidas ou conflitos oriundos do presente contrato.` }
    );
  }

  // ===========================================================================
  // MODEL 03: VISTORIA E LAUDO TÉCNICO
  // ===========================================================================
  if (serviceType === 'laudo_vistoria') {
    reference = `Vistoria e laudo técnico (${v(s.laudoType, 'inspeção predial')}) do imóvel localizado à ${propertyFullAddress}.`;
    preamble =
      'As partes acima qualificadas têm entre si justo e acordado o presente contrato de prestação de serviço de vistoria técnica e emissão de laudo técnico, que se regerá pelas seguintes cláusulas:';

    blocks.push(
      { type: 'heading', text: '1 – Do objeto' },
      { type: 'paragraph', leadBold: '1.1 – ', text: 'O CONTRATADO obriga-se a realizar a vistoria técnica do imóvel descrito abaixo e a emitir o respectivo laudo técnico, nos modos e prazos estabelecidos neste instrumento (cláusulas 2 e 3), mediante o pagamento conforme a cláusula 4:' },
      { type: 'bullet', leadBold: 'Imóvel: ', text: `endereço ${propertyFullAddress}; matrícula/inscrição ${v(c.propertyRegistration || c.propertyMunicipalCode, 'XXXXX')}; tipo e uso: ${v(s.laudoPropertyTypeUsage, 'XXXXX')}; área aproximada: ${v(s.builtAreaSqm, 'XXX')} m²;` },
      { type: 'bullet', leadBold: 'Tipo de laudo: ', text: `${v(s.laudoType, 'inspeção predial')};` },
      { type: 'bullet', leadBold: 'Questão a responder (objetivo do laudo): ', text: `${v(s.laudoObjective, 'XXXXX')};` },
      { type: 'bullet', leadBold: 'Finalidade e destinatário: ', text: `${v(s.laudoRecipient, 'XXXXX')}.` },
      { type: 'paragraph', leadBold: '1.2 – ', text: 'O laudo contratado é parecer técnico particular, elaborado a pedido do CONTRATANTE. Não se confunde com perícia judicial. Se o laudo se destinar a processo judicial ou administrativo, a atuação do CONTRATADO como assistente técnico em juízo, incluindo comparecimento, quesitos e esclarecimentos, depende de contratação específica;' },
      { type: 'paragraph', leadBold: '1.3 – ', text: 'O CONTRATADO atuará com independência técnica. As conclusões decorrem dos fatos constatados e da análise técnica, e o pagamento dos honorários não depende do teor ou do resultado do laudo. O CONTRATADO declara não ter interesse no imóvel nem relação com as partes envolvidas que comprometa sua imparcialidade e informará de imediato o CONTRATANTE caso surja impedimento;' },

      { type: 'heading', text: '2 – Descrição dos serviços' },
      { type: 'paragraph', leadBold: '2.1 – ', text: 'Os serviços compreendem as seguintes etapas e produtos:' },
      {
        type: 'table',
        headers: ['Etapa', 'Nome', 'Conteúdo', 'Produto'],
        rows: [
          ['1', 'Análise inicial', 'Exame dos documentos fornecidos, definição do método e agendamento', 'Plano de vistoria'],
          ['2', 'Vistoria', 'Inspeção em campo, medições e registro fotográfico', 'Anotações e fotos'],
          ['3', 'Análise e laudo', 'Análise dos fatos constatados, conclusão e recomendações', 'Laudo em PDF, com ART'],
          ['4', 'Esclarecimentos', 'Resposta a dúvidas sobre o conteúdo do laudo', 'Esclarecimento por escrito'],
        ],
      },
      { type: 'paragraph', leadBold: '2.2 – ', text: 'O laudo conterá: identificação do imóvel e do solicitante, objetivo, metodologia, documentos analisados, descrição do que foi constatado, relatório fotográfico, análise, conclusão e recomendações, áreas não vistoriadas e limitações, e documento de responsabilidade técnica;' },
      { type: 'paragraph', leadBold: '2.3 – ', text: `O método de vistoria é ${v(s.laudoMethodTools, 'visual e não destrutivo')}. Ensaios, sondagens, provas de carga, análises laboratoriais e demais investigações não estão incluídos, e serão realizados somente se contratados, com orçamento aprovado pelo CONTRATANTE;` },
      { type: 'paragraph', leadBold: '2.4 – ', text: 'Limites. O laudo retrata as condições do imóvel na data e no horário da vistoria, nas áreas acessíveis e visíveis. Elementos ocultos, embutidos, enterrados ou inacessíveis (forros, coberturas, áreas trancadas, instalações internas) e o que não for mostrado ao CONTRATADO não integram a análise, salvo se indicado. As áreas não vistoriadas serão listadas no laudo;' },
      { type: 'paragraph', leadBold: '2.5 – ', text: 'Estão excluídos, salvo previsão expressa: projeto de recuperação, orçamento de reparos, acompanhamento ou fiscalização dos reparos, laudos de outras especialidades (instalações elétricas, SPDA, elevadores, incêndio e outras), e avaliação de valor de mercado, exceto quando o tipo de laudo contratado for avaliação de imóvel;' },
      { type: 'paragraph', leadBold: '2.6 – ', text: 'Se, durante a vistoria, o CONTRATADO constatar risco iminente à segurança de pessoas, comunicará imediatamente o CONTRATANTE, registrará o fato e recomendará medidas imediatas (por exemplo, isolamento da área), sem que isso amplie o escopo contratado;' },
      { type: 'paragraph', leadBold: '2.7 – ', text: 'A elaboração de laudo não implica a obrigação de executar ou fiscalizar eventuais reparos, que serão objeto de contrato à parte;' },

      { type: 'heading', text: '3 – Dos prazos' },
      { type: 'paragraph', leadBold: '3.1 – ', text: `A vistoria será realizada em até ${v(s.laudoInspectionDays, 'XX')} dias corridos após a assinatura do contrato e o agendamento com acesso integral ao imóvel, em data e horário combinados por escrito;` },
      { type: 'paragraph', leadBold: '3.2 – ', text: `O laudo será entregue em até ${v(s.laudoDeliveryBusinessDays, 'XX')} dias úteis após a vistoria e o recebimento dos documentos e informações solicitados;` },
      { type: 'paragraph', leadBold: '3.3 – ', text: `O CONTRATANTE poderá pedir esclarecimentos sobre o conteúdo do laudo em até ${v(s.laudoClarificationRequestDays, 'XX')} dias corridos após a entrega, que serão respondidos em até ${v(s.laudoClarificationReplyDays, 'XX')} dias úteis, sem custo adicional;` },
      { type: 'paragraph', leadBold: '3.4 – ', text: 'Correções e novos serviços. A correção de erro material do laudo é feita sem custo. Constituem serviço adicional, cobrado por hora técnica ou por orçamento: nova vistoria, análise de documento ou informação nova apresentados após a entrega, ampliação do objeto e atualização do laudo;' },
      { type: 'paragraph', leadBold: '3.5 – ', text: `A vistoria será remarcada sem custo quando o CONTRATADO der causa. Se a vistoria não puder ser realizada por impedimento de acesso, ausência ou informação incorreta do CONTRATANTE, a nova visita será cobrada no valor de R$ ${v(s.laudoRescheduleFee, 'XXX,XX')};` },
      { type: 'paragraph', leadBold: '3.6 – ', text: 'O laudo vale para as condições do imóvel na data da vistoria. Mudanças posteriores (obras, sinistros, reparos, passagem do tempo) podem alterar suas conclusões, e o CONTRATADO não se responsabiliza pelo uso do laudo depois de tais mudanças sem atualização;' },
      { type: 'paragraph', leadBold: '3.7 – ', text: 'Os prazos ficam suspensos, em relação à etapa afetada, enquanto perdurar pendência de informação, documento, acesso ou pagamento do CONTRATANTE, sem prejuízo da continuidade das etapas já liberadas. O atraso por informação pendente será distinguido do atraso em etapa já liberada no controle do cronograma;' },

      { type: 'heading', text: '4 – Dos honorários' },
      { type: 'paragraph', leadBold: '4.1 – ', text: `O CONTRATANTE pagará ao CONTRATADO o valor de ${moneyWithWords(t.totalValue, t.totalValueWords)}, da seguinte forma:` },
      { type: 'bullet', leadBold: '1ª Parcela: ', text: `${moneyWithWords(t.installment1Value, t.installment1Words)}, equivalente a 50%, na assinatura do contrato;` },
      { type: 'bullet', leadBold: '2ª Parcela: ', text: `${moneyWithWords(t.installment2Value, t.installment2Words)}, equivalente a 50%, na entrega do laudo.` },
      { type: 'paragraph', leadBold: '4.2 – ', text: `Não se incluem no preço, e serão pagos diretamente pelo CONTRATANTE: ensaios, sondagens e análises laboratoriais; serviços de acesso a pontos elevados ou de difícil acesso (andaimes, drone, rapel) (${s.laudoAccessServicesIncluded ? 'incluídos no preço' : 'não incluídos no preço'}); laudos de outras especialidades; e a taxa de emissão da ART (${artClause});` },
      { type: 'paragraph', leadBold: '4.3 – ', text: `Os pagamentos efetuados após o vencimento sofrerão multa de 2% (dois por cento) sobre o valor da parcela, juros de 1% ao mês e correção monetária pelo ${indexLabel};` },
      { type: 'paragraph', leadBold: '4.4 – ', text: 'Persistindo o inadimplemento de parcela por mais de 20 dias, o CONTRATADO poderá suspender os trabalhos e, após notificação, considerar rescindido o contrato (cláusula 7);' },
      { type: 'paragraph', leadBold: '4.5 – ', text: `Serviços extraordinários, alterações posteriores a etapa já aprovada, rodadas de revisão excedentes e visitas adicionais serão cobrados por hora técnica, no valor de ${hourlyDisplay}, mediante aprovação prévia do orçamento pelo CONTRATANTE;` },
      { type: 'paragraph', leadBold: '4.6 – ', text: 'Os produtos finais e o documento de responsabilidade técnica serão liberados após a quitação das parcelas vencidas.' },

      { type: 'heading', text: '5 – Das declarações e obrigações do CONTRATADO' },
      { type: 'paragraph', leadBold: '5.1 – ', text: 'O CONTRATADO assume o compromisso de bem executar as atribuições descritas neste instrumento, adotando o cuidado e a diligência recomendados pela boa técnica profissional, com observância dos prazos da cláusula 3;' },
      { type: 'paragraph', leadBold: '5.2 – ', text: 'O CONTRATADO respeitará as normas técnicas e a legislação vigentes aplicáveis ao serviço, responsabilizando-se pelos serviços prestados;' },
      { type: 'paragraph', leadBold: '5.3 – ', text: 'O CONTRATADO é o responsável técnico pelas atividades descritas na cláusula 1 e providenciará o registro correspondente no conselho profissional competente (ART no CREA ou documento equivalente, conforme a atividade e o conselho), vinculado a este contrato, antes da entrega final. O documento deve corresponder exatamente à atividade contratada e será retificado se o escopo for alterado;' },
      { type: 'paragraph', leadBold: '5.4 – ', text: 'O CONTRATADO poderá se valer de outros profissionais de sua confiança, sob sua supervisão e orientação, para cooperar na prestação do serviço;' },
      { type: 'paragraph', leadBold: '5.5 – ', text: 'O CONTRATADO obriga-se a manter sigilo sobre os termos deste instrumento e sobre as informações, documentos e dados a que tiver acesso em razão dele, não podendo revelá-los, reproduzi-los ou dar conhecimento a terceiros, salvo por exigência legal ou de órgão competente;' },
      { type: 'paragraph', leadBold: '5.6 – ', text: `O CONTRATADO guardará o relatório fotográfico e as anotações de campo da vistoria por ${v(s.laudoArchiveYears, '5 anos')};` },

      { type: 'heading', text: '6 – Das declarações e obrigações do CONTRATANTE' },
      { type: 'paragraph', leadBold: '6.1 – ', text: 'O CONTRATANTE se obriga a pagar o valor fixado na cláusula 4, nos prazos e condições ali expressos;' },
      { type: 'paragraph', leadBold: '6.2 – ', text: 'O CONTRATANTE se obriga a colocar à disposição do CONTRATADO as informações e documentos necessários, nos prazos acordados, garantir o acesso ao imóvel sempre que necessário, indicar interlocutor único com poderes para aprovar e decidir e manter atualizados seus dados de endereço e contato;' },
      { type: 'paragraph', leadBold: '6.3 – ', text: 'O CONTRATANTE declara que os documentos e informações fornecidos são verdadeiros e que, após a extração de cópias, lhe foram devolvidos os originais;' },
      { type: 'paragraph', leadBold: '6.4 – ', text: 'Caso necessário, é dever do CONTRATANTE providenciar e arcar com os custos de profissionais, serviços, taxas, tributos e emolumentos não incluídos no preço;' },
      {
        type: 'paragraph',
        leadBold: '6.5 – ',
        text: t.allowImageRights
          ? 'O CONTRATANTE concede direito de imagem do trabalho e da execução para divulgação em redes sociais, site e portfólio, sem exposição de dados pessoais ou do endereço exato;'
          : 'Não há concessão de direito de imagem do trabalho para divulgação em redes sociais, site ou portfólio sem autorização prévia e expressa do CONTRATANTE;',
      },
      { type: 'paragraph', leadBold: '6.6 – ', text: `O CONTRATANTE reembolsará despesas de deslocamento, hospedagem (no limite de R$ 100,00 por diária) e alimentação (no limite de R$ 20,00 por refeição) contraídas pelo CONTRATADO em diligências fora do município de ${reimbCityUf}, relativas ao objeto deste contrato;` },
      { type: 'paragraph', leadBold: '6.7 – ', text: 'O CONTRATANTE acompanhará a vistoria, ou indicará quem a acompanhe, e dará acesso a todas as áreas necessárias, informando os fatos relevantes de que tenha conhecimento (histórico de reparos, obras, sinistros, reclamações, intervenções de vizinhos);' },
      { type: 'paragraph', leadBold: '6.8 – ', text: 'Quando o objeto da vistoria envolver terceiros (vizinhos, condomínio, locatários), cabe ao CONTRATANTE notificá-los e obter autorização de acesso;' },
      { type: 'paragraph', leadBold: '6.9 – ', text: 'O CONTRATANTE não condicionará nem induzirá a conclusão do laudo;' },

      { type: 'heading', text: '7 – Das penalidades e da rescisão contratual' },
      { type: 'paragraph', leadBold: '7.1 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATANTE, este não terá direito à devolução dos valores já pagos pelas etapas concluídas e pagará os serviços executados e em andamento, apurados proporcionalmente, além de multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.2 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATADO sem concluir o serviço, este restituirá os valores recebidos referentes às etapas não executadas, deduzidos os serviços já prestados, e pagará multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.3 – ', text: 'Qualquer das partes poderá rescindir o contrato mediante notificação por escrito com antecedência de 15 dias, aplicando-se as regras acima conforme o caso;' },
      { type: 'paragraph', leadBold: '7.4 – ', text: 'Em qualquer hipótese de rescisão, o CONTRATADO entregará os trabalhos concluídos até a data, com identificação de versão e situação de uso, observada a liberação mediante quitação (cláusula 4);' },

      { type: 'heading', text: '8 – Das disposições finais e eleição do foro' },
      { type: 'paragraph', leadBold: '8.1 – ', text: 'O laudo é de autoria do CONTRATADO e se destina ao CONTRATANTE, para a finalidade descrita na cláusula 1. O uso para outra finalidade, a apresentação a terceiros fora dessa finalidade e a reprodução parcial dependem de autorização por escrito, e é vedada a alteração de seu conteúdo. Transcrições parciais devem ser acompanhadas da conclusão e das limitações;' },
      { type: 'paragraph', leadBold: '8.2 – ', text: 'A responsabilidade do CONTRATADO restringe-se ao que foi constatado e analisado na vistoria, nos limites da cláusula 2. Não se estende a vícios ocultos ou inacessíveis, nem a reparos executados por terceiros;' },
      { type: 'paragraph', leadBold: '8.3 – ', text: `Os atendimentos ao CONTRATANTE ocorrerão de segunda a sexta, entre ${v(t.officeHoursStart, 'XhXXmin')} e ${v(t.officeHoursEnd, 'XXh')}. Atendimento fora desse horário será cobrado como visita técnica, no valor de R$ ${v(t.outOfHoursFee, 'XXX,XX')} por ocorrência;` },
      { type: 'paragraph', leadBold: '8.4 – ', text: 'A prestação de serviços pelo CONTRATADO não implica vínculo trabalhista entre as partes, garantida a autonomia profissional;' },
      { type: 'paragraph', leadBold: '8.5 – ', text: 'Os dados pessoais serão tratados exclusivamente para a execução do contrato, conforme a Lei nº 13.709/2018 (LGPD);' },
      { type: 'paragraph', leadBold: '8.6 – ', text: 'Integram este contrato, como anexos: Anexo I – Proposta técnica e lista de entregáveis; Anexo II – Cronograma; Anexo III – Dados de entrada e documentos recebidos; Anexo IV – Registro de versões, relatórios e solicitações. Alterações deste contrato dependem de aditivo escrito, e as comunicações por e-mail para os endereços da qualificação são válidas;' },
      { type: 'paragraph', leadBold: '8.7 – ', text: `Fica eleito o foro da Comarca de ${forumCityUf} para dirimir quaisquer dúvidas ou conflitos oriundos do presente contrato.` }
    );
  }

  // ===========================================================================
  // MODEL 04: PROJETOS COMPLEMENTARES
  // ===========================================================================
  if (serviceType === 'complementares') {
    const selectedDisciplines: string[] = [];
    if (s.compStructural) selectedDisciplines.push('estrutural');
    if (s.compFoundations) selectedDisciplines.push('fundações');
    if (s.compPlumbing) selectedDisciplines.push('hidrossanitário');
    if (s.compElectrical) selectedDisciplines.push('elétrico e telecomunicações');
    if (s.compSpda) selectedDisciplines.push('SPDA');
    if (s.compFire) selectedDisciplines.push('prevenção e combate a incêndio');
    if (s.compGas) selectedDisciplines.push('gás');
    if (s.compHvac) selectedDisciplines.push('climatização');
    if (s.compOtherName.trim()) selectedDisciplines.push(s.compOtherName.trim());

    reference = `Projetos complementares (${selectedDisciplines.length > 0 ? selectedDisciplines.join(', ') : 'estrutural / hidrossanitário / elétrico'}) do imóvel localizado à ${propertyFullAddress}.`;
    preamble =
      'As partes acima qualificadas têm entre si justo e acordado o presente contrato de prestação de serviço de elaboração de projetos complementares de engenharia, que se regerá pelas seguintes cláusulas:';

    const compRows: string[][] = [
      ['Estrutural', s.compStructural ? 'S' : 'N', 'Memorial de cálculo, formas, armações, detalhes e especificações'],
      ['Fundações', s.compFoundations ? 'S' : 'N', 'Memorial, locação e detalhamento das fundações'],
      ['Hidrossanitário', s.compPlumbing ? 'S' : 'N', 'Plantas, isométricos, detalhes e memorial'],
      ['Elétrico e telecomunicações', s.compElectrical ? 'S' : 'N', 'Plantas, quadros, diagramas, detalhes e memorial'],
      ['SPDA', s.compSpda ? 'S' : 'N', 'Plantas, detalhes e memorial'],
      ['Prevenção e combate a incêndio', s.compFire ? 'S' : 'N', 'Projeto, memorial e formulários do órgão'],
      ['Gás', s.compGas ? 'S' : 'N', 'Plantas, isométrico e memorial'],
      ['Climatização', s.compHvac ? 'S' : 'N', 'Plantas, detalhes e memorial'],
      [
        `Outro: ${v(s.compOtherName, '—')}`,
        s.compOtherName.trim() ? 'S' : 'N',
        v(s.compOtherProducts, '—'),
      ],
    ];

    blocks.push(
      { type: 'heading', text: '1 – Do objeto' },
      { type: 'paragraph', leadBold: '1.1 – ', text: 'O CONTRATADO obriga-se a elaborar os projetos complementares marcados abaixo, do empreendimento descrito, tendo por base o projeto arquitetônico indicado, nos modos e prazos deste instrumento (cláusulas 2 e 3), mediante o pagamento conforme a cláusula 4:' },
      {
        type: 'table',
        headers: ['Disciplina', 'Incluída (S/N)', 'Produtos principais'],
        rows: compRows,
      },
      { type: 'bullet', leadBold: 'Empreendimento: ', text: `${v(s.workType, 'obra nova / ampliação / reforma')} de edificação ${v(s.buildingUsage, 'residencial / comercial')} com área estimada de ${v(s.builtAreaSqm, 'XXX')} m², localizado à ${propertyFullAddress}; matrícula/inscrição ${v(c.propertyRegistration || c.propertyMunicipalCode, 'XXXXX')};` },
      { type: 'bullet', leadBold: 'Projeto arquitetônico de referência: ', text: `autor ${v(s.compArchAuthor, 'XXXXX')}, versão/revisão ${v(s.compArchRevision, 'XXXXX')}, de ${v(s.compArchDate, 'XX/XX/XXXX')}, anexado ao contrato.` },
      { type: 'paragraph', leadBold: '1.2 – ', text: 'Integram o objeto somente as disciplinas marcadas e os produtos da cláusula 2. A expressão “projeto completo” não amplia o escopo;' },
      { type: 'paragraph', leadBold: '1.3 – ', text: `Interfaces. A existência de vários projetos para o mesmo empreendimento não significa que foi contratada a compatibilização entre eles. A compatibilização entre as disciplinas deste contrato está incluída e entre elas e o projeto arquitetônico e demais projetos de terceiros ${v(s.compCompatibilityThirdParty, 'não está incluída')}. As trocas de informação entre os profissionais serão centralizadas em ${v(s.arqInfoHub, 'XXXXX')}, e as decisões sobre interferências serão registradas por escrito;` },
      { type: 'paragraph', leadBold: '1.4 – ', text: 'Toda alteração do projeto arquitetônico ou de outro projeto de referência posterior ao início dos trabalhos é alteração de premissa, na forma da cláusula 3;' },

      { type: 'heading', text: '2 – Descrição dos serviços' },
      { type: 'paragraph', leadBold: '2.1 – ', text: 'Para cada disciplina incluída, os serviços serão divididos em: (a) lançamento e estudo da solução, apresentado ao CONTRATANTE e ao autor do projeto arquitetônico; (b) projeto executivo, com pranchas, memorial e especificações; (c) revisão de compatibilização, quando incluída;' },
      { type: 'paragraph', leadBold: '2.2 – ', text: 'Dados de entrada. O CONTRATANTE fornecerá, nos prazos do Anexo III: projeto arquitetônico em versão definitiva, em DWG e PDF; levantamento topográfico; sondagem SPT e demais estudos de solo; para intervenção em construção existente, os dados disponíveis sobre a estrutura e as instalações; e as informações de demanda e de uso (cargas, equipamentos, ocupação). Cada item será identificado como documento recebido, informação declarada ou item a investigar;' },
      { type: 'paragraph', leadBold: '2.3 – ', text: 'Em caso de dado ausente, inconsistente ou incompatível, o CONTRATADO avisará o CONTRATANTE por escrito, fará a avaliação técnica do impacto, as partes ajustarão o reflexo no cronograma e, se for o caso, no preço, e a decisão será registrada por escrito. O CONTRATADO não está obrigado a presumir condições desconhecidas para prosseguir;' },
      { type: 'paragraph', leadBold: '2.4 – ', text: 'Projeto estrutural e de fundações. Aplica-se somente se marcado na cláusula 1, para o tipo de obra ali indicado (nova, ampliação ou intervenção em construção existente). Não estão incluídos, salvo previsão expressa: inspeção e investigação da estrutura existente, ensaios, laudos, projeto de escoramento e de fôrmas de execução, e acompanhamento da execução. A definição técnica das soluções cabe ao CONTRATADO, como profissional competente, e nenhuma revisão comercial equivale a laudo de segurança;' },
      { type: 'paragraph', leadBold: '2.5 – ', text: `Projetos de instalações. Dimensionados conforme a demanda informada pelo CONTRATANTE e as normas aplicáveis. O protocolo e a aprovação perante concessionárias e órgãos ${v(s.compUtilityApprovalText, 'não estão incluídos')};` },
      { type: 'paragraph', leadBold: '2.6 – ', text: `Os arquivos digitais serão entregues na versão ${v(s.arqSoftwareVersion, 'AutoCAD / Revit')}, por ${v(s.arqDeliveryChannel, 'e-mail / nuvem')}, sem garantia de uso em outros sistemas além dos formatos indicados;` },
      { type: 'paragraph', leadBold: '2.7 – ', text: 'Nos termos do art. 610, § 2º, do Código Civil, a contratação da elaboração de projeto não implica a obrigação de executá-lo nem de fiscalizar sua execução. A execução da obra e o acompanhamento ou fiscalização da execução serão objeto de contrato à parte;' },

      { type: 'heading', text: '3 – Dos prazos' },
      { type: 'paragraph', leadBold: '3.1 – ', text: `Os prazos, em dias corridos, são: lançamento e estudo da solução, ${v(s.compLaunchDays, 'XX')} dias após a assinatura e o recebimento dos dados de entrada completos; projeto executivo, ${v(s.compExecDays, 'XX')} dias após a aprovação do lançamento; revisão de compatibilização, ${v(s.compCompatDays, 'XX')} dias após o recebimento dos demais projetos em versão definitiva;` },
      { type: 'paragraph', leadBold: '3.2 – ', text: `O CONTRATANTE terá ${v(s.regReviewDays, 'XX')} dias corridos, contados da apresentação de cada etapa, para aprovar ou apresentar ressalvas por escrito, por meio de interlocutor único. Decorrido o prazo sem manifestação, o CONTRATADO notificará o CONTRATANTE e, persistindo o silêncio por mais 5 dias úteis, a etapa será considerada aceita comercialmente, com as ressalvas documentadas;` },
      { type: 'paragraph', leadBold: 'Revisões. ', text: 'Distinguem-se três situações, que não se confundem:' },
      { type: 'bullet', leadBold: 'Correção de problema da entrega: ', text: `ajuste de erro, omissão ou inconsistência de responsabilidade do CONTRATADO em relação ao que foi contratado e entregue. É feita sem custo adicional, em até ${v(s.regCorrectionDays, 'XX')} dias corridos;` },
      { type: 'bullet', leadBold: 'Revisão prevista: ', text: `ajuste, dentro das premissas já aprovadas, limitado a ${v(s.regPlannedReviewRounds, 'XX')} rodadas por etapa, cada uma em até ${v(s.regPlannedReviewDays, 'XX')} dias corridos após o pedido. Excedido o limite, as rodadas adicionais serão cobradas por hora técnica (cláusula 4);` },
      { type: 'bullet', leadBold: 'Alteração de premissa ou ampliação de escopo: ', text: 'mudança de programa, de área, de uso, de disciplinas ou de qualquer informação que fundamentou o trabalho já desenvolvido. O CONTRATADO registrará a nova premissa em versão identificável e avaliará o impacto em escopo, prazo e preço, que serão ajustados por aditivo antes do início do trabalho adicional. Exemplo: mudar a posição de pilares ou a carga de uma laje por alteração do projeto arquitetônico é alteração de premissa; corrigir erro de cota em prancha entregue é correção;' },
      { type: 'paragraph', leadBold: '3.3 – ', text: 'Cada arquivo terá identificação de revisão e data, e o CONTRATADO indicará a versão válida. Arquivos preliminares não poderão ser usados para obra;' },
      { type: 'paragraph', leadBold: '3.4 – ', text: 'Os prazos ficam suspensos, em relação à etapa afetada, enquanto perdurar pendência de informação, documento, acesso ou pagamento do CONTRATANTE, sem prejuízo da continuidade das etapas já liberadas. O atraso por informação pendente será distinguido do atraso em etapa já liberada no controle do cronograma;' },
      { type: 'paragraph', leadBold: '3.5 – ', text: 'O aceite é comercial: confirma a etapa e suas ressalvas, mas não substitui a responsabilidade técnica nem comprova aprovação de órgão público, concessionária ou instituição financeira;' },

      { type: 'heading', text: '4 – Dos honorários' },
      { type: 'paragraph', leadBold: '4.1 – ', text: `O CONTRATANTE pagará ao CONTRATADO o valor de ${moneyWithWords(t.totalValue, t.totalValueWords)}, discriminado por disciplina no Anexo I, da seguinte forma:` },
      { type: 'bullet', leadBold: '1ª Parcela: ', text: `${moneyWithWords(t.installment1Value, t.installment1Words)}, equivalente a 30%, na assinatura do contrato;` },
      { type: 'bullet', leadBold: '2ª Parcela: ', text: `${moneyWithWords(t.installment2Value, t.installment2Words)}, equivalente a 30%, na entrega do lançamento e estudo da solução;` },
      { type: 'bullet', leadBold: '3ª Parcela: ', text: `${moneyWithWords(t.installment3Value, t.installment3Words)}, equivalente a 40%, na entrega do projeto executivo.` },
      { type: 'paragraph', leadBold: '4.2 – ', text: `Não se incluem no preço, e serão pagos diretamente pelo CONTRATANTE: projeto arquitetônico e disciplinas não marcadas; sondagem, levantamento topográfico, ensaios e investigação de estruturas existentes; taxas e tarifas de concessionárias e órgãos; segundas vias e plotagens; acompanhamento da execução; alterações de premissa; e a taxa de emissão de cada ART (${artClause});` },
      { type: 'paragraph', leadBold: '4.3 – ', text: `Os pagamentos efetuados após o vencimento sofrerão multa de 2% (dois por cento) sobre o valor da parcela, juros de 1% ao mês e correção monetária pelo ${indexLabel};` },
      { type: 'paragraph', leadBold: '4.4 – ', text: 'Persistindo o inadimplemento de parcela por mais de 20 dias, o CONTRATADO poderá suspender os trabalhos e, após notificação, considerar rescindido o contrato (cláusula 7);' },
      { type: 'paragraph', leadBold: '4.5 – ', text: `Serviços extraordinários, alterações posteriores a etapa já aprovada, rodadas de revisão excedentes e visitas adicionais serão cobrados por hora técnica, no valor de ${hourlyDisplay}, mediante aprovação prévia do orçamento pelo CONTRATANTE;` },
      { type: 'paragraph', leadBold: '4.6 – ', text: 'Os produtos finais e o documento de responsabilidade técnica serão liberados após a quitação das parcelas vencidas.' },

      { type: 'heading', text: '5 – Das declarações e obrigações do CONTRATADO' },
      { type: 'paragraph', leadBold: '5.1 – ', text: 'O CONTRATADO assume o compromisso de bem executar as atribuições descritas neste instrumento, adotando o cuidado e a diligência recomendados pela boa técnica profissional, com observância dos prazos da cláusula 3;' },
      { type: 'paragraph', leadBold: '5.2 – ', text: 'O CONTRATADO respeitará as normas técnicas e a legislação vigentes aplicáveis ao serviço, responsabilizando-se pelos serviços prestados;' },
      { type: 'paragraph', leadBold: '5.3 – ', text: 'O CONTRATADO é o responsável técnico pelas atividades descritas na cláusula 1 e providenciará o registro correspondente no conselho profissional competente (ART no CREA ou documento equivalente, conforme a atividade e o conselho), vinculado a este contrato, antes da entrega final. O documento deve corresponder exatamente à atividade contratada e será retificado se o escopo for alterado;' },
      { type: 'paragraph', leadBold: '5.4 – ', text: 'O CONTRATADO poderá se valer de outros profissionais de sua confiança, sob sua supervisão e orientação, para cooperar na prestação do serviço;' },
      { type: 'paragraph', leadBold: '5.5 – ', text: 'O CONTRATADO obriga-se a manter sigilo sobre os termos deste instrumento e sobre as informações, documentos e dados a que tiver acesso em razão dele, não podendo revelá-los, reproduzi-los ou dar conhecimento a terceiros, salvo por exigência legal ou de órgão competente;' },
      { type: 'paragraph', leadBold: '5.6 – ', text: 'Cada disciplina será acompanhada de seu documento de responsabilidade técnica, emitido para a atividade correspondente;' },
      { type: 'paragraph', leadBold: '5.7 – ', text: 'O CONTRATADO fornecerá, na entrega final, índice dos arquivos finais (revisão, data e situação de uso) e registro das pendências, dos produtos não contratados e dos documentos que o CONTRATANTE precisará fornecer;' },

      { type: 'heading', text: '6 – Das declarações e obrigações do CONTRATANTE' },
      { type: 'paragraph', leadBold: '6.1 – ', text: 'O CONTRATANTE se obriga a pagar o valor fixado na cláusula 4, nos prazos e condições ali expressos;' },
      { type: 'paragraph', leadBold: '6.2 – ', text: 'O CONTRATANTE se obriga a colocar à disposição do CONTRATADO as informações e documentos necessários, nos prazos acordados, garantir o acesso ao imóvel sempre que necessário, indicar interlocutor único com poderes para aprovar e decidir e manter atualizados seus dados de endereço e contato;' },
      { type: 'paragraph', leadBold: '6.3 – ', text: 'O CONTRATANTE declara que os documentos e informações fornecidos são verdadeiros e que, após a extração de cópias, lhe foram devolvidos os originais;' },
      { type: 'paragraph', leadBold: '6.4 – ', text: 'Caso necessário, é dever do CONTRATANTE providenciar e arcar com os custos de profissionais, serviços, taxas, tributos e emolumentos não incluídos no preço;' },
      {
        type: 'paragraph',
        leadBold: '6.5 – ',
        text: t.allowImageRights
          ? 'O CONTRATANTE concede direito de imagem do trabalho e da execução para divulgação em redes sociais, site e portfólio, sem exposição de dados pessoais ou do endereço exato;'
          : 'Não há concessão de direito de imagem do trabalho para divulgação em redes sociais, site ou portfólio sem autorização prévia e expressa do CONTRATANTE;',
      },
      { type: 'paragraph', leadBold: '6.6 – ', text: `O CONTRATANTE reembolsará despesas de deslocamento, hospedagem (no limite de R$ 100,00 por diária) e alimentação (no limite de R$ 20,00 por refeição) contraídas pelo CONTRATADO em diligências fora do município de ${reimbCityUf}, relativas ao objeto deste contrato;` },
      { type: 'paragraph', leadBold: '6.7 – ', text: 'O CONTRATANTE fornecerá o projeto arquitetônico em versão definitiva e comunicará ao CONTRATADO, por escrito e de imediato, qualquer alteração de projeto, de uso ou de carga, ou qualquer fato relevante sobre o terreno e a edificação;' },
      { type: 'paragraph', leadBold: '6.8 – ', text: 'O CONTRATANTE não utilizará arquivos preliminares para obra;' },

      { type: 'heading', text: '7 – Das penalidades e da rescisão contratual' },
      { type: 'paragraph', leadBold: '7.1 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATANTE, este não terá direito à devolução dos valores já pagos pelas etapas concluídas e pagará os serviços executados e em andamento, apurados proporcionalmente, além de multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.2 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATADO sem concluir o serviço, este restituirá os valores recebidos referentes às etapas não executadas, deduzidos os serviços já prestados, e pagará multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.3 – ', text: 'Qualquer das partes poderá rescindir o contrato mediante notificação por escrito com antecedência de 15 dias, aplicando-se as regras acima conforme o caso;' },
      { type: 'paragraph', leadBold: '7.4 – ', text: 'Em qualquer hipótese de rescisão, o CONTRATADO entregará os trabalhos concluídos até a data, com identificação de versão e situação de uso, observada a liberação mediante quitação (cláusula 4);' },
      { type: 'paragraph', leadBold: '7.5 – ', text: 'Os direitos de uso das etapas concluídas e pagas poderão ser transferidos a outro profissional que o CONTRATANTE vier a contratar, mediante assunção, por este, da responsabilidade técnica sobre a continuidade do trabalho;' },

      { type: 'heading', text: '8 – Das disposições finais e eleição do foro' },
      { type: 'paragraph', leadBold: '8.1 – ', text: 'Os desenhos, memoriais e demais documentos técnicos são obra intelectual do CONTRATADO (Lei nº 9.610/98, art. 7º, inc. X). Com o pagamento integral, o CONTRATANTE poderá utilizá-los exclusivamente para o imóvel e a finalidade descritos na cláusula 1, na versão entregue, sendo vedada a reutilização em outro local ou empreendimento sem autorização por escrito. Este contrato não importa cessão irrestrita de direitos;' },
      { type: 'paragraph', leadBold: '8.2 – ', text: `Os documentos técnicos serão disponibilizados ao CONTRATANTE em PDF ou outro formato inalterável, e em formato editável somente aos responsáveis pelos projetos complementares ou ao CONTRATANTE, ${v(t.editableFileCondition, 'mediante solicitação formal')}. Alterações posteriores por outro profissional serão feitas sob responsabilidade técnica própria desse profissional, e o CONTRATADO não responde por modificações que não tenha realizado ou autorizado;` },
      { type: 'paragraph', leadBold: '8.3 – ', text: 'A responsabilidade do CONTRATADO limita-se à elaboração dos projetos contratados e não se estende ao acompanhamento da execução, à contratação de serviços e profissionais da obra, à compra de materiais ou aos encargos de executores e prestadores. Isso não afasta as responsabilidades próprias do serviço assumido;' },
      { type: 'paragraph', leadBold: '8.4 – ', text: 'Não há identidade ou solidariedade entre a responsabilidade do CONTRATADO e a de outros projetistas ou dos executores da obra, cada qual respondendo pelo seu trabalho;' },
      { type: 'paragraph', leadBold: '8.5 – ', text: 'O CONTRATADO não se responsabiliza por alterações durante a obra em desacordo com os projetos, nem por alterações solicitadas pelo CONTRATANTE em desacordo com a legislação vigente;' },
      { type: 'paragraph', leadBold: '8.6 – ', text: `Os atendimentos ao CONTRATANTE ocorrerão de segunda a sexta, entre ${v(t.officeHoursStart, 'XhXXmin')} e ${v(t.officeHoursEnd, 'XXh')}. Atendimento fora desse horário será cobrado como visita técnica, no valor de R$ ${v(t.outOfHoursFee, 'XXX,XX')} por ocorrência;` },
      { type: 'paragraph', leadBold: '8.7 – ', text: 'A prestação de serviços pelo CONTRATADO não implica vínculo trabalhista entre as partes, garantida a autonomia profissional;' },
      { type: 'paragraph', leadBold: '8.8 – ', text: 'Os dados pessoais serão tratados exclusivamente para a execução do contrato, conforme a Lei nº 13.709/2018 (LGPD);' },
      { type: 'paragraph', leadBold: '8.9 – ', text: 'Integram este contrato, como anexos: Anexo I – Proposta técnica e lista de entregáveis; Anexo II – Cronograma; Anexo III – Dados de entrada e documentos recebidos; Anexo IV – Registro de versões, relatórios e solicitações. Alterações deste contrato dependem de aditivo escrito, e as comunicações por e-mail para os endereços da qualificação são válidas;' },
      { type: 'paragraph', leadBold: '8.10 – ', text: `Fica eleito o foro da Comarca de ${forumCityUf} para dirimir quaisquer dúvidas ou conflitos oriundos do presente contrato.` }
    );
  }

  // ===========================================================================
  // MODEL 05: ACOMPANHAMENTO DE OBRA
  // ===========================================================================
  if (serviceType === 'acompanhamento') {
    reference = `Acompanhamento técnico da obra de ${v(s.acompWorkDescription, '[descrição]')} localizada à ${propertyFullAddress}.`;
    preamble =
      'As partes acima qualificadas têm entre si justo e acordado o presente contrato de prestação de serviço de acompanhamento técnico de obra, que se regerá pelas seguintes cláusulas:';

    const optMgmt = s.acompIncludeManagement ? '(X)' : '( )';
    const optMeas = s.acompIncludeMeasurements ? '(X)' : '( )';
    const optFinal = s.acompIncludeFinalDelivery ? '(X)' : '( )';
    const optOther = s.acompIncludeOthersText.trim() ? '(X)' : '( )';

    const acompTableRows: string[][] = [
      ['Relatório de visita', 'Registro fotográfico, itens conferidos, não conformidades e recomendações', `Até ${v(s.acompVisitReportDays, 'XX')} dias úteis após cada visita`],
      ['Relatório mensal', 'Consolidação do andamento, pendências e decisões', `Até o dia ${v(s.acompMonthlyReportDay, 'XX')} do mês seguinte`],
      ['Registro de não conformidades', 'Descrição, prazo sugerido para correção e situação', 'Em cada visita'],
    ];
    if (s.acompIncludeMeasurements) {
      acompTableRows.push([
        'Parecer sobre medições (incluído)',
        'Conferência de medições e faturas do executor',
        `Em até ${v(s.acompMeasurementDays, 'XX')} dias úteis do recebimento`,
      ]);
    } else {
      acompTableRows.push([
        '[Opcional – não incluído] Parecer sobre medições',
        'Conferência de medições e faturas do executor',
        'Somente se contratado à parte',
      ]);
    }

    blocks.push(
      { type: 'heading', text: '1 – Do objeto' },
      { type: 'paragraph', leadBold: '1.1 – ', text: 'O CONTRATADO obriga-se a prestar ao CONTRATANTE os serviços de acompanhamento técnico (fiscalização) da obra descrita abaixo, nos modos e prazos estabelecidos neste instrumento (cláusulas 2 e 3), mediante o pagamento conforme a cláusula 4:' },
      { type: 'bullet', leadBold: 'Obra: ', text: `${v(s.workType, 'construção nova / ampliação / reforma')} de ${v(s.acompWorkDescription, 'XXXXX')}, com área aproximada de ${v(s.builtAreaSqm, 'XXX')} m², no endereço ${propertyFullAddress};` },
      { type: 'bullet', leadBold: 'Executor da obra: ', text: `${v(s.acompExecutorName, 'XXXXX')} (CPF/CNPJ ${v(s.acompExecutorDoc, 'XXXXX')}), conforme contrato de execução de ${v(s.acompExecutorContractDate, 'XX/XX/XXXX')};` },
      { type: 'bullet', leadBold: 'Responsável técnico pela execução: ', text: `${v(s.acompRtName, 'XXXXX')} (CREA/CAU nº ${v(s.acompRtCrea, 'XXXXX')});` },
      { type: 'bullet', leadBold: 'Projetos de referência: ', text: 'os indicados no Anexo III, em suas versões válidas;' },
      { type: 'bullet', leadBold: 'Prazo previsto da obra: ', text: `${v(s.acompEstimatedMonths, 'XX')} meses.` },
      { type: 'paragraph', leadBold: '1.2 – ', text: 'O CONTRATADO atua como representante técnico do CONTRATANTE. Não é executor da obra nem responsável técnico pela execução, que permanecem com o executor e o profissional indicado acima, e não responde pela contratação, pagamento ou direção da mão de obra, salvo se assumir tais encargos em instrumento próprio;' },
      { type: 'paragraph', leadBold: '1.3 – ', text: 'Projetar, executar e fiscalizar são encargos distintos (art. 610, § 2º, do Código Civil). Este contrato abrange apenas o acompanhamento descrito na cláusula 2;' },

      { type: 'heading', text: '2 – Descrição dos serviços' },
      { type: 'paragraph', leadBold: '2.1 – ', text: `Frequência. O acompanhamento será feito por ${v(s.acompFrequency, 'XX visita(s) por semana')}, de duração mínima de ${v(s.acompMinHours, 'XX')} horas, em dias combinados com antecedência de ${v(s.acompAdvanceNoticeDays, 'XX')} dias, e por visitas adicionais nas etapas críticas indicadas no Anexo I (por exemplo: fundações e armaduras antes da concretagem, instalações antes do fechamento, impermeabilização, cobertura);` },
      { type: 'paragraph', leadBold: '2.2 – ', text: 'Atividades. Em cada visita, o CONTRATADO conferirá, por observação e por amostragem, a execução em relação aos projetos, memoriais, especificações e normas técnicas aplicáveis, a qualidade dos materiais e serviços observáveis, o andamento em relação ao cronograma, e registrará e comunicará as não conformidades constatadas;' },
      {
        type: 'table',
        headers: ['Produto', 'Conteúdo', 'Prazo'],
        rows: acompTableRows,
      },
      { type: 'paragraph', leadBold: '2.3 – ', text: 'Comunicação. As não conformidades serão comunicadas por escrito ao CONTRATANTE e ao responsável técnico pela execução. A decisão de aceitar, corrigir, paralisar um serviço ou pagar o executor é do CONTRATANTE. O CONTRATADO não dará ordens diretas à mão de obra do executor nem celebrará contratos ou efetuará pagamentos em nome do CONTRATANTE;' },
      { type: 'paragraph', leadBold: '2.4 – ', text: 'Risco grave. Constatado risco grave e iminente à segurança de pessoas ou da edificação, o CONTRATADO comunicará imediatamente o CONTRATANTE e o responsável pela execução e recomendará a paralisação do serviço afetado, registrando o fato por escrito;' },
      { type: 'paragraph', leadBold: '2.5 – ', text: 'Limites. O acompanhamento não equivale a presença permanente na obra nem a fiscalização integral de todos os serviços; é feito nas visitas e por amostragem. Não substitui a responsabilidade do executor e de seu responsável técnico pela execução, nem a gestão de segurança do trabalho, a cargo do executor;' },
      { type: 'paragraph', leadBold: '2.6 – ', text: 'Estão excluídos, salvo previsão expressa: ensaios e análises (concreto, solo, materiais), laudos, projetos, orçamentos, compra de materiais, licenças e documentos de conclusão da obra, e a responsabilidade técnica pela execução;' },
      { type: 'paragraph', leadBold: '2.7 – ', text: `Serviços opcionais incluídos: ${optMgmt} gerenciamento da obra: cronograma físico-financeiro, controle de custos e de medições, planejamento de compras e de mão de obra; ${optMeas} conferência de medições e faturas; ${optFinal} acompanhamento de entrega e vistoria final; ${optOther} outros: ${v(s.acompIncludeOthersText, 'nenhum')}. O que não estiver marcado está excluído;` },

      { type: 'heading', text: '3 – Dos prazos' },
      { type: 'paragraph', leadBold: '3.1 – ', text: `O contrato inicia-se em ${v(s.acompStartDate, 'XX/XX/XXXX')} e vigora até ${v(s.acompEndClause, 'a conclusão da obra')}, prorrogável por aditivo se a obra se estender;` },
      { type: 'paragraph', leadBold: '3.2 – ', text: `As visitas serão agendadas com antecedência de ${v(s.acompAdvanceNoticeDays, 'XX')} dias. Visitas extraordinárias solicitadas pelo CONTRATANTE serão atendidas em até ${v(s.acompExtraVisitDays, 'XX')} dias úteis e cobradas por hora técnica (cláusula 4);` },
      { type: 'paragraph', leadBold: '3.3 – ', text: `Na paralisação da obra por mais de ${v(s.acompSuspensionDays, 'XX')} dias, o serviço fica suspenso, sem cobrança do período, e será retomado com a obra, mediante comunicação;` },
      { type: 'paragraph', leadBold: '3.4 – ', text: `Quando a visita não puder ser realizada por falta de acesso, informação incorreta ou ausência de quem possa acompanhá-la, será considerada realizada para fins de cobrança, e a nova visita será agendada em até ${v(s.acompRescheduleVisitDays, 'XX')} dias;` },
      { type: 'paragraph', leadBold: '3.5 – ', text: 'Prorrogação do prazo da obra por razão não imputável ao CONTRATADO mantém os honorários mensais, salvo ajuste diverso por aditivo;' },
      { type: 'paragraph', leadBold: '3.6 – ', text: `Os relatórios serão considerados recebidos se o CONTRATANTE não apresentar ressalvas em ${v(s.acompReportAcceptDays, 'XX')} dias corridos de sua entrega, sem prejuízo da responsabilidade técnica de cada parte;` },

      { type: 'heading', text: '4 – Dos honorários' },
      { type: 'paragraph', leadBold: '4.1 – ', text: `O CONTRATANTE pagará ao CONTRATADO honorários mensais de ${moneyWithWords(t.monthlyFee || t.totalValue, t.monthlyFeeWords || t.totalValueWords)}, que incluem ${v(t.monthlyVisitsIncluded, 'XX visita(s) por mês e o relatório mensal')}, com vencimento até o dia ${v(t.monthlyDueDay, 'XX')} do mês seguinte ao da prestação, ${v(t.monthlyAdjustmentIndex, 'reajustados anualmente pelo IPCA')};` },
      { type: 'paragraph', leadBold: '4.2 – ', text: `Não se incluem nos honorários: visitas e reuniões adicionais; ensaios e laudos; gerenciamento da obra, se não marcado na cláusula 2; deslocamentos fora do município de ${reimbCityUf}; e a taxa de emissão da ART (${artClause});` },
      { type: 'paragraph', leadBold: '4.3 – ', text: `Os pagamentos efetuados após o vencimento sofrerão multa de 2% (dois por cento) sobre o valor da parcela, juros de 1% ao mês e correção monetária pelo ${indexLabel};` },
      { type: 'paragraph', leadBold: '4.4 – ', text: 'Persistindo o inadimplemento de parcela por mais de 20 dias, o CONTRATADO poderá suspender os trabalhos e, após notificação, considerar rescindido o contrato (cláusula 7);' },
      { type: 'paragraph', leadBold: '4.5 – ', text: `Serviços extraordinários, alterações posteriores a etapa já aprovada, rodadas de revisão excedentes e visitas adicionais serão cobrados por hora técnica, no valor de ${hourlyDisplay}, mediante aprovação prévia do orçamento pelo CONTRATANTE;` },
      { type: 'paragraph', leadBold: '4.6 – ', text: 'Os produtos finais e o documento de responsabilidade técnica serão liberados após a quitação das parcelas vencidas.' },

      { type: 'heading', text: '5 – Das declarações e obrigações do CONTRATADO' },
      { type: 'paragraph', leadBold: '5.1 – ', text: 'O CONTRATADO assume o compromisso de bem executar as atribuições descritas neste instrumento, adotando o cuidado e a diligência recomendados pela boa técnica profissional, com observância dos prazos da cláusula 3;' },
      { type: 'paragraph', leadBold: '5.2 – ', text: 'O CONTRATADO respeitará as normas técnicas e a legislação vigentes aplicáveis ao serviço, responsabilizando-se pelos serviços prestados;' },
      { type: 'paragraph', leadBold: '5.3 – ', text: 'O CONTRATADO é o responsável técnico pelas atividades descritas na cláusula 1 e providenciará o registro correspondente no conselho profissional competente (ART no CREA ou documento equivalente, conforme a atividade e o conselho), vinculado a este contrato, antes da entrega final. O documento deve corresponder exatamente à atividade contratada e será retificado se o escopo for alterado;' },
      { type: 'paragraph', leadBold: '5.4 – ', text: 'O CONTRATADO poderá se valer de outros profissionais de sua confiança, sob sua supervisão e orientação, para cooperar na prestação do serviço;' },
      { type: 'paragraph', leadBold: '5.5 – ', text: 'O CONTRATADO obriga-se a manter sigilo sobre os termos deste instrumento e sobre as informações, documentos e dados a que tiver acesso em razão dele, não podendo revelá-los, reproduzi-los ou dar conhecimento a terceiros, salvo por exigência legal ou de órgão competente;' },
      { type: 'paragraph', leadBold: '5.6 – ', text: `O CONTRATADO manterá registro das visitas, relatórios e comunicações por ${v(s.acompArchiveYears, '5 anos')}, informará o CONTRATANTE por escrito sobre as não conformidades e declara não ter vínculo ou interesse com o executor que comprometa sua independência, informando de imediato se surgir;` },
      { type: 'paragraph', leadBold: '5.7 – ', text: 'O CONTRATADO registrará a ART da atividade de acompanhamento ou fiscalização de obra, e não a de execução, salvo se esta for contratada em instrumento próprio;' },

      { type: 'heading', text: '6 – Das declarações e obrigações do CONTRATANTE' },
      { type: 'paragraph', leadBold: '6.1 – ', text: 'O CONTRATANTE se obriga a pagar o valor fixado na cláusula 4, nos prazos e condições ali expressos;' },
      { type: 'paragraph', leadBold: '6.2 – ', text: 'O CONTRATANTE se obriga a colocar à disposição do CONTRATADO as informações e documentos necessários, nos prazos acordados, garantir o acesso ao imóvel sempre que necessário, indicar interlocutor único com poderes para aprovar e decidir e manter atualizados seus dados de endereço e contato;' },
      { type: 'paragraph', leadBold: '6.3 – ', text: 'O CONTRATANTE declara que os documentos e informações fornecidos são verdadeiros e que, após a extração de cópias, lhe foram devolvidos os originais;' },
      { type: 'paragraph', leadBold: '6.4 – ', text: 'Caso necessário, é dever do CONTRATANTE providenciar e arcar com os custos de profissionais, serviços, taxas, tributos e emolumentos não incluídos no preço;' },
      {
        type: 'paragraph',
        leadBold: '6.5 – ',
        text: t.allowImageRights
          ? 'O CONTRATANTE concede direito de imagem do trabalho e da execução para divulgação em redes sociais, site e portfólio, sem exposição de dados pessoais ou do endereço exato;'
          : 'Não há concessão de direito de imagem do trabalho para divulgação em redes sociais, site ou portfólio sem autorização prévia e expressa do CONTRATANTE;',
      },
      { type: 'paragraph', leadBold: '6.6 – ', text: `O CONTRATANTE reembolsará despesas de deslocamento, hospedagem (no limite de R$ 100,00 por diária) e alimentação (no limite de R$ 20,00 por refeição) contraídas pelo CONTRATADO em diligências fora do município de ${reimbCityUf}, relativas ao objeto deste contrato;` },
      { type: 'paragraph', leadBold: '6.7 – ', text: 'O CONTRATANTE garantirá o acesso do CONTRATADO à obra e comunicará ao executor a existência e as atribuições do CONTRATADO, fornecendo cópia dos contratos, aditivos e projetos válidos e incluindo no contrato de execução a obrigação do executor de permitir o acompanhamento e atender às comunicações;' },
      { type: 'paragraph', leadBold: '6.8 – ', text: `O CONTRATANTE decidirá sobre as não conformidades comunicadas em até ${v(s.acompClientDecisionDays, 'XX')} dias, informará o CONTRATADO sobre pagamentos ao executor e sobre alterações solicitadas na obra, e providenciará que o executor forneça os equipamentos de proteção necessários às visitas;` },

      { type: 'heading', text: '7 – Das penalidades e da rescisão contratual' },
      { type: 'paragraph', leadBold: '7.1 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATANTE, este não terá direito à devolução dos valores já pagos pelas etapas concluídas e pagará os serviços executados e em andamento, apurados proporcionalmente, além de multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.2 – ', text: 'Em caso de rescisão injustificada por parte do CONTRATADO sem concluir o serviço, este restituirá os valores recebidos referentes às etapas não executadas, deduzidos os serviços já prestados, e pagará multa de 20% sobre o saldo remanescente;' },
      { type: 'paragraph', leadBold: '7.3 – ', text: 'Qualquer das partes poderá rescindir o contrato mediante notificação por escrito com antecedência de 15 dias, aplicando-se as regras acima conforme o caso;' },
      { type: 'paragraph', leadBold: '7.4 – ', text: 'Em qualquer hipótese de rescisão, o CONTRATADO entregará os trabalhos concluídos até a data, com identificação de versão e situação de uso, observada a liberação mediante quitação (cláusula 4);' },
      { type: 'paragraph', leadBold: '7.5 – ', text: 'Havendo paralisação definitiva ou término antecipado da obra, o contrato se encerra mediante o pagamento proporcional dos honorários até a data da comunicação;' },

      { type: 'heading', text: '8 – Das disposições finais e eleição do foro' },
      { type: 'paragraph', leadBold: '8.1 – ', text: 'A execução da obra é de responsabilidade do executor e de seu responsável técnico. O CONTRATADO não responde por vícios de execução que não fossem observáveis nas visitas realizadas, nem por serviços executados em desacordo com sua comunicação ou sem sua ciência. Isso não afasta a responsabilidade pelo acompanhamento diligente, nos termos da cláusula 2;' },
      { type: 'paragraph', leadBold: '8.2 – ', text: 'Não há identidade ou solidariedade entre a responsabilidade do CONTRATADO e a do executor, de seu responsável técnico e de outros profissionais ou fornecedores da obra, cada qual respondendo pelo seu trabalho;' },
      { type: 'paragraph', leadBold: '8.3 – ', text: 'Os relatórios são de autoria do CONTRATADO e destinam-se ao uso do CONTRATANTE em relação à obra descrita, sendo vedada sua alteração e sua utilização para outra finalidade sem autorização por escrito;' },
      { type: 'paragraph', leadBold: '8.4 – ', text: `Os atendimentos fora das visitas ocorrerão de segunda a sexta, entre ${v(t.officeHoursStart, 'XhXXmin')} e ${v(t.officeHoursEnd, 'XXh')};` },
      { type: 'paragraph', leadBold: '8.5 – ', text: 'A prestação de serviços pelo CONTRATADO não implica vínculo trabalhista entre as partes, garantida a autonomia profissional;' },
      { type: 'paragraph', leadBold: '8.6 – ', text: 'Os dados pessoais serão tratados exclusivamente para a execução do contrato, conforme a Lei nº 13.709/2018 (LGPD);' },
      { type: 'paragraph', leadBold: '8.7 – ', text: 'Integram este contrato, como anexos: Anexo I – Proposta técnica e lista de entregáveis; Anexo II – Cronograma; Anexo III – Dados de entrada e documentos recebidos; Anexo IV – Registro de versões, relatórios e solicitações. Alterações deste contrato dependem de aditivo escrito, e as comunicações por e-mail para os endereços da qualificação são válidas;' },
      { type: 'paragraph', leadBold: '8.8 – ', text: `Fica eleito o foro da Comarca de ${forumCityUf} para dirimir quaisquer dúvidas ou conflitos oriundos do presente contrato.` }
    );
  }

  return {
    title,
    reference,
    contratante,
    contratado,
    preamble,
    blocks,
    closing: commonClosing,
    localAndDate: v(t.signatureCityDate, 'Local e data.'),
    contratanteSignatureLabel: contratanteSigName,
    contratadoSignatureLabel: v(k.fullName, 'KAIO HENRIQUE DA SILVA').toUpperCase(),
    witness1: `1. ______________________________ Nome: ${v(t.witness1Name, '_______________________')} CPF: ${v(t.witness1Cpf, '___.___.___-__')}`,
    witness2: `2. ______________________________ Nome: ${v(t.witness2Name, '_______________________')} CPF: ${v(t.witness2Cpf, '___.___.___-__')}`,
  };
}
