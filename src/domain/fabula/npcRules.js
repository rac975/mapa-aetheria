/**
 * Regras puras de Fabula Ultima para NPCs, Adversários e Companheiros Fiéis.
 * Isola todas as fórmulas matemáticas, atributos, patentes (Soldado, Elite, Campeão)
 * e escalonamento sem dependências de React ou Supabase.
 */

/**
 * Converte valor de dado textual ou numérico (ex: 'd8', 'D10', 8) em número inteiro.
 * @param {string|number} dado 
 * @returns {number}
 */
export function dadoParaNumero(dado) {
  if (!dado) return 8;
  if (typeof dado === 'number') return dado;
  return parseInt(String(dado).replace(/d/i, ''), 10) || 8;
}

/**
 * Calcula o PV máximo de acordo com o nível, Vigor, rank/patente e bônus.
 * - Soldado: (2 * nivel) + (5 * vig)
 * - Elite: PV base * 2
 * - Campeão: PV base * quantidade_soldados
 * - Companheiro Fiel: (NP * vig) + floor(nivelPersonagem / 2)
 * 
 * @param {Object} params
 * @param {number} params.nivel
 * @param {number} params.vigNum
 * @param {string} [params.rank='soldado'] - 'soldado' | 'elite' | 'campeao'
 * @param {number} [params.quantidadeSoldados=2]
 * @param {boolean} [params.isCompanheiro=false]
 * @param {number} [params.nivelNP=1]
 * @param {number} [params.nivelPersonagem=1]
 * @param {number} [params.bonusPoderes=0]
 * @returns {number}
 */
export function calcularPvMaxNpc({
  nivel = 5,
  vigNum = 8,
  rank = 'soldado',
  quantidadeSoldados = 2,
  isCompanheiro = false,
  nivelNP = 1,
  nivelPersonagem = 1,
  bonusPoderes = 0
}) {
  let pvBase = 0;

  if (isCompanheiro) {
    const np = nivelNP || 1;
    pvBase = (np * vigNum) + Math.floor((nivelPersonagem || 1) / 2);
  } else {
    pvBase = (2 * nivel) + (5 * vigNum);

    if (rank === 'elite') {
      pvBase = pvBase * 2;
    } else if (rank === 'campeao') {
      pvBase = pvBase * (Number(quantidadeSoldados) || 2);
    }
  }

  return Math.max(0, pvBase + (Number(bonusPoderes) || 0));
}

/**
 * Calcula o PM máximo de acordo com o nível, Vontade e rank/patente.
 * - Soldado / Elite: nivel + (5 * von)
 * - Campeão: PM base * 2
 * - Companheiro Fiel: Fixo em 20
 * 
 * @param {Object} params
 * @param {number} params.nivel
 * @param {number} params.vonNum
 * @param {string} [params.rank='soldado']
 * @param {boolean} [params.isCompanheiro=false]
 * @returns {number}
 */
export function calcularPmMaxNpc({
  nivel = 5,
  vonNum = 8,
  rank = 'soldado',
  isCompanheiro = false
}) {
  if (isCompanheiro) {
    return 20;
  }

  let pmBase = nivel + (5 * vonNum);

  if (rank === 'campeao') {
    pmBase = pmBase * 2;
  }

  return Math.max(0, pmBase);
}

/**
 * Calcula a Iniciativa de um NPC.
 * - Soldado: floor((des + ast) / 2)
 * - Elite: floor((des + ast) / 2) + 2
 * - Campeão: floor((des + ast) / 2) + quantidade_soldados
 * - Companheiro Fiel: 0 (age no turno do jogador)
 * 
 * @param {Object} params
 * @param {number} params.desNum
 * @param {number} params.astNum
 * @param {string} [params.rank='soldado']
 * @param {number} [params.quantidadeSoldados=2]
 * @param {boolean} [params.isCompanheiro=false]
 * @param {number} [params.bonusPoderes=0]
 * @returns {number}
 */
