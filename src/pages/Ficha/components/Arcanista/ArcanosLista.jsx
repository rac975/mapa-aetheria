import React from 'react';
import { FaTrash, FaBolt } from 'react-icons/fa';
import { Button } from '../../../../components/ui';
import styles from './ArcanosLista.module.css';

export default function ArcanosLista({
  arcanosVinculados,
  arcanoAtivoIdx,
  custoInvocacao,
  onInvocarArcano,
  onRemoverVinculo
}) {
  if (arcanosVinculados.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        Nenhum Arcano vinculado à alma ainda. Clique em <strong>+ Catálogo</strong> ou <strong>+ Custom</strong> para adicionar.
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {arcanosVinculados.map((arc, idx) => {
        const isAtivo = arcanoAtivoIdx === idx;
        return (
          <div
            key={arc.id || idx}
            className={`${styles.item} ${isAtivo ? styles.itemActive : ''}`}
          >
            <div className={styles.itemHeader}>
              <div>
                <strong className={styles.itemTitle}>{arc.nome}</strong>
                <span className={styles.itemDomains}>({arc.dominios})</span>
              </div>

              <div className={styles.itemActions}>
                {arcanoAtivoIdx === null && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onInvocarArcano(idx)}
                  >
                    <FaBolt size={10} /> Invocar (-{custoInvocacao} PM)
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => onRemoverVinculo(idx)}
                  className={styles.deleteBtn}
                  title="Desvincular Arcano"
                >
                  <FaTrash size={11} />
                </button>
              </div>
            </div>

            <div className={styles.fundirText}>
              <strong>Fundir:</strong> {arc.fundir}
            </div>
            {arc.dispensar_efeito && (
              <div className={styles.dispensarText}>
                <strong>Dispensar{arc.dispensar_nome ? ` (${arc.dispensar_nome})` : ''}:</strong> {arc.dispensar_efeito}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
