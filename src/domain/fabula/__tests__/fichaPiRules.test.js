import {
  sanitizarPayloadFicha,
  normalizarFichaPersonagem
} from '../characterProgression.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
}

console.log('--- 1. Testando sanitizarPayloadFicha (Remoção estrita de ip_atual e ip_max) ---');

// Cenário A: Payload contendo apenas ip_atual e ip_max legado
const payloadLegado = {
  nome_personagem: 'Valerius',
  ip_atual: 4,
  ip_max: 8,
  zenit: 250
};
const sanitizadoA = sanitizarPayloadFicha(payloadLegado);
assert(sanitizadoA.pi_atual === 4, 'Mapeou ip_atual para pi_atual');
assert(sanitizadoA.pi_max === 8, 'Mapeou ip_max para pi_max');
assert(!('ip_atual' in sanitizadoA), 'ip_atual foi estritamente expurgado do payload');
assert(!('ip_max' in sanitizadoA), 'ip_max foi estritamente expurgado do payload');
assert(sanitizadoA.zenit === 250, 'Preservou os demais campos intactos');
console.log('PASSED: Cenário A (Legado -> Canônico) validado!');

// Cenário B: Payload contendo pi_atual e ip_atual redundante
const payloadRedundante = {
  pi_atual: 5,
  ip_atual: 3,
  pi_max: 6,
  ip_max: 6
};
const sanitizadoB = sanitizarPayloadFicha(payloadRedundante);
assert(sanitizadoB.pi_atual === 5, 'Preservou pi_atual prioritariamente');
assert(sanitizadoB.pi_max === 6, 'Preservou pi_max prioritariamente');
assert(!('ip_atual' in sanitizadoB), 'ip_atual removido mesmo em duplicidade');
assert(!('ip_max' in sanitizadoB), 'ip_max removido mesmo em duplicidade');
console.log('PASSED: Cenário B (Prioridade e Expurgamento) validado!');

// Cenário C: Payload sem PI
const payloadNeutro = { hp_atual: 30, mp_atual: 20 };
const sanitizadoC = sanitizarPayloadFicha(payloadNeutro);
assert(sanitizadoC.hp_atual === 30 && sanitizadoC.mp_atual === 20, 'Payload sem PI permanece intacto');
console.log('PASSED: Cenário C (Payload Neutro) validado!');

console.log('--- 2. Testando normalizarFichaPersonagem (Leitura canônica e retrocompatibilidade não-enumerável) ---');

// Cenário D: Ficha lida do Supabase com colunas reais pi_atual e pi_max
const fichaBanco = {
  id: 'ficha_123',
  nome_personagem: 'Lyra',
  pi_atual: 6,
  pi_max: 8
};
const normalizadaD = normalizarFichaPersonagem(fichaBanco);
assert(normalizadaD.pi_atual === 6, 'Lê pi_atual diretamente');
assert(normalizadaD.pi_max === 8, 'Lê pi_max diretamente');
assert(normalizadaD.ip_atual === 6, 'Getter retrocompatível lê ip_atual com sucesso');
assert(normalizadaD.ip_max === 8, 'Getter retrocompatível lê ip_max com sucesso');

// Alterando via setter
normalizadaD.ip_atual = 2;
assert(normalizadaD.pi_atual === 2, 'Setter retrocompatível altera pi_atual');
assert(normalizadaD.ip_atual === 2, 'Getter reflete a alteração');

// Garantia de não-enumerabilidade: não vaza no spread {...ficha} nem em Object.keys
const chaves = Object.keys(normalizadaD);
assert(chaves.includes('pi_atual'), 'pi_atual é enumerável');
assert(chaves.includes('pi_max'), 'pi_max é enumerável');
assert(!chaves.includes('ip_atual'), 'ip_atual NÃO é enumerável (não vaza)');
assert(!chaves.includes('ip_max'), 'ip_max NÃO é enumerável (não vaza)');

const json = JSON.stringify(normalizadaD);
assert(json.includes('"pi_atual":2'), 'JSON serializa pi_atual');
assert(!json.includes('"ip_atual"'), 'JSON NUNCA serializa ip_atual');
console.log('PASSED: Normalização e retrocompatibilidade não-enumerável validadas com sucesso!');

console.log('TODOS OS TESTES DE PI_ATUAL / PI_MAX PASSARAM COM SUCESSO!');
