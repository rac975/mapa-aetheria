import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairPerfilRolagemCombatente,
  rolarDadosCombate
} from '../combatRules.js';
import { formatarPoderNpcParaExibicao } from '../npcRules.js';

test('Fabula Ultima - Arma Personalizada de Duas Mãos com Dois Tipos de Ataque: não gera Duas Armas e preserva modos', () => {
  const armaPersonalizadaMutavel2H = {
    id: 'arma_personalizada_1',
    nome: 'Lâmina Transmutável',
    tipo: 'arma',
    equipado: true,
    slot: 'duas_maos',
    duas_maos: true,
    stats: {
      maos: 'Duas mãos',
      duas_maos: true,
      slot: 'duas_maos',
      mutavel: true,
      categoria: 'Espada',
      alcance: 'Corpo a corpo',
      dano: 'RA + 10',
      tipo_dano: 'fisico',
      precisao: '(DES + VIG) + 2',
      segunda_forma: {
        nome: 'Modo Lança-Chamas',
        categoria: 'Arma de fogo',
        alcance: 'À distância',
        dano: 'RA + 8',
        tipo_dano: 'fogo',
        precisao: '(DES + AST)',
        duas_maos: true,
        maos: 'Duas mãos'
      }
    }
  };

  const fichaComArma2H = {
    id: 'heroi-2h',
    nome_personagem: 'Vaan',
    destreza: 8, astucia: 8, vigor: 8, vontade: 8,
    classes: [
      {
        nome_classe: 'Mestre de Armas',
        habilidades: [{ nome: 'Maestria com Armas', nivel: 2 }]
      }
    ],
    itens: [armaPersonalizadaMutavel2H]
  };

  const perfil = extrairPerfilRolagemCombatente({
    combatente: { id: 'c-vaan', tipo: 'heroi', nome: 'Vaan' },
    ficha: fichaComArma2H
  });

  // 1. Deve ter 2 entradas de armas (Forma 1 e 2ª Forma), e NENHUMA entrada de "Duas Armas"
  assert.equal(perfil.armas.length, 2, 'Deve conter Forma 1 e Forma 2 da arma');
  const temDuasArmas = perfil.armas.some((a) => a.isDuasArmas || a.id === 'multiataque_duas_armas');
  assert.equal(temDuasArmas, false, 'Arma de duas mãos NÃO pode gerar opção de Duas Armas');

  // 2. Ambas as formas devem ser reconhecidas como duas mãos
  const forma1 = perfil.armas[0];
  const forma2 = perfil.armas[1];

  assert.equal(forma1.ehDuasMaos, true, 'Forma 1 deve ser duas mãos');
  assert.equal(forma1.maos, 2, 'Forma 1 deve ocupar 2 mãos');
  assert.equal(forma1.alcance, 'corpo_a_corpo');

  assert.equal(forma2.ehDuasMaos, true, 'Forma 2 deve ser duas mãos');
  assert.equal(forma2.ehSegundaForma, true, 'Forma 2 deve ter flag ehSegundaForma');
  assert.equal(forma2.tipoDano, 'fogo');
  assert.equal(forma2.alcance, 'distancia');
});

