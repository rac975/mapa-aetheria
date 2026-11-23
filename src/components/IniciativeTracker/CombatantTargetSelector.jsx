import { FaBullseye, FaTimes, FaUsers, FaUser } from 'react-icons/fa';
import styles from './CombatantTargetSelector.module.css';

export default function CombatantTargetSelector({
  participantes = [],
  companheiros = [],
  atorId,
  alvoId = '',
  alvosIds = [],
  multiAlvoAtivo = false,
  onSelecionarAlvo,
  onToggleMultiAlvo,
  onLimparAlvo,
  onToggleAlvoMulti
}) {
  const alvosPossiveis = [
    ...participantes.filter((p) => String(p.id) !== String(atorId) && !p.fugiu && !p.modificadores?.fugiu),
    ...(companheiros || []).filter((c) => String(c.heroiId) !== String(atorId))
  ];

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

      <div className={styles.quickTargetsScroll} role="group" aria-label="Alvos rápidos para toque único">
        {alvosPossiveis.map((p) => {
          const isSelected = multiAlvoAtivo
            ? alvosIds.includes(String(p.id))
            : String(alvoId) === String(p.id);
          const icon = p.tipo === 'companheiro' ? '🐾' : (p.tipo === 'heroi' ? '🛡️' : '⚔️');
          const pvAtual = p.hp_atual ?? p.pv_atual;
          const pvMax = p.hp_max ?? p.pv_max;

          const handleClick = () => {
            if (multiAlvoAtivo) {
              onToggleAlvoMulti?.(String(p.id));
            } else {
              onSelecionarAlvo?.(isSelected ? '' : String(p.id));
            }
          };

          return (
            <button
              key={p.id}
              type="button"
              className={`${styles.quickTargetChip} ${isSelected ? styles.quickTargetChipSelected : ''}`}
              onClick={handleClick}
              title={`${p.nome} (${p.tipo}) • PV ${pvAtual}/${pvMax}`}
            >
              <span className={styles.chipIcon}>{icon}</span>
              <span className={styles.chipNome}>{p.nome}</span>
              {pvAtual !== undefined && pvMax !== undefined && (
                <span className={styles.chipPv}>{pvAtual}/{pvMax}</span>
              )}
            </button>
          );
        })}
      </div>

      {!multiAlvoAtivo && (
        <select
          className={styles.selectAlvo}
          value={alvoId || ''}
          onChange={(e) => onSelecionarAlvo?.(e.target.value)}
          aria-label="Selecionar Alvo do Ataque ou Ação"
        >
          <option value="">-- Nenhum Alvo (Ação Livre / Em Si Mesmo) --</option>
          {alvosPossiveis.map((p) => {
            const rotuloTipo = p.tipo === 'companheiro' ? '🐾 Companheiro' : (p.tipo === 'heroi' ? 'Herói' : 'Inimigo');
            return (
              <option key={p.id} value={p.id}>
                {p.nome} ({rotuloTipo} • PV {p.hp_atual ?? p.pv_atual}/{p.hp_max ?? p.pv_max})
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}
