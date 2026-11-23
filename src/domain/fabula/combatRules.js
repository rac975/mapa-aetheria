import {
  CONDICOES_OFICIAIS,
  PROGRESSAO_DADOS_ATRIBUTO,
  calcularModificadoresCondicoesOficiais,
  calcularPassivosCoreClasses,
  normalizarTextoCore,
  obterNivelHabilidade,
  extrairMagiasQuimerista,
  extrairAtributoQuimerista
} from './coreClassRules.js';
import {
  extrairMagiesferasInventor,
  extrairHabilidadesInventor,
  gerarAcoesConflitoInventor
} from './inventorRules.js';
import {
  extrairHabilidadesAndarilho,
  gerarAcoesConflitoAndarilho,
  calcularBonusDanoCompanheiro,
  calcularPvMaxCompanheiro
} from './wayfarerRules.js';
import { gerarAcoesConflitoArcanista } from './arcanistRules.js';
import {
  extrairHabilidadesErudito,
  calcularResultadoEstudo,
  gerarAcoesConflitoErudito
} from './scholarRules.js';
import {
  extrairHabilidadesAtirador,
  calcularBonusDanoAtirador,
  calcularResolucaoFogoCruzado,
  calcularEfeitoTiroDeAviso,
  gerarAcoesConflitoAtirador
} from './sharpshooterRules.js';
import {
  extrairHabilidadesLadino,
  gerarAcoesConflitoLadino
} from './rogueRules.js';
import {
  extrairHabilidadesMestreDeArmas,
  calcularBonusDanoAtaquePoderoso,
  calcularDanoSecundarioTrespassar,
  calcularEfeitoQuebraOssos,
  gerarAcoesConflitoMestreDeArmas
} from './weaponmasterRules.js';
import { gerarAcoesConflitoPiloto } from './pilotCombatRules.js';
import {
  ACOES_BLOCO_A_OFICIAIS,
  gerarTodasAcoesConflitoBlocoA
} from './blockAConflictIntegrator.js';
import {
  ACOES_BLOCO_B_OFICIAIS,
  gerarTodasAcoesConflitoBlocoB
} from './blockBConflictIntegrator.js';
import {
  ACOES_BLOCO_C_OFICIAIS,
  gerarTodasAcoesConflitoBlocoC
} from './blockCConflictIntegrator.js';
import {
  ACOES_BLOCO_D_OFICIAIS,
  gerarTodasAcoesConflitoBlocoD
} from './blockDConflictIntegrator.js';
import {
  armaAtingeVoadores,
  extrairResumoCaracteristicasEquipamento,
  extrairStatsArmadura,
  isArmaDuasMaos
} from './equipmentRules.js';
import { obterModuloPorId } from './technoFantasyRules.js';
import { obterItemFormaAtivaArmaMutavel } from './weaponForge.js';
import { calcularBonusPassivosPoderesHeroicos } from './heroicAndQuirksRules.js';
import {
  clampRecursoNpc,
  ajustarRecursoNpc,
  isNpcCombatente,
  extrairHpMax,
  extrairMpMax,
  TIPOS_VILAO,
  ACOES_PONTOS_VILAO,
  normalizarTipoVilao,
  calcularPontosVilaoPadrao,
  calcularAcoesPorTurnoNpc,
  isVilaoOuChefe,
  criarFaseChefaoPadrao,
  verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao,
  consumirPontoVilaoNpc,
  formatarAtaqueBasicoNpc,
  formatarPoderNpcParaExibicao
} from './npcRules.js';

export {
  clampRecursoNpc,
  ajustarRecursoNpc,
  isNpcCombatente,
  extrairHpMax,
  extrairMpMax,
  TIPOS_VILAO,
  ACOES_PONTOS_VILAO,
  normalizarTipoVilao,
  calcularPontosVilaoPadrao,
  calcularAcoesPorTurnoNpc,
  isVilaoOuChefe,
  criarFaseChefaoPadrao,
  verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao,
  consumirPontoVilaoNpc,
  extrairHabilidadesAtirador,
  calcularBonusDanoAtirador,
  calcularResolucaoFogoCruzado,
  calcularEfeitoTiroDeAviso,
  gerarAcoesConflitoAtirador,
  extrairHabilidadesInventor,
  gerarAcoesConflitoInventor,
  extrairHabilidadesLadino,
  gerarAcoesConflitoLadino,
  extrairHabilidadesMestreDeArmas,
  calcularBonusDanoAtaquePoderoso,
  calcularDanoSecundarioTrespassar,
  calcularEfeitoQuebraOssos,
  gerarAcoesConflitoMestreDeArmas
};

/**
 * Fabula Ultima - Regras de Combate e Iniciativa
 * 
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 */

/**
 * Verifica se um combatente está derrotado (HP igual a zero ou menor)
 * @param {number} hpAtual 
 * @returns {boolean}
 */
export function estaDerrotado(hpAtual) {
  return Number(hpAtual) <= 0;
}

/**
 * Em Fabula Ultima, um personagem está em Crise quando seus PV/HP atuais
 * estão iguais ou abaixo da metade do seu PV/HP Máximo (arredondado para baixo ou float),
 * desde que não esteja derrotado (HP > 0).
 * 
 * Regra do Livro Básico:
 * "Um personagem cujos Pontos de Vida atuais sejam iguais ou inferiores à metade
 * de seus Pontos de Vida máximos está em Crise."
 * 
 * @param {number} hpAtual 
 * @param {number} hpMax 
 * @returns {boolean}
 */
export function calcularStatusCrise(hpAtual, hpMax) {
  const hp = Number(hpAtual);
  const max = Number(hpMax);
  if (hp <= 0 || max <= 0) return false;
  return hp <= Math.floor(max / 2);
}

/**
 * Calcula o dano acumulado sofrido por um combatente (HP Máx - HP Atual).
 * @param {number} hpAtual 
 * @param {number} hpMax 
 * @returns {number}
 */
export function calcularDanoAcumulado(hpAtual, hpMax) {
  const hp = Math.max(0, Number(hpAtual));
  const max = Math.max(0, Number(hpMax));
  return Math.max(0, max - hp);
}

/**
 * Alterna ou define o status de ação/turno de um participante.
 * @param {boolean} agiuAtual 
 * @param {boolean|null} forcarStatus 
 * @returns {boolean}
 */
export function alternarTurno(agiuAtual, forcarStatus = null) {
  if (forcarStatus !== null) {
    return Boolean(forcarStatus);
  }
  return !agiuAtual;
}

/**
 * Verifica se todos os combatentes ativos de um grupo ou de toda a cena já agiram.
 * Em Fabula Ultima, a rodada reinicia quando todos os combatentes elegíveis completam seus turnos.
 * @param {Array<Object>} combatentes 
 * @returns {boolean}
 */
export function todosAgiram(combatentes = []) {
  if (!combatentes.length) return false;
  return combatentes
    .filter(c => !estaDerrotado(c.hp_atual))
    .every(c => c.agiu);
}

/**
 * Aplica uma variação em um recurso numérico (HP, MP, IP, Pontos de Fábula)
 * respeitando os limites mínimo (0 por padrão) e máximo (opcional).
 * @param {number} valorAtual 
 * @param {number} delta 
 * @param {number|null} maximo 
 * @param {number} minimo 
 * @returns {number}
 */
export function aplicarDeltaRecurso(valorAtual, delta, maximo = null, minimo = 0) {
  const atual = Number(valorAtual) || 0;
  const variacao = Number(delta) || 0;
  let novo = atual + variacao;

  if (maximo !== null && maximo !== undefined) {
    novo = Math.min(Number(maximo), novo);
  }
  return Math.max(Number(minimo) || 0, novo);
}

/**
 * Alterna a presença de uma condição (status) na lista de condições de um combatente.
 * Ex: 'lento', 'atordoado', 'enfraquecido', etc.
 * @param {Array<string>} condicoesAtuais 
 * @param {string} condicaoId 
 * @returns {Array<string>}
 */
export function alternarCondicao(condicoesAtuais = [], condicaoId) {
  if (!condicaoId) return [...condicoesAtuais];
  const existe = condicoesAtuais.includes(condicaoId);
  return existe
    ? condicoesAtuais.filter(c => c !== condicaoId)
    : [...condicoesAtuais, condicaoId];
}

/**
 * Constrói o objeto de participante combatente inicial pronto para inclusão na iniciativa.
 * @param {Object} params
 * @param {string} params.tipo - 'heroi' | 'inimigo'
 * @param {string} params.nome
 * @param {number} params.ordem
 * @param {number} [params.hpMax=40]
 * @param {number} [params.mpMax=40]
 * @param {number} [params.ip=0]
 * @param {number} [params.pontosFabula=0]
 * @param {number} [params.pontosUltima=0]
 * @param {string|number|null} [params.fichaId=null]
 * @returns {Object}
 */
export function construirCombatente({
  tipo,
  nome,
  ordem = 0,
  hpMax = 40,
  mpMax = 40,
  ip = 0,
  pontosFabula = 0,
  pontosUltima = 0,
  tipoVilao = 'padrao',
  pontosVilao = null,
  fasesChefao = [],
  acoesPorTurno = 1,
  faseAtual = 1,
  fichaId = null,
  npcId = null,
  voador = false
}) {
  const hp = Math.max(1, Number(hpMax) || 1);
  const mp = Math.max(0, Number(mpMax) || 0);
  const vilaoNorm = tipo === 'heroi' ? 'padrao' : normalizarTipoVilao(tipoVilao);
  const pvVilao = tipo === 'heroi'
    ? 0
    : Math.max(
        0,
        pontosVilao !== null && pontosVilao !== undefined
          ? Number(pontosVilao)
          : (Number(pontosUltima) || calcularPontosVilaoPadrao(vilaoNorm))
      );
  const acoes = tipo === 'heroi' ? 1 : Math.max(1, Number(acoesPorTurno) || 1);
  const fases = tipo === 'heroi' || !Array.isArray(fasesChefao) ? [] : fasesChefao;
  const faseInicial = Math.max(1, Number(faseAtual) || 1);

  const modsIniciais = {
    ...(npcId ? { npc_id: npcId } : {}),
    ...(voador ? { voador: true } : {}),
    ...(tipo !== 'heroi' ? { acoes_realizadas_rodada: 0, pontos_vilao_max: pvVilao } : {})
  };

  return {
    nome: nome.trim(),
    tipo,
    agiu: false,
    ordem,
    hp_atual: hp,
    hp_max: hp,
    mp_atual: mp,
    mp_max: mp,
    ip: Number(ip) || 0,
    pontos_fabula: Number(pontosFabula) || 0,
    pontos_ultima: pvVilao,
    tipo_vilao: vilaoNorm,
    pontos_vilao: pvVilao,
    fases_chefao: fases,
    acoes_por_turno: acoes,
    fase_atual: faseInicial,
    dano_acumulado: 0,
    condicoes: [],
    ficha_id: fichaId,
    guardando: false,
    protegendo_id: null,
    turno_atual: false,
    voador: Boolean(voador),
    modificadores: modsIniciais
  };
}

/**
 * Normaliza e sanitiza o payload para a tabela 'iniciativa_combate' do Supabase,
 * garantindo estritamente as colunas canônicas 'hp_max' e 'mp_max' e eliminando
 * propriedades legadas que geram erro 400 no banco (ex: maxHp, maxMp, pv_max, pm_max).
 * @param {Object} dados
 * @returns {Object}
 */
export function sanitizarPayloadIniciativa(dados) {
  if (!dados || typeof dados !== 'object') return dados;

  const payload = { ...dados };

  // Mapeia caso venha como maxHp ou pv_max sem hp_max
  if (payload.hp_max === undefined) {
    if (payload.maxHp !== undefined) payload.hp_max = payload.maxHp;
    else if (payload.pv_max !== undefined) payload.hp_max = payload.pv_max;
  }

  // Mapeia caso venha como maxMp ou pm_max sem mp_max
  if (payload.mp_max === undefined) {
    if (payload.maxMp !== undefined) payload.mp_max = payload.maxMp;
    else if (payload.pm_max !== undefined) payload.mp_max = payload.pm_max;
  }

  // Remove propriedades que não são colunas da tabela iniciativa_combate
  delete payload.maxHp;
  delete payload.maxMp;
  delete payload.pv_max;
  delete payload.pm_max;
  delete payload.pv_atual;
  delete payload.pm_atual;

  return payload;
}

/**
 * Reordena uma lista de combatentes trocando os índices indicados
 * e reatribuindo os valores de 'ordem'.
 * @param {Array<Object>} lista 
 * @param {number} indexOrigem 
 * @param {'cima'|'baixo'} direcao 
 * @returns {Array<Object>}
 */
export function reordenarParticipantes(lista, indexOrigem, direcao) {
  const targetIndex = typeof direcao === 'number'
    ? direcao
    : (direcao === 'cima' ? indexOrigem - 1 : indexOrigem + 1);
  if (targetIndex < 0 || targetIndex >= lista.length || targetIndex === indexOrigem) {
    return lista;
  }

  const novaLista = [...lista];
  const [removido] = novaLista.splice(indexOrigem, 1);
  novaLista.splice(targetIndex, 0, removido);

  return novaLista.map((item, idx) => ({ ...item, ordem: idx }));
}

/**
 * Calcula modificadores consolidados de cura/drenagem durante conflitos considerando
 * Símbolo do Desespero, Toque Pessoal (Simbolista), Foco Cognitivo (Esper), Roque do Rei (Comandante),
 * Harmonia Elemental (Invocador), Data de Validade (Mercador) e Dosagem Precisa (Gourmet/Mercador).
 * @param {Object} params
 * @returns {{ valorFinal: number, convertidoEmDano: boolean, danoVeneno: number, limitePercentualMax: number, detalhes: Array<string> }}
 */
export function calcularCuraEfetivaEmConflito({
  curaBase = 0,
  tipoRecurso = 'pv',
  temSimboloDesespero = false,
  bloqueadoPorRoqueDoRei = false,
  bonusToquePessoal = 0,
  bonusFocoCognitivo = 0,
  bonusRoqueReiPm = 0,
  bonusHarmoniaElementalPv = 0,
  usarDataDeValidade = false,
  danoDataDeValidade = 0,
  temDosagemPrecisa = false
} = {}) {
  if (tipoRecurso === 'pv' && usarDataDeValidade && danoDataDeValidade > 0) {
    return {
      valorFinal: 0,
      convertidoEmDano: true,
      danoVeneno: danoDataDeValidade,
      limitePercentualMax: 100,
      detalhes: [`Data de Validade: Convertido em ${danoDataDeValidade} de dano de veneno`]
    };
  }

  if (bloqueadoPorRoqueDoRei) {
    return {
      valorFinal: 0,
      convertidoEmDano: false,
      danoVeneno: 0,
      limitePercentualMax: 100,
      detalhes: ['Bloqueado por Roque do Rei']
    };
  }

  let total = Math.max(0, parseInt(curaBase, 10) || 0);
  const detalhes = [];

  if (bonusToquePessoal > 0) {
    total += bonusToquePessoal;
    detalhes.push(`Toque Pessoal (+${bonusToquePessoal})`);
  }
  if (bonusFocoCognitivo > 0) {
    total += bonusFocoCognitivo;
    detalhes.push(`Foco Cognitivo (+${bonusFocoCognitivo})`);
  }
  if (tipoRecurso === 'pv' && bonusHarmoniaElementalPv > 0) {
    total += bonusHarmoniaElementalPv;
    detalhes.push(`Harmonia Elemental (+${bonusHarmoniaElementalPv} PV)`);
  }
  if (tipoRecurso === 'pm' && bonusRoqueReiPm > 0) {
    total += bonusRoqueReiPm;
    detalhes.push(`Roque do Rei (+${bonusRoqueReiPm} PM)`);
  }
  if (temSimboloDesespero) {
    total = Math.floor(total / 2);
    detalhes.push('Símbolo do Desespero (÷2)');
  }
  if (temDosagemPrecisa) {
    detalhes.push('Dosagem Precisa (até 150% do máximo)');
  }

  return {
    valorFinal: total,
    convertidoEmDano: false,
    danoVeneno: 0,
    limitePercentualMax: temDosagemPrecisa ? 150 : 100,
    detalhes
  };
}

/**
 * Calcula a Iniciativa efetiva e bônus de testes opostos de velocidade/acrobacia em conflito.
 * @param {Object} params
 * @returns {{ iniciativa: number, bonusOpostosVelocidade: number }}
 */
export function calcularIniciativaEOpostosCombate({
  bonusIniciativaStatus = 0,
  bonusSapateadoFrenetico = 0
} = {}) {
  return {
    iniciativa: Number(bonusIniciativaStatus) || 0,
    bonusOpostosVelocidade: Math.max(0, Number(bonusSapateadoFrenetico) || 0)
  };
}

// =============================================================================
// SISTEMA COMPLETO DE AÇÕES DE CONFLITO, REAÇÕES E MANOBRAS (FABULA ULTIMA)
// =============================================================================