export function calcularIniciativaNpc({
  desNum = 8,
  astNum = 8,
  rank = 'soldado',
  quantidadeSoldados = 2,
  isCompanheiro = false,
  bonusPoderes = 0
}) {
  if (isCompanheiro) {
    return 0;
  }

  let base = Math.floor((desNum + astNum) / 2);

  if (rank === 'elite') {
    base += 2;
  } else if (rank === 'campeao') {
    base += (Number(quantidadeSoldados) || 2);
  }

  return Math.max(0, base + (Number(bonusPoderes) || 0));
}

/**
 * Calcula a Defesa básica do NPC.
 * @param {number} desNum 
 * @returns {number}
 */
export function calcularDefesaNpc(desNum = 8) {
  return Math.max(0, desNum);
}

/**
 * Calcula a Defesa Mágica básica do NPC.
 * @param {number} astNum 
 * @returns {number}
 */
export function calcularDefesaMagicaNpc(astNum = 8) {
  return Math.max(0, astNum);
}

/**
 * Extrai bônus estatísticos concedidos por poderes especiais do NPC.
 * @param {Array<Object>} poderes 
 * @returns {{bonusPv: number, bonusIniciativa: number}}
 */
export function extrairBonusPoderes(poderes = []) {
  let bonusPv = 0;
  let bonusIniciativa = 0;

  poderes.forEach((p) => {
    if (p.tipo_mecanica === 'stat_bonus' && p.config_mecanica) {
      if (p.config_mecanica.pv_max) {
        bonusPv += Number(p.config_mecanica.pv_max);
      }
      if (p.config_mecanica.iniciativa) {
        bonusIniciativa += Number(p.config_mecanica.iniciativa);
      }
    }
  });

  return { bonusPv, bonusIniciativa };
}

/**
 * Calcula o total de poderes permitidos pela espécie e pelas vulnerabilidades extras adquiridas.
 * Cada vulnerabilidade extra acima do padrão da espécie concede +2 poderes.
 * 
 * @param {Object} afinidadesAtuais 
 * @param {Object} afinidadesPadraoEspecie 
 * @param {number} poderesIniciaisEspecie 
 * @returns {{extrasPorVulnerabilidade: number, totalPermitido: number}}
 */
export function calcularPoderesPermitidos(
  afinidadesAtuais = {},
  afinidadesPadraoEspecie = {},
  poderesIniciaisEspecie = 2
) {
  let contadorExtras = 0;

  Object.keys(afinidadesAtuais).forEach((tipoDano) => {
    const valorAtual = afinidadesAtuais[tipoDano];
    const valorPadrao = afinidadesPadraoEspecie[tipoDano] || '';

    if (valorAtual === 'vul' && valorPadrao !== 'vul') {
      contadorExtras += 2;
    }
  });

  return {
    extrasPorVulnerabilidade: contadorExtras,
    totalPermitido: (Number(poderesIniciaisEspecie) || 2) + contadorExtras
  };
}

/**
 * Recalcula o objeto completo de estatísticas do NPC aplicando as regras de Fabula Ultima.
 * 
 * @param {Object} params
 * @param {Object} params.npc - Estado base do NPC
 * @param {Object} [params.novosAtributos] - Novos atributos (se alterados)
 * @param {number} [params.novoNivel] - Novo nível (se alterado)
 * @param {string} [params.novoRank] - Novo rank (se alterado)
 * @param {number} [params.novaQtdSoldados] - Nova quantidade de soldados (se alterado)
 * @param {boolean} [params.isCompanheiro=false]
 * @param {number} [params.nivelNP=1]
 * @param {number} [params.nivelPersonagem=1]
 * @returns {Object} Objeto atualizado do NPC com stats recalculados
 */
