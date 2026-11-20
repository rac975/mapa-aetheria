import React from 'react';
import { FaDice, FaBolt } from 'react-icons/fa';
import { formatarAtaqueBasicoNpc } from '../../../../domain/fabula/npcRules';
import { Button, Badge } from '../../../../components/ui';
import styles from './CompanheiroAtaqueItem.module.css';

export default function CompanheiroAtaqueItem({
  ataque,
  indexAtaque,
  modoAtual,
  onAlterarModo,
  onRolarAtaque,
  ultimaRolagem
}) {
  const info = formatarAtaqueBasicoNpc(ataque);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <strong className={styles.name}>{info.nome}</strong>
          <div className={styles.desc}>
            Atributos: [{info.attr1} + {info.attr2}]{info.modPrecisaoTexto} • Dano: RA + {info.bonusDano} • Tipo: {info.tipoDano.toUpperCase()}
          </div>
          {info.resumoEfeito && (
            <div className={styles.desc}>
              <Badge variant="ether" size="sm">✦ {info.resumoEfeito}</Badge>
            </div>
          )}
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
