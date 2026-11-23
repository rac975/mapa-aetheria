/**
 * Regras puras de Fabula Ultima para a classe Arcanista (Arcanist).
 * Concentra o mapeamento de habilidades (Vincular e Invocar, Arcano Emergencial,
 * Círculo Arcano, Regeneração Arcana, Arcanismo Ritualista) e resolução de ações
 * de invocação e dispensa em conflito sem dependências de React ou Supabase.
 */

import {
  obterNivelHabilidade,
  normalizarTextoCore,
  extrairArcanosVinculados
} from './coreClassRules.js';

/**
 * Normaliza os poderes heroicos para verificação rápida.
 * @param {Array} poderesHeroicos
 * @returns {Set<string>}
 */
function normalizarPoderesHeroicos(poderesHeroicos = []) {
  const set = new Set();
  (Array.isArray(poderesHeroicos) ? poderesHeroicos : []).forEach((p) => {
    const txt = typeof p === 'string'
      ? p
      : `${p?.key || ''} ${p?.nome || ''} ${p?.nome_original || ''}`;
    set.add(normalizarTextoCore(txt));
  });
  return set;
}

/**
 * Detecta o tipo de dano a partir da descrição textual do efeito de dispensa.
 * @param {string} texto
 * @returns {string}
 */
export function extrairTipoDanoDispensa(texto = '') {
  const norm = normalizarTextoCore(texto);
  if (norm.includes('fogo')) return 'fogo';
  if (norm.includes('gelo')) return 'gelo';
  if (norm.includes('luz')) return 'luz';
  if (norm.includes('raio')) return 'raio';
  if (norm.includes('terra')) return 'terra';
  if (norm.includes('trevas') || norm.includes('sombrio')) return 'sombrio';
  if (norm.includes('veneno')) return 'veneno';
  if (norm.includes('ar') || norm.includes('vento')) return 'ar';
  return 'magico';
}

/**
 * Calcula o bônus de escala oficial de Fabula Ultima para efeitos de dispensa do Arcanista:
 * +10 no nível 20+ e +20 no nível 40+.
 * @param {number} nivelTotal
 * @returns {number}
 */
export function calcularBonusEscalaDispensa(nivelTotal = 5) {
  const nv = parseInt(nivelTotal, 10) || 0;
  if (nv >= 40) return 20;
  if (nv >= 20) return 10;
  return 0;
}

/**
 * Calcula os parâmetros de dano e tipo para a dispensa de um Arcano.
 * @param {Object} params
 * @param {Object} params.arcano
 * @param {number} [params.nivelTotal=5]
 * @param {number} [params.danoBase=30]
 * @returns {{ danoTotal: number, tipoDano: string, bonusEscala: number, nomeEfeito: string, efeitoTexto: string }}
 */
export function calcularEfeitoDispensaArcano({ arcano = {}, nivelTotal = 5, danoBase = 30 } = {}) {
  const bonusEscala = calcularBonusEscalaDispensa(nivelTotal);
  const efeitoTexto = arcano.dispensar_efeito || arcano.efeito_descarte || arcano.descricao || '';
  const nomeEfeito = arcano.dispensar_nome || 'Dispensa de Arcano';
  const tipoDano = extrairTipoDanoDispensa(efeitoTexto);

  const temDanoNumerico = /\b(\d+)\s*(?:pontos?\s+de\s+dano|dano)\b/i.test(efeitoTexto) || danoBase > 0;
  const danoTotal = temDanoNumerico ? danoBase + bonusEscala : 0;

  return {
    danoTotal,
    tipoDano,
    bonusEscala,
    nomeEfeito,
    efeitoTexto
  };
}

/**
 * Extrai o estado completo das habilidades e poderes de Arcanista de um herói.
 * @param {Object} params
 * @returns {Object} Mapeamento completo da classe Arcanista
 */
export function extrairHabilidadesArcanista({
  classes = [],
  poderesHeroicos = [],
  ficha = null,
  emCrise = false
} = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const classeArcanista = listaClasses.find((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('arcanista') || nome.includes('arcanist');
  });

  const temClasseArcanista = Boolean(classeArcanista);
  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvVincularInvocar = obterNivelHabilidade(listaClasses, 'arcanista', 'vincular e invocar') || (temClasseArcanista ? 1 : 0);
  const nvArcanoEmergencial = obterNivelHabilidade(listaClasses, 'arcanista', 'arcano emergencial');
  const nvCirculoArcano = obterNivelHabilidade(listaClasses, 'arcanista', 'circulo arcano');
  const nvRegeneracaoArcana = obterNivelHabilidade(listaClasses, 'arcanista', 'regeneracao arcana');
  const nvArcanismoRitualista = obterNivelHabilidade(listaClasses, 'arcanista', 'arcanismo ritualista');

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;
  const descontoEmergencial = emCrise ? nvArcanoEmergencial * 5 : 0;
  const custoInvocacaoPadrao = Math.max(0, 40 - descontoEmergencial);
  const curaRegeneracao = nvRegeneracaoArcana * 5;
  const bonusEscalaDispensa = calcularBonusEscalaDispensa(nivelTotal);
  const circuloArcanoCustoMax = nvCirculoArcano * 5;

  const arcanosVinculados = temClasseArcanista
    ? extrairArcanosVinculados(classeArcanista, ficha)
    : [];

  return {
    temClasseArcanista,
    nivelTotal,
    habilidades: {
      vincularInvocar: { nivel: nvVincularInvocar, ativo: nvVincularInvocar > 0 },
      arcanoEmergencial: { nivel: nvArcanoEmergencial, ativo: nvArcanoEmergencial > 0, desconto: descontoEmergencial },
      circuloArcano: { nivel: nvCirculoArcano, ativo: nvCirculoArcano > 0, custoMaximoFeitico: circuloArcanoCustoMax },
      regeneracaoArcana: { nivel: nvRegeneracaoArcana, ativo: nvRegeneracaoArcana > 0, curaPv: curaRegeneracao },
      arcanismoRitualista: { nivel: nvArcanismoRitualista, ativo: nvArcanismoRitualista > 0 }
    },
    custoInvocacaoPadrao,
    curaRegeneracao,
    bonusEscalaDispensa,
    arcanosVinculados,
    poderesHeroicos: {
      adversidade: Array.from(poderesSet).some((p) => p.includes('adversidade')),
      ecosArcanos: Array.from(poderesSet).some((p) => p.includes('ecos arcanos')),
      revelacao: Array.from(poderesSet).some((p) => p.includes('revelacao')),
      grandeInvocacao: Array.from(poderesSet).some((p) => p.includes('grande invocacao')),
      soldadoArcano: Array.from(poderesSet).some((p) => p.includes('soldado arcano'))
    }
  };
}

