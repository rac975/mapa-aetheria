import { Link, useLocation } from 'react-router-dom';
import { FaMapMarkedAlt, FaBookOpen, FaKey, FaShieldAlt, FaJournalWhills, FaCog, FaIdCard } from 'react-icons/fa';
import { LuSwords } from "react-icons/lu";
import './Sidebar.css';

export default function Sidebar({ isMestre, onOpenLogin, onLogout, onOpenSettings }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Aetheria</h2>
      </div>

      <nav className="sidebar-nav">
        <Link
          to="/"
          className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <FaMapMarkedAlt /> <span>Mapa Mundi</span>
        </Link>
        <Link
          to="/cronicas"
          className={`sidebar-link ${location.pathname === '/cronicas' ? 'active' : ''}`}
        >
          <FaBookOpen /> <span>Crônicas</span>
        </Link>
        <Link
          to="/journal"
          className={`sidebar-link ${location.pathname === '/journal' ? 'active' : ''}`}
        >
          <FaJournalWhills /> <span>Journal</span>
        </Link>
        <Link
          to="/combate"
          className={`sidebar-link ${location.pathname === '/combate' ? 'active' : ''}`}
        >
          <LuSwords /> <span>Conflito & Relógios</span>
        </Link>
        {isMestre ? (
          <Link
            to="/mestre/fichas"
            className={`sidebar-link ${location.pathname === '/mestre/fichas' ? 'active' : ''}`}
          >
            <FaShieldAlt /> <span>Gerenciar Fichas</span>
          </Link>
        ) : (
          <Link
            to="/ficha"
            className={`sidebar-link ${location.pathname === '/ficha' ? 'active' : ''}`}
          >
            <FaIdCard /> <span>Minha Ficha</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        {/* Botão de Configurações / Som */}
        <button
          type="button"
          className="btn-config-sidebar"
          onClick={onOpenSettings}
          title="Configurações de Áudio e Sistema"
        >
          <FaCog /> <span>Configurações</span>
        </button>
        {isMestre ? (
          <div className="mestre-badge-container" onClick={onLogout} title="Clique para sair do Modo Mestre">
            <FaShieldAlt className="icon-mestre" />
            <span className="mestre-text">Modo Mestre Ativo</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-login-mestre"
            onClick={onOpenLogin}
            title="Acesso restrito ao Mestre"
          >
            <FaKey /> <span>Entrar como Mestre</span>
          </button>
        )}
      </div>
    </aside>
  );
}