export function recalcularEstatisticasNpc({
  npc = {},
  novosAtributos,
  novoNivel,
  novoRank,
  novaQtdSoldados,
  isCompanheiro = false,
  nivelNP = 1,
  nivelPersonagem = 1
}) {
  const nivel = isCompanheiro ? 5 : (novoNivel !== undefined ? novoNivel : (npc.nivel || 5));
  const atributos = novosAtributos || npc.atributos || { des: 'd8', ast: 'd6', vig: 'd10', von: 'd8' };
  const rank = isCompanheiro ? 'soldado' : (novoRank !== undefined ? novoRank : (npc.rank || 'soldado'));
  const qtdSoldados = novaQtdSoldados !== undefined ? novaQtdSoldados : (npc.quantidade_soldados || 2);

  const desNum = dadoParaNumero(atributos.des);
  const astNum = dadoParaNumero(atributos.ast);
  const vigNum = dadoParaNumero(atributos.vig);
  const vonNum = dadoParaNumero(atributos.von);

  const { bonusPv, bonusIniciativa } = extrairBonusPoderes(npc.poderes || []);

  const pvCalculado = calcularPvMaxNpc({
    nivel,
    vigNum,
    rank,
    quantidadeSoldados: qtdSoldados,
    isCompanheiro,
    nivelNP,
    nivelPersonagem,
    bonusPoderes: bonusPv
  });

  const pmCalculado = calcularPmMaxNpc({
    nivel,
    vonNum,
    rank,
    isCompanheiro
  });

  const iniciativaCalculada = calcularIniciativaNpc({
    desNum,
    astNum,
    rank,
    quantidadeSoldados: qtdSoldados,
    isCompanheiro,
    bonusPoderes: bonusIniciativa
  });

  const defesaCalculada = calcularDefesaNpc(desNum);
  const defMagicaCalculada = calcularDefesaMagicaNpc(astNum);

  const pvAtualAtualizado = npc.pv_atual !== undefined
    ? clampRecursoNpc(npc.pv_atual, pvCalculado, 0)
    : (npc.hp_atual !== undefined ? clampRecursoNpc(npc.hp_atual, pvCalculado, 0) : pvCalculado);

  const pmAtualAtualizado = npc.pm_atual !== undefined
    ? clampRecursoNpc(npc.pm_atual, pmCalculado, 0)
    : (npc.mp_atual !== undefined ? clampRecursoNpc(npc.mp_atual, pmCalculado, 0) : pmCalculado);

  const tipoVilaoAtual = isCompanheiro ? 'padrao' : normalizarTipoVilao(npc.tipo_vilao || 'padrao');
  const acoesSugeridas = calcularAcoesPorTurnoNpc({
    rank,
    tipoVilao: tipoVilaoAtual,
    quantidadeSoldados: qtdSoldados,
    isCompanheiro
  });
  const acoesPorTurnoAtual = isCompanheiro
    ? 1
    : Math.max(acoesSugeridas, Number(npc.acoes_por_turno) || 1);

  return {
    ...npc,
    nivel,
    atributos,
    rank,
    quantidade_soldados: qtdSoldados,
    tipo_vilao: tipoVilaoAtual,
    pontos_vilao: Math.max(0, Number(npc.pontos_vilao) || 0),
    acoes_por_turno: acoesPorTurnoAtual,
    fases_chefao: Array.isArray(npc.fases_chefao) ? npc.fases_chefao : [],
    fase_atual: Math.max(1, Number(npc.fase_atual) || 1),
    pv_max: pvCalculado,
    pm_max: pmCalculado,
    hp_max: pvCalculado,
    mp_max: pmCalculado,
    maxHp: pvCalculado,
    maxMp: pmCalculado,
    pv_atual: pvAtualAtualizado,
    pm_atual: pmAtualAtualizado,
    hp_atual: pvAtualAtualizado,
    mp_atual: pmAtualAtualizado,
    iniciativa: iniciativaCalculada,
    defesa: defesaCalculada,
    defesa_magica: defMagicaCalculada
  };
}

/**
 * Verifica se um combatente é do tipo NPC / Inimigo.
 * @param {Object} combatente
 * @returns {boolean}
 */
export function isNpcCombatente(combatente) {
  if (!combatente) return false;
  const tipoNorm = String(combatente.tipo || '').toLowerCase().trim();
  return tipoNorm !== 'heroi' && tipoNorm !== 'jogador' && tipoNorm !== 'player';
}

/**
 * Extrai o limite máximo de PV de um combatente (NPC ou Herói),
 * suportando variações de nomenclatura (hp_max, maxHp, pv_max).
 * @param {Object} combatente
 * @returns {number}
 */