export const ACOES_CONFLITO_OFICIAIS = {
  ATAQUE: {
    codigo: 'ATAQUE',
    titulo: 'Atacar',
    categoria: 'ofensiva',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Realiza um ataque corpo a corpo ou à distância com arma equipada ou golpe desarmado (DES + VIG, dano RA + 0 físico).'
  },
  CONJURAR: {
    codigo: 'CONJURAR',
    titulo: 'Conjurar (Feitiço)',
    categoria: 'magica',
    consomeTurno: true,
    custoBase: 'PM variável',
    resumo: 'Lança um feitiço aprendido pagando seu custo total em PM (ou PV via Vismagus). Feitiços ofensivos (O) exigem Teste de Magia.'
  },
  GUARDAR: {
    codigo: 'GUARDAR',
    titulo: 'Guarda',
    categoria: 'defensiva',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Recebe Resistência a todos os tipos de dano e +2 em Testes Opostos até o início do próximo turno; pode dar Cobertura a outro aliado.'
  },
  INVENTARIO: {
    codigo: 'INVENTARIO',
    titulo: 'Inventário',
    categoria: 'suporte',
    consomeTurno: true,
    custoBase: 'PI variável',
    resumo: 'Gasta Pontos de Inventário (PI) para criar e usar poções, elixires, fragmentos elementais, engenhocas ou símbolos.'
  },
  OBJETIVO: {
    codigo: 'OBJETIVO',
    titulo: 'Objetivo',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Realiza um teste para avançar ou retroceder um Relógio de Conflito (+1 seção em sucesso; +1 extra por Crítico e a cada +3 acima do ND).'
  },
  ESTUDO: {
    codigo: 'ESTUDO',
    titulo: 'Estudo (Investigar)',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Teste Aberto (AST + AST) para revelar Traços, Afinidades, PV/PM ou ataques de um oponente visível (ND 10 / 13 / 16).'
  },
  IMPEDIMENTO: {
    codigo: 'IMPEDIMENTO',
    titulo: 'Impedimento',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Teste Oposto criativo contra um inimigo visível para impor uma condição ou complicação narrativa ao alvo.'
  },
  EQUIPAMENTO: {
    codigo: 'EQUIPAMENTO',
    titulo: 'Equipamento',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Troca livremente qualquer combinação de armas, escudos, armadura ou acessório equipados (grátis com Troca de Figurino ou Tempo Roubado).'
  },
  HABILIDADE: {
    codigo: 'HABILIDADE',
    titulo: 'Habilidade de Classe',
    categoria: 'classe',
    consomeTurno: true,
    custoBase: 'PM/PV/PF variável',
    resumo: 'Executa um poder ativo de classe (Invocar Arcano, Cloromancia, Culinária, Invocação, Magicanto, Teriomorfose, Ordem de Comandante, Oratória, etc.).'
  },
  RENDICAO: {
    codigo: 'RENDICAO',
    titulo: 'Rendição / Queda',
    categoria: 'especial',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ao chegar a 0 PV, um PJ pode se Render (sofre consequência narrativa e ganha +2 Pontos de Fábula) ou realizar Sacrifício Heróico.'
  }
};

export const ACOES_LIVRES_E_MANOBRAS = {
  PASSAR_TURNO: {
    codigo: 'PASSAR_TURNO',
    titulo: '⏩ Passar Turno',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Passa a vez ou encerra o turno no conflito sem executar manobras adicionais.'
  },
  ACAO_LIVRE: {
    codigo: 'ACAO_LIVRE',
    titulo: 'Ação Livre / Efeito Tático',
    categoria: 'suporte',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Aplica ajustes livres de recursos, condições, notas ou presets de habilidades na cena.'
  },
  EFEITO_LIVRE: {
    codigo: 'ACAO_LIVRE',
    titulo: 'Ação Livre / Efeito Tático',
    categoria: 'suporte',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Aplica ajustes livres de recursos, condições ou notas.'
  },
  ITEM: {
    codigo: 'INVENTARIO',
    titulo: 'Inventário / Item',
    categoria: 'suporte',
    consomeTurno: true,
    custoBase: 'PI variável',
    resumo: 'Gasta Pontos de Inventário (PI) para criar e usar poções, elixires, fragmentos elementais, engenhocas ou símbolos.'
  }
};

export const ACOES_ANDARILHO_OFICIAIS = {
  COCHILO_PODEROSO: {
    codigo: 'COCHILO_PODEROSO',
    titulo: '💤 Cochilo Poderoso',
    categoria: 'heroica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Gasta 1 ação para recuperar PV e PM iguais a (20 + metade do nível) e curar todas as condições. Encerra o turno e DEF/M.DEF tornam-se 5.'
  },
  LADO_A_LADO_PM: {
    codigo: 'LADO_A_LADO_PM',
    titulo: '🤝 Lado a Lado (Recuperar PM)',
    categoria: 'heroica',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após o companheiro agir no turno: você e seu companheiro recuperam 10 PM cada.'
  },
  PRATICO_SUPORTE: {
    codigo: 'PRATICO_SUPORTE',
    titulo: '🎒 Suporte Prático',
    categoria: 'suporte',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Auxilia aliados em combate com ferramentas e suprimentos táticos rápidos.'
  },
  COMANDAR_COMPANHEIRO: {
    codigo: 'COMANDAR_COMPANHEIRO',
    titulo: '🐾 Comandar Companheiro',
    categoria: 'classe',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Gasta sua ação de turno para fazer seu companheiro fiel realizar uma ação.'
  },
  INVOCAR_ARCANO: {
    codigo: 'INVOCAR_ARCANO',
    titulo: '🔮 Invocar Arcano',
    categoria: 'arcanista',
    consomeTurno: true,
    custoBase: '40 PM (reduzido em Crise)',
    resumo: 'Invoca e funde um Arcano à alma sem teste de atributo. Concede efeitos de pulso e cura PV com Regeneração Arcana.'
  },
  DISPENSAR_ARCANO: {
    codigo: 'DISPENSAR_ARCANO',
    titulo: '✨ Dispensar Arcano',
    categoria: 'arcanista',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Dispensa voluntariamente o Arcano fundido ativando seu efeito de descarte (escala com nível: +10 no nv. 20+, +20 no nv. 40+).'
  },
  CIRCULO_ARCANO: {
    codigo: 'CIRCULO_ARCANO',
    titulo: '🌀 Círculo Arcano',
    categoria: 'arcanista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após dispensar voluntariamente um Arcano: realiza a ação Feitiço de até (NP × 5) PM sem gastar ação de turno.'
  },
  ESTUDO_ERUDITO: {
    codigo: 'ESTUDO_ERUDITO',
    titulo: '📚 Estudo Especializado',
    categoria: 'erudito',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Teste Aberto [AST+AST] com +NP de Concentrado. ND 10/13/16 para revelar dados. 13+ ativa Lampejo de Saber.'
  },
  ANALISE_RAPIDA: {
    codigo: 'ANALISE_RAPIDA',
    titulo: '🔍 Análise Rápida',
    categoria: 'erudito',
    consomeTurno: false,
    custoBase: '5 a 30 PM',
    resumo: 'No início do conflito, gasta de 5 a (NP × 5) PM para revelar Traços ou Afinidades de criatura visível.'
  },
  PREVISIVEL: {
    codigo: 'PREVISIVEL',
    titulo: '🎯 Previsível!',
    categoria: 'heroica',
    consomeTurno: true,
    custoBase: '20 PM',
    resumo: 'Alvo com 2+ Traços conhecidos: taxa a ação escolhida em 20 PM até seu próximo turno.'
  },
  PALAVRAS_SABEDORIA: {
    codigo: 'PALAVRAS_SABEDORIA',
    titulo: '💬 Palavras de Sabedoria',
    categoria: 'heroica',
    consomeTurno: false,
    custoBase: '10 PM',
    resumo: 'Apoio tático que concede recuperação de PM, cura de status ou ação livre a aliado.'
  }
};

export const ACOES_ATIRADOR_OFICIAIS = {
  BARRAGEM: {
    codigo: 'BARRAGEM',
    titulo: '🎯 Barragem',
    categoria: 'atirador',
    consomeTurno: true,
    custoBase: '10 PM',
    resumo: 'Gasta 10 PM para conceder Propriedade Multi (2) ao ataque à distância ou aumentar em +1 (até Multi 3).'
  },
  OLHOS_DE_AGUIA_DANO: {
    codigo: 'OLHOS_DE_AGUIA_DANO',
    titulo: '🦅 Olhos de Águia (Mira Concentrada)',
    categoria: 'atirador',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ao fazer Guarda sem cobrir aliado: o próximo ataque à distância na cena causa + (NP × 3) de dano.'
  },
  OLHOS_DE_AGUIA_TIRO_LIVRE: {
    codigo: 'OLHOS_DE_AGUIA_TIRO_LIVRE',
    titulo: '🦅 Olhos de Águia (Disparo em Guarda)',
    categoria: 'atirador',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ao fazer Guarda sem cobrir aliado: realiza ataque livre imediato com arco ou arma de fogo (RA = 0 no dano).'
  },
  ISCA_CHAMARIZ: {
    codigo: 'ISCA_CHAMARIZ',
    titulo: '🪤 Isca Chamariz',
    categoria: 'heroica',
    consomeTurno: true,
    custoBase: '10 PM',
    resumo: 'Gasta 10 PM com Olhos de Águia para erguer um chamariz tático que absorve ataques direcionados a aliados.'
  },
  TIRO_DE_AVISO: {
    codigo: 'TIRO_DE_AVISO',
    titulo: '⚠️ Tiro de Aviso',
    categoria: 'atirador',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Atinge alvos à distância causando 0 de dano e inflige Abalado, Lento ou perda de (NP × 10) PM.'
  }
};

export const ACOES_INVENTOR_OFICIAIS = {
  ITEM_EMERGENCIAL: {
    codigo: 'ITEM_EMERGENCIAL',
    titulo: '🚨 Item Emergencial (Inventor)',
    categoria: 'inventor',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Em Crise: realiza uma ação adicional no turno que deve ser obrigatoriamente a ação Inventário.'
  },
  CHUVA_POCOES: {
    codigo: 'CHUVA_POCOES',
    titulo: '🌧️ Chuva de Poções (Inventor)',
    categoria: 'inventor',
    consomeTurno: true,
    custoBase: '2 PI',
    resumo: 'Gasta ação de Inventário para repartir cura de poção com até (NP) aliados adicionais (50% de eficácia em cada).'
  },
  TONICO_ALQUIMICO: {
    codigo: 'TONICO_ALQUIMICO',
    titulo: '🧪 Tônico Alquímico (Inventor)',
    categoria: 'inventor',
    consomeTurno: true,
    custoBase: '2 PI',
    resumo: 'Criação de poção alquímica em combate: restaura PV/PM ou cura condições de aliado visível.'
  },
  BOMBA_ALQUIMICA: {
    codigo: 'BOMBA_ALQUIMICA',
    titulo: '💣 Bomba Alquímica (Inventor)',
    categoria: 'inventor',
    consomeTurno: true,
    custoBase: '2 PI',
    resumo: 'Engenhoca ofensiva: arremessa bomba alquímica causando dano elemental direto a adversário.'
  },
  INFUSAO_ELEMENTAL: {
    codigo: 'INFUSAO_ELEMENTAL',
    titulo: '⚙️ Infusão Elemental (Inventor)',
    categoria: 'inventor',
    consomeTurno: true,
    custoBase: '1 PI',
    resumo: 'Imbui arma de aliado com elemento temporário ou armadura com resistência até o fim da cena.'
  }
};

export const ACOES_LADINO_OFICIAIS = {
  ROUBO_DE_ALMA: {
    codigo: 'ROUBO_DE_ALMA',
    titulo: '👻 Roubo de Alma',
    categoria: 'ladino',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Teste [DES + VON] + NP vs M.DEF. Soldado concede NP PI; Elite/Campeão concede Tesouro da Alma (nível × 30z ou 50z).'
  },
  GOLPE_BAIXO: {
    codigo: 'GOLPE_BAIXO',
    titulo: '🗡️ Golpe Baixo',
    categoria: 'ladino',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Contra alvo único sofrendo 1+ condições: causa dano adicional igual a (NP + número de condições do alvo).'
  },
  VEJO_VOCE_MAIS_TARDE: {
    codigo: 'VEJO_VOCE_MAIS_TARDE',
    titulo: '💨 Vejo Você Mais Tarde',
    categoria: 'especial',
    consomeTurno: true,
    custoBase: '1 PF',
    resumo: 'Gasta 1 ação e 1 Ponto de Fábula para escapar milagrosamente do combate, reaparecendo com outro PJ em cena futura.'
  },
  SUMIR: {
    codigo: 'SUMIR',
    titulo: '🌫️ Sumir',
    categoria: 'heroica',
    consomeTurno: false,
    custoBase: '1 PF',
    resumo: 'Ao acertar ataque: gasta 1 Ponto de Fábula para que os alvos atingidos não possam ver você até o próximo turno.'
  }
};

export const ACOES_MESTRE_DE_ARMAS_OFICIAIS = {
  CHUVA_DE_LAMINAS: {
    codigo: 'CHUVA_DE_LAMINAS',
    titulo: '⚔️ Chuva de Lâminas',
    categoria: 'mestre_de_armas',
    consomeTurno: false,
    custoBase: '10 PM',
    resumo: 'Ao fazer ataque corpo a corpo: gasta 10 PM para receber Multi(2) ou +1 em Multi (máx 3).'
  },
  QUEBRA_OSSOS: {
    codigo: 'QUEBRA_OSSOS',
    titulo: '🦴 Quebra-Ossos',
    categoria: 'mestre_de_armas',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ao acertar ataque corpo a corpo: escolhe não causar dano para aplicar Atordoado, Fraco ou drenar (NP × 10) PM.'
  },
  TRESPASSAR: {
    codigo: 'TRESPASSAR',
    titulo: '💥 Trespassar',
    categoria: 'mestre_de_armas',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Gasta 5 PM para ataque livre corpo a corpo. Causa dano normal e (NP × 5) de dano físico a outro alvo visível.'
  },
  CONTRA_ATAQUE: {
    codigo: 'CONTRA_ATAQUE',
    titulo: '🛡️ Contra-Ataque',
    categoria: 'mestre_de_armas',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao ser alvo de ataque corpo a corpo com rolagem par: realiza um ataque livre contra o atacante.'
  }
};

export const ACOES_PILOTO_OFICIAIS = {
  CORACAO_NO_MOTOR: {
    codigo: 'CORACAO_NO_MOTOR',
    titulo: '⚙️ Coração no Motor',
    categoria: 'piloto',
    consomeTurno: false,
    custoBase: '10 PM',
    resumo: 'Gasta 10 PM para escolher: +NP×2 dano, -NP×2 dano sofrido ou curar Lento e Fraco.'
  },
  CONFIGURACAO_FLEXIVEL: {
    codigo: 'CONFIGURACAO_FLEXIVEL',
    titulo: '🔧 Configuração Flexível',
    categoria: 'piloto',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Gasta 1 ação para trocar até NP módulos ou armas ativos do veículo pessoal.'
  }
};

export const REACOES_COMBATE_OFICIAIS = {
  PROTEGER: {
    codigo: 'PROTEGER',
    titulo: 'Proteger (Guardião)',
    gatilho: 'Aliado ameaçado por ataque, feitiço ou perigo (1x/turno)',
    custoPm: 0,
    efeito: 'Toma o lugar do aliado; todos os testes e efeitos do perigo são redirecionados para você.'
  },
  CONTRA_ATAQUE: {
    codigo: 'CONTRA_ATAQUE',
    titulo: 'Contra-Ataque (Mestre de Armas)',
    gatilho: 'Inimigo realiza ataque corpo a corpo contra você com resultado de Precisão PAR',
    custoPm: 0,
    efeito: 'Executa ataque corpo a corpo livre contra o atacante com RA considerado igual a 0.'
  },
  FOGO_CRUZADO: {
    codigo: 'FOGO_CRUZADO',
    titulo: 'Fogo Cruzado (Atirador)',
    gatilho: 'Criatura visível faz ataque à distância (não crítico)',
    custoBasePm: 5,
    efeito: 'Gasta (5 + Teste de Precisão do alvo) PM com arma à distância equipada para anular o ataque contra todos os alvos.'
  },
  ABSORVER_PM: {
    codigo: 'ABSORVER_PM',
    titulo: 'Absorver PM (Entropista)',
    gatilho: 'Após sofrer dano',
    custoPm: 0,
    efeito: 'Recupera (NP × 2) Pontos de Magia.'
  },
  LICAO_DOLOROSA: {
    codigo: 'LICAO_DOLOROSA',
    titulo: 'Lição Dolorosa (Guerreiro Sombrio)',
    gatilho: 'Após sofrer dano',
    custoPm: 0,
    efeito: 'Realiza imediatamente a ação Estudo contra o agressor com bônus igual a (NP).'
  },
  ECDISE: {
    codigo: 'ECDISE',
    titulo: 'Écdise (Mutante)',
    gatilho: 'Após sofrer dano não-físico',
    custoPv: 10,
    efeito: 'Gasta 10 PV para adquirir Resistência àquele tipo de dano até a próxima troca.'
  },
  CASCATA: {
    codigo: 'CASCATA',
    titulo: 'Cascata (Invocador)',
    gatilho: 'Aliado fere inimigo marcado por invocação do tipo Praga',
    custoPm: 0,
    efeito: 'Executa ataque livre (+NP Precisão) convertendo dano para o elemento do aliado e dissipa a Praga.'
  }
};

export const MANOBRAS_TATICAS_OFICIAIS = {
  MULTI_ATAQUE: {
    codigo: 'MULTI_ATAQUE',
    titulo: 'Ataque Multi (Alvos Múltiplos)',
    consomeTurno: true,
    custoBonusDano: 'Remove o bônus fixo da arma (+0), mantendo RA + bônus externos.',
    efeito: 'Permite atingir até Multi (N) alvos com um único Teste de Precisão.'
  },
  COBERTURA_GUARDA: {
    codigo: 'COBERTURA_GUARDA',
    titulo: 'Cobrir Aliado em Guarda',
    consomeTurno: true,
    custoBonusDano: 'Ação Guarda no turno.',
    efeito: 'Aliado escolhido não pode ser alvo de ataques corpo a corpo até o início do próximo turno (e ganha Resistência total com Guarda-Costas).'
  },
  DUAS_ARMAS: {
    codigo: 'DUAS_ARMAS',
    titulo: 'Combate com Duas Armas',
    consomeTurno: true,
    custoBonusDano: 'Duas armas de 1 mão equipadas; ambos os ataques têm RA = 0.',
    efeito: 'Realiza dois ataques na mesma ação Ataque (mão dominante e mão secundária).'
  },
  TIRO_AVISO_QUEBRA_OSSOS: {
    codigo: 'TIRO_AVISO_QUEBRA_OSSOS',
    titulo: 'Manobra de Debilitação (Tiro de Aviso / Quebra-Ossos)',
    consomeTurno: true,
    custoBonusDano: 'Abre mão de causar dano ao acertar.',
    efeito: 'Impõe condição (Abalado/Lento/Atordoado/Fraco) ou drena (NP × 10) PM dos alvos atingidos.'
  }
};

