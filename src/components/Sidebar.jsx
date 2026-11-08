import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaMapMarkedAlt, FaBookOpen, FaKey, FaShieldAlt } from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar({ isMestre, setIsMestre }) {
  const location = useLocation();
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [erroSenha, setErroSenha] = useState(false);

  // Defina a senha do Mestre aqui (ex: 'mestre123')
  const SENHA_MESTRE = 'aetheria2026';

  const handleLoginMestre = (e) => {
    e.preventDefault();
    if (senhaInput === SENHA_MESTRE) {
      setIsMestre(true);
      setModalSenhaAberto(false);
      setSenhaInput('');
      setErroSenha(false);
    } else {
      setErroSenha(true);
    }
  };

  const handleLogout = () => {
    setIsMestre(false);
  };

  return (
    <>
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
            <div className="mestre-badge-container" onClick={handleLogout} title="Clique para sair do Modo Mestre">
              <FaShieldAlt className="icon-mestre" />
              <span className="mestre-text">Modo Mestre Ativo</span>
            </div>
          ) : (
            <button 
              className="btn-login-mestre" 
              onClick={() => setModalSenhaAberto(true)}
              title="Acesso restrito ao Mestre"
            >
              <FaKey /> <span>Entrar como Mestre</span>
            </button>
          )}
        </div>
      </aside>

      {/* Modal de Senha do Mestre */}
      {modalSenhaAberto && (
        <div className="modal-overlay" onClick={() => setModalSenhaAberto(false)}>
          <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalSenhaAberto(false)}>&times;</button>
            <h2>Autenticação do Mestre</h2>
            <p>Insira a senha secreta para liberar o painel de gerenciamento das Crônicas.</p>
            
            <form onSubmit={handleLoginMestre}>
              <input 
                type="password" 
                placeholder="Senha de acesso..." 
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value)}
                autoFocus
              />
              {erroSenha && <span className="error-text">Senha incorreta, mestre!</span>}
              <button type="submit" className="btn-submit-mestre">Liberar Poderes</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}