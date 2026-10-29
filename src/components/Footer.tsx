import React, { useState } from 'react';
import { STORE_CONFIG } from '../data/siteData';

interface FooterProps {
  onNavigate?: (route: string) => void;
  onOpenCart?: () => void;
}

export const Footer = React.memo(function Footer({ onNavigate, onOpenCart }: FooterProps) {
  const [newsletterContact, setNewsletterContact] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterContact.trim()) return;
    setSubscribed(true);
    setNewsletterContact('');
  };

  return (
    <footer className="footer numana-footer">
      <div className="numana-footer-main">
        {/* Coluna 1: Newsletter / Novidades VIP (estilo Numana) */}
        <div className="numana-footer-col numana-footer-col--newsletter">
          <h3 className="numana-footer-heading">RECEBA NOSSAS NOVIDADES E DESCONTOS</h3>
          <form className="numana-newsletter-form" onSubmit={handleNewsletterSubmit}>
            <label htmlFor="bemie-newsletter-input" className="sr-only">
              Seu e-mail ou WhatsApp
            </label>
            <input
              id="bemie-newsletter-input"
              type="text"
              placeholder="E-mail ou WhatsApp"
              value={newsletterContact}
              onChange={(e) => {
                setNewsletterContact(e.target.value);
                if (subscribed) setSubscribed(false);
              }}
              className="numana-newsletter-input"
            />
            <button
              type="submit"
              className="numana-newsletter-submit"
              aria-label="Inscrever-se para novidades Bemiê"
            >
              →
            </button>
          </form>
          {subscribed && (
            <p className="numana-newsletter-feedback" role="status">
              Cadastro recebido! Você receberá novidades exclusivas da Bemiê.
            </p>
          )}
        </div>

        {/* Coluna 2: Contato & Atendimento */}
        <div className="numana-footer-col">
          <h3 className="numana-footer-heading">CONTATO</h3>
          <ul className="numana-footer-list">
            <li>
              <a
                href={`https://wa.me/${STORE_CONFIG.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {STORE_CONFIG.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={STORE_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {STORE_CONFIG.handle}
              </a>
            </li>
            <li>Envios para todo o Brasil ({STORE_CONFIG.previsaoEntrega})</li>
            <li>Pagamento via Pix, Crédito ou Débito</li>
          </ul>
          <div className="numana-footer-socials">
            <a
              href={STORE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Bemiê Moda Praia"
              className="numana-social-link"
            >
              <i className="ri-instagram-line" />
            </a>
            <a
              href={`https://wa.me/${STORE_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Bemiê Moda Praia"
              className="numana-social-link"
            >
              <i className="ri-whatsapp-line" />
            </a>
          </div>
        </div>
      </div>

      <div className="numana-footer-bottom">
        <div className="numana-footer-brand-row">
          <img
            src="/assets/bemie-letters.png"
            alt="Bemiê Moda Praia"
            className="numana-footer-mini-logo"
          />
          <div>
            <p className="numana-copyright-title">
              Copyright {new Date().getFullYear()} - Bemiê Moda Praia
            </p>
            <p className="numana-copyright-sub">Todos os direitos reservados.</p>
          </div>
        </div>
        <div className="numana-footer-legal">
          <p>
            Atendimento oficial via WhatsApp {STORE_CONFIG.whatsappDisplay} · Entrega garantida em{' '}
            {STORE_CONFIG.previsaoEntrega}
          </p>
          <p className="mt-2 text-[11px] text-[#A8A29E]">
            <button
              type="button"
              onClick={() => onNavigate?.('admin')}
              className="hover:text-[#1C1917] transition-colors underline cursor-pointer"
            >
              Área de Gestão / Painel Admin
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
});
