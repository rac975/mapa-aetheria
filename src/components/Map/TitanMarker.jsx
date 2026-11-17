import { memo, useCallback, useState } from 'react';
import { getStatusBadge } from '../../domain/map/mapRules';

/**
 * Marcador individual de Titã com lazy loading, fallback de imagem e memoização estrita.
 */
function TitanMarker({ local, baseUrl, isSelected = false, registerRef, onSelect }) {
  const [imgErro, setImgErro] = useState(false);
  const statusAtual = local.status || 'pacifico';
  const statusInfo = getStatusBadge(statusAtual);

  const setNodeRef = useCallback(
    (el) => {
      if (registerRef) {
        registerRef(local.id, el);
      }
    },
    [registerRef, local.id]
  );

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(local);
      }
    },
    [onSelect, local]
  );

  const handleImageError = useCallback(() => {
    setImgErro(true);
  }, []);

  return (
    <div
      ref={setNodeRef}
      className={`tita-overlay-item map-titan ${statusAtual === 'caido' ? 'titan-destruido' : ''} ${
        isSelected ? 'titan-selecionado' : ''
      }`}
      style={{
        '--titan-top': local.top,
        '--titan-left': local.left_pos || local.left,
        '--titan-width': local.width || '4%'
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Titã ${local.titulo || local.id} - ${statusInfo.label}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {!imgErro ? (
        <img
          src={`${baseUrl}assets/imagens/titans/${local.id}.png`}
          alt={local.titulo || `Titã ${local.id}`}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      ) : (
        <div className="titan-fallback-avatar">
          <span>{String(local.titulo || local.id).charAt(0).toUpperCase()}</span>
        </div>
      )}
      <span className={`titan-status-dot ${statusInfo.className}`} title={statusInfo.label} />
    </div>
  );
}

function areEqual(prev, next) {
  return (
    prev.local.id === next.local.id &&
    prev.local.status === next.local.status &&
    prev.local.top === next.local.top &&
    (prev.local.left_pos || prev.local.left) === (next.local.left_pos || next.local.left) &&
    prev.local.width === next.local.width &&
    prev.isSelected === next.isSelected &&
    prev.baseUrl === next.baseUrl &&
    prev.onSelect === next.onSelect &&
    prev.registerRef === next.registerRef
  );
}

export default memo(TitanMarker, areEqual);
