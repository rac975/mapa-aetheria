import { Badge } from '../ui';
import styles from './InitiativeTracker.module.css';

export default function CombatModifiersBar({ isMestre, modsCena = {}, atualizarModificadorGlobal }) {
  return (
    <div className={`${styles.modifiersBar} ${styles.noPrint}`}>
      <span className={styles.modifiersLabel}>Modificadores da Cena:</span>
      {isMestre ? (
        <div className={styles.modifiersControls}>
          <button
            type="button"
            className={`${styles.modifierBtn} ${modsCena.decretoDobrarPm ? styles.modifierBtnActive : ''}`}
            onClick={() => atualizarModificadorGlobal({ decretoDobrarPm: !modsCena.decretoDobrarPm })}
          >
            Decreto: Custo PM ×2
          </button>
          <button
            type="button"
            className={`${styles.modifierBtn} ${modsCena.roqueBloquearCura ? styles.modifierBtnActive : ''}`}
            onClick={() => atualizarModificadorGlobal({ roqueBloquearCura: !modsCena.roqueBloquearCura })}
          >
            Roque do Rei: Bloquear Curas
          </button>
          <button
            type="button"
            className={`${styles.modifierBtn} ${modsCena.decretoDanoExtra > 0 ? styles.modifierBtnActive : ''}`}
            onClick={() => atualizarModificadorGlobal({ decretoDanoExtra: modsCena.decretoDanoExtra > 0 ? 0 : 6 })}
          >
            Dano Global +6
          </button>
        </div>
      ) : (
        <div className={styles.modifiersControls}>
          {modsCena.decretoDobrarPm && <Badge variant="crise" size="sm">Custo PM ×2</Badge>}
          {modsCena.roqueBloquearCura && <Badge variant="crise" size="sm">Curas Bloqueadas</Badge>}
          {modsCena.decretoDanoExtra > 0 && (
            <Badge variant="gold" size="sm">Dano Global +{modsCena.decretoDanoExtra}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
