import { memo } from 'react';
import { MAP_DIMENSIONS } from '../../domain/map/mapRules';
import './MapGridLayer.css';

/**
 * Grade tática renderizada via SVG pattern ultra-leve na GPU.
 * Não causa re-renders e não polui o DOM com milhares de nós.
 */
function MapGridLayer({ gridSize = 240, visivel = true }) {
  if (!visivel) return null;

  return (
    <svg
      className="mapa-grid-layer"
      viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="aetheria-tactical-grid"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          {/* Célula quadrada com linhas douradas etéreas */}
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="var(--color-border-gold-muted)"
            strokeWidth="2"
            strokeOpacity="0.35"
          />
          {/* Marcador de interseção sutil */}
          <circle
            cx="0"
            cy="0"
            r="3"
            fill="var(--color-ether-cyan)"
            fillOpacity="0.4"
          />
        </pattern>
      </defs>
      <rect
        width={MAP_DIMENSIONS.width}
        height={MAP_DIMENSIONS.height}
        fill="url(#aetheria-tactical-grid)"
      />
    </svg>
  );
}

export default memo(MapGridLayer);
