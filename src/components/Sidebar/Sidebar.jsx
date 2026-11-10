import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaMapMarkedAlt, FaBookOpen, FaKey, FaShieldAlt, FaJournalWhills, FaCog, FaIdCard, FaBars, FaTimes } from 'react-icons/fa';
import { LuSwords } from "react-icons/lu";
import './Sidebar.css';

export default function Sidebar({ isMestre, onOpenLogin, onLogout, onOpenSettings }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Fecha a sidebar ao clicar em algum link no mobile
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Botão Hambúrguer flutuante para abrir o menu no celular */}
      <button 
        type="button" 
        className="mobile-menu-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir Menu"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay escuro de fundo no mobile quando a sidebar estiver aberta */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>Aetheria</h2>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            onClick={handleLinkClick}
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <FaMapMarkedAlt /> <span>Mapa Mundi</span>
          </Link>
          <Link
            to="/cronicas"
            onClick={handleLinkClick}
            className={`sidebar-link ${location.pathname === '/cronicas' ? 'active' : ''}`}
          >
            <FaBookOpen /> <span>Crônicas</span>
          </Link>
          <Link
            to="/journal"
            onClick={handleLinkClick}
            className={`sidebar-link ${location.pathname === '/journal' ? 'active' : ''}`}
          >
            <FaJournalWhills /> <span>Journal</span>
          </Link>
          <Link
            to="/combate"
            onClick={handleLinkClick}
            className={`sidebar-link ${location.pathname === '/combate' ? 'active' : ''}`}
          >
            <LuSwords /> <span>Conflito & Relógios</span>
          </Link>
          {isMestre ? (
            <Link
              to="/mestre/fichas"
              onClick={handleLinkClick}
              className={`sidebar-link ${location.pathname === '/mestre/fichas' ? 'active' : ''}`}
            >
              <FaShieldAlt /> <span>Gerenciar Fichas</span>
            </Link>
          ) : (
            <Link
              to="/ficha"
              onClick={handleLinkClick}
              className={`sidebar-link ${location.pathname === '/ficha' ? 'active' : ''}`}
            >
              <FaIdCard /> <span>Minha Ficha</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-config-sidebar"
            onClick={() => { onOpenSettings(); setIsOpen(false); }}
            title="Configurações de Áudio e Sistema"
          >
            <FaCog /> <span>Configurações</span>
          </button>
          {isMestre ? (
            <div className="mestre-badge-container" onClick={() => { onLogout(); setIsOpen(false); }} title="Clique para sair do Modo Mestre">
              <FaShieldAlt className="icon-mestre" />
              <span className="mestre-text">Modo Mestre Ativo</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn-login-mestre"
              onClick={() => { onOpenLogin(); setIsOpen(false); }}
              title="Acesso restrito ao Mestre"
            >
              <FaKey /> <span>Entrar como Mestre</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}