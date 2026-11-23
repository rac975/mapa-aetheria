import { rolarDadosCombate, alternarCondicao } from './combatRules.js';
import { normalizarTextoIniciativa } from './combatGroupInitiativeRules.js';

/**
 * Fabula Ultima - Regras Puras de Ações Pré-1ª Rodada / Início de Conflito (ex.: Alta Velocidade)
 * Livro Básico p. 206 (Alta Velocidade / High Speed - Ladino).
 */

export const CUSTO_PM_ALTA_VELOCIDADE = 10;

/**
 * Detecta habilidades de início de conflito (ex.: Alta Velocidade do Ladino e Análise Rápida do Erudito).
 */
export function detectarHabilidadePreConflito(ficha) {
  const classes = Array.isArray(ficha?.classes)
    ? ficha.classes
    : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []);

  let possuiAltaVelocidade = false;
  let npAltaVelocidade = 1;
  let possuiAnaliseRapida = false;
  let npAnaliseRapida = 1;

  for (const c of classes) {
    const habs = Array.isArray(c?.habilidades) ? c.habilidades : [];
    for (const h of habs) {
      const nomeNorm = normalizarTextoIniciativa(h?.nome || '');
      if (nomeNorm.includes('alta velocidade') || nomeNorm.includes('high speed')) {
        possuiAltaVelocidade = true;
        npAltaVelocidade = Math.max(1, Math.min(3, parseInt(h.nivel, 10) || 1));
      }
      if (nomeNorm.includes('analise rapida') || nomeNorm.includes('quick assessment') || nomeNorm.includes('flash of insight')) {
        possuiAnaliseRapida = true;
        npAnaliseRapida = Math.max(1, Math.min(6, parseInt(h.nivel, 10) || 1));
      }
    }
  }

  const nomeHabilidade = possuiAltaVelocidade
    ? 'Alta Velocidade'
    : (possuiAnaliseRapida ? 'Análise Rápida' : '');

  return {
    possuiAltaVelocidade,
    np: possuiAltaVelocidade ? npAltaVelocidade : npAnaliseRapida,
    nomeHabilidade,
    possuiAnaliseRapida,
    npAnaliseRapida,
    custoMaximoAnaliseRapida: npAnaliseRapida * 5
  };
}

/**
 * Resolve uma ação pré-1ª rodada (ex.: Alta Velocidade: gasta 10 PM para Ataque Livre, Impedimento ou Objetivo com +NP).
 */
