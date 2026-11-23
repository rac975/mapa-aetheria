import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesAtirador,
  calcularBonusDanoAtirador,
  calcularResolucaoFogoCruzado,
  calcularEfeitoTiroDeAviso,
  gerarAcoesConflitoAtirador
} from '../sharpshooterRules.js';

test('Fabula Ultima - Atirador: extração correta de habilidades e poderes heroicos', () => {
  const fichaAtirador = {
    nivel: 25,
    classes: [
      {
        nome_classe: 'Atirador',
        nivel: 5,
        habilidades: [
          { nome: 'Barragem', nivel: 1 },
          { nome: 'Fogo Cruzado', nivel: 1 },
          { nome: 'Maestria com Armas à Distância', nivel: 4 },
          { nome: 'Olhos de Águia', nivel: 3 },
          { nome: 'Tiro de Aviso', nivel: 2 }
        ]
      }
    ],
    poderes_heroicos: ['Tiro Poderoso', 'Mira Perfeita', 'Tiroteio']
  };

  const dados = extrairHabilidadesAtirador({ ficha: fichaAtirador });
  assert.equal(dados.temClasseAtirador, true);
  assert.equal(dados.habilidades.barragem.ativo, true);
  assert.equal(dados.habilidades.barragem.custoPm, 10);
  assert.equal(dados.habilidades.fogoCruzado.ativo, true);
  assert.equal(dados.habilidades.maestriaDistancia.bonusPrecisao, 4);
  assert.equal(dados.habilidades.olhosDeAguia.bonusDanoProximoAtaque, 9); // 3 * 3
  assert.equal(dados.habilidades.tiroDeAviso.perdaPmAlvo, 20); // 2 * 10
  assert.equal(dados.poderesHeroicos.tiroPoderoso, true);
  assert.equal(dados.poderesHeroicos.miraPerfeita, true);
  assert.equal(dados.poderesHeroicos.tiroteio, true);
});

test('Fabula Ultima - Atirador: personagem sem a classe não ativa Atirador', () => {
  const fichaGuerreiro = {
    classes: [{ nome_classe: 'Guardião', nivel: 5 }]
  };
  const dados = extrairHabilidadesAtirador({ ficha: fichaGuerreiro });
  assert.equal(dados.temClasseAtirador, false);
  assert.equal(dados.habilidades.barragem.ativo, false);
  const acoes = gerarAcoesConflitoAtirador({ ficha: fichaGuerreiro });
  assert.equal(acoes.length, 0);
});

test('Fabula Ultima - Atirador: cálculo de bônus de dano de Tiro Poderoso e Mira Arcana', () => {
  const dados = {
    temClasseAtirador: true,
    poderesHeroicos: { tiroPoderoso: true, miraArcana: true }
  };

  // Nível < 40 com arma à distância comum
  const bonusNv25 = calcularBonusDanoAtirador({
    dadosAtirador: dados,
    nivelTotal: 25,
    isDistancia: true,
    isArmaArcana: false
  });
  assert.equal(bonusNv25, 5);

  // Nível >= 40 com arma à distância comum
  const bonusNv45 = calcularBonusDanoAtirador({
    dadosAtirador: dados,
    nivelTotal: 45,
    isDistancia: true,
    isArmaArcana: false
  });
  assert.equal(bonusNv45, 10);

  // Arma arcana à distância com Mira Arcana (+5 de Tiro Poderoso + 5 de Mira Arcana)
  const bonusArcana = calcularBonusDanoAtirador({
    dadosAtirador: dados,
    nivelTotal: 25,
    isDistancia: true,
    isArmaArcana: true
  });
  assert.equal(bonusArcana, 10);
});

test('Fabula Ultima - Atirador: resolução de Fogo Cruzado e Tiroteio', () => {
  // Teste de Precisão 12 do inimigo: custo 5 + 12 = 17 PM
  const resSucesso = calcularResolucaoFogoCruzado({
    nivelHabilidade: 1,
    testePrecisaoAtacante: 12,
    isSucessoCritico: false,
    temTiroteio: true,
    temArmaFogo: true
  });
  assert.equal(resSucesso.permitido, true);
  assert.equal(resSucesso.custoPm, 17);
  assert.equal(resSucesso.contraAtaqueLivre, true); // 12 é par!

  // Precisão ímpar (11): sem contra-ataque
  const resImpar = calcularResolucaoFogoCruzado({
    nivelHabilidade: 1,
    testePrecisaoAtacante: 11,
    isSucessoCritico: false,
    temTiroteio: true,
    temArmaFogo: true
  });
  assert.equal(resImpar.contraAtaqueLivre, false);

  // Sucesso crítico inimigo: Fogo Cruzado bloqueado
  const resCritico = calcularResolucaoFogoCruzado({
    nivelHabilidade: 1,
    testePrecisaoAtacante: 16,
    isSucessoCritico: true
  });
  assert.equal(resCritico.permitido, false);
  assert.match(resCritico.motivo, /Sucesso Crítico/i);
});

