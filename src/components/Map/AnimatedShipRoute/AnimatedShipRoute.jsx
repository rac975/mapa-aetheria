import { getTipoRotaInfo } from '../../../utils/rotasUtils';
import { FaShip } from 'react-icons/fa';
import './AnimatedShipRoute.css';

export default function AnimatedShipRoute({
  rotas,
  localizacoesMapa
}) {
  const MAP_WIDTH = 12800;
  const MAP_HEIGHT = 8533.3;

  return (
    <svg
      className="rotas-svg-overlay"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      {rotas.map((r, index) => {
        const origem = localizacoesMapa.find(
          t => Number(t.id) === Number(r.tita_origem_id)
        );

        const destino = localizacoesMapa.find(
          t => Number(t.id) === Number(r.tita_destino_id)
        );

        if (!origem || !destino) return null;

        const parseCoord = (val, maxVal) => {
          if (!val) return 0;
          const num = parseFloat(String(val).replace('%', '').trim());
          if (String(val).includes('%') || num <= 100) {
            return (num / 100) * maxVal;
          }
          return num;
        };

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
        const corRota = tipoInfo.cor || '#d4af37';
        const duracaoAnimacao = Math.max(8, r.dias_viagem * 3);

        return (
          <g key={r.id}>
            {/* Linha guia estática e leve */}
            <path
              d={linhaCurvaSvg}
              fill="none"
              stroke={corRota}
              strokeWidth="8"
              strokeOpacity="0.15"
            />

            {/* Trilha e Navio consolidados em um único grupo leve */}
            <g className="combo-navio">
              {/* Trilha luminosa em linha contínua (substitui dezenas de elipses) */}
              <line
                x1="-350"
                y1="0"
                x2="-10"
                y2="0"
                stroke={corRota}
                strokeWidth="12"
                strokeOpacity="0.35"
                strokeLinecap="round"
              />

              {/* Ícone do Barco */}
              <foreignObject x="-35" y="-35" width="70" height="70">
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    color: corRota,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))'
                  }}
                >
                  <FaShip />
                </div>
              </foreignObject>

              <animateMotion
                path={pathLoop}
                dur={`${duracaoAnimacao}s`}
                repeatCount="indefinite"
                rotate="auto"
                calcMode="linear"
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}