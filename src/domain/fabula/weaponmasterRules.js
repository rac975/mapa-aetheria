/**
 * Fabula Ultima - Regras da Classe Mestre de Armas (Weaponmaster)
 * Clean Architecture: funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

function normalizarPoderesHeroicos(poderesHeroicos = []) {
  const set = new Set();
  (Array.isArray(poderesHeroicos) ? poderesHeroicos : []).forEach((p) => {
    const txt = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''} ${p?.nome_original || ''}`;
    set.add(normalizarTextoCore(txt));
  });
  return set;
}

/**
 * Extrai o estado completo das habilidades e poderes de Mestre de Armas da ficha.
 */
export function extrairHabilidadesMestreDeArmas({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasseMestre = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('mestre de armas') || nome.includes('weaponmaster') || (nome.includes('mestre') && nome.includes('arma'));
  });

  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvChuvaLaminas = obterNivelHabilidade(listaClasses, 'mestre de armas', 'chuva de laminas');
  const nvContraAtaque = obterNivelHabilidade(listaClasses, 'mestre de armas', 'contra-ataque');
  const nvQuebraOssos = obterNivelHabilidade(listaClasses, 'mestre de armas', 'quebra-ossos');
  const nvMaestriaCorpo = obterNivelHabilidade(listaClasses, 'mestre de armas', 'maestria com armas corpo a corpo');
  const nvTrespassar = obterNivelHabilidade(listaClasses, 'mestre de armas', 'trespassar');

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClasseMestre,
    nivelTotal,
    habilidades: {
      chuvaDeLaminas: { nivel: nvChuvaLaminas, ativo: nvChuvaLaminas > 0, custoPm: 10 },
      contraAtaque: { nivel: nvContraAtaque, ativo: nvContraAtaque > 0 },
      quebraOssos: { nivel: nvQuebraOssos, ativo: nvQuebraOssos > 0, perdaPmPorNivel: 10 },
      maestriaCorpoACorpo: { nivel: nvMaestriaCorpo, ativo: nvMaestriaCorpo > 0, bonusPrecisao: nvMaestriaCorpo },
      trespassar: { nivel: nvTrespassar, ativo: nvTrespassar > 0, custoPm: 5, danoSecundario: nvTrespassar * 5 }
    },
    poderesHeroicos: {
      ataquePoderoso: Array.from(poderesSet).some((p) => p.includes('ataque poderoso')),
      golpeTempestuoso: Array.from(poderesSet).some((p) => p.includes('golpe tempestuoso')),
      momentoFugaz: Array.from(poderesSet).some((p) => p.includes('momento fugaz')),
      golpeValente: Array.from(poderesSet).some((p) => p.includes('golpe valente')),
      corteTriplo: Array.from(poderesSet).some((p) => p.includes('corte triplo')),
      adeptoDasLaminas: Array.from(poderesSet).some((p) => p.includes('adepto das laminas'))
    }
  };
}

/**
 * Calcula o bônus de dano de Ataque Poderoso para ataques corpo a corpo.
 */
export function calcularBonusDanoAtaquePoderoso({ temAtaquePoderoso = false, nivelTotal = 5, isCorpoACorpo = true } = {}) {
  if (!temAtaquePoderoso || !isCorpoACorpo) return 0;
  return nivelTotal >= 40 ? 10 : 5;
}

/**
 * Calcula o dano secundário causado por Trespassar a uma criatura diferente.
 */
export function calcularDanoSecundarioTrespassar({ nivelTrespassar = 1 } = {}) {
  const np = Math.max(1, Math.min(3, parseInt(nivelTrespassar, 10) || 1));
  return np * 5;
}

/**
 * Calcula os parâmetros de Quebra-Ossos.
 */
