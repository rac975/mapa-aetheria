import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairHabilidadesMestreDeArmas,
  calcularBonusDanoAtaquePoderoso,
  calcularDanoSecundarioTrespassar,
  calcularEfeitoQuebraOssos,
  gerarAcoesConflitoMestreDeArmas
} from '../weaponmasterRules.js';

test('Fabula Ultima - Mestre de Armas: extração de habilidades e poderes heroicos', () => {
  const ficha = {
    nivel: 20,
    classes: [
      {
        nome_classe: 'Mestre de Armas',
        nivel: 5,
        habilidades: [
          { nome: 'Chuva de Lâminas', nivel: 1 },
          { nome: 'Contra-Ataque', nivel: 1 },
          { nome: 'Quebra-Ossos', nivel: 3 },
          { nome: 'Maestria com Armas Corpo a Corpo', nivel: 4 },
          { nome: 'Trespassar', nivel: 2 }
        ]
      }
    ],
    poderes_heroicos: ['Ataque Poderoso', 'Golpe Tempestuoso']
  };

  const dados = extrairHabilidadesMestreDeArmas({ ficha });
  assert.equal(dados.temClasseMestre, true);
  assert.equal(dados.habilidades.chuvaDeLaminas.ativo, true);
  assert.equal(dados.habilidades.contraAtaque.ativo, true);
  assert.equal(dados.habilidades.quebraOssos.nivel, 3);
  assert.equal(dados.habilidades.maestriaCorpoACorpo.bonusPrecisao, 4);
  assert.equal(dados.habilidades.trespassar.danoSecundario, 10);
  assert.equal(dados.poderesHeroicos.ataquePoderoso, true);
  assert.equal(dados.poderesHeroicos.golpeTempestuoso, true);
});

test('Fabula Ultima - Mestre de Armas: personagem sem a classe não ativa Mestre de Armas', () => {
  const ficha = { classes: [{ nome_classe: 'Elementalista', nivel: 5 }] };
  const dados = extrairHabilidadesMestreDeArmas({ ficha });
  assert.equal(dados.temClasseMestre, false);
  const acoes = gerarAcoesConflitoMestreDeArmas({ ficha });
  assert.equal(acoes.length, 0);
});

test('Fabula Ultima - Mestre de Armas: cálculo de Ataque Poderoso', () => {
  // Ataque corpo a corpo no nv 20: +5
  const bonusNv20 = calcularBonusDanoAtaquePoderoso({ temAtaquePoderoso: true, nivelTotal: 20, isCorpoACorpo: true });
  assert.equal(bonusNv20, 5);

  // Ataque corpo a corpo no nv 40: +10
  const bonusNv40 = calcularBonusDanoAtaquePoderoso({ temAtaquePoderoso: true, nivelTotal: 40, isCorpoACorpo: true });
  assert.equal(bonusNv40, 10);

  // Ataque à distância não recebe bônus
  const bonusDistancia = calcularBonusDanoAtaquePoderoso({ temAtaquePoderoso: true, nivelTotal: 20, isCorpoACorpo: false });
  assert.equal(bonusDistancia, 0);
});

test('Fabula Ultima - Mestre de Armas: cálculo de Trespassar e Quebra-Ossos', () => {
  // Trespassar Nv 3: 3 * 5 = 15 de dano secundário
  const danoSec = calcularDanoSecundarioTrespassar({ nivelTrespassar: 3 });
  assert.equal(danoSec, 15);

  // Quebra-Ossos Atordoado: dano 0 e condicao atordoado
  const efAtordoado = calcularEfeitoQuebraOssos({ nivelHabilidade: 2, opcao: 'atordoado' });
  assert.equal(efAtordoado.danoAplicado, 0);
  assert.equal(efAtordoado.condicao, 'atordoado');

  // Quebra-Ossos Fraco: dano 0 e condicao fraco
  const efFraco = calcularEfeitoQuebraOssos({ nivelHabilidade: 2, opcao: 'fraco' });
  assert.equal(efFraco.danoAplicado, 0);
  assert.equal(efFraco.condicao, 'fraco');

  // Quebra-Ossos Perda de PM: Nv 3 = 30 PM
  const efPm = calcularEfeitoQuebraOssos({ nivelHabilidade: 3, opcao: 'pm' });
  assert.equal(efPm.danoAplicado, 0);
  assert.equal(efPm.perdaPm, 30);
});

test('Fabula Ultima - Mestre de Armas: geração de ações de combate', () => {
  const ficha = {
    classes: [
      {
        nome_classe: 'Mestre de Armas',
        nivel: 5,
        habilidades: [
          { nome: 'Chuva de Lâminas', nivel: 1 },
          { nome: 'Contra-Ataque', nivel: 1 },
          { nome: 'Quebra-Ossos', nivel: 2 },
          { nome: 'Trespassar', nivel: 1 }
        ]
      }
    ]
  };

  const acoes = gerarAcoesConflitoMestreDeArmas({ ficha });
  const codigos = acoes.map((a) => a.codigo);
  assert.ok(codigos.includes('CHUVA_DE_LAMINAS'));
  assert.ok(codigos.includes('CONTRA_ATAQUE'));
  assert.ok(codigos.includes('QUEBRA_OSSOS'));
  assert.ok(codigos.includes('TRESPASSAR'));
});
