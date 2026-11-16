import React from 'react';
import { FaBolt } from 'react-icons/fa';
import styles from './InventorInfusoesSecao.module.css';

export default function InventorInfusoesSecao({
  temAvancadoInfusoes,
  temSuperiorInfusoes,
  infusaoSelecionada,
  setInfusaoSelecionada
}) {
  return (
    <div className={styles.section}>
      <div className={styles.title}>
        <FaBolt /> Infusões (Custo: 2 PI por ataque)
      </div>
      <div className={styles.desc}>
        Gaste 2 PI ao atingir um alvo com um ataque para aplicar uma infusão (aplica a cada alvo se tiver propriedade multi).
      </div>
      <div className={styles.infusoesGroup}>
        {/* Básicas */}
        <span className={styles.groupLabelBasicas}>Básicas:</span>
        {['Crio (Gelo)', 'Piro (Fogo)', 'Volt (Raio)'].map((inf) => (
          <button
            key={inf}
            type="button"
            onClick={() => setInfusaoSelecionada(inf)}
            className={`${styles.infusaoBtn} ${infusaoSelecionada === inf ? styles.infusaoBtnActive : ''}`}
          >
            {inf} (+5 dano)
          </button>
        ))}

        {/* Avançadas */}
        {temAvancadoInfusoes && (
          <>
            <span className={styles.groupLabelAvancadas}>Avançadas:</span>
            {['Ciclone (Ar)', 'Exorcismo (Luz)', 'Sísmico (Terra)', 'Sombra (Trevas)'].map((inf) => (
              <button
                key={inf}
                type="button"
                onClick={() => setInfusaoSelecionada(inf)}
                className={`${styles.infusaoBtn} ${styles.infusaoBtnAvancada} ${infusaoSelecionada === inf ? styles.infusaoBtnAvancadaActive : ''}`}
              >
                {inf} (+5 dano)
              </button>
            ))}
          </>
        )}

        {/* Superiores */}
        {temSuperiorInfusoes && (
          <>
            <span className={styles.groupLabelSuperiores}>Superiores:</span>
            {['Vampiro (Recupera PV/PM)', 'Peçonha (Veneno + Condição)'].map((inf) => (
              <button
                key={inf}
                type="button"
                onClick={() => setInfusaoSelecionada(inf)}
                className={`${styles.infusaoBtn} ${styles.infusaoBtnSuperior} ${infusaoSelecionada === inf ? styles.infusaoBtnSuperiorActive : ''}`}
              >
                {inf}
              </button>
            ))}
          </>
        )}
      </div>
      {infusaoSelecionada && (
        <div className={styles.activeInfo}>
          ✨ Infusão Ativa para o próximo ataque: <strong>{infusaoSelecionada}</strong> (Gasta 2 PI ao acertar).
        </div>
      )}
    </div>
  );
}
