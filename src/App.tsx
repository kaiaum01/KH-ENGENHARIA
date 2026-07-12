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
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    mensagem: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Construct the WhatsApp message preserving original formatting and details
    let message = 'Mensagem KH Engenharia:\n\n';
    message += `Nome: ${formData.nome}\n`;
    message += `Telefone: ${formData.telefone}\n`;
    if (formData.email) {
      message += `E-mail: ${formData.email}\n`;
    }
    message += `Projeto/Dúvida: ${formData.mensagem}\n`;

    const whatsappUrl = `https://wa.me/5544997453807?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 selection:bg-white selection:text-black relative overflow-hidden">
      
      {/* Decorative Orbs */}
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      {/* Navbar Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'py-4 bg-[#070709]/90 backdrop-blur-md border-b border-white/10 shadow-lg'
            : 'py-6 bg-transparent'
        }`}
        id="navbar-header"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex items-center group" id="logo-link">
            <img 
              src="https://i.postimg.cc/QxcpQ4PS/Sem-titulo-removebg-preview.png" 
              alt="KH Engenharia" 
              className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 group-hover:opacity-90" 
              referrerPolicy="no-referrer"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" id="desktop-nav">
            <a href="#servicos" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Serviços
            </a>
            <a href="#sobre" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sobre
            </a>
            <a href="#contato" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Contato
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-4" id="header-actions">
            <a
              href="https://www.instagram.com/kh.engenharia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
              aria-label="Instagram"
              id="instagram-nav-link"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/5544997453807?text=Olá! Gostaria de solicitar um orçamento."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium-solid text-xs uppercase tracking-widest py-2.5 px-5 rounded-lg inline-flex items-center gap-2"
              id="cta-nav-link"
            >
              <span>Solicitar orçamento</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Hamburger Mobile Trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-2"
            aria-label="Toggle Menu"
            id="mobile-menu-trigger"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[72px] bg-[#070709]/98 z-30 flex flex-col p-6 border-t border-white/5"
            id="mobile-nav-menu"
          >
            <div className="flex flex-col gap-6 mt-8">
              <a
                href="#servicos"
                onClick={() => setMenuOpen(false)}
                className="text-xl font-medium text-slate-300 hover:text-white py-2 border-b border-white/5"
              >
                Serviços
              </a>
              <a
                href="#sobre"
                onClick={() => setMenuOpen(false)}
                className="text-xl font-medium text-slate-300 hover:text-white py-2 border-b border-white/5"
              >
                Sobre
              </a>
              <a
                href="#contato"
                onClick={() => setMenuOpen(false)}
                className="text-xl font-medium text-slate-300 hover:text-white py-2 border-b border-white/5"
              >
                Contato
              </a>
            </div>

            <div className="mt-auto flex flex-col gap-4 pb-8">
              <a
                href="https://wa.me/5544997453807?text=Olá! Gostaria de solicitar um orçamento."
                onClick={() => setMenuOpen(false)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium-solid w-full text-center py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <span>Solicitar orçamento</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              
              <div className="flex justify-center gap-6 mt-4">
                <a
                  href="https://www.instagram.com/kh.engenharia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-2 text-sm"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6" id="inicio">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">
            
            {/* Tag Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest text-slate-300 mb-8"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Serviços de Engenharia Civil e Legalização</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white max-w-4xl leading-tight sm:leading-none mb-8"
            >
              Formação sólida,{' '}
              <span className="font-semibold text-slate-300 block sm:inline">
                dedicação total
              </span>{' '}
              ao seu projeto
            </motion.h1>

            {/* Description Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-12"
            >
              Engenheiro Civil com base técnica atualizada e comprometimento real com cada cliente. 
              Atendimento próximo, preço justo e responsabilidade técnica do início ao fim.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
              id="hero-buttons-container"
            >
              <a
                href="https://wa.me/5544997453807?text=Olá! Solicitando orçamento da KH Engenharia."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium-solid w-full sm:w-auto text-sm uppercase tracking-wider py-4 px-8 rounded-xl inline-flex items-center justify-center gap-2"
                id="hero-primary-cta"
              >
                <span>Solicitar orçamento</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#servicos"
                className="btn-premium-outline w-full sm:w-auto text-sm uppercase tracking-wider py-4 px-8 rounded-xl inline-flex items-center justify-center gap-2"
                id="hero-secondary-cta"
              >
                <span>Ver Serviços</span>
              </a>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Core Values Section (Diferenciais - Bento Grid Style) */}
      <section className="py-20 px-6 border-t border-white/5 bg-[#0a0a0d]" id="valores">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-3">
              Diferenciais
            </span>
            <h2 className="text-3xl font-light tracking-tight text-white">
              Por que escolher a <span className="font-semibold text-slate-300">KH Engenharia</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Value 1 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Formação atual</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Conhecimento técnico atualizado, com as normas e metodologias mais recentes do mercado de engenharia civil.
                </p>
              </div>
              <div className="mt-8 text-[11px] text-slate-500 uppercase tracking-widest">Inovação</div>
            </div>

            {/* Value 2 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Dedicação individual</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Cada projeto recebe atenção integral e individualizada. Você conversa diretamente com o engenheiro, sem intermediários.
                </p>
              </div>
              <div className="mt-8 text-[11px] text-slate-500 uppercase tracking-widest">Exclusividade</div>
            </div>

            {/* Value 3 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Preço acessível</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Serviço de alta qualidade sem as taxas pesadas dos grandes escritórios. Ideal para quem busca custo-benefício inteligente.
                </p>
              </div>
              <div className="mt-8 text-[11px] text-slate-500 uppercase tracking-widest">Economia</div>
            </div>

            {/* Value 4 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Responsabilidade</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Todos os projetos contam com a devida ART emitida. Engenheiro registrado formalmente no CREA-PR sob o nº PR-232385/D.
                </p>
              </div>
              <div className="mt-8 text-[11px] text-slate-500 uppercase tracking-widest">Segurança</div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6 relative" id="servicos">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-3">
              Serviços Especializados
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-4">
              O que posso fazer por <span className="font-semibold text-slate-300">você e sua obra</span>
            </h2>
            <div className="w-12 h-[1px] bg-white/20 mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 01 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between relative overflow-hidden group">
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">
                01
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Projetos Arquitetônicos</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Dimensionamento e detalhamento técnico completo de plantas, cortes, fachadas, elevações e respectivo memorial descritivo para aprovação sem transtornos na prefeitura.
                </p>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-300"></div>
            </div>

            {/* Card 02 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between relative overflow-hidden group">
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">
                02
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Laudos Técnicos</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Vistorias criteriosas e emissão de laudos de patologia ou estabilidade, amparados rigorosamente nas normas ABNT aplicáveis, garantindo plena responsabilidade técnica e jurídica.
                </p>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-300"></div>
            </div>

            {/* Card 03 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between relative overflow-hidden group">
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">
                03
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6">
                  <HardHat className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Acompanhamento de Obra</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Vistorias de acompanhamento preventivas, garantia de aplicação das boas práticas construtivas, controle de qualidade rigoroso e conformidade absoluta com os projetos em andamento.
                </p>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-300"></div>
            </div>

            {/* Card 04 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between relative overflow-hidden group">
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">
                04
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Projetos Complementares</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Elaboração sob medida de projetos complementares fundamentais: elétrico de baixa tensão, hidrossanitário eficiente, dimensionamento de SPDA e medidas de segurança e prevenção de incêndios.
                </p>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-300"></div>
            </div>

            {/* Card 05 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between relative overflow-hidden group">
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">
                05
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Regularização de Imóveis</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Resolução de pendências técnicas e burocráticas para averbação, obtenção de habite-se de construções residenciais e comerciais junto à Prefeitura e emissão de certidões.
                </p>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-300"></div>
            </div>

            {/* Card 06 */}
            <div className="glass-panel p-8 rounded-2xl border border-white/5 card-hover-effect flex flex-col justify-between relative overflow-hidden group">
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-white/[0.02] group-hover:text-white/[0.04] transition-colors select-none">
                06
              </span>
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Orçamentos e Planilhas</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Desenvolvimento preciso de planilhas orçamentárias detalhadas (materiais e mão de obra) para obras e reformas de médio e pequeno porte, garantindo previsibilidade de investimentos.
                </p>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/30 transition-all duration-300"></div>
            </div>

          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#0a0a0d]" id="sobre">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                Trajetória & Credenciais
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-8">
                Sobre a <span className="font-semibold text-slate-300">KH Engenharia</span>
              </h2>
              
              <div className="space-y-6 text-slate-400 text-base sm:text-lg font-normal leading-relaxed">
                <p>
                  A <strong className="text-white font-medium">KH Engenharia</strong> é liderada por profissional formado em <strong className="text-white font-medium">Tecnologia em Construção Civil</strong> e <strong className="text-white font-medium">Engenharia Civil</strong>, nascendo com o firme propósito de oferecer serviços de alta precisão técnica com um atendimento humanizado, próximo e integralmente honesto.
                </p>
                <p>
                  Nosso propósito é entregar projetos perfeitamente elaborados, com a máxima responsabilidade técnica, rigorosamente dentro do prazo estipulado e pautados por uma comunicação aberta e frequente. Acreditamos que cada detalhe importa, e isso se materializa no cuidado dedicado a cada traço de sua obra.
                </p>
                <p className="text-base text-slate-500">
                  Deseja entender melhor o seu caso específico? Entre em contato agora para iniciarmos uma conversa sem nenhum compromisso.
                </p>
              </div>
            </div>

            {/* Right List Column */}
            <div className="lg:col-span-5 flex flex-col gap-6 w-full">
              
              {/* Card Tag 1 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4 group hover:border-slate-400/20 transition-colors duration-300">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1.5">Base técnica aprofundada</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Formação especializada em Engenharia e Tecnologia da Construção Civil, garantindo domínio técnico atualizado em normativas e conhecimentos práticos de obras residenciais e comerciais.
                  </p>
                </div>
              </div>

              {/* Card Tag 2 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4 group hover:border-slate-400/20 transition-colors duration-300">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1.5">CREA-PR nº PR-232385/D</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Profissional plenamente registrado, certificado e habilitado perante o conselho para emissão imediata de ART (Anotação de Responsabilidade Técnica) e assinatura legal de laudos e projetos.
                  </p>
                </div>
              </div>

              {/* Card Tag 3 */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4 group hover:border-slate-400/20 transition-colors duration-300">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1.5">Atendimento Híbrido</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Atuação e suporte presencial focado na cidade de Umuarama, PR e toda região metropolitana, além de suporte e consultorias técnicas totalmente digitais para todo o Brasil.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Highlights CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#070709]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 glass-panel p-10 md:p-16 rounded-3xl border border-white/10">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-4">
            Pronto para começar seu projeto?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-10">
            Entre em contato descrevendo detalhadamente sua necessidade. Nós realizamos uma análise técnica preliminar gratuita e oferecemos um orçamento transparente e justo, sem letras miúdas.
          </p>
          <a
            href="https://wa.me/5544997453807?text=Olá! Gostaria de pedir um orçamento."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-premium-solid inline-flex items-center gap-2 py-4 px-8 rounded-xl text-sm uppercase tracking-wider"
            id="mid-cta-button"
          >
            <span>Pedir orçamento gratuito</span>
            <Phone className="w-4 h-4 fill-black text-transparent" />
          </a>
        </div>
      </section>

      {/* Contact Section & Form */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#0a0a0d]" id="contato">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Contact Information Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-3">
                  Canais de Atendimento
                </span>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-6">
                  Fale Conosco
                </h2>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-12">
                  Retorno as mensagens de forma extremamente ágil. Envie sua mensagem pelo formulário, 
                  ou se preferir, sinta-se à vontade para nos acionar diretamente por WhatsApp ou e-mail.
                </p>

                {/* Info List */}
                <div className="space-y-5" id="contact-info-list">
                  
                  {/* Whatsapp */}
                  <a
                    href="https://wa.me/5544997453807"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-slate-400/20 transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#25D366] group-hover:bg-white/10 transition-colors">
                      <Phone className="w-5 h-5 fill-[#25D366] text-transparent" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">WhatsApp</span>
                      <span className="text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">(44) 99745-3807</span>
                    </div>
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/kh.engenharia/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-slate-400/20 transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">Instagram</span>
                      <span className="text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">@kh.engenharia</span>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:khengenharia@gmail.com"
                    className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-slate-400/20 transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">E-mail corporativo</span>
                      <span className="text-sm font-semibold text-white group-hover:text-slate-300 transition-colors">khengenharia@gmail.com</span>
                    </div>
                  </a>

                  {/* Location */}
                  <div className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">Localização física</span>
                      <span className="text-sm font-semibold text-white">Umuarama, PR — Brasil</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <form
                className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 flex flex-col gap-6"
                onSubmit={handleFormSubmit}
                id="contact-whatsapp-form"
              >
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1.5">Enviar Proposta de Projeto</h3>
                  <p className="text-xs text-slate-400">
                    Preencha os dados e compile as informações para abrir o canal WhatsApp imediatamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="nome">
                      Seu Nome
                    </label>
                    <input
                      className="input-premium py-3.5 px-4"
                      type="text"
                      id="nome"
                      name="nome"
                      placeholder="Ex: João da Silva"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="telefone">
                      Telefone
                    </label>
                    <input
                      className="input-premium py-3.5 px-4"
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

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="email">
                    E-mail <span className="text-[10px] text-slate-500 font-normal">(Opcional)</span>
                  </label>
                  <input
                    className="input-premium py-3.5 px-4"
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Ex: joao@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="mensagem">
                    Descreva seu projeto ou dúvida
                  </label>
                  <textarea
                    className="input-premium py-3.5 px-4 min-h-[120px] resize-y"
                    id="mensagem"
                    name="mensagem"
                    placeholder="Quero regularizar um imóvel, fazer projeto complementar, etc..."
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-premium-solid w-full py-4 rounded-xl font-bold uppercase text-xs tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Enviar Mensagem</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-[#070709]" id="footer-section">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center">
            <img 
              src="https://i.postimg.cc/QxcpQ4PS/Sem-titulo-removebg-preview.png" 
              alt="KH Engenharia" 
              className="h-9 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity duration-300" 
              referrerPolicy="no-referrer"
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed max-w-md">
            © 2026 · Umuarama, PR · CREA-PR nº PR-232385/D · Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
