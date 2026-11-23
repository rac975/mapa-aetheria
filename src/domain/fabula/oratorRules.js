/**
 * Fabula Ultima - Regras da Classe Orador (Orator)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesOrador({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('orador') || nome.includes('orator');
  });

  const nvCondenar = obterNivelHabilidade(listaClasses, 'orador', 'condenar');
  const nvEncorajar = obterNivelHabilidade(listaClasses, 'orador', 'encorajar');
  const nvConfioEmVoce = obterNivelHabilidade(listaClasses, 'orador', 'confio em voce');
  const nvPersuasivo = obterNivelHabilidade(listaClasses, 'orador', 'persuasivo');
  const nvAliadoInesperado = obterNivelHabilidade(listaClasses, 'orador', 'aliado inesperado');

  return {
    temClasse,
    habilidades: {
      condenar: {
        nivel: nvCondenar,
        ativo: nvCondenar > 0,
        custoPm: 5,
        perdaPmAlvo: nvCondenar * 10,
        bonusDanoSofridoAlvo: nvCondenar
      },
      encorajar: {
        nivel: nvEncorajar,
        ativo: nvEncorajar > 0,
        custoPm: 5,
        curaPv: nvEncorajar * 5
      },
      confioEmVoce: {
        nivel: nvConfioEmVoce,
        ativo: nvConfioEmVoce > 0,
        custoPf: 1,
        pmRecuperadoAliado: nvConfioEmVoce * 10
      },
      persuasivo: {
        nivel: nvPersuasivo,
        ativo: nvPersuasivo > 0,
        maxPmRelogio: nvPersuasivo * 20
      },
      aliadoInesperado: {
        nivel: nvAliadoInesperado,
        ativo: nvAliadoInesperado > 0,
        custoPf: 1
      }
    }
  };
}

export function calcularEfeitoCondenar({ nivel = 1, opcaoCondicao = 'abalado' } = {}) {
  const np = Math.max(1, parseInt(nivel, 10) || 1);
  const condNorm = normalizarTextoCore(opcaoCondicao);
  const condicaoFinal = condNorm.includes('ator') ? 'atordoado' : 'abalado';
  return {
    custoPm: 5,
    perdaPmAlvo: np * 10,
    condicaoAlvo: condicaoFinal,
    bonusDanoSofridoAlvo: np
  };
}

export function calcularCuraEncorajar({ nivel = 1 } = {}) {
  const np = Math.max(1, parseInt(nivel, 10) || 1);
  return np * 5;
}

export function gerarAcoesConflitoOrador({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesOrador({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  // 1. Condenar
  if (dados.habilidades.condenar.ativo) {
    const np = dados.habilidades.condenar.nivel;
    acoes.push({
      id: 'orador_condenar',
      codigo: 'CONDENAR',
      nome: `⚡ Condenar (5 PM • [AST+VON]+${np} • -${np * 10} PM • Abalado/Atordoado • +${np} Dano Sofrido)`,
      nomeCurto: 'Condenar',
      tipo: 'acao_combate',
      classe: 'Orador',
      nivel: np,
      custoPm: 5,
      attr1: 'ast',
      attr2: 'von',
      bonusTeste: np,
      perdaPmAlvo: np * 10,
      bonusDanoSofrido: np,
      descricao: `Gasta 5 PM e faz teste oposto [AST + VON] + ${np} contra inimigo. Se vencer: o alvo perde ${np * 10} PM, fica Abalado ou Atordoado, e sofre +${np} de dano de todas as fontes até o seu próximo turno.`
    });
  }

  // 2. Encorajar
  if (dados.habilidades.encorajar.ativo) {
    const np = dados.habilidades.encorajar.nivel;
    const cura = np * 5;
    acoes.push({
      id: 'orador_encorajar',
      codigo: 'ENCORAJAR',
      nome: `🗣️ Encorajar (5 PM • +${cura} PV Aliado • +1 Passo Atributo)`,
      nomeCurto: 'Encorajar',
      tipo: 'acao_combate',
      classe: 'Orador',
      nivel: np,
      custoPm: 5,
      curaAplicada: cura,
      descricao: `Gasta 5 PM e escolhe aliado: ele recupera +${cura} PV e escolhe um atributo (DES, VIG, AST ou VON) para aumentar um passo até o início do seu próximo turno.`
    });
  }

  // 3. Confio em Você
  if (dados.habilidades.confioEmVoce.ativo) {
    const np = dados.habilidades.confioEmVoce.nivel;
    acoes.push({
      id: 'orador_confio_em_voce',
      codigo: 'CONFIO_EM_VOCE',
      nome: `🤝 Confio em Você (1 PF • Aliado Rerrola • +${np * 10} PM se houver Laço)`,
      nomeCurto: 'Confio em Você',
      tipo: 'reacao_combate',
      classe: 'Orador',
      nivel: np,
      custoPf: 1,
      isAcaoExtra: true,
      descricao: `Ao teste de outro PJ: gasta 1 PF para convocar Traço/Laço dele. Se tiver Laço com ele, ele recupera +${np * 10} PM.`
    });
  }

  return acoes;
}
