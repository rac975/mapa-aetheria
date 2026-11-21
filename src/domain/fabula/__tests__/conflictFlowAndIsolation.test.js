import assert from 'node:assert';
import {
  extrairPerfilRolagemCombatente,
  resolverAcaoCombate
} from '../combatRules.js';
import { calcularModificadoresCondicoesOficiais } from '../coreClassRules.js';
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
    { id: 'item-armadura', nome: 'Armadura de Placas', tipo: 'Armadura Marcial', stats_personalizados: { slot: 'armadura', marcial: true, def: 11 } }
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
assert.strictEqual(perfil.armas.some(a => a.nome.includes('Armadura')), false, 'Armadura não deve ser classificado como arma');
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
  condicoes: payloadDoCombate.condicoes,
  classes: [{ nome_classe: 'Guerreiro' }],
  statusCalculados: { pvMax: 40 },
  zenit: '300',
  invalido_nan: NaN
});

assert.strictEqual(sanitizado.hp_atual, 35);
assert.strictEqual(sanitizado.pi_atual, 3);
assert.strictEqual(sanitizado.fabula, 2);
assert.strictEqual(sanitizado.zenit, 300);
assert.strictEqual('condicoes' in sanitizado, false, 'condicoes não deve existir no payload de fichas_personagens');
assert.strictEqual('classes' in sanitizado, false, 'classes não deve vazar para fichas_personagens');
assert.strictEqual('statusCalculados' in sanitizado, false, 'statusCalculados não deve vazar');
assert.strictEqual('invalido_nan' in sanitizado, false, 'NaN não deve ser incluído');
assert.strictEqual('ip' in sanitizado, false);
assert.strictEqual('ip_atual' in sanitizado, false);
console.log('PASSED: Payload do combate sanitizado e compatível com fichas_personagens (sem condicoes nem campos indevidos)');

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

console.log('--- 5. Testando Módulos de Arma do Piloto na Ordem de Combate ---');

const fichaPiloto = {
  id: 'ficha-piloto-1',
  nome_personagem: 'Cid Highwind',
  destreza: 8,
  astucia: 10,
  vigor: 8,
  vontade: 8,
  defesa: 8,
  mdef: 10,
  hp_max: 45,
  hp_atual: 45,
  mp_max: 35,
  mp_atual: 35,
  pi_max: 6,
  pi_atual: 6,
  fabula: 3,
  condicoes: [],
  classes: [
    {
      nome_classe: 'Piloto',
      nivel: 5,
      habilidades: [
        { nome: 'Veículo Pessoal', nivel: 3 },
        { nome: 'Pulso Firme', nivel: 2 }
      ]
    }
  ],
  dados_veiculo: {
    nome: 'Airship Voador',
    frameKey: 'corcel',
    veiculoInvocado: true,
    modulosAtivos: [
      'arma_veicular_canhao',
      'arma_veicular_lamina',
      'suporte_mira_avancada'
    ]
  },
  itens: []
};

const combatentePiloto = {
  id: 105,
  tipo: 'heroi',
  nome: 'Cid Highwind',
  ficha_id: 'ficha-piloto-1',
  hp_atual: 45,
  hp_max: 45,
  mp_atual: 35,
  mp_max: 35,
  condicoes: []
};

const perfilPiloto = extrairPerfilRolagemCombatente({
  combatente: combatentePiloto,
  ficha: fichaPiloto
});

assert.strictEqual(perfilPiloto.armas.length, 2, 'Deve extrair os 2 módulos de arma ativos do veículo');
assert.strictEqual(perfilPiloto.armas.some(a => a.id === 'desarmado'), false, 'Golpe Desarmado deve estar oculto com armas veiculares');

const canhao = perfilPiloto.armas.find(a => a.id.includes('canhao'));
assert(canhao, 'Canhão Leve veicular deve existir');
assert.strictEqual(canhao.alcance, 'distancia', 'Canhão é de longo alcance');
assert.strictEqual(canhao.atingeVoadores, true, 'Canhão veicular atinge alvos voadores');
assert.strictEqual(canhao.isModuloVeicular, true, 'Arma deve estar marcada como módulo veicular');
assert.strictEqual(canhao.bonusPrecisao, 1, 'Bônus de precisão deve incluir +1 da Mira Avançada');
assert.strictEqual(canhao.bonusDano, 8, 'Dano base da arma veicular é 8');

