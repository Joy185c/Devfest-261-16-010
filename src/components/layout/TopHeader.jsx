import React from 'react';
import { Menu } from 'lucide-react';
import './TopHeader.css';

export default function TopHeader({ tenderId, lang, setLang, toggleMobileMenu }) {
  return (
    <header className="top-header">
      <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
        <Menu size={20} />
      </button>
      <div className="header-center">
        {tenderId ? <span className="tender-id-badge">Tender: {tenderId}</span> : <span></span>}
      </div>
      <div className="header-right">
        <div className="lang-switcher-sm">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          <span>|</span>
          <button className={lang === 'bn' ? 'active' : ''} onClick={() => setLang('bn')}>বাংলা</button>
        </div>
      </div>
    </header>
  );
}
