/**
 * Fabula Ultima - Regras da Classe Quimerista (Chimerist) e Imitação Mágica
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

export const ESPECIES_OFICIAIS_QUIMERISTA = Object.freeze([
  { id: 'monstro', label: 'Monstro', icone: '🐉' },
  { id: 'fera', label: 'Fera', icone: '🐾' },
  { id: 'planta', label: 'Planta', icone: '🌿' }
]);

export const ALCANCES_FEITICO = Object.freeze({
  DISTANCIA: 'distancia',
  CORPO_A_CORPO: 'corpo_a_corpo',
  PESSOAL: 'pessoal'
});

export const ALVOS_FEITICO = Object.freeze({
  UNICO: 'unico',
  MULTI: 'multi',
  AREA: 'area',
  PESSOAL: 'pessoal'
});

export const CONDICOES_FEITICO = Object.freeze([
  { id: 'abalado', label: 'Abalado', icone: '💫' },
  { id: 'atordoado', label: 'Atordoado', icone: '⚡' },
  { id: 'enfurecido', label: 'Enfurecido', icone: '🔥' },
  { id: 'envenenado', label: 'Envenenado', icone: '🧪' },
  { id: 'fraco', label: 'Fraco', icone: '💀' },
  { id: 'lento', label: 'Lento', icone: '⏳' }
]);

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Retorna as espécies permitidas, preservando valores legados se existirem.
 */
export function obterOpcoesEspecies(especieAtual = '') {
  const normAtual = normalizarTexto(especieAtual);
  const opcoes = [...ESPECIES_OFICIAIS_QUIMERISTA];
  if (normAtual && !opcoes.some((e) => e.id === normAtual)) {
    opcoes.push({
      id: normAtual,
      label: `${especieAtual.charAt(0).toUpperCase() + especieAtual.slice(1)} (Salvo)`,
      icone: '✨'
    });
  }
  return opcoes;
}

export function inferirAlcanceFeitico(feitico) {
  if (!feitico) return ALCANCES_FEITICO.DISTANCIA;
  const rawAlcance = normalizarTexto(feitico.alcance || feitico.tipo_alcance);
  if (rawAlcance === 'corpo_a_corpo' || rawAlcance.includes('corpo a corpo') || rawAlcance === 'cac') {
    return ALCANCES_FEITICO.CORPO_A_CORPO;
  }
  if (rawAlcance === 'pessoal') return ALCANCES_FEITICO.PESSOAL;
  if (rawAlcance === 'distancia' || rawAlcance.includes('distancia')) return ALCANCES_FEITICO.DISTANCIA;

  const textoGeral = normalizarTexto(`${feitico.nome || ''} ${feitico.alvo || ''} ${feitico.descricao || ''} ${feitico.efeito || ''}`);
  if (textoGeral.includes('corpo a corpo') || textoGeral.includes('toque')) return ALCANCES_FEITICO.CORPO_A_CORPO;
  if (textoGeral.includes('pessoal') || textoGeral.includes('em si')) return ALCANCES_FEITICO.PESSOAL;
  return ALCANCES_FEITICO.DISTANCIA;
}

export function inferirAlvoFeitico(feitico) {
  if (!feitico) return { tipo: ALVOS_FEITICO.UNICO, numeroAlvos: 1, label: 'Alvo Único' };

  const rawTipo = normalizarTexto(feitico.alvo_tipo || feitico.tipo_alvo);
  const numAlvosManual = parseInt(feitico.numero_alvos || feitico.numeroAlvos, 10) || null;

  if (rawTipo === ALVOS_FEITICO.AREA || rawTipo.includes('area') || rawTipo.includes('todos')) {
    return { tipo: ALVOS_FEITICO.AREA, numeroAlvos: null, label: 'Em Área (Todos)' };
  }
  if (rawTipo === ALVOS_FEITICO.PESSOAL) return { tipo: ALVOS_FEITICO.PESSOAL, numeroAlvos: 1, label: 'Pessoal' };
  if (rawTipo === ALVOS_FEITICO.MULTI) {
    const n = numAlvosManual || 2;
    return { tipo: ALVOS_FEITICO.MULTI, numeroAlvos: n, label: `Até ${n} Alvos` };
  }
  if (rawTipo === ALVOS_FEITICO.UNICO) return { tipo: ALVOS_FEITICO.UNICO, numeroAlvos: 1, label: 'Alvo Único' };

  const txt = normalizarTexto(`${feitico.alvo || ''} ${feitico.descricao || ''} ${feitico.efeito || ''}`);
  if (txt.includes('todas as criaturas') || txt.includes('todos os inimigos') || txt.includes('em area')) {
    return { tipo: ALVOS_FEITICO.AREA, numeroAlvos: null, label: 'Em Área (Todos)' };
  }
  if (txt.includes('ate 4') || txt.includes('ate quatro')) return { tipo: ALVOS_FEITICO.MULTI, numeroAlvos: 4, label: 'Até 4 Alvos' };
  if (txt.includes('ate 3') || txt.includes('ate tres')) return { tipo: ALVOS_FEITICO.MULTI, numeroAlvos: 3, label: 'Até 3 Alvos' };
  if (txt.includes('ate 2') || txt.includes('ate duas')) return { tipo: ALVOS_FEITICO.MULTI, numeroAlvos: 2, label: 'Até 2 Alvos' };
  if (txt.includes('pessoal') || txt.includes('voce')) return { tipo: ALVOS_FEITICO.PESSOAL, numeroAlvos: 1, label: 'Pessoal' };

  return { tipo: ALVOS_FEITICO.UNICO, numeroAlvos: 1, label: 'Alvo Único' };
}

