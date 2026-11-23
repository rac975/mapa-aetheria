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

  const resultado = {
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
    pv_atual: pvAtualAtualizado,
    pm_atual: pmAtualAtualizado,
    iniciativa: iniciativaCalculada,
    defesa: defesaCalculada,
    defesa_magica: defMagicaCalculada
  };

  return normalizarNpcLeitura(resultado);
}

/**
 * Atualiza a lista de poderes de um NPC ou Companheiro ajustando PV máximo e PV atual
 * proporcionalmente a qualquer bônus conferido (como o poder "Mais Pontos de Vida").
 *
 * @param {Object} params
 * @param {Object} params.npc
 * @param {Array<Object>} params.novosPoderes
 * @param {boolean} [params.isCompanheiro=false]
 * @param {number} [params.nivelNP=1]
 * @param {number} [params.nivelPersonagem=1]
 * @returns {Object}
 */
export function ajustarPoderesNpc({
  npc = {},
  novosPoderes = [],
  isCompanheiro = false,
  nivelNP = 1,
  nivelPersonagem = 1
} = {}) {
  const rec = recalcularEstatisticasNpc({ npc: { ...npc, poderes: novosPoderes }, isCompanheiro, nivelNP, nivelPersonagem });
  const bonusAntigo = extrairBonusPoderes(npc.poderes || []).bonusPv;
  const bonusNovo = extrairBonusPoderes(novosPoderes).bonusPv;
  const delta = bonusNovo - bonusAntigo;
  const basePvMax = npc.pv_max !== undefined ? Number(npc.pv_max) : rec.pv_max;
  const novoPvMax = Math.max(1, basePvMax + delta);
  const basePvAtual = npc.pv_atual !== undefined ? Number(npc.pv_atual) : novoPvMax;
  const novoPvAtual = delta > 0 ? basePvAtual + delta : Math.min(basePvAtual, novoPvMax);
  return {
    ...rec,
    poderes: novosPoderes,
    pv_max: novoPvMax,
    pv_atual: clampRecursoNpc(novoPvAtual, novoPvMax, 0)
  };
}

/**
 * Conjunto oficial de colunas existentes na tabela public.npcs_mestre.
 * Impede que campos espúrios (como hp_atual, hp_max, maxHp, stats, etc.)
 * sejam passados nas operações de INSERT ou UPDATE/PATCH.
 */
export const COLUNAS_VALIDAS_NPCS_MESTRE = new Set([
  'id',
  'user_id',
  'nome',
  'especie',
  'nivel',
  'rank',
  'pv_max',
  'pv_atual',
  'pm_max',
  'pm_atual',
  'defesa',
  'defesa_magica',
  'iniciativa',
  'atributos',
  'afinidades',
  'tracos',
  'ataques_basicos',
  'poderes',
  'feiticos',
  'created_at',
  'tipo_registro',
  'personagem_id',
  'quantidade_soldados',
  'tipo_vilao',
  'pontos_vilao',
  'fases_chefao',
  'acoes_por_turno',
  'fase_atual',
  'voador'
]);

/**
 * Normaliza um objeto de NPC vindo do banco ou de estado legado.
 * Mapeia pv_max, pv_atual, pm_max e pm_atual garantindo retrocompatibilidade
 * caso venham sob outras nomenclaturas (hp_atual, hp_max, maxHp, maxMp) ou dentro de stats.
 * Adiciona getters não-enumeráveis para que acessos legados em memória continuem funcionando
 * sem poluir o objeto com chaves enumeráveis nem reenviá-las ao banco.
 *
 * @param {Object} npc
 * @returns {Object} Objeto NPC normalizado
 */
