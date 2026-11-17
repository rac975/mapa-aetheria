import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaShieldAlt,
  FaCog,
  FaKey,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt
} from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { getGruposNavegacao } from './sidebarConfig';
import SidebarMobileNav from './SidebarMobileNav';
import styles from './Sidebar.module.css';

const STORAGE_COLLAPSED_KEY = 'aetheria_sidebar_collapsed';

export default function Sidebar({ isMestre, onOpenLogin, onLogout, onOpenSettings }) {
  const location = useLocation();
  const [recolhida, setRecolhida] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [menuAbertoNaRota, setMenuAbertoNaRota] = useState(null);
  const mobileMenuAberto = menuAbertoNaRota === location.pathname;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COLLAPSED_KEY, String(recolhida));
    } catch {
      // Ignora indisponibilidade de storage
    }
  }, [recolhida]);

  const isRotaAtiva = (path, exact = true) => {
    if (exact) return location.pathname === path;
    if (path === '/ficha' && location.pathname.startsWith('/mestre/editar')) return true;
    return location.pathname.startsWith(path);
  };

  const gruposNavegacao = getGruposNavegacao(isMestre);

  return (
    <>
      <aside
        className={`${styles.sidebar} ${recolhida ? styles.recolhida : ''} ${styles.noPrint}`}
        aria-label="Navegação principal"
      >
        <div className={styles.brandHeader}>
          <Link to="/" className={styles.brandLink} title="AetheriaMap">
            <span className={styles.brandEmblem} aria-hidden="true">
              <LuSparkles />
            </span>
            {!recolhida && (
              <div className={styles.brandText}>
                <h2 className={styles.brandTitle}>Aetheria</h2>
                <span className={styles.brandSub}>Fabula Ultima Atlas</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setRecolhida((prev) => !prev)}
            title={recolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-label={recolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {recolhida ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <nav className={styles.nav}>
          {gruposNavegacao.map((grupo) => (
            <div key={grupo.titulo} className={styles.navGroup}>
              {!recolhida && <span className={styles.groupLabel}>{grupo.titulo}</span>}
              <div className={styles.groupLinks}>
                {grupo.itens.map((item) => {
                  const Icon = item.icon;
                  const ativo = isRotaAtiva(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`${styles.navLink} ${ativo ? styles.navLinkActive : ''}`}
                      title={recolhida ? item.label : undefined}
                      aria-current={ativo ? 'page' : undefined}
                    >
                      <span className={styles.navIconWrap}>
                        <Icon />
                      </span>
                      {!recolhida && <span className={styles.navLabel}>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.footerBtn}
            onClick={onOpenSettings}
            title="Configurações"
          >
            <span className={styles.navIconWrap}><FaCog /></span>
            {!recolhida && <span>Configurações</span>}
          </button>

          {isMestre ? (
            <button
              type="button"
              className={`${styles.footerBtn} ${styles.masterActiveBtn}`}
              onClick={onLogout}
              title="Sair do Modo Mestre"
            >
              <span className={styles.navIconWrap}><FaShieldAlt /></span>
              {!recolhida && (
                <>
                  <span className={styles.masterLabel}>Modo Mestre</span>
                  <FaSignOutAlt className={styles.logoutIcon} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.footerBtn} ${styles.masterLoginBtn}`}
              onClick={onOpenLogin}
              title="Entrar como Mestre"
            >
              <span className={styles.navIconWrap}><FaKey /></span>
              {!recolhida && <span>Modo Mestre</span>}
            </button>
          )}
        </div>
      </aside>

      <SidebarMobileNav
        gruposNavegacao={gruposNavegacao}
        isMestre={isMestre}
        isRotaAtiva={isRotaAtiva}
        mobileMenuAberto={mobileMenuAberto}
        onToggleMenu={() => setMenuAbertoNaRota(mobileMenuAberto ? null : location.pathname)}
        onFecharMenu={() => setMenuAbertoNaRota(null)}
        onOpenSettings={onOpenSettings}
        onOpenLogin={onOpenLogin}
        onLogout={onLogout}
      />
    </>
  );
}
