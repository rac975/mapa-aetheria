import React from 'react';
import { FaFlask, FaDice } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './InventorAlquimiaSecao.module.css';

export default function InventorAlquimiaSecao({
  tipoMistura,
  setTipoMistura,
  temAvancadoAlquimia,
  temSuperiorAlquimia,
  onExecutarAlquimia,
  resultadoAlquimia,
  tabelaEfeito,
  descreverAlvo
}) {
  return (
    <div className={styles.section}>
      <div className={styles.title}>
        <FaFlask /> Alquimia / Misturas (Ação Inventário)
      </div>

      <div className={styles.selectorGrid}>
        <button
          type="button"
          onClick={() => setTipoMistura('basica')}
          className={`${styles.selectBtn} ${tipoMistura === 'basica' ? styles.selectBtnActiveBasica : ''}`}
        >
          Básica (3 PI | 2 d20)
        </button>
        <button
          type="button"
          onClick={() => { if (temAvancadoAlquimia) setTipoMistura('avancada'); }}
          disabled={!temAvancadoAlquimia}
          className={`${styles.selectBtn} ${tipoMistura === 'avancada' ? styles.selectBtnActiveAvancada : ''} ${!temAvancadoAlquimia ? styles.selectBtnDisabled : ''}`}
        >
          Avançada (4 PI | 3 d20) {!temAvancadoAlquimia && '🔒'}
        </button>
        <button
          type="button"
          onClick={() => { if (temSuperiorAlquimia) setTipoMistura('superior'); }}
          disabled={!temSuperiorAlquimia}
          className={`${styles.selectBtn} ${tipoMistura === 'superior' ? styles.selectBtnActiveSuperior : ''} ${!temSuperiorAlquimia ? styles.selectBtnDisabled : ''}`}
        >
          Superior (5 PI | 4 d20) {!temSuperiorAlquimia && '🔒'}
        </button>
      </div>

      <Button
        type="button"
        variant="primary"
        size="md"
        fullWidth
        onClick={onExecutarAlquimia}
      >
        <FaDice /> Rolar Mistura Alquímica (Gasta {tipoMistura === 'basica' ? 3 : tipoMistura === 'avancada' ? 4 : 5} PI)
      </Button>

      {resultadoAlquimia && (
        <div className={styles.resultadoBox}>
          <div className={styles.resultadoHeader}>
            <span>Resultado da Rolagem ({resultadoAlquimia.tipo.toUpperCase()})</span>
            <span>[{resultadoAlquimia.dadosRolados.join(', ')}]</span>
          </div>
          <div className={styles.resultadoHint}>
            💡 Atribua um dado para o <strong>Alvo</strong> e outro para o <strong>Efeito</strong>. Opção "Qualquer": Recupera 30 PV ou causa 20 de dano de veneno.
          </div>
          <div className={styles.dadosGrid}>
            {resultadoAlquimia.dadosRolados.map((d, dIdx) => (
              <div key={dIdx} className={styles.dadoCard}>
                <span className={styles.dadoTitle}>Dado #{dIdx + 1} ({d}):</span>
                <div className={styles.dadoAlvo}>🎯 Alvo: {descreverAlvo(d)}</div>
                <div className={styles.dadoEfeito}>✨ Efeito: {tabelaEfeito[d] || 'Efeito padrão'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
