/**
 * Fabula Ultima - Regras da Classe Erudito (Scholar / Lorekeeper)
 * Clean Architecture: funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const PATAMARES_ESTUDO = {
  DESASTRE: 'desastre',
  FALHA: 'falha',
  BASICO: 'basico',
  AVANCADO: 'avancado',
  COMPLETO: 'completo',
  CRITICO: 'critico'
};

function normalizarPoderesHeroicos(poderesHeroicos = []) {
  const set = new Set();
  (Array.isArray(poderesHeroicos) ? poderesHeroicos : []).forEach((p) => {
    const txt = typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''} ${p?.nome_original || ''}`;
    set.add(normalizarTextoCore(txt));
  });
  return set;
}

/**
 * Extrai o estado completo das habilidades e poderes de Erudito da ficha.
 */
export function extrairHabilidadesErudito({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasseErudito = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('erudito') || nome.includes('scholar') || nome.includes('lorekeeper');
  });

  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvConcentrado = obterNivelHabilidade(listaClasses, 'erudito', 'concentrado');
  const nvAnaliseRapida = obterNivelHabilidade(listaClasses, 'erudito', 'analise rapida');
  const nvConhecimentoEPoder = obterNivelHabilidade(listaClasses, 'erudito', 'conhecimento e poder');
  const nvLampejoSaber = obterNivelHabilidade(listaClasses, 'erudito', 'lampejo de saber');
  const nvMemoriaTreinada = obterNivelHabilidade(listaClasses, 'erudito', 'memoria treinada');

  const temVarreduraRapida = Array.from(poderesSet).some((p) => p.includes('varredura rapida') || p.includes('fast scan'));
  const temPrevisivel = Array.from(poderesSet).some((p) => p.includes('previsivel') || p.includes('predictable'));
  const temMatemagica = Array.from(poderesSet).some((p) => p.includes('matemagica') || p.includes('mathemagic'));
  const temPalavrasSabedoria = Array.from(poderesSet).some((p) => p.includes('palavras de sabedoria') || p.includes('words of wisdom'));

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClasseErudito,
    nivelTotal,
    habilidades: {
      concentrado: { nivel: nvConcentrado, ativo: nvConcentrado > 0, bonusPm: nvConcentrado * 3, bonusAstAst: nvConcentrado },
      analiseRapida: { nivel: nvAnaliseRapida, ativo: nvAnaliseRapida > 0, custoPmMaximo: nvAnaliseRapida * 5 },
      conhecimentoEPoder: { nivel: nvConhecimentoEPoder, ativo: nvConhecimentoEPoder > 0 },
      lampejoDeSaber: { nivel: nvLampejoSaber, ativo: nvLampejoSaber > 0, maxPerguntas: nvLampejoSaber },
      memoriaTreinada: { nivel: nvMemoriaTreinada, ativo: nvMemoriaTreinada > 0 }
    },
    poderesHeroicos: {
      varreduraRapida: temVarreduraRapida,
      previsivel: temPrevisivel,
      matemagica: temMatemagica,
      palavrasDeSabedoria: temPalavrasSabedoria
    }
  };
}

/**
 * Avalia o resultado mecânico de uma rolagem da ação Estudo (AST + AST).
 */
export function calcularResultadoEstudo({
  d1 = 1,
  d2 = 1,
  bonusAstAst = 0,
  bonusOutros = 0,
  temLampejo = false,
  npLampejo = 1,
  temVarreduraRapida = false
} = {}) {
  const somaDados = Number(d1) + Number(d2);
  const total = somaDados + Number(bonusAstAst) + Number(bonusOutros);
  const isFumble = d1 === 1 && d2 === 1;
  const isCritico = !isFumble && d1 === d2 && d1 >= 6;

  let patamar = PATAMARES_ESTUDO.FALHA;
  let descricaoPatamar = 'ND não atingido (< 10). Nenhuma informação adicional revelada.';

  if (isFumble) {
    patamar = PATAMARES_ESTUDO.DESASTRE;
    descricaoPatamar = 'Desastre crítico! Falha na investigação.';
  } else if (isCritico) {
    patamar = PATAMARES_ESTUDO.CRITICO;
    descricaoPatamar = 'Sucesso Crítico! Revelação Máxima: Traços, Afinidades, PV/PM, Defesas, Magias e Ataques.';
  } else if (total >= 16) {
    patamar = PATAMARES_ESTUDO.COMPLETO;
    descricaoPatamar = 'Sucesso Completo (16+): Revela Traços, Afinidades, Ataques Especiais, Magias e Fraquezas.';
  } else if (total >= 13) {
    patamar = PATAMARES_ESTUDO.AVANCADO;
    descricaoPatamar = 'Sucesso Avançado (13+): Revela Afinidades Elementais completas (Resistências e Fraquezas).';
  } else if (total >= 10) {
    patamar = PATAMARES_ESTUDO.BASICO;
    descricaoPatamar = 'Sucesso Básico (10+): Revela Nível, Espécie, PV/PM atuais/máximos e Defesas.';
  }

  const ativouLampejo = Boolean((total >= 13 || isCritico) && !isFumble && temLampejo && npLampejo > 0);
  const perguntasPermitidas = ativouLampejo ? npLampejo : 0;
  const partes = [`Estudo [AST+AST] = ${total} (${patamar.toUpperCase()})`, descricaoPatamar];
  if (ativouLampejo) {
    partes.push(`💡 Lampejo de Saber: até ${perguntasPermitidas} pergunta(s) ao mestre!`);
  }
  if (temVarreduraRapida) {
    partes.push('👁️ Varredura Rápida: afeta todos os inimigos!');
  }

  return {
    d1, d2, total, isCritico, isFumble, patamar,
    sucesso: total >= 10 && !isFumble,
    descricaoPatamar, ativouLampejo, perguntasPermitidas, temVarreduraRapida,
    resumoTexto: partes.join(' • ')
  };
}