/**
 * Gera as ações de conflito oficiais da classe Arcanista para a Central de Turno.
 * @param {Object} params
 * @returns {Array<Object>}
 */
export function gerarAcoesConflitoArcanista({
  classes = [],
  poderesHeroicos = [],
  ficha = null,
  emCrise = false,
  modificadoresCena = {}
} = {}) {
  const dados = extrairHabilidadesArcanista({ classes, poderesHeroicos, ficha, emCrise });
  if (!dados.temClasseArcanista || dados.arcanosVinculados.length === 0) {
    return [];
  }

  const acoes = [];
  const custoBase = dados.custoInvocacaoPadrao;
  const custoPmFinal = modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase;

  dados.arcanosVinculados.forEach((arc, idx) => {
    const nomeArcano = typeof arc === 'string' ? arc : (arc?.nome || `Arcano ${idx + 1}`);
    const objArcano = typeof arc === 'object' ? arc : { nome: nomeArcano };
    const efeitoInvocacao = objArcano.fundir || objArcano.efeito_invocacao || objArcano.descricao || '';
    const infoDisp = calcularEfeitoDispensaArcano({ arcano: objArcano, nivelTotal: dados.nivelTotal });

    // 1. Ação de Invocação Automática (Sem Teste)
    acoes.push({
      id: `arcano_invocar_${idx}`,
      codigo: 'INVOCAR_ARCANO',
      nome: `Invocar: ${nomeArcano}`,
      nomeArcano,
      tipo: 'invocacao_arcano',
      classe: 'Arcanista',
      custoPm: custoPmFinal,
      curaRegeneracao: dados.curaRegeneracao,
      isArcano: true,
      ofensiva: false,
      efeitoInvocacao,
      dispensarNome: infoDisp.nomeEfeito,
      dispensarEfeito: infoDisp.efeitoTexto,
      descricao: efeitoInvocacao || 'Invoca e funde o Arcano à sua alma sem teste de atributo.',
      resumoEfeito: `Invocação Automática (${custoPmFinal} PM)${dados.curaRegeneracao > 0 ? ` • Regenera +${dados.curaRegeneracao} PV` : ''}`
    });

    // 2. Ação de Dispensa do Arcano
    acoes.push({
      id: `arcano_dispensar_${idx}`,
      codigo: 'DISPENSAR_ARCANO',
      nome: `Dispensar: ${nomeArcano} (${infoDisp.nomeEfeito})`,
      nomeCurto: `Dispensar ${nomeArcano}`,
      tipo: 'dispensa_arcano',
      classe: 'Arcanista',
      custoPm: 0,
      isArcano: true,
      isDispensaArcano: true,
      ofensiva: infoDisp.danoTotal > 0,
      danoTotal: infoDisp.danoTotal,
      tipoDano: infoDisp.tipoDano,
      bonusEscala: infoDisp.bonusEscala,
      circuloArcanoTexto: dados.habilidades.circuloArcano.ativo
        ? `Círculo Arcano: pode lançar feitiço de até ${dados.habilidades.circuloArcano.custoMaximoFeitico} PM sem gastar ação!`
        : '',
      descricao: infoDisp.efeitoTexto || `Dispensa ${nomeArcano} ativando seu efeito de descarte (${infoDisp.danoTotal} de dano ${infoDisp.tipoDano}).`,
      resumoEfeito: `${infoDisp.nomeEfeito}: ${infoDisp.danoTotal > 0 ? `${infoDisp.danoTotal} dano (${infoDisp.tipoDano})` : 'Efeito especial'}${dados.bonusEscalaDispensa > 0 ? ` [Escala +${dados.bonusEscalaDispensa}]` : ''}`
    });
  });

  // 3. Ação Situacional de Círculo Arcano
  if (dados.habilidades.circuloArcano.ativo) {
    const custoMax = dados.habilidades.circuloArcano.custoMaximoFeitico;
    acoes.push({
      id: 'arcanista_circulo_arcano',
      codigo: 'CIRCULO_ARCANO',
      nome: 'Círculo Arcano (Feitiço Livre)',
      nomeCurto: 'Círculo Arcano',
      tipo: 'acao_suporte',
      classe: 'Arcanista',
      nivel: dados.habilidades.circuloArcano.nivel,
      custoPm: 0,
      descricao: `Em seu turno, após dispensar voluntariamente um Arcano: você pode fazer a ação Feitiço de até ${custoMax} PM sem gastar uma ação (arma arcana equipada).`,
      requerAlvo: false
    });
  }

  return acoes;
}
