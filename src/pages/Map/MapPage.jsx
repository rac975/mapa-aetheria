import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FaSyncAlt, FaRoute } from 'react-icons/fa';
import { mapService } from '../../services/mapService';
import { useAlert } from '../../contexts/useAlert';
import TitanDetailSidebar from '../../components/TitanSidebar/TitanDetailSidebar';
import AnimatedShipRoute from '../../components/Map/AnimatedShipRoute/AnimatedShipRoute';
import './MapPage.css';

const getStatusBadge = (status) => {
  switch (status) {
    case 'pacifico':
      return { label: '🟢 Pacífico / Comércio Ativo', className: 'status-pacifico' };
    case 'perigo':
      return { label: '🔴 Sob Cerco / Perigo Iminente', className: 'status-perigo' };
    case 'corrompido':
      return { label: '🟣 Corrompido / Magia Arcana', className: 'status-corrompido' };
    case 'caido':
      return { label: '⚫ Caído / Destruído', className: 'status-caido' };
    default:
      return { label: '🟢 Pacífico / Comércio Ativo', className: 'status-pacifico' };
  }
};

const TitanMarker = memo(function TitanMarker({ local, baseUrl, registerRef, onSelect }) {
  const statusAtual = local.status || 'pacifico';
  const statusInfo = getStatusBadge(statusAtual);

  return (
    <div
      ref={(el) => registerRef(local.id, el)}
      className={`tita-overlay-item map-titan ${statusAtual === 'caido' ? 'titan-destruido' : ''}`}
      style={{
        '--titan-top': local.top,
        '--titan-left': local.left_pos || local.left,
        '--titan-width': local.width
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(local);
      }}
    >
      <img
        src={`${baseUrl}assets/imagens/titans/${local.id}.png`}
        alt={local.titulo}
        decoding="async"
      />
      <span className={`titan-status-dot ${statusInfo.className}`} title={statusInfo.label} />
    </div>
  );
});

export default function MapPage({ isMestre }) {
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [localizacoesMapa, setLocalizacoesMapa] = useState([]);
  const [rotas, setRotas] = useState([]);
  const [mostrarRotas, setMostrarRotas] = useState(true);
  const [loading, setLoading] = useState(true);

  const { showAlert } = useAlert();
  const transformRef = useRef(null);
  const controlsRef = useRef(null);
  const titanRefs = useRef({});
  const resetTimerRef = useRef(null);

  const baseUrl = import.meta.env.BASE_URL;

  const registerTitanRef = useCallback((id, el) => {
    if (el) {
      titanRefs.current[id] = el;
    } else {
      delete titanRefs.current[id];
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function fetchData() {
      try {
        const { titans, rotas: rotasData, error } = await mapService.getDadosMapa();
        if (!ativo) return;
        if (error) throw error;
        setLocalizacoesMapa(titans);
        setRotas(rotasData);
      } catch (err) {
        console.error('Erro ao carregar dados do mapa:', err.message);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    fetchData();
    return () => {
      ativo = false;
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

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
      controlsRef.current?.resetTransform(350, 'easeOut');
    }, 220);
  }, []);

  const handleStatusChange = useCallback(async (id, novoStatus) => {
    try {
      const { error } = await mapService.atualizarStatusTitan(id, novoStatus);
      if (error) throw error;

      setLocalizacoesMapa((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: novoStatus } : t))
      );

      setLocalSelecionado((prev) =>
        prev && prev.id === id ? { ...prev, status: novoStatus } : prev
      );
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err.message);
      showAlert({
        title: 'Erro de Permissão',
        type: 'error',
        message: 'Erro ao salvar alteração. Verifique se você está logado como Mestre.'
      });
    }
  }, [showAlert]);

  if (loading) {
    return (
      <div className="mapa-wrapper mapa-loading">
        Carregando mapa de Aetheria...
      </div>
    );
  }

  return (
    <div className={`mapa-wrapper ${localSelecionado ? 'sidebar-ativa' : ''}`}>
      <div className="mapa-container-externo">
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={8}
          centerOnInit
          centerZoomedOut
          wheel={{ step: 0.05, smoothStep: 0.005 }}
        >
          {(controls) => {
            controlsRef.current = controls;

            return (
              <>
                <div className="zoom-controls">
                  <button type="button" onClick={() => controls.zoomIn(0.2)} title="Aproximar">+</button>
                  <button type="button" onClick={() => controls.zoomOut(0.2)} title="Afastar">-</button>
                  <button type="button" onClick={fecharSidebar} title="Resetar Visão">
                    <FaSyncAlt />
                  </button>
                  <button
                    type="button"
                    className={mostrarRotas ? 'rotas-ativo' : ''}
                    onClick={() => setMostrarRotas((prev) => !prev)}
                    title={mostrarRotas ? 'Ocultar Rotas no Mapa' : 'Mostrar Rotas no Mapa'}
                  >
                    <FaRoute />
                  </button>
                </div>

                <div className="mapa-container">
                  <TransformComponent>
                    <div className="mapa-base">
                      <picture>
                        <source srcSet={`${baseUrl}assets/imagens/mapa-aetheria.webp`} type="image/webp" />
                        <img
                          src={`${baseUrl}assets/imagens/mapa-aetheria.webp`}
                          alt="Mapa de Aetheria"
                          className="mapa-imagem"
                          width="12800"
                          height="8533.3"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      </picture>

                      {mostrarRotas && (
                        <AnimatedShipRoute
                          rotas={rotas}
                          localizacoesMapa={localizacoesMapa}
                        />
                      )}

                      {localizacoesMapa.map((local) => (
                        <TitanMarker
                          key={local.id}
                          local={local}
                          baseUrl={baseUrl}
                          registerRef={registerTitanRef}
                          onSelect={focarNoTita}
                        />
                      ))}
                    </div>
                  </TransformComponent>
                </div>
              </>
            );
          }}
        </TransformWrapper>
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
