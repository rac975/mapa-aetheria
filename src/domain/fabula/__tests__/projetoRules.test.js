import {
  POTENCIAS_PROJETO,
  AREAS_PROJETO,
  USOS_PROJETO,
  extrairNivelVisionario,
  calcularParametrosProjeto,
  calcularProgressoDiario,
  estimarDiasRestantes,
  rolarTesteProjeto,
  calcularFatiasPreenchidas,
  avancarRelogioProjeto
} from '../projetoRules.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Testando Tabelas Oficiais de Projetos ---');
assert(POTENCIAS_PROJETO.menor.custoBase === 100, 'Potência Menor = 100z');
assert(POTENCIAS_PROJETO.media.custoBase === 200, 'Potência Média = 200z');
assert(POTENCIAS_PROJETO.maior.custoBase === 400, 'Potência Maior = 400z');
assert(POTENCIAS_PROJETO.extrema.custoBase === 800, 'Potência Extrema = 800z');
assert(AREAS_PROJETO.pequena.multiplicador === 2, 'Área Pequena = x2');
assert(USOS_PROJETO.permanente.multiplicador === 5, 'Uso Permanente = x5');

console.log('--- Testando Cálculo de Custo e Progresso ---');
const p1 = calcularParametrosProjeto({
  potencia: 'media',
  area: 'pequena',
  usos: 'permanente'
});
assert(
  p1.custoMaterialTotal === 2000 && p1.progressoTotal === 20,
  'Média (200) × Pequena (2) × Permanente (5) = 2000z / 20 progresso'
);

const pDefeito = calcularParametrosProjeto({
  potencia: 'media',
  area: 'pequena',
  usos: 'permanente',
  possuiDefeito: true
});
assert(
  pDefeito.descontoDefeito === 500 && pDefeito.custoMaterialTotal === 1500 && pDefeito.progressoTotal === 15,
  'Defeito Terrível reduz 25% (2000z -> 1500z / 15 progresso)'
);

const pVisionario = calcularParametrosProjeto({
  potencia: 'menor',
  area: 'individual',
  usos: 'permanente',
  nivelVisionario: 3,
  zenitDisponivel: 250
});
assert(
  pVisionario.custoMaterialTotal === 500 &&
  pVisionario.custoPagoAutomaticamente === 300 &&
  pVisionario.custoLiquidoJogador === 200 &&
  pVisionario.podeIniciar === true,
  'Visionário Nv. 3 subsidia 300z de 500z -> 200z líquidos'
);

console.log('--- Testando Detecção de Visionário nas Classes ---');
const vis = extrairNivelVisionario([
  {
    nome_classe: 'Inventor',
    nivel: 4,
    habilidades: [{ nome: 'Visionário', nivel: 3 }]
  }
]);
assert(vis.temInventor === true && vis.nivelVisionario === 3, 'Detectou Inventor com Visionário Nv. 3');

console.log('--- Testando Progresso Diário e Estimativa ---');
const diario = calcularProgressoDiario({
  pjsTrabalhando: 3,
  inventoresSemVisionario: 1,
  niveisVisionario: [2]
});
assert(diario.totalDiario === 6, '3 PJs + 1 Inventor + Visionário Nv. 2 = 6 progresso/dia');
assert(estimarDiasRestantes(4, 20, 6) === 3, 'Faltam 16 pontos a 6/dia = 3 dias');

console.log('--- Testando Rolagem de Teste de Projeto ---');
const rCritico = rolarTesteProjeto('d10', 'd10', 13, { dadosPredefinidos: { d1: 6, d2: 6 } });
assert(rCritico.critico && rCritico.sucesso && rCritico.progressoGerado === 3, 'Crítico gera +3 progresso');

const rSuperior = rolarTesteProjeto('d10', 'd8', 10, { dadosPredefinidos: { d1: 8, d2: 6 } });
assert(rSuperior.sucesso && rSuperior.margem === 4 && rSuperior.progressoGerado === 2, 'Margem >= 4 gera +2 progresso');

const rComum = rolarTesteProjeto('d8', 'd8', 10, { dadosPredefinidos: { d1: 5, d2: 5 } });
assert(rComum.sucesso && rComum.progressoGerado === 1, 'Sucesso comum gera +1 progresso');

const rDesastre = rolarTesteProjeto('d8', 'd8', 7, { dadosPredefinidos: { d1: 1, d2: 1 } });
assert(rDesastre.desastre && !rDesastre.sucesso && rDesastre.progressoGerado === 0, 'Desastre gera 0 progresso');

console.log('--- Testando Avanço de Relógio do Projeto ---');
const av1 = avancarRelogioProjeto({ progresso_atual: 5, progresso_total: 10, fatias_relogio: 8, status: 'em_andamento' }, 5);
assert(
  av1.progressoNovo === 10 && av1.concluido === true && av1.fatiasPreenchidas === 8 && av1.novoStatus === 'concluido',
  'Avançar até o máximo conclui o projeto e preenche 8/8 fatias'
);
assert(calcularFatiasPreenchidas(1, 20, 8) === 1, 'Progresso parcial (>0) exibe pelo menos 1 fatia');

console.log('🎉 TODOS OS TESTES DE PROJETOS PASSARAM COM SUCESSO!');
