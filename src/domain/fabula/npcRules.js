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

  return {
    ...npc,
    nivel,
    atributos,
    rank,
    quantidade_soldados: qtdSoldados,
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

