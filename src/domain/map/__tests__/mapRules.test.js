import {
  MAP_DIMENSIONS,
  parseCoord,
  coordPxToPercent,
  snapToGrid,
  calcularDistanciaEntrePontos,
  getStatusBadge,
  calcularCurvaRota
} from '../mapRules.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Testando Dimensões do Mapa de Aetheria ---');
assert(MAP_DIMENSIONS.width === 12800, 'Largura base = 12800');
assert(Math.abs(MAP_DIMENSIONS.height - 8533.3) < 0.1, 'Altura base = 8533.3');

console.log('--- Testando Conversão de Coordenadas ---');
assert(parseCoord('50%', 1000) === 500, '50% de 1000 = 500');
assert(parseCoord(25, 1000) === 250, '25 (<= 100 considerado %) de 1000 = 250');
assert(parseCoord(500, 1000) === 500, '500 (> 100) permanece 500 px');
assert(coordPxToPercent(6400, 12800) === 50, '6400 de 12800 = 50%');

console.log('--- Testando Snap to Grid ---');
const snapped = snapToGrid(51.2, 1000, 100);
// 51.2% de 1000 = 512 px. Mais próximo de 100 = 500 px. 500/1000 = 50%
assert(snapped === 50, '51.2% encaixa em 50% com grid de 100px');

console.log('--- Testando Cálculo de Distância ---');
const p1 = { left: '10%', top: '20%' };
const p2 = { left: '10%', top: '40%' };
const dist = calcularDistanciaEntrePontos(p1, p2, 1000, 1000);
assert(Math.round(dist) === 200, 'Distância vertical entre 20% e 40% em 1000px = 200px');

console.log('--- Testando Badges de Status ---');
assert(getStatusBadge('pacifico').className === 'status-pacifico', 'Badge pacifico correto');
assert(getStatusBadge('perigo').className === 'status-perigo', 'Badge perigo correto');
assert(getStatusBadge('corrompido').className === 'status-corrompido', 'Badge corrompido correto');
assert(getStatusBadge('caido').className === 'status-caido', 'Badge caido correto');

console.log('--- Testando Curva de Rota ---');
const rota = calcularCurvaRota(
  { left: '10%', top: '10%' },
  { left: '30%', top: '30%' },
  0,
  1000,
  1000
);
assert(rota.linhaCurvaSvg.startsWith('M 100 100 Q'), 'Caminho SVG quadrático gerado corretamente');
assert(rota.distancia > 0, 'Distância da rota calculada');
console.log('Todos os testes de regras de mapa passaram com sucesso!');
