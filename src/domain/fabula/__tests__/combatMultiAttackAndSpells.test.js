import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolverAtaqueMultiAlvos,
  obterAfinidadeAlvoPorTipoDano
} from '../combatMultiAttackRules.js';
import {
  classificarTipoMagia,
  extrairDadosOfensivosMagia,
  extrairValorCuraMagia,
  calcularCustoEfetivoMagia,
  validarRecursoConjuracao,
  resolverFeiticoSuporteCura
} from '../combatSpellResolutionRules.js';
import { AFINIDADES_DANO } from '../combatRules.js';
import { obterPresetsHabilidade } from '../abilityPresetRules.js';

describe('Fabula Ultima - Ataque Multi (Multiplos Alvos e Multiplos Golpes no Mesmo Alvo) & Defesas', () => {
  const alvoA = { id: 'a1', nome: 'Goblin Lanceiro', def: 10, mdef: 8, afinidades: {} };
  const alvoB = { id: 'a2', nome: 'Cavaleiro Blindado', def: 14, mdef: 11, afinidades: { fogo: 'vul' } };
  const alvoC = { id: 'a3', nome: 'Gargula de Pedra', def: 12, mdef: 10, afinidades: { fogo: 'res' }, guardando: true };
  const alvoD = { id: 'a4', nome: 'Elemental de Chamas', def: 9, mdef: 12, afinidades: { fogo: 'abs' } };

  it('deve realizar teste unico de precisao com acerto parcial conforme a DEF de cada alvo', () => {
    const res = resolverAtaqueMultiAlvos({
      totalPrecisao: 11,
      d1: 5,
      d2: 6,
      danoBase: 10,
      tipoDano: 'fisico',
      alvos: [alvoA, alvoB],
      tipoDefesa: 'def'
    });

    assert.equal(res.isCritico, false);
    assert.equal(res.isFumble, false);
    assert.equal(res.totalAtingidos, 1);
    assert.equal(res.resultadosAlvos[0].atingiu, true);
    assert.equal(res.resultadosAlvos[0].danoFinal, 10);
    assert.equal(res.resultadosAlvos[1].atingiu, false);
    assert.equal(res.resultadosAlvos[1].danoFinal, 0);
  });

  it('deve suportar multiplos golpes no mesmo alvo consolidando o dano total e detalhando as parcelas', () => {
    const res = resolverAtaqueMultiAlvos({
      totalPrecisao: 12,
      d1: 5,
      d2: 7,
      danoBase: 10,
      tipoDano: 'fisico',
      alvos: [alvoA, alvoA],
      tipoDefesa: 'def'
    });

    assert.equal(res.totalGolpes, 2);
    assert.equal(res.totalAtingidos, 2);
    assert.equal(res.resultadosGolpes.length, 2);
    assert.equal(res.resultadosAlvos.length, 1, 'Consolida o mesmo alvo para atualizacao atomica');
    assert.equal(res.resultadosAlvos[0].quantidadeGolpes, 2);
    assert.equal(res.resultadosAlvos[0].golpesAtingidos, 2);
    assert.equal(res.resultadosAlvos[0].danoFinal, 20, '10 + 10 = 20 de dano total no mesmo alvo');
    assert.match(res.resultadosAlvos[0].mensagem, /2× Golpes/);
  });

  it('deve suportar Fundir do Arcano da Espada (sem_tipo / ignoraAfinidades) e ignoraResistencia (Forja/Geada)', () => {
    // Alvo D absorveria Fogo, mas com Fundir da Espada o dano perde o tipo e ignora Afinidades
    const resEspada = resolverAtaqueMultiAlvos({
      totalPrecisao: 15,
      d1: 6,
      d2: 8,
      danoBase: 15,
      tipoDano: 'sem_tipo',
      ignoraAfinidades: true,
      alvos: [alvoB, alvoD],
      tipoDefesa: 'def'
    });
    assert.equal(resEspada.resultadosAlvos[0].danoFinal, 15, 'Nao dobra em Vulneravel pois perdeu o tipo');
    assert.equal(resEspada.resultadosAlvos[1].danoFinal, 15, 'Ignora Absorcao e causa 15 de dano direto');
    assert.equal(resEspada.resultadosAlvos[1].curaAbsorvida, 0);

    // Alvo resistente a fogo sem estar em guarda: Forja ignora Resistencia
    const alvoResFogo = { id: 'r1', nome: 'Salamandra', def: 10, mdef: 10, afinidades: { fogo: 'res' } };
    const resForja = resolverAtaqueMultiAlvos({
      totalPrecisao: 12,
      d1: 5,
      d2: 6,
      danoBase: 30,
      tipoDano: 'fogo',
      ignoraResistencia: true,
      alvos: [alvoResFogo],
      tipoDefesa: 'mdef'
    });
    assert.equal(resForja.resultadosAlvos[0].danoFinal, 30, 'Ignora Resistencia e causa 30 de dano cheio');
  });

  it('sucesso critico (duplo >= 6) e falha critica (duplo 1) devem respeitar as regras oficiais', () => {
    const resCrit = resolverAtaqueMultiAlvos({
      totalPrecisao: 12, d1: 6, d2: 6, danoBase: 15, tipoDano: 'fisico',
      alvos: [alvoA, alvoB, { id: 'boss', nome: 'Dragao', def: 25 }]
    });
    assert.equal(resCrit.isCritico, true);
    assert.equal(resCrit.oportunidadeHabilitada, true);
    assert.equal(resCrit.totalAtingidos, 3);

    const resFumble = resolverAtaqueMultiAlvos({
      totalPrecisao: 2, d1: 1, d2: 1, danoBase: 20, tipoDano: 'fisico',
      alvos: [alvoA, alvoB]
    });
    assert.equal(resFumble.isFumble, true);
    assert.equal(resFumble.totalAtingidos, 0);
  });

  it('deve aplicar afinidades elementais, sinonimos (sombrio/trevas) e guarda alvo a alvo vs DEF.M', () => {
    const res = resolverAtaqueMultiAlvos({
      totalPrecisao: 13, d1: 5, d2: 8, danoBase: 10, tipoDano: 'fogo',
      alvos: [alvoB, alvoC, alvoD], tipoDefesa: 'mdef'
    });

    assert.equal(res.totalAtingidos, 3);
    assert.equal(res.resultadosAlvos[0].afinidade, AFINIDADES_DANO.VULNERAVEL);
    assert.equal(res.resultadosAlvos[0].danoFinal, 20);
    assert.equal(res.resultadosAlvos[1].afinidade, AFINIDADES_DANO.RESISTENTE);
    assert.equal(res.resultadosAlvos[1].danoFinal, 5);
    assert.equal(res.resultadosAlvos[2].afinidade, AFINIDADES_DANO.ABSORVE);
    assert.equal(res.resultadosAlvos[2].curaAbsorvida, 10);

    const alvoTrevas = { id: 't1', afinidades: { trevas: 'vul', Físico: 'res', ar: 'imu' } };
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'sombrio'), AFINIDADES_DANO.VULNERAVEL);
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'fisico'), AFINIDADES_DANO.RESISTENTE);
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'vento'), AFINIDADES_DANO.IMUNE);
  });
});

