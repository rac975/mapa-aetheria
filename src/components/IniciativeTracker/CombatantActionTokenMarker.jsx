import { useRef } from 'react';
import { FaBolt, FaCrown, FaPlay, FaCheck, FaCrosshairs, FaGripVertical } from 'react-icons/fa';
import styles from './CombatantActionTokenMarker.module.css';

/**
 * Token sinalizador de ação móvel para Inimigos com múltiplas ações (Elites, Campeões, Chefes).
 * Reordenável exclusivamente via drag-and-drop na fila da Ordem de Combate,
 * mantendo sincronização com a barra de slots do card principal e sem duplicar PV ou PM.
 */
export default function CombatantActionTokenMarker({
  p,
  slot,
  totalAcoes,
  indexFila,
  isMestre,
  isAtorSelecionado,
  isDragging,
  isDragOver,
  dragDropPos = null,
  onSelecionarCombatente,
  onAtivarTurno,
  onAjustarAcaoSlot,
  onDragHandleDown,
  onDragHandleMove,
  onDragHandleUp,
  onDragHandleCancel
}) {
  const tokenRef = useRef(null);

  const cardClasses = [
    styles.tokenMarkerCard,
    slot.concluida && styles.concluida,
    slot.isProxima && styles.proxima,
    isAtorSelecionado && styles.atorSelecionado,
    isDragging && styles.dragging,
    isDragOver && (dragDropPos === 'bottom' ? styles.dragOverBottom : styles.dragOverTop)
  ].filter(Boolean).join(' ');

  const handleCardClick = () => {
    onSelecionarCombatente?.(p);
  };

  const handleAtivarTurno = (e) => {
    e.stopPropagation();
    onAtivarTurno?.(p);
  };

  const handleToggleSlot = (e) => {
    e.stopPropagation();
    onAjustarAcaoSlot?.(p.id, slot.numero);
  };

  return (
    <div
      ref={tokenRef}
      data-combatant-index={indexFila}
      className={cardClasses}
      onClick={handleCardClick}
      title={`Token de Ação ${slot.numero} de ${p.nome} — Segure e arraste a alça para reposicionar na fila`}
      role="region"
      aria-label={`Token de ação ${slot.numero} de ${p.nome}`}
    >
      <div className={styles.tokenInfoCluster}>
        <div className={styles.tokenMiniAvatar}>
          <FaCrown />
        </div>

        <div className={styles.tokenTexts}>
          <span className={styles.tokenParentName}>{p.nome}</span>
          <span className={styles.tokenActionBadge}>
            <FaBolt /> Ação {slot.numero} de {totalAcoes}
          </span>

          {slot.isProxima && (
            <span className={`${styles.tokenStatusPill} ${styles.tokenStatusProxima}`}>
              ▶ Próxima Ação Prevista
            </span>
          )}
          {slot.concluida && (
            <span className={`${styles.tokenStatusPill} ${styles.tokenStatusConcluida}`}>
              ✓ Ação Realizada
            </span>
          )}
          {slot.isPendente && (
            <span className={`${styles.tokenStatusPill} ${styles.tokenStatusPendente}`}>
              ⏳ Ação Pendente
            </span>
          )}
        </div>
      </div>

      <div className={styles.tokenControls} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.tokenActionBtn}
          onClick={handleCardClick}
          title="Focar este inimigo na Central de Ações"
        >
          <FaCrosshairs /> Central
        </button>

        {isMestre && !slot.concluida && (
          <button
            type="button"
            className={`${styles.tokenActionBtn} ${slot.isProxima ? styles.tokenActionBtnActive : ''}`}
            onClick={handleAtivarTurno}
            title="Definir como turno ativo atual para esta ação"
          >
            <FaPlay /> Turno
          </button>
        )}

        {isMestre && (
          <button
            type="button"
            className={styles.tokenActionBtn}
            onClick={handleToggleSlot}
            title={slot.concluida ? 'Desfazer esta ação' : 'Marcar esta ação como realizada'}
          >
            <FaCheck /> {slot.concluida ? 'Desfazer' : 'Concluir'}
          </button>
        )}

        {isMestre && (
          <button
            type="button"
            className={styles.dragHandleBtn}
            title="Segure e arraste para mover este token de ação pela Ordem de Combate"
            aria-label={`Arrastar token de ação ${slot.numero} de ${p.nome}`}
            onPointerDown={(e) => onDragHandleDown?.(e, indexFila)}
            onPointerMove={onDragHandleMove}
            onPointerUp={onDragHandleUp}
            onPointerCancel={onDragHandleCancel}
          >
            <FaGripVertical />
          </button>
        )}
      </div>
    </div>
  );
}
