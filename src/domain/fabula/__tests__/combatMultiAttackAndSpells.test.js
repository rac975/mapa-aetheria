import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolverAtaqueMultiAlvos } from '../combatMultiAttackRules.js';
import {
  classificarTipoMagia,
  extrairValorCuraMagia,
  calcularCustoEfetivoMagia,
  validarRecursoConjuracao,
  resolverFeiticoSuporteCura
} from '../combatSpellResolutionRules.js';
import { AFINIDADES_DANO } from '../combatRules.js';

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
    assert.equal(res.resultadosAlvos[0].atingiu, true); // 11 >= 10
    assert.equal(res.resultadosAlvos[0].danoFinal, 10);
    assert.equal(res.resultadosAlvos[1].atingiu, false); // 11 < 14
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

  it('deve aplicar afinidades elementais e guarda alvo a alvo com precisao vs DEF.M', () => {
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
    // Alvo B: Vulneravel (10 * 2 = 20)
    assert.equal(res.resultadosAlvos[0].afinidade, AFINIDADES_DANO.VULNERAVEL);
    assert.equal(res.resultadosAlvos[0].danoFinal, 20);

    // Alvo C: Resistente + Guardando (conforme regra oficial de Fabula Ultima, Guarda concede Resistência; resistências não acumulam em 1/4, então dano = 10 / 2 = 5)
    assert.equal(res.resultadosAlvos[1].afinidade, AFINIDADES_DANO.RESISTENTE);
    assert.equal(res.resultadosAlvos[1].danoFinal, 5);

    // Alvo D: Absorve (cura 10 PV)
    assert.equal(res.resultadosAlvos[2].afinidade, AFINIDADES_DANO.ABSORVE);
    assert.equal(res.resultadosAlvos[2].curaAbsorvida, 10);
    assert.equal(res.resultadosAlvos[2].danoFinal, 0);
  });
});

describe('Fabula Ultima - Resolucao de Feiticos e Magias Funcionais', () => {
  it('classificarTipoMagia deve categorizar corretamente ofensiva, suporte e arcanos', () => {
    assert.equal(classificarTipoMagia({ isArcano: true, nome: 'Invocacao Ifrit' }), 'arcano');
    assert.equal(classificarTipoMagia({ nome: 'Ignis', bonusDano: 5, tipoDano: 'fogo' }), 'ofensiva');
    assert.equal(classificarTipoMagia({ nome: 'Relampago', ofensiva: true }), 'ofensiva');
    assert.equal(classificarTipoMagia({ nome: 'Cura', descricao: 'O alvo recupera 40 PV.' }), 'suporte');
    assert.equal(classificarTipoMagia({ nome: 'Purificacao', descricao: 'Remove todas as condicoes.' }), 'suporte');
    assert.equal(classificarTipoMagia({ nome: 'Visao Noturna', descricao: 'Enxerga no escuro' }), 'utilidade');
  });

  it('extrairValorCuraMagia deve extrair valores de PV e PM da descricao', () => {
    const cura1 = extrairValorCuraMagia({ nome: 'Cura Maior', descricao: 'Alvo recupera 50 PV imediatamente.' });
    assert.equal(cura1.valorPv, 50);

    const cura2 = extrairValorCuraMagia({ nome: 'Espirito Sereno', descricao: 'Recupera 25 PM de um aliado.' });
    assert.equal(cura2.valorPm, 25);
  });

  it('calcularCustoEfetivoMagia deve suportar custo fixo, por alvo e decretos de cena', () => {
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

    const cVismagus = calcularCustoEfetivoMagia({
      magia: { custoPm: '20' },
      usarVismagus: true
    });
    assert.equal(cVismagus.custoPm, 0);
    assert.equal(cVismagus.custoPv, 20);
  });

  it('validarRecursoConjuracao deve checar limite de PM e PV para prevencao de conjuracao invalida', () => {
    const mago = { nome: 'Mago', mp_atual: 15, hp_atual: 30 };

    const validaOk = validarRecursoConjuracao({ combatente: mago, custoPm: 10 });
    assert.equal(validaOk.valido, true);

    const validaErroPm = validarRecursoConjuracao({ combatente: mago, custoPm: 20 });
    assert.equal(validaErroPm.valido, false);
    assert.match(validaErroPm.erro, /PM suficientes/i);

    const validaErroPv = validarRecursoConjuracao({ combatente: mago, custoPv: 30 });
    assert.equal(validaErroPv.valido, false);
    assert.match(validaErroPv.erro, /PV suficientes/i);
  });

  it('resolverFeiticoSuporteCura deve aplicar cura e limpeza sem exigencia de rolagem de dados', () => {
    const conjurador = { id: 'c1', nome: 'Clerigo', hp_atual: 20, hp_max: 40, mp_atual: 30, mp_max: 40 };
    const aliado = { id: 'c2', nome: 'Guerreiro', hp_atual: 10, hp_max: 50, condicoes: ['lento'] };

    const resCura = resolverFeiticoSuporteCura({
      magia: { nome: 'Cura', descricao: 'O alvo recupera 30 PV e cura todas as condicoes.' },
      conjurador,
      alvos: [aliado],
      custoPm: 10,
      bonusPoderCurativo: 5
    });

    assert.equal(resCura.valido, true);
    assert.equal(resCura.curaPvFinal, 35); // 30 + 5 bonus
    assert.equal(resCura.updatesAlvos.length, 1);
    assert.equal(resCura.updatesAlvos[0].hp_atual, 45); // 10 + 35
    assert.deepEqual(resCura.updatesAlvos[0].condicoes, []); // condicoes limpas
    assert.match(resCura.detalhes, /Guerreiro/);
    assert.match(resCura.detalhes, /\+35 PV/);
  });

  it('resolverFeiticoSuporteCura sem alvo especificado deve beneficiar o proprio conjurador', () => {
    const conjurador = { id: 'c1', nome: 'Mago Branco', hp_atual: 15, hp_max: 40 };

    const resAuto = resolverFeiticoSuporteCura({
      magia: { nome: 'Auto-Cura', descricao: 'Recupera 20 PV.' },
      conjurador,
      alvos: [],
      custoPm: 10
    });

    assert.equal(resAuto.valido, true);
    assert.equal(resAuto.updatesAlvos.length, 1);
    assert.equal(resAuto.updatesAlvos[0].id, 'c1');
    assert.equal(resAuto.updatesAlvos[0].hp_atual, 35);
  });
});