test('Fabula Ultima - Atirador: cálculo e opções de Tiro de Aviso', () => {
  // Padrão sem Mira Perfeita: 1 opção
  const res1 = calcularEfeitoTiroDeAviso({
    nivelHabilidade: 3,
    temMiraPerfeita: false,
    escolhas: ['abalado', 'lento']
  });
  assert.equal(res1.valido, true);
  assert.deepEqual(res1.condicoes, ['abalado']);
  assert.equal(res1.danoCausado, 0);

  // Com Mira Perfeita: até 2 opções (ex: Lento + Drenar PM)
  const res2 = calcularEfeitoTiroDeAviso({
    nivelHabilidade: 4,
    temMiraPerfeita: true,
    escolhas: ['lento', 'perda_pm']
  });
  assert.equal(res2.valido, true);
  assert.deepEqual(res2.condicoes, ['lento']);
  assert.equal(res2.perdaPm, 40); // 4 * 10
});

test('Fabula Ultima - Atirador: geração de ações de conflito ativas', () => {
  const ficha = {
    classes: [
      {
        nome_classe: 'Atirador',
        nivel: 5,
        habilidades: [
          { nome: 'Barragem', nivel: 1 },
          { nome: 'Fogo Cruzado', nivel: 1 },
          { nome: 'Olhos de Águia', nivel: 2 },
          { nome: 'Tiro de Aviso', nivel: 1 }
        ]
      }
    ],
    poderes_heroicos: ['Isca Chamariz']
  };

  const armas = [{ nome: 'Arco Longo', alcance: 'distancia', tipo: 'arco' }];
  const acoes = gerarAcoesConflitoAtirador({ ficha, armas });

  const codigos = acoes.map((a) => a.codigo);
  assert.ok(codigos.includes('BARRAGEM'));
  assert.ok(codigos.includes('OLHOS_DE_AGUIA_DANO'));
  assert.ok(codigos.includes('OLHOS_DE_AGUIA_TIRO_LIVRE'));
  assert.ok(codigos.includes('ISCA_CHAMARIZ'));
  assert.ok(codigos.includes('TIRO_DE_AVISO'));
  assert.ok(codigos.includes('FOGO_CRUZADO'));
});

test('Fabula Ultima - Atirador: integração com perfil de rolagem e resolução de combate', async () => {
  const { extrairPerfilRolagemCombatente, resolverAcaoCombate } = await import('../combatRules.js');

  const ficha = {
    nome_personagem: 'Elysia',
    destreza: 10,
    astucia: 8,
    vigor: 8,
    vontade: 6,
    classes: [
      {
        nome_classe: 'Atirador',
        nivel: 10,
        habilidades: [
          { nome: 'Barragem', nivel: 1 },
          { nome: 'Maestria com Armas à Distância', nivel: 3 },
          { nome: 'Tiro de Aviso', nivel: 2 }
        ]
      }
    ],
    poderes_heroicos: ['Tiro Poderoso'],
    itens: [
      {
        id: 'arco_1',
        nome: 'Arco de Caça',
        equipado: true,
        tipo: 'arma_distancia',
        stats: { attr1: 'des', attr2: 'des', dano: 6, alcance: 'distancia' }
      }
    ]
  };

  const combatente = {
    id: 'hero_elysia',
    nome: 'Elysia',
    tipo: 'heroi',
    hp_atual: 45,
    hp_max: 45,
    mp_atual: 40,
    mp_max: 40
  };

  const perfil = extrairPerfilRolagemCombatente({ combatente, ficha });
  assert.equal(perfil.dadosAtirador.temClasseAtirador, true);
  // Maestria +3 na precisão e Tiro Poderoso +5 no dano (6 + 5 = 11)
  const arco = perfil.armas.find((a) => a.nome === 'Arco de Caça');
  assert.ok(arco);
  assert.equal(arco.bonusPrecisao, 3);
  assert.equal(arco.bonusDano, 11);

  // Ação Barragem consome 10 PM
  const resBarragem = resolverAcaoCombate({
    acaoCodigo: 'BARRAGEM',
    ator: combatente,
    custoPm: 10
  });
  assert.equal(resBarragem.valido, true);
  assert.equal(resBarragem.updatesAtor.mp_atual, 30);

  // Ação Tiro de Aviso drena 20 PM e aplica Abalado sem causar dano
  const alvo = { id: 'inimigo_1', nome: 'Capitão Pirata', hp_atual: 60, hp_max: 60, mp_atual: 50, mp_max: 50 };
  const resAviso = resolverAcaoCombate({
    acaoCodigo: 'TIRO_DE_AVISO',
    ator: combatente,
    alvo,
    condicaoAlvo: 'abalado',
    perdaPmAlvo: 20,
    danoAplicado: 0
  });
  assert.equal(resAviso.valido, true);
  assert.equal(resAviso.updatesAlvo.mp_atual, 30);
  assert.ok(resAviso.updatesAlvo.condicoes.includes('abalado'));
  assert.equal(resAviso.updatesAlvo.hp_atual, undefined);
});