export function normalizarNpcLeitura(npc) {
  if (!npc || typeof npc !== 'object') return npc;

  const stats = (typeof npc.stats === 'object' && npc.stats !== null) ? npc.stats : {};

  // Extração de PV Máximo
  const pvMaxBruto = npc.pv_max ?? stats.pv_max ?? npc.hp_max ?? stats.hp_max ?? npc.maxHp ?? stats.maxHp;
  const pvMax = pvMaxBruto !== undefined && pvMaxBruto !== null
    ? Math.max(0, Number(pvMaxBruto) || 0)
    : calcularPvMaxNpc({
        nivel: npc.nivel || 5,
        vigNum: dadoParaNumero(npc.atributos?.vig),
        rank: npc.rank || 'soldado',
        quantidadeSoldados: npc.quantidade_soldados || 2
      });

  // Extração de PV Atual
  const pvAtualBruto = npc.pv_atual ?? stats.pv_atual ?? npc.hp_atual ?? stats.hp_atual;
  const pvAtual = pvAtualBruto !== undefined && pvAtualBruto !== null
    ? clampRecursoNpc(Number(pvAtualBruto) || 0, pvMax, 0)
    : pvMax;

  // Extração de PM Máximo
  const pmMaxBruto = npc.pm_max ?? stats.pm_max ?? npc.mp_max ?? stats.mp_max ?? npc.maxMp ?? stats.maxMp;
  const pmMax = pmMaxBruto !== undefined && pmMaxBruto !== null
    ? Math.max(0, Number(pmMaxBruto) || 0)
    : calcularPmMaxNpc({
        nivel: npc.nivel || 5,
        vonNum: dadoParaNumero(npc.atributos?.von),
        rank: npc.rank || 'soldado'
      });

  // Extração de PM Atual
  const pmAtualBruto = npc.pm_atual ?? stats.pm_atual ?? npc.mp_atual ?? stats.mp_atual;
  const pmAtual = pmAtualBruto !== undefined && pmAtualBruto !== null
    ? clampRecursoNpc(Number(pmAtualBruto) || 0, pmMax, 0)
    : pmMax;

  // Monta objeto sem chaves legadas como propriedades enumeráveis
  const {
    hp_atual: _hpa,
    hp_max: _hpm,
    maxHp: _mxh,
    mp_atual: _mpa,
    mp_max: _mpm,
    maxMp: _mxm,
    ...resto
  } = npc;

  const normalizado = {
    ...resto,
    pv_max: pvMax,
    pv_atual: pvAtual,
    pm_max: pmMax,
    pm_atual: pmAtual
  };

  // Anexa getters não-enumeráveis para compatibilidade com código que leia npc.hp_atual / etc.
  try {
    Object.defineProperties(normalizado, {
      hp_atual: {
        get() { return this.pv_atual; },
        set(v) { this.pv_atual = v; },
        enumerable: false,
        configurable: true
      },
      hp_max: {
        get() { return this.pv_max; },
        set(v) { this.pv_max = v; },
        enumerable: false,
        configurable: true
      },
      maxHp: {
        get() { return this.pv_max; },
        set(v) { this.pv_max = v; },
        enumerable: false,
        configurable: true
      },
      mp_atual: {
        get() { return this.pm_atual; },
        set(v) { this.pm_atual = v; },
        enumerable: false,
        configurable: true
      },
      mp_max: {
        get() { return this.pm_max; },
        set(v) { this.pm_max = v; },
        enumerable: false,
        configurable: true
      },
      maxMp: {
        get() { return this.pm_max; },
        set(v) { this.pm_max = v; },
        enumerable: false,
        configurable: true
      }
    });
  } catch {
    // Se o objeto não permitir defineProperties, mantém normalizado
  }

  return normalizado;
}

/**
 * Sanitiza e filtra um payload destinado à tabela public.npcs_mestre.
 * Mapeia pv_max, pv_atual, pm_max, pm_atual a partir de quaisquer aliases ou stats,
 * e remove estritamente qualquer envio de hp_atual, hp_max, maxHp, mp_atual, mp_max, maxMp, stats ou colunas inexistentes.
 *
 * @param {Object} dados - Objeto ou atualizações parciais do NPC
 * @param {Object} [opcoes]
 * @param {boolean} [opcoes.preservarId=true] - Se false, remove o campo 'id' (útil em updates)
 * @returns {Object} Payload limpo e seguro para INSERT ou UPDATE/PATCH
 */
