import { useState, useRef, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useAlert } from '../../contexts/useAlert';
import { useMapData } from '../../hooks/useMapData';
import { useMapTokens } from '../../hooks/useMapTokens';
import { useMapLayers } from '../../hooks/useMapLayers';
import MapBaseLayer from '../../components/Map/MapBaseLayer';
import MapGridLayer from '../../components/Map/MapGridLayer';
import MapMarkersLayer from '../../components/Map/MapMarkersLayer';
import MapTokensLayer from '../../components/Map/MapTokensLayer';
import MapControls from '../../components/Map/MapControls';
import AnimatedShipRoute from '../../components/Map/AnimatedShipRoute/AnimatedShipRoute';
import TitanDetailSidebar from '../../components/TitanSidebar/TitanDetailSidebar';
import './MapPage.css';

/**
 * Componente principal do Mapa Interativo de Aetheria (AetheriaMap).
 * Refatorado para alto desempenho (60fps), arquitetura em camadas e memoização granular.
 */
export default function MapPage({ isMestre }) {
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [isDraggingToken, setIsDraggingToken] = useState(false);

  const { showAlert } = useAlert();
  const { titans, rotas, isLoading, updateTitanStatus } = useMapData();
  const { tokens, moveToken } = useMapTokens();
  const {
    showRotas,
    showGrid,
    showTokens,
    gridSize,
    toggleRotas,
    toggleGrid,
    toggleTokens
  } = useMapLayers();

  const transformRef = useRef(null);
  const titanRefs = useRef({});
  const mapContainerRef = useRef(null);
  const resetTimerRef = useRef(null);

  const baseUrl = import.meta.env.BASE_URL;

  const registerTitanRef = useCallback((id, el) => {
    if (el) {
      titanRefs.current[id] = el;
    } else {
      delete titanRefs.current[id];
    }
  }, []);

  // Zoom suave no Titã selecionado
  useEffect(() => {
    if (!localSelecionado || !transformRef.current) return;

    const elementoTitan = titanRefs.current[localSelecionado.id];
    if (!elementoTitan) return;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          transformRef.current?.zoomToElement(elementoTitan, 2.5, 400, 'easeOut');
        } catch (e) {
          console.error('Erro ao dar zoom no elemento:', e);
        }
      });
    }, 220);

    return () => clearTimeout(timer);
  }, [localSelecionado]);

  const focarNoTita = useCallback((local) => {
    setLocalSelecionado(local);
  }, []);

  const fecharSidebar = useCallback(() => {
    setLocalSelecionado(null);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    resetTimerRef.current = setTimeout(() => {
      transformRef.current?.resetTransform(350, 'easeOut');
    }, 220);
  }, []);

  const handleZoomIn = useCallback(() => {
    transformRef.current?.zoomIn(0.25);
  }, []);

  const handleZoomOut = useCallback(() => {
    transformRef.current?.zoomOut(0.25);
  }, []);

  const handleDragTokenStart = useCallback(() => {
    setIsDraggingToken(true);
  }, []);

  const handleDragTokenEnd = useCallback(() => {
    setIsDraggingToken(false);
  }, []);

  const handleStatusChange = useCallback(
    async (id, novoStatus) => {
      const { success } = await updateTitanStatus(id, novoStatus);
      if (success) {
        setLocalSelecionado((prev) =>
          prev && prev.id === id ? { ...prev, status: novoStatus } : prev
        );
      } else {
        showAlert({
          title: 'Erro de Permissão',
          type: 'error',
          message: 'Erro ao salvar alteração. Verifique se você está logado como Mestre.'
        });
      }
    },
    [updateTitanStatus, showAlert]
  );

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mapa-wrapper mapa-loading">
        Carregando mapa de Aetheria...
      </div>
    );
  }

  return (
    <div className={`mapa-wrapper ${localSelecionado ? 'sidebar-ativa' : ''}`}>
      <div className="mapa-container-externo">
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={fecharSidebar}
          showRotas={showRotas}
          onToggleRotas={toggleRotas}
          showGrid={showGrid}
          onToggleGrid={toggleGrid}
          showTokens={showTokens}
          onToggleTokens={toggleTokens}
        />

        <div className="mapa-container">
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={1}
            maxScale={8}
            centerOnInit
            centerZoomedOut
            panning={{ disabled: isDraggingToken, velocityDisabled: true }}
            wheel={{ step: 0.08, smoothStep: 0.003 }}
            doubleClick={{ disabled: false, step: 0.7 }}
          >
            <TransformComponent>
              <div ref={mapContainerRef} className="mapa-base">
                {/* Camada 0: Base do Mapa com carregamento progressivo */}
                <MapBaseLayer baseUrl={baseUrl} />

                {/* Camada 1: Grade Tática SVG acelerada na GPU */}
                <MapGridLayer gridSize={gridSize} visivel={showGrid} />

                {/* Camada 2: Rotas de Navios Aéreos com animação contínua */}
                {showRotas && (
                  <AnimatedShipRoute
                    rotas={rotas}
                    localizacoesMapa={titans}
                  />
                )}

                {/* Camada 3: Marcadores geopolíticos dos Titãs */}
                <MapMarkersLayer
                  titans={titans}
                  baseUrl={baseUrl}
                  selectedId={localSelecionado?.id}
                  registerRef={registerTitanRef}
                  onSelect={focarNoTita}
                />

                {/* Camada 4: Tokens interativos com movimentação fluida (60fps) */}
                <MapTokensLayer
                  tokens={tokens}
                  visivel={showTokens}
                  mapContainerRef={mapContainerRef}
                  onMoveEnd={moveToken}
                  onDragStart={handleDragTokenStart}
                  onDragEnd={handleDragTokenEnd}
                />
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>

      <TitanDetailSidebar
        titan={localSelecionado}
        isMestre={isMestre}
        onClose={fecharSidebar}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

export { MapPage as AetheriaMap };
