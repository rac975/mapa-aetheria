/**
 * Fabula Ultima - Resolução de Feitiços e Magias em Conflito
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { normalizarTextoCore } from './coreClassRules.js';

export function classificarTipoMagia(magia = {}) {
  if (magia.isArcano) return 'arcano';

  const descNorm = normalizarTextoCore(magia.descricao || '');
  const nomeNorm = normalizarTextoCore(magia.nome || '');
  const textoCompleto = `${nomeNorm} ${descNorm}`;

  const isExplicitamenteOfensiva = Boolean(magia.ofensiva);
  const temDano = Number(magia.bonusDano) > 0 || Number(magia.danoBase) > 0 || Boolean(magia.tipoDano && magia.tipoDano !== 'magico');
  const temPalavrasHostis = textoCompleto.includes('sofre dano') || textoCompleto.includes('causa dano') || textoCompleto.includes('ataque magico') || textoCompleto.includes('teste de magia');

  if (isExplicitamenteOfensiva || temDano || temPalavrasHostis) {
    return 'ofensiva';
  }

  const isCuraPv = textoCompleto.includes('recupera') && (textoCompleto.includes('pv') || textoCompleto.includes('pontos de vida'));
  const isCuraPm = textoCompleto.includes('recupera') && (textoCompleto.includes('pm') || textoCompleto.includes('pontos de mente'));
  const isLimpaCondicao = textoCompleto.includes('cura') || textoCompleto.includes('remove') || textoCompleto.includes('condicao') || textoCompleto.includes('condicoes');

  if (isCuraPv || isCuraPm || isLimpaCondicao) {
    return 'suporte';
  }

  return 'utilidade';
}

export function extrairValorCuraMagia(magia = {}) {
  const desc = normalizarTextoCore(magia.descricao || '');
  const nome = normalizarTextoCore(magia.nome || '');
  const texto = `${nome} ${desc}`;

  let valorPv = 0;
  let valorPm = 0;

  const matchPv = texto.match(/recupera\s+(\d+)\s*(?:pv|pontos?\s+de\s+vida)/i) || texto.match(/(\d+)\s*pv/i);
  if (matchPv) valorPv = parseInt(matchPv[1], 10) || 0;

  const matchPm = texto.match(/recupera\s+(\d+)\s*(?:pm|pontos?\s+de\s+mente)/i);
  if (matchPm) valorPm = parseInt(matchPm[1], 10) || 0;

  return { valorPv, valorPm };
}

export function calcularCustoEfetivoMagia({
  magia = {},
  quantidadeAlvos = 1,
  decretoDobrarPm = false,
  usarVismagus = false
} = {}) {
  const rawCusto = String(magia.custoPm || magia.custo_mp || magia.custo || '10');
  const matchNum = rawCusto.match(/\d+/);
  const baseNum = matchNum ? parseInt(matchNum[0], 10) || 10 : 10;

  const isMultiplicativoPorAlvo = rawCusto.toLowerCase().includes('x a') || rawCusto.toLowerCase().includes('xa') || rawCusto.toLowerCase().includes('por alvo') || Boolean(magia.custoPorAlvo);
  const fatorAlvos = isMultiplicativoPorAlvo ? Math.max(1, quantidadeAlvos) : 1;
  const custoBase = baseNum * fatorAlvos;

  const custoPmFinal = decretoDobrarPm ? custoBase * 2 : custoBase;
  const custoPvFinal = usarVismagus ? custoPmFinal : 0;

  return {
    custoPm: usarVismagus ? 0 : custoPmFinal,
    custoPv: custoPvFinal,
    custoBaseOriginal: baseNum,
    isMultiplicativoPorAlvo,
    quantidadeAlvos: fatorAlvos
  };
}

export function validarRecursoConjuracao({
  combatente = {},
  custoPm = 0,
  custoPv = 0
} = {}) {
  const mpAtual = Number(combatente.mp_atual ?? combatente.mp ?? combatente.pontos_mente) || 0;
  const hpAtual = Number(combatente.hp_atual ?? combatente.hp ?? combatente.pontos_vida) || 0;

  if (custoPv > 0 && hpAtual <= custoPv) {
    return {
      valido: false,
      erro: `${combatente.nome || 'Conjurador'} não possui PV suficientes para conjurar via Vismagus (requer ${custoPv} PV sem cair a 0 PV).`
    };
  }

  if (custoPm > 0 && mpAtual < custoPm) {
    return {
      valido: false,
      erro: `${combatente.nome || 'Conjurador'} não possui PM suficientes (requer ${custoPm} PM, possui ${mpAtual} PM).`
    };
  }

  return { valido: true, mpAtual, hpAtual };
}

export function resolverFeiticoSuporteCura({
  magia = {},
  conjurador = {},
  alvos = [],
  custoPm = 0,
  custoPv = 0,
  bonusPoderCurativo = 0
} = {}) {
  const { valorPv, valorPm } = extrairValorCuraMagia(magia);
  const alvosEfetivos = Array.isArray(alvos) && alvos.length > 0 ? alvos : [conjurador];
  const updatesAlvos = [];
  const detalhesAlvos = [];

  const curaPvFinal = valorPv > 0 ? valorPv + Math.max(0, Number(bonusPoderCurativo) || 0) : 0;

  for (const alvo of alvosEfetivos) {
    if (!alvo) continue;
    const updates = { id: alvo.id };
    const partes = [];

    if (curaPvFinal > 0) {
      const hpBase = Number(alvo.hp_atual ?? alvo.hp) || 0;
      const hpMax = Number(alvo.hp_max) || hpBase || 40;
      updates.hp_atual = Math.min(hpMax, hpBase + curaPvFinal);
      partes.push(`+${curaPvFinal} PV`);
    }

    if (valorPm > 0) {
      const mpBase = Number(alvo.mp_atual ?? alvo.mp) || 0;
      const mpMax = Number(alvo.mp_max) || mpBase || 40;
      updates.mp_atual = Math.min(mpMax, mpBase + valorPm);
      partes.push(`+${valorPm} PM`);
    }

    const desc = normalizarTextoCore(magia.descricao || '');
    if (desc.includes('cura uma condicao') || desc.includes('todas as condicoes') || desc.includes('limpa')) {
      updates.condicoes = [];
      partes.push('condições curadas');
    }

    updatesAlvos.push(updates);
    detalhesAlvos.push(`${alvo.nome || 'Alvo'}: ${partes.join(', ') || 'Efeito de Suporte aplicado'}`);
  }

  const tagCusto = [custoPm > 0 ? `-${custoPm} PM` : null, custoPv > 0 ? `-${custoPv} PV (Vismagus)` : null].filter(Boolean).join(' • ');
  const detalhes = `✨ Feitiço: ${magia.nome}${tagCusto ? ` [${tagCusto}]` : ''} • ${detalhesAlvos.join(' | ')}`;

  return {
    valido: true,
    curaPvFinal,
    curaPmFinal: valorPm,
    updatesAlvos,
    detalhes,
    logEntry: {
      combatente_id: conjurador.id || null,
      autor_nome: conjurador.nome || 'Conjurador',
      autor_tipo: conjurador.tipo || 'heroi',
      acao_codigo: 'CONJURAR',
      acao_titulo: `Feitiço: ${magia.nome}`,
      detalhes,
      metadata: {
        magia_nome: magia.nome,
        custo_pm: custoPm,
        custo_pv: custoPv,
        alvos_afetados: alvosEfetivos.map((a) => a.nome || a.id)
      }
    }
  };
}
