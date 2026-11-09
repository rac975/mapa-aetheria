import { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { localizacoesMapa } from '../../data/mapData';
import './MapPage.css';
import { FaSyncAlt } from "react-icons/fa";

function MapPage() {
  const [localSelecionado, setLocalSelecionado] = useState(null);
  const paralaxeRef = useRef(null);

  // Garante que o caminho base respeite a configuração do projeto no Vite
  const baseUrl = import.meta.env.BASE_URL;

  const handleMouseMove = (e) => {
    if (!paralaxeRef.current) return;
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 8;
    const y = (clientY / window.innerHeight - 0.5) * 8;
    paralaxeRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  return (
    <div className="mapa-wrapper">
      <div className="mapa-container-externo">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={8}
          centerOnInit
          centerZoomedOut
          wheel={{ step: 0.01, smoothStep: 0.001, wheelDisabled: false, touchPadDisabled: false }}
          onTransformed={(ref) => {
            const isZoomed = ref.state.scale > 1.01;
            document.documentElement.style.setProperty('--map-max-height', isZoomed ? '100%' : 'calc(100vh - 24px)');
            document.documentElement.style.setProperty('--map-max-width', isZoomed ? '100%' : '100%');
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="zoom-controls">
                <button type="button" onClick={() => zoomIn(0.2)} title="Aproximar">+</button>
                <button type="button" onClick={() => zoomOut(0.2)} title="Afastar">-</button>
                <button type="button" onClick={() => resetTransform()} title="Resetar Visão"><FaSyncAlt /></button>
              </div>

              <div className="mapa-container" onMouseMove={handleMouseMove}>
                <TransformComponent>
                  <div className='mapa-base'>
                    <div ref={paralaxeRef} className="mapa-camada-paralaxe">
                      
                      {/* Mapa principal */}
                      <picture>
                        <source srcSet={`${baseUrl}assets/imagens/mapa-aetheria.webp`} type="image/webp" />
                        <img
                          src={`${baseUrl}assets/imagens/mapa-aetheria.webp`}
                          alt="Mapa de Aetheria"
                          className="mapa-imagem"
                          width="12800"
                          height="8533.3"
                          onError={(e) => console.error("ERRO AO CARREGAR O MAPA:", e.target.src)}
                        />
                      </picture>

                      {/* Titãs do mapa */}
                      {localizacoesMapa.map((local) => {
                        const imgUrl = `${baseUrl}assets/imagens/titans/${local.id}.png`;

                        return (
                          <div
                            key={local.id}
                            className="tita-overlay-item map-titan"
                            style={{
                              top: local.top,
                              left: local.left,
                              width: local.width
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalSelecionado(local);
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={local.titulo}
                              onError={(e) => {
                                console.error(`ERRO AO CARREGAR O TITÃ ID ${local.id} em:`, e.target.src);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TransformComponent>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Modal de Detalhes */}
      {localSelecionado && (
        <div className="modal-overlay" onClick={() => setLocalSelecionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLocalSelecionado(null)}>&times;</button>
            <span className="modal-faccao">{localSelecionado.faccao}</span>
            <h2>{localSelecionado.titulo}</h2>
            <p><strong>Descrição:</strong> {localSelecionado.descricao}</p>
            {localSelecionado.industria && <p><strong>Indústria/Ambiente:</strong> {localSelecionado.industria}</p>}
            {localSelecionado.habitantes && <p><strong>Habitantes/Sociedade:</strong> {localSelecionado.habitantes}</p>}
            {localSelecionado.funcao && <p><strong>Função:</strong> {localSelecionado.funcao}</p>}
            {localSelecionado.seguranca && <p><strong>Segurança:</strong> {localSelecionado.seguranca}</p>}
            {localSelecionado.destaque && <p><strong>Destaque:</strong> {localSelecionado.destaque}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;