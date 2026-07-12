/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const inputs = form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], textarea') as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
    let mensagem = 'Mensagem KH Engenharia:\n\n';
    
    inputs.forEach(input => {
      if (input.value.trim() && input.type !== 'hidden') {
        mensagem += `${input.placeholder}: ${input.value}\n`;
      }
    });

    const whatsappUrl = `https://wa.me/5544997453807?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="site">
      <nav className="nav" style={{ background: scrolled ? 'rgba(15,15,15,0.98)' : 'rgba(15,15,15,0.95)' }}>
        <a href="#" className="logo-wrap">
          <div className="logo-text">KH <span>Engenharia</span></div>
        </a>
        <div className="nav-links">
          <a href="#servicos">Serviços</a>
          <a href="#sobre">Sobre</a>
          <a href="#contato">Contato</a>
        </div>
        <div className="nav-right">
          <a href="https://www.instagram.com/kh.engenharia/" target="_blank" rel="noopener noreferrer" className="nav-social" aria-label="Instagram">
            <i className="ti ti-brand-instagram"></i>
          </a>
          <a href="https://wa.me/5544997453807?text=Olá! Gostaria de solicitar um orçamento." className="nav-cta">
            Solicitar orçamento
          </a>
        </div>
      </nav>

      <section className="hero">
        <img src="https://i.ibb.co/32Q6BVL/KH-Engenharia01.png" alt="KH Engenharia" className="hero-image" />
        <h1>Formação sólida, <em>dedicação total</em> ao seu projeto</h1>
        <p>Engenheiro Civil, com base técnica atualizada e comprometimento real com cada cliente. Atendimento próximo, preço justo e responsabilidade do início ao fim.</p>
        <div className="hero-btns">
          <a href="https://wa.me/5544997453807?text=Olá! Solicitando orçamento da KH Engenharia." className="btn-primary">Solicitar orçamento</a>
        </div>
      </section>

      <div className="valor" id="valores">
        <div className="valor-item">
          <div className="valor-icon"><i className="ti ti-certificate"></i></div>
          <div className="valor-title">Formação atual</div>
          <div className="valor-desc">Conhecimento técnico atualizado, com as normas e metodologias mais recentes do mercado.</div>
        </div>
        <div className="valor-item">
          <div className="valor-icon"><i className="ti ti-user"></i></div>
          <div className="valor-title">Dedicação individual</div>
          <div className="valor-desc">Cada projeto recebe atenção total. Você fala direto com o engenheiro, sem intermediários.</div>
        </div>
        <div className="valor-item">
          <div className="valor-icon"><i className="ti ti-pig-money"></i></div>
          <div className="valor-title">Preço acessível</div>
          <div className="valor-desc">Serviço de qualidade sem a taxa de grandes escritórios. Ideal para quem precisa de resultado com custo justo.</div>
        </div>
        <div className="valor-item">
          <div className="valor-icon"><i className="ti ti-shield-check"></i></div>
          <div className="valor-title">Responsabilidade técnica</div>
          <div className="valor-desc">Projetos com ART emitida. Engenheiro registrado no CREA-PR sob nº PR-232385/D.</div>
        </div>
      </div>

      <section className="section" id="servicos">
        <div className="section-eyebrow">Serviços</div>
        <div className="section-title">O que posso fazer por você</div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-num">01</div>
            <div className="service-line"></div>
            <h3>Projetos Arquitetônicos</h3>
            <p>Dimensionamento e detalhamento de plantas, cortes, elevações e memorial para devida aprovação na prefeitura.</p>
          </div>
          <div className="service-card">
            <div className="service-num">02</div>
            <div className="service-line"></div>
            <h3>Laudos Técnicos</h3>
            <p>Emissão de laudos e pareceres técnicos fundamentados nas normas ABNT vigentes, com responsabilidade legal.</p>
          </div>
          <div className="service-card">
            <div className="service-num">03</div>
            <div className="service-line"></div>
            <h3>Acompanhamento de Obra</h3>
            <p>Visitas técnicas periódicas, controle de qualidade e conformidade com o projeto durante a execução.</p>
          </div>
          <div className="service-card">
            <div className="service-num">04</div>
            <div className="service-line"></div>
            <h3>Projetos Complementares</h3>
            <p>Elaboração e dimensionamento de projetos elétricos, hidrossanitários, de SPDA e prevenção a incêndio, garantindo segurança e aprovação nos órgãos competentes.</p>
          </div>
          <div className="service-card">
            <div className="service-num">05</div>
            <div className="service-line"></div>
            <h3>Regularização de Imóveis</h3>
            <p>Apoio técnico para regularização, habite-se e documentação junto à prefeitura e ao CREA.</p>
          </div>
          <div className="service-card">
            <div className="service-num">06</div>
            <div className="service-line"></div>
            <h3>Orçamentos e Planilhas</h3>
            <p>Elaboração de orçamentos detalhados e planilhas de custo para obras e reformas de pequeno e médio porte.</p>
          </div>
        </div>
      </section>

      <div className="sobre" id="sobre">
        <div className="sobre-left">
          <h2>Sobre a KH Engenharia</h2>
          <p>A KH Engenharia nasceu com o propósito de oferecer serviços técnicos de qualidade com atendimento próximo e honesto.</p>
          <p>Nossa proposta é simples: entregar projetos corretos, dentro do prazo e com comunicação transparente. Cada cliente importa — e isso se reflete no cuidado com cada detalhe do seu projeto.</p>
          <p>Quer saber mais? Entre em contato para uma conversa sem compromisso.</p>
        </div>
        <div className="sobre-right">
          <div className="sobre-tag">
            <i className="ti ti-school"></i>
            <div className="sobre-tag-text">
              <h4>Base técnica</h4>
              <p>Formação em Engenharia e Tecnologia da Construção Civil, com base sólida em projetos e conhecimentos gerais de obras e serviços.</p>
            </div>
          </div>
          <div className="sobre-tag">
            <i className="ti ti-file-certificate"></i>
            <div className="sobre-tag-text">
              <h4>CREA-PR nº PR-232385/D</h4>
              <p>Habilitado para emitir ART e assinar projetos e laudos técnicos com responsabilidade legal.</p>
            </div>
          </div>
          <div className="sobre-tag">
            <i className="ti ti-map-pin"></i>
            <div className="sobre-tag-text">
              <h4>Atendimento presencial e remoto</h4>
              <p>Atendimento em Umuarama, PR. Atende presencialmente na região e à distância em todo o Brasil.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="destaque">
        <h2>Pronto para começar seu projeto?</h2>
        <p>Entre em contato descrevendo sua necessidade. Fazemos uma análise inicial gratuita e apresentamos uma proposta clara e sem surpresas.</p>
        <a href="https://wa.me/5544997453807?text=Olá! Gostaria de pedir um orçamento." className="btn-primary">Pedir orçamento gratuito</a>
      </div>

      <div className="contact-section" id="contato">
        <div className="contact-left">
          <h2>Fale com a KH</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
            Respondo rápido. Pode mandar mensagem pelo WhatsApp, Instagram ou preencher o formulário ao lado.
          </p>
          <div className="contact-items">
            <div className="contact-item">
              <i className="ti ti-brand-whatsapp"></i>
              <a href="https://wa.me/5544997453807">(44) 99745-3807</a>
            </div>
            <div className="contact-item">
              <i className="ti ti-brand-instagram"></i>
              <a href="https://www.instagram.com/kh.engenharia/" target="_blank" rel="noopener noreferrer">@kh.engenharia</a>
            </div>
            <div className="contact-item">
              <i className="ti ti-mail"></i>
              <a href="mailto:khengenharia@gmail.com">khengenharia@gmail.com</a>
            </div>
            <div className="contact-item">
              <i className="ti ti-map-pin"></i>
              Umuarama, PR — Brasil
            </div>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleFormSubmit}>
          <div className="form-row">
            <input className="form-input" name="text" type="hidden" value="Mensagem KH Engenharia:" />
            <input className="form-input" type="text" placeholder="Seu nome" required />
            <input className="form-input" type="tel" placeholder="Telefone" required />
          </div>
          <input className="form-input" type="email" placeholder="E-mail" />
          <textarea className="form-input" placeholder="Descreva seu projeto ou dúvida..." required></textarea>
          <button type="submit" className="form-submit">Enviar mensagem</button>
        </form>
      </div>

      <footer className="footer">
        <div className="footer-logo">KH ENGENHARIA</div>
        <div className="footer-text">© 2025 · Umuarama, PR · CREA-PR nº PR-232385/D · Todos os direitos reservados</div>
      </footer>
    </div>
  );
}