export function calcularEfeitoQuebraOssos({ nivelHabilidade = 1, opcao = 'atordoado' } = {}) {
  const np = Math.max(1, Math.min(4, parseInt(nivelHabilidade, 10) || 1));
  const opcaoNorm = normalizarTextoCore(opcao);

  if (opcaoNorm.includes('fraco') || opcaoNorm.includes('weak')) {
    return { danoAplicado: 0, condicao: 'fraco', perdaPm: 0, descricao: 'Zera o dano para deixar o alvo Fraco (VIG ↓).' };
  }
  if (opcaoNorm.includes('pm') || opcaoNorm.includes('mente')) {
    const perdaPm = np * 10;
    return { danoAplicado: 0, condicao: null, perdaPm, descricao: `Zera o dano para drenar ${perdaPm} PM do alvo.` };
  }
  return { danoAplicado: 0, condicao: 'atordoado', perdaPm: 0, descricao: 'Zera o dano para deixar o alvo Atordoado (AST ↓).' };
}

/**
 * Gera as ações de conflito ativas e situacionais de Mestre de Armas.
 */
export function gerarAcoesConflitoMestreDeArmas({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const dados = extrairHabilidadesMestreDeArmas({ classes, poderesHeroicos, ficha });
  if (!dados.temClasseMestre) return [];

  const acoes = [];

  // 1. Chuva de Lâminas
  if (dados.habilidades.chuvaDeLaminas.ativo) {
    acoes.push({
      id: 'mestre_chuva_de_laminas',
      codigo: 'CHUVA_DE_LAMINAS',
      nome: '⚔️ Chuva de Lâminas (10 PM • Multi)',
      nomeCurto: 'Chuva de Lâminas',
      tipo: 'modificador_ataque',
      classe: 'Mestre de Armas',
      custoPm: 10,
      isAcaoExtra: true,
      descricao: 'Ao fazer um ataque corpo a corpo: gasta 10 PM para o ataque receber Multi(2) ou aumentar a propriedade Multi em +1 (máx Multi 3).'
    });
  }

  // 2. Trespassar
  if (dados.habilidades.trespassar.ativo) {
    const np = dados.habilidades.trespassar.nivel;
    const danoSec = dados.habilidades.trespassar.danoSecundario;
    acoes.push({
      id: 'mestre_trespassar',
      codigo: 'TRESPASSAR',
      nome: `💥 Trespassar (5 PM • +${danoSec} Dano Físico Secundário)`,
      nomeCurto: 'Trespassar',
      tipo: 'acao_combate',
      classe: 'Mestre de Armas',
      nivel: np,
      custoPm: 5,
      danoSecundario: danoSec,
      descricao: `Gasta 5 PM para fazer ataque livre corpo a corpo. Ao acertar, causa dano normal ao alvo e ${danoSec} de dano físico a outro alvo visível.`
    });
  }

  // 3. Quebra-Ossos
  if (dados.habilidades.quebraOssos.ativo) {
    const np = dados.habilidades.quebraOssos.nivel;
    acoes.push({
      id: 'mestre_quebra_ossos',
      codigo: 'QUEBRA_OSSOS',
      nome: `🦴 Quebra-Ossos (Dano 0 • Atordoado / Fraco / -${np * 10} PM)`,
      nomeCurto: 'Quebra-Ossos',
      tipo: 'manobra_ataque',
      classe: 'Mestre de Armas',
      nivel: np,
      perdaPmMax: np * 10,
      descricao: `Ao acertar ataque corpo a corpo: escolhe não causar dano para deixar o alvo Atordoado, Fraco ou drenar ${np * 10} PM.`
    });
  }

  // 4. Contra-Ataque
  if (dados.habilidades.contraAtaque.ativo) {
    acoes.push({
      id: 'mestre_contra_ataque',
      codigo: 'CONTRA_ATAQUE',
      nome: '🛡️ Contra-Ataque (Reação • Precisão Par)',
      nomeCurto: 'Contra-Ataque',
      tipo: 'reacao_combate',
      classe: 'Mestre de Armas',
      isAcaoExtra: true,
      descricao: 'Quando um ataque corpo a corpo inimigo resultar em número par: realize um ataque livre corpo a corpo contra o agressor.'
    });
  }

  return acoes;
}