export function inferirBonusDanoFeitico(feitico) {
  if (feitico?.bonus_dano !== undefined && feitico?.bonus_dano !== '') {
    return Math.max(0, parseInt(feitico.bonus_dano, 10) || 0);
  }
  if (feitico?.dano_bonus !== undefined && feitico?.dano_bonus !== '') {
    return Math.max(0, parseInt(feitico.dano_bonus, 10) || 0);
  }
  const txt = normalizarTexto(`${feitico?.descricao || ''} ${feitico?.efeito || ''}`);
  const match = txt.match(/\+\s*(\d+)\s*(?:pontos de dano|de dano|dano)/i);
  return match ? Math.max(0, parseInt(match[1], 10) || 0) : 0;
}

export function inferirCondicaoFeitico(feitico) {
  if (feitico?.condicao) {
    const raw = normalizarTexto(feitico.condicao);
    const achado = CONDICOES_FEITICO.find((c) => c.id === raw);
    if (achado) return achado.id;
  }
  const txt = normalizarTexto(`${feitico?.descricao || ''} ${feitico?.efeito || ''}`);
  if (txt.includes('envenenad')) return 'envenenado';
  if (txt.includes('lent')) return 'lento';
  if (txt.includes('abalad')) return 'abalado';
  if (txt.includes('atordoad')) return 'atordoado';
  if (txt.includes('frac') || txt.includes('enfraquecid')) return 'fraco';
  if (txt.includes('enfurecid')) return 'enfurecido';
  return '';
}

export function formatarBadgeAlcance(alcance) {
  if (alcance === ALCANCES_FEITICO.CORPO_A_CORPO) return { id: ALCANCES_FEITICO.CORPO_A_CORPO, icone: '⚔️', label: 'Corpo a Corpo' };
  if (alcance === ALCANCES_FEITICO.PESSOAL) return { id: ALCANCES_FEITICO.PESSOAL, icone: '👤', label: 'Pessoal' };
  return { id: ALCANCES_FEITICO.DISTANCIA, icone: '🏹', label: 'À Distância' };
}

export function formatarBadgeAlvo(alvoInfo) {
  const tipo = typeof alvoInfo === 'string' ? alvoInfo : alvoInfo?.tipo;
  const num = typeof alvoInfo === 'object' ? alvoInfo?.numeroAlvos : null;
  if (tipo === ALVOS_FEITICO.AREA) return { id: ALVOS_FEITICO.AREA, icone: '💥', label: 'Em Área (Todos)' };
  if (tipo === ALVOS_FEITICO.MULTI) return { id: ALVOS_FEITICO.MULTI, icone: '👥', label: num ? `Até ${num} Alvos` : 'Múltiplos' };
  if (tipo === ALVOS_FEITICO.PESSOAL) return { id: ALVOS_FEITICO.PESSOAL, icone: '👤', label: 'Pessoal' };
  return { id: ALVOS_FEITICO.UNICO, icone: '🎯', label: 'Alvo Único' };
}

export function formatarBadgeCondicao(condicao) {
  if (!condicao) return null;
  const norm = normalizarTexto(condicao);
  return CONDICOES_FEITICO.find((c) => c.id === norm) || null;
}

export function normalizarFeiticoQuimerista(feitico, index = 0) {
  if (!feitico) return null;
  const alcance = inferirAlcanceFeitico(feitico);
  const alvoInfo = inferirAlvoFeitico(feitico);
  const bonusDano = inferirBonusDanoFeitico(feitico);
  const condicao = inferirCondicaoFeitico(feitico);

  return {
    id: feitico.id || `quim-${Date.now()}-${index}`,
    nome: (feitico.nome || '').trim(),
    custo_mp: feitico.custo_mp !== undefined ? String(feitico.custo_mp).trim() : '',
    especie: (feitico.especie || 'monstro').toLowerCase().trim(),
    alcance,
    alvo_tipo: alvoInfo.tipo,
    numero_alvos: alvoInfo.numeroAlvos,
    bonus_dano: bonusDano,
    condicao,
    descricao: (feitico.descricao || feitico.efeito || '').trim()
  };
}
