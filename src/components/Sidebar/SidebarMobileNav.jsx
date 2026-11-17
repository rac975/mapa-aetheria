import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaCog, FaShieldAlt, FaKey } from 'react-icons/fa';
import { LuSparkles } from 'react-icons/lu';
import { MOBILE_TABS } from './sidebarConfig';
import styles from './Sidebar.module.css';

export default function SidebarMobileNav({
  gruposNavegacao,
  isMestre,
  isRotaAtiva,
  mobileMenuAberto,
  onToggleMenu,
  onFecharMenu,
  onOpenSettings,
  onOpenLogin,
  onLogout
}) {
  return (
    <>
      <nav className={`${styles.mobileBottomNav} ${styles.noPrint}`} aria-label="Navegação rápida mobile">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const ativo = isRotaAtiva(tab.to, tab.exact);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`${styles.bottomNavItem} ${ativo ? styles.bottomNavItemActive : ''}`}
              aria-current={ativo ? 'page' : undefined}
            >
              <Icon />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`${styles.bottomNavItem} ${mobileMenuAberto ? styles.bottomNavItemActive : ''}`}
          onClick={onToggleMenu}
          aria-expanded={mobileMenuAberto}
          aria-label="Abrir menu completo"
        >
          {mobileMenuAberto ? <FaTimes /> : <FaBars />}
          <span>Menu</span>
        </button>
      </nav>

      {mobileMenuAberto && (
        <div
          className={`${styles.mobileDrawerBackdrop} ${styles.noPrint}`}
          onClick={onFecharMenu}
        >
          <div
            className={styles.mobileDrawer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Menu completo de navegação"
          >
            <div className={styles.mobileDrawerHeader}>
              <div className={styles.brandLink}>
                <span className={styles.brandEmblem}><LuSparkles /></span>
                <span className={styles.brandTitle}>Aetheria</span>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={onFecharMenu}
                aria-label="Fechar menu"
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.mobileDrawerBody}>
              {gruposNavegacao.map((grupo) => (
                <div key={grupo.titulo} className={styles.drawerGroup}>
                  <span className={styles.groupLabel}>{grupo.titulo}</span>
                  <div className={styles.drawerGrid}>
                    {grupo.itens.map((item) => {
                      const Icon = item.icon;
                      const ativo = isRotaAtiva(item.to, item.exact);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`${styles.drawerItem} ${ativo ? styles.drawerItemActive : ''}`}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.mobileDrawerFooter}>
              <button
                type="button"
                className={styles.footerBtn}
                onClick={() => {
                  onFecharMenu();
                  onOpenSettings();
                }}
              >
                <FaCog /> <span>Configurações</span>
              </button>

              {isMestre ? (
                <button
                  type="button"
                  className={`${styles.footerBtn} ${styles.masterActiveBtn}`}
                  onClick={() => {
                    onFecharMenu();
                    onLogout();
                  }}
                >
                  <FaShieldAlt /> <span>Sair do Modo Mestre</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.footerBtn} ${styles.masterLoginBtn}`}
                  onClick={() => {
                    onFecharMenu();
                    onOpenLogin();
                  }}
                >
                  <FaKey /> <span>Entrar como Mestre</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
