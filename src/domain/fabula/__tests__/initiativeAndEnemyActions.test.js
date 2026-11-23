import test from 'node:test';
import assert from 'node:assert/strict';
import {
  construirCombatente,
  sanitizarPayloadIniciativa,
  extrairIniciativaCombatente,
  extrairModificadorIniciativaHeroi,
  extrairIniciativaFixaInimigo,
  ordenarCombatentesPorIniciativa,
  calcularContadoresAcoesRodada,
  obterSlotsAcoesInimigo,
  rolarIniciativaCombate
} from '../combatInitiativeRules.js';
import {
  construirFilaUnificadaCombate,
  moverItemFilaUnificada,
  gerarOrdemIntercaladaIniciativa
} from '../combatQueueRules.js';
import {
  calcularNdIniciativaInimigos,
  extrairForcaLacoComLider,
  executarTesteGrupoIniciativa
} from '../combatGroupInitiativeRules.js';
import {
  detectarHabilidadePreConflito,
  resolverAcaoPrePrimeiraRodada
} from '../combatPreConflictRules.js';
import {
  criarEventoOportunidade,
  registrarVotoOportunidade,
  obterOportunidadeVencedora
} from '../combatOpportunitiesRules.js';

test('--- 1. Iniciativa Fixa de Inimigos (Ficha) e Modificador de Iniciativa de Heróis ---', () => {
  const fichaHeroi = {
    nome_personagem: 'Val',
    iniciativa: -3,
    statusCalculados: { iniciativaTotal: -3 }
  };
  assert.equal(extrairModificadorIniciativaHeroi({ nome: 'Val', tipo: 'heroi' }, fichaHeroi), -3);

  const npcChefe = {
    id: 99,
    nome: 'Behemoth',
    iniciativa: 14,
    rank: 'campeao',
    quantidade_soldados: 3,
    atributos: { des: 'd10', ast: 'd8' }
  };
  assert.equal(extrairIniciativaFixaInimigo({ nome: 'Behemoth', tipo: 'inimigo' }, npcChefe), 14);

  const npcSemIniSalva = {
    nome: 'Soldado Imperial',
    rank: 'elite',
    atributos: { des: 'd8', ast: 'd8' }
  };
  // Elite d8/d8 = floor((8+8)/2) + 2 = 10
  assert.equal(extrairIniciativaFixaInimigo({ nome: 'Soldado Imperial', tipo: 'inimigo' }, npcSemIniSalva), 10);
});

test('--- 2. Construção, Sanitização e Rolagem Individual de Iniciativa do Herói ---', () => {
  const combatente = construirCombatente({
    nome: 'Aerith',
    tipo: 'heroi',
    iniciativa: 14,
    iniciativaMod: -2,
    hpMax: 45
  });
  assert.equal(combatente.iniciativa, 14);
  assert.equal(combatente.modificadores.iniciativa_mod, -2);

  const payload = sanitizarPayloadIniciativa({ nome: 'Sephiroth', iniciativa: 22, maxHp: 200 });
  assert.equal(payload.iniciativa, 22);
  assert.equal(payload.hp_max, 200);

  const rolagem = rolarIniciativaCombate({
    combatente: { id: 1, nome: 'Cloud', tipo: 'heroi' },
    perfil: { atributosAtuais: { des: 10, ast: 8 }, iniciativaMod: -2 },
    valoresFixos: { d1: 7, d2: 6 }
  });
  assert.equal(rolagem.total, 11);
});

test('--- 3. Alternância de Turnos (Herói <-> Ação/Token de Inimigo), Excedentes no Final e Drag-and-Drop ---', () => {
  const participantes = [
    { id: 1, nome: 'Herói 1', tipo: 'heroi', hp_atual: 40, acoes_por_turno: 1, ordem: 0, iniciativa: 15 },
    { id: 2, nome: 'Chefe Dragão', tipo: 'inimigo', hp_atual: 120, acoes_por_turno: 3, ordem: 1, iniciativa: 12 },
    { id: 3, nome: 'Herói 2', tipo: 'heroi', hp_atual: 35, acoes_por_turno: 1, ordem: 2, iniciativa: 15 }
  ];

  // 2 Heróis vs 1 Chefe com 3 ações (Heróis vencem):
  // Turno 1: Herói 1 (card:1) -> Turno 2: Chefe Ação 1 (card:2) -> Turno 3: Herói 2 (card:3)
  // Turno 4: Chefe Ação 2 (token:2:2) -> Excedente no final: Chefe Ação 3 (token:2:3)
  const fila = construirFilaUnificadaCombate(participantes);
  assert.equal(fila.length, 5);
  assert.deepEqual(fila.map((f) => f.chaveFila), [
    'card:1', 'card:2', 'card:3', 'token:2:2', 'token:2:3'
  ]);

  // Se Inimigos vencem a iniciativa: Chefe Ação 1 -> Herói 1 -> Chefe Ação 2 -> Herói 2 -> Chefe Ação 3 (final)
  const intercaladoInimigoVence = gerarOrdemIntercaladaIniciativa(participantes, false);
  assert.deepEqual(intercaladoInimigoVence.ordemChavesFila, [
    'card:2', 'card:1', 'token:2:2', 'card:3', 'token:2:3'
  ]);

  // Remanejar Herói 2 (index 2) para o topo (index 0) via drag-and-drop ({ fromIndex, toIndex })
  const movidoHerois = moverItemFilaUnificada(fila, { fromIndex: 2, toIndex: 0 });
  assert.deepEqual(movidoHerois.novaOrdemChaves, [
    'card:3', 'card:1', 'card:2', 'token:2:2', 'token:2:3'
  ]);
  assert.equal(movidoHerois.mudouOrdemCards, true);
  assert.equal(movidoHerois.participantesReordenados[0].id, 3);
});

