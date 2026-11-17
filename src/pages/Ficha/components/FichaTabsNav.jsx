import React from 'react';
import { Badge } from '../../../components/ui';
import styles from './FichaTabsNav.module.css';

/**
 * Barra de navegação por abas com Design System tático de Fabula Ultima.
 * Permite alternar rapidamente entre seções com badges contextuais e respiro visual.
 */
export default function FichaTabsNav({
  tabs = [],
  activeTab,
  onChangeTab,
  className = ''
}) {
  return (
    <nav className={`${styles.tabsNavContainer} ${className}`} aria-label="Navegação de abas da ficha">
      <div className={styles.tabsStrip}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              onClick={() => onChangeTab(tab.id)}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icone && <span className={styles.tabIcon}>{tab.icone}</span>}
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.badge !== null && tab.badge !== undefined && (
                <Badge
                  variant={isActive ? (tab.badgeVariantActive || 'gold') : (tab.badgeVariant || 'default')}
                  size="sm"
                  className={styles.tabBadge}
                >
                  {tab.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
