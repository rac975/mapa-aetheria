import {
  POTENCIAS_RITUAL,
  AREAS_RITUAL,
  DISCIPLINAS_RITUAL,
  calcularCustoRitual,
  validarConjuracaoRitual,
  detectarDisciplinasPersonagem,
  rolarTesteRitual
} from '../ritualRules.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`FAILED: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Testando Tabelas Oficiais de Rituais ---');
assert(POTENCIAS_RITUAL.menor.custoPm === 20 && POTENCIAS_RITUAL.menor.nd === 7, 'Potência Menor = 20 PM / ND 7');
assert(POTENCIAS_RITUAL.media.custoPm === 30 && POTENCIAS_RITUAL.media.nd === 10, 'Potência Média = 30 PM / ND 10');
assert(POTENCIAS_RITUAL.maior.custoPm === 40 && POTENCIAS_RITUAL.maior.nd === 13, 'Potência Maior = 40 PM / ND 13');
assert(POTENCIAS_RITUAL.extrema.custoPm === 50 && POTENCIAS_RITUAL.extrema.nd === 16, 'Potência Extrema = 50 PM / ND 16');

assert(AREAS_RITUAL.individual.multiplicador === 1, 'Área Individual = x1');
assert(AREAS_RITUAL.pequena.multiplicador === 2, 'Área Pequena = x2');
assert(AREAS_RITUAL.grande.multiplicador === 3, 'Área Grande = x3');
assert(AREAS_RITUAL.enorme.multiplicador === 4, 'Área Enorme = x4');

console.log('--- Testando Cálculos de Custo ---');
const c1 = calcularCustoRitual('menor', 'individual');
assert(c1.custoTotal === 20 && c1.nd === 7, 'Menor x Individual = 20 PM');

const c2 = calcularCustoRitual('maior', 'pequena');
assert(c2.custoTotal === 80 && c2.nd === 13, 'Maior x Pequena = 80 PM');

const c3 = calcularCustoRitual('extrema', 'enorme');
assert(c3.custoTotal === 200 && c3.nd === 16, 'Extrema x Enorme = 200 PM');

const cReduzido = calcularCustoRitual('maior', 'pequena', { ingredienteRaro: true });
assert(cReduzido.custoTotal === 40, 'Maior x Pequena com ingrediente raro = 40 PM (50% redução)');

console.log('--- Testando Validação de PM ---');
const v1 = validarConjuracaoRitual(50, 40);
assert(v1.podeConjurar === true && v1.faltaMp === 0, 'PM suficiente permite conjurar');

const v2 = validarConjuracaoRitual(30, 40);
assert(v2.podeConjurar === false && v2.faltaMp === 10, 'PM insuficiente detecta falta de 10 PM');

console.log('--- Testando Detecção Automática de Disciplinas ---');
const classesExemplo = [
  {
    nome_classe: 'Elementalista',
    nivel: 2,
    beneficios: 'Aumente permanentemente seus PM máximos em 5. Você pode fazer rituais cujos efeitos pertençam à disciplina de ritualismo.',
    habilidades: [{ nome: 'Elementalismo Ritualista', nivel: 1, descricao: '...' }]
  },
  {
    nome_classe: 'Esper',
    nivel: 5,
    habilidades: [{ nome: 'Navegador', nivel: 1, descricao: 'Você pode realizar rituais da disciplina Ritualismo sem a necessidade de itens ou ingredientes raros.' }]
  }
];

const detectadas = detectarDisciplinasPersonagem(classesExemplo, ['Arcanismo']);
const idsDetectados = detectadas.map(d => d.id);
assert(idsDetectados.includes('elementalismo'), 'Detectou Elementalismo via Elementalista');
assert(idsDetectados.includes('ritualismo'), 'Detectou Ritualismo via Benefício e Navegador');
assert(idsDetectados.includes('arcanismo'), 'Detectou Arcanismo via Seleção Manual');

console.log('--- Testando Rolagem de Teste ---');
const rSucesso = rolarTesteRitual(8, 8, 10, { dadosPredefinidos: { d1: 6, d2: 5 } });
assert(rSucesso.total === 11 && rSucesso.sucesso === true, '6 + 5 = 11 >= 10 é Sucesso');

const rCritico = rolarTesteRitual(8, 8, 16, { dadosPredefinidos: { d1: 6, d2: 6 } });
assert(rCritico.critico === true && rCritico.sucesso === true, '6 e 6 é Sucesso Crítico mesmo contra ND 16');

const rDesastre = rolarTesteRitual(8, 8, 7, { dadosPredefinidos: { d1: 1, d2: 1 } });
assert(rDesastre.desastre === true && rDesastre.sucesso === false, '1 e 1 é Desastre');

console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
