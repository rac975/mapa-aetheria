/**
 * Fabula Ultima - Regras de Equipamentos, Defesa, Defesa Mágica e Slots
 *
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 * Conforme o Livro Básico de Fabula Ultima:
 * - Slots de equipamento:
 *    - mao_dominante (Armas de 1 mão ou 2 mãos, ou Escudo com Duplo Escudeiro)
 *    - mao_secundaria (Arma de 1 mão secundária ou Escudo; se a arma principal for 2H, este slot fica indisponível)
 *    - armadura (Armaduras leves ou marciais)
 *    - acessorio (Itens acessórios, elmos, anéis, capas, etc.)
 *
 * - Cálculo de Defesa Física (DEF):
 *    - Sem armadura marcial: base é o valor atual do dado de Destreza (ex: d8 -> 8, d10 -> 10) + bônus de armadura leve/escudos/acessórios.
 *    - Com armadura marcial: a armadura fixa o valor base de Defesa (ex: Defesa Fixa 10, 11, 12, etc.) em substituição ao dado de Destreza + bônus de escudos/acessórios.
 *    - Bônus adicionais: Habilidade de Ladino (Esquiva: +1 por nível se não estiver usando escudo nem armadura marcial).
 *
 * - Cálculo de Defesa Mágica (M.DEF):
 *    - Base é o dado de Astúcia (ex: d8 -> 8, d10 -> 10) + bônus concedidos por armaduras, escudos e acessórios.
 *
 * - Penalidade de Armadura:
 *    - Armaduras pesadas/marciais podem impor penalidade no teste de Iniciativa (ex: -2, -4).
 *    - Escudos e acessórios também podem alterar a Iniciativa.
 *
 * - Proficiências e Restrições de Equipamento:
 *    - Itens marciais (armas marciais, armaduras marciais, escudos) exigem que a classe possua proficiência correspondente nos benefícios.
 *    - Armas de duas mãos (2H) ocupam as duas mãos (desequipando a mão secundária).
 */

import { ehClasseComandante } from './highFantasyRules.js';

export const SLOTS_EQUIPAMENTO = {
  MAO_DOMINANTE: 'mao_dominante',
  MAO_SECUNDARIA: 'mao_secundaria',
  ARMADURA: 'armadura',
  ACESSORIO: 'acessorio'
};

/**
 * Escudos Base Comuns oficiais do Livro Básico de Fabula Ultima.
 * Utilizados como base na forja de escudos raros e no catálogo.
 */
export const ESCUDOS_BASE_COMUNS = [
  {
    id: 'escudo_de_bronze',
    nome: 'Escudo de Bronze',
    tipo: 'escudo',
    custo: 100,
    descricao: 'Um escudo resistente de bronze para bloquear golpes.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA,
      categoria: 'Escudo',
      escudo: true,
      defesa: 2,
      defesa_magica: 0,
      iniciativa: 0,
      marcial: false
    }
  },
  {
    id: 'escudo_pesado',
    nome: 'Escudo Pesado',
    tipo: 'escudo',
    custo: 150,
    descricao: 'Um escudo maciço reforçado. Exige proficiência marcial e reduz iniciativa.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA,
      categoria: 'Escudo',
      escudo: true,
      defesa: 2,
      defesa_magica: 0,
      iniciativa: -2,
      marcial: true
    }
  },
  {
    id: 'escudo_runico',
    nome: 'Escudo Rúnico',
    tipo: 'escudo',
    custo: 150,
    descricao: 'Um escudo gravado com runas protetoras que repelem aço e magia.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_SECUNDARIA,
      categoria: 'Escudo',
      escudo: true,
      defesa: 1,
      defesa_magica: 1,
      iniciativa: 0,
      marcial: false
    }
  }
];

/**
 * Armas Base Comuns oficiais do Livro Básico de Fabula Ultima.
 * Utilizadas como catálogo e fallback resiliente na Forja de Armas.
 */
export const ARMAS_BASE_COMUNS = [
  {
    id: 'espada_curta',
    nome: 'Espada Curta',
    tipo: 'arma',
    custo: 200,
    descricao: 'Uma lâmina de aço equilibrada de uma mão.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
      categoria: 'Espada',
      dano: 'RA + 6',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(DES + VIG) + 1',
      maos: 'Uma mão',
      marcial: true
    }
  },
  {
    id: 'espada_longa',
    nome: 'Espada Longa',
    tipo: 'arma',
    custo: 200,
    descricao: 'Espada de duas mãos com excelente alcance e impacto.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Espada',
      dano: 'RA + 10',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(DES + VIG) + 1',
      maos: 'Duas mãos',
      marcial: true
    }
  },
  {
    id: 'adaga_comum',
    nome: 'Adaga',
    tipo: 'arma',
    custo: 100,
    descricao: 'Arma ágil e discreta fácil de esconder e manejar.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
      categoria: 'Adaga',
      dano: 'RA + 4',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(DES + AST)',
      maos: 'Uma mão',
      marcial: false
    }
  },
  {
    id: 'lanca_leve',
    nome: 'Lança Leve',
    tipo: 'arma',
    custo: 200,
    descricao: 'Lança ágil de uma mão.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
      categoria: 'Lança',
      dano: 'RA + 8',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(DES + VIG)',
      maos: 'Uma mão',
      marcial: true
    }
  },
  {
    id: 'lanca_pesada',
    nome: 'Lança Pesada',
    tipo: 'arma',
    custo: 200,
    descricao: 'Pique longo de infantaria para combate a duas mãos.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Lança',
      dano: 'RA + 12',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(DES + VIG)',
      maos: 'Duas mãos',
      marcial: true
    }
  },
  {
    id: 'arco_curto',
    nome: 'Arco Curto',
    tipo: 'arma',
    custo: 200,
    descricao: 'Arco flexível para ataques à distância.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Arco',
      dano: 'RA + 8',
      tipo_dano: 'físico',
      alcance: 'À distância',
      precisao: '(DES + AST)',
      maos: 'Duas mãos',
      marcial: false
    }
  },
  {
    id: 'arco_longo',
    nome: 'Arco Longo',
    tipo: 'arma',
    custo: 250,
    descricao: 'Arco de grande envergadura com alto poder de perfuração.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Arco',
      dano: 'RA + 12',
      tipo_dano: 'físico',
      alcance: 'À distância',
      precisao: '(DES + AST)',
      maos: 'Duas mãos',
      marcial: true
    }
  },
  {
    id: 'pistola',
    nome: 'Pistola',
    tipo: 'arma',
    custo: 250,
    descricao: 'Arma de fogo de tiro rápido e manejo em uma mão.',
    stats: {
      raridade: 'comum',
      slot: SLOTS_EQUIPAMENTO.MAO_DOMINANTE,
      categoria: 'Arma de fogo',
      dano: 'RA + 8',
      tipo_dano: 'físico',
      alcance: 'À distância',
      precisao: '(DES + AST)',
      maos: 'Uma mão',
      marcial: true
    }
  },
  {
    id: 'fuzil',
    nome: 'Fuzil',
    tipo: 'arma',
    custo: 250,
    descricao: 'Arma de fogo longa de grande calibre e longo alcance.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Arma de fogo',
      dano: 'RA + 12',
      tipo_dano: 'físico',
      alcance: 'À distância',
      precisao: '(DES + AST)',
      maos: 'Duas mãos',
      marcial: true
    }
  },
  {
    id: 'cajado_arcano',
    nome: 'Cajado',
    tipo: 'arma',
    custo: 100,
    descricao: 'Cajado tradicional que canaliza poder espiritual.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Arcana',
      dano: 'RA + 6',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(VON + VON)',
      maos: 'Duas mãos',
      marcial: false
    }
  },{
    id: 'chave_inglesa_comum',
    nome: 'Chave Inglesa',
    tipo: 'arma',
    custo: 200,
    descricao: 'Ferramenta pesada de duas mãos comum em oficinas e porões de naves.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Pesada',
      dano: 'RA + 10',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(DES + VIG)',
      maos: 'Duas mãos',
      marcial: true
    }
  },
  {
    id: 'tomo_magico',
    nome: 'Tomo',
    tipo: 'arma',
    custo: 100,
    descricao: 'Grimório de encadernação robusta usado no combate.',
    stats: {
      raridade: 'comum',
      slot: 'duas_maos',
      duas_maos: true,
      categoria: 'Arcana',
      dano: 'RA + 6',
      tipo_dano: 'físico',
      alcance: 'Corpo a corpo',
      precisao: '(AST + AST)',
      maos: 'Duas mãos',
      marcial: false
    }
  }
];

