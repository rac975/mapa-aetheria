import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesLadino,
  calcularDanoGolpeBaixo,
  calcularResolucaoRouboDeAlma,
  gerarAcoesConflitoLadino
} from '../rogueRules.js';
import { construirFilaUnificadaCombate } from '../combatQueueRules.js';

test('Fabula Ultima - Ladino: extração de habilidades e poderes heroicos', () => {
  const fichaLadino = {
    nivel: 15,
    classes: [
      {
        nome_classe: 'Ladino',
        nivel: 5,
        habilidades: [
          { nome: 'Alta Velocidade', nivel: 2 },
          { nome: 'Esquiva', nivel: 3 },
          { nome: 'Golpe Baixo', nivel: 4 },
          { nome: 'Roubo de Alma', nivel: 3 },
          { nome: 'Vejo Você Mais Tarde', nivel: 1 }
        ]
      }
    ],
    poderes_heroicos: ['Pilhar', 'Sumir']
  };

  const dados = extrairHabilidadesLadino({ ficha: fichaLadino });
  assert.equal(dados.temClasseLadino, true);
  assert.equal(dados.habilidades.altaVelocidade.bonusTeste, 2);
  assert.equal(dados.habilidades.esquiva.bonusDefesa, 3);
  assert.equal(dados.habilidades.golpeBaixo.nivel, 4);
  assert.equal(dados.habilidades.rouboDeAlma.bonusTeste, 3);
  assert.equal(dados.habilidades.vejoVoceMaisTarde.ativo, true);
  assert.equal(dados.poderesHeroicos.pilhar, true);
  assert.equal(dados.poderesHeroicos.sumir, true);
});

test('Fabula Ultima - Ladino: combatente sem a classe não ativa Ladino', () => {
  const fichaMago = { classes: [{ nome_classe: 'Elementalista', nivel: 5 }] };
  const dados = extrairHabilidadesLadino({ ficha: fichaMago });
  assert.equal(dados.temClasseLadino, false);
  const acoes = gerarAcoesConflitoLadino({ ficha: fichaMago });
  assert.equal(acoes.length, 0);
});

test('Fabula Ultima - Ladino: cálculo de dano adicional de Golpe Baixo', () => {
  // Alvo único com 2 condições (Envenenado e Lento) e Golpe Baixo Nv 3 = 3 + 2 = +5 dano
  const bonus2Cond = calcularDanoGolpeBaixo({
    nivelGolpeBaixo: 3,
    condicoesAlvo: ['envenenado', 'lento'],
    isAlvoUnico: true
  });
  assert.equal(bonus2Cond, 5);

  // Alvo sem condições = 0 de dano adicional
  const bonusSemCond = calcularDanoGolpeBaixo({
    nivelGolpeBaixo: 3,
    condicoesAlvo: [],
    isAlvoUnico: true
  });
  assert.equal(bonusSemCond, 0);

  // Multi-alvo (mesmo com condições) não recebe Golpe Baixo
  const bonusMulti = calcularDanoGolpeBaixo({
    nivelGolpeBaixo: 3,
    condicoesAlvo: ['envenenado'],
    isAlvoUnico: false
  });
  assert.equal(bonusMulti, 0);
});

test('Fabula Ultima - Ladino: resolução oficial de Roubo de Alma', () => {
  // Sucesso contra Soldado com NP 3: recupera 3 PI
  const resSoldado = calcularResolucaoRouboDeAlma({
    nivelHabilidade: 3,
    totalRolado: 14,
    mdefAlvo: 10,
    tipoAlvo: 'soldado'
  });
  assert.equal(resSoldado.sucesso, true);
  assert.equal(resSoldado.piRecuperados, 3);
  assert.equal(resSoldado.valorZenites, 0);

  // Sucesso contra Elite Nv 10: ganha Tesouro da Alma de 10 * 30z = 300z
  const resElite = calcularResolucaoRouboDeAlma({
    nivelHabilidade: 2,
    totalRolado: 12,
    mdefAlvo: 11,
    tipoAlvo: 'elite',
    nivelAlvo: 10,
    isVilao: false
  });
  assert.equal(resElite.sucesso, true);
  assert.equal(resElite.piRecuperados, 0);
  assert.equal(resElite.valorZenites, 300);

  // Sucesso contra Vilão Nv 20: ganha Tesouro da Alma de 20 * 50z = 1000z
  const resVilao = calcularResolucaoRouboDeAlma({
    nivelHabilidade: 4,
    totalRolado: 16,
    mdefAlvo: 12,
    tipoAlvo: 'campeao',
    nivelAlvo: 20,
    isVilao: true
  });
  assert.equal(resVilao.sucesso, true);
  assert.equal(resVilao.valorZenites, 1000);

  // Falha (não atingiu M.DEF)
  const resFalha = calcularResolucaoRouboDeAlma({
    nivelHabilidade: 1,
    totalRolado: 8,
    mdefAlvo: 12
  });
  assert.equal(resFalha.sucesso, false);
  assert.equal(resFalha.piRecuperados, 0);
});

