import { memo, useMemo } from 'react';
import { getTipoRotaInfo } from '../../../utils/rotasUtils';
import { MAP_DIMENSIONS, calcularCurvaRota } from '../../../domain/map/mapRules';
import './AnimatedShipRoute.css';

/**
 * Camada de Rotas Aéreas e Navegação em Aetheria.
 * Renderiza caminhos curvilíneos com animação de embarcações aéreas.
 * Memoizado para ignorar mudanças de status dos Titãs que não afetam as coordenadas geográficas.
 */
function AnimatedShipRoute({ rotas = [], localizacoesMapa = [] }) {
  // Cria uma assinatura das coordenadas dos titãs para evitar recálculo de rotas
  // quando apenas o status geopolítico de um titã mudar
  const coordenadasMap = useMemo(() => {
    const map = new Map();
    for (const t of localizacoesMapa) {
      map.set(Number(t.id), {
        id: Number(t.id),
        left: t.left_pos || t.left,
        top: t.top
      });
    }
    return map;
  }, [localizacoesMapa]);

  const rotasProcessadas = useMemo(() => {
    if (!rotas.length || coordenadasMap.size === 0) return [];

    return rotas
      .map((r, index) => {
        const origem = coordenadasMap.get(Number(r.tita_origem_id));
        const destino = coordenadasMap.get(Number(r.tita_destino_id));
        if (!origem || !destino) return null;

        const { linhaCurvaSvg, pathLoop } = calcularCurvaRota(
          origem,
          destino,
          index,
          MAP_DIMENSIONS.width,
          MAP_DIMENSIONS.height
        );
        const tipoInfo = getTipoRotaInfo(r.tipo_rota);

        return {
          id: r.id,
          linhaCurvaSvg,
          pathLoop,
          corRota: tipoInfo.cor || '#d4af37',
          duracaoAnimacao: Math.max(8, (Number(r.dias_viagem) || 2) * 3)
        };
      })
      .filter(Boolean);
  }, [rotas, coordenadasMap]);

  if (rotasProcessadas.length === 0) return null;

  return (
    <svg
      className="rotas-svg-overlay"
      viewBox={`0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`}
      shapeRendering="optimizeSpeed"
      aria-hidden="true"
    >
      {rotasProcessadas.map((r) => (
        <g key={r.id}>
          <path
            d={r.linhaCurvaSvg}
            fill="none"
            stroke={r.corRota}
            strokeWidth="8"
            strokeOpacity="0.15"
          />

          <g className="combo-navio">
            <line
              x1="-350"
              y1="0"
              x2="-10"
              y2="0"
              stroke={r.corRota}
              strokeWidth="12"
              strokeOpacity="0.35"
              strokeLinecap="round"
            />
            <path
              d="M -25 -12 L 25 0 L -25 12 L -15 0 Z"
              fill={r.corRota}
              stroke="#0d0f18"
              strokeWidth="3"
              transform="rotate(90)"
            />
            <animateMotion
              path={r.pathLoop}
              dur={`${r.duracaoAnimacao}s`}
              repeatCount="indefinite"
              rotate="auto"
              calcMode="linear"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

export default memo(AnimatedShipRoute);
