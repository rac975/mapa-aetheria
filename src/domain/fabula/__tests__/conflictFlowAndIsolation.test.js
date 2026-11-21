import assert from 'node:assert';
import {
  extrairPerfilRolagemCombatente,
  resolverAcaoCombate
} from '../combatRules.js';
import { sanitizarPayloadFicha } from '../characterProgression.js';

console.log('--- 1. Testando Fonte Única de Verdade (Ficha <-> Perfil de Conflito) ---');

const fichaEnriquecida = {
  id: 'ficha-uuid-1',
  nome_personagem: 'Valeros',
  destreza: 10,
  astucia: 8,
  vigor: 10,
  vontade: 6,
  defesa: 13, // 11 da armadura marcial + 2 do escudo
  mdef: 9,
  hp_max: 55,
  hp_atual: 45,
  mp_max: 30,
  mp_atual: 20,
  pi_max: 6,
  pi_atual: 4,
  fabula: 3,
  condicoes: ['lento'],
  classes: [
    {
      nome_classe: 'Guardião',
      nivel: 5,
      habilidades: [
        { nome: 'Proteger', nivel: 2, descricao: 'Toma dano no lugar do aliado' },
        { nome: 'Aumento de PV', nivel: 3, descricao: '+15 PV' } // passivo estatística
      ]
    },
    {
      nome_classe: 'Quimerista',
      nivel: 2,
      magias_imitadas: [{ id: 'quim-1', nome: 'Sopro Gélido', custo_pm: 10 }]
    },
    {
      nome_classe: 'Arcanista',
      nivel: 1,
      arcanos_vinculados: [{ nome: 'Ifrit', efeito_invocacao: 'Dano de Fogo' }]
    }
  ],
  itens: [
    { id: 'item-1', nome: 'Espada Longa', tipo: 'Arma', stats_personalizados: { slot: 'mao_dominante', dano: 9, alcance: 'corpo_a_corpo' } },
    { id: 'item-traje', nome: 'Traje de viagem', tipo: 'Armadura Leve', stats_personalizados: { slot: 'armadura' } }
  ]
};

const combatenteHeroi = {
  id: 101,
  tipo: 'heroi',
  nome: 'Valeros',
  ficha_id: 'ficha-uuid-1',
  hp_atual: 45,
  hp_max: 55,
  mp_atual: 20,
  mp_max: 30,
  ip: 4,
  pontos_fabula: 3,
  condicoes: ['lento']
};

const perfil = extrairPerfilRolagemCombatente({
  combatente: combatenteHeroi,
  ficha: fichaEnriquecida
});

assert.strictEqual(perfil.defesa, 13, 'Defesa no combate deve ser exatamente a defesa derivada calculada (13)');
assert.strictEqual(perfil.mdef, 9, 'M.DEF no combate deve ser exatamente o mdef derivado calculado (9)');
assert.strictEqual(perfil.atributosAtuais.des, 8, 'Condição Lento deve reduzir Destreza de d10 para d8');
assert.strictEqual(perfil.armas.length, 1, 'Deve conter apenas 1 arma equipada (sem duplicata e sem Golpe Desarmado)');
assert.strictEqual(perfil.armas[0].nome, 'Espada Longa', 'A única arma deve ser Espada Longa');
assert.strictEqual(perfil.armas.some(a => a.nome.includes('Traje')), false, 'Traje de viagem não deve ser classificado como arma');
assert.strictEqual(perfil.armas.some(a => a.id === 'desarmado'), false, 'Golpe Desarmado deve ser ocultado quando há arma equipada');

// Magias de Quimerista e Arcanista
assert.strictEqual(perfil.magias.some(m => m.nome === 'Sopro Gélido'), true, 'Feitiço do Quimerista deve estar nas magias');
assert.strictEqual(perfil.magias.some(m => m.nome === 'Invocar: Ifrit'), true, 'Arcano do Arcanista deve estar nas magias');

// Habilidades ativas usáveis
assert.strictEqual(perfil.habilidades.some(h => h.nome === 'Proteger'), true, 'Habilidade ativa Proteger deve ser extraída');
assert.strictEqual(perfil.habilidades.some(h => h.nome === 'Aumento de PV'), false, 'Passivo de estatística Aumento de PV deve ser ignorado');

// Ficha sem armas: Golpe Desarmado deve aparecer
const perfilDesarmado = extrairPerfilRolagemCombatente({
  combatente: combatenteHeroi,
  ficha: { ...fichaEnriquecida, itens: [] }
});
assert.strictEqual(perfilDesarmado.armas.length, 1);
assert.strictEqual(perfilDesarmado.armas[0].id, 'desarmado');
console.log('PASSED: Perfil de conflito sincronizado com status derivados da ficha');