export function extrairHpMax(combatente) {
  if (!combatente) return 0;
  return Math.max(0, Number(combatente.hp_max ?? combatente.maxHp ?? combatente.pv_max) || 0);
}

/**
 * Extrai o limite máximo de PM de um combatente (NPC ou Herói),
 * suportando variações de nomenclatura (mp_max, maxMp, pm_max).
 * @param {Object} combatente
 * @returns {number}
 */
export function extrairMpMax(combatente) {
  if (!combatente) return 0;
  return Math.max(0, Number(combatente.mp_max ?? combatente.maxMp ?? combatente.pm_max) || 0);
}

/**
 * Função de clamping restritivo para recursos (PV e PM) de NPCs.
 * Garante que o valor final nunca ultrapasse o limite máximo (maxHp / maxMp)
 * e nem fique abaixo de 0.
 *
 * @param {number} valor - Valor numérico a ser restringido
 * @param {number} limite1 - Teto máximo permitido (ou limite)
 * @param {number} [limite2=0] - Limite inferior (padrão: 0)
 * @returns {number} Valor restrito no intervalo [minimo, maximo]
 */
export function clampRecursoNpc(valor, limite1, limite2 = 0) {
  const n1 = Math.max(0, Number(limite1) || 0);
  const n2 = Math.max(0, Number(limite2) || 0);
  const min = Math.min(n1, n2);
  const max = Math.max(n1, n2);
  const v = Number(valor) || 0;
  return Math.min(Math.max(v, min), max);
}

/**
 * Aplica uma alteração direta (delta) a um recurso de NPC (PV ou PM),
 * aplicando a função de clamping restritivo [0, maximo].
 *
 * @param {number} valorAtual - Valor atual do recurso
 * @param {number} delta - Variação (+/-) a ser aplicada
 * @param {number} maximo - Teto máximo (maxHp ou maxMp)
 * @param {number} [minimo=0] - Limite inferior (padrão: 0)
 * @returns {number} Novo valor com clamping restritivo
 */
export function ajustarRecursoNpc(valorAtual, delta, maximo, minimo = 0) {
  const novo = (Number(valorAtual) || 0) + (Number(delta) || 0);
  return clampRecursoNpc(novo, maximo, minimo);
}

// =============================================================================
// MECÂNICAS DE VILÃO, MULTI-AÇÕES E FASES DE CHEFE (FABULA ULTIMA)
// =============================================================================

export const TIPOS_VILAO = {
  padrao: {
    id: 'padrao',
    label: 'Padrão (Sem Vilania)',
    badgeLabel: 'PADRÃO',
    pontosVilaoPadrao: 0,
    acoesMinimas: 1,
    rankSugerido: null,
    descricao: 'Adversário comum da cena sem reserva de Pontos de Vilão.'
  },
  elite: {
    id: 'elite',
    label: 'Vilão Elite (Menor)',
    badgeLabel: 'VILÃO ELITE',
    pontosVilaoPadrao: 5,
    acoesMinimas: 2,
    rankSugerido: 'elite',
    descricao: 'Ameaça recorrente ou sub-chefe (5 Pontos de Vilão, 2 Ações/Rodada).'
  },
  campeao: {
    id: 'campeao',
    label: 'Vilão Campeão (Maior)',
    badgeLabel: 'VILÃO CAMPEÃO',
    pontosVilaoPadrao: 10,
    acoesMinimas: 2,
    rankSugerido: 'campeao',
    descricao: 'Antagonista principal de arco (10 Pontos de Vilão, Multi-Ações por soldados).'
  },
  soberano: {
    id: 'soberano',
    label: 'Vilão Soberano (Supremo)',
    badgeLabel: 'SOBERANO',
    pontosVilaoPadrao: 15,
    acoesMinimas: 3,
    rankSugerido: 'campeao',
    descricao: 'Chefe final ou entidade cataclísmica (15 Pontos de Vilão, múltiplas fases e turnos).'
  }
};

