import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairPerfilRolagemCombatente,
  rolarDadosCombate
} from '../combatRules.js';
import { detectarHabilidadePreConflito } from '../combatPreConflictRules.js';
import { formatarPoderNpcParaExibicao } from '../npcRules.js';

test('Fabula Ultima - Companheiro Fiel: regras de vinculação e validação de nível', () => {
  const fichaRemoSemNivel = {
    id: 'remo-id',
    nome_personagem: 'Remo',
    destreza: 8, astucia: 8, vigor: 8, vontade: 8,
    classes: [
      {
        nome_classe: 'Andarilho',
        habilidades: [{ nome: 'Companheiro Fiel', nivel: 0 }]
      }
    ]
  };

  const companheiroMock = {
    id: 'comp-1',
    nome: 'Lobo Leal',
    personagem_id: 'remo-id',
    tipo_registro: 'companheiro',
    pv_atual: 20, pv_max: 20, pm_atual: 10, pm_max: 10,
    defesa: 8, defesa_magica: 8,
    ataques_basicos: [{ nome: 'Mordida', atributo_dado1: 'des', atributo_dado2: 'vig', bonus_precisao: 0, bonus_dano: 6 }]
  };

  // Herói com NP 0 NÃO deve carregar companheiro
  const perfilSemNivel = extrairPerfilRolagemCombatente({
    combatente: { id: 'c1', tipo: 'heroi', nome: 'Remo' },
    ficha: fichaRemoSemNivel,
    companheiroFiel: companheiroMock
  });
  assert.equal(perfilSemNivel.companheiro, null, 'Companheiro com NP 0 não deve ser montado');

  // Herói com NP 2 deve carregar companheiro com bônus +2 na precisão
  const fichaSanComNivel = {
    id: 'san-id',
    nome_personagem: 'San Holo',
    destreza: 8, astucia: 8, vigor: 8, vontade: 8,
    classes: [
      {
        nome_classe: 'Andarilho',
        habilidades: [{ nome: 'Companheiro Fiel', nivel: 2 }]
      }
    ]
  };

  const perfilComNivel = extrairPerfilRolagemCombatente({
    combatente: { id: 'c2', tipo: 'heroi', nome: 'San Holo' },
    ficha: fichaSanComNivel,
    companheiroFiel: companheiroMock
  });
  assert.ok(perfilComNivel.companheiro, 'Companheiro com NP > 0 deve ser montado');
  assert.equal(perfilComNivel.companheiro.nvHabilidade, 2);
  assert.equal(perfilComNivel.companheiro.ataques[0].bonusPrecisao, 2);
});

test('Fabula Ultima - Ações Pré-Conflito: restrição estrita a quem possui Alta Velocidade', () => {
  const fichaSemLadino = {
    nome_personagem: 'Cyrus',
    classes: [{ nome_classe: 'Piloto', habilidades: [{ nome: 'Veículo Pessoal', nivel: 3 }] }]
  };
  const infoCyrus = detectarHabilidadePreConflito(fichaSemLadino);
  assert.equal(infoCyrus.possuiAltaVelocidade, false, 'Cyrus não possui Alta Velocidade');

  const fichaComLadino = {
    nome_personagem: 'San Holo',
    classes: [{ nome_classe: 'Ladino', habilidades: [{ nome: 'Alta Velocidade', nivel: 2 }] }]
  };
  const infoSan = detectarHabilidadePreConflito(fichaComLadino);
  assert.equal(infoSan.possuiAltaVelocidade, true, 'San possui Alta Velocidade');
  assert.equal(infoSan.np, 2, 'San possui NP 2');
});

test('Fabula Ultima - Quimerista: magias imitadas e ausência de duplicata em habilidades ativas', () => {
  const fichaQuimerista = {
    id: 'remo-quim',
    nome_personagem: 'Remo',
    destreza: 8, astucia: 8, vigor: 8, vontade: 8,
    classes: [
      {
        nome_classe: 'Quimerista',
        habilidades: [
          {
            nome: 'Imitação Mágica',
            nivel: 3,
            magias_imitadas: [
              { id: 'm1', nome: 'Sopro de Fogo', especie: 'dragao', custo_mp: '15', descricao: 'Dano de Fogo' }
            ],
            atributo_quimerista: 'AST + VON'
          }
        ]
      }
    ]
  };

  const perfil = extrairPerfilRolagemCombatente({
    combatente: { id: 'c3', tipo: 'heroi', nome: 'Remo' },
    ficha: fichaQuimerista
  });

  const magiaFogo = perfil.magias.find((m) => m.nome === 'Sopro de Fogo');
  assert.ok(magiaFogo, 'Magia imitada Sopro de Fogo deve constar nas magias');
  assert.equal(magiaFogo.isQuimerista, true);
  assert.equal(magiaFogo.especie, 'dragao');
  assert.equal(magiaFogo.custoPm, 15);

  // A habilidade passiva Imitação Mágica não deve poluir a lista de habilidades ativas de combate
  const habImitacao = perfil.habilidades.find((h) => h.nome?.toLowerCase().includes('imitacao'));
  assert.equal(habImitacao, undefined, 'Imitação Mágica não deve duplicar em habilidades ativas');
});

