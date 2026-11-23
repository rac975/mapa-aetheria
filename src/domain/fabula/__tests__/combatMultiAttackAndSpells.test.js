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

describe('Fabula Ultima - Ataque Multi & Checagem de Precisao vs Defesas', () => {
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

  it('sucesso critico (duplo >= 6) deve atingir todos os alvos e habilitar oportunidade', () => {
    const res = resolverAtaqueMultiAlvos({
      totalPrecisao: 12,
      d1: 6,
      d2: 6,
      danoBase: 15,
      tipoDano: 'fisico',
      alvos: [alvoA, alvoB, { id: 'boss', nome: 'Dragao', def: 25 }],
      tipoDefesa: 'def'
    });

    assert.equal(res.isCritico, true);
    assert.equal(res.oportunidadeHabilitada, true);
    assert.equal(res.totalAtingidos, 3);
    assert.equal(res.resultadosAlvos[2].atingiu, true);
  });

  it('falha critica (fumble: duplo 1) deve errar todos os alvos e habilitar oportunidade para oponentes', () => {
    const res = resolverAtaqueMultiAlvos({
      totalPrecisao: 2,
      d1: 1,
      d2: 1,
      danoBase: 20,
      tipoDano: 'fisico',
      alvos: [alvoA, alvoB],
      tipoDefesa: 'def'
    });

    assert.equal(res.isFumble, true);
    assert.equal(res.oportunidadeHabilitada, true);
    assert.equal(res.totalAtingidos, 0);
    assert.equal(res.resultadosAlvos[0].atingiu, false);
    assert.equal(res.resultadosAlvos[1].atingiu, false);
  });

  it('deve aplicar afinidades elementais, sinonimos (sombrio/trevas) e guarda alvo a alvo vs DEF.M', () => {
    const res = resolverAtaqueMultiAlvos({
      totalPrecisao: 13,
      d1: 5,
      d2: 8,
      danoBase: 10,
      tipoDano: 'fogo',
      alvos: [alvoB, alvoC, alvoD],
      tipoDefesa: 'mdef'
    });

    assert.equal(res.totalAtingidos, 3);
    assert.equal(res.resultadosAlvos[0].afinidade, AFINIDADES_DANO.VULNERAVEL);
    assert.equal(res.resultadosAlvos[0].danoFinal, 20);
    assert.equal(res.resultadosAlvos[1].afinidade, AFINIDADES_DANO.RESISTENTE);
    assert.equal(res.resultadosAlvos[1].danoFinal, 5);
    assert.equal(res.resultadosAlvos[2].afinidade, AFINIDADES_DANO.ABSORVE);
    assert.equal(res.resultadosAlvos[2].curaAbsorvida, 10);
    assert.equal(res.resultadosAlvos[2].danoFinal, 0);

    const alvoTrevas = { id: 't1', afinidades: { trevas: 'vul', Físico: 'res', ar: 'imu' } };
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'sombrio'), AFINIDADES_DANO.VULNERAVEL);
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'sombra'), AFINIDADES_DANO.VULNERAVEL);
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'fisico'), AFINIDADES_DANO.RESISTENTE);
    assert.equal(obterAfinidadeAlvoPorTipoDano(alvoTrevas, 'vento'), AFINIDADES_DANO.IMUNE);
  });
});

