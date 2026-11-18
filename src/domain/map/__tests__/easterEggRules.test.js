import {
  SEQUENCIA_FANFARRA,
  JANELA_COMBO_MS,
  processarSequenciaCombo
} from '../easterEggRules.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Testando Regras do Easter Egg de Fanfarra do Mapa ---');

// 1. Sequência exata de cliques dentro do tempo limite
let t = 1000;
let hist = [];

// Sequência esperada: 'in', 'out', 'in', 'out', 'in'
for (let i = 0; i < SEQUENCIA_FANFARRA.length - 1; i++) {
  const res = processarSequenciaCombo(hist, SEQUENCIA_FANFARRA[i], t);
  assert(res.ativado === false, `Passo ${i + 1} (${SEQUENCIA_FANFARRA[i]}) não deve ativar prematuramente`);
  hist = res.novoHistorico;
  t += 200;
}

const resFinal = processarSequenciaCombo(hist, SEQUENCIA_FANFARRA[SEQUENCIA_FANFARRA.length - 1], t);
assert(resFinal.ativado === true, 'Quinto clique da sequência correta deve ativar a fanfarra');
assert(resFinal.novoHistorico.length === 0, 'Histórico deve ser resetado após a ativação');

// 2. Sequência com cliques extras iniciais
t = 5000;
hist = [];
// Usuário clica 'out', 'out', depois faz o combo completo
let r = processarSequenciaCombo(hist, 'out', t);
hist = r.novoHistorico;
t += 100;
r = processarSequenciaCombo(hist, 'out', t);
hist = r.novoHistorico;
t += 100;

for (let i = 0; i < SEQUENCIA_FANFARRA.length; i++) {
  t += 100;
  r = processarSequenciaCombo(hist, SEQUENCIA_FANFARRA[i], t);
  hist = r.novoHistorico;
}
assert(r.ativado === true, 'Combo realizado após cliques extras deve ativar com sucesso');

// 3. Sequência expirada por inatividade
t = 10000;
hist = [];
r = processarSequenciaCombo(hist, 'in', t);
hist = r.novoHistorico;
// Passam mais de JANELA_COMBO_MS (ex: 3000ms)
t += JANELA_COMBO_MS + 500;
r = processarSequenciaCombo(hist, 'out', t);
hist = r.novoHistorico;
assert(r.ativado === false, 'Cliques separados por tempo maior que a janela não acumulam para o combo');
assert(hist.length === 1, 'Histórico antigo deve ter sido descartado por expiração de janela');

console.log('🎉 TODOS OS TESTES DO EASTER EGG DE FANFARRA PASSARAM COM SUCESSO!');
