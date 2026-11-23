/**
 * Fabula Ultima - Regras da Classe Atirador (Sharpshooter)
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
 * Extrai o estado completo das habilidades e poderes de Atirador da ficha.
 */
export function extrairHabilidadesAtirador({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasseAtirador = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('atirador') || nome.includes('sharpshooter');
  });

  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvBarragem = obterNivelHabilidade(listaClasses, 'atirador', 'barragem');
  const nvFogoCruzado = obterNivelHabilidade(listaClasses, 'atirador', 'fogo cruzado');
  const nvMaestriaDistancia = obterNivelHabilidade(listaClasses, 'atirador', 'maestria com armas a distancia');
  const nvOlhosDeAguia = obterNivelHabilidade(listaClasses, 'atirador', 'olhos de aguia');
  const nvTiroDeAviso = obterNivelHabilidade(listaClasses, 'atirador', 'tiro de aviso');

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClasseAtirador,
    nivelTotal,
    habilidades: {
      barragem: { nivel: nvBarragem, ativo: nvBarragem > 0, custoPm: 10 },
      fogoCruzado: { nivel: nvFogoCruzado, ativo: nvFogoCruzado > 0 },
      maestriaDistancia: { nivel: nvMaestriaDistancia, ativo: nvMaestriaDistancia > 0, bonusPrecisao: nvMaestriaDistancia },
      olhosDeAguia: { nivel: nvOlhosDeAguia, ativo: nvOlhosDeAguia > 0, bonusDanoProximoAtaque: nvOlhosDeAguia * 3 },
      tiroDeAviso: { nivel: nvTiroDeAviso, ativo: nvTiroDeAviso > 0, perdaPmAlvo: nvTiroDeAviso * 10 }
    },
    poderesHeroicos: {
      tiroPoderoso: Array.from(poderesSet).some((p) => p.includes('tiro poderoso')),
      miraPerfeita: Array.from(poderesSet).some((p) => p.includes('mira perfeita')),
      flechaDupla: Array.from(poderesSet).some((p) => p.includes('flecha dupla')),
      tiroteio: Array.from(poderesSet).some((p) => p.includes('tiroteio')),
      iscaChamariz: Array.from(poderesSet).some((p) => p.includes('isca chamariz')),
      miraArcana: Array.from(poderesSet).some((p) => p.includes('mira arcana'))
    }
  };
}

/**
 * Calcula bônus de dano concedido por poderes heroicos de Atirador.
 */
export function calcularBonusDanoAtirador({ dadosAtirador = null, nivelTotal = 5, isDistancia = false, isArmaArcana = false } = {}) {
  if (!dadosAtirador?.temClasseAtirador && !dadosAtirador?.poderesHeroicos) return 0;
  let bonus = 0;
  if (isDistancia && dadosAtirador?.poderesHeroicos?.tiroPoderoso) {
    bonus += nivelTotal >= 40 ? 10 : 5;
  }
  if (isArmaArcana && dadosAtirador?.poderesHeroicos?.miraArcana) {
    bonus += 5;
  }
  return bonus;
}

/**
 * Calcula a resolução oficial da reação Fogo Cruzado.
 */
export function calcularResolucaoFogoCruzado({
  nivelHabilidade = 1,
  testePrecisaoAtacante = 0,
  isSucessoCritico = false,
  temTiroteio = false,
  temArmaFogo = false
} = {}) {
  if ((parseInt(nivelHabilidade, 10) || 0) <= 0) {
    return { permitido: false, custoPm: 0, contraAtaqueLivre: false, motivo: 'Personagem não possui Fogo Cruzado.' };
  }
  if (isSucessoCritico) {
    return { permitido: false, custoPm: 0, contraAtaqueLivre: false, motivo: 'Fogo Cruzado não anula Sucesso Crítico.' };
  }
  const custoPm = 5 + Math.max(0, parseInt(testePrecisaoAtacante, 10) || 0);
  const contraAtaqueLivre = Boolean(temTiroteio && temArmaFogo && (testePrecisaoAtacante % 2 === 0));

  return {
    permitido: true,
    custoPm,
    contraAtaqueLivre,
    motivo: contraAtaqueLivre ? 'Fogo Cruzado anulou o ataque e disparou contra-ataque livre com arma de fogo!' : 'Ataque à distância anulado.'
  };
}

/**
 * Calcula efeitos táticos de Tiro de Aviso (Warning Shot).
 */
export function calcularEfeitoTiroDeAviso({
  nivelHabilidade = 1,
  temMiraPerfeita = false,
  escolhas = []
} = {}) {
  const np = Math.max(1, parseInt(nivelHabilidade, 10) || 1);
  const maxEscolhas = temMiraPerfeita ? 2 : 1;
  const listaEscolhas = Array.isArray(escolhas) ? escolhas.slice(0, maxEscolhas) : [];
  const condicoes = [];
  let perdaPm = 0;

  listaEscolhas.forEach((opt) => {
    const o = String(opt).toLowerCase();
    if (o.includes('abalado')) condicoes.push('abalado');
    else if (o.includes('lento')) condicoes.push('lento');
    else if (o.includes('pm') || o.includes('perda')) perdaPm += np * 10;
  });

  return { valido: listaEscolhas.length > 0, danoCausado: 0, condicoes, perdaPm, maxEscolhas };
}

