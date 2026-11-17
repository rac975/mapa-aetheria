import { memo } from 'react';
import { FaSyncAlt, FaRoute, FaTh, FaChessKnight, FaPlus, FaMinus } from 'react-icons/fa';
import './MapControls.css';

/**
 * Controles de zoom, reset e alternância de camadas do Mapa de Aetheria.
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
  return (
    <div className="zoom-controls" role="toolbar" aria-label="Controles do Mapa">
      <button type="button" onClick={onZoomIn} title="Aproximar Visão" aria-label="Aproximar Visão">
        <FaPlus />
      </button>
      <button type="button" onClick={onZoomOut} title="Afastar Visão" aria-label="Afastar Visão">
        <FaMinus />
      </button>
      <button type="button" onClick={onReset} title="Resetar Visão Geral" aria-label="Resetar Visão Geral">
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
