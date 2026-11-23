import { FaBullseye, FaTimes, FaUsers, FaUser, FaPlus, FaMinus } from 'react-icons/fa';
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
  const totalGolpesSelecionados = multiAlvoAtivo ? alvosIds.length : (alvoId ? 1 : 0);

  return (
    <div className={styles.targetSelectorWrap} onClick={(e) => e.stopPropagation()}>
      <div className={styles.targetHeaderRow}>
        <div className={styles.targetLabel}>
          <FaBullseye /> Alvo da Ação {totalGolpesSelecionados > 0 ? `(${totalGolpesSelecionados})` : ''}:
        </div>
        <div className={styles.targetControlsRow}>
          <div className={styles.modeSegmentedGroup} role="group" aria-label="Modo de seleção de alvo">
            <button
              type="button"
              className={`${styles.btnMultiToggle} ${!multiAlvoAtivo ? styles.btnMultiToggleActive : ''}`}
              onClick={() => multiAlvoAtivo && onToggleMultiAlvo?.(false)}
              title="Modo Alvo Único: seleciona 1 alvo principal"
            >
              <FaUser /> Alvo Único
            </button>
            <button
              type="button"
              className={`${styles.btnMultiToggle} ${multiAlvoAtivo ? styles.btnMultiToggleActive : ''}`}
              onClick={() => !multiAlvoAtivo && onToggleMultiAlvo?.(true)}
              title="Modo Multi-Alvos e Multi-Golpes: selecione múltiplos alvos ou múltiplos golpes no mesmo alvo (+)"
            >
              <FaUsers /> Multi-Alvos {multiAlvoAtivo && alvosIds.length > 0 ? `(${alvosIds.length})` : ''}
            </button>
          </div>
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
          const idStr = String(p.id);
          const qtdGolpes = multiAlvoAtivo
            ? alvosIds.filter((id) => String(id) === idStr).length
            : (String(alvoId) === idStr ? 1 : 0);
          const isSelected = qtdGolpes > 0;
          const icon = p.tipo === 'companheiro' ? '🐾' : (p.tipo === 'heroi' ? '🛡️' : '⚔️');
          const pvAtual = p.hp_atual ?? p.pv_atual;
          const pvMax = p.hp_max ?? p.pv_max;

          const handleClickChip = () => {
            if (multiAlvoAtivo) {
              onToggleAlvoMulti?.(idStr, 'toggle');
            } else {
              onSelecionarAlvo?.(isSelected ? '' : idStr);
            }
          };

          const handleAddGolpeMesmoAlvo = (e) => {
            e.stopPropagation();
            if (!multiAlvoAtivo) {
              onToggleMultiAlvo?.(true);
              onToggleAlvoMulti?.(idStr, 'add');
            } else {
              onToggleAlvoMulti?.(idStr, 'add');
            }
          };

          const handleRemoveGolpeMesmoAlvo = (e) => {
            e.stopPropagation();
            onToggleAlvoMulti?.(idStr, 'remove_one');
          };

          return (
            <div
              key={p.id}
              className={`${styles.quickTargetChip} ${isSelected ? styles.quickTargetChipSelected : ''}`}
            >
              <button
                type="button"
                className={styles.chipMainBtn}
                onClick={handleClickChip}
                title={`${p.nome} (${p.tipo}) • PV ${pvAtual}/${pvMax}`}
              >
                <span className={styles.chipIcon}>{icon}</span>
                <span className={styles.chipNome}>{p.nome}</span>
                {pvAtual !== undefined && pvMax !== undefined && (
                  <span className={styles.chipPv}>{pvAtual}/{pvMax}</span>
                )}
                {isSelected && qtdGolpes > 1 && (
                  <span className={styles.chipHitCountBadge}>{qtdGolpes}×</span>
                )}
              </button>
              {isSelected && (
                <div className={styles.chipMultiHitControls}>
                  {multiAlvoAtivo && qtdGolpes > 1 && (
                    <button
                      type="button"
                      className={styles.chipHitStepBtn}
                      onClick={handleRemoveGolpeMesmoAlvo}
                      title={`Remover 1 golpe de ${p.nome}`}
                      aria-label={`Remover 1 golpe de ${p.nome}`}
                    >
                      <FaMinus />
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.chipHitStepBtn}
                    onClick={handleAddGolpeMesmoAlvo}
                    title={`Desferir mais um golpe no mesmo alvo (${p.nome})`}
                    aria-label={`Adicionar golpe em ${p.nome}`}
                  >
                    <FaPlus />
                  </button>
                </div>
              )}
            </div>
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
