import { FaBolt, FaCheck, FaPlay, FaClock, FaForward, FaUndo } from 'react-icons/fa';
import { obterSlotsAcoesInimigo } from '../../domain/fabula/combatInitiativeRules';
import styles from './CombatantActionSlots.module.css';

/**
 * Barra visual de tokens/slots de múltiplas ações para Inimigos (Elites, Campeões, Chefes).
 * Indica quando cada ação ocorre na rodada e qual é a próxima ação prevista.
 * Permite ao Mestre avançar ou alternar diretamente cada slot.
 */
export default function CombatantActionSlotsBar({
  p,
  isMestre,
  onAjustarAcaoSlot
}) {
  const slots = obterSlotsAcoesInimigo(p);
  if (!slots.length) return null;

  const totalAcoes = slots.length;
  const concluidas = slots.filter((s) => s.concluida).length;
  const proximaAcao = slots.find((s) => s.isProxima);

  const handleSlotClick = (slotNumero) => {
    if (!isMestre) return;
    onAjustarAcaoSlot?.(p.id, slotNumero);
  };

  const handleAvancarProxima = () => {
    if (!isMestre) return;
    if (proximaAcao) {
      onAjustarAcaoSlot?.(p.id, proximaAcao.numero);
    } else if (concluidas >= totalAcoes) {
      // Todas concluídas: reiniciar ações do inimigo na rodada
      onAjustarAcaoSlot?.(p.id, 0);
    }
  };

  return (
    <div className={styles.slotsBarContainer} onClick={(e) => e.stopPropagation()}>
      <div className={styles.slotsHeaderRow}>
        <span className={styles.slotsTitle}>
          <FaBolt /> Ações da Rodada
        </span>
        <span className={styles.slotsCounter}>
          {concluidas}/{totalAcoes} Concluídas
          {proximaAcao && ` • Próxima: Ação ${proximaAcao.numero}`}
        </span>

        {isMestre && (
          <button
            type="button"
            className={styles.quickAdvanceBtn}
            onClick={handleAvancarProxima}
            title={proximaAcao
              ? `Concluir ${proximaAcao.rotulo}`
              : 'Reiniciar ações do inimigo nesta rodada'}
          >
            {proximaAcao ? (
              <>
                <FaForward /> Concluir Ação {proximaAcao.numero}
              </>
            ) : (
              <>
                <FaUndo /> Reiniciar Ações
              </>
            )}
          </button>
        )}
      </div>

      <div className={styles.tokensRow}>
        {slots.map((slot) => {
          const slotClasses = [
            styles.actionSlotToken,
            slot.concluida && styles.concluida,
            slot.isProxima && styles.proxima,
            slot.isPendente && styles.pendente,
            isMestre && styles.clickable
          ].filter(Boolean).join(' ');

          const slotTitle = isMestre
            ? `${slot.rotulo}: Clique para alternar status desta ação`
            : `${slot.rotulo} ${slot.concluida ? '(Concluída)' : slot.isProxima ? '(Próxima Ação Prevista)' : '(Pendente)'}`;

          return (
            <div
              key={slot.numero}
              className={slotClasses}
              onClick={() => handleSlotClick(slot.numero)}
              title={slotTitle}
              role={isMestre ? 'button' : 'status'}
              tabIndex={isMestre ? 0 : undefined}
              onKeyDown={(e) => {
                if (isMestre && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSlotClick(slot.numero);
                }
              }}
            >
              <span className={styles.slotLabel}>
                {slot.concluida ? <FaCheck /> : slot.isProxima ? <FaPlay /> : <FaClock />} {slot.rotulo}
              </span>

              {slot.isProxima && (
                <span className={`${styles.slotStatusBadge} ${styles.badgeProxima}`}>
                  Próxima Prevista
                </span>
              )}
              {slot.concluida && (
                <span className={`${styles.slotStatusBadge} ${styles.badgeConcluida}`}>
                  Feita
                </span>
              )}
              {slot.isPendente && (
                <span className={`${styles.slotStatusBadge} ${styles.badgePendente}`}>
                  Aguardando
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