/**
 * Converte valor de atributo textual ou numérico (ex: 'd8', 'D10', 8) em número inteiro.
 * @param {string|number} valorAttr
 * @returns {number}
 */
export function dadoParaNumero(valorAttr) {
  if (!valorAttr) return 8;
  if (typeof valorAttr === 'number') return valorAttr;
  const str = String(valorAttr).trim().toLowerCase();
  if (str.startsWith('d')) {
    const faces = parseInt(str.substring(1), 10);
    return isNaN(faces) ? 8 : faces;
  }
  const num = parseInt(str, 10);
  return isNaN(num) ? 8 : num;
}

/**
 * Avalia expressões numéricas ou fórmulas de bônus com segurança (ex: "+2", "8", "DES + 1")
 * @param {string|number} valorBruto
 * @param {Object} mapaAtributos
 * @returns {number}
 */
export function resolverValorNumerico(valorBruto, mapaAtributos = {}) {
  if (typeof valorBruto === 'number') return isNaN(valorBruto) ? 0 : Math.floor(valorBruto);
  if (!valorBruto) return 0;

  let str = String(valorBruto).trim().toLowerCase();
  str = str.replace(/dado de /g, '').replace(/dado /g, '');

  Object.keys(mapaAtributos).forEach((sigla) => {
    const regex = new RegExp(`\\b${sigla}\\b`, 'g');
    str = str.replace(regex, String(mapaAtributos[sigla]));
  });

  // Tenta parsing direto de inteiro
  const parseSimples = Number(str);
  if (!isNaN(parseSimples)) {
    return Math.floor(parseSimples);
  }

  // Avaliação aritmética segura para adições e subtrações simples (ex: "8 + 1", "+2", "-1")
  const tokens = str.match(/([+-]?\s*\d+)/g);
  if (tokens) {
    return tokens.reduce((acc, t) => acc + (parseInt(t.replace(/\s+/g, ''), 10) || 0), 0);
  }

  return 0;
}

/**
 * Identifica se um item é classificado como escudo.
 * @param {Object} item
 * @returns {boolean}
 */
export function isEscudo(item) {
  if (!item) return false;
  const tipo = (item.tipo || '').toLowerCase();
  const stats = item.stats_personalizados || item.stats || {};
  return (
    tipo.includes('escudo') ||
    stats.escudo === true ||
    (stats.categoria || '').toLowerCase().includes('escudo')
  );
}

/**
 * Identifica se um item é classificado como armadura marcial/pesada.
 * @param {Object} item
 * @returns {boolean}
 */
export function isArmaduraMarcial(item) {
  if (!item) return false;
  if (isEscudo(item)) return false;
  const stats = item.stats_personalizados || item.stats || {};
  const tipo = (item.tipo || '').toLowerCase();
  const nome = (item.nome || '').toLowerCase();
  return (
    stats.marcial === true ||
    tipo.includes('marcial') ||
    tipo.includes('pesada') ||
    (tipo.includes('armadura') && (
      nome.includes('placas') ||
      nome.includes('cota de malha') ||
      nome.includes('couraça') ||
      nome.includes('cuirass') ||
      nome.includes('gibão')
    ))
  );
}

/**
 * Identifica se um item é arma de duas mãos (2H).
 * @param {Object} item
 * @returns {boolean}
 */
export function isArmaDuasMaos(item) {
  if (!item) return false;
  const tipo = (item.tipo || '').toLowerCase();
  const stats = item.stats_personalizados || item.stats || {};
  return (
    tipo.includes('2h') ||
    tipo.includes('duas mãos') ||
    stats.duas_maos === true ||
    stats.maos === 2 ||
    stats.slot === 'duas_maos' ||
    String(stats.maos || '').toLowerCase().includes('duas')
  );
}