test('Fabula Ultima - Ladino: geração de ações e integração com combate', async () => {
  const { extrairPerfilRolagemCombatente, resolverAcaoCombate } = await import('../combatRules.js');

  const ficha = {
    nome_personagem: 'Vaan',
    destreza: 10,
    astucia: 8,
    vigor: 8,
    vontade: 8,
    classes: [
      {
        nome_classe: 'Ladino',
        nivel: 10,
        habilidades: [
          { nome: 'Golpe Baixo', nivel: 3 },
          { nome: 'Roubo de Alma', nivel: 4 },
          { nome: 'Vejo Você Mais Tarde', nivel: 1 }
        ]
      }
    ],
    poderes_heroicos: ['Sumir']
  };

  const combatente = {
    id: 'hero_vaan',
    nome: 'Vaan',
    tipo: 'heroi',
    hp_atual: 40,
    hp_max: 40,
    mp_atual: 35,
    mp_max: 35,
    pontos_fabula: 2,
    ip: 4
  };

  const perfil = extrairPerfilRolagemCombatente({ combatente, ficha });
  assert.equal(perfil.dadosLadino.temClasseLadino, true);

  const codigos = perfil.habilidades.map((h) => h.codigo);
  assert.ok(codigos.includes('ROUBO_DE_ALMA'));
  assert.ok(codigos.includes('GOLPE_BAIXO'));
  assert.ok(codigos.includes('VEJO_VOCE_MAIS_TARDE'));
  assert.ok(codigos.includes('SUMIR'));

  // Executa Vejo Você Mais Tarde (gasta 1 PF e escapa da cena)
  const resFuga = resolverAcaoCombate({
    acaoCodigo: 'VEJO_VOCE_MAIS_TARDE',
    ator: combatente,
    custoPf: 1
  });
  assert.equal(resFuga.valido, true);
  assert.equal(resFuga.updatesAtor.pontos_fabula, 1);
  assert.equal(resFuga.updatesAtor.fugiu, true);

  // Executa Roubo de Alma bem-sucedido contra Soldado (recupera 4 PI)
  const resRoubo = resolverAcaoCombate({
    acaoCodigo: 'ROUBO_DE_ALMA',
    ator: combatente,
    alvo: { id: 'soldado_1', nome: 'Guarda Imperial', mdef: 8 },
    piRecuperados: 4,
    notaLivre: 'Roubo de Alma obteve sucesso! +4 PI'
  });
  assert.equal(resRoubo.valido, true);
  assert.equal(resRoubo.updatesAtor.ip, 6); // 4 + 4 PI (clamp no max 6)

  // Executa Sumir (gasta 1 PF e fica invisível)
  const resSumir = resolverAcaoCombate({
    acaoCodigo: 'SUMIR',
    ator: combatente,
    custoPf: 1
  });
  assert.equal(resSumir.valido, true);
  assert.equal(resSumir.updatesAtor.pontos_fabula, 1);
  assert.equal(resSumir.updatesAtor.modificadores?.invisivel, true);
});

test('Fabula Ultima - Ladino: combatente que fugiu via Vejo Você Mais Tarde não entra na fila unificada', () => {
  const heroiFugitivo = { id: 'vaan', nome: 'Vaan', tipo: 'heroi', hp_atual: 40, fugiu: true };
  const heroiAtivo = { id: 'penelo', nome: 'Penelo', tipo: 'heroi', hp_atual: 35 };
  const inimigo = { id: 'goblin', nome: 'Goblin', tipo: 'inimigo', hp_atual: 20 };

  const fila = construirFilaUnificadaCombate([heroiFugitivo, heroiAtivo, inimigo]);
  const idsNaFila = fila.map((item) => item.participante.id);
  assert.ok(!idsNaFila.includes('vaan'));
  assert.ok(idsNaFila.includes('penelo'));
  assert.ok(idsNaFila.includes('goblin'));
});
