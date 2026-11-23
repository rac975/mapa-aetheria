import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesPiloto,
  calcularEfeitoCoracaoNoMotor,
  gerarAcoesConflitoPiloto
} from '../pilotCombatRules.js';
import { resolverAcaoCombate } from '../combatRules.js';

test('Fabula Ultima - Piloto: extração de habilidades da ficha', () => {
  const ficha = {
    nivel: 20,
    classes: [
      {
        nome_classe: 'Piloto',
        nivel: 10,
        habilidades: [
          { nome: 'Coração no Motor', nivel: 3 },
          { nome: 'Configuração Flexível', nivel: 2 },
          { nome: 'Veículo Pessoal', nivel: 4 }
        ]
      }
    ]
  };

  const dados = extrairHabilidadesPiloto({ ficha });
  assert.equal(dados.temClassePiloto, true);
  assert.equal(dados.habilidades.coracaoNoMotor.ativo, true);
  assert.equal(dados.habilidades.coracaoNoMotor.nivel, 3);
  assert.equal(dados.habilidades.coracaoNoMotor.bonusMax, 6);
  assert.equal(dados.habilidades.configuracaoFlexivel.ativo, true);
  assert.equal(dados.habilidades.configuracaoFlexivel.nivel, 2);
});

test('Fabula Ultima - Piloto: personagem sem a classe não ativa Piloto', () => {
  const ficha = {
    classes: [{ nome_classe: 'Elementalista', nivel: 5 }]
  };
  const dados = extrairHabilidadesPiloto({ ficha });
  assert.equal(dados.temClassePiloto, false);
  assert.equal(gerarAcoesConflitoPiloto({ ficha }).length, 0);
});

test('Fabula Ultima - Piloto: cálculo oficial de Coração no Motor (10 PM)', () => {
  const resAtaque = calcularEfeitoCoracaoNoMotor(2, 'ataque');
  assert.equal(resAtaque.bonusDano, 4);
  assert.equal(resAtaque.custoMp, 10);
  assert.ok(resAtaque.mensagem.includes('+4 de dano'));

  const resDefesa = calcularEfeitoCoracaoNoMotor(3, 'defesa');
  assert.equal(resDefesa.reducaoDano, 6);
  assert.equal(resDefesa.custoMp, 10);
  assert.ok(resDefesa.mensagem.includes('reduzido em 6'));

  const resCura = calcularEfeitoCoracaoNoMotor(1, 'cura');
  assert.deepEqual(resCura.curaStatus, ['lento', 'fraco']);
  assert.equal(resCura.custoMp, 10);
});

test('Fabula Ultima - Piloto: geração de ações de conflito', () => {
  const ficha = {
    classes: [
      {
        nome_classe: 'Piloto',
        nivel: 5,
        habilidades: [
          { nome: 'Coração no Motor', nivel: 2 },
          { nome: 'Configuração Flexível', nivel: 1 }
        ]
      }
    ]
  };

  const acoes = gerarAcoesConflitoPiloto({ ficha });
  assert.equal(acoes.length, 2);
  const codigos = acoes.map((a) => a.codigo);
  assert.ok(codigos.includes('CORACAO_NO_MOTOR'));
  assert.ok(codigos.includes('CONFIGURACAO_FLEXIVEL'));
});

test('Fabula Ultima - Piloto: resolverAcaoCombate com Coração no Motor e Configuração Flexível sem alvo', () => {
  const ator = {
    id: 'heroi_piloto',
    nome: 'Gideon',
    tipo: 'heroi',
    hp_atual: 45,
    hp_max: 45,
    mp_atual: 30,
    mp_max: 30
  };

  // 1. Coração no Motor: 10 PM sem necessidade de alvo
  const resCoracao = resolverAcaoCombate({
    acaoCodigo: 'CORACAO_NO_MOTOR',
    ator,
    alvo: null,
    custoPm: 10,
    marcarTurnoConcluido: false
  });

  assert.equal(resCoracao.valido, true);
  assert.equal(resCoracao.updatesAtor.mp_atual, 20);
  assert.ok(resCoracao.logEntry.detalhes.includes('Coração no Motor'));

  // 2. Configuração Flexível: 0 PM sem alvo
  const resFlex = resolverAcaoCombate({
    acaoCodigo: 'CONFIGURACAO_FLEXIVEL',
    ator,
    alvo: null,
    custoPm: 0,
    marcarTurnoConcluido: true
  });

  assert.equal(resFlex.valido, true);
  assert.equal(resFlex.updatesAtor.agiu, true);
  assert.equal(resFlex.updatesAtor.turno_atual, false);
  assert.ok(resFlex.logEntry.detalhes.includes('Configuração Flexível'));
});

test('Fabula Ultima - Central de Turno: PASSAR_TURNO conclui o turno e avança fila', () => {
  const ator = {
    id: 'heroi_1',
    nome: 'Gideon',
    tipo: 'heroi',
    hp_atual: 40,
    hp_max: 40,
    mp_atual: 30,
    mp_max: 30
  };

  const res = resolverAcaoCombate({
    acaoCodigo: 'PASSAR_TURNO',
    ator,
    alvo: null,
    marcarTurnoConcluido: true
  });

  assert.equal(res.valido, true);
  assert.equal(res.updatesAtor.agiu, true);
  assert.equal(res.updatesAtor.turno_atual, false);
  assert.ok(res.logEntry.detalhes.includes('Passou o Turno'));
});