test('Fabula Ultima - Multiataque com Duas Armas: 1º golpe com RA e 2º golpe com RA = 0', () => {
  const fichaDuasArmas = {
    id: 'guerreiro-id',
    nome_personagem: 'Valen',
    destreza: 8, astucia: 8, vigor: 8, vontade: 8,
    classes: [{ nome_classe: 'Mestre de Armas', habilidades: [] }],
    itens: [
      { id: 'arma1', nome: 'Espada Curta', tipo: 'espada', equipado: true, slot: 'mao_dominante', precisao: 1, dano: 6, tipo_dano: 'fisico', maos: 1 },
      { id: 'arma2', nome: 'Adaga', tipo: 'adaga', equipado: true, slot: 'mao_secundaria', precisao: 2, dano: 4, tipo_dano: 'fisico', maos: 1 }
    ]
  };

  const perfil = extrairPerfilRolagemCombatente({
    combatente: { id: 'c4', tipo: 'heroi', nome: 'Valen' },
    ficha: fichaDuasArmas
  });

  const multiAtk = perfil.armas.find((a) => a.id === 'multiataque_duas_armas');
  assert.ok(multiAtk, 'Opção de multiataque com duas armas deve ser gerada');
  assert.equal(multiAtk.isDuasArmas, true);
  assert.equal(multiAtk.bonusDano, 6);
  assert.equal(multiAtk.bonusDanoSecundario, 4);

  // Teste de rolagem de dados com valores fixos d1=6, d2=7 (RA=7)
  const rolagem = rolarDadosCombate({
    combatente: { id: 'c4', tipo: 'heroi', nome: 'Valen' },
    perfil,
    arma: multiAtk,
    bonusTeste: multiAtk.bonusPrecisao,
    bonusDano: multiAtk.bonusDano,
    calcularDano: true,
    valoresFixos: { d1: 6, d2: 7 }
  });

  // RA = 7
  // 1º Golpe: 7 + 6 = 13
  // 2º Golpe: 0 + 4 = 4 (RA=0 conforme regra oficial de Fabula Ultima)
  // Total = 13 + 4 = 17
  assert.equal(rolagem.hr, 7);
  assert.equal(rolagem.danoGolpe1, 13, '1º Golpe deve somar RA + 6');
  assert.equal(rolagem.danoGolpe2, 4, '2º Golpe deve tratar RA como 0 (0 + 4)');
  assert.equal(rolagem.danoTotal, 17, 'Dano Total deve ser 13 + 4 = 17');
});

test('Fabula Ultima - Companheiro Fiel: poderes especiais estruturados e formatação para exibição', () => {
  const poderesComp = [
    { nome: 'Voo', descricao: 'Pode voar livremente em combate' },
    {
      nome: 'Mais Dano',
      parametros: { tipos_dano: ['Fogo'], efeito_detalhado: 'Causa +5 de dano de fogo adicional' }
    },
    {
      nome: 'Golpe Especial',
      parametros: { condicao_alvo: 'Lento', efeito_detalhado: 'Ataque inflige Lento ao acertar' }
    }
  ];

  const fichaAndarilho = {
    id: 'heroi-andarilho',
    nome_personagem: 'Rowan',
    classes: [
      {
        nome_classe: 'Andarilho',
        habilidades: [{ nome: 'Companheiro Fiel', nivel: 3 }]
      }
    ]
  };

  const compMock = {
    id: 'comp-fiel-1',
    nome: 'Fênix Jovem',
    especie: 'Elemental',
    nivel: 5,
    pv_atual: 28,
    pv_max: 28,
    pm_atual: 45,
    pm_max: 45,
    defesa: 10,
    defesa_magica: 8,
    poderes: poderesComp,
    ataques_basicos: [{ nome: 'Garra Flamejante', atributo_dado1: 'des', atributo_dado2: 'vig', bonus_precisao: 1, bonus_dano: 5 }]
  };

  const perfil = extrairPerfilRolagemCombatente({
    combatente: { id: 'c-rowan', tipo: 'heroi', nome: 'Rowan' },
    ficha: fichaAndarilho,
    companheiroFiel: compMock
  });

  assert.ok(perfil.companheiro, 'Companheiro deve estar presente no perfil');
  assert.equal(perfil.companheiro.poderes.length, 3, 'Deve preservar os 3 poderes especiais');

  // Formatação para exibição no card acoplado e na ficha
  const formatadoVoo = formatarPoderNpcParaExibicao(perfil.companheiro.poderes[0]);
  assert.equal(formatadoVoo.nome, 'Voo');
  assert.equal(formatadoVoo.descricao, 'Pode voar livremente em combate');

  const formatadoDano = formatarPoderNpcParaExibicao(perfil.companheiro.poderes[1]);
  assert.equal(formatadoDano.resumoCurto, 'Mais Dano (Fogo)');
  assert.deepEqual(formatadoDano.tiposDano, ['Fogo']);

  const formatadoGolpe = formatarPoderNpcParaExibicao(perfil.companheiro.poderes[2]);
  assert.equal(formatadoGolpe.resumoCurto, 'Golpe Especial (Lento)');
  assert.equal(formatadoGolpe.condicaoAlvo, 'Lento');
});
