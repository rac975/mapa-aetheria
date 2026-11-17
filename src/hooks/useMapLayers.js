import { useState, useCallback } from 'react';

/**
 * Hook para controle de visibilidade das camadas visuais do mapa (Rotas, Grade Tática e Tokens).
 */
export function useMapLayers() {
  const [showRotas, setShowRotas] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showTokens, setShowTokens] = useState(true);
  const [gridSize, setGridSize] = useState(240);

  const toggleRotas = useCallback(() => {
    setShowRotas((prev) => !prev);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  const toggleTokens = useCallback(() => {
    setShowTokens((prev) => !prev);
  }, []);

  return {
    showRotas,
    showGrid,
    showTokens,
    gridSize,
    setGridSize,
    toggleRotas,
    toggleGrid,
    toggleTokens
  };
}