export function resolverAcaoPrePrimeiraRodada({
  heroi,
  perfilHeroi = null,
  tipoAcaoPre = 'ATAQUE_LIVRE',
  np = 1,
  alvo = null,
  armaObj = null,
  attr1 = 'des',
  attr2 = 'ast',
  condicaoId = 'lento',
  pmGasto = null,
  tipoRevelacao = 'traco',
  valoresFixos = null
} = {}) {
  if (!heroi) return { valido: false, erro: 'Selecione um herói válido.' };
  const mpAtual = Number(heroi.mp_atual) || 0;

  if (tipoAcaoPre === 'ANALISE_RAPIDA') {
    const custo = Math.max(5, Number(pmGasto) || 5);
    if (mpAtual < custo) {
      return {
        valido: false,
        erro: `${heroi.nome} precisa de pelo menos ${custo} PM (atual: ${mpAtual} PM).`
      };
    }
    const novoMp = mpAtual - custo;
    const nomeAlvo = alvo?.nome || 'o oponente visível';
    const detalheRevelacao = tipoRevelacao === 'afinidade'
      ? `Revelou a Afinidade de dano elemental de ${nomeAlvo}.`
      : `Revelou um Traço de ${nomeAlvo}.`;

    const rolagem = {
      autorNome: heroi.nome,
      titulo: `Análise Rápida (${custo} PM)`,
      detalhes: `Gastou ${custo} PM. ${detalheRevelacao}`
    };

    return {
      valido: true,
      erro: null,
      updatesHeroi: { mp_atual: novoMp },
      updatesAlvo: null,
      alvoId: alvo?.id || null,
      deltaRelogio: 0,
      resultadoRolagem: rolagem,
      logEntry: {
        combatente_id: heroi.id,
        autor_nome: heroi.nome,
        autor_tipo: 'heroi',
        acao_codigo: 'PRE_RODADA_ANALISE_RAPIDA',
        acao_titulo: `🔍 [Pré-1ª Rodada] Análise Rápida — ${nomeAlvo}`,
        detalhes: `Gastou ${custo} PM. ${detalheRevelacao}`,
        metadata: { custo_pm: custo, tipo_acao: 'ANALISE_RAPIDA', alvo_id: alvo?.id || null }
      }
    };
  }

  if (mpAtual < CUSTO_PM_ALTA_VELOCIDADE) {
    return {
      valido: false,
      erro: `${heroi.nome} precisa de pelo menos ${CUSTO_PM_ALTA_VELOCIDADE} PM (atual: ${mpAtual} PM).`
    };
  }

  const bonusNp = Math.max(1, Math.min(3, Number(np) || 1));
  const novoMp = mpAtual - CUSTO_PM_ALTA_VELOCIDADE;

  let rolagem;
  let updatesAlvo = null;
  let deltaRelogio = 0;

  if (tipoAcaoPre === 'ATAQUE_LIVRE') {
    const arma = armaObj || perfilHeroi?.armas?.[0] || {
      nome: 'Ataque Livre', attr1: 'des', attr2: 'vig', bonusPrecisao: 0, bonusDano: 6, tipoDano: 'fisico'
    };
    rolagem = rolarDadosCombate({
      combatente: heroi,
      perfil: perfilHeroi,
      categoria: 'arma',
      titulo: `Alta Velocidade (NP ${bonusNp}) — ${arma.nome}`,
      arma: { ...arma, bonusPrecisao: (Number(arma.bonusPrecisao) || 0) + bonusNp },
      alvo,
      nd: alvo ? (perfilHeroi?.alvoDefesa || 10) : null,
      valoresFixos
    });
  } else if (tipoAcaoPre === 'IMPEDIMENTO') {
    rolagem = rolarDadosCombate({
      combatente: heroi,
      perfil: perfilHeroi,
      categoria: 'atributo',
      titulo: `Alta Velocidade (NP ${bonusNp}) — Impedimento (${condicaoId.toUpperCase()})`,
      attr1,
      attr2,
      bonusTeste: bonusNp,
      alvo,
      nd: 10,
      valoresFixos
    });
    if (alvo && (rolagem.isCritico || (!rolagem.isFumble && rolagem.total >= 10))) {
      const condsAtuais = Array.isArray(alvo.condicoes) ? alvo.condicoes : [];
      if (!condsAtuais.includes(condicaoId)) {
        updatesAlvo = { condicoes: alternarCondicao(condsAtuais, condicaoId) };
      }
    }
  } else {
    rolagem = rolarDadosCombate({
      combatente: heroi,
      perfil: perfilHeroi,
      categoria: 'atributo',
      titulo: `Alta Velocidade (NP ${bonusNp}) — Objetivo`,
      attr1,
      attr2,
      bonusTeste: bonusNp,
      nd: 10,
      valoresFixos
    });
    if (rolagem.isCritico || (!rolagem.isFumble && rolagem.total >= 10)) {
      deltaRelogio = 1 + (rolagem.total >= 14 ? 1 : 0) + (rolagem.isCritico ? 2 : 0);
    }
  }

  return {
    valido: true,
    erro: null,
    updatesHeroi: { mp_atual: novoMp },
    updatesAlvo,
    alvoId: alvo?.id || null,
    deltaRelogio,
    resultadoRolagem: rolagem,
    logEntry: {
      combatente_id: heroi.id,
      autor_nome: heroi.nome,
      autor_tipo: 'heroi',
      acao_codigo: `PRE_RODADA_${tipoAcaoPre}`,
      acao_titulo: `⚡ [Pré-1ª Rodada] ${rolagem.titulo}`,
      detalhes: `Gastou ${CUSTO_PM_ALTA_VELOCIDADE} PM (+${bonusNp} NP no teste). ${rolagem.detalhes}`,
      metadata: { custo_pm: CUSTO_PM_ALTA_VELOCIDADE, np: bonusNp, tipo_acao: tipoAcaoPre }
    }
  };
}