test('Fabula Ultima - Ataque Multi com Arma de Duas Mãos: zera bônus fixo da arma mantendo RA puro', () => {
  const arma2H = {
    nome: 'Montante do Éter',
    ehDuasMaos: true,
    bonusDano: 10,
    tipoDano: 'fisico'
  };

  // Rolagem Normal (Alvo Único)
  const rolagemUnica = rolarDadosCombate({
    combatente: { id: 'c1', nome: 'Guerreiro' },
    arma: arma2H,
    categoria: 'arma',
    bonusDano: 10,
    calcularDano: true,
    isMulti: false,
    valoresFixos: { d1: 6, d2: 8 }
  });
  // RA = 8, Dano = 8 + 10 = 18
  assert.equal(rolagemUnica.hr, 8);
  assert.equal(rolagemUnica.danoTotal, 18, 'Alvo único: RA + bônus fixo');

  // Rolagem Multi (Múltiplos Alvos) conforme regra oficial de Fabula Ultima: bônus da arma torna-se +0
  const rolagemMulti = rolarDadosCombate({
    combatente: { id: 'c1', nome: 'Guerreiro' },
    arma: arma2H,
    categoria: 'arma',
    bonusDano: 10,
    calcularDano: true,
    isMulti: true,
    valoresFixos: { d1: 6, d2: 8 }
  });
  // RA = 8, Dano = 8 + 0 = 8
  assert.equal(rolagemMulti.hr, 8);
  assert.equal(rolagemMulti.danoTotal, 8, 'Ataque multi-alvo: RA puro (bônus da arma zera)');
});

test('Fabula Ultima - NPCs do Mestre em Conflito: extração de rank, afinidades, poderes e ataques', () => {
  const npcCampeao = {
    id: 'npc-dragao',
    nome: 'Dragão Carmesim',
    nivel: 30,
    rank: 'campeao',
    escala_vilania: 'maior',
    especie: 'Monstro',
    quantidade_soldados: 3,
    destreza: 10, astucia: 8, vigor: 12, vontade: 10,
    defesa: 12, defesa_magica: 10,
    afinidades: {
      fogo: 'abs',
      gelo: 'vul',
      fisico: 'res'
    },
    ataques_basicos: [
      {
        nome: 'Mordida Ígnea',
        atributo_dado1: 'des',
        atributo_dado2: 'vig',
        bonus_precisao: 2,
        bonus_dano: 8,
        tipo_dano: 'fogo',
        alcance: 'corpo_a_corpo'
      }
    ],
    feiticos: [
      {
        nome: 'Chuva de Meteoros',
        pm_custo: '20',
        tipo_dano: 'fogo',
        descricao: 'Atinge todos os alvos causando dano de fogo.'
      }
    ],
    poderes: [
      {
        id: 'poder-sopro',
        nome: 'Sopro Devastador',
        descricao: 'Causa 30 de dano de fogo.',
        custo_pm: 15,
        parametros: {
          tipos_dano: ['Fogo'],
          efeito_detalhado: 'Causa 30 de dano de fogo.'
        }
      }
    ]
  };

  const perfilNpc = extrairPerfilRolagemCombatente({
    combatente: { id: 'c-dragao', tipo: 'inimigo', nome: 'Dragão Carmesim', rank: 'campeao' },
    npc: npcCampeao
  });

  // Metadados táticos do NPC
  assert.equal(perfilNpc.rank, 'campeao');
  assert.equal(perfilNpc.escalaVilania, 'maior');
  assert.equal(perfilNpc.especie, 'Monstro');
  assert.equal(perfilNpc.afinidades.fogo, 'abs');
  assert.equal(perfilNpc.afinidades.gelo, 'vul');

  // Ataque básico
  assert.equal(perfilNpc.armas.length, 1);
  assert.equal(perfilNpc.armas[0].nome, 'Mordida Ígnea');
  assert.equal(perfilNpc.armas[0].tipoDano, 'fogo');

  // Feitiço
  assert.equal(perfilNpc.magias.length, 1);
  assert.equal(perfilNpc.magias[0].nome, 'Chuva de Meteoros');
  assert.equal(perfilNpc.magias[0].tipoDano, 'fogo');
  assert.equal(perfilNpc.magias[0].custoPm, 20);

  // Poder Especial formatado e preservado
  assert.equal(perfilNpc.poderes.length, 1);
  const poderFormatado = formatarPoderNpcParaExibicao(perfilNpc.poderes[0]);
  assert.equal(poderFormatado.nome, 'Sopro Devastador');
  assert.equal(poderFormatado.custoPm, 15);
  assert.equal(poderFormatado.resumoCurto, 'Sopro Devastador (Fogo)');
});
