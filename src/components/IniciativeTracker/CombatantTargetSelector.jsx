import { FaBullseye, FaTimes, FaUsers, FaUser } from 'react-icons/fa';
import styles from './CombatantTargetSelector.module.css';

export default function CombatantTargetSelector({
  participantes = [],
  atorId,
  alvoId = '',
  alvosIds = [],
  multiAlvoAtivo = false,
  onSelecionarAlvo,
  onToggleMultiAlvo,
  onLimparAlvo,
  onToggleAlvoMulti
}) {
  const alvosPossiveis = participantes.filter((p) => String(p.id) !== String(atorId));

  const temAlvo = multiAlvoAtivo ? alvosIds.length > 0 : Boolean(alvoId);

  return (
    <div className={styles.targetSelectorWrap} onClick={(e) => e.stopPropagation()}>
      <div className={styles.targetHeaderRow}>
        <div className={styles.targetLabel}>
          <FaBullseye /> Alvo da Ação:
        </div>
        <div className={styles.targetControlsRow}>
          <button
            type="button"
            className={`${styles.btnMultiToggle} ${multiAlvoAtivo ? styles.btnMultiToggleActive : ''}`}
            onClick={onToggleMultiAlvo}
            title={multiAlvoAtivo ? 'Mudar para modo de alvo único' : 'Mudar para múltiplos alvos'}
          >
            {multiAlvoAtivo ? <><FaUser /> Alvo Único</> : <><FaUsers /> Multi-Alvos</>}
          </button>
          {temAlvo && (
            <button
              type="button"
              className={styles.btnClearTarget}
              onClick={onLimparAlvo}
              title="Limpar seleção de alvo"
            >
              <FaTimes /> Limpar
            </button>
          )}
        </div>
      </div>

      {!multiAlvoAtivo ? (
        <select
          className={styles.selectAlvo}
          value={alvoId || ''}
          onChange={(e) => onSelecionarAlvo?.(e.target.value)}
          aria-label="Selecionar Alvo do Ataque ou Ação"
        >
          <option value="">-- Nenhum Alvo (Ação Livre / Em Si Mesmo) --</option>
          {alvosPossiveis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} ({p.tipo === 'heroi' ? 'Herói' : 'Inimigo'} • PV {p.hp_atual}/{p.hp_max})
            </option>
          ))}
        </select>
      ) : (
        <div className={styles.multiTargetsGrid}>
          {alvosPossiveis.map((p) => {
            const isSelected = alvosIds.includes(String(p.id));
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.multiTargetChip} ${isSelected ? styles.multiTargetChipSelected : ''}`}
                onClick={() => onToggleAlvoMulti?.(String(p.id))}
              >
                <span>{isSelected ? '🎯' : '○'}</span>
                <span>{p.nome}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
