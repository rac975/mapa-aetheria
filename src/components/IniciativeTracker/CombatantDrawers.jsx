import { FaTimes, FaMinus, FaPlus, FaBoxOpen, FaStar, FaSkull } from 'react-icons/fa';
import { CONDICOES_DISPONIVEIS } from '../../constants/condicoes';
import { extrairHpMax, extrairMpMax } from '../../domain/fabula/combatRules';
import styles from './CombatantDrawers.module.css';

export default function CombatantDrawers({
  p,
  painelAberto,
  condicoesAtivas = [],
  onFechar,
  onAlterarRecurso,
  onToggleCondicao
}) {
  const maxHp = extrairHpMax(p);
  const maxMp = extrairMpMax(p);

  if (painelAberto === 'recursos') {
    return (
      <div className={`${styles.popoverDrawer} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Ajuste Rápido de Recursos — {p.nome}</span>
          <button type="button" className={styles.drawerCloseBtn} onClick={onFechar}><FaTimes /></button>
        </div>
        <div className={styles.recursosPopoverGrid}>
          <div className={styles.recursoControlBox}>
            <span className={styles.recursoLabel}>PV ({p.hp_atual} / {maxHp})</span>
            <div className={styles.btnGroupDelta}>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -10, maxHp)}>-10</button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -5, maxHp)}>-5</button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, -1, maxHp)}><FaMinus /></button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 1, maxHp)}><FaPlus /></button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 5, maxHp)}>+5</button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'hp_atual', p.hp_atual, 10, maxHp)}>+10</button>
            </div>
          </div>

          <div className={styles.recursoControlBox}>
            <span className={styles.recursoLabel}>PM ({p.mp_atual} / {maxMp})</span>
            <div className={styles.btnGroupDelta}>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -10, maxMp)}>-10</button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -5, maxMp)}>-5</button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, -1, maxMp)}><FaMinus /></button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 1, maxMp)}><FaPlus /></button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 5, maxMp)}>+5</button>
              <button type="button" className={styles.deltaBtn} onClick={() => onAlterarRecurso(p.id, 'mp_atual', p.mp_atual, 10, maxMp)}>+10</button>
            </div>
          </div>

          {p.tipo === 'heroi' ? (
            <div className={styles.countersRow}>
              <div className={styles.statGroup}>
                <span className={styles.statLabel}><FaBoxOpen /> IP: {p.ip}</span>
                <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'ip', p.ip, -1)}><FaMinus /></button>
                <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'ip', p.ip, 1)}><FaPlus /></button>
              </div>
              <div className={styles.statGroup}>
                <span className={styles.statLabel}><FaStar /> PF: {p.pontos_fabula}</span>
                <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, -1)}><FaMinus /></button>
                <button type="button" className={styles.counterBtn} onClick={() => onAlterarRecurso(p.id, 'pontos_fabula', p.pontos_fabula, 1)}><FaPlus /></button>
              </div>
            </div>
          ) : (
            <div className={styles.countersRow}>
              <div className={styles.statGroup}>
                <span className={styles.statLabel}>
                  <FaSkull /> PVilão: {p.pontos_vilao ?? p.pontos_ultima ?? 0}
                </span>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => onAlterarRecurso(p.id, 'pontos_vilao', p.pontos_vilao ?? p.pontos_ultima ?? 0, -1)}
                >
                  <FaMinus />
                </button>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => onAlterarRecurso(p.id, 'pontos_vilao', p.pontos_vilao ?? p.pontos_ultima ?? 0, 1)}
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (painelAberto === 'condicoes') {
    return (
      <div className={`${styles.popoverDrawer} ${styles.noPrint}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Condições de Status — {p.nome}</span>
          <button type="button" className={styles.drawerCloseBtn} onClick={onFechar}><FaTimes /></button>
        </div>
        <div className={styles.condicoesPopoverGrid}>
          {CONDICOES_DISPONIVEIS.map((c) => {
            const ativo = condicoesAtivas.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`${styles.condBtn} ${ativo ? styles.condBtnActive : ''}`}
                onClick={() => onToggleCondicao(p, c.id)}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
