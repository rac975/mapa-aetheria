import { Link, useLocation } from 'react-router-dom';
import { FaMapMarkedAlt, FaBookOpen, FaShieldAlt, FaJournalWhills, FaIdCard, FaCog, FaKey, FaStore } from 'react-icons/fa';
import { LuSwords } from "react-icons/lu";
import './Sidebar.css';

export default function Sidebar({ isMestre, onOpenLogin, onLogout, onOpenSettings }) {
  const location = useLocation();

  // Função auxiliar para verificar se o link está ativo
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      {/* 1. SIDEBAR TRADICIONAL (Visível apenas no Desktop via CSS) */}
      <aside className="sidebar desktop-only">
        <div className="sidebar-logo">
          <h2>Aetheria</h2>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${isActive('/')}`}>
            <FaMapMarkedAlt /> <span>Mapa Mundi</span>
          </Link>
          <Link to="/cronicas" className={`sidebar-link ${isActive('/cronicas')}`}>
            <FaBookOpen /> <span>Crônicas</span>
          </Link>
          <Link to="/journal" className={`sidebar-link ${isActive('/journal')}`}>
            <FaJournalWhills /> <span>Journal</span>
          </Link>
          <Link to="/combate" className={`sidebar-link ${isActive('/combate')}`}>
            <LuSwords /> <span>Conflito & Relógios</span>
          </Link>
          {isMestre ? (
            <Link to="/mestre/fichas" className={`sidebar-link ${isActive('/mestre/fichas')}`}>
              <FaShieldAlt /> <span>Gerenciar Fichas</span>
            </Link>
          ) : (
            <Link to="/ficha" className={`sidebar-link ${isActive('/ficha')}`}>
              <FaIdCard /> <span>Minha Ficha</span>
            </Link>
          )}
          <Link to="/loja" className={`sidebar-link ${isActive('/loja')}`}>
            <FaStore /> <span>Loja</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="btn-config-sidebar" onClick={onOpenSettings} title="Configurações">
            <FaCog /> <span>Configurações</span>
          </button>
          {isMestre ? (
            <div className="mestre-badge-container" onClick={onLogout} title="Sair do Modo Mestre">
              <FaShieldAlt className="icon-mestre" />
              <span className="mestre-text">Modo Mestre Ativo</span>
            </div>
          ) : (
            <button type="button" className="btn-login-mestre" onClick={onOpenLogin} title="Entrar como Mestre">
              <FaKey /> <span>Entrar como Mestre</span>
            </button>
          )}
        </div>
      </aside>

      {/* 2. BOTTOM NAVIGATION BAR (Visível apenas no Mobile via CSS) */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`bottom-nav-item ${isActive('/')}`}>
          <FaMapMarkedAlt />
          <span>Mapa</span>
        </Link>
        <Link to="/cronicas" className={`bottom-nav-item ${isActive('/cronicas')}`}>
          <FaBookOpen />
          <span>Crônicas</span>
        </Link>
        <Link to="/combate" className={`bottom-nav-item ${isActive('/combate')}`}>
          <LuSwords />
          <span>Conflito</span>
        </Link>
        <Link to={isMestre ? "/mestre/fichas" : "/ficha"} className={`bottom-nav-item ${isActive(isMestre ? "/mestre/fichas" : "/ficha")}`}>
          {isMestre ? <FaShieldAlt /> : <FaIdCard />}
          <span>{isMestre ? "Gerenciar" : "Ficha"}</span>
        </Link>
        <Link to="/loja" className={`bottom-nav-item ${isActive('/loja')}`}>
          <FaStore /> <span>Loja</span>
        </Link>
        {/* Botão extra para abrir as opções/configurações ou menu rápido se precisar */}
        <button type="button" className="bottom-nav-item" onClick={onOpenSettings}>
          <FaCog />
          <span>Ajustes</span>
        </button>
      </nav>
    </>
  );
}