export const AFINIDADES_DANO = {
  VULNERAVEL: 'vulneravel',
  NORMAL: 'normal',
  RESISTENTE: 'resistente',
  IMUNE: 'imune',
  ABSORVE: 'absorve'
};

/**
 * Calcula quantas seções de um Relógio de Conflito devem avançar em um teste da ação Objetivo.
 * Regra oficial de Fabula Ultima:
 * - Falha: 0 seções
 * - Sucesso: 1 seção + 1 seção adicional para cada 3 pontos acima do ND + 2 seções extras em Sucesso Crítico
 * - Orador (Persuasivo): +1 seção por cada 20 PM gastos (se aplicável)
 * @param {Object} params
 * @returns {{ sucesso: boolean, secoesAvancadas: number, detalhes: Array<string> }}
 */
export function calcularProgressoRelogioPorTeste({
  resultadoTeste = 10,
  nivelDificuldade = 10,
  isCritico = false,
  isFalhaCritica = false,
  secoesExtrasPersuasivo = 0
} = {}) {
  const total = Number(resultadoTeste) || 0;
  const nd = Number(nivelDificuldade) || 10;

  if (isFalhaCritica || total < nd) {
    return {
      sucesso: false,
      secoesAvancadas: 0,
      detalhes: [isFalhaCritica ? 'Falha Crítica (0 seções)' : `Falhou no ND ${nd} (0 seções)`]
    };
  }

  let secoes = 1;
  const detalhes = ['Sucesso (+1 seção)'];

  const margem = Math.floor((total - nd) / 3);
  if (margem > 0) {
    secoes += margem;
    detalhes.push(`Margem +${total - nd} (+${margem} seção(ões))`);
  }

  if (isCritico) {
    secoes += 2;
    detalhes.push('Sucesso Crítico (+2 seções)');
  }

  const extrasOrador = Math.max(0, parseInt(secoesExtrasPersuasivo, 10) || 0);
  if (extrasOrador > 0) {
    secoes += extrasOrador;
    detalhes.push(`Persuasivo (+${extrasOrador} seção(ões))`);
  }

  return {
    sucesso: true,
    secoesAvancadas: secoes,
    detalhes
  };
}

/**
 * Calcula o dano final recebido por um combatente aplicando redução fixa (Maestria Defensiva /
 * Barreira Sonora), Guarda/Resistência e Afinidade elemental/física oficial de Fabula Ultima.
 * Ordem oficial: Redução fixa antes das Afinidades -> Guarda/Resistência (÷2) -> Vulnerabilidade (×2) / Imune (0) / Absorve (cura).
 * @param {Object} params
 * @returns {{ danoFinal: number, curaAbsorvida: number, afinidadeAplicada: string, detalhes: Array<string> }}
 */
export function calcularDanoFinalComModificadores({
  danoBruto = 0,
  reducaoDanoFixa = 0,
  estaGuardando = false,
  afinidade = AFINIDADES_DANO.NORMAL,
  bonusDanoCondenar = 0,
  bonusDanoAdicional = 0
} = {}) {
  const detalhes = [];
  let dano = Math.max(0, (Number(danoBruto) || 0) + (Number(bonusDanoCondenar) || 0) + (Number(bonusDanoAdicional) || 0));

  const red = Math.max(0, Number(reducaoDanoFixa) || 0);
  if (red > 0) {
    dano = Math.max(0, dano - red);
    detalhes.push(`Redução Fixa (-${red})`);
  }

  const afNorm = normalizarTextoCore(afinidade || 'normal');
  if (afNorm === 'imune') {
    return { danoFinal: 0, curaAbsorvida: 0, afinidadeAplicada: 'imune', detalhes: [...detalhes, 'Imune (0 dano)'] };
  }
  if (afNorm === 'absorve') {
    return { danoFinal: 0, curaAbsorvida: dano, afinidadeAplicada: 'absorve', detalhes: [...detalhes, `Absorve (+${dano} PV)`] };
  }

  if (afNorm === 'vulneravel') {
    if (estaGuardando) {
      // Guarda concede Resistência a todos os tipos; Resistência + Vulnerabilidade anulam-se mutuamente
      detalhes.push('Vulnerável cancelado por Guarda (×1)');
    } else {
      dano = dano * 2;
      detalhes.push('Vulnerável (×2)');
    }
  } else if (afNorm === 'resistente' || estaGuardando) {
    dano = Math.floor(dano / 2);
    detalhes.push(estaGuardando ? 'Em Guarda / Resistente (÷2)' : 'Resistente (÷2)');
  }

  return {
    danoFinal: Math.max(0, dano),
    curaAbsorvida: 0,
    afinidadeAplicada: estaGuardando && afNorm === 'normal' ? 'resistente_guarda' : afNorm,
    detalhes
  };
}

/**
 * Calcula bônus ativos de combate derivados das condições do participante, estado de Guarda e modificadores da cena.
 * @param {Object} combatente
 * @param {Object} [modificadoresCena={}]
 * @returns {Object}
 */
export function extrairModificadoresCombatente(combatente = {}, modificadoresCena = {}) {
  const condicoes = Array.isArray(combatente?.condicoes) ? combatente.condicoes : [];
  const modsAtributos = calcularModificadoresCondicoesOficiais(condicoes);
  const guardando = Boolean(combatente?.guardando);
  const emCrise = calcularStatusCrise(combatente?.hp_atual, combatente?.hp_max);
  const caido = estaDerrotado(combatente?.hp_atual);
  const extraCombatente = combatente?.modificadores && typeof combatente.modificadores === 'object'
    ? combatente.modificadores
    : {};

  return {
    condicoes,
    modsAtributos,
    guardando,
    bonusOpostosGuarda: guardando ? 2 : 0,
    emCrise,
    caido,
    protegendoId: combatente?.protegendo_id ?? null,
    decretoDanoExtra: Number(modificadoresCena?.decretoDanoExtra) || 0,
    decretoDobrarPm: Boolean(modificadoresCena?.decretoDobrarPm),
    roqueBloquearCura: Boolean(modificadoresCena?.roqueBloquearCura),
    bonusDanoSofridoCondenar: Number(extraCombatente?.bonusDanoCondenar) || 0,
    detalhesCondicoes: condicoes
      .map((id) => CONDICOES_OFICIAIS[normalizarTextoCore(id)]?.nome || id)
      .filter(Boolean)
  };
}

/**
 * Processa e valida uma Ação Rápida de Conflito para execução imediata em mesas híbridas,
 * computando alterações em recursos, turno, Guarda, condições, relógios e log de combate.
 * @param {Object} params
 * @returns {{ valido: boolean, erro?: string, updatesAtor: Object, updatesAlvo: Object|null, deltaRelogio: number, logEntry: Object|null }}
 */
