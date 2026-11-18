import assert from 'node:assert/strict';
import {
  TEMPO_MAXIMO_PERMANENCIA_MS,
  TEMPO_MAXIMO_INATIVIDADE_MS,
  MOTIVOS_ENCERRAMENTO,
  normalizarTokenCracha,
  aplicarMascaraTokenCracha,
  validarFormatoTokenCracha,
  gerarPrefixoToken,
  gerarTokenCrachaUnico,
  extrairCredencialCracha,
  avaliarExpiracaoSessao,
  validarIntegridadeSessaoJogador,
  avaliarEventoRealtimeSessao,
  avaliarConflitoBroadcastSessao
} from '../sessionRules.js';

console.log('--- 1. Testando Normalização, Máscara e Geração de Tokens (Item 7) ---');

assert.equal(normalizarTokenCracha('ply-001'), 'PLY-001');
assert.equal(normalizarTokenCracha('  élo123 '), 'ELO-123');
assert.equal(aplicarMascaraTokenCracha('ágata99'), 'AGA-TA99');
assert.equal(validarFormatoTokenCracha('PLY-001'), true);
assert.equal(validarFormatoTokenCracha('AB'), false);
assert.equal(gerarPrefixoToken('Élodie'), 'ELO');
assert.equal(gerarPrefixoToken('Al'), 'ALX');
assert.equal(gerarPrefixoToken(''), 'HER');
console.log('✅ PASSED: Normalização sem acentos, máscara AAA-000 e prefixos seguros');

const tokenGerado = gerarTokenCrachaUnico('Cyrion', ['CYR-100', 'CYR-101'], () => 0); // 100 + 0 = 100 (colide) -> fallback
assert.notEqual(tokenGerado, 'CYR-100');
let seq = 0;
const tokenSemColisao = gerarTokenCrachaUnico('Cyrion', ['CYR-100'], () => {
  seq += 1;
  return seq === 1 ? 0 : 0.5; // 1ª tentativa = 100 (colide), 2ª tentativa = 550 (livre)
});
assert.equal(tokenSemColisao, 'CYR-550');
console.log('✅ PASSED: Gerador de token único evita colisões de crachá na mesa');

console.log('--- 2. Testando Extração de Credenciais via QR Code e Texto (Item 7) ---');

const credUrlHash = extrairCredencialCracha('https://rac975.github.io/mapa-aetheria/#/ficha/42');
assert.deepEqual(credUrlHash, { tipo: 'id', id: '42', token: null });

const credUrlTokenFicha = extrairCredencialCracha('https://rac975.github.io/mapa-aetheria/#/ficha/CYR-101');
assert.deepEqual(credUrlTokenFicha, { tipo: 'token', id: null, token: 'CYR-101' });

const credUrlRotaCompacta = extrairCredencialCracha('https://rac975.github.io/mapa-aetheria/#/f/CYR-101');
assert.deepEqual(credUrlRotaCompacta, { tipo: 'token', id: null, token: 'CYR-101' });

const credUrlRotaCompactaId = extrairCredencialCracha('https://rac975.github.io/mapa-aetheria/#/f/42');
assert.deepEqual(credUrlRotaCompactaId, { tipo: 'id', id: '42', token: null });

const credTokenDireto = extrairCredencialCracha('cyr-777');
assert.deepEqual(credTokenDireto, { tipo: 'token', id: null, token: 'CYR-777' });

// Testando Token Puro do QR Code (Payload de 7 caracteres para matriz 21x21)
const credTokenPuro = extrairCredencialCracha('CYR-525');
assert.deepEqual(credTokenPuro, { tipo: 'token', id: null, token: 'CYR-525' });

// Testando URIs internas compactas de crachá
const credUriFicha = extrairCredencialCracha('aetheria:ficha:CYR-525');
assert.deepEqual(credUriFicha, { tipo: 'token', id: null, token: 'CYR-525' });

const credUriDireta = extrairCredencialCracha('aetheria:CYR-525');
assert.deepEqual(credUriDireta, { tipo: 'token', id: null, token: 'CYR-525' });

const credInvalida = extrairCredencialCracha('   ');
assert.equal(credInvalida.tipo, 'invalido');
console.log('✅ PASSED: Leitura de QR Code (URL canônica, compacta, token direto e inválido)');

console.log('--- 3. Testando God Mode e Imunidade da Sessão do Mestre (Item 6) ---');

const agora = 1_700_000_000_000;
const sessaoAntigaInativa = {
  token: 'CYR-101',
  fichaId: '10',
  loginTimestamp: agora - TEMPO_MAXIMO_PERMANENCIA_MS - 999999,
  lastActiveTimestamp: agora - TEMPO_MAXIMO_INATIVIDADE_MS - 999999
};

// Mesmo com timestamps vencidos há horas, o Mestre (isMestre = true) NUNCA expira
const expMestre = avaliarExpiracaoSessao(sessaoAntigaInativa, agora, { isMestre: true });
assert.equal(expMestre.expirada, false);
assert.equal(expMestre.isGodMode, true);

// Mestre acessando qualquer ficha (mesmo sem token ou com ID diferente) tem acesso livre garantido
const intMestre = validarIntegridadeSessaoJogador({
  sessaoLocal: null,
  fichaBanco: { id: 99, jogador_token: 'OUT-999' },
  idRota: '99',
  isMestre: true,
  agora
});
assert.equal(intMestre.valida, true);
assert.equal(intMestre.modo, 'mestre');

