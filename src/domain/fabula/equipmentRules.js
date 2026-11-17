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
  const stats = item.stats_personalizados || {};
  return tipo.includes('escudo') || stats.escudo === true;
}

/**
 * Identifica se um item é classificado como armadura marcial/pesada.
 * @param {Object} item
 * @returns {boolean}
 */
export function isArmaduraMarcial(item) {
  if (!item) return false;
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
  const stats = item.stats_personalizados || {};
  return tipo.includes('2h') || stats.duas_maos === true || stats.maos === 2;
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

  const itemMaoDom = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.MAO_DOMINANTE);
  const itemMaoSec = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
  const itemArmadura = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.ARMADURA);
  const itemAcessorio = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.ACESSORIO);

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
      dano: `HR + ${bonusDanoAcro}`,
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
      dano: 'HR + 2',
      bonus_dano: 2,
      tipo_dano: 'fisico',
      maos: 1,
      qualidade: 'Destrói-se após o ataque.'
    }
  };
}
