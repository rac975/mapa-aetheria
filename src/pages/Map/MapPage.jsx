import { useState, useRef, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase } from '../../services/supabase';
import TitanDetailSidebar from '../../components/TitanSidebar/TitanDetailSidebar';
import AnimatedShipRoute from '../../components/Map/AnimatedShipRoute/AnimatedShipRoute';
import CustomAlert from '../../components/CustomAlert/CustomAlert';
import './MapPage.css';
import { FaSyncAlt, FaRoute } from "react-icons/fa";

function MapPage({ isMestre }) {
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [localizacoesMapa, setLocalizacoesMapa] = useState([]);
  const [rotas, setRotas] = useState([]);
  const [mostrarRotas, setMostrarRotas] = useState(true);
  const [loading, setLoading] = useState(true);

  // Estado para o alerta customizado
  const [alerta, setAlerta] = useState({ isOpen: false, title: '', message: '' });

  const transformRef = useRef(null);
  const controlsRef = useRef(null);
  const titanRefs = useRef({});

  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    async function fetchData() {
      try {
        const [resTitans, resRotas] = await Promise.all([
          supabase.from('titans').select('*').order('id', { ascending: true }),
          supabase.from('rotas_titas').select('*')
        ]);

        if (resTitans.error) throw resTitans.error;
        if (resTitans.data) setLocalizacoesMapa(resTitans.data);
        if (resRotas.data) setRotas(resRotas.data);
      } catch (err) {
        console.error("Erro ao carregar dados do mapa:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!localSelecionado || !transformRef.current) return;

    const elementoTitan = titanRefs.current[localSelecionado.id];
    if (!elementoTitan) return;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          transformRef.current.zoomToElement(
            elementoTitan,
            2.5,
            400,
            "easeOut"
          );
        } catch (e) {
          console.error("Erro ao dar zoom no elemento:", e);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSelecionado]);

  const focarNoTita = useCallback((local) => {
    setLocalSelecionado(local);
  }, []);

  const fecharSidebar = useCallback(() => {
    setLocalSelecionado(null);

    setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.resetTransform(400, "easeOut");
      }
    }, 300);
  }, []);

  const handleStatusChange = async (id, novoStatus) => {
    try {
      const { error } = await supabase
        .from('titans')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;

      setLocalizacoesMapa(prev =>
        prev.map(t => t.id === id ? { ...t, status: novoStatus } : t)
      );

      if (localSelecionado && localSelecionado.id === id) {
        setLocalSelecionado(prev => ({ ...prev, status: novoStatus }));
      }
    } catch (err) {
      console.error("Erro ao atualizar status no Supabase:", err.message);
      setAlerta({
        isOpen: true,
        title: 'Erro de Permissão',
        message: 'Erro ao salvar alteração. Verifique se você está logado como Mestre.'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pacifico': return { label: '🟢 Pacífico / Comércio Ativo', class: 'status-pacifico' };
      case 'perigo': return { label: '🔴 Sob Cerco / Perigo Iminente', class: 'status-perigo' };
      case 'corrompido': return { label: '🟣 Corrompido / Magia Arcana', class: 'status-corrompido' };
      case 'caido': return { label: '⚫ Caído / Destruído', class: 'status-caido' };
      default: return { label: '🟢 Pacífico / Comércio Ativo', class: 'status-pacifico' };
    }
  };

  if (loading) {
    return (
      <div className="mapa-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#d4af37', height: '100vh' }}>
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
                  <button
                    type="button"
                    onClick={() => {
                      fecharSidebar();
                    }}
                    title="Resetar Visão"
                  >
                    <FaSyncAlt />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarRotas(prev => !prev)}
                    title={mostrarRotas ? "Ocultar Rotas no Mapa" : "Mostrar Rotas no Mapa"}
                    style={{ background: mostrarRotas ? '#d4af37' : '#161b22', color: mostrarRotas ? '#0d0f18' : '#d4af37' }}
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
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>

                      {mostrarRotas && (
                        <AnimatedShipRoute
                          rotas={rotas}
                          localizacoesMapa={localizacoesMapa}
                        />
                      )}

                      {/* MARCADORES DOS TITÃS */}
                      {localizacoesMapa.map((local) => {
                        const imgUrl = `${baseUrl}assets/imagens/titans/${local.id}.png`;
                        const statusAtual = local.status || 'pacifico';
                        const statusInfo = getStatusBadge(statusAtual);

                        return (
                          <div
                            key={local.id}
                            ref={(el) => (titanRefs.current[local.id] = el)}
                            className={`tita-overlay-item map-titan ${statusAtual === 'caido' ? 'titan-destruido' : ''}`}
                            style={{
                              top: local.top,
                              left: local.left_pos || local.left,
                              width: local.width
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              focarNoTita(local);
                            }}
                          >
                            <img src={imgUrl} alt={local.titulo} loading="lazy" decoding="async" />
                            <span className={`titan-status-dot ${statusInfo.class}`} title={statusInfo.label} />
                          </div>
                        );
                      })}
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

      <CustomAlert 
        isOpen={alerta.isOpen}
        title={alerta.title}
        message={alerta.message}
        onClose={() => setAlerta({ ...alerta, isOpen: false })}
      />
    </div>
  );
}

export default MapPage;