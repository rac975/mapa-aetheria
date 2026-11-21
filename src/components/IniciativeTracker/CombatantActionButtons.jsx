import {
  FaPlay, FaDice, FaCrown, FaSlidersH, FaExclamationTriangle,
  FaGripVertical, FaTrashAlt, FaCheck, FaTimes
} from 'react-icons/fa';
import { Button } from '../ui';
import actionStyles from './CombatantItemActions.module.css';

export default function CombatantActionButtons({
  p,
  index,
  isMestre,
  ehMeuPersonagem,
  isEditando,
  estaDerrotado,
  podeRolarDados,
  isInimigo,
  painelAberto,
  alternarPainel,
  condicoesAtivas = [],
  onAtivarTurno,
  onRolarDados,
  onSalvarEdicao,
  onCancelarEdicao,
  onIniciarExclusao,
  onDragHandleDown,
  onDragHandleMove,
  onDragHandleUp,
  onDragHandleCancel
}) {
  const podeAtivarTurno = !isEditando && !estaDerrotado && !p.agiu && onAtivarTurno && (isMestre || ehMeuPersonagem);

  return (
    <div className={`${actionStyles.actionsCluster} ${actionStyles.noPrint}`} onClick={(e) => e.stopPropagation()}>
      {podeAtivarTurno && (
        <button
          type="button"
          className={`${actionStyles.actionIconBtn} ${p.turno_atual ? actionStyles.actionIconBtnGold : ''}`}
          onClick={() => onAtivarTurno(p)}
          title="Definir como turno ativo atual"
        >
          <FaPlay />
        </button>
      )}

      {!isEditando && podeRolarDados && onRolarDados && (
        <button
          type="button"
          className={`${actionStyles.actionIconBtn} ${painelAberto === 'dados' ? actionStyles.actionIconBtnActive : ''}`}
          onClick={() => alternarPainel('dados')}
          title="Rolar dados"
          aria-expanded={painelAberto === 'dados'}
        >
          <FaDice />
          <span className={actionStyles.btnLabelDesktop}>Dados</span>
        </button>
      )}

      {isMestre && !isEditando && (
        <>
          {isInimigo && (
            <button
              type="button"
              className={`${actionStyles.actionIconBtn} ${actionStyles.actionIconBtnVillain} ${painelAberto === 'vilao' ? actionStyles.actionIconBtnVillainActive : ''}`}
              onClick={() => alternarPainel('vilao')}
              title="Painel Tático de Vilão"
              aria-expanded={painelAberto === 'vilao'}
            >
              <FaCrown />
              <span className={actionStyles.btnLabelDesktop}>Vilão</span>
            </button>
          )}

          <button
            type="button"
            className={`${actionStyles.actionIconBtn} ${painelAberto === 'recursos' ? actionStyles.actionIconBtnActive : ''}`}
            onClick={() => alternarPainel('recursos')}
            title="Ajustar PV, PM, IP e Fábula"
            aria-expanded={painelAberto === 'recursos'}
          >
            <FaSlidersH />
            <span className={actionStyles.btnLabelDesktop}>PV/PM</span>
          </button>

          <button
            type="button"
            className={`${actionStyles.actionIconBtn} ${painelAberto === 'condicoes' ? actionStyles.actionIconBtnActive : ''} ${condicoesAtivas.length > 0 ? actionStyles.actionIconBtnHasCond : ''}`}
            onClick={() => alternarPainel('condicoes')}
            title="Gerenciar Condições"
            aria-expanded={painelAberto === 'condicoes'}
          >
            <FaExclamationTriangle />
            <span className={actionStyles.btnLabelDesktop}>Status</span>
            {condicoesAtivas.length > 0 && <span className={actionStyles.condCountBadge}>{condicoesAtivas.length}</span>}
          </button>

          <div className={actionStyles.orderControls}>
            <button
              type="button"
              className={actionStyles.dragHandle}
              onPointerDown={(e) => onDragHandleDown?.(e, index)}
              onPointerMove={onDragHandleMove}
              onPointerUp={onDragHandleUp}
              onPointerCancel={onDragHandleCancel}
              title="Segure e arraste para reordenar"
              aria-label={`Reordenar ${p.nome}`}
            >
              <FaGripVertical />
            </button>
            <button
              type="button"
              className={`${actionStyles.miniControlBtn} ${actionStyles.deleteBtn}`}
              onClick={() => onIniciarExclusao(p)}
              title="Remover da cena"
            >
              <FaTrashAlt />
            </button>
          </div>
        </>
      )}

      {isMestre && isEditando && (
        <>
          <Button variant="core" size="sm" onClick={() => onSalvarEdicao(p.id)} title="Salvar">
            <FaCheck />
          </Button>
          <Button variant="danger" size="sm" onClick={onCancelarEdicao} title="Cancelar">
            <FaTimes />
          </Button>
        </>
      )}
    </div>
  );
}
