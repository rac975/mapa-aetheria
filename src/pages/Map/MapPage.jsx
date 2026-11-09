import { useState, useRef, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { supabase } from '../../services/supabase';
import TitanDetailSidebar from '../../components/TitanSidebar/TitanDetailSidebar';
import './MapPage.css';
import { FaSyncAlt } from "react-icons/fa";

function MapPage({ isMestre }) {
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const [localizacoesMapa, setLocalizacoesMapa] = useState([]);
  const [loading, setLoading] = useState(true);

  const transformRef = useRef(null);
  const controlsRef = useRef(null);
  const titanRefs = useRef({});

  const baseUrl = import.meta.env.BASE_URL;

  // 1. Carregar dados do Supabase
  useEffect(() => {
    async function fetchTitans() {
      try {
        const { data, error } = await supabase.from('titans').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (data) setLocalizacoesMapa(data);
      } catch (err) {
        console.error("Erro ao carregar titãs do Supabase:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTitans();
  }, []);

  // 2. Focar no item selecionado com tratamento seguro
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

  // Fechar sidebar de forma fluida usando o reset nativo e aguardando o layout do CSS
  const fecharSidebar = useCallback(() => {
    setLocalSelecionado(null);
    
    // Aguarda o CSS do wrapper (.mapa-wrapper) terminar a transição da sidebar (300ms)
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
      alert("Erro ao salvar alteração. Verifique se você está logado como Mestre.");
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
                        />
                      </picture>

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
                            <img src={imgUrl} alt={local.titulo} />
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
    </div>
  );
}

export default MapPage;