export function sanitizarPayloadNpcMestre(dados, { preservarId = true } = {}) {
  if (!dados || typeof dados !== 'object') return {};

  const stats = (typeof dados.stats === 'object' && dados.stats !== null) ? dados.stats : {};

  // Extrai pv_max se presente
  let pvMax;
  const pvMaxBruto = dados.pv_max ?? stats.pv_max ?? dados.hp_max ?? stats.hp_max ?? dados.maxHp ?? stats.maxHp;
  if (pvMaxBruto !== undefined && pvMaxBruto !== null) {
    pvMax = Math.max(0, Number(pvMaxBruto) || 0);
  }

  // Extrai pv_atual se presente
  let pvAtual;
  const pvAtualBruto = dados.pv_atual ?? stats.pv_atual ?? dados.hp_atual ?? stats.hp_atual;
  if (pvAtualBruto !== undefined && pvAtualBruto !== null) {
    pvAtual = Math.max(0, Number(pvAtualBruto) || 0);
    if (pvMax !== undefined) {
      pvAtual = Math.min(pvAtual, pvMax);
    }
  }

  // Extrai pm_max se presente
  let pmMax;
  const pmMaxBruto = dados.pm_max ?? stats.pm_max ?? dados.mp_max ?? stats.mp_max ?? dados.maxMp ?? stats.maxMp;
  if (pmMaxBruto !== undefined && pmMaxBruto !== null) {
    pmMax = Math.max(0, Number(pmMaxBruto) || 0);
  }

  // Extrai pm_atual se presente
  let pmAtual;
  const pmAtualBruto = dados.pm_atual ?? stats.pm_atual ?? dados.mp_atual ?? stats.mp_atual;
  if (pmAtualBruto !== undefined && pmAtualBruto !== null) {
    pmAtual = Math.max(0, Number(pmAtualBruto) || 0);
    if (pmMax !== undefined) {
      pmAtual = Math.min(pmAtual, pmMax);
    }
  }

  const payload = {};

  // Copia apenas colunas válidas
  for (const [chave, valor] of Object.entries(dados)) {
    if (!preservarId && chave === 'id') continue;
    if (COLUNAS_VALIDAS_NPCS_MESTRE.has(chave)) {
      payload[chave] = valor;
    }
  }

  // Sobrescreve com os valores normalizados de vida e mana
  if (pvMax !== undefined) payload.pv_max = pvMax;
  if (pvAtual !== undefined) payload.pv_atual = pvAtual;
  if (pmMax !== undefined) payload.pm_max = pmMax;
  if (pmAtual !== undefined) payload.pm_atual = pmAtual;

  // Remoção estrita para segurança absoluta
  delete payload.hp_atual;
  delete payload.hp_max;
  delete payload.maxHp;
  delete payload.mp_atual;
  delete payload.mp_max;
  delete payload.maxMp;
  delete payload.stats;

  return payload;
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
  return Math.max(0, Number(combatente.pv_max ?? combatente.hp_max ?? combatente.maxHp) || 0);
}

/**
 * Extrai o limite máximo de PM de um combatente (NPC ou Herói),
 * suportando variações de nomenclatura (pm_max, mp_max, maxMp).
 * @param {Object} combatente
 * @returns {number}
 */
