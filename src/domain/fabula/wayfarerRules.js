/**
 * Regras puras de Fabula Ultima para a classe Andarilho (Wayfarer).
 * Concentra o mapeamento de habilidades (Companheiro Fiel, Prático, Caçador de Tesouros,
 * Papo de Taverna, Viajante Experiente) e poderes heroicos (Lado a Lado, Cochilo Poderoso,
 * Companheiro Heroico) sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

/**
 * Normaliza a lista de poderes heroicos de um personagem para um Set de chaves textuais.
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
 * Extrai o estado completo das habilidades e poderes de Andarilho de um herói.
 *
 * @param {Object} params
 * @param {Array} [params.classes=[]]
 * @param {Array} [params.poderesHeroicos=[]]
 * @param {Object} [params.ficha=null]
 * @returns {Object} Mapeamento das habilidades de Andarilho
 */
export function extrairHabilidadesAndarilho({
  classes = [],
  poderesHeroicos = [],
  ficha = null
} = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasseAndarilho = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('andarilho') || nome.includes('wayfarer');
  });

  const poderesLista = Array.isArray(poderesHeroicos) && poderesHeroicos.length > 0
    ? poderesHeroicos
    : (Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : []);
  const poderesSet = normalizarPoderesHeroicos(poderesLista);

  const nvCompanheiroFiel = obterNivelHabilidade(listaClasses, 'andarilho', 'companheiro fiel');
  const nvCacadorTesouros = obterNivelHabilidade(listaClasses, 'andarilho', 'cacador de tesouros');
  const nvPapoTaverna = obterNivelHabilidade(listaClasses, 'andarilho', 'papo de taverna');
  const nvPratico = obterNivelHabilidade(listaClasses, 'andarilho', 'pratico');
  const nvViajanteExperiente = obterNivelHabilidade(listaClasses, 'andarilho', 'viajante experiente');

  const temLadoALado = Array.from(poderesSet).some((p) => p.includes('lado a lado'));
  const temCompanheiroHeroico = Array.from(poderesSet).some((p) => p.includes('companheiro heroico'));
  const temCochiloPoderoso = Array.from(poderesSet).some((p) => p.includes('cochilo poderoso'));

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClasseAndarilho,
    nivelTotal,
    habilidades: {
      companheiroFiel: { nivel: nvCompanheiroFiel, ativo: nvCompanheiroFiel > 0 },
      cacadorTesouros: { nivel: nvCacadorTesouros, ativo: nvCacadorTesouros > 0 },
      papoTaverna: { nivel: nvPapoTaverna, ativo: nvPapoTaverna > 0 },
      pratico: { nivel: nvPratico, ativo: nvPratico > 0 },
      viajanteExperiente: { nivel: nvViajanteExperiente, ativo: nvViajanteExperiente > 0 }
    },
    poderesHeroicos: {
      ladoALado: temLadoALado,
      companheiroHeroico: temCompanheiroHeroico,
      cochiloPoderoso: temCochiloPoderoso
    }
  };
}

/**
 * Calcula os efeitos do poder heroico Cochilo Poderoso.
 * Regra oficial: Cura (20 + floor(nivel / 2)) PV e PM, cura todas as condições,
 * Defesa e M.Def tornam-se 5 até o início do próximo turno ou sofrer dano.
 *
 * @param {number} nivelPersonagem
 * @returns {{ valorCura: number, defesaTemporaria: number, encerraTurno: boolean }}
 */
export function calcularEfeitoCochiloPoderoso(nivelPersonagem = 5) {
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 1);
  const valorCura = 20 + Math.floor(nv / 2);
  return {
    valorCura,
    defesaTemporaria: 5,
    encerraTurno: true
  };
}

/**
 * Calcula o bônus de dano adicional nos ataques do companheiro fiel concedido
 * pelos poderes heroicos Lado a Lado (+5) e Companheiro Heroico (+5).
 * @param {Object} dadosAndarilho
 * @returns {number}
 */
export function calcularBonusDanoCompanheiro(dadosAndarilho) {
  if (!dadosAndarilho?.poderesHeroicos) return 0;
  let bonus = 0;
  if (dadosAndarilho.poderesHeroicos.ladoALado) bonus += 5;
  if (dadosAndarilho.poderesHeroicos.companheiroHeroico) bonus += 5;
  return bonus;
}

/**
 * Calcula o PV Máximo do companheiro fiel considerando o bônus de +10 do poder heroico Companheiro Heroico.
 * @param {number} pvMaxBase
 * @param {Object} dadosAndarilho
 * @returns {number}
 */
