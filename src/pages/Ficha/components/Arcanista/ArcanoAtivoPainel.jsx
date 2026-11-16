import React from 'react';
import { FaTimesCircle } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ArcanoAtivoPainel.module.css';

export default function ArcanoAtivoPainel({ arcanoAtivo, onDispensar }) {
  if (!arcanoAtivo) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>
          ✨ Fundido: {arcanoAtivo.nome}
        </span>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onDispensar(true)}
            title="Ativa o efeito de dispensa (se desejar) e Círculo Arcano"
          >
            <FaTimesCircle /> Dispensar (Voluntário)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDispensar(false)}
            title="Fim de cena, inconsciência ou efeito automático (sem efeito de dispensa)"
          >
            Encerrar Cena
          </Button>
        </div>
      </div>

      <div className={styles.fundirText}>
        <strong className={styles.fundirLabel}>Benefício de Fundição:</strong> {arcanoAtivo.fundir}
      </div>

      {arcanoAtivo.dispensar_efeito && (
        <div className={styles.dispensarText}>
          <strong className={styles.dispensarLabel}>
            Dispensa{arcanoAtivo.dispensar_nome ? ` (${arcanoAtivo.dispensar_nome})` : ''}:
          </strong>{' '}
          {arcanoAtivo.dispensar_efeito}
        </div>
      )}
    </div>
  );
}