export function extrairMpMax(combatente) {
  if (!combatente) return 0;
  return Math.max(0, Number(combatente.pm_max ?? combatente.mp_max ?? combatente.maxMp) || 0);
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

/**
 * Identifica se um NPC/inimigo é uma criatura voadora.
 * Mantém compatibilidade com a flag estruturada `voador` e com descrições/poderes de NPCs antigos.
 * @param {Object} npc
 * @returns {boolean}
 */
export function isNpcVoador(npc) {
  if (!npc) return false;
  if (npc.voador === true) return true;
  if (npc.modificadores?.voador === true) return true;

  const poderes = Array.isArray(npc.poderes) ? npc.poderes : [];
  if (poderes.some((p) => {
    const txt = String(p?.nome || p?.efeito || p).toLowerCase();
    return txt.includes('voador') || txt.includes('voo') || txt.includes('voa');
  })) return true;

  const regras = String(npc.regras_especiais || npc.descricao || '').toLowerCase();
  if (regras.includes('criatura voadora') || regras.includes('alvo voador') || regras.includes('voa') || regras.includes('voo')) return true;

  return false;
}

// =============================================================================
// ATAQUES BÁSICOS E PODERES ESPECIAIS PARAMETRIZADOS DE NPCS
// =============================================================================

export const TIPOS_DANO_NPC = [
  'Físico',
  'Fogo',
  'Gelo',
  'Raio',
  'Ar',
  'Terra',
  'Veneno',
  'Trevas',
  'Luz'
];

export const ESPECIES_ALVO_NPC = [
  'Fera',
  'Monstro',
  'Construto',
  'Morto-Vivo',
  'Demônio',
  'Elemental',
  'Humanoide',
  'Planta'
];

export const CONDICOES_APLICAVEIS_NPC = [
  'Lento',
  'Atordoado',
  'Fraco',
  'Abalado',
  'Confuso',
  'Enfurecido',
  'Envenenado'
];

export const PODERES_PADRAO_NPC = [
  {
    id: 'resistencia_dano',
    nome: 'Resistência a Dano',
    descricao: 'A criatura possui Resistência aos tipos de dano escolhidos.',
    tipo_parametro_npc: 'tipos_dano_2'
  },
  {
    id: 'imunidade_dano',
    nome: 'Imunidade a Dano',
    descricao: 'A criatura possui Imunidade ao tipo de dano escolhido.',
    tipo_parametro_npc: 'tipos_dano_1'
  },
  {
    id: 'absorcao_dano',
    nome: 'Absorção de Dano',
    descricao: 'A criatura Absorve dano do tipo escolhido.',
    tipo_parametro_npc: 'tipos_dano_1'
  },
  {
    id: 'imunidade_condicao',
    nome: 'Imunidade a Condição',
    descricao: 'A criatura é imune à condição de status escolhida.',
    tipo_parametro_npc: 'condicao'
  },
  {
    id: 'cacador_especie',
    nome: 'Predador de Espécie',
    descricao: 'Causa +5 de dano contra criaturas da espécie alvo escolhida.',
    tipo_parametro_npc: 'especie'
  },
  {
    id: 'voador_poder',
    nome: 'Voador',
    descricao: 'Não pode ser atingido por ataques corpo a corpo padrão (exceto armas que atingem voadores).',
    tipo_parametro_npc: 'detalhe'
  },
  {
    id: 'vitalidade_ampliada',
    nome: 'Vitalidade Ampliada (+10 PV)',
    descricao: 'Aumenta os Pontos de Vida máximos em +10.',
    tipo_mecanica: 'stat_bonus',
    config_mecanica: { pv_max: 10 },
    tipo_parametro_npc: 'detalhe'
  },
  {
    id: 'reacao_especial',
    nome: 'Reação / Poder Especial',
    descricao: 'Habilidade reativa, passiva ou regra especial personalizada da criatura.',
    tipo_parametro_npc: 'detalhe'
  }
];

function normalizarTextoNpc(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Identifica quais parâmetros adicionais um poder especial de NPC utiliza.
 * @param {Object} poder
 * @returns {{ requerTiposDano: boolean, qtdTiposDano: number, requerEspecieAlvo: boolean, requerCondicao: boolean }}
 */
export function identificarConfigParametroPoderNpc(poder) {
  if (!poder) {
    return { requerTiposDano: false, qtdTiposDano: 0, requerEspecieAlvo: false, requerCondicao: false };
  }

  const tipoExpl = poder.tipo_parametro_npc || '';
  if (tipoExpl === 'tipos_dano_2') {
    return { requerTiposDano: true, qtdTiposDano: 2, requerEspecieAlvo: false, requerCondicao: false };
  }
  if (tipoExpl === 'tipos_dano_1') {
    return { requerTiposDano: true, qtdTiposDano: 1, requerEspecieAlvo: false, requerCondicao: false };
  }
  if (tipoExpl === 'especie') {
    return { requerTiposDano: false, qtdTiposDano: 0, requerEspecieAlvo: true, requerCondicao: false };
  }
  if (tipoExpl === 'condicao') {
    return { requerTiposDano: false, qtdTiposDano: 0, requerEspecieAlvo: false, requerCondicao: true };
  }

  const texto = normalizarTextoNpc(`${poder.id || ''} ${poder.nome || ''} ${poder.descricao || ''}`);
  const requerTiposDano =
    texto.includes('resistencia a dano') ||
    texto.includes('imunidade a dano') ||
    texto.includes('absorcao de dano') ||
    texto.includes('tipo de dano') ||
    texto.includes('tipos de dano') ||
    (texto.includes('resistencia') && !texto.includes('magica'));
  const qtdTiposDano = requerTiposDano
    ? (texto.includes('dois') || texto.includes('duas') || texto.includes('resistencia a dano') ? 2 : 1)
    : 0;
  const requerEspecieAlvo =
    texto.includes('especie') ||
    texto.includes('cacador') ||
    texto.includes('predador') ||
    texto.includes('inimigo jurado');
  const requerCondicao =
    texto.includes('condicao') ||
    texto.includes('condicoes') ||
    texto.includes('status') ||
    texto.includes('imune a ');

  return {
    requerTiposDano,
    qtdTiposDano,
    requerEspecieAlvo,
    requerCondicao
  };
}

/**
 * Mescla o catálogo de poderes de NPC do banco com os poderes padrão parametrizados.
 * @param {Array<Object>} catalogoBanco
 * @returns {Array<Object>}
 */
export function mesclarCatalogoPoderesNpc(catalogoBanco = []) {
  const nomesBanco = new Set((catalogoBanco || []).map((p) => normalizarTextoNpc(p?.nome)));
  const idsBanco = new Set((catalogoBanco || []).map((p) => normalizarTextoNpc(p?.id)));

  const padroesFaltantes = PODERES_PADRAO_NPC.filter(
    (p) => !nomesBanco.has(normalizarTextoNpc(p.nome)) && !idsBanco.has(normalizarTextoNpc(p.id))
  );

  return [...(catalogoBanco || []), ...padroesFaltantes];
}

/**
 * Constrói um objeto estruturado de Poder Especial de NPC com parâmetros escolhidos pelo usuário.
 * @param {Object} poderBase
 * @param {Object} [params={}]
 * @returns {Object}
 */
export function construirPoderNpcEstruturado(poderBase = {}, params = {}) {
  const config = identificarConfigParametroPoderNpc(poderBase);
  const tiposDano = [];
  if (params.tipoDano1) tiposDano.push(params.tipoDano1);
  if (params.tipoDano2 && params.tipoDano2 !== params.tipoDano1 && (config.qtdTiposDano >= 2 || params.usarSegundoDano)) {
    tiposDano.push(params.tipoDano2);
  }

  const especieAlvo = (params.especieAlvo || '').trim();
  const condicaoAlvo = (params.condicaoAlvo || '').trim();
  const nomeBase = (params.nomeCustom || poderBase.nome || 'Poder Especial').trim();

  const sufixos = [];
  if (tiposDano.length > 0) sufixos.push(tiposDano.join(' / '));
  if (especieAlvo) sufixos.push(`Alvo: ${especieAlvo}`);
  if (condicaoAlvo) sufixos.push(`Condição: ${condicaoAlvo}`);

  let descricaoFinal = (params.efeitoDetalhado ?? poderBase.descricao ?? '').trim();
  if (!params.efeitoDetalhado && sufixos.length > 0) {
    descricaoFinal = `${descricaoFinal ? `${descricaoFinal} ` : ''}[${sufixos.join(' • ')}]`.trim();
  }

  return {
    ...poderBase,
    id: poderBase.id || `custom_${Date.now()}`,
    nome: nomeBase,
    descricao: descricaoFinal || 'Poder especial da criatura.',
    parametros: {
      tipos_dano: tiposDano,
      especie_alvo: especieAlvo,
      condicao_alvo: condicaoAlvo,
      efeito_detalhado: descricaoFinal
    }
  };
}

/**
 * Formata um poder especial de NPC (estruturado ou legado) para exibição clara em NPCView, Bestiário e Combate.
 * @param {Object} poder
 * @returns {{ nome: string, descricao: string, tiposDano: Array<string>, especieAlvo: string, condicaoAlvo: string, tagsParametros: Array<string>, resumoCurto: string }}
 */
export function formatarPoderNpcParaExibicao(poder) {
  if (!poder) {
    return { nome: '', descricao: '', tiposDano: [], especieAlvo: '', condicaoAlvo: '', tagsParametros: [], resumoCurto: '' };
  }
  const params = poder.parametros || {};
  const tiposDano = Array.isArray(params.tipos_dano) ? params.tipos_dano.filter(Boolean) : [];
  const especieAlvo = params.especie_alvo || '';
  const condicaoAlvo = params.condicao_alvo || '';

  const tagsParametros = [];
  if (tiposDano.length > 0) tagsParametros.push(`Dano: ${tiposDano.join(', ')}`);
  if (especieAlvo) tagsParametros.push(`Espécie: ${especieAlvo}`);
  if (condicaoAlvo) tagsParametros.push(`Condição: ${condicaoAlvo}`);

  const nome = poder.nome || 'Poder Especial';
  const descricao = params.efeito_detalhado || poder.descricao || '';
  const sufixoCurto = [
    ...(tiposDano.length > 0 ? [tiposDano.join('/')] : []),
    ...(especieAlvo ? [especieAlvo] : []),
    ...(condicaoAlvo ? [condicaoAlvo] : [])
  ].join(', ');

  const resumoCurto = sufixoCurto ? `${nome} (${sufixoCurto})` : nome;
  const custoPm = Number(poder.custoPm || poder.custo_pm || poder.pm_custo || params.custo_pm || params.pm_custo) || 0;

  return {
    ...poder,
    id: poder.id || `poder_${nome}`,
    nome,
    descricao,
    efeito: descricao,
    tiposDano,
    especieAlvo,
    condicaoAlvo,
    tagsParametros,
    resumoCurto,
    custoPm,
    passiva: poder.passiva !== undefined ? poder.passiva : undefined
  };
}

/**
 * Formata e normaliza os dados de um Ataque Básico de NPC para exibição e rolagem.
 * @param {Object} atk
 * @returns {{ nome: string, attr1: string, attr2: string, modPrecisao: number, modPrecisaoTexto: string, bonusDano: number, tipoDano: string, condicao: string, efeito: string, resumoEfeito: string }}
 */
export function formatarAtaqueBasicoNpc(atk = {}) {
  const nome = atk.nome || 'Ataque Básico';
  const attr1 = (atk.atributo_dado1 || 'des').toUpperCase();
  const attr2 = (atk.atributo_dado2 || 'vig').toUpperCase();
  const modPrecisao = Number(atk.bonus_precisao) || 0;
  const modPrecisaoTexto = modPrecisao > 0
    ? ` + ${modPrecisao}`
    : modPrecisao < 0
      ? ` - ${Math.abs(modPrecisao)}`
      : '';

  const bonusDano = (atk.bonus_dano !== undefined && atk.bonus_dano !== null && atk.bonus_dano !== '')
    ? (Number(atk.bonus_dano) || 0)
    : 5;
  const tipoDano = (atk.tipo_dano || 'fisico').toLowerCase();
  const condicao = (atk.condicao || '').trim();
  const efeito = (atk.efeito || '').trim();

  const alcanceBruto = String(atk.alcance || atk.tipo_alcance || atk.tipo_ataque || 'corpo_a_corpo').toLowerCase();
  const ehDistancia = alcanceBruto.includes('distancia') || alcanceBruto.includes('ranged');
  const alcance = ehDistancia ? 'distancia' : 'corpo_a_corpo';
  const alcanceTexto = ehDistancia ? 'À Distância' : 'Corpo a Corpo';

  const partesEfeito = [];
  if (condicao) {
    const jaContemCond = normalizarTextoNpc(efeito).includes(normalizarTextoNpc(condicao));
    if (!jaContemCond) {
      partesEfeito.push(`Aplica ${condicao}`);
    }
  }
  if (efeito) partesEfeito.push(efeito);

  return {
    nome,
    attr1,
    attr2,
    modPrecisao,
    modPrecisaoTexto,
    bonusDano,
    tipoDano,
    alcance,
    ehDistancia,
    alcanceTexto,
    condicao,
    efeito,
    resumoEfeito: partesEfeito.join(' • ')
  };
}



