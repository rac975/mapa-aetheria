import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATALOGO_OPORTUNIDADES_FABULA,
  normalizarCodigoOportunidade,
  obterOportunidadePorCodigo,
  criarEventoOportunidade,
  registrarVotoOportunidade,
  obterOportunidadeVencedora,
  resolverEfeitoOportunidade,
  construirLogOportunidadeAplicada
} from '../combatOpportunitiesRules.js';

import { rolarDadosCombate } from '../combatRules.js';

test('Catálogo Oficial de 11 Oportunidades de Fabula Ultima (Livro Básico p. 41)', () => {
  assert.equal(CATALOGO_OPORTUNIDADES_FABULA.length, 11);

  const codigosEsperados = [
    'AFLICAO',
    'AVALIAR',
    'CONEXAO',
    'DESMASCARAR',
    'FAVOR',
    'INFORMACOES',
    'ITEM_PERDIDO',
    'MANCADA',
    'PROGRESSO',
    'REVIRAVOLTA',
    'VANTAGEM'
  ];

  codigosEsperados.forEach((cod) => {
    const op = CATALOGO_OPORTUNIDADES_FABULA.find((o) => o.codigo === cod);
    assert.ok(op, `Oportunidade ${cod} deve existir no catálogo oficial`);
    assert.ok(op.titulo, `Oportunidade ${cod} deve ter título`);
    assert.ok(op.descricao, `Oportunidade ${cod} deve ter descrição`);
  });
});

test('Normalização de códigos e suporte a aliases legados', () => {
  assert.equal(normalizarCodigoOportunidade('AFETAR'), 'AFLICAO');
  assert.equal(normalizarCodigoOportunidade('FAVORECER'), 'VANTAGEM');
  assert.equal(normalizarCodigoOportunidade('RELOGIO'), 'PROGRESSO');
  assert.equal(normalizarCodigoOportunidade('REVELAR'), 'AVALIAR');
  assert.equal(normalizarCodigoOportunidade('LACO'), 'CONEXAO');
  assert.equal(normalizarCodigoOportunidade('aflicao'), 'AFLICAO');
  assert.equal(normalizarCodigoOportunidade('VANTAGEM'), 'VANTAGEM');

  const opAflicao = obterOportunidadePorCodigo('AFETAR');
  assert.equal(opAflicao.codigo, 'AFLICAO');
  assert.equal(opAflicao.titulo, 'Aflição');
});

test('Criação de evento de Oportunidade: Herói vs Inimigo', () => {
  const eventoHeroiCritico = criarEventoOportunidade({
    combatente: { id: 'h1', nome: 'Valtiel', tipo: 'heroi' },
    resultadoRolagem: { isCritico: true, isFumble: false, d1: 6, d2: 6, total: 12 },
    origemAcao: 'Ataque com Espada'
  });
  assert.ok(eventoHeroiCritico);
  assert.equal(eventoHeroiCritico.tipoEvento, 'critico');
  assert.equal(eventoHeroiCritico.responsavelEscolha, 'mestre');
  assert.equal(eventoHeroiCritico.autorNome, 'Valtiel');

  const eventoInimigoFumble = criarEventoOportunidade({
    combatente: { id: 'i1', nome: 'Goblin', tipo: 'inimigo' },
    resultadoRolagem: { isCritico: false, isFumble: true, d1: 1, d2: 1, total: 2 },
    origemAcao: 'Mordida Voraz'
  });
  assert.ok(eventoInimigoFumble);
  assert.equal(eventoInimigoFumble.tipoEvento, 'fumble');
  assert.equal(eventoInimigoFumble.responsavelEscolha, 'herois');

  const semCriticoOuFumble = criarEventoOportunidade({
    combatente: { id: 'h1', nome: 'Valtiel', tipo: 'heroi' },
    resultadoRolagem: { isCritico: false, isFumble: false, d1: 4, d2: 5, total: 9 }
  });
  assert.equal(semCriticoOuFumble, null);
});