describe('Fabula Ultima - Resolucao de Feiticos, Vismagus e Auditoria de Condicoes', () => {
  it('classificarTipoMagia deve categorizar suporte mesmo se flag ofensiva legada estiver true', () => {
    assert.equal(classificarTipoMagia({ isArcano: true, nome: 'Invocacao Ifrit' }), 'arcano');
    assert.equal(classificarTipoMagia({ nome: 'Ignis', bonusDano: 5, tipoDano: 'fogo' }), 'ofensiva');
    assert.equal(classificarTipoMagia({ nome: 'Relampago', ofensiva: true }), 'ofensiva');
    assert.equal(classificarTipoMagia({ nome: 'Cura', ofensiva: true, descricao: 'O alvo recupera 40 PV.' }), 'suporte');
    assert.equal(classificarTipoMagia({ nome: 'Purificacao', ofensiva: true, descricao: 'Remove todas as condicoes.' }), 'suporte');
    assert.equal(classificarTipoMagia({ nome: 'Visao Noturna', descricao: 'Enxerga no escuro' }), 'utilidade');
  });

  it('extrairDadosOfensivosMagia deve detectar formula [RA + X] e elemento a partir da descricao', () => {
    const infoIgnis = extrairDadosOfensivosMagia({
      nome: 'Ignis',
      descricao: 'O alvo sofre [RA + 15] pontos de dano de fogo.'
    });
    assert.equal(infoIgnis.bonusDanoDescricao, 15);
    assert.equal(infoIgnis.tipoDano, 'fogo');

    const infoUmbra = extrairDadosOfensivosMagia({
      nome: 'Umbra',
      descricao: 'Causa [RA + 20] de dano de trevas.'
    });
    assert.equal(infoUmbra.bonusDanoDescricao, 20);
    assert.equal(infoUmbra.tipoDano, 'trevas');
  });

  it('extrairValorCuraMagia deve extrair valores de PV e PM da descricao', () => {
    const cura1 = extrairValorCuraMagia({ nome: 'Cura Maior', descricao: 'Alvo recupera 50 PV imediatamente.' });
    assert.equal(cura1.valorPv, 50);

    const cura2 = extrairValorCuraMagia({ nome: 'Espirito Sereno', descricao: 'Recupera 25 PM de um aliado.' });
    assert.equal(cura2.valorPm, 25);
  });

  it('calcularCustoEfetivoMagia deve suportar custo fixo, por alvo, decretos e Vismagus oficial (10 + PM)', () => {
    const cFixo = calcularCustoEfetivoMagia({ magia: { custoPm: '10' }, quantidadeAlvos: 3 });
    assert.equal(cFixo.custoPm, 10);

    const cMulti = calcularCustoEfetivoMagia({ magia: { custoPm: '10 x A' }, quantidadeAlvos: 3 });
    assert.equal(cMulti.custoPm, 30);
    assert.equal(cMulti.isMultiplicativoPorAlvo, true);

    const cDecreto = calcularCustoEfetivoMagia({
      magia: { custoPm: '10 x A' },
      quantidadeAlvos: 2,
      decretoDobrarPm: true
    });
    assert.equal(cDecreto.custoPm, 40);

    // Regra oficial Vismagus (Espiritualista): 10 + custo total em PM do feitico
    const cVismagus = calcularCustoEfetivoMagia({
      magia: { custoPm: '20' },
      usarVismagus: true
    });
    assert.equal(cVismagus.custoPm, 0);
    assert.equal(cVismagus.custoPv, 30);
  });

  it('validarRecursoConjuracao e resolverFeiticoSuporteCura devem validar e aplicar efeitos corretamente', () => {
    const mago = { id: 'c1', nome: 'Mago', mp_atual: 15, hp_atual: 30, hp_max: 40 };
    assert.equal(validarRecursoConjuracao({ combatente: mago, custoPm: 10 }).valido, true);
    assert.equal(validarRecursoConjuracao({ combatente: mago, custoPm: 20 }).valido, false);
    assert.equal(validarRecursoConjuracao({ combatente: mago, custoPv: 30 }).valido, false);

    const aliado = { id: 'c2', nome: 'Guerreiro', hp_atual: 10, hp_max: 50, condicoes: ['lento'] };
    const resCura = resolverFeiticoSuporteCura({
      magia: { nome: 'Cura', descricao: 'O alvo recupera 30 PV e cura todas as condicoes.' },
      conjurador: mago,
      alvos: [aliado],
      custoPm: 10,
      bonusPoderCurativo: 5
    });
    assert.equal(resCura.curaPvFinal, 35);
    assert.equal(resCura.updatesAlvos[0].hp_atual, 45);
    assert.deepEqual(resCura.updatesAlvos[0].condicoes, []);
  });

  it('auditoria de condicoes oficiais nos presets: Abalado reduz VON e Atordoado reduz AST', () => {
    const presetsCondenar = obterPresetsHabilidade({ codigo: 'CONDENAR', nivel: 1 });
    assert.match(presetsCondenar[0].descricao, /Abalado \(VON ↓\)/);
    assert.match(presetsCondenar[1].descricao, /Atordoado \(AST ↓\)/);

    const presetsQuebraOssos = obterPresetsHabilidade({ codigo: 'QUEBRA_OSSOS', nivel: 1 });
    assert.match(presetsQuebraOssos[0].descricao, /Atordoado \(AST ↓\)/);

    const presetsTiroAviso = obterPresetsHabilidade({ codigo: 'TIRO_DE_AVISO', nivel: 1 });
    assert.match(presetsTiroAviso[0].descricao, /Abalado \(VON ↓\)/);
  });
});
