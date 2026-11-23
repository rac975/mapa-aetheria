/**
 * Fabula Ultima - Regras da Classe Ladino (Rogue)
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
 * Extrai o estado completo das habilidades e poderes de Ladino da ficha.
 */
export function extrairHabilidadesLadino({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasseLadino = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('ladino') || nome.includes('rogue');
  });

  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvAltaVelocidade = obterNivelHabilidade(listaClasses, 'ladino', 'alta velocidade');
  const nvEsquiva = obterNivelHabilidade(listaClasses, 'ladino', 'esquiva');
  const nvGolpeBaixo = obterNivelHabilidade(listaClasses, 'ladino', 'golpe baixo');
  const nvRouboAlma = obterNivelHabilidade(listaClasses, 'ladino', 'roubo de alma');
  const nvVejoVoceMaisTarde = obterNivelHabilidade(listaClasses, 'ladino', 'vejo voce mais tarde');

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClasseLadino,
    nivelTotal,
    habilidades: {
      altaVelocidade: { nivel: nvAltaVelocidade, ativo: nvAltaVelocidade > 0, bonusTeste: nvAltaVelocidade, custoPm: 10 },
      esquiva: { nivel: nvEsquiva, ativo: nvEsquiva > 0, bonusDefesa: nvEsquiva },
      golpeBaixo: { nivel: nvGolpeBaixo, ativo: nvGolpeBaixo > 0 },
      rouboDeAlma: { nivel: nvRouboAlma, ativo: nvRouboAlma > 0, bonusTeste: nvRouboAlma },
      vejoVoceMaisTarde: { nivel: nvVejoVoceMaisTarde, ativo: nvVejoVoceMaisTarde > 0, custoPf: 1 }
    },
    poderesHeroicos: {
      pilhar: Array.from(poderesSet).some((p) => p.includes('pilhar')),
      sumir: Array.from(poderesSet).some((p) => p.includes('sumir')),
      adeptoDasLaminas: Array.from(poderesSet).some((p) => p.includes('adepto das laminas')),
      cameraLenta: Array.from(poderesSet).some((p) => p.includes('camera lenta')),
      cacadorSilencioso: Array.from(poderesSet).some((p) => p.includes('cacador silencioso')),
      tranquilidadeEfemera: Array.from(poderesSet).some((p) => p.includes('tranquilidade efemera'))
    }
  };
}

/**
 * Calcula o dano adicional concedido por Golpe Baixo.
 * Regra oficial: contra alvo único sofrendo 1+ condições: dano adicional = (NP + número de condições).
 */
export function calcularDanoGolpeBaixo({ nivelGolpeBaixo = 0, condicoesAlvo = [], isAlvoUnico = true } = {}) {
  const np = Math.max(0, parseInt(nivelGolpeBaixo, 10) || 0);
  const qtd = Array.isArray(condicoesAlvo) ? condicoesAlvo.length : Number(condicoesAlvo) || 0;
  if (np <= 0 || !isAlvoUnico || qtd <= 0) return 0;
  return np + qtd;
}

/**
 * Calcula a resolução oficial de Roubo de Alma.
 */
export function calcularResolucaoRouboDeAlma({
  nivelHabilidade = 1,
  totalRolado = 0,
  mdefAlvo = 10,
  tipoAlvo = 'soldado',
  nivelAlvo = 5,
  isVilao = false,
  jaRoubado = false
} = {}) {
  if (jaRoubado) {
    return {
      sucesso: false,
      bloqueadoJaRoubado: true,
      piRecuperados: 0,
      valorZenites: 0,
      nomeTesouro: null,
      mensagem: 'A alma desta criatura já foi roubada nesta cena! Cada criatura só pode ter a alma roubada uma única vez por combate.'
    };
  }

  const np = Math.max(1, parseInt(nivelHabilidade, 10) || 1);
  const mdef = Math.max(0, parseInt(mdefAlvo, 10) || 0);
  const sucesso = totalRolado >= mdef;
  const tipoNorm = String(tipoAlvo || 'soldado').toLowerCase();
  const nivelNum = Math.max(1, parseInt(nivelAlvo, 10) || 1);

  if (!sucesso) {
    return { sucesso: false, piRecuperados: 0, valorZenites: 0, nomeTesouro: null, mensagem: `Falha no Roubo de Alma (${totalRolado} vs M.DEF ${mdef}).` };
  }

  if (tipoNorm === 'soldado') {
    return {
      sucesso: true,
      piRecuperados: np,
      valorZenites: 0,
      nomeTesouro: null,
      mensagem: `Sucesso! Roubo de Alma recuperou ${np} Pontos de Inventário (PI).`
    };
  }

  const multiplicador = isVilao || tipoNorm === 'vilao' ? 50 : 30;
  const valorZenites = nivelNum * multiplicador;
  const nomeTesouro = `Tesouro da Alma (${tipoNorm.toUpperCase()} Nv. ${nivelNum})`;

  return {
    sucesso: true,
    piRecuperados: 0,
    valorZenites,
    nomeTesouro,
    mensagem: `Sucesso! Adquiriu o ${nomeTesouro} (valor de até ${valorZenites}z na mochila).`
  };
}