console.log('--- 2. Testando Sanitização e Sincronização Bidirecional Ficha <-> Combate ---');

const payloadDoCombate = {
  hp_atual: 35,
  hp_max: 55,
  mp_atual: 15,
  mp_max: 30,
  ip: 3,
  pontos_fabula: 2,
  condicoes: ['lento', 'enfurecido']
};

const sanitizado = sanitizarPayloadFicha({
  hp_atual: payloadDoCombate.hp_atual,
  hp_max: payloadDoCombate.hp_max,
  mp_atual: payloadDoCombate.mp_atual,
  mp_max: payloadDoCombate.mp_max,
  pi_atual: payloadDoCombate.ip,
  fabula: payloadDoCombate.pontos_fabula,
  condicoes: payloadDoCombate.condicoes
});

assert.strictEqual(sanitizado.hp_atual, 35);
assert.strictEqual(sanitizado.pi_atual, 3);
assert.strictEqual(sanitizado.fabula, 2);
assert.deepStrictEqual(sanitizado.condicoes, ['lento', 'enfurecido']);
assert.strictEqual('ip' in sanitizado, false);
assert.strictEqual('ip_atual' in sanitizado, false);
console.log('PASSED: Payload do combate sanitizado e compatível com fichas_personagens');

console.log('--- 3. Testando Resolução de Ação Rápida e Sincronização de Recursos ---');

const alvoInimigo = {
  id: 202,
  tipo: 'inimigo',
  nome: 'Goblin Salteador',
  hp_atual: 25,
  hp_max: 25,
  condicoes: []
};

const resultadoAtaque = resolverAcaoCombate({
  acaoCodigo: 'ATAQUE',
  ator: combatenteHeroi,
  alvo: alvoInimigo,
  danoAplicado: 10,
  custoPm: 5,
  marcarTurnoConcluido: true
});

assert.strictEqual(resultadoAtaque.valido, true, 'Ação de ataque deve ser válida');
assert.strictEqual(resultadoAtaque.updatesAtor.mp_atual, 15, 'Ator deve ter gasto 5 PM (20 - 5 = 15)');
assert.strictEqual(resultadoAtaque.updatesAtor.agiu, true, 'Ator deve ter turno concluído');
assert.strictEqual(resultadoAtaque.updatesAlvo.hp_atual, 15, 'Alvo deve receber 10 de dano (25 - 10 = 15)');
console.log('PASSED: Ação rápida calcula e propaga updates para ator e alvo');

console.log('--- 4. Testando Isolamento por Cartão (ID) de Jogador vs Mestre ---');

function verificarPermissaoAcao({ atorCombatente, jogadorFichaId, jogadorNome, isMestre }) {
  if (isMestre) return true;
  if (!atorCombatente) return false;
  return Boolean(
    (jogadorFichaId && String(atorCombatente.ficha_id) === String(jogadorFichaId)) ||
    (jogadorNome && atorCombatente.nome?.trim().toLowerCase() === jogadorNome?.trim().toLowerCase())
  );
}

const outroHeroi = { id: 102, tipo: 'heroi', nome: 'Edgar', ficha_id: 'ficha-uuid-2' };
const npcInimigo = { id: 203, tipo: 'inimigo', nome: 'Dragão Carmesim' };

// Jogador Valeros logado
const sessaoJogadorValeros = { jogadorFichaId: 'ficha-uuid-1', jogadorNome: 'Valeros', isMestre: false };

assert.strictEqual(
  verificarPermissaoAcao({ atorCombatente: combatenteHeroi, ...sessaoJogadorValeros }),
  true,
  'Jogador pode agir com o seu próprio herói'
);

assert.strictEqual(
  verificarPermissaoAcao({ atorCombatente: outroHeroi, ...sessaoJogadorValeros }),
  false,
  'Jogador NÃO pode agir com o herói de outro jogador'
);

assert.strictEqual(
  verificarPermissaoAcao({ atorCombatente: npcInimigo, ...sessaoJogadorValeros }),
  false,
  'Jogador NÃO pode agir como um NPC ou inimigo'
);

// Mestre logado (God Mode)
const sessaoMestre = { jogadorFichaId: null, jogadorNome: 'Mestre', isMestre: true };

assert.strictEqual(
  verificarPermissaoAcao({ atorCombatente: combatenteHeroi, ...sessaoMestre }),
  true,
  'Mestre pode agir com qualquer herói'
);

assert.strictEqual(
  verificarPermissaoAcao({ atorCombatente: npcInimigo, ...sessaoMestre }),
  true,
  'Mestre pode agir com qualquer NPC'
);

console.log('PASSED: Regras de isolamento por Cartão (ID) do Jogador vs Visão do Mestre');
console.log('TODOS OS TESTES DE CONFLITO E ISOLAMENTO PASSARAM!');