test('Votação e Oportunidade Vencedora', () => {
  let evento = criarEventoOportunidade({
    combatente: { id: 'i1', nome: 'Chefe', tipo: 'inimigo' },
    resultadoRolagem: { isFumble: true, d1: 1, d2: 1, total: 2 }
  });

  evento = registrarVotoOportunidade(evento, 'Jogador1', 'VANTAGEM');
  evento = registrarVotoOportunidade(evento, 'Jogador2', 'VANTAGEM');
  evento = registrarVotoOportunidade(evento, 'Jogador3', 'AFLICAO');

  const { contagemPorCodigo, totalVotos, codigoVencedor } = obterOportunidadeVencedora(evento);
  assert.equal(totalVotos, 3);
  assert.equal(contagemPorCodigo.VANTAGEM, 2);
  assert.equal(contagemPorCodigo.AFLICAO, 1);
  assert.equal(codigoVencedor, 'VANTAGEM');
});

test('Resolução mecânica: Aflição (aplica condição no alvo)', () => {
  const participantes = [
    { id: 'inimigo_1', nome: 'Lobo Alfa', condicoes: [] },
    { id: 'heroi_1', nome: 'Eldrin', condicoes: [] }
  ];

  const efeito = resolverEfeitoOportunidade({
    codigo: 'AFLICAO',
    dadosEfeito: { alvoId: 'inimigo_1', condicao: 'lento' },
    participantes
  });

  assert.equal(efeito.tipo, 'AFLICAO');
  assert.equal(efeito.condicao, 'lento');
  assert.equal(efeito.alvoId, 'inimigo_1');
  assert.deepEqual(efeito.updatesParticipante, {
    id: 'inimigo_1',
    condicoes: ['lento']
  });
});

test('Resolução mecânica: Vantagem (+4 no próximo teste)', () => {
  const participantes = [
    { id: 'heroi_1', nome: 'Kael', modificadores: {} }
  ];

  const efeito = resolverEfeitoOportunidade({
    codigo: 'VANTAGEM',
    dadosEfeito: { alvoId: 'heroi_1' },
    participantes
  });

  assert.equal(efeito.tipo, 'VANTAGEM');
  assert.equal(efeito.alvoId, 'heroi_1');
  assert.equal(efeito.updatesParticipante.modificadores.bonus_proximo_teste, 4);

  // Aplicação na rolagem
  const combatenteComVantagem = {
    ...participantes[0],
    ...efeito.updatesParticipante
  };

  const rolagem = rolarDadosCombate({
    combatente: combatenteComVantagem,
    attr1: 'des',
    attr2: 'des',
    bonusTeste: 2,
    valoresFixos: { d1: 4, d2: 4 }
  });

  // 4 + 4 + 2 (bonusTeste) + 4 (vantagem) = 14
  assert.equal(rolagem.total, 14);
  assert.ok(rolagem.detalhes.includes('Vantagem (+4)'));
});

test('Resolução mecânica: Progresso (ajusta seções de relógio)', () => {
  const relogios = [
    { id: 'rel_1', titulo: 'Ritual Sombrio', fatias_total: 6, fatias_atuais: 2 }
  ];

  const avanco = resolverEfeitoOportunidade({
    codigo: 'PROGRESSO',
    dadosEfeito: { relogioId: 'rel_1', deltaRelogio: 2 },
    relogios
  });

  assert.equal(avanco.tipo, 'PROGRESSO');
  assert.equal(avanco.deltaRelogio, 2);
  assert.equal(avanco.updatesRelogio.fatias_atuais, 4);

  const recuo = resolverEfeitoOportunidade({
    codigo: 'PROGRESSO',
    dadosEfeito: { relogioId: 'rel_1', deltaRelogio: -2 },
    relogios
  });
  assert.equal(recuo.updatesRelogio.fatias_atuais, 0);
});

test('construirLogOportunidadeAplicada formata o feed corretamente', () => {
  const evento = {
    autorId: 'h1',
    autorNome: 'Aria',
    autorTipo: 'heroi',
    responsavelEscolha: 'mestre',
    rotuloEvento: 'Sucesso Crítico',
    tituloRolagem: 'Tiro Rápido'
  };

  const efeitoResolvido = {
    tipo: 'AFLICAO',
    alvoNome: 'Capitão Pirata',
    condicao: 'atordoado'
  };

  const log = construirLogOportunidadeAplicada(
    evento,
    'AFLICAO',
    'Tiro certeiro desconcertou o comandante',
    efeitoResolvido
  );

  assert.equal(log.acao_codigo, 'OPORTUNIDADE_AFLICAO');
  assert.ok(log.detalhes.includes('Condição ATORDOADO aplicada em Capitão Pirata'));
  assert.ok(log.detalhes.includes('Tiro certeiro desconcertou o comandante'));
});