/**
 * Gera as ações de conflito ativas e situacionais de Ladino.
 */
export function gerarAcoesConflitoLadino({
  classes = [],
  poderesHeroicos = [],
  ficha = null
} = {}) {
  const dados = extrairHabilidadesLadino({ classes, poderesHeroicos, ficha });
  if (!dados.temClasseLadino) return [];

  const acoes = [];

  // 1. Roubo de Alma (Ação de Conflito)
  if (dados.habilidades.rouboDeAlma.ativo) {
    const npRoubo = dados.habilidades.rouboDeAlma.nivel;
    acoes.push({
      id: 'ladino_roubo_de_alma',
      codigo: 'ROUBO_DE_ALMA',
      nome: `👻 Roubo de Alma [DES + VON + ${npRoubo}]`,
      nomeCurto: 'Roubo de Alma',
      tipo: 'acao_combate',
      classe: 'Ladino',
      nivel: npRoubo,
      attr1: 'des',
      attr2: 'von',
      bonusTeste: npRoubo,
      custoPm: 0,
      custoPi: 0,
      requerAlvo: true,
      temPilhar: dados.poderesHeroicos.pilhar,
      descricao: `Teste [DES + VON] + ${npRoubo} vs M.DEF. Soldado concede ${npRoubo} PI; Elite/Campeão concede Tesouro da Alma (${npRoubo > 0 ? 'nível × 30z ou 50z se Vilão' : ''})${dados.poderesHeroicos.pilhar ? ' (Pilhar: afeta múltiplos alvos!)' : ''}.`
    });
  }

  // 2. Golpe Baixo (Manobra Tática de Dano)
  if (dados.habilidades.golpeBaixo.ativo) {
    const npGolpe = dados.habilidades.golpeBaixo.nivel;
    acoes.push({
      id: 'ladino_golpe_baixo',
      codigo: 'GOLPE_BAIXO',
      nome: `🗡️ Golpe Baixo (+${npGolpe} + Condições no Dano)`,
      nomeCurto: 'Golpe Baixo',
      tipo: 'modificador_ataque',
      classe: 'Ladino',
      nivel: npGolpe,
      descricao: `Contra alvo único sofrendo 1+ condições: causa dano adicional igual a ${npGolpe} + número de condições do alvo.`
    });
  }

  // 3. Vejo Você Mais Tarde (Ação de Fuga Heróica)
  if (dados.habilidades.vejoVoceMaisTarde.ativo) {
    acoes.push({
      id: 'ladino_vejo_voce_mais_tarde',
      codigo: 'VEJO_VOCE_MAIS_TARDE',
      nome: '💨 Vejo Você Mais Tarde (1 PF • Escapar da Cena)',
      nomeCurto: 'Vejo Você Mais Tarde',
      tipo: 'acao_especial',
      classe: 'Ladino',
      custoPf: 1,
      custoPm: 0,
      escaparCena: true,
      descricao: 'Gasta 1 ação e 1 Ponto de Fábula para escapar milagrosamente do combate, reaparecendo com outro PJ em cena futura.'
    });
  }

  // 4. Sumir (Poder Heróico)
  if (dados.poderesHeroicos.sumir) {
    acoes.push({
      id: 'ladino_sumir',
      codigo: 'SUMIR',
      nome: '🌫️ Sumir (1 PF • Invisível aos Alvos)',
      nomeCurto: 'Sumir (1 PF)',
      tipo: 'reacao_suporte',
      classe: 'Ladino',
      custoPf: 1,
      descricao: 'Ao acertar um ataque: gasta 1 Ponto de Fábula para que as criaturas atingidas não possam ver você até seu próximo turno.'
    });
  }

  return acoes;
}