export const ACOES_PONTOS_VILAO = {
  INVOCAR_TRACO: {
    codigo: 'INVOCAR_TRACO',
    titulo: 'Invocar Traço (Rerolar)',
    custo: 1,
    recuperaPm: 0,
    limpaCondicoes: false,
    descricao: 'Gasta 1 Ponto de Vilão para invocar um Traço e rolar novamente um ou ambos os dados de um teste.'
  },
  RECUPERACAO_EPICA: {
    codigo: 'RECUPERACAO_EPICA',
    titulo: 'Recuperação de Vilão',
    custo: 1,
    recuperaPm: 50,
    limpaCondicoes: true,
    descricao: 'Gasta 1 Ponto de Vilão para curar todas as condições negativas e recuperar 50 PM imediatamente.'
  },
  PODER_CHEFAO: {
    codigo: 'PODER_CHEFAO',
    titulo: 'Reação / Ataque Supremo',
    custo: 2,
    recuperaPm: 0,
    limpaCondicoes: false,
    descricao: 'Gasta 2 Pontos de Vilão para desencadear uma habilidade exclusiva de chefe ou reação fora de turno.'
  },
  FUGA_DRAMATICA: {
    codigo: 'FUGA_DRAMATICA',
    titulo: 'Fuga Dramática',
    custo: 1,
    recuperaPm: 0,
    limpaCondicoes: false,
    descricao: 'Gasta 1 Ponto de Vilão para escapar da cena em segurança (mesmo a 0 PV), deixando uma complicação narrativa.'
  }
};

/**
 * Normaliza a string de tipo de vilão para uma das chaves canônicas.
 * @param {string} tipoVilao
 * @returns {'padrao' | 'elite' | 'campeao' | 'soberano'}
 */
export function normalizarTipoVilao(tipoVilao) {
  const norm = String(tipoVilao || '').toLowerCase().trim();
  if (norm === 'elite' || norm === 'menor') return 'elite';
  if (norm === 'campeao' || norm === 'maior') return 'campeao';
  if (norm === 'soberano' || norm === 'supremo') return 'soberano';
  return 'padrao';
}

/**
 * Retorna a reserva inicial recomendada de Pontos de Vilão conforme a escala de vilania.
 * @param {string} tipoVilao
 * @returns {number}
 */
export function calcularPontosVilaoPadrao(tipoVilao = 'padrao') {
  const chave = normalizarTipoVilao(tipoVilao);
  return TIPOS_VILAO[chave]?.pontosVilaoPadrao ?? 0;
}

/**
 * Calcula a quantidade de ações por turno/rodada (Multi-Ações) de um NPC ou Vilão.
 * @param {Object} params
 * @param {string} [params.rank='soldado']
 * @param {string} [params.tipoVilao='padrao']
 * @param {number} [params.quantidadeSoldados=2]
 * @param {boolean} [params.isCompanheiro=false]
 * @returns {number}
 */
export function calcularAcoesPorTurnoNpc({
  rank = 'soldado',
  tipoVilao = 'padrao',
  quantidadeSoldados = 2,
  isCompanheiro = false
} = {}) {
  if (isCompanheiro) return 1;

  const rankNorm = String(rank || 'soldado').toLowerCase().trim();
  const vilaoNorm = normalizarTipoVilao(tipoVilao);
  const soldados = Math.max(2, Number(quantidadeSoldados) || 2);

  let acoesRank = 1;
  if (rankNorm === 'elite') acoesRank = 2;
  else if (rankNorm === 'campeao') acoesRank = soldados;

  let acoesVilao = 1;
  if (vilaoNorm === 'elite') acoesVilao = 2;
  else if (vilaoNorm === 'campeao') acoesVilao = soldados;
  else if (vilaoNorm === 'soberano') acoesVilao = Math.max(3, soldados);

  return Math.max(acoesRank, acoesVilao);
}

/**
 * Verifica se um NPC ou combatente possui mecânicas ativas de Vilão ou Chefe.
 * @param {Object} entidade
 * @returns {boolean}
 */
