import { rolarDadosCombate, estaDerrotado, construirCombatente as construirCombatenteBase } from './combatRules.js';
import { calcularDefesasEIniciativa } from './equipmentRules.js';
import { calcularIniciativaNpc, dadoParaNumero } from './npcRules.js';

/**
 * Fabula Ultima - Regras Puras de Iniciativa e Tokens de Ação
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 */

export function construirCombatente(params = {}) {
  const base = construirCombatenteBase(params);
  const ini = Math.floor(Number(params.iniciativa)) || 0;
  base.iniciativa = ini;
  base.modificadores = {
    ...(base.modificadores || {}),
    iniciativa: ini,
    ...(params.iniciativaMod !== undefined ? { iniciativa_mod: Number(params.iniciativaMod) || 0 } : {})
  };
  return base;
}

export function sanitizarPayloadIniciativa(payload = {}) {
  const resultado = { ...payload };
  if (resultado.maxHp !== undefined) {
    resultado.hp_max = resultado.maxHp;
    delete resultado.maxHp;
  }
  if (resultado.maxMp !== undefined) {
    resultado.mp_max = resultado.maxMp;
    delete resultado.maxMp;
  }
  if (resultado.iniciativa !== undefined) {
    resultado.iniciativa = Math.floor(Number(resultado.iniciativa)) || 0;
  }
  return resultado;
}

