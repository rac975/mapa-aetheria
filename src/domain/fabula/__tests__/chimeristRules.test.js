import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALCANCES_FEITICO,
  ALVOS_FEITICO,
  obterOpcoesEspecies,
  inferirAlcanceFeitico,
  inferirAlvoFeitico,
  inferirBonusDanoFeitico,
  inferirCondicaoFeitico,
  formatarBadgeAlcance,
  formatarBadgeAlvo,
  formatarBadgeCondicao,
  normalizarFeiticoQuimerista
} from '../chimeristRules.js';

test('Fabula Ultima - Quimerista: espécies oficiais e preservação de legados', () => {
  const padrao = obterOpcoesEspecies('');
  assert.equal(padrao.length, 3);
  assert.deepEqual(padrao.map((e) => e.id), ['monstro', 'fera', 'planta']);

  const comLegado = obterOpcoesEspecies('construto');
  assert.equal(comLegado.length, 4);
  assert.equal(comLegado[3].id, 'construto');
  assert.ok(comLegado[3].label.includes('Salvo'));
});

test('Fabula Ultima - Quimerista: inferência de alcance tático', () => {
  assert.equal(inferirAlcanceFeitico({ alcance: 'corpo_a_corpo' }), ALCANCES_FEITICO.CORPO_A_CORPO);
  assert.equal(inferirAlcanceFeitico({ alcance: 'distancia' }), ALCANCES_FEITICO.DISTANCIA);
  assert.equal(inferirAlcanceFeitico({ descricao: 'Mordida violenta em corpo a corpo.' }), ALCANCES_FEITICO.CORPO_A_CORPO);
  assert.equal(inferirAlcanceFeitico({ descricao: 'Dispara esporos venenosos à distância.' }), ALCANCES_FEITICO.DISTANCIA);
  assert.equal(inferirAlcanceFeitico(null), ALCANCES_FEITICO.DISTANCIA);
});

test('Fabula Ultima - Quimerista: inferência de alvo e área', () => {
  assert.equal(inferirAlvoFeitico({ alvo_tipo: 'area' }).tipo, ALVOS_FEITICO.AREA);
  assert.equal(inferirAlvoFeitico({ alvo_tipo: 'multi', numero_alvos: 3 }).numeroAlvos, 3);
  assert.equal(inferirAlvoFeitico({ descricao: 'Onda que atinge todas as criaturas.' }).tipo, ALVOS_FEITICO.AREA);
  assert.equal(inferirAlvoFeitico({ descricao: 'Lança espinhos em até três criaturas.' }).numeroAlvos, 3);
  assert.equal(inferirAlvoFeitico({ descricao: 'Dano a uma criatura.' }).tipo, ALVOS_FEITICO.UNICO);
});

test('Fabula Ultima - Quimerista: inferência de bônus em dano e condição', () => {
  // 1. Explícito
  assert.equal(inferirBonusDanoFeitico({ bonus_dano: 5 }), 5);
  assert.equal(inferirCondicaoFeitico({ condicao: 'envenenado' }), 'envenenado');

  // 2. Inferência via texto
  assert.equal(inferirBonusDanoFeitico({ descricao: 'Atinge o alvo causando +10 pontos de dano gélido.' }), 10);
  assert.equal(inferirCondicaoFeitico({ descricao: 'Cada alvo atingido fica lento.' }), 'lento');
  assert.equal(inferirCondicaoFeitico({ descricao: 'A criatura fica envenenada.' }), 'envenenado');
  assert.equal(inferirCondicaoFeitico({ descricao: 'Dano simples sem status.' }), '');
});

test('Fabula Ultima - Quimerista: formatação de badges visuais', () => {
  assert.equal(formatarBadgeAlcance('distancia').label, 'À Distância');
  assert.equal(formatarBadgeAlcance('corpo_a_corpo').label, 'Corpo a Corpo');
  assert.equal(formatarBadgeAlvo({ tipo: 'area' }).label, 'Em Área (Todos)');
  assert.equal(formatarBadgeAlvo({ tipo: 'multi', numeroAlvos: 2 }).label, 'Até 2 Alvos');

  const bCond = formatarBadgeCondicao('lento');
  assert.equal(bCond.label, 'Lento');
  assert.equal(formatarBadgeCondicao(''), null);
});

test('Fabula Ultima - Quimerista: normalização completa com bônus e condição', () => {
  const norm = normalizarFeiticoQuimerista({
    nome: 'Bafo de Veneno',
    custo_mp: '10',
    especie: 'monstro',
    descricao: 'Atinge todas as criaturas com +5 de dano de veneno e deixa envenenado.'
  }, 1);

  assert.equal(norm.nome, 'Bafo de Veneno');
  assert.equal(norm.especie, 'monstro');
  assert.equal(norm.alvo_tipo, 'area');
  assert.equal(norm.bonus_dano, 5);
  assert.equal(norm.condicao, 'envenenado');
});

test('Fabula Ultima - Quimerista: feitiço sem bônus de dano não gera bônus residual em conflito', () => {
  const magiaSemDano = { nome: 'Esporos Paralisantes', bonus_dano: 0 };
  assert.equal(inferirBonusDanoFeitico(magiaSemDano), 0);
  assert.equal(Number(magiaSemDano.bonus_dano) > 0, false);

  const magiaComDano = { nome: 'Sopro Ígneo', bonus_dano: 5 };
  assert.equal(inferirBonusDanoFeitico(magiaComDano), 5);
  assert.equal(Number(magiaComDano.bonus_dano) > 0, true);
});
