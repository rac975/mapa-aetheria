import { Link, useLocation } from 'react-router-dom';
import { FaMapMarkedAlt, FaBookOpen, FaKey, FaShieldAlt } from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar({ isMestre, onOpenLogin, onLogout }) {
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
      </nav>

      <div className="sidebar-footer">
        {isMestre ? (
          <div className="mestre-badge-container" onClick={onLogout} title="Clique para sair do Modo Mestre">
            <FaShieldAlt className="icon-mestre" />
            <span className="mestre-text">Modo Mestre Ativo</span>
          </div>
        ) : (
          <button 
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