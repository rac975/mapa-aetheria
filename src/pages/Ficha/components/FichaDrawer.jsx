import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Badge } from '../../../components/ui';
import styles from './FichaDrawer.module.css';

/**
 * Gaveta recolhível tática para a Ficha de Personagem.
 * Segue o Design System limpo com bordas douradas, transições suaves e badges contextuais.
 */
export default function FichaDrawer({
  titulo,
  icone,
  badge = null,
  badgeVariant = 'default',
  isOpenDefault = true,
  children,
  className = ''
}) {
  const [aberto, setAberto] = useState(isOpenDefault);

  return (
    <div className={`${styles.drawerContainer} ${className}`}>
      <button
        type="button"
        className={`${styles.drawerHeader} ${aberto ? styles.headerAberto : ''}`}
        onClick={() => setAberto((prev) => !prev)}
        aria-expanded={aberto}
      >
        <div className={styles.headerLeft}>
          {icone && <span className={styles.headerIcon}>{icone}</span>}
          <span className={styles.headerTitle}>{titulo}</span>
          {badge !== null && badge !== undefined && (
            <Badge variant={badgeVariant} size="sm">
              {badge}
            </Badge>
          )}
        </div>
        <div className={styles.headerRight}>
          <span className={styles.toggleText}>{aberto ? 'Recolher' : 'Expandir'}</span>
          <span className={styles.chevronIcon}>
            {aberto ? <FaChevronUp /> : <FaChevronDown />}
          </span>
        </div>
      </button>

      {aberto && (
        <div className={styles.drawerBody}>
          {children}
        </div>
      )}
    </div>
  );
}
