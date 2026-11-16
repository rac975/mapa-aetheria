import React from 'react';
import { FaDice, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './CompanheiroAtaqueItem.module.css';

export default function CompanheiroAtaqueItem({
  ataque,
  indexAtaque,
  modoAtual,
  onAlterarModo,
  onRolarAtaque,
  ultimaRolagem
}) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <strong className={styles.name}>{ataque.nome}</strong>
          <div className={styles.desc}>
            Atributos: [{ataque.atributo_dado1?.toUpperCase()} + {ataque.atributo_dado2?.toUpperCase()}] • Tipo: {ataque.tipo_dano || 'Físico'}
          </div>
        </div>
      </div>

      <div className={styles.modeSwitch}>
        <button
          type="button"
          onClick={() => onAlterarModo(indexAtaque, 'normal')}
          className={`${styles.modeBtn} ${modoAtual === 'normal' ? styles.modeBtnActiveNormal : ''}`}
        >
          Ataque Único
        </button>
        <button
          type="button"
          onClick={() => onAlterarModo(indexAtaque, 'multi')}
          className={`${styles.modeBtn} ${modoAtual === 'multi' ? styles.modeBtnActiveMulti : ''}`}
        >
          Multiataque
        </button>
      </div>

      <Button
        type="button"
        variant="primary"
        size="sm"
        fullWidth
        onClick={() => onRolarAtaque(ataque, indexAtaque)}
      >
        <FaDice /> Rolar Ataque e Dano do Companheiro
      </Button>

      {ultimaRolagem && (
        <div className={styles.rollBox}>
          {ultimaRolagem.statusCritico && (
            <div className={ultimaRolagem.statusCritico.includes('Sucesso') ? styles.criticalSuccess : styles.criticalFailure}>
              <FaBolt /> {ultimaRolagem.statusCritico}
            </div>
          )}
          <div className={styles.precisionRow}>
            <span>Precisão Final:</span>
            <strong className={styles.precisionValue}>{ultimaRolagem.testeAtaque}</strong>
          </div>
          <div className={styles.attrsDetail}>
            <div>🧩 Atributos: {ultimaRolagem.attr1Label} ({ultimaRolagem.res1}) + {ultimaRolagem.attr2Label} ({ultimaRolagem.res2})</div>
            <div>⚔️ Bônus de Precisão (NP): +{ultimaRolagem.bonusPrecisao}</div>
          </div>
          <div className={styles.damageRow}>
            <span>Dano Final:</span>
            <strong className={styles.damageValue}>{ultimaRolagem.danoTotal}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
