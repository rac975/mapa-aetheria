/**
 * Regras e utilitários puros de cálculo e geometria para o Mapa Interativo de Aetheria.
 * Isolado de React e Supabase conforme GEMINI.md.
 */

export const MAP_DIMENSIONS = {
  width: 12800,
  height: 8533.3,
  aspectRatio: 12800 / 8533.3
};

/**
 * Converte valor numérico ou porcentagem em coordenada absoluta em pixels.
 * @param {number|string} val
 * @param {number} maxVal
 * @returns {number}
 */
export function parseCoord(val, maxVal) {
  if (val === null || val === undefined || val === '') return 0;
  const num = parseFloat(String(val).replace('%', '').trim());
  if (isNaN(num)) return 0;
  if (String(val).includes('%') || num <= 100) {
    return (num / 100) * maxVal;
  }
  return num;
}

/**
 * Converte coordenada absoluta em pixels para porcentagem relativa (0 a 100).
 * @param {number} px
 * @param {number} maxVal
 * @returns {number}
 */
export function coordPxToPercent(px, maxVal) {
  if (!maxVal || maxVal <= 0) return 0;
  const clamped = Math.max(0, Math.min(px, maxVal));
  return Number(((clamped / maxVal) * 100).toFixed(3));
}

/**
 * Ajusta coordenadas para a grade tática mais próxima (Snap to Grid).
 * @param {number} valPercent - Valor percentual (0 a 100)
 * @param {number} maxVal - Dimensão máxima correspondente (width ou height)
 * @param {number} stepPx - Tamanho da célula da grade em pixels
 * @returns {number} Novo valor percentual ajustado à grade
 */
export function snapToGrid(valPercent, maxVal, stepPx = 160) {
  if (!stepPx || stepPx <= 0 || !maxVal) return valPercent;
  const currentPx = parseCoord(valPercent, maxVal);
  const snappedPx = Math.round(currentPx / stepPx) * stepPx;
  return coordPxToPercent(snappedPx, maxVal);
}

/**
 * Calcula a distância euclidiana entre dois pontos em pixels no mapa.
 * @param {{ left: number|string, top: number|string }} p1
 * @param {{ left: number|string, top: number|string }} p2
 * @param {number} width
 * @param {number} height
 * @returns {number} Distância em pixels
 */
export function calcularDistanciaEntrePontos(p1, p2, width = MAP_DIMENSIONS.width, height = MAP_DIMENSIONS.height) {
  const x1 = parseCoord(p1.left_pos || p1.left, width);
  const y1 = parseCoord(p1.top, height);
  const x2 = parseCoord(p2.left_pos || p2.left, width);
  const y2 = parseCoord(p2.top, height);

  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

/**
 * Retorna as informações do badge de status do Titã.
 * @param {string} status
 * @returns {{ label: string, className: string }}
 */
export function getStatusBadge(status) {
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
}

/**
 * Calcula os parâmetros de curva quadrática para rotas aéreas.
 * @param {object} origem
 * @param {object} destino
 * @param {number} index
 * @param {number} width
 * @param {number} height
 * @returns {{ linhaCurvaSvg: string, pathLoop: string, distancia: number }}
 */
export function calcularCurvaRota(origem, destino, index = 0, width = MAP_DIMENSIONS.width, height = MAP_DIMENSIONS.height) {
  const x1 = parseCoord(origem.left_pos || origem.left, width);
  const y1 = parseCoord(origem.top, height);
  const x2 = parseCoord(destino.left_pos || destino.left, width);
  const y2 = parseCoord(destino.top, height);

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const offsetMultiplier = (index * 150 + 100);
  const offsetX = (index % 2 === 0 ? 1 : -1) * offsetMultiplier;
  const offsetY = (index % 2 === 0 ? -1 : 1) * offsetMultiplier;
  const controlX = midX + offsetX;
  const controlY = midY + offsetY;

  const linhaCurvaSvg = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
  const pathLoop = `${linhaCurvaSvg} Q ${controlX} ${controlY} ${x1} ${y1}`;
  const distancia = Math.hypot(x2 - x1, y2 - y1);

  return {
    linhaCurvaSvg,
    pathLoop,
    distancia
  };
}
