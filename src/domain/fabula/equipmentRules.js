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
  if (typeof valorBruto === 'number') return isNaN(valorBruto) ? 0 : valorBruto;
  if (!valorBruto) return 0;

  let str = String(valorBruto).trim().toLowerCase();
  str = str.replace(/dado de /g, '').replace(/dado /g, '');

  Object.keys(mapaAtributos).forEach((sigla) => {
    const regex = new RegExp(`\\b${sigla}\\b`, 'g');
    str = str.replace(regex, String(mapaAtributos[sigla]));
  });

  // Tenta parsing direto de inteiros com sinal (+2, -1, 10)
  const parseSimples = Number(str);
  if (!isNaN(parseSimples)) {
    return parseSimples;
  }

  // Sanitiza para operações aritméticas simples apenas (+, -, *, / e números)
  const expressaoLimpa = str.replace(/[^0-9+\-*/().\s]/g, '');
  try {
    // eslint-disable-next-line no-new-func
    const resultado = Function(`"use strict"; return (${expressaoLimpa || 0})`)();
    return typeof resultado === 'number' && !isNaN(resultado) ? Math.floor(resultado) : 0;
  } catch {
    return 0;
  }
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
  const stats = item.stats_personalizados || {};
  const tipo = (item.tipo || '').toLowerCase();
  return stats.marcial === true || tipo.includes('marcial') || tipo.includes('pesada');
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
    const temProficiencia = classes.some(c => {
      const ben = (c.beneficios || '').toLowerCase();
      return ben.includes('marcial') ||
        ben.includes('pesada') ||
        ben.includes('escudos') ||
        ben.includes('todos') ||
        ben.includes('armas corpo a corpo');
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
 * Calcula a Defesa Física (DEF), Defesa Mágica (M.DEF) e modificador de Iniciativa a partir dos atributos e itens equipados.
 * @param {Object} params
 * @param {Object} params.atributos { destreza, astucia, vigor, vontade }
 * @param {Array} params.itensEquipados Lista de itens equipados com stats_personalizados
 * @param {Array} params.classes Classes do personagem (para habilidades como Esquiva do Ladino)
 * @returns {{
 *   defesaBase: number,
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
  const vig = dadoParaNumero(atributos.vigor);
  const von = dadoParaNumero(atributos.vontade);

  const mapaAtributos = {
    des, destreza: des,
    ast, astucia: ast,
    vig, vigor: vig,
    von, vontade: von
  };

  const itemMaoDom = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.MAO_DOMINANTE);
  const itemMaoSec = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.MAO_SECUNDARIA);
  const itemArmadura = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.ARMADURA);
  const itemAcessorio = itensEquipados.find(i => i.stats_personalizados?.slot === SLOTS_EQUIPAMENTO.ACESSORIO);

  const temEscudoEquipado = isEscudo(itemMaoDom) || isEscudo(itemMaoSec);
  const temDoisEscudos = isEscudo(itemMaoDom) && isEscudo(itemMaoSec);
  const temArmaduraMarc = isArmaduraMarcial(itemArmadura);

  // 1. Defesa Física:
  // Se houver armadura com defesa fixa (como armadura marcial), usa-se a defesa da armadura como base.
  // Caso contrário, a base é o dado de Destreza.
  let defesaBase = des;
  let bonusDefesaItens = 0;

  if (itemArmadura) {
    const statsArm = itemArmadura.stats_personalizados || {};
    const defArmaduraBruta = statsArm.defesa ?? statsArm.def ?? 0;
    const defCalculada = resolverValorNumerico(defArmaduraBruta, mapaAtributos);
    if (defCalculada > 0) {
      defesaBase = defCalculada;
    }
  }

  [itemMaoDom, itemMaoSec, itemAcessorio].forEach(item => {
    if (item) {
      const stats = item.stats_personalizados || {};
      const defBruta = stats.defesa ?? stats.def ?? 0;
      bonusDefesaItens += resolverValorNumerico(defBruta, mapaAtributos);
    }
  });

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

  // 2. Defesa Mágica (M.DEF):
  // Base é o dado de Astúcia + bônus de itens (armadura, escudos, acessórios)
  let mdefBase = ast;
  let bonusMDefItens = 0;

  [itemArmadura, itemMaoSec, itemMaoDom, itemAcessorio].forEach(item => {
    if (item) {
      const stats = item.stats_personalizados || {};
      const mdefBruta =
        stats['defesa magica'] ??
        stats['defesa mágica'] ??
        stats.mdefesa ??
        stats.mdef ??
        stats.defesa_magica ??
        0;

      const mdefCalculada = resolverValorNumerico(mdefBruta, mapaAtributos);
      if (typeof mdefBruta === 'string' && mdefBruta.toLowerCase().includes('base')) {
        mdefBase = Math.max(mdefBase, mdefCalculada);
      } else {
        bonusMDefItens += mdefCalculada;
      }
    }
  });

  const mdefTotal = mdefBase + bonusMDefItens;

  // 3. Penalidade / Modificador de Iniciativa total vindo dos itens
  let iniciativaTotal = 0;
  [itemArmadura, itemMaoSec, itemMaoDom, itemAcessorio].forEach(item => {
    if (item) {
      const stats = item.stats_personalizados || {};
      const iniBruta = stats.iniciativa ?? stats.ini ?? stats.Iniciativa ?? 0;
      iniciativaTotal += parseInt(iniBruta, 10) || 0;
    }
  });

  return {
    defesaBase,
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
