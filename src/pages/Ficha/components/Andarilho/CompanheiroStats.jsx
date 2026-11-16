import React from 'react';
import styles from './CompanheiroStats.module.css';

export default function CompanheiroStats({ companheiro }) {
  return (
    <>
      {/* Atributos Básicos */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Atributos</div>
        <div className={styles.attrGrid}>
          {['des', 'ast', 'vig', 'von'].map(attr => (
            <div key={attr} className={styles.card}>
              <div className={styles.labelDim}>{attr}</div>
              <div className={styles.value}>{companheiro.atributos?.[attr] || 'd8'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Estatísticas de Combate */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Estatísticas de Combate</div>
        <div className={styles.statGrid}>
          <div className={styles.card}>
            <div className={styles.labelPv}>PV Máx</div>
            <div className={styles.value}>{companheiro.pv_max}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.labelPm}>PM Máx</div>
            <div className={styles.value}>{companheiro.pm_max}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.labelDef}>Defesa</div>
            <div className={styles.value}>{companheiro.defesa}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.labelDefMag}>Def. Mág.</div>
            <div className={styles.value}>{companheiro.defesa_magica}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.labelDim}>Iniciativa</div>
            <div className={styles.value}>0</div>
          </div>
        </div>
      </div>
    </>
  );
}