test('--- 4. Teste em Grupo de Iniciativa (ND Inimigo, Apoiadores ND 10 e Maior Laço) ---', () => {
  const participantes = [
    { id: 10, nome: 'Líder Zidane', tipo: 'heroi', hp_atual: 40 },
    { id: 11, nome: 'Vivi', tipo: 'heroi', hp_atual: 30 },
    { id: 12, nome: 'Steiner', tipo: 'heroi', hp_atual: 50 },
    { id: 20, nome: 'Garland', tipo: 'inimigo', hp_atual: 100, iniciativa: 13 }
  ];

  const infoNd = calcularNdIniciativaInimigos(participantes, []);
  assert.equal(infoNd.ndLider, 13);

  const fichaVivi = {
    iniciativa: 0,
    lacos: [{ nome: 'Líder Zidane', emocoes: ['Lealdade', 'Afeto', 'Adoração'] }]
  };
  const fichaSteiner = {
    iniciativa: -3,
    lacos: [{ nome: 'Líder Zidane', emocoes: ['Lealdade'] }]
  };
  assert.equal(extrairForcaLacoComLider(fichaVivi, 'Líder Zidane'), 3);

  const resGrupo = executarTesteGrupoIniciativa({
    lider: participantes[0],
    perfilLider: { atributosAtuais: { des: 10, ast: 8 }, iniciativaMod: 1 },
    fichaLider: { iniciativa: 1 },
    apoiadores: [
      { combatente: participantes[1], perfil: { atributosAtuais: { des: 8, ast: 10 } }, ficha: fichaVivi },
      { combatente: participantes[2], perfil: { atributosAtuais: { des: 6, ast: 6 } }, ficha: fichaSteiner }
    ],
    ndInimigos: infoNd.ndLider,
    valoresFixosLider: { d1: 5, d2: 4 },
    mapaValoresFixosApoiadores: {
      11: { d1: 6, d2: 5 }, // 11 + 0 = 11 >= 10 (Sucesso: +1 e Laço +3)
      12: { d1: 4, d2: 3 }  // 7 - 3 = 4 < 10 (Falha)
    }
  });

  assert.equal(resGrupo.bonusApoiadores, 1);
  assert.equal(resGrupo.maiorForcaLaco, 3);
  // Líder: (5 + 4) + Mod(+1) + Apoio(+1) + Laço(+3) = 14 vs ND 13 -> Heróis vencem!
  assert.equal(resGrupo.totalLider, 14);
  assert.equal(resGrupo.heroisVenceram, true);
});

test('--- 5. Ações Pré-1ª Rodada (Alta Velocidade: 10 PM e +NP nos testes) ---', () => {
  const fichaLadino = {
    classes: [{ nome_classe: 'Ladino', habilidades: [{ nome: 'Alta Velocidade', nivel: 2 }] }]
  };
  const hab = detectarHabilidadePreConflito(fichaLadino);
  assert.equal(hab.possuiAltaVelocidade, true);
  assert.equal(hab.np, 2);

  const heroi = { id: 1, nome: 'Locke', tipo: 'heroi', mp_atual: 25 };
  const alvo = { id: 2, nome: 'Guarda', tipo: 'inimigo', condicoes: [] };
  const resPre = resolverAcaoPrePrimeiraRodada({
    heroi,
    perfilHeroi: { atributosAtuais: { des: 10, ast: 8 } },
    tipoAcaoPre: 'IMPEDIMENTO',
    np: 2,
    alvo,
    condicaoId: 'lento',
    valoresFixos: { d1: 5, d2: 4 } // 5 + 4 + 2 (NP) = 11 >= 10
  });

  assert.equal(resPre.valido, true);
  assert.equal(resPre.updatesHeroi.mp_atual, 15);
  assert.deepEqual(resPre.updatesAlvo.condicoes, ['lento']);
});

test('--- 6. Modal/Votação de Oportunidades (Herói -> Mestre; Inimigo -> Heróis) e Slots ---', () => {
  const oppHeroi = criarEventoOportunidade({
    combatente: { id: 1, nome: 'Tidus', tipo: 'heroi' },
    resultadoRolagem: { isCritico: true, isFumble: false, d1: 8, d2: 8, total: 16 }
  });
  assert.equal(oppHeroi.responsavelEscolha, 'mestre');

  let oppInimigo = criarEventoOportunidade({
    combatente: { id: 2, nome: 'Seymour', tipo: 'inimigo' },
    resultadoRolagem: { isCritico: false, isFumble: true, d1: 1, d2: 1, total: 2 }
  });
  assert.equal(oppInimigo.responsavelEscolha, 'herois');

  oppInimigo = registrarVotoOportunidade(oppInimigo, 'Yuna', 'VANTAGEM');
  oppInimigo = registrarVotoOportunidade(oppInimigo, 'Auron', 'VANTAGEM');
  const vencedora = obterOportunidadeVencedora(oppInimigo);
  assert.equal(vencedora.codigoVencedor, 'VANTAGEM');
  assert.equal(vencedora.totalVotos, 2);

  assert.equal(obterSlotsAcoesInimigo({ tipo: 'inimigo', acoes_por_turno: 2 }).length, 2);
  assert.equal(calcularContadoresAcoesRodada([{ tipo: 'heroi', hp_atual: 20, agiu: false }]).totalVivos, 1);
  assert.equal(ordenarCombatentesPorIniciativa([{ id: 1, iniciativa: 10 }]).length, 1);
  assert.equal(extrairIniciativaCombatente({ iniciativa: 9 }), 9);
});
