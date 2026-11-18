import { memo, useCallback } from 'react';
import { FaSyncAlt, FaRoute, FaTh, FaChessKnight, FaPlus, FaMinus, FaTrophy } from 'react-icons/fa';
import { useEasterEggFanfarra } from '../../hooks/useEasterEggFanfarra';
import './MapControls.css';

/**
 * Controles de zoom, reset e alternância de camadas do Mapa de Aetheria.
 * Inclui o Easter Egg da Fanfarra de Vitória ativado pelo combo nos botões de zoom.
 * Memoizado para não sofrer re-renders quando o mapa se move.
 */
function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  showRotas = true,
  onToggleRotas,
  showGrid = false,
  onToggleGrid,
  showTokens = true,
  onToggleTokens
}) {
  const { fanfarraAtiva, dispararAcao } = useEasterEggFanfarra();

  const handleZoomInClick = useCallback(
    (e) => {
      dispararAcao('in');
      onZoomIn?.(e);
    },
    [dispararAcao, onZoomIn]
  );

  const handleZoomOutClick = useCallback(
    (e) => {
      dispararAcao('out');
      onZoomOut?.(e);
    },
    [dispararAcao, onZoomOut]
  );

  return (
    <div
      className={`zoom-controls ${fanfarraAtiva ? 'fanfarra-ativa' : ''}`}
      role="toolbar"
      aria-label="Controles do Mapa"
    >
      {fanfarraAtiva && (
        <div className="fanfarra-banner" aria-live="polite">
          <FaTrophy className="fanfarra-icone" />
          <span className="fanfarra-texto">VITÓRIA!</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleZoomInClick}
        title="Aproximar Visão"
        aria-label="Aproximar Visão"
      >
        <FaPlus />
      </button>
      <button
        type="button"
        onClick={handleZoomOutClick}
        title="Afastar Visão"
        aria-label="Afastar Visão"
      >
        <FaMinus />
      </button>
      <button
        type="button"
        onClick={onReset}
        title="Resetar Visão Geral"
        aria-label="Resetar Visão Geral"
      >
        <FaSyncAlt />
      </button>

      <div className="divisor-controles" />

      <button
        type="button"
        className={showRotas ? 'ativo' : ''}
        onClick={onToggleRotas}
        title={showRotas ? 'Ocultar Rotas de Navios' : 'Exibir Rotas de Navios'}
        aria-label="Alternar Rotas Aéreas"
      >
        <FaRoute />
      </button>

      <button
        type="button"
        className={showGrid ? 'ativo' : ''}
        onClick={onToggleGrid}
        title={showGrid ? 'Ocultar Grade Tática' : 'Exibir Grade Tática'}
        aria-label="Alternar Grade Tática"
      >
        <FaTh />
      </button>

      <button
        type="button"
        className={showTokens ? 'ativo' : ''}
        onClick={onToggleTokens}
        title={showTokens ? 'Ocultar Tokens Móveis' : 'Exibir Tokens Móveis'}
        aria-label="Alternar Tokens"
      >
        <FaChessKnight />
      </button>
    </div>
  );
}

export default memo(MapControls);
