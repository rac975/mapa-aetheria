import { memo } from 'react';
import TitanMarker from './TitanMarker';

/**
 * Camada de marcadores de Titãs.
 * Memoizada para evitar recálculos quando outras camadas (como grid ou tokens) se alteram.
 */
function MapMarkersLayer({
  titans = [],
  baseUrl = '',
  selectedId = null,
  registerRef,
  onSelect
}) {
  if (!titans || titans.length === 0) return null;

  return (
    <div className="mapa-markers-layer" aria-label="Marcadores de Titãs">
      {titans.map((local) => (
        <TitanMarker
          key={local.id}
          local={local}
          baseUrl={baseUrl}
          isSelected={selectedId === local.id}
          registerRef={registerRef}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default memo(MapMarkersLayer);