// Eventos Realtime de alteração ou exclusão de ficha nunca derrubam a sessão do Mestre
const rtMestre = avaliarEventoRealtimeSessao({
  eventType: 'DELETE',
  recordOld: { id: 10 },
  sessaoLocal: sessaoAntigaInativa,
  isMestre: true
});
assert.equal(rtMestre.invalida, false);
assert.equal(rtMestre.ignorar, true);
console.log('✅ PASSED: Mestre em God Mode é 100% imune a timeouts de inatividade, conflitos de ID e quedas por Realtime');

console.log('--- 4. Testando Expiração, Conflito de ID e Isolamento Realtime de Jogador (Item 7) ---');

// Jogador comum com inatividade > 2h expira corretamente
const expJogadorInativo = avaliarExpiracaoSessao(
  {
    token: 'CYR-101',
    fichaId: '10',
    loginTimestamp: agora - 1000,
    lastActiveTimestamp: agora - TEMPO_MAXIMO_INATIVIDADE_MS - 1000
  },
  agora,
  { isMestre: false }
);
assert.equal(expJogadorInativo.expirada, true);
assert.equal(expJogadorInativo.motivo, MOTIVOS_ENCERRAMENTO.INATIVIDADE);

// Jogador comum tentando acessar ficha de ID diferente do seu crachá sofre bloqueio por conflito de ID
const sessaoJogadorValida = {
  sessionId: 'sess_1',
  token: 'CYR-101',
  fichaId: '10',
  loginTimestamp: agora - 5000,
  lastActiveTimestamp: agora - 1000
};

const conflitoRota = validarIntegridadeSessaoJogador({
  sessaoLocal: sessaoJogadorValida,
  idRota: '25',
  isMestre: false,
  agora
});
assert.equal(conflitoRota.valida, false);
assert.equal(conflitoRota.motivo, MOTIVOS_ENCERRAMENTO.CONFLITO_ID);

// Jogador comum acessando a rota pelo seu próprio token de crachá (ex: QR Code /f/CYR-101) tem acesso permitido
const rotaTokenProprio = validarIntegridadeSessaoJogador({
  sessaoLocal: sessaoJogadorValida,
  idRota: 'CYR-101',
  isMestre: false,
  agora
});
assert.equal(rotaTokenProprio.valida, true);

// Jogador comum tentando acessar a rota com o token de outro herói sofre bloqueio
const rotaTokenOutro = validarIntegridadeSessaoJogador({
  sessaoLocal: sessaoJogadorValida,
  idRota: 'OUT-999',
  isMestre: false,
  agora
});
assert.equal(rotaTokenOutro.valida, false);
assert.equal(rotaTokenOutro.motivo, MOTIVOS_ENCERRAMENTO.CONFLITO_ID);

// Jogador comum com token rotacionado no banco é direcionado para reconexão
const tokenRotacionado = validarIntegridadeSessaoJogador({
  sessaoLocal: sessaoJogadorValida,
  fichaBanco: { id: 10, jogador_token: 'CYR-999' },
  idRota: '10',
  isMestre: false,
  agora
});
assert.equal(tokenRotacionado.valida, false);
assert.equal(tokenRotacionado.motivo, MOTIVOS_ENCERRAMENTO.TOKEN_EXPIRADO);

// Evento Realtime em OUTRA ficha (id: 25) NÃO afeta o jogador da ficha 10
const rtOutroJogador = avaliarEventoRealtimeSessao({
  eventType: 'UPDATE',
  recordNew: { id: 25, jogador_token: 'NOV-999' },
  sessaoLocal: sessaoJogadorValida,
  isMestre: false
});
assert.equal(rtOutroJogador.invalida, false);
assert.equal(rtOutroJogador.ignorar, true);

// Evento Realtime na PRÓPRIA ficha (id: 10) alterando o token desconecta apenas o jogador 10
const rtProprioJogadorToken = avaliarEventoRealtimeSessao({
  eventType: 'UPDATE',
  recordNew: { id: 10, jogador_token: 'CYR-888' },
  sessaoLocal: sessaoJogadorValida,
  isMestre: false
});
assert.equal(rtProprioJogadorToken.invalida, true);
assert.equal(rtProprioJogadorToken.motivo, MOTIVOS_ENCERRAMENTO.TOKEN_EXPIRADO);

// Broadcast de conflito de sessão simultânea desconecta apenas a sessão antiga da mesma ficha
const conflitoBroadcast = avaliarConflitoBroadcastSessao({
  payloadBroadcast: {
    acao: 'nova_sessao_ativa',
    fichaId: '10',
    sessionId: 'sess_2_nova',
    timestamp: agora
  },
  sessaoLocal: sessaoJogadorValida,
  isMestre: false
});
assert.equal(conflitoBroadcast.conflito, true);
assert.equal(conflitoBroadcast.motivo, MOTIVOS_ENCERRAMENTO.CONFLITO_ID);

console.log('🎉 TODOS OS TESTES DE SESSÃO, GOD MODE E REALTIME PASSARAM COM SUCESSO!');