/**
 * Valida se um personagem tem proficiência e permissão para equipar um item em determinado slot.
 * @param {Object} params
 * @param {Object} params.item
 * @param {string} params.slotAlvo
 * @param {Array} params.classes
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarSlotEquipamento({ item, slotAlvo, classes = [] }) {
  if (!item) {
    return { permitido: false, motivo: 'Nenhum item informado.' };
  }

  const tipoItem = (item.tipo || '').toLowerCase();
  const nomeItem = (item.nome || '').toLowerCase();
  const ehEsc = isEscudo(item);

  // Validação de categoria por slot
  if ((slotAlvo === SLOTS_EQUIPAMENTO.MAO_DOMINANTE || slotAlvo === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA)) {
    if (tipoItem.includes('armadura') || tipoItem.includes('acessorio') || tipoItem.includes('acessório')) {
      return { permitido: false, motivo: 'Este item não pode ser empunhado nas mãos!' };
    }
  }

  if (slotAlvo === SLOTS_EQUIPAMENTO.ARMADURA && !tipoItem.includes('armadura')) {
    return { permitido: false, motivo: 'Apenas armaduras podem ser vestidas neste slot!' };
  }

  if (slotAlvo === SLOTS_EQUIPAMENTO.ACESSORIO && !tipoItem.includes('acessorio') && !tipoItem.includes('acessório')) {
    return { permitido: false, motivo: 'Apenas acessórios podem ser equipados neste slot!' };
  }

  const temDuploEscudeiro = classes.some(c =>
    (c.habilidades || []).some(h =>
      (h.nome || '').toLowerCase().includes('duplo escudeiro') && (parseInt(h.nivel, 10) || 0) > 0
    )
  );

  // Escudo na mão dominante requer a habilidade "Duplo Escudeiro"
  if (slotAlvo === SLOTS_EQUIPAMENTO.MAO_DOMINANTE && ehEsc && !temDuploEscudeiro) {
    return {
      permitido: false,
      motivo: "⛔ Apenas personagens com a habilidade 'Duplo Escudeiro' podem equipar escudos na mão dominante!"
    };
  }

  // Verificação de proficiência para marcial/pesado
  const ehMarcialOuPesado = tipoItem.includes('marcial') ||
    tipoItem.includes('pesada') ||
    ehEsc ||
    nomeItem.includes('nodachi') ||
    nomeItem.includes('martelo de guerra');

  if (ehMarcialOuPesado) {
    const ehArmadura = tipoItem.includes('armadura');
    const alcanceStats = (item.stats_personalizados?.alcance || '').toLowerCase();
    const ehDistancia = !ehArmadura && !ehEsc && (
      tipoItem.includes('distancia') ||
      tipoItem.includes('distância') ||
      tipoItem.includes('arco') ||
      tipoItem.includes('fogo') ||
      tipoItem.includes('arremesso') ||
      alcanceStats.includes('distancia') ||
      alcanceStats.includes('distância')
    );

    const temProficiencia = classes.some(c => {
      const nomeNorm = (c.nome_classe || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const ben = (c.beneficios || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      if (ben.includes('todos')) return true;

      if (ehEsc) {
        return ben.includes('escudo') || nomeNorm.includes('guardiao') || nomeNorm.includes('mestre de armas') || nomeNorm.includes('atirador');
      }

      if (ehArmadura) {
        return (ben.includes('armadura') && (ben.includes('marcia') || ben.includes('pesada'))) ||
          ben.includes('pesada') ||
          nomeNorm.includes('guardiao') ||
          nomeNorm.includes('furioso') ||
          nomeNorm.includes('guerreiro sombrio');
      }

      if (ehDistancia) {
        return ben.includes('armas a distancia') ||
          (ben.includes('distancia') && ben.includes('marcia')) ||
          ehClasseComandante(c.nome_classe) ||
          nomeNorm.includes('piloto') ||
          nomeNorm.includes('atirador');
      }

      return ben.includes('armas corpo a corpo') ||
        (ben.includes('corpo a corpo') && ben.includes('marcia')) ||
        ehClasseComandante(c.nome_classe) ||
        nomeNorm.includes('piloto') ||
        nomeNorm.includes('mestre de armas') ||
        nomeNorm.includes('furioso') ||
        nomeNorm.includes('guerreiro sombrio') ||
        (ben.includes('marcial') && !ben.includes('armadura') && !ben.includes('escudo'));
    });

    if (!temProficiencia) {
      return {
        permitido: false,
        motivo: '⛔ Bloqueado pelas regras de Fabula Ultima: Seu personagem não possui a proficiência necessária nas classes ativas para equipar este tipo de equipamento marcial/pesado!'
      };
    }
  }

  return { permitido: true };
}

/**
 * Extrai e normaliza as estatísticas defensivas de uma armadura conforme Fabula Ultima.
 * - Armadura Leve: Base é a Destreza do personagem (DES) + bônus da armadura (ex: +1, +2).
 * - Armadura Marcial: A armadura substitui a Destreza por uma Defesa Fixa (ex: DEF 10, 11, 12). O dado de DES NÃO é somado!
 * 
 * Se o campo de defesa de uma armadura marcial contiver "DES + 11", "+11" ou "11",
 * ela é tratada estritamente como DEF Fixa 11, evitando o salto errôneo para 19 (8 + 11).
 * 
 * @param {Object} itemArmadura Item equipado no slot de armadura
 * @param {number} dadoDes Valor numérico do dado de Destreza (ex: 8)
 * @returns {{
 *   ehMarcial: boolean,
 *   defesaBase: number,
 *   bonusDefesaArmadura: number,
 *   bonusMDefArmadura: number,
 *   penalidadeIniciativa: number
 * }}
 */