export function isVilaoOuChefe(entidade = {}) {
  if (!entidade) return false;
  const tipoVilao = normalizarTipoVilao(entidade.tipo_vilao);
  const pvVilao = Number(entidade.pontos_vilao ?? entidade.pontos_ultima) || 0;
  const fases = Array.isArray(entidade.fases_chefao) ? entidade.fases_chefao : [];
  const acoes = Number(entidade.acoes_por_turno) || 1;
  const rank = String(entidade.rank || '').toLowerCase();

  return (
    tipoVilao !== 'padrao' ||
    pvVilao > 0 ||
    fases.length > 0 ||
    acoes > 1 ||
    rank === 'elite' ||
    rank === 'campeao'
  );
}

/**
 * Cria um objeto de Fase de Chefão estruturado com valores padrão.
 * @param {number} [numero=1]
 * @param {Object} [npcBase={}]
 * @returns {Object}
 */
export function criarFaseChefaoPadrao(numero = 1, npcBase = {}) {
  const num = Math.max(1, Number(numero) || 1);
  const pvBase = Math.max(10, Number(npcBase.pv_max ?? npcBase.hp_max) || 100);
  const pmBase = Math.max(0, Number(npcBase.pm_max ?? npcBase.mp_max) || 50);
  const acoesBase = Math.max(1, Number(npcBase.acoes_por_turno) || (num > 1 ? 3 : 2));

  return {
    numero: num,
    nome: num === 1 ? 'Fase 1: Forma Inicial' : `Fase ${num}: Forma Desperta`,
    pv_max: pvBase,
    pm_max: pmBase,
    acoes_por_turno: acoesBase,
    gatilho: num === 1 ? 'inicio' : 'hp_zero',
    recuperar_pm: num === 1 ? 0 : 50,
    limpar_condicoes: true,
    efeito_transicao: num === 1
      ? 'Postura inicial do chefe no início do conflito.'
      : 'Ao chegar a 0 PV na fase anterior, desperta sua nova forma, limpa todas as condições negativas e recupera 50 PM!',
    habilidades_fase: ''
  };
}

/**
 * Avalia se o gatilho de transição para a próxima fase do chefe está ativo
 * (ex: quando o HP chega a 0 na Fase 1, dispara a transição para a Fase 2).
 * @param {Object} params
 * @param {number} params.hpAtual
 * @param {number} params.hpMax
 * @param {number} [params.faseAtual=1]
 * @param {Array<Object>} [params.fasesChefao=[]]
 * @returns {{
 *   temFases: boolean,
 *   totalFases: number,
 *   faseAtual: number,
 *   faseAtualObj: Object|null,
 *   proximaFaseObj: Object|null,
 *   gatilhoAtivo: boolean,
 *   motivo: string|null
 * }}
 */
export function verificarGatilhoTransicaoFase({
  hpAtual = 0,
  hpMax = 1,
  faseAtual = 1,
  fasesChefao = []
} = {}) {
  const lista = Array.isArray(fasesChefao) ? fasesChefao : [];
  if (lista.length === 0) {
    return {
      temFases: false,
      totalFases: 0,
      faseAtual: 1,
      faseAtualObj: null,
      proximaFaseObj: null,
      gatilhoAtivo: false,
      motivo: null
    };
  }

  const numAtual = Math.max(1, Number(faseAtual) || 1);
  const idxAtual = lista.findIndex((f, i) => (Number(f.numero) || (i + 1)) === numAtual);
  const indexEfetivo = idxAtual >= 0 ? idxAtual : Math.min(lista.length - 1, numAtual - 1);

  const faseAtualObj = lista[indexEfetivo] || null;
  const proximaFaseObj = indexEfetivo + 1 < lista.length ? lista[indexEfetivo + 1] : null;

  if (!proximaFaseObj) {
    return {
      temFases: true,
      totalFases: lista.length,
      faseAtual: numAtual,
      faseAtualObj,
      proximaFaseObj: null,
      gatilhoAtivo: false,
      motivo: null
    };
  }

  const hp = Number(hpAtual) || 0;
  const max = Math.max(1, Number(hpMax) || 1);
  const gatilhoTipo = String(proximaFaseObj.gatilho || 'hp_zero').toLowerCase();

  let gatilhoAtivo = false;
  let motivo = null;

  if (gatilhoTipo === 'hp_zero' && hp <= 0) {
    gatilhoAtivo = true;
    motivo = `0 PV atingido na ${faseAtualObj?.nome || `Fase ${numAtual}`} — pronto para despertar ${proximaFaseObj.nome || `Fase ${numAtual + 1}`}!`;
  } else if (gatilhoTipo === 'crise' && hp > 0 && hp <= Math.floor(max / 2)) {
    gatilhoAtivo = true;
    motivo = `Crise atingida na ${faseAtualObj?.nome || `Fase ${numAtual}`} — pronto para despertar ${proximaFaseObj.nome || `Fase ${numAtual + 1}`}!`;
  } else if (hp <= 0) {
    gatilhoAtivo = true;
    motivo = `0 PV atingido — transição disponível para ${proximaFaseObj.nome || `Fase ${numAtual + 1}`}!`;
  }

  return {
    temFases: true,
    totalFases: lista.length,
    faseAtual: numAtual,
    faseAtualObj,
    proximaFaseObj,
    gatilhoAtivo,
    motivo
  };
}