/**
 * Gera as ações de conflito oficiais da classe Erudito para a Central de Turno.
 */
export function gerarAcoesConflitoErudito({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const dados = extrairHabilidadesErudito({ classes, poderesHeroicos, ficha });
  if (!dados.temClasseErudito) return [];

  const acoes = [];
  const bonusAstAst = dados.habilidades.concentrado.bonusAstAst;
  const temLampejo = dados.habilidades.lampejoDeSaber.ativo;
  const npLampejo = dados.habilidades.lampejoDeSaber.nivel;
  const temVarredura = dados.poderesHeroicos.varreduraRapida;

  // 1. Estudo Especializado
  acoes.push({
    id: 'erudito_estudo_especializado',
    codigo: 'ESTUDO_ERUDITO',
    nome: 'Ação Estudo: Investigar Inimigo',
    nomeCurto: 'Estudo [AST+AST]',
    tipo: 'acao_tatica',
    classe: 'Erudito',
    custoPm: 0,
    attr1: 'ast',
    attr2: 'ast',
    bonusTeste: bonusAstAst,
    temLampejo,
    npLampejo,
    temVarreduraRapida: temVarredura,
    descricao: `Teste Aberto [AST + AST] com +${bonusAstAst} (Concentrado). ND 10/13/16.${temLampejo ? ` 13+ ativa Lampejo de Saber (até ${npLampejo} perguntas).` : ''}${temVarredura ? ' 👁️ Varredura Rápida!' : ''}`
  });

  // 2. Análise Rápida
  if (dados.habilidades.analiseRapida.ativo) {
    const custoMax = dados.habilidades.analiseRapida.custoPmMaximo;
    acoes.push({
      id: 'erudito_analise_rapida',
      codigo: 'ANALISE_RAPIDA',
      nome: 'Análise Rápida (Revelar Traço ou Afinidade)',
      nomeCurto: 'Análise Rápida',
      tipo: 'acao_suporte',
      classe: 'Erudito',
      nivel: dados.habilidades.analiseRapida.nivel,
      custoPm: 5,
      custoPmMaximo: custoMax,
      descricao: `Gasta de 5 a ${custoMax} PM no início do conflito para revelar Traços ou Afinidades de criatura visível.`
    });
  }

  // 3. Previsível!
  if (dados.poderesHeroicos.previsivel) {
    acoes.push({
      id: 'erudito_previsivel',
      codigo: 'PREVISIVEL',
      nome: 'Previsível! (Taxar Ação do Inimigo)',
      nomeCurto: 'Previsível!',
      tipo: 'acao_conflito',
      classe: 'Erudito',
      custoPm: 20,
      requerAlvo: true,
      descricao: 'Gasta 1 ação e 20 PM em criatura visível com 2+ Traços conhecidos: taxa ação escolhida em 20 PM até próximo turno.'
    });
  }

  // 4. Palavras de Sabedoria
  if (dados.poderesHeroicos.palavrasDeSabedoria) {
    acoes.push({
      id: 'erudito_palavras_sabedoria',
      codigo: 'PALAVRAS_SABEDORIA',
      nome: 'Palavras de Sabedoria (Apoio Tático)',
      nomeCurto: 'Palavras de Sabedoria',
      tipo: 'acao_suporte',
      classe: 'Erudito',
      custoPm: 10,
      descricao: 'Ao apoiar um aliado, gasta 10 PM para conceder recuperação de PM, cura de status ou ação livre.'
    });
  }

  return acoes;
}