export function extrairStatsArmadura(itemArmadura, dadoDes = 8) {
  if (!itemArmadura) {
    return {
      ehMarcial: false,
      defesaBase: dadoDes,
      bonusDefesaArmadura: 0,
      bonusMDefArmadura: 0,
      penalidadeIniciativa: 0
    };
  }

  const stats = itemArmadura.stats_personalizados || itemArmadura.stats || {};
  const ehMarcialExplicitamente = isArmaduraMarcial(itemArmadura);

  const defBruta = stats.defesa ?? stats.def ?? 0;
  const mdefBruta =
    stats['defesa magica'] ??
    stats['defesa mágica'] ??
    stats.mdefesa ??
    stats.mdef ??
    stats.defesa_magica ??
    0;
  const iniBruta = stats.iniciativa ?? stats.ini ?? stats.Iniciativa ?? 0;

  const textoDef = String(defBruta).trim();
  const contemDesExplicito = /\b(des|destreza)\b/i.test(textoDef);

  let numeroDef = 0;
  const matchNumero = textoDef.match(/-?\d+/);
  if (matchNumero) {
    numeroDef = parseInt(matchNumero[0], 10) || 0;
  } else if (typeof defBruta === 'number') {
    numeroDef = Math.floor(defBruta);
  }

  // Em Fabula Ultima: Armaduras marciais possuem DEF fixa (>= 9 ou marcial declarado).
  // Armaduras leves concedem bônus pequeno (+0 a +3).
  const ehMarcial = ehMarcialExplicitamente || (!contemDesExplicito && numeroDef >= 9);

  let defesaBase = dadoDes;
  let bonusDefesaArmadura = 0;

  if (ehMarcial) {
    // Armadura Marcial: Defesa fixa substitui o dado de Destreza.
    // NUNCA soma Destreza com a armadura marcial (ex: 8 + 11 = 19 nunca ocorre).
    defesaBase = numeroDef > 0 ? numeroDef : 10;
    bonusDefesaArmadura = 0;
  } else {
    // Armadura Leve: Base é a Destreza do personagem. O valor da armadura é um bônus.
    defesaBase = dadoDes;
    bonusDefesaArmadura = numeroDef;
  }

  let bonusMDefArmadura = 0;
  const matchMDef = String(mdefBruta).match(/-?\d+/);
  if (matchMDef) {
    bonusMDefArmadura = parseInt(matchMDef[0], 10) || 0;
  } else if (typeof mdefBruta === 'number') {
    bonusMDefArmadura = Math.floor(mdefBruta);
  }

  const penalidadeIniciativa = parseInt(iniBruta, 10) || 0;

  return {
    ehMarcial,
    defesaBase,
    bonusDefesaArmadura,
    bonusMDefArmadura,
    penalidadeIniciativa
  };
}

/**
 * Extrai o bônus de Defesa, Defesa Mágica e Iniciativa de itens secundários, escudos ou acessórios.
 * @param {Object} item
 * @returns {{ bonusDef: number, bonusMDef: number, modIni: number, ehEscudo: boolean }}
 */
export function extrairStatsItemDefensivo(item) {
  if (!item) return { bonusDef: 0, bonusMDef: 0, modIni: 0, ehEscudo: false };

  const stats = item.stats_personalizados || item.stats || {};
  const ehEsc = isEscudo(item);

  const defBruta = stats.defesa ?? stats.def ?? 0;
  const mdefBruta =
    stats['defesa magica'] ??
    stats['defesa mágica'] ??
    stats.mdefesa ??
    stats.mdef ??
    stats.defesa_magica ??
    0;
  const iniBruta = stats.iniciativa ?? stats.ini ?? stats.Iniciativa ?? 0;

  const matchDef = String(defBruta).match(/-?\d+/);
  const bonusDef = matchDef ? parseInt(matchDef[0], 10) || 0 : (typeof defBruta === 'number' ? Math.floor(defBruta) : 0);

  const matchMDef = String(mdefBruta).match(/-?\d+/);
  const bonusMDef = matchMDef ? parseInt(matchMDef[0], 10) || 0 : (typeof mdefBruta === 'number' ? Math.floor(mdefBruta) : 0);

  const modIni = parseInt(iniBruta, 10) || 0;

  return {
    bonusDef,
    bonusMDef,
    modIni,
    ehEscudo: ehEsc
  };
}

/**
 * Calcula a Defesa Física (DEF), Defesa Mágica (M.DEF) e modificador de Iniciativa a partir dos atributos e itens equipados.
 * @param {Object} params
 * @param {Object} params.atributos { destreza, astucia, vigor, vontade }
 * @param {Array} params.itensEquipados Lista de itens equipados com stats_personalizados
 * @param {Array} params.classes Classes do personagem (para habilidades como Esquiva do Ladino)
 * @returns {{
 *   defesaBase: number,
 *   bonusDefesaArmadura: number,
 *   bonusDefesaItens: number,
 *   bonusEsquivaLadino: number,
 *   defesaTotal: number,
 *   mdefBase: number,
 *   bonusMDefItens: number,
 *   mdefTotal: number,
 *   iniciativaTotal: number,
 *   temEscudoEquipado: boolean,
 *   temDoisEscudos: boolean,
 *   temArmaduraMarcial: boolean
 * }}
 */