/**
 * Executa a transição de fase de um Chefão (seja um NPC de npcs_mestre ou combatente de iniciativa_combate),
 * atualizando PV máximo/atual, PM, ações por turno, limpando condições se configurado e gerando resumo tático.
 * @param {Object} entidade
 * @param {number|null} [numeroFaseDestino=null]
 * @returns {{ valido: boolean, erro?: string, entidadeAtualizada: Object, faseAtivada: Object|null, resumo: string }}
 */
export function executarTransicaoFaseChefao(entidade = {}, numeroFaseDestino = null) {
  const fases = Array.isArray(entidade?.fases_chefao) ? entidade.fases_chefao : [];
  if (fases.length === 0) {
    return {
      valido: false,
      erro: 'Este NPC não possui fases de chefão cadastradas.',
      entidadeAtualizada: entidade,
      faseAtivada: null,
      resumo: ''
    };
  }

  const faseAtualNum = Math.max(1, Number(entidade.fase_atual) || 1);
  const alvoNum = numeroFaseDestino !== null && numeroFaseDestino !== undefined
    ? Number(numeroFaseDestino)
    : faseAtualNum + 1;

  const idxAlvo = fases.findIndex((f, i) => (Number(f.numero) || (i + 1)) === alvoNum);
  const faseDestino = idxAlvo >= 0 ? fases[idxAlvo] : fases[alvoNum - 1];

  if (!faseDestino) {
    return {
      valido: false,
      erro: `Fase ${alvoNum} não encontrada para este chefe.`,
      entidadeAtualizada: entidade,
      faseAtivada: null,
      resumo: ''
    };
  }

  const numeroFinal = Number(faseDestino.numero) || alvoNum;
  const novoPvMax = Math.max(1, Number(faseDestino.pv_max) || extrairHpMax(entidade) || 100);
  const novoPmMax = Math.max(0, Number(faseDestino.pm_max) || extrairMpMax(entidade) || 50);
  const pmAtualBase = Number(entidade.pm_atual ?? entidade.mp_atual) || 0;
  const recupPm = Math.max(0, Number(faseDestino.recuperar_pm) || 0);
  const novoPmAtual = clampRecursoNpc(pmAtualBase + recupPm, novoPmMax, 0);
  const novasAcoesPorTurno = Math.max(1, Number(faseDestino.acoes_por_turno) || Number(entidade.acoes_por_turno) || 2);
  const deveLimparCondicoes = faseDestino.limpar_condicoes !== false;

  const modsAtuais = entidade.modificadores && typeof entidade.modificadores === 'object'
    ? entidade.modificadores
    : {};

  const entidadeAtualizada = {
    ...entidade,
    fase_atual: numeroFinal,
    acoes_por_turno: novasAcoesPorTurno,
    pv_max: novoPvMax,
    pv_atual: novoPvMax,
    hp_max: novoPvMax,
    hp_atual: novoPvMax,
    pm_max: novoPmMax,
    pm_atual: novoPmAtual,
    mp_max: novoPmMax,
    mp_atual: novoPmAtual,
    dano_acumulado: 0,
    agiu: false,
    condicoes: deveLimparCondicoes ? [] : (entidade.condicoes || []),
    modificadores: {
      ...modsAtuais,
      acoes_realizadas_rodada: 0
    }
  };

  const partesResumo = [
    `Transição para ${faseDestino.nome || `Fase ${numeroFinal}`}`,
    `PV restaurado para ${novoPvMax}/${novoPvMax}`,
    `${novasAcoesPorTurno} ação(ões)/rodada`
  ];
  if (recupPm > 0) partesResumo.push(`+${recupPm} PM`);
  if (deveLimparCondicoes) partesResumo.push('Condições purificadas');
  if (faseDestino.efeito_transicao) partesResumo.push(faseDestino.efeito_transicao);

  return {
    valido: true,
    entidadeAtualizada,
    faseAtivada: faseDestino,
    resumo: partesResumo.join(' • ')
  };
}

