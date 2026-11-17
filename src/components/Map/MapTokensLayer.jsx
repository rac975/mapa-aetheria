import { memo } from 'react';
import MapToken from './MapToken';

/**
 * Camada de Tokens Interativos (Aeronaves, Grupo, Ameaças).
 * Isolada para garantir que a movimentação de tokens não re-renderize os marcadores ou o mapa.
 */
function MapTokensLayer({
  tokens = [],
  visivel = true,
  mapContainerRef,
  onMoveEnd,
  onDragStart,
  onDragEnd,
  onSelectToken
}) {
  if (!visivel || !tokens || tokens.length === 0) return null;

  return (
    <div className="mapa-tokens-layer" aria-label="Camada de Tokens">
      {tokens.map((token) => (
        <MapToken
          key={token.id}
          token={token}
          mapContainerRef={mapContainerRef}
          onMoveEnd={onMoveEnd}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onSelect={onSelectToken}
        />
      ))}
    </div>
  );
}

export default memo(MapTokensLayer);
