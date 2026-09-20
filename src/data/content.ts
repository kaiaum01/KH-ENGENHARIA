import React from 'react';
import { 
  Building2, 
  Ruler, 
  FileCheck2, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText 
} from 'lucide-react';

export interface NeedOption {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tag: string;
  description: string;
  included: string[];
  documents: string;
  estimatedTime: string;
  whatsappMessage: string;
}

export const NEED_OPTIONS: NeedOption[] = [
  {
    id: 'regularizacao',
    icon: FileCheck2,
    title: 'Regularização de Imóvel',
    tag: 'Prefeitura & Cartório',
    description: 'Solução completa para construções já erguidas ou com pendências na prefeitura, averbação de certidões e obtenção do Habite-se.',
    included: [
      'Levantamento métrico in loco do imóvel',
      'Elaboração de plantas as-built (conforme construído)',
      'Memorial descritivo e laudo de estabilidade',
      'Protocolo e acompanhamento do processo na Prefeitura',
      'Emissão da ART de regularização no CREA-PR'
    ],
    documents: 'Matrícula atualizada ou contrato de compra e venda, carnê de IPTU.',
    estimatedTime: 'Análise inicial em até 24h úteis',
    whatsappMessage: 'Olá Engenheiro Kaio! Gostaria de uma avaliação para regularizar meu imóvel em Umuarama/região.'
  },
  {
    id: 'arquitetonico',
    icon: Ruler,
    title: 'Projeto para Construção Nova',
    tag: 'Arquitetônico & 3D',
    description: 'Desenvolvimento do projeto residencial ou comercial do zero, com foco em conforto térmico, estética, funcionalidade e aprovação garantida.',
    included: [
      'Estudo preliminar e alinhamento das suas necessidades',
      'Plantas baixas, cortes, fachadas e detalhes construtivos',
      'Memorial descritivo exigido pelos órgãos públicos',
      'Compatibilização para evitar erros e desperdícios na obra',
      'Emissão da ART de projeto'
    ],
    documents: 'Medidas do terreno ou certidão de matrícula com confrontações.',
    estimatedTime: 'Proposta preliminar em até 48 horas',
    whatsappMessage: 'Olá! Estou planejando construir e gostaria de um orçamento para projeto arquitetônico e aprovação.'
  },
  {
    id: 'laudo',
    icon: FileText,
    title: 'Laudo Técnico ou Vistoria',
    tag: 'Perícia & Responsabilidade',
    description: 'Inspeção criteriosa para avaliar rachaduras, infiltrações, patologias da construção ou emitir laudo para compra/venda e vizinhança.',
    included: [
      'Vistoria técnica presencial detalhada',
      'Diagnóstico de causas de fissuras, umidade ou sobrecargas',
      'Recomendações técnicas de reparo conforme normas ABNT',
      'Relatório fotográfico documentado',
      'Emissão da respectiva ART no CREA-PR'
    ],
    documents: 'Histórico da edificação e pontos visíveis com patologias.',
    estimatedTime: 'Vistoria agendada rapidamente',
    whatsappMessage: 'Olá Engenheiro Kaio! Preciso de uma vistoria técnica / laudo pericial com emissão de ART.'
  },
  {
    id: 'complementares',
    icon: Layers,
    title: 'Projetos Complementares',
    tag: 'Elétrico & Hidrossanitário',
    description: 'Dimensionamento seguro de redes de água fria/quente, esgoto, fiação elétrica de baixa tensão e prevenção contra descargas atmosféricas.',
    included: [
      'Projeto elétrico com divisão correta de circuitos',
      'Projeto hidrossanitário com caimentos e ventilação corretos',
      'Lista quantitativa de materiais para orçar com facilidade',
      'Prevenção de sobrecargas e entupimentos futuros',
      'Emissão da ART de cada disciplina técnica'
    ],
    documents: 'Projeto arquitetônico aprovado ou planta base da obra.',
    estimatedTime: 'Dimensionamento rápido e seguro',
    whatsappMessage: 'Olá! Gostaria de um orçamento para projetos complementares (elétrico e/ou hidrossanitário).'
  }
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    question: 'Por que a ART (Anotação de Responsabilidade Técnica) é indispensável?',
    answer: 'A ART é o documento oficial do CREA que comprova que a obra ou serviço possui um engenheiro legalmente habilitado respondendo tecnicamente por ela. Sem ela, prefeituras não liberam alvarás ou habite-se, bancos recusam financiamentos e você fica desprotegido em caso de qualquer imprevisto estrutural.'
  },
  {
    question: 'Quanto tempo leva para regularizar uma construção existente?',
    answer: 'O tempo de levantamento técnico e elaboração das plantas pela KH Engenharia costuma levar poucos dias. Já a tramitação e emissão do habite-se pela Prefeitura varia conforme o município (geralmente entre 15 e 45 dias úteis). Nós cuidamos de todo o processo técnico para evitar indeferimentos.'
  },
  {
    question: 'A KH Engenharia atende apenas a cidade de Umuarama?',
    answer: 'Realizamos vistorias e atendimento presencial em Umuarama e em todas as cidades da região metropolitana e noroeste do Paraná. Para projetos arquitetônicos, complementares e consultorias técnicas que não exijam vistoria presencial preliminar, atendemos clientes de todo o Brasil de forma 100% digital.'
  },
  {
    question: 'Posso regularizar um imóvel que foi ampliado sem autorização prévia?',
    answer: 'Sim! Esse é um dos serviços mais comuns. Realizamos o levantamento "as-built" (como construído), verificamos se as normas de recuo e iluminação estão atendidas ou passíveis de adequação e submetemos o processo de regularização na prefeitura para averbação no cartório de registro de imóveis.'
  },
  {
    question: 'Como funciona a solicitação e o pagamento do orçamento?',
    answer: 'A primeira conversa e diagnóstico do seu caso são 100% gratuitos e sem compromisso. Após entendermos sua necessidade, enviamos uma proposta técnica detalhada com escopo, prazos e valores justos, com opções flexíveis de pagamento conforme o avanço das etapas do projeto.'
  }
];