/**
 * Gasta Pontos de Vilão de um NPC ou combatente para ativar uma habilidade de vilão,
 * aplicando efeitos automáticos (como +50 PM e limpeza de condições na Recuperação de Vilão).
 * @param {Object} entidade
 * @param {Object} [opcoes]
 * @param {string} [opcoes.codigoAcao='INVOCAR_TRACO']
 * @param {number|null} [opcoes.custoCustom=null]
 * @returns {{ valido: boolean, erro?: string, entidadeAtualizada: Object, acaoInfo: Object, custoAplicado: number, resumo: string }}
 */
export function consumirPontoVilaoNpc(entidade = {}, { codigoAcao = 'INVOCAR_TRACO', custoCustom = null } = {}) {
  const acaoInfo = ACOES_PONTOS_VILAO[codigoAcao] || ACOES_PONTOS_VILAO.INVOCAR_TRACO;
  const custo = custoCustom !== null && custoCustom !== undefined
    ? Math.max(1, Number(custoCustom) || 1)
    : acaoInfo.custo;

  const pontosAtuais = Math.max(0, Number(entidade.pontos_vilao ?? entidade.pontos_ultima) || 0);
  if (pontosAtuais < custo) {
    return {
      valido: false,
      erro: `${entidade.nome || 'O Vilão'} não possui Pontos de Vilão suficientes (requer ${custo}, possui ${pontosAtuais}).`,
      entidadeAtualizada: entidade,
      acaoInfo,
      custoAplicado: 0,
      resumo: ''
    };
  }

  const novosPontos = Math.max(0, pontosAtuais - custo);
  const maxMp = extrairMpMax(entidade);
  const mpAtual = Number(
    entidade.tipo
      ? (entidade.mp_atual ?? entidade.pm_atual)
      : (entidade.pm_atual ?? entidade.mp_atual)
  ) || 0;
  const novoMp = acaoInfo.recuperaPm > 0
    ? clampRecursoNpc(mpAtual + acaoInfo.recuperaPm, maxMp > 0 ? maxMp : 999, 0)
    : mpAtual;

  const entidadeAtualizada = {
    ...entidade,
    pontos_vilao: novosPontos,
    pontos_ultima: novosPontos
  };

  if (entidade.pm_atual !== undefined) entidadeAtualizada.pm_atual = novoMp;
  if (entidade.mp_atual !== undefined) entidadeAtualizada.mp_atual = novoMp;
  if (acaoInfo.limpaCondicoes && Array.isArray(entidade.condicoes)) {
    entidadeAtualizada.condicoes = [];
  }

  const partes = [`Gastou ${custo} PVilão (${novosPontos} restante(s))`, acaoInfo.titulo];
  if (acaoInfo.recuperaPm > 0) partes.push(`Recuperou +${acaoInfo.recuperaPm} PM`);
  if (acaoInfo.limpaCondicoes) partes.push('Removeu todas as condições negativas');

  return {
    valido: true,
    entidadeAtualizada,
    acaoInfo,
    custoAplicado: custo,
    resumo: partes.join(' • ')
  };
}


