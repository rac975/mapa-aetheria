import React from 'react';
import { FaFlask, FaShieldAlt, FaMagic } from 'react-icons/fa';
import styles from './InventorRamosResumo.module.css';

export default function InventorRamosResumo({ ramoAlquimia, ramoInfusoes, ramoTecnomagia }) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.titleAlquimia}>
          <FaFlask /> Alquimia
        </div>
        <div className={ramoAlquimia ? styles.statusActive : styles.statusInactive}>
          {ramoAlquimia || 'Não Adquirido'}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.titleInfusoes}>
          <FaShieldAlt /> Infusões
        </div>
        <div className={ramoInfusoes ? styles.statusActive : styles.statusInactive}>
          {ramoInfusoes || 'Não Adquirido'}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.titleTecnomagia}>
          <FaMagic /> Tecnomagia
        </div>
        <div className={ramoTecnomagia ? styles.statusActive : styles.statusInactive}>
          {ramoTecnomagia || 'Não Adquirido'}
        </div>
      </div>
    </div>
  );
}