export function calcularDefesasEIniciativa({ atributos = {}, itensEquipados = [], classes = [] }) {
  const des = dadoParaNumero(atributos.destreza);
  const ast = dadoParaNumero(atributos.astucia);

  const getSlotItem = (item) => {
    if (!item) return '';
    const stats = item.stats_personalizados || item.stats || {};
    return (stats.slot || item.slot || '').toLowerCase();
  };

  const itemMaoDom = itensEquipados.find(i => {
    const s = getSlotItem(i);
    return s === SLOTS_EQUIPAMENTO.MAO_DOMINANTE || s === 'duas_maos' || s === 'mao_dupla';
  });
  const itemMaoSec = itensEquipados.find(i => getSlotItem(i) === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
  const itemArmadura = itensEquipados.find(i => getSlotItem(i) === SLOTS_EQUIPAMENTO.ARMADURA);
  const itemAcessorio = itensEquipados.find(i => getSlotItem(i) === SLOTS_EQUIPAMENTO.ACESSORIO);

  const statsArmadura = extrairStatsArmadura(itemArmadura, des);
  const statsMaoDom = extrairStatsItemDefensivo(itemMaoDom);
  const statsMaoSec = extrairStatsItemDefensivo(itemMaoSec);
  const statsAcessorio = extrairStatsItemDefensivo(itemAcessorio);

  const temEscudoEquipado = statsMaoDom.ehEscudo || statsMaoSec.ehEscudo;
  const temDoisEscudos = statsMaoDom.ehEscudo && statsMaoSec.ehEscudo;
  const temArmaduraMarc = statsArmadura.ehMarcial;

  // 1. Defesa Física:
  // Base é DES (para leve/sem armadura) ou DEF Fixa (para marcial)
  const defesaBase = statsArmadura.defesaBase;
  const bonusDefesaArmadura = statsArmadura.bonusDefesaArmadura;
  const bonusDefesaOutrosItens = statsMaoDom.bonusDef + statsMaoSec.bonusDef + statsAcessorio.bonusDef;
  const bonusDefesaItens = bonusDefesaArmadura + bonusDefesaOutrosItens;

  // Habilidade "Esquiva" do Ladino: +SL em Defesa se não estiver usando escudo nem armadura marcial
  let bonusEsquivaLadino = 0;
  if (!temEscudoEquipado && !temArmaduraMarc) {
    classes.forEach(c => {
      const nomeNormalizado = (c.nome_classe || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

      if (nomeNormalizado.includes('ladino')) {
        (c.habilidades || []).forEach(h => {
          const nomeHab = (h.nome || '').toLowerCase();
          const nivelHab = parseInt(h.nivel, 10) || 0;
          if (nomeHab.includes('esquiva') && nivelHab > 0) {
            bonusEsquivaLadino += nivelHab;
          }
        });
      }
    });
  }

  const defesaTotal = defesaBase + bonusDefesaItens + bonusEsquivaLadino;

  // 2. Defesa Mágica (M.DEF): Base é sempre AST + bônus somados
  const mdefBase = ast;
  const bonusMDefItens =
    statsArmadura.bonusMDefArmadura +
    statsMaoDom.bonusMDef +
    statsMaoSec.bonusMDef +
    statsAcessorio.bonusMDef;
  const mdefTotal = mdefBase + bonusMDefItens;

  // 3. Modificador de Iniciativa total vindo dos itens (penalidades de armaduras marciais e escudos)
  const iniciativaTotal =
    statsArmadura.penalidadeIniciativa +
    statsMaoDom.modIni +
    statsMaoSec.modIni +
    statsAcessorio.modIni;

  return {
    defesaBase,
    bonusDefesaArmadura,
    bonusDefesaItens,
    bonusEsquivaLadino,
    defesaTotal,
    mdefBase,
    bonusMDefItens,
    mdefTotal,
    iniciativaTotal,
    temEscudoEquipado,
    temDoisEscudos,
    temArmaduraMarcial: temArmaduraMarc
  };
}

/**
 * Aumenta o passo do dado de atributo (ex: 6 -> 8, 8 -> 10, 10 -> 12).
 * Conforme regras oficiais de Fabula Ultima (Passo maior de atributo, máximo d12).
 * @param {string|number} valorDado
 * @param {number} [max=12]
 * @returns {number}
 */
export function aumentarPassoDado(valorDado, max = 12) {
  const num = dadoParaNumero(valorDado);
  if (num <= 6) return Math.min(max, 8);
  if (num <= 8) return Math.min(max, 10);
  return Math.min(max, 12);
}

/**
 * Cria a representação padronizada do Ataque Desarmado (Unarmed Strike) de Fabula Ultima.
 * Regra Oficial do Livro Básico:
 * - Precisão: 【DES + VIG】
 * - Dano: 【HR + 0】 físico
 * - Categoria: Armas de Luta (Brawling)
 * - Mãos: 1 mão (equipado automaticamente em mãos livres)
 * - Alcance: Corpo a corpo (ou à distância se modificado por Acromorfose)
 *
 * Integração com Atlas Tecno-Fantasia (Acromorfose e Terioformas):
 * - Acromorfose: +NP Precisão, +[6 + NP × 2] Dano Físico, e escolha da Categoria de Arma.
 * - Terioformas elementais (Pirófora -> Fogo, Eletrófora -> Raio, Pneumófora -> Ar, Toxicófora -> Veneno).
 * - Terioforma Polípoda: Concede Múltiplo (3).
 *
 * @param {Object} [opcoes={}]
 * @param {Object} [opcoes.acromorfose] { nvAcromorfose: number, bonusPrecisao: number, bonusDanoFisico: number, categoriaArma: string }
 * @param {Array<string>} [opcoes.terioformasAtivas=[]]
 * @returns {Object} Objeto no formato de item de Fabula Ultima
 */
export function obterAtaqueDesarmado({
  acromorfose = null,
  terioformasAtivas = [],
  conversaoDanoNatural = null,
  bonusDanoNatural = 0
} = {}) {
  const nvAcro = parseInt(acromorfose?.nvAcromorfose, 10) || 0;
  const bonusPrecisaoAcro = nvAcro > 0 ? (parseInt(acromorfose?.bonusPrecisao, 10) || nvAcro) : 0;
  const bonusDanoAcro = (nvAcro > 0 ? (parseInt(acromorfose?.bonusDanoFisico, 10) || (6 + nvAcro * 2)) : 0) + (parseInt(bonusDanoNatural, 10) || 0);

  const categoriaArma = acromorfose?.categoriaArma || 'Armas de Luta';
  const catLower = categoriaArma.toLowerCase();
  const ehDistancia = catLower.includes('arco') || catLower.includes('fogo') || catLower.includes('arremesso') || catLower.includes('distancia') || catLower.includes('distância');

  // Verifica elementos de Terioformas
  let tipoDano = 'fisico';
  const efeitosTerio = [];

  if (terioformasAtivas.includes('pyrophora')) {
    tipoDano = 'fogo';
    efeitosTerio.push('Pirófora: Dano de Fogo (20+ perda de PV = Confuso)');
  } else if (terioformasAtivas.includes('electrophora')) {
    tipoDano = 'raio';
    efeitosTerio.push('Eletrófora: Dano de Raio (20+ perda de PV = Lento)');
  } else if (terioformasAtivas.includes('pneumophora')) {
    tipoDano = 'ar';
    efeitosTerio.push('Pneumófora: Dano de Ar (20+ perda de PV = Fraco)');
  } else if (terioformasAtivas.includes('toxicophora')) {
    tipoDano = 'veneno';
    efeitosTerio.push('Toxicófora: Dano de Veneno (15+ perda de PV = Envenenado)');
  }

  if (conversaoDanoNatural) {
    tipoDano = conversaoDanoNatural;
    efeitosTerio.push(`Conversão Natural: Dano de ${conversaoDanoNatural}`);
  }

  const temPolypoda = terioformasAtivas.includes('polypoda');
  if (temPolypoda) {
    efeitosTerio.push('Polípoda: Múltiplo (3) [alveja até 3 criaturas]');
  }

  const qualidades = [];
  if (nvAcro > 0) {
    qualidades.push(`Acromorfose Nv. ${nvAcro} (+${bonusPrecisaoAcro} Precisão, +${bonusDanoAcro} Dano Físico, categoria: ${categoriaArma})`);
  }
  if (efeitosTerio.length > 0) {
    qualidades.push(efeitosTerio.join(' • '));
  }
  if (qualidades.length === 0) {
    qualidades.push('Golpe desarmado padrão do Livro Básico.');
  }

  return {
    id: 'ataque_desarmado',
    nome: nvAcro > 0 ? 'Ataque Desarmado (Acromorfose)' : 'Ataque Desarmado',
    tipo: 'Arma Básica',
    ehDesarmado: true,
    stats_personalizados: {
      categoria: categoriaArma,
      alcance: ehDistancia ? 'distancia' : 'corpo_a_corpo',
      attr1: 'destreza',
      attr2: 'vigor',
      precisao: bonusPrecisaoAcro > 0 ? `(DEX + MIG) + ${bonusPrecisaoAcro}` : '(DEX + MIG)',
      acerto: bonusPrecisaoAcro,
      dano: `RA + ${bonusDanoAcro}`,
      bonus_dano: bonusDanoAcro,
      tipo_dano: tipoDano,
      maos: 1,
      multiplo: temPolypoda ? 3 : undefined,
      qualidade: qualidades.join(' | ')
    }
  };
}

/**
 * Cria a representação padronizada de uma Arma Improvisada (Improvised Weapon) de Fabula Ultima.
 * Regra Oficial do Livro Básico:
 * - Precisão: 【DES + VIG】
 * - Dano: 【HR + 2】 físico
 * - Categoria: Armas de Luta (corpo a corpo) ou Arremesso (à distância)
 * - Mãos: 1 mão
 * - Qualidade especial: Destrói-se após o ataque.
 *
 * @param {Object} [opcoes={}]
 * @param {'corpo_a_corpo'|'distancia'} [opcoes.tipoAlcance='corpo_a_corpo']
 * @returns {Object}
 */
export function obterArmaImprovisada({ tipoAlcance = 'corpo_a_corpo' } = {}) {
  const ehDistancia = tipoAlcance === 'distancia';
  return {
    id: 'arma_improvisada',
    nome: ehDistancia ? 'Arma Improvisada (Arremesso)' : 'Arma Improvisada',
    tipo: 'Arma Improvisada',
    ehImprovisada: true,
    stats_personalizados: {
      categoria: ehDistancia ? 'Armas de Arremesso' : 'Armas de Luta',
      alcance: ehDistancia ? 'distancia' : 'corpo_a_corpo',
      attr1: 'destreza',
      attr2: 'vigor',
      precisao: '(DEX + MIG)',
      acerto: 0,
      dano: 'RA + 2',
      bonus_dano: 2,
      tipo_dano: 'fisico',
      maos: 1,
      qualidade: 'Destrói-se após o ataque.'
    }
  };
}

export const CARACTERISTICA_ATINGIR_VOADOR = {
  id: 'atingir_voador',
  nome: 'Atingir alvo voador',
  tipo_item: 'caracteristica_arma_ofensiva',
  custo: 100,
  efeito: 'Ataques com esta arma podem atingir criaturas voadoras.',
  atinge_voadores: true
};

export const ESPECIES_ALVO_EQUIPAMENTO = [
  'Fera',
  'Monstro',
  'Construto',
  'Morto-Vivo',
  'Demônio',
  'Elemental',
  'Humanoide',
  'Planta'
];

export const TIPOS_DANO_EQUIPAMENTO = [
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

export const CARACTERISTICAS_PARAMETRIZADAS_PADRAO = [
  {
    id: 'cacadora',
    nome: 'Caçadora',
    custo: 300,
    efeito: 'Causa +5 de dano contra criaturas da espécie escolhida.',
    tipo_parametro: 'especie_1'
  },
  {
    id: 'dupla_cacadora',
    nome: 'Dupla Caçadora',
    custo: 500,
    efeito: 'Causa +5 de dano contra criaturas das duas espécies escolhidas.',
    tipo_parametro: 'especie_2'
  },
  {
    id: 'resistencia_dano',
    nome: 'Resistência',
    custo: 500,
    efeito: 'Você tem Resistência ao tipo de dano escolhido.',
    tipo_parametro: 'dano_1'
  },
  {
    id: 'dupla_resistencia_dano',
    nome: 'Dupla Resistência',
    custo: 800,
    efeito: 'Você tem Resistência aos dois tipos de dano escolhidos.',
    tipo_parametro: 'dano_2'
  }
];

function normalizarTextoSimples(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Identifica se uma característica especial exige parâmetros do usuário:
 * - 'especie_1': Caçadora (1 espécie)
 * - 'especie_2': Dupla Caçadora (2 espécies diferentes)
 * - 'dano_1': Resistência (1 tipo de dano)
 * - 'dano_2': Dupla Resistência (2 tipos de dano diferentes)
 * - null: Não exige parâmetros
 * @param {Object} carac
 * @returns {'especie_1'|'especie_2'|'dano_1'|'dano_2'|null}
 */
export function identificarTipoParametroCaracteristica(carac) {
  if (!carac || carac.id === 'nenhuma') return null;
  if (carac.tipo_parametro) return carac.tipo_parametro;

  const idNorm = normalizarTextoSimples(carac.id);
  const nomeNorm = normalizarTextoSimples(carac.nome);
  const efeitoNorm = normalizarTextoSimples(carac.efeito);
  const combinado = `${idNorm} ${nomeNorm}`;

  if (combinado.includes('dupla') && combinado.includes('cacador')) return 'especie_2';
  if (combinado.includes('cacador')) return 'especie_1';
  if (combinado.includes('dupla') && combinado.includes('resisten')) return 'dano_2';

  const temElementoFixoNoNome = TIPOS_DANO_EQUIPAMENTO.some((t) =>
    nomeNorm.includes(`de ${normalizarTextoSimples(t)}`) ||
    nomeNorm.includes(`a ${normalizarTextoSimples(t)}`)
  );
  if (combinado.includes('resisten') && !temElementoFixoNoNome) {
    if (efeitoNorm.includes('dois tipos') || efeitoNorm.includes('duas')) return 'dano_2';
    return 'dano_1';
  }

  return null;
}

/**
 * Mescla as características vindas do banco com as características parametrizadas padrão,
 * enriquecendo itens existentes e garantindo que Caçadora, Dupla Caçadora, Resistência e Dupla Resistência estejam disponíveis.
 * @param {Array<Object>} listaBanco
 * @param {Object} [opcoes]
 * @param {boolean} [opcoes.incluirAtingirVoador=false]
 * @returns {Array<Object>}
 */
export function mesclarCaracteristicasCatalogo(listaBanco = [], { incluirAtingirVoador = false } = {}) {
  const resultado = [
    { id: 'nenhuma', nome: 'Nenhuma característica', custo: 0, efeito: '' }
  ];

  if (incluirAtingirVoador) {
    resultado.push(CARACTERISTICA_ATINGIR_VOADOR);
  }

  const tiposParametrizadosPresentes = new Set();
  const enriquecidosBanco = (listaBanco || [])
    .filter((i) => i && i.id !== 'nenhuma' && (!incluirAtingirVoador || i.id !== 'atingir_voador'))
    .map((item) => {
      const tipoParam = identificarTipoParametroCaracteristica(item);
      if (tipoParam) tiposParametrizadosPresentes.add(tipoParam);
      return tipoParam ? { ...item, tipo_parametro: tipoParam } : item;
    });

  CARACTERISTICAS_PARAMETRIZADAS_PADRAO.forEach((padrao) => {
    if (!tiposParametrizadosPresentes.has(padrao.tipo_parametro)) {
      resultado.push(padrao);
    }
  });

  resultado.push(...enriquecidosBanco);
  return resultado;
}

/**
 * Extrai bônus numéricos (defesa, defesa_magica, iniciativa) de uma característica especial.
 * @param {Object} carac
 * @returns {{ bonusDefesa: number, bonusDefMagica: number, bonusIniciativa: number }}
 */
export function extrairBonusNumericosCaracteristica(carac) {
  if (!carac || carac.id === 'nenhuma') {
    return { bonusDefesa: 0, bonusDefMagica: 0, bonusIniciativa: 0 };
  }

  const statsCarac = carac.stats || {};
  let bonusDefesa = Number(carac.defesa ?? carac.bonus_defesa ?? statsCarac.defesa ?? 0) || 0;
  let bonusDefMagica = Number(carac.defesa_magica ?? carac.bonus_defesa_magica ?? statsCarac.defesa_magica ?? 0) || 0;
  let bonusIniciativa = Number(carac.iniciativa ?? carac.bonus_iniciativa ?? statsCarac.iniciativa ?? 0) || 0;

  const texto = `${carac.nome || ''} ${carac.efeito || ''}`;
  const textoNorm = normalizarTextoSimples(texto);

  // Caso combinado: "+1 na Defesa e na Defesa Mágica" ou "+2 em Defesa e Defesa Mágica"
  const matchAmbos = textoNorm.match(/([+-]\d+)\s*(?:na\s+|em\s+|de\s+)?defesa\s+e\s+(?:na\s+|em\s+|de\s+)?(?:defesa\s*magica|def\.?\s*magica|m\.?def\b)/i);
  if (matchAmbos) {
    const valAmbos = parseInt(matchAmbos[1], 10) || 0;
    if (bonusDefesa === 0) bonusDefesa = valAmbos;
    if (bonusDefMagica === 0) bonusDefMagica = valAmbos;
  }

  if (bonusDefesa === 0) {
    const matchDef = textoNorm.match(/([+-]\d+)\s*(?:na\s+|em\s+|de\s+)?(?:defesa(?!\s*magica)|def\b(?!\s*\.?\s*mag))/i);
    if (matchDef) bonusDefesa = parseInt(matchDef[1], 10) || 0;
  }

  if (bonusDefMagica === 0) {
    const matchMDef = textoNorm.match(/([+-]\d+)\s*(?:na\s+|em\s+|de\s+)?(?:defesa\s*magica|def\.?\s*magica|m\.?def\b)/i);
    if (matchMDef) bonusDefMagica = parseInt(matchMDef[1], 10) || 0;
  }

  if (bonusIniciativa === 0) {
    const matchIni = textoNorm.match(/([+-]\d+)\s*(?:na\s+|em\s+|de\s+|no\s+teste\s+de\s+)?(?:iniciativa|ini\b)/i);
    if (matchIni) bonusIniciativa = parseInt(matchIni[1], 10) || 0;
  }

  return { bonusDefesa, bonusDefMagica, bonusIniciativa };
}

/**
 * Soma um bônus numérico de Defesa ou Defesa Mágica ao valor base de uma armadura ou escudo,
 * preservando o formato ("Dado de DES + 1" ou número fixo).
 * @param {string|number} valorBase
 * @param {number} bonusExtra
 * @param {string} [siglaAtributo='DES']
 * @returns {string|number}
 */
export function aplicarBonusDefensivoEquipamento(valorBase, bonusExtra = 0, siglaAtributo = 'DES') {
  const extra = Number(bonusExtra) || 0;
  if (extra === 0) return valorBase;

  if (typeof valorBase === 'number') {
    return valorBase + extra;
  }

  const texto = String(valorBase ?? 0).trim();
  const contemAtributo = /\b(des|destreza|ast|astucia|astúcia)\b/i.test(texto);
  const matchNum = texto.match(/-?\d+/);
  const numAtual = matchNum ? (parseInt(matchNum[0], 10) || 0) : 0;
  const soma = numAtual + extra;

  if (contemAtributo) {
    if (soma > 0) return `Dado de ${siglaAtributo} + ${soma}`;
    if (soma < 0) return `Dado de ${siglaAtributo} - ${Math.abs(soma)}`;
    return `Dado de ${siglaAtributo}`;
  }

  return soma;
}

/**
 * Resolve e valida uma característica especial (parametrizada ou padrão),
 * gerando textos formatados, listas estruturadas de espécies/resistências e bônus numéricos.
 * @param {Object|null} carac
 * @param {Object} [params={}]
 * @param {string} [params.especie1='Fera']
 * @param {string} [params.especie2='Monstro']
 * @param {string} [params.tipoDano1='Fogo']
 * @param {string} [params.tipoDano2='Gelo']
 * @returns {Object}
 */
export function resolverCaracteristicaParametrizada(carac, params = {}) {
  const bonusNumericos = extrairBonusNumericosCaracteristica(carac);
  if (!carac || carac.id === 'nenhuma') {
    return {
      possuiCaracteristica: false,
      tipoParametro: null,
      valido: true,
      erroValidacao: null,
      nomeFormatado: '',
      efeitoFormatado: '',
      especiesAlvo: [],
      resistencias: [],
      ...bonusNumericos,
      caracteristicaMeta: null
    };
  }

  const tipoParametro = identificarTipoParametroCaracteristica(carac);
  const esp1 = params.especie1 || ESPECIES_ALVO_EQUIPAMENTO[0];
  const esp2 = params.especie2 || ESPECIES_ALVO_EQUIPAMENTO[1];
  const dano1 = params.tipoDano1 || TIPOS_DANO_EQUIPAMENTO[1];
  const dano2 = params.tipoDano2 || TIPOS_DANO_EQUIPAMENTO[2];

  let valido = true;
  let erroValidacao = null;
  let nomeFormatado = carac.nome || '';
  let efeitoFormatado = carac.efeito || '';
  let especiesAlvo = [];
  let resistencias = [];

  if (tipoParametro === 'especie_1') {
    especiesAlvo = [esp1];
    nomeFormatado = `Caçadora (${esp1})`;
    efeitoFormatado = `Caçadora (${esp1}): Causa +5 de dano contra criaturas da espécie ${esp1}.`;
  } else if (tipoParametro === 'especie_2') {
    if (normalizarTextoSimples(esp1) === normalizarTextoSimples(esp2)) {
      valido = false;
      erroValidacao = 'Em "Dupla Caçadora", escolha 2 espécies diferentes!';
    }
    especiesAlvo = [esp1, esp2];
    nomeFormatado = `Dupla Caçadora (${esp1} e ${esp2})`;
    efeitoFormatado = `Dupla Caçadora (${esp1} e ${esp2}): Causa +5 de dano contra criaturas das espécies ${esp1} e ${esp2}.`;
  } else if (tipoParametro === 'dano_1') {
    resistencias = [dano1];
    nomeFormatado = `Resistência (${dano1})`;
    efeitoFormatado = `Resistência (${dano1}): Você tem Resistência a dano de ${dano1.toLowerCase()}.`;
  } else if (tipoParametro === 'dano_2') {
    if (normalizarTextoSimples(dano1) === normalizarTextoSimples(dano2)) {
      valido = false;
      erroValidacao = 'Em "Dupla Resistência", escolha 2 tipos de dano diferentes!';
    }
    resistencias = [dano1, dano2];
    nomeFormatado = `Dupla Resistência (${dano1} e ${dano2})`;
    efeitoFormatado = `Dupla Resistência (${dano1} e ${dano2}): Você tem Resistência a dano de ${dano1.toLowerCase()} e ${dano2.toLowerCase()}.`;
  }

  return {
    possuiCaracteristica: true,
    tipoParametro,
    valido,
    erroValidacao,
    nomeFormatado,
    efeitoFormatado,
    especiesAlvo,
    resistencias,
    ...bonusNumericos,
    caracteristicaMeta: {
      id: carac.id,
      nome: nomeFormatado,
      tipo_parametro: tipoParametro,
      ...(especiesAlvo.length > 0 ? { especies: especiesAlvo } : {}),
      ...(resistencias.length > 0 ? { resistencias } : {})
    }
  };
}

/**
 * Extrai um resumo estruturado das propriedades parametrizadas (Caçadora, Resistências, 2ª Forma)
 * de um item ou de seu objeto stats para exibição em cards, ficha e combate.
 * @param {Object} itemOuStats
 * @returns {{ especiesCacadora: Array<string>, resistencias: Array<string>, segundaForma: Object|null }}
 */
export function extrairResumoCaracteristicasEquipamento(itemOuStats) {
  if (!itemOuStats) {
    return { especiesCacadora: [], resistencias: [], segundaForma: null };
  }
  const stats = itemOuStats.stats_personalizados || itemOuStats.stats || itemOuStats;

  const especiesCacadora = Array.isArray(stats.especies_cacadora)
    ? stats.especies_cacadora.filter(Boolean)
    : Array.isArray(stats.caracteristica_especial?.especies)
      ? stats.caracteristica_especial.especies.filter(Boolean)
      : [];

  const resistencias = Array.isArray(stats.resistencias)
    ? stats.resistencias.filter(Boolean)
    : Array.isArray(stats.caracteristica_especial?.resistencias)
      ? stats.caracteristica_especial.resistencias.filter(Boolean)
      : [];

  const segundaForma = stats.segunda_forma && typeof stats.segunda_forma === 'object'
    ? stats.segunda_forma
    : null;

  return {
    especiesCacadora,
    resistencias,
    segundaForma
  };
}

/**
 * Formata um par chave/valor de stats de equipamento para exibição limpa em listas de atributos (ex: Loja).
 * @param {string} chave
 * @param {any} valor
 * @returns {string}
 */
export function formatarValorStatEquipamento(chave, valor) {
  if (valor === null || valor === undefined) return '';
  const chaveLower = String(chave || '').toLowerCase();

  if (chaveLower === 'segunda_forma' && typeof valor === 'object') {
    const partes = [
      valor.nome || '2ª Forma',
      valor.categoria,
      valor.alcance,
      valor.precisao || valor.precisao_tipo,
      valor.dano
    ].filter(Boolean);
    return partes.join(' • ');
  }

  if (chaveLower === 'caracteristica_especial' && typeof valor === 'object') {
    return valor.nome || '';
  }

  if (Array.isArray(valor)) {
    return valor.join(', ');
  }

  if (typeof valor === 'object') {
    return Object.entries(valor)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
  }

  return String(valor);
}

/**
 * Verifica se uma arma ou seus stats possuem a característica de atingir criaturas/alvos voadores.
 * @param {Object} itemOuStats
 * @returns {boolean}
 */
export function armaAtingeVoadores(itemOuStats) {
  if (!itemOuStats) return false;
  const stats = itemOuStats.stats_personalizados || itemOuStats.stats || itemOuStats;
  if (stats.atinge_voadores === true || stats.atingeVoadores === true) return true;

  const efeitos = Array.isArray(stats.efeitos) ? stats.efeitos : [];
  if (efeitos.some((e) => String(e).toLowerCase().includes('voador'))) return true;

  const desc = String(itemOuStats.descricao || stats.descricao || stats.qualidade || '').toLowerCase();
  if (desc.includes('atingir alvos voadores') || desc.includes('atingir criaturas voadoras') || desc.includes('alvo voador') || desc.includes('criaturas voadoras')) {
    return true;
  }

  return false;
}