console.log('PASSED: Módulos de arma do Piloto reconhecidos e Golpe Desarmado oculto');

console.log('--- 6. Testando Condições Oficiais, Recálculo Dinâmico de Defesas e Aliases ---');

// 1. Alias enfraquecido -> fraco (reduz Vigor)
const modsAlias = calcularModificadoresCondicoesOficiais(['enfraquecido']);
assert.strictEqual(modsAlias.vigor, -1, 'Alias enfraquecido deve reduzir Vigor');
assert.strictEqual(modsAlias.destreza, 0);

// 2. Redução de Defesa Física sem armadura marcial
const fichaLeve = {
  id: 'ficha-leve-1',
  destreza: 8,
  astucia: 8,
  vigor: 8,
  vontade: 8,
  defesa: 8,
  mdef: 8,
  condicoes: ['lento'],
  classes: [],
  itens: []
};

const combatenteLento = {
  id: 106,
  tipo: 'heroi',
  ficha_id: 'ficha-leve-1',
  condicoes: ['lento']
};

const perfilLento = extrairPerfilRolagemCombatente({
  combatente: combatenteLento,
  ficha: fichaLeve
});

assert.strictEqual(perfilLento.atributosAtuais.des, 6, 'Lento reduz DES de 8 para 6');
assert.strictEqual(perfilLento.defesa, 6, 'Defesa baseada em DES cai de 8 para 6 sob Lento');
assert.strictEqual(perfilLento.defesaReduzida, true, 'Flag defesaReduzida deve ser true');
assert.strictEqual(perfilLento.mdef, 8, 'M.DEF permanece 8 pois AST não foi afetada');
assert.strictEqual(perfilLento.mdefReduzida, false, 'mdefReduzida deve ser false');

// 3. Armadura marcial (DEF Fixa NÃO deve cair com redução de DES)
const fichaMarcial = {
  id: 'ficha-marcial-1',
  destreza: 8,
  astucia: 8,
  vigor: 8,
  vontade: 8,
  defesa: 11,
  mdef: 8,
  condicoes: ['lento'],
  classes: [],
  itens: [
    {
      id: 'arm-1',
      nome: 'Cota de Malha',
      tipo: 'Armadura Marcial',
      stats_personalizados: { slot: 'armadura', marcial: true, def: 11 }
    }
  ]
};

const perfilMarcial = extrairPerfilRolagemCombatente({
  combatente: combatenteLento,
  ficha: fichaMarcial
});

assert.strictEqual(perfilMarcial.defesa, 11, 'Defesa Marcial fixa em 11 NÃO deve cair com redução de DES');
assert.strictEqual(perfilMarcial.defesaReduzida, false, 'defesaReduzida deve ser false em armadura marcial');

// 4. Atordoado reduzindo AST e Defesa Mágica
const combatenteAtordoado = {
  id: 107,
  tipo: 'heroi',
  ficha_id: 'ficha-leve-1',
  condicoes: ['atordoado']
};

const perfilAtordoado = extrairPerfilRolagemCombatente({
  combatente: combatenteAtordoado,
  ficha: fichaLeve
});

assert.strictEqual(perfilAtordoado.atributosAtuais.ast, 6, 'Atordoado reduz AST de 8 para 6');
assert.strictEqual(perfilAtordoado.mdef, 6, 'M.DEF baseada em AST cai de 8 para 6');
assert.strictEqual(perfilAtordoado.mdefReduzida, true, 'Flag mdefReduzida deve ser true');

console.log('PASSED: Recálculo dinâmico de Defesa e M.DEF sob condições e regras oficiais');
console.log('TODOS OS TESTES DE CONFLITO E ISOLAMENTO PASSARAM!');
