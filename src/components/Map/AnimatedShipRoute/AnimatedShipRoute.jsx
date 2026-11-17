import { memo, useMemo } from 'react';
import { getTipoRotaInfo } from '../../../utils/rotasUtils';
import './AnimatedShipRoute.css';

const MAP_WIDTH = 12800;
const MAP_HEIGHT = 8533.3;

const parseCoord = (val, maxVal) => {
  if (!val) return 0;
  const num = parseFloat(String(val).replace('%', '').trim());
  if (String(val).includes('%') || num <= 100) {
    return (num / 100) * maxVal;
  }
  return num;
};

function AnimatedShipRoute({ rotas = [], localizacoesMapa = [] }) {
  const rotasProcessadas = useMemo(() => {
    if (!rotas.length || !localizacoesMapa.length) return [];

    const locationsMap = new Map(localizacoesMapa.map((t) => [Number(t.id), t]));

    return rotas
      .map((r, index) => {
        const origem = locationsMap.get(Number(r.tita_origem_id));
        const destino = locationsMap.get(Number(r.tita_destino_id));
        if (!origem || !destino) return null;

        const x1 = parseCoord(origem.left_pos || origem.left, MAP_WIDTH);
        const y1 = parseCoord(origem.top, MAP_HEIGHT);
        const x2 = parseCoord(destino.left_pos || destino.left, MAP_WIDTH);
        const y2 = parseCoord(destino.top, MAP_HEIGHT);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const offsetX = (index % 2 === 0 ? 1 : -1) * (index * 150 + 100);
        const offsetY = (index % 2 === 0 ? -1 : 1) * (index * 150 + 100);
        const controlX = midX + offsetX;
        const controlY = midY + offsetY;

        const linhaCurvaSvg = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
        const pathLoop = `${linhaCurvaSvg} Q ${controlX} ${controlY} ${x1} ${y1}`;
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
  }, [rotas, localizacoesMapa]);

  if (rotasProcessadas.length === 0) return null;

  return (
    <svg
      className="rotas-svg-overlay"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
    >
      {rotasProcessadas.map((r) => (
        <g key={r.id}>
          <path
            d={r.linhaCurvaSvg}
            fill="none"
            stroke={r.corRota}
            strokeWidth="8"
            strokeOpacity="0.15"
            shapeRendering="optimizeSpeed"
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
