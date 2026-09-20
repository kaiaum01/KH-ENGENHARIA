/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  User,
  DollarSign,
  ShieldCheck,
  Compass,
  FileText,
  HardHat,
  Zap,
  FileCheck,
  Calculator,
  GraduationCap,
  MapPin,
  Mail,
  Instagram,
  Menu,
  X,
  ArrowUpRight,
  Check,
  Phone,
  ArrowRight,
  ChevronDown,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Ruler,
  Layers,
  Send,
  ExternalLink
} from 'lucide-react';
import { NEED_OPTIONS, FAQS } from './data/content';

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedNeedId, setSelectedNeedId] = useState('regularizacao');
  const [serviceFilter, setServiceFilter] = useState<'todos' | 'projetos' | 'legalizacao' | 'gestao'>('todos');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    servico: 'Regularização de Imóvel',
    mensagem: ''
  });

  const serviceOptions = [
    'Regularização de Imóvel',
    'Projeto Arquitetônico',
    'Laudo Técnico / Vistoria',
    'Projetos Complementares',
    'Acompanhamento de Obra',
    'Orçamento e Planejamento'
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectService = (servico: string) => {
    setFormData(prev => ({
      ...prev,
      servico
    }));
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let message = 'Mensagem KH Engenharia:\n\n';
    message += `Nome: ${formData.nome}\n`;
    message += `Telefone: ${formData.telefone}\n`;
    if (formData.email) {
      message += `E-mail: ${formData.email}\n`;
    }
    message += `Serviço de Interesse: ${formData.servico}\n`;
    message += `Detalhes da Solicitação: ${formData.mensagem}\n`;

    const whatsappUrl = `https://wa.me/5544997453807?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const activeNeed = NEED_OPTIONS.find(n => n.id === selectedNeedId) || NEED_OPTIONS[0];

  const allServices = [
    {
      id: '01',
      category: 'projetos',
      icon: Compass,
      title: 'Projetos Arquitetônicos',
      tag: 'Aprovação Municipal',
      summary: 'Plantas, cortes, fachadas e memorial descritivo para aprovação sem transtornos na prefeitura.',
      highlights: ['Plantas baixas e cortes técnicos', 'Memorial descritivo obrigatório', 'Aprovação em prefeituras da região']
    },
    {
      id: '02',
      category: 'legalizacao',
      icon: FileText,
      title: 'Laudos Técnicos & Vistorias',
      tag: 'Respaldo Jurídico',
      summary: 'Vistorias criteriosas para patologias, trincas ou estabilidade, amparados rigorosamente nas normas ABNT.',
      highlights: ['Inspeção in loco detalhada', 'Laudo com parecer conclusivo', 'Emissão imediata de ART no CREA']
    },
    {
      id: '03',
      category: 'gestao',
      icon: HardHat,
      title: 'Acompanhamento de Obra',
      tag: 'Qualidade Construtiva',
      summary: 'Vistorias preventivas para garantir a correta aplicação dos projetos, evitando desperdícios e retrabalhos.',
      highlights: ['Controle de qualidade e métodos', 'Conformidade com os projetos', 'Relatórios periódicos de evolução']
    },
    {
      id: '04',
      category: 'projetos',
      icon: Zap,
      title: 'Projetos Complementares',
      tag: 'Segurança & Economia',
      summary: 'Dimensionamento elétrico de baixa tensão, hidrossanitário eficiente, esgoto, água pluvial e SPDA.',
      highlights: ['Dimensionamento sem superdimensionar', 'Lista completa de materiais', 'Prevenção de sobrecargas e vazamentos']
    },
    {
      id: '05',
      category: 'legalizacao',
      icon: FileCheck,
      title: 'Regularização de Imóveis',
      tag: 'Habite-se & Averbação',
      summary: 'Resolução de pendências técnicas e burocráticas para emissão de Habite-se e averbação no cartório.',
      highlights: ['Levantamento cadastral do imóvel', 'Adequação às normas municipais', 'Processo completo até a certidão']
    },
    {
      id: '06',
      category: 'gestao',
      icon: Calculator,
      title: 'Orçamentos e Planilhas',
      tag: 'Previsibilidade Financeira',
      summary: 'Desenvolvimento detalhado de planilhas de materiais e mão de obra para obras e reformas conscientes.',
      highlights: ['Quantitativo exato de insumos', 'Estimativa realista de custos', 'Controle para evitar surpresas']
    }
  ];

  const filteredServices = serviceFilter === 'todos' 
    ? allServices 
    : allServices.filter(s => s.category === serviceFilter);

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 selection:bg-white selection:text-black relative overflow-hidden font-sans">
      
      {/* Decorative Subtle Background Orbs */}
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      {/* Modern Sticky Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'py-3.5 bg-[#070709]/95 backdrop-blur-md border-b border-white/10 shadow-xl'
            : 'py-5 bg-transparent'
        }`}
        id="navbar-header"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex items-center group" id="logo-link" aria-label="KH Engenharia - Página Inicial">
            <img 
              src="https://i.postimg.cc/QxcpQ4PS/Sem-titulo-removebg-preview.png" 
              alt="KH Engenharia" 
              className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 group-hover:opacity-90" 
              referrerPolicy="no-referrer"
            />
          </a>

          {/* Right Header Action: Clean and uncluttered on all screens */}
          <div className="flex items-center gap-2.5 sm:gap-3" id="header-actions">
            <a
              href="https://wa.me/5544997453807?text=Olá! Gostaria de solicitar um orçamento com o Engenheiro Kaio."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium-solid text-xs font-semibold uppercase tracking-wider py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg inline-flex items-center gap-1.5 sm:gap-2"
              id="cta-nav-link"
            >
              <span>Solicitar orçamento</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {/* Unified Menu Trigger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-300 hover:text-white p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
              aria-label={menuOpen ? "Fechar Menu" : "Abrir Menu"}
              id="main-menu-trigger"
            >
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">Menu</span>
              {menuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer (Mobile & Desktop) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 cursor-pointer"
              aria-hidden="true"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] bg-[#0a0a0e] z-50 flex flex-col p-6 sm:p-7 border-l border-white/10 shadow-2xl overflow-y-auto"
              id="main-nav-drawer"
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <img 
                  src="https://i.postimg.cc/QxcpQ4PS/Sem-titulo-removebg-preview.png" 
                  alt="KH Engenharia" 
                  className="h-8 w-auto object-contain" 
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Fechar Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 py-6 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 px-3">
                  Navegação
                </span>
                {[
                  { label: 'Início', href: '#inicio' },
                  { label: 'Guia Rápido de Soluções', href: '#solucoes' },
                  { label: 'Serviços Especializados', href: '#servicos' },
                  { label: 'Como Funciona o Atendimento', href: '#processo' },
                  { label: 'Sobre a KH Engenharia', href: '#sobre' },
                  { label: 'Perguntas Frequentes', href: '#faq' },
                  { label: 'Fale Conosco', href: '#contato' },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm sm:text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
              </nav>

              {/* Drawer Bottom Actions */}
              <div className="pt-5 border-t border-white/10 space-y-4">
                <a
                  href="https://wa.me/5544997453807?text=Olá! Gostaria de solicitar um orçamento com o Engenheiro Kaio."
                  onClick={() => setMenuOpen(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium-solid w-full text-center py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Chamar no WhatsApp</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <a 
                    href="https://www.instagram.com/kh.engenharia/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>@kh.engenharia</span>
                  </a>
                  <span>(44) 99745-3807</span>
                </div>

                <div className="text-[11px] text-slate-500 text-center">
                  CREA-PR nº PR-232385/D · Umuarama, PR
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-6" id="inicio">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">
            
            {/* Tag Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-300 mb-7"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Serviços de Engenharia Civil e Legalização</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white max-w-4xl leading-tight mb-6"
            >
              Formação sólida,{' '}
              <span className="font-semibold text-slate-200 block sm:inline">
                dedicação total
              </span>{' '}
              ao seu projeto
            </motion.h1>

            {/* Description Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10"
            >
              Liderada por <strong className="text-slate-200 font-medium">Engenheiro Civil</strong> com atendimento direto, humanizado, preço justo e emissão de ART para total segurança jurídica e técnica do seu patrimônio.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12"
              id="hero-buttons-container"
            >
              <a
                href="#solucoes"
                className="btn-premium-solid w-full sm:w-auto text-sm uppercase tracking-wider py-3.5 px-7 rounded-xl inline-flex items-center justify-center gap-2"
                id="hero-primary-cta"
              >
                <span>Descobrir Minha Solução</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/5544997453807?text=Olá! Gostaria de solicitar um orçamento com a KH Engenharia."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium-outline w-full sm:w-auto text-sm uppercase tracking-wider py-3.5 px-7 rounded-xl inline-flex items-center justify-center gap-2"
                id="hero-whatsapp-direct"
              >
                <span>Falar no WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Quick Trust Badges Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl pt-8 border-t border-white/10 text-left"
            >
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-300 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">CREA-PR</div>
                  <div className="text-[11px] text-slate-400">PR-232385/D</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-slate-300 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">Engenharia Civil</div>
                  <div className="text-[11px] text-slate-400">Habilitação Técnica</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-slate-300 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">ART Inclusa</div>
                  <div className="text-[11px] text-slate-400">Respaldo legal total</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-300 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-white">Umuarama e Região</div>
                  <div className="text-[11px] text-slate-400">Presencial + Digital</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Interactive Quick Solution Finder (Diagnóstico Intuitivo) */}
      <section className="py-20 px-6 bg-[#0a0a0e] border-t border-white/5 relative" id="solucoes">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              Guia Rápido e Intuitivo
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">
              Qual é a sua necessidade <span className="font-semibold text-slate-200">no momento</span>?
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Clique na opção mais adequada para ver como funciona, o que está incluído e acionar o atendimento de forma direta.
            </p>
          </div>

          {/* Interactive Navigation Pills / Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto mb-8">
            {NEED_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === selectedNeedId;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedNeedId(option.id)}
                  className={`p-4 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-white/[0.03] text-slate-300 border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-black' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-black/10 text-black' : 'bg-white/5 text-slate-400'
                    }`}>
                      {option.tag}
                    </span>
                  </div>
                  <div className={`text-sm font-semibold leading-snug ${isSelected ? 'text-black' : 'text-white'}`}>
                    {option.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Solution Panel */}
          <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-10 rounded-2xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              <div className="md:col-span-7 space-y-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1">
                    Visão Geral do Atendimento
                  </span>
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {activeNeed.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activeNeed.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    O que está incluído no serviço:
                  </h4>
                  <ul className="space-y-2.5">
                    {activeNeed.included.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between p-6 rounded-xl bg-white/[0.02] border border-white/5 space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Agilidade</span>
                    </div>
                    <p className="text-sm font-medium text-white">{activeNeed.estimatedTime}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Documentos úteis</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeNeed.documents}</p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/5544997453807?text=${encodeURIComponent(activeNeed.whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-premium-solid text-center py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2"
                >
                  <span>Iniciar Conversa no WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Services Section with Filter Tabs */}
      <section className="py-24 px-6 relative" id="servicos">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Serviços Especializados
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
                O que posso fazer por <span className="font-semibold text-slate-200">você e sua obra</span>
              </h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setServiceFilter('todos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'todos' 
                    ? 'bg-white text-black font-semibold' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Todos (6)
              </button>
              <button
                onClick={() => setServiceFilter('projetos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'projetos' 
                    ? 'bg-white text-black font-semibold' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Projetos
              </button>
              <button
                onClick={() => setServiceFilter('legalizacao')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'legalizacao' 
                    ? 'bg-white text-black font-semibold' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Legalização & Laudos
              </button>
              <button
                onClick={() => setServiceFilter('gestao')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  serviceFilter === 'gestao' 
                    ? 'bg-white text-black font-semibold' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Execução & Custos
              </button>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="glass-panel-interactive p-7 rounded-2xl flex flex-col justify-between group relative overflow-hidden"
                >
                  <span className="absolute top-4 right-5 text-5xl font-black text-white/[0.03] group-hover:text-white/[0.06] transition-colors select-none">
                    {service.id}
                  </span>

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 group-hover:bg-white/10 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                        {service.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                      {service.title}
                    </h3>
                    
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                      {service.summary}
                    </p>

                    <div className="pt-4 border-t border-white/5 space-y-2 mb-6">
                      {service.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/5544997453807?text=${encodeURIComponent(`Olá Engenheiro Kaio! Gostaria de tirar dúvidas sobre o serviço: ${service.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white pt-2 border-t border-white/5 group-hover:border-white/15 transition-colors"
                  >
                    <span>Solicitar este serviço</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* How It Works (Processo Transparente e Intuitivo) */}
      <section className="py-20 px-6 bg-[#0a0a0e] border-t border-white/5" id="processo">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              Transparência Total
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">
              Como funciona o <span className="font-semibold text-slate-200">nosso atendimento</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Do primeiro contato à entrega final com ART, cada etapa é pensada para ser ágil, segura e sem burocracias desnecessárias.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl glass-panel relative border border-white/5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Etapa 01</div>
              <h3 className="text-base font-semibold text-white mb-2">Primeiro Contato</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você nos conta sobre a sua obra ou necessidade. Realizamos uma triagem técnica preliminar sem custo algum.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel relative border border-white/5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Etapa 02</div>
              <h3 className="text-base font-semibold text-white mb-2">Proposta Clara</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enviamos orçamento formal detalhando exatamente os serviços prestados, prazos garantidos e preço justo sem surpresas.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel relative border border-white/5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Etapa 03</div>
              <h3 className="text-base font-semibold text-white mb-2">Desenvolvimento Técnico</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Elaboração rigorosa das plantas, laudos ou vistorias in loco conforme normas da ABNT e exigências do município.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-panel relative border border-white/5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Etapa 04</div>
              <h3 className="text-base font-semibold text-white mb-2">Entrega com ART</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emissão da Anotação de Responsabilidade Técnica (CREA-PR) e entrega de todos os arquivos prontos para prefeitura ou execução.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 border-t border-white/5" id="sobre">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                Trajetória & Credenciais
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-8">
                Sobre a <span className="font-semibold text-slate-200">KH Engenharia</span>
              </h2>
              
              <div className="space-y-6 text-slate-300 text-base sm:text-lg font-normal leading-relaxed">
                <p>
                  A <strong className="text-white font-medium">KH Engenharia</strong> é liderada por profissional formado em <strong className="text-white font-medium">Engenharia Civil</strong>, nascendo com o firme propósito de oferecer serviços de alta precisão técnica com um atendimento humanizado, próximo e integralmente honesto.
                </p>
                <p>
                  Nosso propósito é entregar projetos perfeitamente elaborados, com a máxima responsabilidade técnica, rigorosamente dentro do prazo estipulado e pautados por uma comunicação aberta e frequente. Acreditamos que cada detalhe importa, e isso se materializa no cuidado dedicado a cada traço de sua obra.
                </p>
                <p className="text-sm text-slate-400">
                  Deseja entender melhor o seu caso específico? Entre em contato agora para iniciarmos uma conversa sem nenhum compromisso.
                </p>
              </div>
            </div>

            {/* Right Column Cards */}
            <div className="lg:col-span-5 flex flex-col gap-4 w-full">
              
              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Base técnica aprofundada</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Formação sólida em Engenharia Civil, unindo teoria normativa atualizada com a prática real de projetos e obras.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">CREA-PR nº PR-232385/D</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Profissional plenamente registrado e habilitado para emissão imediata de ART (Anotação de Responsabilidade Técnica) e assinatura legal de laudos.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-white/5 flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Atendimento Híbrido</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Suporte presencial em Umuarama-PR e cidades vizinhas, além de consultorias e desenvolvimento de projetos digitais para qualquer região do país.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section (Dúvidas Frequentes) */}
      <section className="py-20 px-6 bg-[#0a0a0e] border-t border-white/5" id="faq">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-3">
              Perguntas <span className="font-semibold text-slate-200">Frequentes</span>
            </h2>
            <p className="text-sm text-slate-400">
              Respostas claras para as principais dúvidas de quem vai construir ou legalizar.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl glass-panel border border-white/5 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Contact Section & Form (Fale Conosco) */}
      <section className="py-24 px-6 border-t border-white/5 relative" id="contato">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Contact Information Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Canais de Atendimento
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-4">
                  Fale Conosco
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Respondemos de forma rápida e atenciosa. Escolha o canal de sua preferência ou use o formulário rápido para gerar a sua solicitação direta no WhatsApp.
                </p>

                {/* Direct Contact Cards */}
                <div className="space-y-3.5" id="contact-info-list">
                  
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/5544997453807?text=Olá! Gostaria de falar com o Engenheiro Kaio."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">WhatsApp Direto</span>
                      <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">(44) 99745-3807</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/kh.engenharia/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Instagram</span>
                      <span className="text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">@kh.engenharia</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:khengenharia@gmail.com"
                    className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-white/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">E-mail</span>
                      <span className="text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">khengenharia@gmail.com</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </a>

                  {/* Location */}
                  <div className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Localização</span>
                      <span className="text-sm font-semibold text-white">Umuarama, PR — Atendimento Presencial e Digital</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <form
                className="glass-panel p-7 md:p-9 rounded-2xl border border-white/10 flex flex-col gap-5"
                onSubmit={handleFormSubmit}
                id="contact-whatsapp-form"
              >
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Solicitar Orçamento Personalizado</h3>
                  <p className="text-xs text-slate-400">
                    Preencha as informações para iniciar a conversa já com os dados do seu projeto estruturados.
                  </p>
                </div>

                {/* Quick Service Selection Chips */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Tipo de Serviço
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {serviceOptions.map((srv) => (
                      <button
                        type="button"
                        key={srv}
                        onClick={() => handleSelectService(srv)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                          formData.servico === srv
                            ? 'bg-white text-black border-white font-semibold'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="nome">
                      Seu Nome *
                    </label>
                    <input
                      className="input-premium py-3 px-4 text-sm"
                      type="text"
                      id="nome"
                      name="nome"
                      placeholder="Ex: João da Silva"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="telefone">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      className="input-premium py-3 px-4 text-sm"
                      type="tel"
                      id="telefone"
                      name="telefone"
                      placeholder="Ex: (44) 99999-9999"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="email">
                    E-mail <span className="text-[10px] text-slate-500 font-normal">(Opcional)</span>
                  </label>
                  <input
                    className="input-premium py-3 px-4 text-sm"
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Ex: joao@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="mensagem">
                    Descreva seu projeto ou dúvida *
                  </label>
                  <textarea
                    className="input-premium py-3 px-4 text-sm min-h-[100px] resize-y"
                    id="mensagem"
                    name="mensagem"
                    placeholder="Ex: Preciso averbar uma ampliação de 60m² em Umuarama / Preciso de projeto arquitetônico..."
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-premium-solid w-full py-3.5 rounded-xl font-semibold uppercase text-xs tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Enviar Solicitação via WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5 bg-[#070709]" id="footer-section">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center">
            <img 
              src="https://i.postimg.cc/QxcpQ4PS/Sem-titulo-removebg-preview.png" 
              alt="KH Engenharia" 
              className="h-9 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" 
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-xs text-slate-400 leading-relaxed text-center md:text-right">
            <div>KH Engenharia · Umuarama, PR · CREA-PR nº PR-232385/D</div>
            <div className="text-slate-500 mt-1">Engenharia Civil e Regularização de Imóveis. Todos os direitos reservados.</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