/**
 * Gera as ações de conflito ativas e situacionais de Atirador.
 */
export function gerarAcoesConflitoAtirador({
  classes = [],
  poderesHeroicos = [],
  ficha = null,
  armas = []
} = {}) {
  const dados = extrairHabilidadesAtirador({ classes, poderesHeroicos, ficha });
  if (!dados.temClasseAtirador) return [];

  const acoes = [];
  const temArmaFogo = (armas || []).some((a) => a.tipo === 'arma_de_fogo' || a.nome?.toLowerCase().includes('pistola') || a.nome?.toLowerCase().includes('fuzil'));

  // 1. Barragem
  if (dados.habilidades.barragem.ativo) {
    acoes.push({
      id: 'atirador_barragem',
      codigo: 'BARRAGEM',
      nome: '🎯 Barragem: Ataque Multi',
      nomeCurto: 'Barragem (10 PM)',
      tipo: 'modificador_ataque',
      classe: 'Atirador',
      custoPm: 10,
      descricao: 'Ao fazer um ataque à distância: concede propriedade multi (2) ou aumenta multi em +1 (até multi 3).',
      requerArmaDistancia: true,
      alvosMultiplos: true
    });
  }

  // 2. Olhos de Águia
  if (dados.habilidades.olhosDeAguia.ativo) {
    const npAguia = dados.habilidades.olhosDeAguia.nivel;
    const bonusDano = npAguia * 3;
    acoes.push({
      id: 'atirador_olhos_de_aguia_dano',
      codigo: 'OLHOS_DE_AGUIA_DANO',
      nome: `🦅 Olhos de Águia: Mira Concentrada (+${bonusDano} Dano)`,
      nomeCurto: `Olhos de Águia (+${bonusDano})`,
      tipo: 'acao_guarda',
      classe: 'Atirador',
      nivel: npAguia,
      custoPm: 0,
      bonusDanoProximoAtaque: bonusDano,
      descricao: `Na ação Guarda (sem cobrir aliado): o próximo ataque à distância na cena causa +${bonusDano} pontos de dano.`
    });

    acoes.push({
      id: 'atirador_olhos_de_aguia_tiro_livre',
      codigo: 'OLHOS_DE_AGUIA_TIRO_LIVRE',
      nome: '🦅 Olhos de Águia: Disparo em Guarda (RA 0)',
      nomeCurto: 'Disparo em Guarda',
      tipo: 'acao_guarda',
      classe: 'Atirador',
      nivel: npAguia,
      custoPm: 0,
      descricao: 'Na ação Guarda (sem cobrir aliado): faz um ataque livre imediato com arco ou arma de fogo (RA = 0 no dano).'
    });

    if (dados.poderesHeroicos.iscaChamariz) {
      acoes.push({
        id: 'atirador_isca_chamariz',
        codigo: 'ISCA_CHAMARIZ',
        nome: '🪤 Isca Chamariz (10 PM)',
        nomeCurto: 'Isca Chamariz',
        tipo: 'acao_guarda',
        classe: 'Atirador',
        custoPm: 10,
        descricao: 'Gasta 10 PM com Olhos de Águia para erguer um chamariz tático que absorve ataques inimigos.'
      });
    }
  }

  // 3. Tiro de Aviso
  if (dados.habilidades.tiroDeAviso.ativo) {
    const npAviso = dados.habilidades.tiroDeAviso.nivel;
    const perdaPm = npAviso * 10;
    acoes.push({
      id: 'atirador_tiro_de_aviso',
      codigo: 'TIRO_DE_AVISO',
      nome: `⚠️ Tiro de Aviso (Dano 0 • Condição / -${perdaPm} PM)`,
      nomeCurto: 'Tiro de Aviso',
      tipo: 'manobra_ataque',
      classe: 'Atirador',
      nivel: npAviso,
      custoPm: 0,
      requerAlvo: true,
      temMiraPerfeita: dados.poderesHeroicos.miraPerfeita,
      perdaPmAlvo: perdaPm,
      descricao: `Ao atingir com ataque à distância, causa 0 de dano e inflige Abalado, Lento ou drena ${perdaPm} PM${dados.poderesHeroicos.miraPerfeita ? ' (Mira Perfeita: 2 opções!)' : ''}.`
    });
  }

  // 4. Fogo Cruzado
  if (dados.habilidades.fogoCruzado.ativo) {
    acoes.push({
      id: 'atirador_fogo_cruzado',
      codigo: 'FOGO_CRUZADO',
      nome: '🛑 Fogo Cruzado (Anular Disparo Inimigo)',
      nomeCurto: 'Fogo Cruzado',
      tipo: 'reacao_combate',
      classe: 'Atirador',
      nivel: dados.habilidades.fogoCruzado.nivel,
      custoBasePm: 5,
      requerArmaDistancia: true,
      temTiroteio: dados.poderesHeroicos.tiroteio,
      temArmaFogo,
      descricao: `Reação: gasta (5 + Precisão) PM para anular ataque à distância${dados.poderesHeroicos.tiroteio && temArmaFogo ? ' (Tiroteio: contra-ataque livre se precisão for par!)' : ''}.`
    });
  }

  return acoes;
}