describe('Fabula Ultima - Resolucao de Feiticos, Vismagus e Auditoria de Condicoes', () => {
  it('classificarTipoMagia e extrairDadosOfensivosMagia devem operar com precisao', () => {
    assert.equal(classificarTipoMagia({ isArcano: true, nome: 'Invocacao Ifrit' }), 'arcano');
    assert.equal(classificarTipoMagia({ nome: 'Ignis', bonusDano: 5, tipoDano: 'fogo' }), 'ofensiva');
    assert.equal(classificarTipoMagia({ nome: 'Cura', ofensiva: true, descricao: 'O alvo recupera 40 PV.' }), 'suporte');
    assert.equal(classificarTipoMagia({ nome: 'Purificacao', ofensiva: true, descricao: 'Remove todas as condicoes.' }), 'suporte');

    const infoIgnis = extrairDadosOfensivosMagia({ nome: 'Ignis', descricao: 'O alvo sofre [RA + 15] pontos de dano de fogo.' });
    assert.equal(infoIgnis.bonusDanoDescricao, 15);
    assert.equal(infoIgnis.tipoDano, 'fogo');
  });

  it('calcularCustoEfetivoMagia, validarRecursoConjuracao e resolverFeiticoSuporteCura devem seguir as regras', () => {
    const cMulti = calcularCustoEfetivoMagia({ magia: { custoPm: '10 x A' }, quantidadeAlvos: 3 });
    assert.equal(cMulti.custoPm, 30);

    const cVismagus = calcularCustoEfetivoMagia({ magia: { custoPm: '20' }, usarVismagus: true });
    assert.equal(cVismagus.custoPm, 0);
    assert.equal(cVismagus.custoPv, 30);

    const mago = { id: 'c1', nome: 'Mago', mp_atual: 15, hp_atual: 30, hp_max: 40 };
    assert.equal(validarRecursoConjuracao({ combatente: mago, custoPm: 10 }).valido, true);
    assert.equal(validarRecursoConjuracao({ combatente: mago, custoPv: 30 }).valido, false);

    const aliado = { id: 'c2', nome: 'Guerreiro', hp_atual: 10, hp_max: 50, condicoes: ['lento'] };
    const resCura = resolverFeiticoSuporteCura({
      magia: { nome: 'Cura', descricao: 'O alvo recupera 30 PV e cura todas as condicoes.' },
      conjurador: mago, alvos: [aliado], custoPm: 10, bonusPoderCurativo: 5
    });
    assert.equal(resCura.curaPvFinal, 35);
    assert.equal(resCura.updatesAlvos[0].hp_atual, 45);
    assert.deepEqual(resCura.updatesAlvos[0].condicoes, []);

    const curaPm = extrairValorCuraMagia({ nome: 'Espirito Sereno', descricao: 'Recupera 25 PM de um aliado.' });
    assert.equal(curaPm.valorPm, 25);
  });

  it('auditoria de condicoes oficiais nos presets: Abalado reduz VON e Atordoado reduz AST', () => {
    const presetsCondenar = obterPresetsHabilidade({ codigo: 'CONDENAR', nivel: 1 });
    assert.match(presetsCondenar[0].descricao, /Abalado \(VON ↓\)/);
    assert.match(presetsCondenar[1].descricao, /Atordoado \(AST ↓\)/);
  });
});