export function extrairIniciativaCombatente(combatente) {
  if (!combatente) return 0;
  if (combatente.iniciativa !== undefined && combatente.iniciativa !== null) {
    const n = Number(combatente.iniciativa);
    if (Number.isFinite(n)) return Math.floor(n);
  }
  if (combatente.modificadores?.iniciativa !== undefined && combatente.modificadores?.iniciativa !== null) {
    const n = Number(combatente.modificadores.iniciativa);
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return 0;
}

/**
 * Extrai o Modificador de Iniciativa da ficha de um Herói (positivo, negativo ou 0).
 */
export function extrairModificadorIniciativaHeroi(combatente, ficha = null, perfil = null) {
  if (ficha?.statusCalculados?.iniciativaTotal !== undefined) {
    return Math.trunc(Number(ficha.statusCalculados.iniciativaTotal) || 0);
  }
  if (ficha?.iniciativa !== undefined && ficha?.iniciativa !== null) {
    return Math.trunc(Number(ficha.iniciativa) || 0);
  }
  if (ficha && Array.isArray(ficha.itens)) {
    const equipados = ficha.itens.filter((i) => i.equipado || i.stats_personalizados?.slot);
    const calc = calcularDefesasEIniciativa({
      atributos: ficha,
      itensEquipados: equipados,
      classes: ficha.classes || ficha.fichas_classes || []
    });
    return Math.trunc(Number(calc.iniciativaTotal) || 0);
  }
  if (combatente?.modificadores?.iniciativa_mod !== undefined) {
    return Math.trunc(Number(combatente.modificadores.iniciativa_mod) || 0);
  }
  if (perfil?.iniciativaMod !== undefined && perfil?.iniciativaMod !== null) {
    return Math.trunc(Number(perfil.iniciativaMod) || 0);
  }
  return 0;
}

/**
 * Obtém a Iniciativa fixa da ficha de um Inimigo/NPC (Inimigos não rolam iniciativa em Fabula Ultima).
 * Inclui fallback seguro baseado em DES, AST e patente (Soldado/Elite/Campeão).
 */
export function extrairIniciativaFixaInimigo(combatente, npc = null, perfil = null) {
  if (npc?.iniciativa !== undefined && npc?.iniciativa !== null && Number(npc.iniciativa) > 0) {
    return Math.floor(Number(npc.iniciativa));
  }
  const iniSalva = extrairIniciativaCombatente(combatente);
  if (iniSalva > 0) return iniSalva;

  if (npc?.atributos) {
    return calcularIniciativaNpc({
      desNum: dadoParaNumero(npc.atributos.des),
      astNum: dadoParaNumero(npc.atributos.ast),
      rank: npc.rank || combatente?.tipo_vilao || 'soldado',
      quantidadeSoldados: npc.quantidade_soldados || combatente?.acoes_por_turno || 2
    });
  }
  if (perfil?.iniciativaFixaNpc > 0) return Math.floor(Number(perfil.iniciativaFixaNpc));
  if (perfil?.iniciativaMod > 0) return Math.floor(Number(perfil.iniciativaMod));

  const desNum = Number(perfil?.atributosAtuais?.des) || 8;
  const astNum = Number(perfil?.atributosAtuais?.ast) || 8;
  const rank = combatente?.tipo_vilao === 'campeao'
    ? 'campeao'
    : combatente?.tipo_vilao === 'elite'
      ? 'elite'
      : 'soldado';
  return calcularIniciativaNpc({
    desNum,
    astNum,
    rank,
    quantidadeSoldados: Math.max(2, Number(combatente?.acoes_por_turno) || 2)
  });
}

export function ordenarCombatentesPorIniciativa(combatentes = []) {
  if (!Array.isArray(combatentes)) return [];
  const copia = [...combatentes];

  copia.sort((a, b) => {
    const iniA = extrairIniciativaCombatente(a);
    const iniB = extrairIniciativaCombatente(b);
    if (iniB !== iniA) return iniB - iniA;

    const aEhHeroi = a.tipo === 'heroi';
    const bEhHeroi = b.tipo === 'heroi';
    if (aEhHeroi && !bEhHeroi) return -1;
    if (!aEhHeroi && bEhHeroi) return 1;

    return (Number(a.ordem) || 0) - (Number(b.ordem) || 0);
  });

  return copia.map((item, idx) => ({ ...item, ordem: idx }));
}

export function calcularContadoresAcoesRodada(combatentes = []) {
  if (!Array.isArray(combatentes)) {
    return {
      totalVivos: 0,
      pendentesCombatentes: 0,
      totalAcoesRodada: 0,
      acoesRealizadasRodada: 0,
      acoesPendentesRodada: 0
    };
  }

  const vivos = combatentes.filter((c) => !estaDerrotado(c.hp_atual));
  let totalAcoesRodada = 0;
  let acoesRealizadasRodada = 0;

  vivos.forEach((c) => {
    const acoes = c.tipo === 'heroi' ? 1 : Math.max(1, Number(c.acoes_por_turno) || 1);
    const realizadas = c.tipo === 'heroi'
      ? (c.agiu ? 1 : 0)
      : Math.max(0, Math.min(acoes, Number(c.modificadores?.acoes_realizadas_rodada) || (c.agiu ? acoes : 0)));

    totalAcoesRodada += acoes;
    acoesRealizadasRodada += realizadas;
  });

  return {
    totalVivos: vivos.length,
    pendentesCombatentes: vivos.filter((c) => !c.agiu).length,
    totalAcoesRodada,
    acoesRealizadasRodada,
    acoesPendentesRodada: Math.max(0, totalAcoesRodada - acoesRealizadasRodada)
  };
}

export function obterSlotsAcoesInimigo(combatente) {
  if (!combatente || combatente.tipo === 'heroi') return [];
  const totalAcoes = Math.max(1, Number(combatente.acoes_por_turno) || 1);
  if (totalAcoes <= 1) return [];

  const realizadas = Math.max(
    0,
    Math.min(
      totalAcoes,
      Number(combatente.modificadores?.acoes_realizadas_rodada) || (combatente.agiu ? totalAcoes : 0)
    )
  );

  const slots = [];
  for (let i = 1; i <= totalAcoes; i++) {
    const concluida = i <= realizadas;
    const isProxima = !combatente.agiu && i === realizadas + 1;
    slots.push({
      numero: i,
      rotulo: `Ação ${i}`,
      concluida,
      isProxima,
      isPendente: i > realizadas && !isProxima
    });
  }
  return slots;
}

export function rolarIniciativaCombate({
  combatente = {},
  perfil = null,
  valoresFixos = null
} = {}) {
  const modIni = perfil?.iniciativaMod !== undefined && perfil?.iniciativaMod !== null
    ? Number(perfil.iniciativaMod) || 0
    : (Number(combatente?.modificadores?.iniciativa_mod ?? combatente?.modificadores?.iniciativa) || 0);

  return rolarDadosCombate({
    combatente,
    perfil,
    categoria: 'iniciativa',
    titulo: 'Iniciativa',
    attr1: 'des',
    attr2: 'ast',
    bonusTeste: modIni,
    isOposto: true,
    valoresFixos
  });
}