export function resolverAcaoCombate({
  acaoCodigo = 'ATAQUE',
  ator = null,
  alvo = null,
  custoPv = 0,
  custoPm = 0,
  custoPi = 0,
  custoPf = 0,
  danoAplicado = 0,
  curaAplicada = 0,
  recursoCura = 'pv',
  tipoDano = 'fisico',
  afinidadeAlvo = 'normal',
  reducaoDanoAlvo = 0,
  condicaoAlvo = null,
  perdaPmAlvo = 0,
  piRecuperados = 0,
  avancoRelogio = 0,
  limparCondicoes = false,
  removerCondicaoAlvo = null,
  notaLivre = '',
  marcarTurnoConcluido = true,
  modificadoresCena = {}
} = {}) {
  const codigoRaw = String(acaoCodigo || 'ATAQUE').toUpperCase();
  const codigoNorm = codigoRaw === 'GUARDA' ? 'GUARDAR' : codigoRaw;
  let acaoInfo =
    ACOES_CONFLITO_OFICIAIS[codigoNorm] ||
    ACOES_LIVRES_E_MANOBRAS[codigoNorm] ||
    ACOES_ANDARILHO_OFICIAIS[codigoNorm] ||
    ACOES_ATIRADOR_OFICIAIS[codigoNorm] ||
    ACOES_INVENTOR_OFICIAIS[codigoNorm] ||
    ACOES_LADINO_OFICIAIS[codigoNorm] ||
    ACOES_MESTRE_DE_ARMAS_OFICIAIS[codigoNorm] ||
    ACOES_PILOTO_OFICIAIS[codigoNorm] ||
    ACOES_BLOCO_A_OFICIAIS[codigoNorm] ||
    ACOES_BLOCO_B_OFICIAIS[codigoNorm] ||
    ACOES_BLOCO_C_OFICIAIS[codigoNorm] ||
    ACOES_BLOCO_D_OFICIAIS[codigoNorm] ||
    REACOES_COMBATE_OFICIAIS[codigoNorm] ||
    MANOBRAS_TATICAS_OFICIAIS[codigoNorm];

  if (!acaoInfo) {
    acaoInfo = {
      codigo: codigoNorm,
      titulo: codigoNorm === 'ACAO_LIVRE' ? 'Ação Livre / Efeito Tático' : (codigoNorm.startsWith('HAB_') ? 'Habilidade de Classe' : codigoNorm),
      categoria: 'suporte',
      consomeTurno: Boolean(marcarTurnoConcluido),
      custoBase: null,
      resumo: 'Ação resolvida com efeitos e recursos configurados.'
    };
  }
  if (!ator || !ator.nome) {
    return { valido: false, erro: 'Combatente ativo não informado.', updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (estaDerrotado(ator.hp_atual) && codigoNorm !== 'RENDICAO') {
    return { valido: false, erro: `${ator.nome} está caído (0 PV) e não pode executar ações normais.`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }

  let pmGasto = Math.max(0, parseInt(custoPm, 10) || 0);
  if (modificadoresCena?.decretoDobrarPm && pmGasto > 0 && codigoNorm === 'CONJURAR') {
    pmGasto *= 2;
  }
  const piGasto = Math.max(0, parseInt(custoPi, 10) || 0);
  const pfGasto = Math.max(0, parseInt(custoPf, 10) || 0);
  const pvGasto = Math.max(0, parseInt(custoPv, 10) || 0);

  if (pvGasto > 0 && pvGasto >= (Number(ator.hp_atual) || 0) && (codigoNorm === 'GOLPE_DAS_SOMBRAS' || codigoNorm === 'VISMAGUS')) {
    return { valido: false, erro: `${ator.nome} não possui PV suficientes para pagar ${pvGasto} PV sem cair a 0 PV.`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (pmGasto > (Number(ator.mp_atual) || 0)) {
    return { valido: false, erro: `${ator.nome} não possui PM suficientes (requer ${pmGasto} PM).`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  const piDisponivel = Number(ator.ip ?? ator.ip_atual ?? ator.pontos_inventario) || 0;
  if (piGasto > piDisponivel) {
    return { valido: false, erro: `${ator.nome} não possui PI suficientes (requer ${piGasto} PI).`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (pfGasto > (Number(ator.pontos_fabula) || 0)) {
    return { valido: false, erro: `${ator.nome} não possui Pontos de Fábula suficientes (requer ${pfGasto} PF).`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }

  const updatesAtor = {};
  let updatesAlvo = null;
  if (pvGasto > 0) {
    if (isNpcCombatente(ator)) {
      const maxHpAtor = extrairHpMax(ator);
      const novoHp = clampRecursoNpc((Number(ator.hp_atual) || 0) - pvGasto, maxHpAtor, 0);
      updatesAtor.hp_atual = novoHp;
      updatesAtor.dano_acumulado = calcularDanoAcumulado(novoHp, maxHpAtor);
    } else {
      updatesAtor.hp_atual = aplicarDeltaRecurso(ator.hp_atual, -pvGasto, ator.hp_max, 0);
    }
  }
  if (pmGasto > 0) {
    if (isNpcCombatente(ator)) {
      const maxMpAtor = extrairMpMax(ator);
      updatesAtor.mp_atual = clampRecursoNpc((Number(ator.mp_atual) || 0) - pmGasto, maxMpAtor, 0);
    } else {
      updatesAtor.mp_atual = aplicarDeltaRecurso(ator.mp_atual, -pmGasto, ator.mp_max, 0);
    }
  }
  if (piGasto > 0) {
    const novoIp = aplicarDeltaRecurso(piDisponivel, -piGasto, null, 0);
    updatesAtor.ip = novoIp;
    if (ator.ip_atual !== undefined) updatesAtor.ip_atual = novoIp;
  }
  if (pfGasto > 0) updatesAtor.pontos_fabula = aplicarDeltaRecurso(ator.pontos_fabula, -pfGasto, null, 0);

  const piRecuperadosNum = Math.max(0, parseInt(piRecuperados, 10) || 0);
  if (piRecuperadosNum > 0) {
    const ipBase = updatesAtor.ip !== undefined ? updatesAtor.ip : piDisponivel;
    const novoIp = Math.min(6, ipBase + piRecuperadosNum);
    updatesAtor.ip = novoIp;
    if (ator.ip_atual !== undefined) updatesAtor.ip_atual = novoIp;
  }

  const resumoPartes = [];

  if (marcarTurnoConcluido) {
    const totalAcoes = isNpcCombatente(ator) ? Math.max(1, Number(ator.acoes_por_turno) || 1) : 1;
    const modsAtor = ator.modificadores && typeof ator.modificadores === 'object' ? ator.modificadores : {};
    const realizadasAntes = Math.max(0, Number(modsAtor.acoes_realizadas_rodada) || 0);
    const realizadasAgora = realizadasAntes + 1;

    if (totalAcoes > 1) {
      updatesAtor.modificadores = {
        ...modsAtor,
        acoes_realizadas_rodada: realizadasAgora
      };
      resumoPartes.push(`Multi-Ação (${realizadasAgora}/${totalAcoes})`);
    }

    if (realizadasAgora >= totalAcoes) {
      updatesAtor.agiu = true;
      updatesAtor.turno_atual = false;
    } else {
      updatesAtor.agiu = false;
      updatesAtor.turno_atual = false;
    }
  }

  if (codigoNorm === 'GUARDAR' || codigoNorm === 'COBERTURA_GUARDA') {
    updatesAtor.guardando = true;
    if (alvo && alvo.id && alvo.id !== ator.id) {
      updatesAtor.protegendo_id = alvo.id;
      resumoPartes.push(`Em Guarda cobrindo ${alvo.nome} (Resistência total e +2 Opostos)`);
    } else {
      updatesAtor.protegendo_id = null;
      resumoPartes.push('Em Guarda (Resistência total a danos e +2 Opostos)');
    }
  } else if (codigoNorm === 'RENDICAO') {
    updatesAtor.pontos_fabula = aplicarDeltaRecurso(ator.pontos_fabula, 2, null, 0);
    resumoPartes.push(`${ator.nome} realizou Rendição (+2 Pontos de Fábula)`);
  } else if (codigoNorm === 'COCHILO_PODEROSO') {
    const valorCura = Number(curaAplicada) > 0
      ? Number(curaAplicada)
      : (20 + Math.floor((Number(ator.nivel) || 5) / 2));
    updatesAtor.hp_atual = aplicarDeltaRecurso(ator.hp_atual, valorCura, ator.hp_max, 0);
    updatesAtor.mp_atual = aplicarDeltaRecurso(ator.mp_atual, valorCura, ator.mp_max, 0);
    updatesAtor.condicoes = [];
    updatesAtor.agiu = true;
    updatesAtor.turno_atual = false;
    resumoPartes.push(`💤 Cochilo Poderoso: Recuperou +${valorCura} PV e PM, curou todas as condições (DEF/M.DEF tornam-se 5)`);
  } else if (codigoNorm === 'LADO_A_LADO_PM') {
    updatesAtor.mp_atual = aplicarDeltaRecurso(ator.mp_atual, 10, ator.mp_max, 0);
    resumoPartes.push(`🤝 Lado a Lado: ${ator.nome} recuperou +10 PM (e companheiro +10 PM)`);
  } else if (codigoNorm === 'PRATICO_SUPORTE') {
    resumoPartes.push(`🎒 Suporte Prático${alvo ? ` em favor de ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'COMANDAR_COMPANHEIRO') {
    resumoPartes.push(`🐾 Comandou ação do Companheiro Fiel${alvo ? ` visando ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'INVOCAR_ARCANO') {
    if (Number(curaAplicada) > 0) {
      updatesAtor.hp_atual = aplicarDeltaRecurso(ator.hp_atual, Number(curaAplicada), ator.hp_max, 0);
      resumoPartes.push(`🔮 Invocou Arcano (+${curaAplicada} PV por Regeneração Arcana)`);
    } else {
      resumoPartes.push(`🔮 Invocou Arcano (Sem Teste)`);
    }
  } else if (codigoNorm === 'DISPENSAR_ARCANO') {
    resumoPartes.push(`✨ Dispensou Arcano`);
  } else if (codigoNorm === 'CIRCULO_ARCANO') {
    resumoPartes.push(`🌀 Círculo Arcano (Feitiço Livre sem ação)`);
  } else if (codigoNorm === 'ESTUDO' || codigoNorm === 'ESTUDO_ERUDITO') {
    resumoPartes.push(`🔍 Estudo${alvo ? ` em ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'OBJETIVO') {
    const delta = (parseInt(avancoRelogio, 10) || 1);
    resumoPartes.push(`🎯 Objetivo (${delta > 0 ? `+${delta}` : delta} seção(ões))`);
  } else if (codigoNorm === 'IMPEDIMENTO') {
    resumoPartes.push(`✋ Impedimento${alvo ? ` contra ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'EQUIPAMENTO') {
    resumoPartes.push('🛡️ Troca de Equipamento');
  } else if (codigoNorm === 'ANALISE_RAPIDA') {
    resumoPartes.push(`🔍 Análise Rápida${alvo ? ` em ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'PREVISIVEL') {
    resumoPartes.push(`🎯 Previsível! em ${alvo?.nome || 'o alvo'} (Taxa de 20 PM em ação)`);
  } else if (codigoNorm === 'PALAVRAS_SABEDORIA') {
    resumoPartes.push(`💬 Palavras de Sabedoria em apoio${alvo ? ` a ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'TIRO_DE_AVISO') {
    resumoPartes.push(`⚠️ Tiro de Aviso${alvo ? ` em ${alvo.nome}` : ''} (Dano 0)`);
  } else if (codigoNorm === 'BARRAGEM') {
    resumoPartes.push('🎯 Barragem (Propriedade Multi no Ataque à Distância)');
  } else if (codigoNorm === 'FOGO_CRUZADO') {
    resumoPartes.push('🛑 Fogo Cruzado: Ataque à distância inimigo interceptado e anulado!');
  } else if (codigoNorm === 'OLHOS_DE_AGUIA_DANO') {
    resumoPartes.push('🦅 Olhos de Águia: Mira Concentrada para o próximo ataque');
  } else if (codigoNorm === 'OLHOS_DE_AGUIA_TIRO_LIVRE') {
    resumoPartes.push('🦅 Olhos de Águia: Disparo em Guarda (RA = 0 no dano)');
  } else if (codigoNorm === 'ISCA_CHAMARIZ') {
    resumoPartes.push('🪤 Isca Chamariz erguida para atrair ataques inimigos');
  } else if (codigoNorm === 'ITEM_EMERGENCIAL') {
    resumoPartes.push('🚨 Item Emergencial: Ação adicional de Inventário em Crise!');
  } else if (codigoNorm === 'CHUVA_POCOES') {
    resumoPartes.push('🌧️ Chuva de Poções: Restauração repartida entre aliados');
  } else if (codigoNorm === 'TONICO_ALQUIMICO') {
    resumoPartes.push(`🧪 Tônico Alquímico${alvo ? ` em favor de ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'BOMBA_ALQUIMICA') {
    resumoPartes.push(`💣 Bomba Alquímica${alvo ? ` visando ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'INFUSAO_ELEMENTAL') {
    resumoPartes.push(`⚙️ Infusão Elemental${alvo ? ` em favor de ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'VEJO_VOCE_MAIS_TARDE') {
    updatesAtor.fugiu = true;
    updatesAtor.agiu = true;
    updatesAtor.turno_atual = false;
    resumoPartes.push('💨 Vejo Você Mais Tarde: Escapou do combate com segurança!');
  } else if (codigoNorm === 'ROUBO_DE_ALMA') {
    resumoPartes.push(`👻 Roubo de Alma${alvo ? ` em ${alvo.nome}` : ''}`);
    if (piRecuperadosNum > 0) resumoPartes.push(`+${piRecuperadosNum} PI`);
    if (alvo) {
      updatesAlvo = updatesAlvo || {};
      updatesAlvo.modificadores = {
        ...(alvo.modificadores && typeof alvo.modificadores === 'object' ? alvo.modificadores : {}),
        alma_roubada: true
      };
    }
  } else if (codigoNorm === 'GOLPE_BAIXO') {
    resumoPartes.push(`🗡️ Golpe Baixo${alvo ? ` em ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'SUMIR') {
    updatesAtor.modificadores = {
      ...(ator.modificadores && typeof ator.modificadores === 'object' ? ator.modificadores : {}),
      invisivel: true
    };
    resumoPartes.push('🌫️ Sumir: Invisível aos alvos até o próximo turno');
  } else if (codigoNorm === 'CHUVA_DE_LAMINAS') {
    resumoPartes.push('⚔️ Chuva de Lâminas: Ataque corpo a corpo recebe Multi(2) ou +1 em Multi');
  } else if (codigoNorm === 'CONTRA_ATAQUE') {
    resumoPartes.push(`🛡️ Contra-Ataque${alvo ? ` contra ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'QUEBRA_OSSOS') {
    resumoPartes.push(`🦴 Quebra-Ossos${alvo ? ` em ${alvo.nome}` : ''} (Dano 0)`);
  } else if (codigoNorm === 'TRESPASSAR') {
    resumoPartes.push(`💥 Trespassar${alvo ? ` em ${alvo.nome}` : ''} (Ataque livre com dano secundário)`);
  } else if (codigoNorm === 'CORACAO_NO_MOTOR') {
    resumoPartes.push('⚙️ Coração no Motor: Ativação veicular (10 PM)');
  } else if (codigoNorm === 'CONFIGURACAO_FLEXIVEL') {
    resumoPartes.push('🔧 Configuração Flexível: Troca de módulos ativos do veículo');
  } else if (codigoNorm === 'CONDENAR') {
    resumoPartes.push(`⚡ Condenar${alvo ? ` em ${alvo.nome}` : ''}`);
    if (alvo) {
      updatesAlvo = updatesAlvo || {};
      updatesAlvo.modificadores = {
        ...(alvo.modificadores && typeof alvo.modificadores === 'object' ? alvo.modificadores : {}),
        condenado: true,
        bonusDanoSofridoCondenar: Number(acaoInfo?.bonusDanoSofrido || 0) || 1
      };
    }
  } else if (codigoNorm === 'ENCORAJAR') {
    resumoPartes.push(`🗣️ Encorajar${alvo ? ` em favor de ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'CONFIO_EM_VOCE') {
    resumoPartes.push(`🤝 Confio em Você${alvo ? ` em apoio a ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'PROVOCAR') {
    resumoPartes.push(`💢 Provocar${alvo ? ` em ${alvo.nome}` : ''} (Compelido a focar o Furioso)`);
    if (alvo) {
      updatesAlvo = updatesAlvo || {};
      updatesAlvo.modificadores = {
        ...(alvo.modificadores && typeof alvo.modificadores === 'object' ? alvo.modificadores : {}),
        provocado_por: ator.id
      };
    }
  } else if (codigoNorm === 'RESISTIR') {
    resumoPartes.push('🛡️ Resistir: Guarda fortalecida com recuperação e aumento de atributo');
    updatesAtor.guardando = true;
    updatesAtor.agiu = true;
  } else if (codigoNorm === 'ESPIRITO_INDOMAVEL') {
    resumoPartes.push('🔥 Espírito Indomável: Benefício reativo por Ponto de Fábula');
  } else if (codigoNorm === 'GOLPE_DAS_SOMBRAS') {
    resumoPartes.push(`🌑 Golpe das Sombras${alvo ? ` em ${alvo.nome}` : ''} (Dano Sombrio)`);
  } else if (codigoNorm === 'AGONIA') {
    resumoPartes.push('🩸 Agonia: Restauração de PV e PM por ferir alvo com Laço');
  } else if (codigoNorm === 'CORACAO_DA_ESCURIDAO') {
    resumoPartes.push('🖤 Coração da Escuridão: Laço de ódio formado em Crise');
  } else if (codigoNorm === 'LICAO_DOLOROSA') {
    resumoPartes.push(`👁️ Lição Dolorosa: Estudo reativo contra ${alvo ? alvo.nome : 'o agressor'}`);
  } else if (codigoNorm === 'TEMPO_ROUBADO') {
    resumoPartes.push(`⏳ Tempo Roubado${alvo ? ` em ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'SETE_DA_SORTE') {
    resumoPartes.push('🎲 Sete da Sorte: Substituição de dado pelo número da sorte');
  } else if (codigoNorm === 'ABSORVER_PM') {
    resumoPartes.push('🌀 Absorver PM: Recuperação de PM após sofrer dano');
  } else if (codigoNorm === 'CATACLISMO') {
    resumoPartes.push('🌋 Cataclismo: Dano amplificado por gasto extra de PM');
  } else if (codigoNorm === 'LAMINA_MAGICA') {
    resumoPartes.push('🗡️ Lâmina Mágica: Feitiço canalizado pela Precisão da arma');
  } else if (codigoNorm === 'VISMAGUS') {
    resumoPartes.push('🩸 Vismagus: Feitiço conjurado consumindo PV');
  } else if (codigoNorm === 'PODER_CURATIVO') {
    resumoPartes.push('✨ Poder Curativo: Cura amplificada por Laços com arma arcana');
  } else if (codigoNorm === 'PROTEGER') {
    resumoPartes.push(`🛡️ Proteger: Tomou o lugar de ${alvo ? alvo.nome : 'aliado'} na ameaça`);
  } else if (codigoNorm === 'GUARDA_COSTAS') {
    resumoPartes.push(`🤝 Guarda-Costas: ${alvo ? alvo.nome : 'Aliado'} coberto ganha Resistência a todos os danos`);
  } else if (codigoNorm === 'ESCUDOS_GEMEOS') {
    resumoPartes.push('⚔️ Escudos Gêmeos: Ataque duplo com escudos empunhados');
  } else if (codigoNorm === 'FOCO_COGNITIVO') {
    resumoPartes.push(`🎯 Foco Cognitivo${alvo ? `: ${alvo.nome} designado como Foco` : ''}`);
    if (alvo) {
      updatesAtor.modificadores = {
        ...(ator.modificadores && typeof ator.modificadores === 'object' ? ator.modificadores : {}),
        foco_cognitivo_id: alvo.id
      };
    }
  } else if (codigoNorm === 'DONS_PSIQUICOS') {
    resumoPartes.push(`🔮 Dons Psíquicos${alvo ? ` em ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'TERIOMORFOSE') {
    resumoPartes.push('🧬 Teriomorfose: Manifestação de terioformas ativas (1/3 PV)');
  } else if (codigoNorm === 'ECDISE') {
    resumoPartes.push('🛡️ Écdise: Resistência elemental adquirida por 10 PV');
  } else if (codigoNorm === 'BIOFAGIA') {
    resumoPartes.push('🩸 Biofagia: Regeneração em Crise ao infligir dano');
  } else if (codigoNorm === 'ACROMORFOSE') {
    resumoPartes.push('🦾 Acromorfose: Adaptação de categoria de armas desarmadas');
  } else if (codigoNorm === 'GENOCLEPSE') {
    resumoPartes.push(`🔬 Genoclepse${alvo ? ` contra ${alvo.nome}` : ''}: Revelação de espécie e assimilação`);
  } else if (codigoNorm === 'CARGA_CAVALARIA') {
    resumoPartes.push(`🐎 Carga de Cavalaria${alvo ? `: Ataque livre para ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'DECRETO_DO_BISPO') {
    resumoPartes.push('📜 Decreto do Bispo: Proclamação tática proclamada (10 PM)');
  } else if (codigoNorm === 'ROQUE_DO_REI') {
    resumoPartes.push('🏰 Roque do Rei: Manobra defensiva de recursos (10 PM)');
  } else if (codigoNorm === 'GAMBITO_DA_DAMA') {
    resumoPartes.push(`👑 Gambito da Dama${alvo ? ` com ${alvo.nome}` : ''}: Ataque livre e efeito tático`);
  } else if (codigoNorm === 'CARRUAGEM_DEVASTADORA') {
    resumoPartes.push(`⚡ Carruagem Devastadora${alvo ? `: Turno de ${alvo.nome} adiantado` : ''}`);
  } else if (codigoNorm === 'DANCA') {
    resumoPartes.push('💃 Apresentar Dança: Dança realizada com maestria');
  } else if (codigoNorm === 'ME_ACOMPANHE') {
    resumoPartes.push(`🤝 Me Acompanhe${alvo ? `: Benefício estendido a ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'TROCA_FIGURINO') {
    resumoPartes.push('🎭 Troca de Figurino: Ação Equipamento realizada sem gastar ação');
  } else if (codigoNorm === 'SIMBOLISMO') {
    resumoPartes.push(`🖋️ Simbolismo${alvo ? ` aplicado em ${alvo.nome}` : ''} (2 PI)`);
  } else if (codigoNorm === 'TOQUE_PESSOAL') {
    resumoPartes.push(`✨ Toque Pessoal${alvo ? ` em ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'SIMBOLOS_MAGICOS') {
    resumoPartes.push(`🔮 Símbolos Mágicos${alvo ? `: Concedido a ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'MAGICANTO') {
    resumoPartes.push(`🎵 Magicanto${alvo ? ` entoado para ${alvo.nome}` : ''}`);
  } else if (codigoNorm === 'HARMONIA') {
    resumoPartes.push('🎼 Harmonia: Ressonância sonora após verso');
  } else if (codigoNorm === 'VIBRATO') {
    resumoPartes.push('⚡ Vibrato: Ataque livre executado após verso');
  } else if (codigoNorm === 'CLOROMANCIA') {
    resumoPartes.push('🌱 Cloromancia: Magissemente plantada no jardim (20 PM)');
  } else if (codigoNorm === 'ENXERTO') {
    resumoPartes.push('✂️ Enxerto: Magissemente substituída mantendo relógio');
  } else if (codigoNorm === 'JARDINAGEM_MARCIAL') {
    resumoPartes.push(`🌸 Jardinagem Marcial${alvo ? ` contra ${alvo.nome}` : ''}: Ação livre após plantio (RA = 0)`);
  } else if (codigoNorm === 'CULINARIA') {
    resumoPartes.push(`🥣 Culinária${alvo ? ` partilhada com ${alvo.nome}` : ''}: Banquete preparado`);
  } else if (codigoNorm === 'CULINARIA_OFENSIVA') {
    resumoPartes.push(`🍴 Culinária Ofensiva${alvo ? ` contra ${alvo.nome}` : ''}: Ataque culinário`);
  } else if (codigoNorm === 'FEITO_COM_AMOR') {
    resumoPartes.push(`❤️ Feito com Amor${alvo ? `: Alvo extra ${alvo.nome}` : ''} (10 PM)`);
  } else if (codigoNorm === 'SAL_E_PIMENTA') {
    resumoPartes.push('🧂 Sal e Pimenta: Sabor de ingrediente alterado (2 PI)');
  } else if (codigoNorm === 'INVOCACAO') {
    resumoPartes.push(`⚡ Invocação Elemental${alvo ? ` canalizada em ${alvo.nome}` : ''} (5 PM, acerto automático)`);
  } else if (codigoNorm === 'INVOCACOES_CONECTADAS') {
    resumoPartes.push(`🔗 Invocações Conectadas${alvo ? `: Alvo adicional ${alvo.nome}` : ''} (10 PM)`);
  } else if (codigoNorm === 'CASCATA') {
    resumoPartes.push(`🌊 Cascata${alvo ? ` contra ${alvo.nome}` : ''}: Ataque livre após Praga`);
  } else if (codigoNorm === 'ESTOQUE_PESSOAL') {
    resumoPartes.push(`📦 Estoque Pessoal${alvo ? ` para ${alvo.nome}` : ''}: Custo de PI anulado (1 PC)`);
  } else if (codigoNorm === 'JA_OUVI_FALAR') {
    resumoPartes.push(`🗳️ Já Ouvi Falar${alvo ? ` em exame de ${alvo.nome}` : ''} (1 PC)`);
  } else if (codigoNorm === 'DATA_DE_VALIDADE') {
    resumoPartes.push(`☠ Data de Validade${alvo ? ` contra ${alvo.nome}` : ''}: Cura convertida em Veneno`);
  } else if (codigoNorm === 'PASSAR_TURNO') {
    resumoPartes.push('⏩ Passou o Turno');
  } else if (codigoNorm === 'ACAO_LIVRE' || codigoNorm === 'EFEITO_LIVRE') {
    resumoPartes.push('✨ Ação Livre / Ajuste Tático');
  }

  const alvoEfetivo = alvo || (curaAplicada > 0 ? ator : null);

  if (alvoEfetivo && Number(danoAplicado) > 0) {
    const modAlvo = extrairModificadoresCombatente(alvoEfetivo, modificadoresCena);
    const resDano = calcularDanoFinalComModificadores({
      danoBruto: Number(danoAplicado),
      reducaoDanoFixa: Number(reducaoDanoAlvo) || 0,
      estaGuardando: modAlvo.guardando,
      afinidade: afinidadeAlvo,
      bonusDanoCondenar: modAlvo.bonusDanoSofridoCondenar,
      bonusDanoAdicional: modificadoresCena?.decretoDanoExtra || 0
    });

    updatesAlvo = updatesAlvo || {};
    const isAlvoNpc = isNpcCombatente(alvoEfetivo);
    const maxHpAlvo = extrairHpMax(alvoEfetivo);

    if (resDano.curaAbsorvida > 0) {
      const novoHpAlvo = isAlvoNpc
        ? clampRecursoNpc((Number(alvoEfetivo.hp_atual) || 0) + resDano.curaAbsorvida, maxHpAlvo, 0)
        : aplicarDeltaRecurso(alvoEfetivo.hp_atual, resDano.curaAbsorvida, alvoEfetivo.hp_max, 0);
      updatesAlvo.hp_atual = novoHpAlvo;
      if (isAlvoNpc) {
        updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHpAlvo, maxHpAlvo);
      }
      resumoPartes.push(`${alvoEfetivo.nome} absorveu +${resDano.curaAbsorvida} PV (${tipoDano})`);
    } else {
      const novoHpAlvo = isAlvoNpc
        ? clampRecursoNpc((Number(alvoEfetivo.hp_atual) || 0) - resDano.danoFinal, maxHpAlvo, 0)
        : aplicarDeltaRecurso(alvoEfetivo.hp_atual, -resDano.danoFinal, alvoEfetivo.hp_max, 0);
      updatesAlvo.hp_atual = novoHpAlvo;
      updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHpAlvo, isAlvoNpc ? maxHpAlvo : alvoEfetivo.hp_max);
      resumoPartes.push(`${alvoEfetivo.nome} sofreu ${resDano.danoFinal} de dano (${tipoDano})`);

      if (isAlvoNpc) {
        const checkFase = verificarGatilhoTransicaoFase({
          hpAtual: novoHpAlvo,
          hpMax: maxHpAlvo,
          faseAtual: alvoEfetivo.fase_atual,
          fasesChefao: alvoEfetivo.fases_chefao
        });
        if (checkFase.gatilhoAtivo && checkFase.proximaFaseObj) {
          resumoPartes.push(`⚡ GATILHO DE CHEFE: ${checkFase.proximaFaseObj.nome}`);
        }
      }
    }
  }

  if (alvoEfetivo && Number(curaAplicada) > 0) {
    const modCura = calcularCuraEfetivaEmConflito({
      curaBase: Number(curaAplicada),
      tipoRecurso: recursoCura,
      bloqueadoPorRoqueDoRei: Boolean(modificadoresCena?.roqueBloquearCura)
    });
    const destinoIsAtor = alvoEfetivo.id === ator.id;
    const combatenteDestino = destinoIsAtor ? ator : alvoEfetivo;
    const isDestinoNpc = isNpcCombatente(combatenteDestino);

    if (modCura.valorFinal > 0) {
      if (recursoCura === 'pm') {
        const mpBase = destinoIsAtor && updatesAtor.mp_atual !== undefined ? updatesAtor.mp_atual : combatenteDestino.mp_atual;
        let novoMp;
        if (isDestinoNpc) {
          const maxMpDestino = extrairMpMax(combatenteDestino);
          novoMp = clampRecursoNpc((Number(mpBase) || 0) + modCura.valorFinal, maxMpDestino, 0);
        } else {
          novoMp = aplicarDeltaRecurso(mpBase, modCura.valorFinal, combatenteDestino.mp_max, 0);
        }

        if (destinoIsAtor) updatesAtor.mp_atual = novoMp;
        else {
          updatesAlvo = updatesAlvo || {};
          updatesAlvo.mp_atual = novoMp;
        }
        resumoPartes.push(`${combatenteDestino.nome} recuperou +${modCura.valorFinal} PM`);
      } else {
        const hpBase = destinoIsAtor && updatesAtor.hp_atual !== undefined ? updatesAtor.hp_atual : combatenteDestino.hp_atual;
        let novoHp;
        if (isDestinoNpc) {
          const maxHpDestino = extrairHpMax(combatenteDestino);
          novoHp = clampRecursoNpc((Number(hpBase) || 0) + modCura.valorFinal, maxHpDestino, 0);
          if (destinoIsAtor) {
            updatesAtor.hp_atual = novoHp;
            updatesAtor.dano_acumulado = calcularDanoAcumulado(novoHp, maxHpDestino);
          } else {
            updatesAlvo = updatesAlvo || {};
            updatesAlvo.hp_atual = novoHp;
            updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHp, maxHpDestino);
          }
        } else {
          novoHp = aplicarDeltaRecurso(hpBase, modCura.valorFinal, combatenteDestino.hp_max, 0);
          if (destinoIsAtor) updatesAtor.hp_atual = novoHp;
          else {
            updatesAlvo = updatesAlvo || {};
            updatesAlvo.hp_atual = novoHp;
            updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHp, combatenteDestino.hp_max);
          }
        }
        resumoPartes.push(`${combatenteDestino.nome} recuperou +${modCura.valorFinal} PV`);
      }
    } else if (modCura.detalhes.length > 0) {
      resumoPartes.push(modCura.detalhes.join(', '));
    }
  }

  if (limparCondicoes) {
    if (alvo) {
      updatesAlvo = updatesAlvo || {};
      updatesAlvo.condicoes = [];
      resumoPartes.push(`${alvo.nome} curou todas as condições`);
    } else {
      updatesAtor.condicoes = [];
      resumoPartes.push(`${ator.nome} curou todas as condições`);
    }
  }

  if (alvo && removerCondicaoAlvo) {
    const cRem = normalizarTextoCore(removerCondicaoAlvo);
    const atuaisAlvo = Array.isArray(alvo.condicoes) ? alvo.condicoes : [];
    updatesAlvo = updatesAlvo || {};
    updatesAlvo.condicoes = atuaisAlvo.filter((c) => normalizarTextoCore(c) !== cRem);
    resumoPartes.push(`${alvo.nome} curou a condição ${removerCondicaoAlvo.toUpperCase()}`);
  }

  if (alvo && condicaoAlvo) {
    const condNorm = normalizarTextoCore(condicaoAlvo);
    const atuaisAlvo = Array.isArray(alvo.condicoes) ? alvo.condicoes : [];
    if (!atuaisAlvo.includes(condNorm)) {
      updatesAlvo = updatesAlvo || {};
      updatesAlvo.condicoes = [...atuaisAlvo, condNorm];
      const nomeCond = CONDICOES_OFICIAIS[condNorm]?.nome || condicaoAlvo;
      resumoPartes.push(`${alvo.nome} ficou ${nomeCond}`);
    }
  }

  if (alvo && Number(perdaPmAlvo) > 0) {
    updatesAlvo = updatesAlvo || {};
    const isAlvoNpc = isNpcCombatente(alvo);
    const maxMpAlvo = extrairMpMax(alvo);
    const mpBase = updatesAlvo.mp_atual !== undefined ? updatesAlvo.mp_atual : alvo.mp_atual;
    const novoMpAlvo = isAlvoNpc
      ? clampRecursoNpc((Number(mpBase) || 0) - Number(perdaPmAlvo), maxMpAlvo, 0)
      : aplicarDeltaRecurso(mpBase, -Number(perdaPmAlvo), alvo.mp_max, 0);
    updatesAlvo.mp_atual = novoMpAlvo;
    resumoPartes.push(`${alvo.nome} perdeu ${perdaPmAlvo} PM`);
  }

  const deltaRelogio = (codigoNorm === 'OBJETIVO' || Number(avancoRelogio) !== 0)
    ? (parseInt(avancoRelogio, 10) || (codigoNorm === 'OBJETIVO' ? 1 : 0))
    : 0;
  if (deltaRelogio !== 0) {
    resumoPartes.push(`Relógio ${deltaRelogio > 0 ? `+${deltaRelogio}` : deltaRelogio} seção(ões)`);
  }

  if (pvGasto > 0) resumoPartes.push(`-${pvGasto} PV`);
  if (pmGasto > 0) resumoPartes.push(`-${pmGasto} PM`);
  if (piGasto > 0) resumoPartes.push(`-${piGasto} PI`);
  if (pfGasto > 0) resumoPartes.push(`-${pfGasto} PF`);
  if (notaLivre && notaLivre.trim()) resumoPartes.push(notaLivre.trim());

  const detalhes = resumoPartes.length > 0 ? resumoPartes.join(' • ') : (acaoInfo.resumo || acaoInfo.efeito);

  return {
    valido: true,
    updatesAtor,
    updatesAlvo,
    alvoId: alvoEfetivo?.id || null,
    deltaRelogio,
    logEntry: {
      combatente_id: ator.id || null,
      autor_nome: ator.nome,
      autor_tipo: ator.tipo || 'heroi',
      acao_codigo: codigoNorm,
      acao_titulo: acaoInfo.titulo,
      detalhes,
      metadata: {
        alvo_nome: alvoEfetivo?.nome || null,
        dano_aplicado: Number(danoAplicado) || 0,
        cura_aplicada: Number(curaAplicada) || 0,
        pv_gasto: pvGasto,
        pm_gasto: pmGasto,
        pi_gasto: piGasto,
        pf_gasto: pfGasto,
        condicao_aplicada: condicaoAlvo || null,
        delta_relogio: deltaRelogio
      }
    }
  };
}

// =============================================================================
// SISTEMA DE ROLAGEM DE DADOS INTEGRADA AO COMBATE (FICHAS E NPCS)
// =============================================================================

export const ATRIBUTOS_CONFLITO = {
  des: { key: 'des', campoFicha: 'destreza', sigla: 'DES', nome: 'Destreza' },
  ast: { key: 'ast', campoFicha: 'astucia', sigla: 'AST', nome: 'Astúcia' },
  vig: { key: 'vig', campoFicha: 'vigor', sigla: 'VIG', nome: 'Vigor' },
  von: { key: 'von', campoFicha: 'vontade', sigla: 'VON', nome: 'Vontade' }
};

export const TESTES_RAPIDOS_PADRAO = [
  { codigo: 'INICIATIVA', titulo: 'Iniciativa / Percepção', attr1: 'des', attr2: 'ast', isOposto: true },
  { codigo: 'RES_FISICA', titulo: 'Resistência Física', attr1: 'vig', attr2: 'vig', isOposto: false },
  { codigo: 'RES_MENTAL', titulo: 'Resistência Mental', attr1: 'von', attr2: 'von', isOposto: false },
  { codigo: 'ESTUDO', titulo: 'Estudo (ND 10/13/16)', attr1: 'ast', attr2: 'ast', isOposto: false, ndSugerido: 10 },
  { codigo: 'IMPEDIMENTO', titulo: 'Impedimento / Disputa', attr1: 'des', attr2: 'vig', isOposto: true }
];

/**
 * Converte valor de dado textual ou numérico (ex: 'd8', 'D10', 8) em número de faces válido.
 * @param {string|number} valor
 * @param {number} [padrao=8]
 * @returns {number}
 */
export function extrairFacesDadoCombate(valor, padrao = 8) {
  if (!valor) return padrao;
  if (typeof valor === 'number') {
    return PROGRESSAO_DADOS_ATRIBUTO.includes(valor) ? valor : padrao;
  }
  const limpo = parseInt(String(valor).replace(/\D/g, ''), 10);
  return PROGRESSAO_DADOS_ATRIBUTO.includes(limpo) ? limpo : padrao;
}

/**
 * Aplica variação de passos na progressão oficial de dados de Fabula Ultima [6, 8, 10, 12, 20].
 * @param {number} facesBase
 * @param {number} [deltaPassos=0]
 * @param {number} [tetoFaces=20]
 * @returns {number}
 */
export function aplicarPassosDadoCombate(facesBase, deltaPassos = 0, tetoFaces = 20) {
  const faces = extrairFacesDadoCombate(facesBase, 8);
  const idxBase = Math.max(0, PROGRESSAO_DADOS_ATRIBUTO.indexOf(faces));
  const idxTeto = Math.max(0, PROGRESSAO_DADOS_ATRIBUTO.indexOf(tetoFaces));
  const idxFinal = Math.max(0, Math.min(idxTeto, idxBase + (Number(deltaPassos) || 0)));
  return PROGRESSAO_DADOS_ATRIBUTO[idxFinal];
}

/**
 * Normaliza siglas ou nomes de atributos para uma das chaves canônicas: 'des' | 'ast' | 'vig' | 'von'.
 * @param {string} attr
 * @param {string} [fallback='des']
 * @returns {string}
 */
export function normalizarChaveAtributo(attr, fallback = 'des') {
  const norm = normalizarTextoCore(String(attr || ''));
  if (norm.startsWith('des') || norm.startsWith('dex') || norm.startsWith('agi')) return 'des';
  if (norm.startsWith('ast') || norm.startsWith('ins') || norm.startsWith('int')) return 'ast';
  if (norm.startsWith('vig') || norm.startsWith('mig') || norm.startsWith('for')) return 'vig';
  if (norm.startsWith('von') || norm.startsWith('wlp') || norm.startsWith('esp')) return 'von';
  return fallback;
}

/**
 * Extrai atributos de fórmula textual de precisão (ex: "[DES + VIG] +1" -> { attr1: 'des', attr2: 'vig', bonus: 1 }).
 * @param {Object} stats
 * @returns {{ attr1: string, attr2: string, bonus: number }}
 */
function extrairFormulaArmaItem(stats = {}) {
  let attr1 = normalizarChaveAtributo(stats.attr1 || 'des', 'des');
  let attr2 = normalizarChaveAtributo(stats.attr2 || 'vig', 'vig');
  let bonus = parseInt(stats.precisao || stats.acerto || 0, 10) || 0;

  const formula = String(stats.precisao || '').toUpperCase();
  if (formula) {
    const matchAttrs = formula.match(/[([【]\s*([A-Z]{3})\s*\+\s*([A-Z]{3})\s*[)\]】]/);
    if (matchAttrs) {
      attr1 = normalizarChaveAtributo(matchAttrs[1], attr1);
      attr2 = normalizarChaveAtributo(matchAttrs[2], attr2);
    }
    const partes = formula.split(/[)\]】]/);
    if (partes.length > 1) {
      const matchBonus = partes[1].match(/\+\s*(\d+)/);
      if (matchBonus) {
        bonus = Math.max(bonus, parseInt(matchBonus[1], 10) || 0);
      }
    }
  }

  return { attr1, attr2, bonus };
}

/**
 * Extrai o perfil completo de rolagem de um combatente (Herói ou NPC)
 * puxando automaticamente os atributos reais, penalidades de condições ativas,
 * armas equipadas/ataques básicos e magias/feitiços cadastrados.
 * @param {Object} params
 * @param {Object} [params.combatente={}]
 * @param {Object|null} [params.ficha=null]
 * @param {Object|null} [params.npc=null]
 * @param {Object} [params.modificadoresCena={}]
 * @returns {Object}
 */
export function extrairPerfilRolagemCombatente({
  combatente = {},
  ficha = null,
  npc = null,
  companheiroFiel = null,
  catalogoModulos = [],
  modificadoresCena = {}
} = {}) {
  const condicoes = Array.isArray(combatente?.condicoes) ? combatente.condicoes : [];
  const modsCondicoesBrutos = calcularModificadoresCondicoesOficiais(condicoes);
  const modsCondicoes = {
    des: modsCondicoesBrutos.destreza || 0,
    ast: modsCondicoesBrutos.astucia || 0,
    vig: modsCondicoesBrutos.vigor || 0,
    von: modsCondicoesBrutos.vontade || 0
  };

  const emCrise = calcularStatusCrise(combatente?.hp_atual, combatente?.hp_max);
  const guardando = Boolean(combatente?.guardando);
  const decretoDanoExtra = Number(modificadoresCena?.decretoDanoExtra) || 0;

  // 1. Determina atributos base (Ficha do Herói ou Ficha do NPC)
  let desBase = 8;
  let astBase = 8;
  let vigBase = 8;
  let vonBase = 8;

  if (ficha) {
    const classesFicha = Array.isArray(ficha.classes) ? ficha.classes : (Array.isArray(ficha.fichas_classes) ? ficha.fichas_classes : []);
    const nivelTotal = classesFicha.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha.nivel) || 5;
    const bonusHeroicos = calcularBonusPassivosPoderesHeroicos(ficha.poderes_heroicos || [], nivelTotal);

    desBase = aplicarPassosDadoCombate(ficha.destreza, bonusHeroicos.aumentosAtributo?.destreza || 0, 12);
    astBase = aplicarPassosDadoCombate(ficha.astucia, bonusHeroicos.aumentosAtributo?.astucia || 0, 12);
    vigBase = aplicarPassosDadoCombate(ficha.vigor, bonusHeroicos.aumentosAtributo?.vigor || 0, 12);
    vonBase = aplicarPassosDadoCombate(ficha.vontade, bonusHeroicos.aumentosAtributo?.vontade || 0, 12);
  } else if (npc?.atributos) {
    desBase = extrairFacesDadoCombate(npc.atributos.des, 8);
    astBase = extrairFacesDadoCombate(npc.atributos.ast, 8);
    vigBase = extrairFacesDadoCombate(npc.atributos.vig, 8);
    vonBase = extrairFacesDadoCombate(npc.atributos.von, 8);
  }

  const atributosBase = { des: desBase, ast: astBase, vig: vigBase, von: vonBase };
  const atributosAtuais = {
    des: aplicarPassosDadoCombate(desBase, modsCondicoes.des, 20),
    ast: aplicarPassosDadoCombate(astBase, modsCondicoes.ast, 20),
    vig: aplicarPassosDadoCombate(vigBase, modsCondicoes.vig, 20),
    von: aplicarPassosDadoCombate(vonBase, modsCondicoes.von, 20)
  };

  // 2. Extrai armas / ataques, magias e habilidades ativas
  const armas = [];
  const magias = [];
  const habilidades = [];
  let companheiroDados = null;
  let magiesferasCombatente = [];
  let dadosErudito = null;
  let dadosAtirador = null;
  let dadosInventor = null;
  let dadosLadino = null;
  let dadosMestreDeArmas = null;

  if (ficha) {
    const classesFicha = Array.isArray(ficha.classes) ? ficha.classes : (Array.isArray(ficha.fichas_classes) ? ficha.fichas_classes : []);
    const todosItens = Array.isArray(ficha.itens) ? ficha.itens : [];
    const itensEquipados = todosItens.filter((i) => i.equipado || i.stats_personalizados?.slot);
    const passivosCore = calcularPassivosCoreClasses({
      classes: classesFicha,
      ficha,
      itensEquipados,
      emCrise
    });

    const nivelTotal = classesFicha.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha.nivel) || 5;
    const temFeiticoPoderoso = (ficha.poderes_heroicos || []).some((p) => {
      const txt = normalizarTextoCore(typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''}`);
      return txt.includes('feitico poderoso');
    });
    const bonusFeiticoPoderoso = temFeiticoPoderoso ? (nivelTotal >= 40 ? 10 : 5) : 0;
    dadosErudito = extrairHabilidadesErudito({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });
    dadosAtirador = extrairHabilidadesAtirador({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });
    dadosLadino = extrairHabilidadesLadino({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });
    dadosMestreDeArmas = extrairHabilidadesMestreDeArmas({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });

    // Armas equipadas nas mãos (excluindo armaduras, trajes/vestimentas, escudos e acessórios)
    const armasMaos = [];
    const nomesArmasVistas = new Set();

    itensEquipados.forEach((i) => {
      const slot = i.stats_personalizados?.slot || i.slot || '';
      const tipo = normalizarTextoCore(i.tipo || '');
      const ehArmaduraOuAcessorio =
        tipo.includes('armadura') ||
        tipo.includes('vestimenta') ||
        tipo.includes('traje') ||
        tipo.includes('escudo') ||
        tipo.includes('acessorio') ||
        slot === 'armadura' ||
        slot === 'acessorio' ||
        i.stats_personalizados?.escudo === true;

      if (ehArmaduraOuAcessorio) return;

      const ehDesarmado =
        i.ehDesarmado === true ||
        i.id === 'desarmado' ||
        i.id === 'ataque_desarmado' ||
        normalizarTextoCore(i.nome || '').includes('desarmad');

      if (ehDesarmado) return;

      const ehSlotMao =
        slot === 'mao_dominante' ||
        slot === 'mao_secundaria' ||
        slot === 'duas_maos' ||
        slot === 'ambas_maos' ||
        slot === 'mao';

      const ehTipoArma =
        tipo.includes('arma') ||
        tipo.includes('corpo_a_corpo') ||
        tipo.includes('distancia') ||
        tipo.includes('arco') ||
        tipo.includes('espada') ||
        tipo.includes('lanca') ||
        tipo.includes('adaga') ||
        tipo.includes('machado') ||
        tipo.includes('mangual') ||
        tipo.includes('malho') ||
        tipo.includes('pistola') ||
        tipo.includes('fogo') ||
        tipo.includes('pesada') ||
        tipo.includes('luta') ||
        tipo.includes('arcana') ||
        Boolean(i.stats_personalizados?.dano || i.stats?.dano || i.dano);

      const estaEquipadoMao = ehSlotMao || (Boolean(i.equipado) && slot !== 'mochila' && slot !== 'inventario');

      if (estaEquipadoMao && ehTipoArma) {
        const chaveArma = `${i.id || ''}_${i.nome || ''}`;
        if (!nomesArmasVistas.has(chaveArma)) {
          nomesArmasVistas.add(chaveArma);
          armasMaos.push(i);
        }
      }
    });

    const adicionarArmaEquipadaNoPerfil = (itemAlvo, sufixoId = '', ehSegundaForma = false) => {
      const stats = { ...(itemAlvo || {}), ...(itemAlvo.stats || {}), ...(itemAlvo.stats_personalizados || {}) };
      const alcanceTexto = normalizarTextoCore(`${stats.alcance || ''} ${stats.categoria || ''} ${itemAlvo.tipo || ''}`);
      const ehDistancia =
        alcanceTexto.includes('distancia') ||
        alcanceTexto.includes('arco') ||
        alcanceTexto.includes('fogo') ||
        alcanceTexto.includes('arremesso') ||
        alcanceTexto.includes('besta');

      const { attr1, attr2, bonus: bonusArma } = extrairFormulaArmaItem(stats);
      let attr1Final = attr1;
      let attr2Final = attr2;
      let substituiuAstucia = false;

      if (dadosErudito.habilidades.conhecimentoEPoder.ativo && attr1 !== 'ast' && attr2 !== 'ast') {
        const val1 = atributosAtuais[attr1] || 8;
        const val2 = atributosAtuais[attr2] || 8;
        const valAst = atributosAtuais.ast || 8;
        if (valAst > val1 || valAst > val2) {
          if (val1 <= val2) {
            attr1Final = 'ast';
          } else {
            attr2Final = 'ast';
          }
          substituiuAstucia = true;
        }
      }

      const bonusMaestria = ehDistancia ? passivosCore.bonusPrecisaoDistancia : passivosCore.bonusPrecisaoCorpoACorpo;

      const valorDanoBruto = stats.dano_fixo ?? stats.dano ?? stats.bonus_dano ?? 5;
      let danoArma = 0;
      if (typeof valorDanoBruto === 'number') {
        danoArma = valorDanoBruto;
      } else {
        const str = String(valorDanoBruto);
        const matchDano = str.includes('+') ? str.split('+').pop() : str;
        danoArma = parseInt(matchDano, 10) || 0;
      }

      const atingeVoadores = ehDistancia || armaAtingeVoadores(itemAlvo);
      const resumoCarac = extrairResumoCaracteristicasEquipamento(itemAlvo);
      const efeitosTexto = Array.isArray(stats.efeitos) ? stats.efeitos.join(' • ') : '';

      const isArmaArcana = alcanceTexto.includes('arcana') || normalizarTextoCore(itemAlvo.nome || '').includes('arcana');
      const bonusDanoAtirador = calcularBonusDanoAtirador({
        dadosAtirador,
        nivelTotal,
        isDistancia: ehDistancia,
        isArmaArcana
      });
      const bonusAtaquePoderoso = calcularBonusDanoAtaquePoderoso({
        temAtaquePoderoso: dadosMestreDeArmas?.poderesHeroicos?.ataquePoderoso,
        nivelTotal,
        isCorpoACorpo: !ehDistancia
      });

      const ehDuasMaos = isArmaDuasMaos(itemAlvo) || isArmaDuasMaos({ stats });
      const propMulti = stats.multi || stats.propriedade_multi || (normalizarTextoCore(efeitosTexto).includes('multi') ? 2 : null);

      armas.push({
        id: `${itemAlvo.id || 'arma'}${sufixoId}`,
        nome: itemAlvo.nome || 'Arma Equipada',
        attr1: attr1Final,
        attr2: attr2Final,
        attr1Original: attr1,
        attr2Original: attr2,
        substituiuAstucia,
        conhecimentoEPoder: dadosErudito.habilidades.conhecimentoEPoder.ativo,
        bonusPrecisao: bonusArma + bonusMaestria,
        bonusDano: danoArma + passivosCore.bonusDanoAdrenalinaCrise + bonusDanoAtirador + bonusAtaquePoderoso + decretoDanoExtra,
        tipoDano: normalizarTextoCore(stats.tipo_dano || 'fisico') || 'fisico',
        alcance: ehDistancia ? 'distancia' : 'corpo_a_corpo',
        isPadrao: false,
        atingeVoadores,
        ehDuasMaos,
        maos: ehDuasMaos ? 2 : 1,
        slot: stats.slot || itemAlvo.slot || (ehDuasMaos ? 'duas_maos' : 'mao_dominante'),
        armaMaeId: itemAlvo.armaMaeId || itemAlvo.id || 'arma',
        ehSegundaForma,
        isMutavel: Boolean(stats.mutavel || resumoCarac.segundaForma || ehSegundaForma),
        propriedadeMulti: propMulti,
        especiesCacadora: resumoCarac.especiesCacadora,
        efeito: efeitosTexto
      });
    };

    armasMaos.forEach((item, idx) => {
      const itemMae = { ...item, armaMaeId: item.id || `arma_${idx}` };
      adicionarArmaEquipadaNoPerfil(itemMae, `_${idx}`, false);
      const resumoCarac = extrairResumoCaracteristicasEquipamento(item);
      if (resumoCarac.segundaForma) {
        const itemForma2 = obterItemFormaAtivaArmaMutavel(itemMae, true);
        adicionarArmaEquipadaNoPerfil({ ...itemForma2, armaMaeId: itemMae.armaMaeId }, `_${idx}_forma2`, true);
      }
    });

    // Módulos de Arma do Veículo Pessoal do Piloto (Atlas Tecno-Fantasia)
    const pilotoClass = classesFicha.find((c) => normalizarTextoCore(c?.nome_classe).includes('pilot'));
    const habVeiculo = (pilotoClass?.habilidades || []).find((h) => normalizarTextoCore(h?.nome).includes('veiculo'));
    const habPulsoFirme = (pilotoClass?.habilidades || []).find((h) => normalizarTextoCore(h?.nome).includes('pulso firme'));
    const temPulsoFirme = Boolean(habPulsoFirme && (parseInt(habPulsoFirme.nivel, 10) || 0) > 0);
    const nivelHabVeiculo = parseInt(habVeiculo?.nivel, 10) || 0;

    const dadosVeiculo =
      habVeiculo?.veiculo ||
      pilotoClass?.veiculo ||
      ficha.dados_veiculo ||
      ficha.statusCalculados?.dadosVeiculo ||
      ficha.veiculo ||
      null;

    const temHabilidadeVeiculo = Boolean(
      pilotoClass && (nivelHabVeiculo > 0 || habVeiculo?.veiculo || pilotoClass?.veiculo || dadosVeiculo)
    );

    const veiculoAtivo = Boolean(
      temHabilidadeVeiculo &&
      dadosVeiculo &&
      typeof dadosVeiculo === 'object' &&
      dadosVeiculo.veiculoInvocado !== false
    );

    if (temHabilidadeVeiculo && veiculoAtivo) {
      const modulosAtivosIds = Array.isArray(dadosVeiculo.modulosAtivos)
        ? dadosVeiculo.modulosAtivos
        : (Array.isArray(dadosVeiculo.modulos_ativos) ? dadosVeiculo.modulos_ativos : []);

      let bonusMiraVeiculo = 0;
      modulosAtivosIds.forEach((mId) => {
        const mObj = obterModuloPorId(mId, catalogoModulos);
        if (mObj && mObj.tipo === 'suporte') {
          bonusMiraVeiculo += (Number(mObj.precisao_bonus) || Number(mObj.bonus_precisao) || 0);
        }
      });

      modulosAtivosIds.forEach((mId, mIdx) => {
        const mObj = obterModuloPorId(mId, catalogoModulos);
        if (!mObj || mObj.tipo !== 'arma') return;

        let atr1 = 'des';
        let atr2 = 'ast';
        if (Array.isArray(mObj.atributos_precisao) && mObj.atributos_precisao.length >= 2) {
          atr1 = normalizarChaveAtributo(mObj.atributos_precisao[0], 'des');
          atr2 = normalizarChaveAtributo(mObj.atributos_precisao[1], 'ast');
        } else if (typeof mObj.atributos_precisao === 'string') {
          const matchAtr = mObj.atributos_precisao.match(/([a-zA-Z]+)\s*\+\s*([a-zA-Z]+)/);
          if (matchAtr) {
            atr1 = normalizarChaveAtributo(matchAtr[1], 'des');
            atr2 = normalizarChaveAtributo(matchAtr[2], 'ast');
          }
        }

        if (temPulsoFirme || dadosVeiculo.customizacoes?.usarPulsoFirme) {
          const val1 = atributosAtuais[atr1] || 8;
          const val2 = atributosAtuais[atr2] || 8;
          if (val1 <= val2) {
            atr1 = 'vig';
          } else {
            atr2 = 'vig';
          }
        }

        const bonusArma = (Number(mObj.precisao_bonus) || Number(mObj.bonus_precisao) || 0) + bonusMiraVeiculo;
        let danoArma = 8;
        if (mObj.dano_bonus !== null && mObj.dano_bonus !== undefined) {
          danoArma = Number(mObj.dano_bonus) || 0;
        } else if (mObj.dano_formula) {
          const matchDano = String(mObj.dano_formula).match(/\+\s*(\d+)/);
          if (matchDano) danoArma = parseInt(matchDano[1], 10) || 8;
        }

        const ehDistancia = mObj.alcance === 'distancia';

        armas.push({
          id: `veiculo_${mObj.id || mObj.key || mIdx}`,
          nome: `${mObj.nome || 'Arma Veicular'} (${dadosVeiculo.nome || 'Veículo'})`,
          attr1: atr1,
          attr2: atr2,
          bonusPrecisao: bonusArma,
          bonusDano: danoArma + passivosCore.bonusDanoAdrenalinaCrise + decretoDanoExtra,
          tipoDano: normalizarTextoCore(mObj.tipo_dano || 'fisico') || 'fisico',
          alcance: ehDistancia ? 'distancia' : 'corpo_a_corpo',
          isPadrao: false,
          isModuloVeicular: true,
          atingeVoadores: ehDistancia || Boolean(mObj.atingeVoadores || mObj.atinge_voadores),
          efeito: mObj.descricao || mObj.propriedades || ''
        });
      });
    }

    // Na Ordem de Combate / Conflito, a opção de ataque desarmado não é exibida.
    // O módulo de armas só é exibido quando o herói possuir armas equipadas ou módulos veiculares aplicáveis.

    // Multiataque / Duas Armas (Fabula Ultima Livro Básico p. 68-69):
    // Se o herói possuir 2 ou mais armas de uma mão disponíveis (excluindo módulos veiculares):
    const armasUmaMao = armas.filter(
      (a) => !a.isModuloVeicular && !a.ehDesarmado && !a.ehDuasMaos && a.maos !== 2 && a.slot !== 'duas_maos'
    );
    const armasUmaMaoDistintas = [];
    const armasMaeVistas = new Set();
    armasUmaMao.forEach((a) => {
      const chaveMae = a.armaMaeId || a.id;
      if (!armasMaeVistas.has(chaveMae)) {
        armasMaeVistas.add(chaveMae);
        armasUmaMaoDistintas.push(a);
      }
    });

    if (armasUmaMaoDistintas.length >= 2) {
      const a1 = armasUmaMaoDistintas[0];
      const a2 = armasUmaMaoDistintas[1];
      armas.push({
        id: 'multiataque_duas_armas',
        nome: `⚔️ Multiataque: Duas Armas (${a1.nome} + ${a2.nome})`,
        nomeCurto: 'Duas Armas',
        isDuasArmas: true,
        arma1: a1,
        arma2: a2,
        attr1: a1.attr1,
        attr2: a1.attr2,
        bonusPrecisao: Math.min(Number(a1.bonusPrecisao) || 0, Number(a2.bonusPrecisao) || 0),
        bonusDano: Number(a1.bonusDano) || 0,
        bonusDanoSecundario: Number(a2.bonusDano) || 0,
        tipoDano: a1.tipoDano || 'fisico',
        tipoDanoSecundario: a2.tipoDano || 'fisico',
        alcance: a1.alcance,
        atingeVoadores: a1.atingeVoadores || a2.atingeVoadores,
        resumoEfeito: `1º Golpe: RA + ${a1.bonusDano} (${a1.tipoDano}) | 2º Golpe (RA=0): +${a2.bonusDano} (${a2.tipoDano})`
      });
    }

    // Feitiços aprendidos da ficha (incluindo Quimerista e Arcanista) sem duplicatas
    const chavesMagiasVistas = new Set();
    const listaMagias = Array.isArray(ficha.magias) ? ficha.magias : [];
    listaMagias.forEach((m, idx) => {
      const nomeM = m.nome || 'Feitiço';
      const chave = m.id || nomeM;
      if (chavesMagiasVistas.has(chave)) return;
      chavesMagiasVistas.add(chave);

      const matchPm = String(m.custo_mp || m.custo_pm || '').match(/\d+/);
      const custoBase = matchPm ? parseInt(matchPm[0], 10) || 0 : 10;
      magias.push({
        id: m.id || `magia_${idx}`,
        nome: nomeM,
        attr1: 'ast',
        attr2: 'von',
        bonusPrecisao: passivosCore.bonusTesteArtilhariaMagica,
        bonusDano: bonusFeiticoPoderoso + decretoDanoExtra,
        custoPm: modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase,
        ofensiva: true,
        descricao: m.descricao || ''
      });
    });

    classesFicha.forEach((c, cIdx) => {
      // Magias aprendidas de Quimerista
      const magiasQuim = extrairMagiasQuimerista(c, ficha);
      magiasQuim.forEach((mq, mIdx) => {
        const nomeQuim = mq.nome || `Feitiço Quimérico ${mIdx + 1}`;
        const chave = mq.id || nomeQuim;
        if (chavesMagiasVistas.has(chave)) return;
        chavesMagiasVistas.add(chave);

        const matchPm = String(mq.custo_pm || mq.custo_mp || mq.custo || '').match(/\d+/);
        const custoBase = matchPm ? parseInt(matchPm[0], 10) || 0 : 10;
        const attrQuim = extrairAtributoQuimerista(c, ficha) || 'ast';
        const bonusDanoCustom = parseInt(mq.bonus_dano || mq.dano_bonus, 10) || 0;
        magias.push({
          id: mq.id || `quim_${cIdx}_${mIdx}`,
          nome: nomeQuim,
          attr1: normalizarChaveAtributo(mq.attr1 || attrQuim, 'ast'),
          attr2: normalizarChaveAtributo(mq.attr2 || 'von', 'von'),
          bonusPrecisao: passivosCore.bonusTesteArtilhariaMagica,
          bonusDano: bonusDanoCustom + bonusFeiticoPoderoso + decretoDanoExtra,
          custoPm: modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase,
          ofensiva: true,
          isQuimerista: true,
          especie: mq.especie || 'Monstro/Fera',
          condicao: mq.condicao || '',
          descricao: mq.descricao || mq.efeito || ''
        });
      });

    // Habilidades e Ações de Conflito da classe Arcanista (Invocação, Dispensa e Círculo Arcano)
    const acoesArcanista = gerarAcoesConflitoArcanista({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha,
      emCrise,
      modificadoresCena
    });

    acoesArcanista.forEach((acao) => {
      if (acao.isArcano) {
        if (!chavesMagiasVistas.has(acao.id)) {
          chavesMagiasVistas.add(acao.id);
          magias.push(acao);
        }
      } else if (acao.codigo === 'CIRCULO_ARCANO') {
        habilidades.push(acao);
      }
    });
    });

    // Habilidades e Magiesferas da classe Inventor (Tecnomagia Superior)
    dadosInventor = extrairHabilidadesInventor({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });
    const magiesferasInfo = extrairMagiesferasInventor({
      classes: classesFicha,
      ficha,
      temBolsosFundos: dadosInventor.poderesHeroicos.bolsosFundos
    });
    const magiesferasInventor = magiesferasInfo.magiesferas || [];
    magiesferasCombatente = magiesferasInventor;
    magiesferasInventor.forEach((mag, mIdx) => {
      const nomeMag = mag.nome || `Magiesfera ${mIdx + 1}`;
      const chave = `magiesfera_${mag.id || mIdx}`;
      if (chavesMagiasVistas.has(chave)) return;
      chavesMagiasVistas.add(chave);

      magias.push({
        id: chave,
        nome: `🔮 Magiesfera: ${nomeMag}`,
        nomeCurto: nomeMag,
        attr1: 'ast',
        attr2: 'von',
        bonusPrecisao: passivosCore.bonusTesteArtilhariaMagica,
        custoPm: mag.custoPm,
        custoPi: mag.custoPi || 2,
        isMagiesfera: true,
        tipo_acao: 'inventario',
        disciplina: mag.classe,
        ofensivo: mag.ofensivo,
        alvo: mag.alvo,
        duracao: mag.duracao,
        descricao: mag.descricao || '',
        resumoEfeito: `Ação Inventário (2 PI + ${mag.custoPm} PM) • [${mag.classe}] ${mag.descricao || ''}`
      });
    });

    // Habilidades ativas/usáveis em combate da ficha
    classesFicha.forEach((c) => {
      const habsClasse = Array.isArray(c.habilidades) ? c.habilidades : [];
      habsClasse.forEach((h, hIdx) => {
        const nivelHab = h?.nivel !== undefined && h?.nivel !== null ? Number(h.nivel) : 1;
        if (nivelHab > 0) {
          const nomeHab = h?.nome || `Habilidade ${hIdx + 1}`;
          const nomeNorm = normalizarTextoCore(nomeHab);
          const ehPassivoOuEnriquecido =
            nomeNorm.includes('aumento de pv') ||
            nomeNorm.includes('aumento de pm') ||
            nomeNorm.includes('aumento de pi') ||
            nomeNorm.includes('pontos de vida') ||
            nomeNorm.includes('pontos de mente') ||
            nomeNorm.includes('imitacao magica') ||
            nomeNorm.includes('companheiro fiel') ||
            nomeNorm.includes('cacador de tesouros') ||
            nomeNorm.includes('papo de taverna') ||
            nomeNorm.includes('viajante experiente') ||
            nomeNorm.includes('pratico') ||
            nomeNorm.includes('vincular e invocar') ||
            nomeNorm.includes('arcano emergencial') ||
            nomeNorm.includes('regeneracao arcana') ||
            nomeNorm.includes('circulo arcano') ||
            nomeNorm.includes('arcanismo ritualista') ||
            nomeNorm.includes('cochilo poderoso') ||
            nomeNorm.includes('lado a lado') ||
            nomeNorm.includes('estudo') ||
            nomeNorm.includes('analise rapida') ||
            nomeNorm.includes('previsivel') ||
            nomeNorm.includes('palavras de sabedoria') ||
            nomeNorm.includes('tiro de aviso') ||
            nomeNorm.includes('fogo cruzado') ||
            nomeNorm.includes('barragem') ||
            nomeNorm.includes('olhos de aguia') ||
            nomeNorm.includes('tonico alquimico') ||
            nomeNorm.includes('bomba alquimica') ||
            nomeNorm.includes('infusao elemental') ||
            nomeNorm.includes('chuva de pocoes') ||
            nomeNorm.includes('item emergencial') ||
            nomeNorm.includes('tecnomagia superior') ||
            nomeNorm.includes('alta velocidade') ||
            nomeNorm.includes('esquiva') ||
            nomeNorm.includes('golpe baixo') ||
            nomeNorm.includes('roubo de alma') ||
            nomeNorm.includes('vejo voce mais tarde') ||
            nomeNorm.includes('chuva de laminas') ||
            nomeNorm.includes('contra-ataque') ||
            nomeNorm.includes('quebra-ossos') ||
            nomeNorm.includes('trespassar') ||
            nomeNorm.includes('maestria com armas') ||
            nomeNorm.includes('coracao no motor') ||
            nomeNorm.includes('configuracao flexivel') ||
            nomeNorm.includes('veiculo pessoal') ||
            nomeNorm.includes('pulso firme') ||
            // Bloco A
            nomeNorm.includes('cataclismo') ||
            nomeNorm.includes('lamina magica') ||
            nomeNorm.includes('tempo roubado') ||
            nomeNorm.includes('sete da sorte') ||
            nomeNorm.includes('absorver pm') ||
            nomeNorm.includes('vismagus') ||
            nomeNorm.includes('poder curativo') ||
            nomeNorm.includes('provocar') ||
            nomeNorm.includes('resistir') ||
            nomeNorm.includes('espirito indomavel') ||
            nomeNorm.includes('guarda-costas') ||
            nomeNorm.includes('escudos gemeos') ||
            nomeNorm.includes('golpe das sombras') ||
            nomeNorm.includes('agonia') ||
            nomeNorm.includes('coracao da escuridao') ||
            nomeNorm.includes('licao dolorosa') ||
            nomeNorm.includes('condenar') ||
            nomeNorm.includes('encorajar') ||
            nomeNorm.includes('confio em voce') ||
            // Bloco B (Mutante e Esper)
            nomeNorm.includes('ecdise') ||
            nomeNorm.includes('biofagia') ||
            nomeNorm.includes('teriomorfose') ||
            nomeNorm.includes('acromorfose') ||
            nomeNorm.includes('genoclepse') ||
            nomeNorm.includes('foco cognitivo') ||
            nomeNorm.includes('dons psiquicos') ||
            nomeNorm.includes('dom psiquico') ||
            nomeNorm.includes('dadivas psiquicas') ||
            nomeNorm.includes('psicocinese') ||
            nomeNorm.includes('hipercognicao') ||
            nomeNorm.includes('navegador') ||
            // Bloco C (Comandante, Dançarino, Simbolista, Virtuoso)
            nomeNorm.includes('carga de cavalaria') ||
            nomeNorm.includes('decreto do bispo') ||
            nomeNorm.includes('roque do rei') ||
            nomeNorm.includes('gambito da dama') ||
            nomeNorm.includes('carruagem devastadora') ||
            nomeNorm.includes('danca') ||
            nomeNorm.includes('dancarino de guerra') ||
            nomeNorm.includes('me acompanhe') ||
            nomeNorm.includes('sapateado frenetico') ||
            nomeNorm.includes('troca de figurino') ||
            nomeNorm.includes('simbolismo') ||
            nomeNorm.includes('toque pessoal') ||
            nomeNorm.includes('simbolos magicos') ||
            nomeNorm.includes('conexao simbolica') ||
            nomeNorm.includes('miragem') ||
            nomeNorm.includes('magicanto') ||
            nomeNorm.includes('harmonia') ||
            nomeNorm.includes('barreira sonora') ||
            nomeNorm.includes('vibrato') ||
            nomeNorm.includes('canto da sereia') ||
            // Bloco D (Floralista, Gourmet, Invocador, Mercador)
            nomeNorm.includes('cloromancia') ||
            nomeNorm.includes('enxerto') ||
            nomeNorm.includes('jardinagem marcial') ||
            nomeNorm.includes('arvore da vida') ||
            nomeNorm.includes('influencia verdejante') ||
            nomeNorm.includes('culinaria') ||
            nomeNorm.includes('feito com amor') ||
            nomeNorm.includes('garfo e faca') ||
            nomeNorm.includes('sal e pimenta') ||
            nomeNorm.includes('cozinheiro viajante') ||
            nomeNorm.includes('invocacao') ||
            nomeNorm.includes('invocações') ||
            nomeNorm.includes('invocacoes conectadas') ||
            nomeNorm.includes('expandir manancial') ||
            nomeNorm.includes('cascata') ||
            nomeNorm.includes('harmonia elemental') ||
            nomeNorm.includes('estoque pessoal') ||
            nomeNorm.includes('ja ouvi falar') ||
            nomeNorm.includes('data de validade') ||
            nomeNorm.includes('ventos do comercio') ||
            nomeNorm.includes('verdadeiro tesouro');

          if (!ehPassivoOuEnriquecido) {
            let custoPm = Number(h.custo_pm || h.custoPm || h.custo || 0);
            if (!custoPm) {
              const textoCompleto = `${nomeHab} ${h.descricao || ''} ${h.efeito || ''}`;
              const matchPm = textoCompleto.match(/(\d+)\s*(?:pm|pontos?\s+de\s+mente)/i);
              if (matchPm) custoPm = parseInt(matchPm[1], 10) || 0;
            }

            habilidades.push({
              id: h.id || `hab_${c.nome_classe || 'cls'}_${hIdx}`,
              nome: nomeHab,
              nivel: nivelHab,
              classe: c.nome_classe || '',
              descricao: h.descricao || h.efeito || '',
              custoPm
            });
          }
        }
      });
    });

    // Mapeamento e ações oficiais de conflito da classe Andarilho e Poderes Heroicos
    const dadosAndarilho = extrairHabilidadesAndarilho({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });

    // Companheiro Fiel do Herói (Andarilho) - apenas se herói possui a habilidade com nível > 0
    const nvCompFiel = obterNivelHabilidade(classesFicha, 'andarilho', 'companheiro fiel');
    if (companheiroFiel && nvCompFiel > 0) {
      const bonusDanoExtraHeroico = calcularBonusDanoCompanheiro(dadosAndarilho);
      const atksComp = (Array.isArray(companheiroFiel.ataques_basicos) ? companheiroFiel.ataques_basicos : []).map((atk, aIdx) => ({
        id: atk.id ? `${atk.id}_${aIdx}` : `comp_atk_${companheiroFiel.id || 'comp'}_${aIdx}`,
        nome: atk.nome || `Ataque ${aIdx + 1}`,
        attr1: normalizarChaveAtributo(atk.atributo_dado1 || 'des', 'des'),
        attr2: normalizarChaveAtributo(atk.atributo_dado2 || 'vig', 'vig'),
        bonusPrecisao: (Number(atk.bonus_precisao) || 0) + nvCompFiel,
        bonusDano: (Number(atk.bonus_dano) || 0) + bonusDanoExtraHeroico + decretoDanoExtra,
        tipoDano: normalizarTextoCore(atk.tipo_dano || 'fisico') || 'fisico',
        alcance: atk.alcance === 'distancia' ? 'distancia' : 'corpo_a_corpo',
        efeito: atk.efeito || ''
      }));

      const feitsComp = (Array.isArray(companheiroFiel.feiticos) ? companheiroFiel.feiticos : []).map((feit, fIdx) => ({
        id: feit.id ? `${feit.id}_${fIdx}` : `comp_feit_${companheiroFiel.id || 'comp'}_${fIdx}`,
        nome: feit.nome || `Feitiço ${fIdx + 1}`,
        custoPm: Number(feit.pm_custo) || 10,
        ofensivo: Boolean(feit.ofensivo),
        descricao: feit.descricao || ''
      }));

      const pvMaxComp = calcularPvMaxCompanheiro(companheiroFiel.pv_max, dadosAndarilho);

      companheiroDados = {
        id: companheiroFiel.id,
        nome: companheiroFiel.nome || 'Companheiro Fiel',
        especie: companheiroFiel.especie || 'Fera',
        nivel: companheiroFiel.nivel || 5,
        pv_atual: companheiroFiel.pv_atual,
        pv_max: pvMaxComp,
        pm_atual: companheiroFiel.pm_atual,
        pm_max: companheiroFiel.pm_max,
        defesa: companheiroFiel.defesa,
        defesa_magica: companheiroFiel.defesa_magica,
        nvHabilidade: nvCompFiel,
        ataques: atksComp,
        feiticos: feitsComp,
        poderes: Array.isArray(companheiroFiel.poderes) ? companheiroFiel.poderes : [],
        temLadoALado: dadosAndarilho.poderesHeroicos.ladoALado,
        temCompanheiroHeroico: dadosAndarilho.poderesHeroicos.companheiroHeroico
      };
    }

    // Injeta ações ativas/situacionais de conflito da classe Andarilho em habilidades
    const acoesAndarilho = gerarAcoesConflitoAndarilho({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha,
      companheiroFiel
    });

    acoesAndarilho.forEach((acao) => {
      if (acao.codigo !== 'COMANDAR_COMPANHEIRO') {
        habilidades.push({
          id: acao.id,
          codigo: acao.codigo,
          nome: acao.nome,
          nomeCurto: acao.nomeCurto,
          nivel: acao.nivel,
          classe: 'Andarilho',
          custoPm: acao.custoPm || 0,
          valorCura: acao.valorCura || 0,
          defesaTemporaria: acao.defesaTemporaria || 0,
          encerraTurno: Boolean(acao.encerraTurno),
          limparCondicoes: Boolean(acao.limparCondicoes),
          isLadoALado: Boolean(acao.isLadoALado),
          recuperarPmHeroi: acao.recuperarPmHeroi,
          recuperarPmCompanheiro: acao.recuperarPmCompanheiro,
          descricao: acao.descricao,
          efeito: acao.descricao
        });
      }
    });

    // Injeta ações ativas/situacionais de conflito da classe Erudito em habilidades
    const acoesErudito = gerarAcoesConflitoErudito({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });

    acoesErudito.forEach((acao) => {
      habilidades.push({
        id: acao.id,
        codigo: acao.codigo,
        nome: acao.nome,
        nomeCurto: acao.nomeCurto,
        tipo: acao.tipo,
        classe: 'Erudito',
        nivel: acao.nivel,
        custoPm: acao.custoPm || 0,
        custoPmMaximo: acao.custoPmMaximo,
        attr1: acao.attr1,
        attr2: acao.attr2,
        bonusTeste: acao.bonusTeste,
        temLampejo: acao.temLampejo,
        npLampejo: acao.npLampejo,
        temVarreduraRapida: acao.temVarreduraRapida,
        descricao: acao.descricao,
        efeito: acao.descricao
      });
    });

    // Injeta ações ativas/situacionais de conflito da classe Atirador em habilidades
    const acoesAtirador = gerarAcoesConflitoAtirador({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha,
      armas
    });

    acoesAtirador.forEach((acao) => {
      habilidades.push({
        id: acao.id,
        codigo: acao.codigo,
        nome: acao.nome,
        nomeCurto: acao.nomeCurto,
        tipo: acao.tipo,
        classe: 'Atirador',
        nivel: acao.nivel,
        custoPm: acao.custoPm || 0,
        bonusDanoProximoAtaque: acao.bonusDanoProximoAtaque,
        perdaPmAlvo: acao.perdaPmAlvo,
        temMiraPerfeita: acao.temMiraPerfeita,
        temTiroteio: acao.temTiroteio,
        descricao: acao.descricao,
        efeito: acao.descricao
      });
    });

    // Injeta ações ativas/situacionais de conflito da classe Inventor em habilidades
    const acoesInventor = gerarAcoesConflitoInventor({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha,
      emCrise
    });

    acoesInventor.forEach((acao) => {
      habilidades.push({
        id: acao.id,
        codigo: acao.codigo,
        nome: acao.nome,
        nomeCurto: acao.nomeCurto,
        tipo: acao.tipo,
        classe: 'Inventor',
        nivel: acao.nivel,
        custoPi: acao.custoPi || 0,
        custoPm: acao.custoPm || 0,
        curaAplicada: acao.curaAplicada || 0,
        danoAplicado: acao.danoAplicado || 0,
        recursoCura: acao.recursoCura || 'pv',
        tipoDano: acao.tipoDano || 'fisico',
        descricao: acao.descricao,
        efeito: acao.descricao
      });
    });

    // Injeta ações ativas/situacionais de conflito da classe Ladino em habilidades
    const acoesLadino = gerarAcoesConflitoLadino({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });

    acoesLadino.forEach((acao) => {
      habilidades.push({
        id: acao.id,
        codigo: acao.codigo,
        nome: acao.nome,
        nomeCurto: acao.nomeCurto,
        tipo: acao.tipo,
        classe: 'Ladino',
        nivel: acao.nivel,
        attr1: acao.attr1,
        attr2: acao.attr2,
        bonusTeste: acao.bonusTeste,
        custoPf: acao.custoPf || 0,
        custoPm: acao.custoPm || 0,
        temPilhar: acao.temPilhar,
        descricao: acao.descricao,
        efeito: acao.descricao
      });
    });

    // Injeta ações ativas/situacionais de conflito da classe Mestre de Armas em habilidades
    const acoesMestre = gerarAcoesConflitoMestreDeArmas({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });

    acoesMestre.forEach((acao) => {
      habilidades.push({
        id: acao.id,
        codigo: acao.codigo,
        nome: acao.nome,
        nomeCurto: acao.nomeCurto,
        tipo: acao.tipo,
        classe: 'Mestre de Armas',
        nivel: acao.nivel,
        custoPm: acao.custoPm || 0,
        danoSecundario: acao.danoSecundario,
        isAcaoExtra: acao.isAcaoExtra,
        descricao: acao.descricao,
        efeito: acao.descricao
      });
    });

    // Injeta ações ativas/situacionais de conflito da classe Piloto em habilidades
    const acoesPiloto = gerarAcoesConflitoPiloto({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha
    });

    acoesPiloto.forEach((acao) => {
      habilidades.push({
        id: acao.id,
        codigo: acao.codigo,
        nome: acao.nome,
        nomeCurto: acao.nomeCurto,
        tipo: acao.tipo,
        classe: 'Piloto',
        nivel: acao.nivel,
        custoPm: acao.custoPm || 0,
        isAcaoExtra: acao.isAcaoExtra,
        descricao: acao.descricao,
        efeito: acao.descricao
      });
    });

    // Injeta ações ativas/situacionais de conflito das classes do Bloco A
    const acoesBlocoA = gerarTodasAcoesConflitoBlocoA({
      classes: classesFicha,
      poderesHeroicos: ficha.poderes_heroicos,
      ficha,
      emCrise
    });
    habilidades.push(...acoesBlocoA);

    // Injeta ações ativas/situacionais de conflito das classes do Bloco B (Mutante e Esper)
    const acoesBlocoB = gerarTodasAcoesConflitoBlocoB({
      classes: classesFicha,
      ficha,
      emCrise,
      pvAtual: ficha?.recursos?.pv?.atual ?? ficha?.pv_atual,
      relogioSecoes: ficha?.dados_esper?.relogioSecoes ?? 0
    });
    habilidades.push(...acoesBlocoB);

    // Injeta ações ativas/situacionais de conflito das classes do Bloco C (High Fantasy)
    const acoesBlocoC = gerarTodasAcoesConflitoBlocoC({
      classes: classesFicha,
      ultimaDancaKey: combatente?.ultima_danca_key || null
    });
    habilidades.push(...acoesBlocoC);

    // Injeta ações ativas/situacionais de conflito das classes do Bloco D (Natural Fantasy)
    const acoesBlocoD = gerarTodasAcoesConflitoBlocoD({
      classes: classesFicha,
      relogioGerminacao: combatente?.relogio_germinacao || 0,
      ingredientes: combatente?.ingredientes || 10,
      nivelPersonagem: ficha.nivel || 5,
      pontosComercio: combatente?.pontos_comercio || 2
    });
    habilidades.push(...acoesBlocoD);

    // Deduplicação estrita de habilidades para evitar duplicatas visuais
    const habilidadesDeduplicadas = [];
    const codigosVistos = new Set();
    habilidades.forEach((hab) => {
      const chave = normalizarTextoCore(hab.codigo || hab.nomeCurto || hab.nome);
      if (!codigosVistos.has(chave)) {
        codigosVistos.add(chave);
        habilidadesDeduplicadas.push(hab);
      }
    });
    habilidades.length = 0;
    habilidades.push(...habilidadesDeduplicadas);
  } else {
    // NPC do catálogo ou Inimigo manual
    const nivelNpc = Number(npc?.nivel) || 5;
    const bonusPrecisaoNivel = Math.floor(nivelNpc / 10);
    const bonusDanoNivel = nivelNpc >= 60 ? 15 : nivelNpc >= 40 ? 10 : nivelNpc >= 20 ? 5 : 0;

    const ataquesNpc = Array.isArray(npc?.ataques_basicos) ? npc.ataques_basicos : [];
    ataquesNpc.forEach((atk, idx) => {
      const infoAtk = formatarAtaqueBasicoNpc(atk);
      const alcanceAtk = normalizarTextoCore(atk.alcance || atk.tipo_alcance || '');
      const ehDistanciaAtk = alcanceAtk.includes('distancia');
      const atingeVoadoresAtk = ehDistanciaAtk || armaAtingeVoadores(atk) || Boolean(atk.atinge_voadores);
      armas.push({
        id: `npc_atk_${idx}`,
        nome: atk.nome || `Ataque ${idx + 1}`,
        attr1: normalizarChaveAtributo(atk.atributo_dado1 || 'des', 'des'),
        attr2: normalizarChaveAtributo(atk.atributo_dado2 || 'vig', 'vig'),
        bonusPrecisao: infoAtk.modPrecisao + bonusPrecisaoNivel,
        bonusDano: infoAtk.bonusDano + bonusDanoNivel + decretoDanoExtra,
        tipoDano: normalizarTextoCore(infoAtk.tipoDano || 'fisico') || 'fisico',
        alcance: ehDistanciaAtk ? 'distancia' : 'corpo_a_corpo',
        isPadrao: idx === 0,
        atingeVoadores: atingeVoadoresAtk,
        condicao: infoAtk.condicao,
        efeito: infoAtk.efeito,
        resumoEfeito: infoAtk.resumoEfeito
      });
    });

    if (armas.length === 0) {
      armas.push({
        id: 'npc_padrao',
        nome: 'Ataque Básico',
        attr1: 'des',
        attr2: 'vig',
        bonusPrecisao: bonusPrecisaoNivel,
        bonusDano: 5 + bonusDanoNivel + decretoDanoExtra,
        tipoDano: 'fisico',
        alcance: 'corpo_a_corpo',
        isPadrao: true
      });
    }

    const feiticosNpc = Array.isArray(npc?.feiticos) ? npc.feiticos : [];
    feiticosNpc.forEach((f, idx) => {
      const custoBase = parseInt(String(f.pm_custo || 10).replace(/\D/g, ''), 10) || 10;
      magias.push({
        id: `npc_mag_${idx}`,
        nome: f.nome || `Feitiço ${idx + 1}`,
        attr1: 'ast',
        attr2: 'von',
        bonusPrecisao: bonusPrecisaoNivel,
        bonusDano: 5 + bonusDanoNivel + decretoDanoExtra,
        tipoDano: normalizarTextoCore(f.tipo_dano || f.tipoDano || 'magico') || 'magico',
        custoPm: modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase,
        ofensiva: true,
        descricao: f.descricao || ''
      });
    });
  }

  const poderesNpcFormatados = Array.isArray(npc?.poderes)
    ? npc.poderes.map(formatarPoderNpcParaExibicao)
    : [];

  // 3. Recálculo dinâmico de Defesa e Defesa Mágica sob efeitos de condições ativas
  const deltaDes = atributosAtuais.des - atributosBase.des;
  const deltaAst = atributosAtuais.ast - atributosBase.ast;

  let defesaFinal = Number(ficha?.defesa ?? npc?.defesa ?? atributosAtuais.des);
  let mdefFinal = Number(ficha?.mdef ?? npc?.defesa_magica ?? atributosAtuais.ast);
  let defesaReduzida = false;
  let mdefReduzida = false;

  if (ficha) {
    const todosItens = Array.isArray(ficha.itens) ? ficha.itens : [];
    const itensEquipados = todosItens.filter((i) => i.equipado || i.stats_personalizados?.slot);
    const itemArmadura = itensEquipados.find((i) => {
      const slot = i.stats_personalizados?.slot || i.slot || '';
      const tipo = normalizarTextoCore(i.tipo || '');
      return slot === 'armadura' || tipo.includes('armadura');
    });
    const statsArm = extrairStatsArmadura(itemArmadura, atributosBase.des);

    let armaduraVeicularFixa = false;
    const classesFicha = Array.isArray(ficha.classes) ? ficha.classes : (Array.isArray(ficha.fichas_classes) ? ficha.fichas_classes : []);
    const pilotoClass = classesFicha.find((c) => normalizarTextoCore(c?.nome_classe).includes('pilot'));
    const habVeiculo = (pilotoClass?.habilidades || []).find((h) => normalizarTextoCore(h?.nome).includes('veiculo'));
    const dadosVeiculo = ficha.dados_veiculo || ficha.statusCalculados?.dadosVeiculo || pilotoClass?.veiculo || habVeiculo?.veiculo || ficha.veiculo || null;

    if (dadosVeiculo && dadosVeiculo.veiculoInvocado !== false) {
      const modulosIds = Array.isArray(dadosVeiculo.modulosAtivos)
        ? dadosVeiculo.modulosAtivos
        : (Array.isArray(dadosVeiculo.modulos_ativos) ? dadosVeiculo.modulos_ativos : []);
      const modArmadura = modulosIds.find((m) => {
        const obj = obterModuloPorId(m, catalogoModulos);
        return obj?.tipo === 'armadura' && (obj.def_fixa !== undefined || obj.defesa_fixa !== undefined);
      });
      if (modArmadura) armaduraVeicularFixa = true;
    }

    if (!statsArm.ehMarcial && !armaduraVeicularFixa && deltaDes !== 0) {
      defesaFinal = Math.max(0, defesaFinal + deltaDes);
      if (deltaDes < 0) defesaReduzida = true;
    }

    if (deltaAst !== 0) {
      mdefFinal = Math.max(0, mdefFinal + deltaAst);
      if (deltaAst < 0) mdefReduzida = true;
    }
  } else if (npc) {
    if (deltaDes !== 0) {
      defesaFinal = Math.max(0, defesaFinal + deltaDes);
      if (deltaDes < 0) defesaReduzida = true;
    }
    if (deltaAst !== 0) {
      mdefFinal = Math.max(0, mdefFinal + deltaAst);
      if (deltaAst < 0) mdefReduzida = true;
    }
  }

  const desReduzida = atributosAtuais.des < atributosBase.des;
  const astReduzida = atributosAtuais.ast < atributosBase.ast;
  const vigReduzida = atributosAtuais.vig < atributosBase.vig;
  const vonReduzida = atributosAtuais.von < atributosBase.von;

  return {
    possuiFichaVinculada: Boolean(ficha || npc),
    origemNome: ficha?.nome_personagem || npc?.nome || combatente?.nome || 'Combatente',
    atributosBase,
    atributosAtuais,
    modsCondicoes,
    defesa: defesaFinal,
    mdef: mdefFinal,
    defesaReduzida,
    mdefReduzida,
    desReduzida,
    astReduzida,
    vigReduzida,
    vonReduzida,
    deltaDes,
    deltaAst,
    iniciativaMod: Number(npc?.iniciativa ?? 0),
    bonusGuardaOposto: guardando ? 2 : 0,
    emCrise,
    armas,
    magias,
    magiesferas: magiesferasCombatente,
    companheiro: companheiroDados,
    dadosErudito: ficha ? dadosErudito : null,
    dadosAtirador: ficha ? dadosAtirador : null,
    dadosInventor: ficha ? dadosInventor : null,
    dadosLadino: ficha ? dadosLadino : null,
    dadosMestreDeArmas: ficha ? dadosMestreDeArmas : null,
    bonusTesteAbertoAstAst: ficha ? (dadosErudito?.habilidades?.concentrado?.bonusAstAst || 0) : 0,
    rank: npc?.rank || combatente?.rank || 'soldado',
    escalaVilania: npc?.escala_vilania || combatente?.escala_vilania || combatente?.escalaVilania || null,
    afinidades: npc?.afinidades || npc?.afinidades_elementais || combatente?.afinidades || {},
    especie: npc?.especie || combatente?.especie || null,
    habilidades: ficha ? habilidades : poderesNpcFormatados,
    poderes: poderesNpcFormatados
  };
}

/**
 * Executa uma rolagem oficial de Fabula Ultima (2 dados de Atributo + Modificador)
 * para Testes de Atributo, Resistência, Iniciativa, Ataques com Armas ou Feitiços,
 * gerando o resultado detalhado e a entrada para o Feed de Ações em tempo real.
 * @param {Object} params
 * @returns {Object}
 */
export function rolarDadosCombate({
  combatente = {},
  perfil = null,
  categoria = 'atributo',
  titulo = 'Teste de Atributo',
  arma = null,
  attr1 = 'des',
  attr2 = 'des',
  bonusTeste = 0,
  bonusDano = 0,
  calcularDano = false,
  zerarHr = false,
  isMulti = false,
  isOposto = false,
  tipoDano = 'fisico',
  custoPm = 0,
  ndAlvo = null,
  condicao = '',
  efeito = '',
  valoresFixos = null
} = {}) {
  const k1 = normalizarChaveAtributo(attr1, 'des');
  const k2 = normalizarChaveAtributo(attr2, 'des');

  const faces1 = perfil?.atributosAtuais?.[k1] || 8;
  const faces2 = perfil?.atributosAtuais?.[k2] || 8;
  const sigla1 = ATRIBUTOS_CONFLITO[k1]?.sigla || 'DES';
  const sigla2 = ATRIBUTOS_CONFLITO[k2]?.sigla || 'DES';

  const d1 = valoresFixos?.d1 !== undefined
    ? Number(valoresFixos.d1)
    : Math.floor(Math.random() * faces1) + 1;
  const d2 = valoresFixos?.d2 !== undefined
    ? Number(valoresFixos.d2)
    : Math.floor(Math.random() * faces2) + 1;

  const bonusGuarda = isOposto && (perfil?.bonusGuardaOposto || combatente?.guardando) ? 2 : 0;
  const bonusVantagem = Number(combatente?.modificadores?.bonus_proximo_teste || combatente?.bonus_proximo_teste || 0);
  const modificadorTotal = (Number(bonusTeste) || 0) + bonusGuarda + bonusVantagem;
  const total = d1 + d2 + modificadorTotal;

  const ehTesteEstudo = titulo.toLowerCase().includes('estudo');
  let infoEstudo = null;
  if (ehTesteEstudo) {
    const temLampejo = Boolean(perfil?.dadosErudito?.habilidades?.lampejoDeSaber?.ativo || perfil?.habilidades?.some((h) => h.temLampejo));
    const npLampejo = perfil?.dadosErudito?.habilidades?.lampejoDeSaber?.nivel || 1;
    const temVarredura = Boolean(perfil?.dadosErudito?.poderesHeroicos?.varreduraRapida);
    infoEstudo = calcularResultadoEstudo({
      d1,
      d2,
      bonusAstAst: modificadorTotal,
      temLampejo,
      npLampejo,
      temVarreduraRapida: temVarredura
    });
  }

  const hrBruto = Math.max(d1, d2);
  const hr = zerarHr ? 0 : hrBruto;

  const isFumble = d1 === 1 && d2 === 1;
  const isCritico = !isFumble && d1 === d2 && d1 >= 6;
  const statusCritico = isCritico
    ? 'Sucesso Crítico!'
    : isFumble
      ? 'Erro Crítico (Fumble)!'
      : null;

  const isDuasArmas = Boolean(arma?.isDuasArmas);
  const bonusDanoEfetivo = isMulti ? 0 : (Number(bonusDano) || 0);
  let danoGolpe1 = null;
  let danoGolpe2 = null;
  let danoTotal = null;

  if (calcularDano) {
    if (isDuasArmas) {
      danoGolpe1 = Math.max(0, hr + (Number(bonusDano) || 0));
      danoGolpe2 = Math.max(0, 0 + (Number(arma.bonusDanoSecundario) || 0));
      danoTotal = danoGolpe1 + danoGolpe2;
    } else {
      danoTotal = Math.max(0, hr + bonusDanoEfetivo);
    }
  }

  const sucessoNd = ndAlvo !== null
    ? (!isFumble && (isCritico || total >= Number(ndAlvo)))
    : null;

  const modStr = modificadorTotal !== 0
    ? (modificadorTotal > 0 ? ` + ${modificadorTotal}` : ` - ${Math.abs(modificadorTotal)}`)
    : '';

  const formulaDados = `[${sigla1} d${faces1}: ${d1} + ${sigla2} d${faces2}: ${d2}]${modStr}`;
  const partesDetalhe = [
    `${formulaDados} = ${total}`,
    `RA: ${hr}`
  ];

  if (calcularDano && danoTotal !== null) {
    if (isDuasArmas) {
      partesDetalhe.push(
        `1º Golpe: ${danoGolpe1} (${arma.tipoDano || tipoDano}) | 2º Golpe (RA=0): ${danoGolpe2} (${arma.tipoDanoSecundario || 'fisico'}) | Total: ${danoTotal}`
      );
    } else {
      partesDetalhe.push(`Dano: ${danoTotal} (${tipoDano})`);
    }
  }
  if (bonusGuarda > 0) {
    partesDetalhe.push('Guarda (+2 Oposto)');
  }
  if (bonusVantagem > 0) {
    partesDetalhe.push(`Vantagem (+${bonusVantagem})`);
  }
  if (ndAlvo !== null) {
    partesDetalhe.push(sucessoNd ? `Sucesso (ND ${ndAlvo})` : `Falha (ND ${ndAlvo})`);
  }
  if (statusCritico) {
    partesDetalhe.push(statusCritico);
  }
  if (efeito) {
    partesDetalhe.push(`Efeito: ${efeito}`);
  } else if (condicao) {
    partesDetalhe.push(`Condição: ${condicao}`);
  }
  if (infoEstudo) {
    partesDetalhe.push(infoEstudo.descricaoPatamar);
    if (infoEstudo.ativouLampejo) {
      partesDetalhe.push(`💡 Lampejo de Saber: até ${infoEstudo.perguntasPermitidas} pergunta(s) ao mestre!`);
    }
    if (infoEstudo.temVarreduraRapida) {
      partesDetalhe.push('👁️ Varredura Rápida (todos os inimigos)');
    }
  }

  const detalhes = partesDetalhe.join(' • ');
  const nomeAutor = combatente?.nome || perfil?.origemNome || 'Combatente';

  return {
    autorNome: nomeAutor,
    categoria,
    titulo,
    infoEstudo: infoEstudo || null,
    attr1: k1,
    attr2: k2,
    sigla1,
    sigla2,
    faces1,
    faces2,
    d1,
    d2,
    modificadorTotal,
    bonusGuarda,
    total,
    hr,
    calcularDano,
    bonusDanoEfetivo,
    danoTotal,
    danoGolpe1,
    danoGolpe2,
    isDuasArmas,
    tipoDano,
    custoPm: Number(custoPm) || 0,
    condicao: condicao || '',
    efeito: efeito || '',
    isCritico,
    isFumble,
    statusCritico,
    sucessoNd,
    formulaDados,
    detalhes,
    logEntry: {
      combatente_id: combatente?.id || null,
      autor_nome: nomeAutor,
      autor_tipo: combatente?.tipo || 'heroi',
      acao_codigo: 'ROLAGEM_DADOS',
      acao_titulo: `🎲 ${titulo}`,
      detalhes,
      metadata: {
        rolagem: {
          categoria,
          titulo,
          sigla1,
          faces1,
          d1,
          sigla2,
          faces2,
          d2,
          modificadorTotal,
          total,
          hr,
          calcularDano,
          danoTotal,
          tipoDano,
          isCritico,
          isFumble,
          statusCritico
        }
      }
    }
  };
}

