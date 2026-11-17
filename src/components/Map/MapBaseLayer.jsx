import { memo, useState, useCallback } from 'react';
import './MapBaseLayer.css';

/**
 * Camada base do mapa de Aetheria com suporte a carregamento progressivo,
 * renderização acelerada por GPU e decoding assíncrono.
 */
function MapBaseLayer({ baseUrl = '' }) {
  const [carregado, setCarregado] = useState(false);

  const handleImageLoad = useCallback(() => {
    setCarregado(true);
  }, []);

  return (
    <div className="mapa-base-layer">
      {!carregado && (
        <div className="mapa-base-placeholder mapa-shimmer-pulse">
          <span>Decodificando cartografia de Aetheria...</span>
        </div>
      )}
      <picture>
        <source srcSet={`${baseUrl}assets/imagens/mapa-aetheria.webp`} type="image/webp" />
        <img
          src={`${baseUrl}assets/imagens/mapa-aetheria.webp`}
          alt="Mapa de Aetheria"
          className={`mapa-imagem ${carregado ? 'carregada' : ''}`}
          width="12800"
          height="8533.3"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          onLoad={handleImageLoad}
        />
      </picture>
    </div>
  );
}

export default memo(MapBaseLayer);