export function calcularPvMaxCompanheiro(pvMaxBase, dadosAndarilho) {
  const base = Number(pvMaxBase) || 20;
  if (dadosAndarilho?.poderesHeroicos?.companheiroHeroico) {
    return base + 10;
  }
  return base;
}

/**
 * Gera as ações de conflito oficiais da classe Andarilho para exibição e acionamento na Central de Turno.
 *
 * @param {Object} params
 * @returns {Array<Object>} Lista de ações de combate ativas/situacionais
 */
export function gerarAcoesConflitoAndarilho({
  classes = [],
  poderesHeroicos = [],
  ficha = null,
  companheiroFiel = null
} = {}) {
  const dados = extrairHabilidadesAndarilho({ classes, poderesHeroicos, ficha });
  const acoes = [];

  // 1. Ação de Conflito: Comandar Companheiro Fiel
  if (dados.habilidades.companheiroFiel.ativo && companheiroFiel) {
    const np = dados.habilidades.companheiroFiel.nivel;
    const bonusLadoALado = dados.poderesHeroicos.ladoALado ? 5 : 0;
    const bonusHeroico = dados.poderesHeroicos.companheiroHeroico ? 5 : 0;
    const danoExtraTotal = bonusLadoALado + bonusHeroico;

    acoes.push({
      id: 'andarilho_comandar_companheiro',
      codigo: 'COMANDAR_COMPANHEIRO',
      nome: `🐾 Comandar: ${companheiroFiel.nome || 'Companheiro Fiel'}`,
      nomeCurto: 'Comandar Companheiro',
      tipo: 'acao_combate',
      classe: 'Andarilho',
      nivel: np,
      custoPm: 0,
      descricao: `Gasta sua ação de turno para fazer seu companheiro realizar uma ação (ataque ou outra). Recebe +${np} na Precisão/Magia${danoExtraTotal > 0 ? ` e +${danoExtraTotal} dano adicional` : ''}.`,
      requerAlvo: false,
      isCompanheiroAction: true,
      temLadoALado: dados.poderesHeroicos.ladoALado
    });

    if (dados.poderesHeroicos.ladoALado) {
      acoes.push({
        id: 'andarilho_lado_a_lado_recuperar',
        codigo: 'LADO_A_LADO_PM',
        nome: '🤝 Lado a Lado: Recuperar PM',
        nomeCurto: 'Lado a Lado (10 PM)',
        tipo: 'reacao_suporte',
        classe: 'Andarilho',
        custoPm: 0,
        descricao: 'Após o companheiro realizar uma ação no seu turno: você e ele recuperam 10 PM cada.',
        isLadoALado: true,
        recuperarPmHeroi: 10,
        recuperarPmCompanheiro: 10
      });
    }
  }

  // 2. Ação de Conflito: Cochilo Poderoso
  if (dados.poderesHeroicos.cochiloPoderoso) {
    const efeito = calcularEfeitoCochiloPoderoso(dados.nivelTotal);
    acoes.push({
      id: 'andarilho_cochilo_poderoso',
      codigo: 'COCHILO_PODEROSO',
      nome: '💤 Cochilo Poderoso',
      nomeCurto: 'Cochilo Poderoso',
      tipo: 'acao_combate',
      classe: 'Andarilho',
      custoPm: 0,
      valorCura: efeito.valorCura,
      defesaTemporaria: efeito.defesaTemporaria,
      descricao: `Gasta 1 ação para recuperar ${efeito.valorCura} PV e PM, curando todas as condições. Encerra o turno e DEF/M.DEF tornam-se 5 até o próximo turno ou sofrer dano.`,
      encerraTurno: true,
      limparCondicoes: true
    });
  }

  // 3. Ação Situacional de Conflito: Prático
  if (dados.habilidades.pratico.ativo) {
    const npPratico = dados.habilidades.pratico.nivel;
    acoes.push({
      id: 'andarilho_pratico_suporte',
      codigo: 'PRATICO_SUPORTE',
      nome: '🎒 Suporte Prático (Andarilho)',
      nomeCurto: 'Suporte Prático',
      tipo: 'acao_suporte',
      classe: 'Andarilho',
      nivel: npPratico,
      custoPm: 5,
      descricao: `Aproveita a perícia de sobrevivente (NP ${npPratico}) para auxiliar aliados em combate com ferramentas e suprimentos táticos rápidos.`,
      requerAlvo: true
    });
  }

  return acoes;
}
