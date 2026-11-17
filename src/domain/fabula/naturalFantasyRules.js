/**
 * Fabula Ultima - Regras do Suplemento Atlas Fantasia Natural (Natural Fantasy Atlas)
 *
 * Módulo de Lógica Pura de Domínio para as 4 Classes Oficiais (PT-BR):
 * - Floralista (Floralist): Benefício Inicial (+5 PV ou +5 PM), Árvore da Vida, Cloromancia,
 *   Enxerto, Influência Verdejante, Jardinagem Marcial, O Jardim, Relógio de Germinação (4 seções) e 20 Magissementes.
 * - Gourmet: Benefício Inicial (+2 PI + Projetos Culinários), Cozinheiro Viajante, Culinária,
 *   Feito com Amor, Garfo e Faca, Sal e Pimenta, 5 Sabores (d6), 15 Combinações de Receitas e 12 Efeitos de Iguaria (d12).
 * - Invocador (Invoker): Benefício Inicial (+5 PV ou +5 PM), Cascata, Expandir Manancial,
 *   Harmonia Elemental, Invocação, Invocações Conectadas e 5 Mananciais Elementais (Ar, Terra, Fogo, Raio, Água).
 * - Mercador (Merchant): Benefício Inicial (+2 PI), Data de Validade, Estoque Pessoal,
 *   Já Ouvi Falar, Ventos do Comércio, Verdadeiro Tesouro, Pontos de Comércio e Prosperidade.
 *
 * CONFORME GEMINI.md:
 * - Camada de Domínio Puro (src/domain/fabula/): Funções puras em JavaScript (sem efeitos colaterais).
 * - Isolamento total: ZERO importações de React ou Supabase.
 */

// =============================================================================
// 1. CONSTANTES E TABELAS OFICIAIS (FANTASIA NATURAL)
// =============================================================================

export const NATURAL_FANTASY_CLASS_NAMES = {
  FLORALISTA: 'Floralista',
  GOURMET: 'Gourmet',
  INVOCADOR: 'Invocador',
  MERCADOR: 'Mercador'
};

export const CUSTO_PLANTAR_MAGISEED_PM = 20;
export const SECOES_RELOGIO_GERMINACAO = 4;
export const CUSTO_SAL_E_PIMENTA_PI = 2;
export const CUSTO_FEITO_COM_AMOR_POR_ALVO_PM = 10;
export const CUSTO_BASE_INVOCACAO_PM = 5;
export const CUSTO_INVOCACAO_CONECTADA_POR_ALVO_PM = 10;

export const SABORES_GOURMET = [
  { numero: 1, key: 'amargo', nome: 'Amargo', icone: '🍂' },
  { numero: 2, key: 'salgado', nome: 'Salgado', icone: '🧂' },
  { numero: 3, key: 'azedo', nome: 'Azedo', icone: '🍋' },
  { numero: 4, key: 'doce', nome: 'Doce', icone: '🍯' },
  { numero: 5, key: 'umami', nome: 'Umami', icone: '🍄' }
];

export const ORDEM_SABORES = ['amargo', 'salgado', 'azedo', 'doce', 'umami'];

export const PARES_SABORES_RECEITAS = [
  { key: 'amargo+amargo', sabores: ['amargo', 'amargo'], label: 'Amargo + Amargo' },
  { key: 'amargo+salgado', sabores: ['amargo', 'salgado'], label: 'Amargo + Salgado' },
  { key: 'amargo+azedo', sabores: ['amargo', 'azedo'], label: 'Amargo + Azedo' },
  { key: 'amargo+doce', sabores: ['amargo', 'doce'], label: 'Amargo + Doce' },
  { key: 'amargo+umami', sabores: ['amargo', 'umami'], label: 'Amargo + Umami' },
  { key: 'salgado+salgado', sabores: ['salgado', 'salgado'], label: 'Salgado + Salgado' },
  { key: 'salgado+azedo', sabores: ['salgado', 'azedo'], label: 'Salgado + Azedo' },
  { key: 'salgado+doce', sabores: ['salgado', 'doce'], label: 'Salgado + Doce' },
  { key: 'salgado+umami', sabores: ['salgado', 'umami'], label: 'Salgado + Umami' },
  { key: 'azedo+azedo', sabores: ['azedo', 'azedo'], label: 'Azedo + Azedo' },
  { key: 'azedo+doce', sabores: ['azedo', 'doce'], label: 'Azedo + Doce' },
  { key: 'azedo+umami', sabores: ['azedo', 'umami'], label: 'Azedo + Umami' },
  { key: 'doce+doce', sabores: ['doce', 'doce'], label: 'Doce + Doce' },
  { key: 'doce+umami', sabores: ['doce', 'umami'], label: 'Doce + Umami' },
  { key: 'umami+umami', sabores: ['umami', 'umami'], label: 'Umami + Umami' }
];

export const TABELA_EFEITOS_IGUARIA_PADRAO = [
  {
    numero_dado: 1,
    key: 'efeito_iguaria_1',
    nome: 'Curar Condição',
    requer_escolha: true,
    tipo_escolha: 'condicao',
    opcoes_escolha: ['atordoado', 'furioso', 'envenenado', 'abalado', 'lento', 'fraco'],
    somente_conflito: false,
    descricao: 'Cada alvo desta iguaria se recupera da condição (escolha uma: atordoado, furioso, envenenado, abalado, lento ou fraco).'
  },
  {
    numero_dado: 2,
    key: 'efeito_iguaria_2',
    nome: 'Causar Condição',
    requer_escolha: true,
    tipo_escolha: 'condicao',
    opcoes_escolha: ['atordoado', 'furioso', 'envenenado', 'abalado', 'lento', 'fraco'],
    somente_conflito: false,
    descricao: 'Cada alvo desta iguaria fica (escolha uma condição: atordoado, furioso, envenenado, abalado, lento ou fraco).'
  },
  {
    numero_dado: 3,
    key: 'efeito_iguaria_3',
    nome: 'Recuperar 40 PV (50 no Nv. 30+)',
    requer_escolha: false,
    tipo_escolha: null,
    opcoes_escolha: [],
    somente_conflito: false,
    descricao: 'Cada alvo desta iguaria recupera 40 Pontos de Vida. Se estiver no 30º nível ou acima, essa quantidade aumenta para 50.'
  },
  {
    numero_dado: 4,
    key: 'efeito_iguaria_4',
    nome: 'Recuperar 40 PM (50 no Nv. 30+)',
    requer_escolha: false,
    tipo_escolha: null,
    opcoes_escolha: [],
    somente_conflito: false,
    descricao: 'Cada alvo desta iguaria recupera 40 Pontos de Mana. Se estiver no 30º nível ou acima, essa quantidade aumenta para 50.'
  },
  {
    numero_dado: 5,
    key: 'efeito_iguaria_5',
    nome: 'Dano Elemental (20 / 30 no Nv. 30+)',
    requer_escolha: true,
    tipo_escolha: 'elemento',
    opcoes_escolha: ['fogo', 'gelo', 'raio', 'terra', 'veneno'],
    somente_conflito: true,
    descricao: 'Esta iguaria causa 20 pontos de dano de (escolha um tipo: fogo, gelo, raio, terra ou veneno) a cada um de seus alvos. Se estiver no 30º nível ou acima, esse dano aumenta para 30.'
  },
  {
    numero_dado: 6,
    key: 'efeito_iguaria_6',
    nome: 'Vulnerabilidade Elemental (+5 Dano)',
    requer_escolha: true,
    tipo_escolha: 'elemento',
    opcoes_escolha: ['fogo', 'gelo', 'raio', 'terra', 'veneno'],
    somente_conflito: true,
    descricao: 'Até o fim do seu próximo turno, cada fonte de dano de (escolha um tipo: fogo, gelo, raio, terra ou veneno) causa 5 pontos de dano adicional em cada um dos alvos dessa iguaria.'
  },
  {
    numero_dado: 7,
    key: 'efeito_iguaria_7',
    nome: 'Impedir Ação Guarda',
    requer_escolha: false,
    tipo_escolha: null,
    opcoes_escolha: [],
    somente_conflito: true,
    descricao: 'Cada alvo desta iguaria é impedido de fazer a ação Guarda no próximo turno dele.'
  },
  {
    numero_dado: 8,
    key: 'efeito_iguaria_8',
    nome: 'Impedir Ação Feitiço',
    requer_escolha: false,
    tipo_escolha: null,
    opcoes_escolha: [],
    somente_conflito: true,
    descricao: 'Cada alvo desta iguaria é impedido de fazer a ação Feitiço no próximo turno dele.'
  },
  {
    numero_dado: 9,
    key: 'efeito_iguaria_9',
    nome: 'Impedir Ação Poder',
    requer_escolha: false,
    tipo_escolha: null,
    opcoes_escolha: [],
    somente_conflito: true,
    descricao: 'Cada alvo desta iguaria é impedido de fazer a ação Poder no próximo turno dele.'
  },
  {
    numero_dado: 10,
    key: 'efeito_iguaria_10',
    nome: 'Resistência Elemental',
    requer_escolha: true,
    tipo_escolha: 'elemento',
    opcoes_escolha: ['fogo', 'gelo', 'raio', 'terra', 'veneno'],
    somente_conflito: true,
    descricao: 'Até o fim do seu próximo turno, cada alvo desta iguaria torna-se Resistente a dano de (escolha um tipo: fogo, gelo, raio, terra ou veneno).'
  },
  {
    numero_dado: 11,
    key: 'efeito_iguaria_11',
    nome: 'Aumentar Passo de Atributo (+1)',
    requer_escolha: true,
    tipo_escolha: 'atributo',
    opcoes_escolha: ['destreza', 'astucia', 'vigor', 'vontade'],
    somente_conflito: true,
    descricao: 'Cada alvo desta iguaria considera seu dado de (escolha um: Destreza, Astúcia, Vigor ou Vontade) como um passo maior (máximo de d12) até o final do seu próximo turno.'
  },
  {
    numero_dado: 12,
    key: 'efeito_iguaria_12',
    nome: 'Converter Tipo de Dano Causado',
    requer_escolha: true,
    tipo_escolha: 'elemento',
    opcoes_escolha: ['fogo', 'gelo', 'raio', 'terra', 'veneno'],
    somente_conflito: true,
    descricao: 'No próximo turno de cada alvo desta iguaria, todo dano causado por eles torna-se de (escolha um tipo: fogo, gelo, raio, terra ou veneno) e esse tipo não pode ser mudado.'
  }
];

export const MANANCIAIS_ELEMENTAIS = {
  ar: {
    key: 'ar',
    nome: 'Manancial de Ar',
    nomeCurto: 'Ar',
    tipoDano: 'ar',
    atributoCincoMananciais: 'astucia',
    atributoLabel: 'Astúcia'
  },
  terra: {
    key: 'terra',
    nome: 'Manancial de Terra',
    nomeCurto: 'Terra',
    tipoDano: 'terra',
    atributoCincoMananciais: 'escolha',
    atributoLabel: 'Atributo à Escolha'
  },
  fogo: {
    key: 'fogo',
    nome: 'Manancial de Fogo',
    nomeCurto: 'Fogo',
    tipoDano: 'fogo',
    atributoCincoMananciais: 'destreza',
    atributoLabel: 'Destreza'
  },
  raio: {
    key: 'raio',
    nome: 'Manancial de Raio',
    nomeCurto: 'Raio',
    tipoDano: 'raio',
    atributoCincoMananciais: 'vigor',
    atributoLabel: 'Vigor'
  },
  agua: {
    key: 'agua',
    nome: 'Manancial de Água',
    nomeCurto: 'Água',
    tipoDano: 'gelo',
    atributoCincoMananciais: 'vontade',
    atributoLabel: 'Vontade'
  }
};

// =============================================================================
// 2. AUXILIARES DE IDENTIFICAÇÃO E FORMATAÇÃO
// =============================================================================

/**
 * Normaliza strings para comparações insensíveis a acentos e maiúsculas.
 * @param {string} texto
 * @returns {string}
 */
export function normalizarTextoNF(texto = '') {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Verifica se o nome da classe corresponde a Floralista (ou alias Florista/Floralist).
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseFloralista(nomeClasse = '') {
  const norm = normalizarTextoNF(nomeClasse);
  return norm.includes('floralista') || norm.includes('florista') || norm.includes('floralist');
}

/**
 * Verifica se o nome da classe corresponde a Gourmet.
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseGourmet(nomeClasse = '') {
  return normalizarTextoNF(nomeClasse).includes('gourmet');
}

/**
 * Verifica se o nome da classe corresponde a Invocador (ou alias Invoker).
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseInvocador(nomeClasse = '') {
  const norm = normalizarTextoNF(nomeClasse);
  return norm.includes('invocador') || norm.includes('invoker');
}

/**
 * Verifica se o nome da classe corresponde a Mercador (ou alias Merchant).
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseMercador(nomeClasse = '') {
  const norm = normalizarTextoNF(nomeClasse);
  return norm.includes('mercador') || norm.includes('merchant');
}

/**
 * Verifica se o personagem adquiriu determinado Poder Heróico na ficha.
 * @param {Array} poderesHeroicos
 * @param {string} termoChaveOuNome
 * @returns {boolean}
 */
export function possuiPoderHeroicoNF(poderesHeroicos = [], termoChaveOuNome = '') {
  if (!Array.isArray(poderesHeroicos) || !termoChaveOuNome) return false;
  const alvo = normalizarTextoNF(termoChaveOuNome);
  return poderesHeroicos.some((p) => {
    const key = normalizarTextoNF(typeof p === 'string' ? p : p?.key || '');
    const nome = normalizarTextoNF(typeof p === 'string' ? p : p?.nome || '');
    return key === alvo || nome === alvo || key.includes(alvo) || nome.includes(alvo);
  });
}

// =============================================================================
// 3. REGRAS PURAS - FLORALISTA (CLOROMANCIA, JARDIM E MAGISSEMENTES)
// =============================================================================

/**
 * Extrai a escolha permanente de benefício inicial do Floralista (+5 PV ou +5 PM).
 * @param {Object} classeFloralista
 * @param {Object} [ficha=null]
 * @returns {{ escolha: 'pv'|'pm', bonusPv: number, bonusPm: number, confirmado: boolean }}
 */
export function extrairBeneficioInicialFloralista(classeFloralista = null, ficha = null) {
  const habs = Array.isArray(classeFloralista?.habilidades) ? classeFloralista.habilidades : [];
  const habCloro = habs.find((h) => normalizarTextoNF(h?.nome).includes('cloromancia'));
  const escolhaSalva =
    classeFloralista?.dados_floralista?.beneficioInicial ||
    habCloro?.dados_floralista?.beneficioInicial ||
    ficha?.dados_floralista?.beneficioInicial;

  if (escolhaSalva === 'pm') {
    return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: true };
  }
  if (escolhaSalva === 'pv') {
    return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: true };
  }

  const textoBeneficio = normalizarTextoNF(
    typeof classeFloralista?.beneficios === 'object'
      ? classeFloralista?.beneficios?.texto
      : classeFloralista?.beneficios
  );

  if (textoBeneficio.includes('pv ou pm') || textoBeneficio.includes('a sua escolha')) {
    return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: false };
  }
  if (textoBeneficio.includes('pv') && !textoBeneficio.includes('pm')) {
    return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: true };
  }
  return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: true };
}

/**
 * Gera o texto oficial atualizado do benefício inicial de +5 PV ou +5 PM.
 * @param {'pv'|'pm'} escolha
 * @returns {string}
 */
export function gerarTextoBeneficioPvOuPm(escolha = 'pv') {
  return escolha === 'pm'
    ? 'Aumente permanentemente seus PM máximos em 5.'
    : 'Aumente permanentemente seus PV máximos em 5.';
}

/**
 * Calcula quantas magissementes o Floralista conhece pelo nível em Cloromancia (máx 10).
 * @param {number} nvCloromancia
 * @returns {number}
 */
export function calcularLimiteMagiseedsAprendidas(nvCloromancia = 0) {
  return Math.max(0, Math.min(10, parseInt(nvCloromancia, 10) || 0));
}

/**
 * Calcula a recuperação de PV concedida por Árvore da Vida ao remover uma magissemente do jardim
 * para uma criatura visível em Crise: 5 + (NP × 5) PV.
 * @param {number} nvArvoreDaVida
 * @returns {number}
 */
export function calcularCuraArvoreDaVida(nvArvoreDaVida = 0) {
  const np = Math.max(0, Math.min(5, parseInt(nvArvoreDaVida, 10) || 0));
  return np > 0 ? 5 + (np * 5) : 0;
}

/**
 * Calcula o custo máximo de PM de um feitiço lançado gratuitamente via Jardinagem Marcial: 5 + (NP × 5) PM.
 * @param {number} nvJardinagemMarcial
 * @returns {number}
 */
export function calcularLimitePmJardinagemMarcial(nvJardinagemMarcial = 0) {
  const np = Math.max(0, Math.min(3, parseInt(nvJardinagemMarcial, 10) || 0));
  return np > 0 ? 5 + (np * 5) : 0;
}

/**
 * Resolve o efeito exato e os modificadores passivos/ativos de uma Magissemente na seção atual (0, 1, 2 ou 3)
 * considerando o NP em Cloromancia e o escalonamento de Nível 30+ (+5 Dano, +10 Cura/Perda de PV/PM).
 * @param {Object} params
 * @returns {Object}
 */
export function resolverEfeitoMagiseedNaSecao({
  magiseed = null,
  secaoAtual = 0,
  nvCloromancia = 1,
  nivelPersonagem = 5,
  escolhaElemento = null,
  temDedoVerde = false
} = {}) {
  const sec = Math.max(0, Math.min(4, parseInt(secaoAtual, 10) || 0));
  const np = Math.max(1, parseInt(nvCloromancia, 10) || 1);
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  const bonusDanoNv30 = nv >= 30 ? 5 : 0;
  const bonusCuraNv30 = nv >= 30 ? 10 : 0;

  if (!magiseed || sec >= 4) {
    return {
      ativa: false,
      secao: sec,
      textoSecao: sec >= 4 ? '4ª seção preenchida: A magissemente floresce por completo, deixa o jardim e o relógio é apagado.' : 'Nenhuma magissemente plantada no jardim.',
      resistencias: [],
      imunidadesCondicao: [],
      aumentosAtributo: { destreza: 0, astucia: 0, vigor: 0, vontade: 0 },
      conversaoDano: null,
      bonusDanoVenenoBeladona: 0,
      curaPvFimTurno: 0,
      curaPmFimTurno: 0,
      curaPiFimTurno: 0,
      danoFimTurno: 0,
      tipoDanoFimTurno: null,
      retaliacaoFisica: 0,
      golpesRetaliacao: 0,
      opcoesConversao: []
    };
  }

  const campoTexto = `efeito_secao_${sec}`;
  const textoBruto = magiseed[campoTexto] || null;
  const configSecao = magiseed?.efeitos_por_secao?.[String(sec)] || {};

  const resistencias = Array.isArray(configSecao.resistencias) ? [...configSecao.resistencias] : [];
  const imunidadesCondicao = Array.isArray(configSecao.imunidadesCondicao) ? [...configSecao.imunidadesCondicao] : [];
  const aumentosAtributo = {
    destreza: configSecao.aumentosAtributo?.destreza || 0,
    astucia: configSecao.aumentosAtributo?.astucia || 0,
    vigor: configSecao.aumentosAtributo?.vigor || 0,
    vontade: configSecao.aumentosAtributo?.vontade || 0
  };

  const opcoesConversao = Array.isArray(configSecao.opcoesConversao) ? configSecao.opcoesConversao : [];
  const conversaoDano = configSecao.conversaoDano || (opcoesConversao.includes(escolhaElemento) ? escolhaElemento : opcoesConversao[0] || null);
  const bonusDanoVenenoBeladona = configSecao.bonusDanoNp ? np + bonusDanoNv30 : 0;

  const curaPvFimTurno = configSecao.curaPvBase
    ? configSecao.curaPvBase + (configSecao.somaNpCloromancia ? np : 0) + bonusCuraNv30
    : 0;
  const curaPmFimTurno = configSecao.curaPmBase
    ? configSecao.curaPmBase + (configSecao.somaNpCloromancia ? np : 0) + bonusCuraNv30
    : 0;
  const curaPiFimTurno = configSecao.curaPi || 0;

  const danoFimTurno = configSecao.danoBase
    ? configSecao.danoBase + (configSecao.somaNpCloromancia ? np : 0) + bonusDanoNv30
    : 0;
  const tipoDanoFimTurno = configSecao.tipoDano || null;

  const retaliacaoFisica = configSecao.retaliacaoFisicaBase
    ? configSecao.retaliacaoFisicaBase + np + bonusDanoNv30
    : 0;
  const golpesRetaliacao = configSecao.golpesRetaliacao || 0;

  let textoResolvido = textoBruto || 'Sem efeito ativo nesta seção do relógio.';
  if (textoBruto) {
    textoResolvido = textoBruto
      .replace(/\(15 \+ seu NP em Cloromancia\)/gi, `${15 + np + bonusDanoNv30}`)
      .replace(/\(5 \+ seu NP em Cloromancia\)/gi, `${5 + np + (curaPmFimTurno > 0 ? bonusCuraNv30 : bonusDanoNv30)}`)
      .replace(/\(seu NP em Cloromancia\)/gi, `${np + bonusDanoNv30}`);
    if (curaPvFimTurno > 0) {
      textoResolvido = textoBruto.replace(/\(15 \+ seu NP em Cloromancia\)/gi, `${curaPvFimTurno}`);
    }
  }

  return {
    ativa: true,
    secao: sec,
    textoSecao: textoResolvido,
    temEfeitoNaSecao: Boolean(textoBruto),
    resistencias,
    imunidadesCondicao,
    aumentosAtributo,
    conversaoDano,
    ignoraResistencias: Boolean(configSecao.ignoraResistencias || configSecao.ignoraAfinidades || temDedoVerde),
    bonusDanoVenenoBeladona,
    curaPvFimTurno,
    curaPmFimTurno,
    curaPiFimTurno,
    danoFimTurno,
    tipoDanoFimTurno,
    condicaoRequeridaDano: configSecao.condicaoRequerida || null,
    condicaoInimigoFimTurno: configSecao.condicaoInimigo || null,
    removeCondicoesFimTurno: configSecao.removeCondicoes || [],
    retaliacaoFisica,
    golpesRetaliacao,
    opcoesConversao
  };
}

/**
 * Processa o plantio de uma Magissemente no Jardim (via Cloromancia por 20 PM ou Enxerto por 0 PM).
 * @param {Object} params
 * @returns {Object}
 */
export function processarPlantioMagiseed({
  magiseed = null,
  mpAtual = 0,
  magiseedAtualNoJardim = null,
  secaoRelogioAtual = 0,
  nvCloromancia = 0,
  nvEnxerto = 0,
  nvJardinagemMarcial = 0,
  nvArvoreDaVida = 0,
  usarEnxerto = false,
  decretoDobrarPmAtivo = false,
  escolhaElemento = null,
  nivelPersonagem = 5
} = {}) {
  if (!magiseed) {
    return { sucesso: false, mensagem: 'Selecione uma magissemente conhecida para plantar no jardim.' };
  }
  const npCloro = Math.max(0, parseInt(nvCloromancia, 10) || 0);
  if (npCloro <= 0) {
    return { sucesso: false, mensagem: 'Adquira níveis em Cloromancia para plantar magissementes.' };
  }

  if (usarEnxerto) {
    if (nvEnxerto <= 0) {
      return { sucesso: false, mensagem: 'Você não possui a habilidade Enxerto.' };
    }
    if (!magiseedAtualNoJardim || secaoRelogioAtual < 1) {
      return {
        sucesso: false,
        mensagem: 'Enxerto exige uma magissemente no jardim e pelo menos 1 seção preenchida no relógio de germinação.'
      };
    }
    if (magiseedAtualNoJardim.key === magiseed.key) {
      return { sucesso: false, mensagem: 'Enxerto exige plantar uma magissemente diferente da atual.' };
    }

    const curaArvore = calcularCuraArvoreDaVida(nvArvoreDaVida);
    const efeitoInicial = resolverEfeitoMagiseedNaSecao({
      magiseed,
      secaoAtual: secaoRelogioAtual,
      nvCloromancia: npCloro,
      nivelPersonagem,
      escolhaElemento
    });

    return {
      sucesso: true,
      custoPm: 0,
      usouEnxerto: true,
      novaMagiseed: magiseed,
      novaSecaoRelogio: secaoRelogioAtual,
      curaArvoreDaVidaDisponivel: curaArvore,
      efeitoAtual: efeitoInicial,
      extras: curaArvore > 0
        ? [`Árvore da Vida: Magissemente anterior removida! Uma criatura visível em Crise recupera ${curaArvore} PV.`]
        : [],
      mensagem: `Enxerto realizado! ${magiseedAtualNoJardim.nome} substituída por ${magiseed.nome} mantendo o relógio em ${secaoRelogioAtual}/4.`
    };
  }

  if (magiseedAtualNoJardim) {
    return {
      sucesso: false,
      mensagem: 'Seu jardim já possui uma magissemente enraizada. Use Enxerto (se tiver 1+ seção) ou remova-a primeiro.'
    };
  }

  const custoPm = decretoDobrarPmAtivo ? CUSTO_PLANTAR_MAGISEED_PM * 2 : CUSTO_PLANTAR_MAGISEED_PM;
  const mp = Math.max(0, parseInt(mpAtual, 10) || 0);
  if (mp < custoPm) {
    return {
      sucesso: false,
      mensagem: `PM insuficiente! Plantar uma magissemente requer ${custoPm} PM e você possui ${mp} PM.`
    };
  }

  const extras = [];
  if (nvJardinagemMarcial > 0) {
    const limitePmFeitico = calcularLimitePmJardinagemMarcial(nvJardinagemMarcial);
    extras.push(
      `Jardinagem Marcial (NP ${nvJardinagemMarcial}): Escolha entre fazer um ataque livre com arma equipada (RA = 0) OU lançar um feitiço de até ${limitePmFeitico} PM sem gastar ação (pagando o PM, RA = 0).`
    );
  }

  const efeitoInicial = resolverEfeitoMagiseedNaSecao({
    magiseed,
    secaoAtual: 0,
    nvCloromancia: npCloro,
    nivelPersonagem,
    escolhaElemento
  });

  return {
    sucesso: true,
    custoPm,
    usouEnxerto: false,
    novaMagiseed: magiseed,
    novaSecaoRelogio: 0,
    curaArvoreDaVidaDisponivel: 0,
    efeitoAtual: efeitoInicial,
    extras,
    mensagem: `${magiseed.nome} plantada no jardim (-${custoPm} PM)! Relógio de Germinação: 0/4.`
  };
}

/**
 * Processa o avanço do Relógio de Germinação no fim do turno (ou ajuste com Dedo Verde).
 * @param {Object} params
 * @returns {Object}
 */
export function processarAvancoRelogioGerminacao({
  magiseedAtiva = null,
  secaoAtual = 0,
  deltaSecoes = 1,
  modificadorDedoVerde = 0,
  dedoVerdeUsadoCiclo = false,
  nvCloromancia = 1,
  nvArvoreDaVida = 0,
  nivelPersonagem = 5,
  escolhaElemento = null,
  temDedoVerde = false
} = {}) {
  if (!magiseedAtiva) {
    return { sucesso: false, mensagem: 'Não há magissemente plantada no jardim para avançar o relógio.' };
  }

  let avancoReal = parseInt(deltaSecoes, 10) || 1;
  let usouDedoVerdeAgora = false;

  if (temDedoVerde && modificadorDedoVerde !== 0) {
    if (dedoVerdeUsadoCiclo) {
      return {
        sucesso: false,
        mensagem: 'Dedo Verde já foi utilizado neste ciclo! Só pode ser usado novamente após o relógio esvaziar por completo.'
      };
    }
    avancoReal = Math.max(0, avancoReal + (modificadorDedoVerde > 0 ? 1 : -1));
    usouDedoVerdeAgora = true;
  }

  const novaSecaoBruta = Math.max(0, (parseInt(secaoAtual, 10) || 0) + avancoReal);

  // Ao preencher a 4ª seção, remove a magissemente e apaga o relógio
  if (novaSecaoBruta >= SECOES_RELOGIO_GERMINACAO) {
    const curaArvore = calcularCuraArvoreDaVida(nvArvoreDaVida);
    return {
      sucesso: true,
      cicloConcluido: true,
      novaMagiseed: null,
      novaSecaoRelogio: 0,
      novoDedoVerdeUsado: false,
      curaArvoreDaVidaDisponivel: curaArvore,
      efeitoResolvido: null,
      mensagem: `Relógio atingiu 4/4! ${magiseedAtiva.nome} deixou o jardim e o relógio foi zerado.${curaArvore > 0 ? ` Árvore da Vida: cure ${curaArvore} PV de uma criatura em Crise!` : ''}`
    };
  }

  const efeitoResolvido = resolverEfeitoMagiseedNaSecao({
    magiseed: magiseedAtiva,
    secaoAtual: novaSecaoBruta,
    nvCloromancia,
    nivelPersonagem,
    escolhaElemento,
    temDedoVerde
  });

  return {
    sucesso: true,
    cicloConcluido: false,
    novaMagiseed: magiseedAtiva,
    novaSecaoRelogio: novaSecaoBruta,
    novoDedoVerdeUsado: Boolean(dedoVerdeUsadoCiclo || usouDedoVerdeAgora),
    curaArvoreDaVidaDisponivel: 0,
    efeitoResolvido,
    mensagem: `Relógio de Germinação: ${novaSecaoBruta}/4 (${magiseedAtiva.nome}). ${efeitoResolvido.textoSecao}`
  };
}

// =============================================================================
// 4. REGRAS PURAS - GOURMET (CULINÁRIA, SABORES, RECEITAS E IGUARIAS)
// =============================================================================

/**
 * Calcula a capacidade máxima da bolsa de ingredientes: 10 + (NP em Culinária × 5).
 * @param {number} nvCulinaria
 * @returns {number}
 */
export function calcularCapacidadeIngredientes(nvCulinaria = 0) {
  const np = Math.max(0, Math.min(5, parseInt(nvCulinaria, 10) || 0));
  return np > 0 ? 10 + (np * 5) : 0;
}

/**
 * Calcula quantos ingredientes o Gourmet recebe ao descansar em assentamento (NP em Culinária)
 * e após rolagem de viagem (NP em Cozinheiro Viajante × 2, se tiver Culinária).
 * @param {number} nvCulinaria
 * @param {number} nvCozinheiroViajante
 * @returns {{ ganhoDescanso: number, ganhoViagem: number }}
 */
export function calcularGanhosIngredientes(nvCulinaria = 0, nvCozinheiroViajante = 0) {
  const npCul = Math.max(0, Math.min(5, parseInt(nvCulinaria, 10) || 0));
  const npVia = Math.max(0, Math.min(3, parseInt(nvCozinheiroViajante, 10) || 0));
  return {
    ganhoDescanso: npCul,
    ganhoViagem: npCul > 0 ? npVia * 2 : 0
  };
}

/**
 * Gera a chave canônica ordenada para um par de sabores (ex: 'salgado' e 'amargo' -> 'amargo+salgado').
 * @param {string} saborA
 * @param {string} saborB
 * @returns {string}
 */
export function gerarChaveParSabores(saborA = '', saborB = '') {
  const a = normalizarTextoNF(saborA);
  const b = normalizarTextoNF(saborB);
  const idxA = ORDEM_SABORES.indexOf(a);
  const idxB = ORDEM_SABORES.indexOf(b);
  if (idxA <= idxB) return `${a}+${b}`;
  return `${b}+${a}`;
}

/**
 * Extrai todas as combinações únicas de 2 sabores a partir de uma lista de 2, 3 ou 4 sabores.
 * Segue a regra oficial: "Cada combinação diferente de dois sabores (mesmo que seja o mesmo sabor
 * usado duas vezes) acrescenta um efeito à iguaria."
 * @param {Array<string>} saboresSelecionados
 * @returns {Array<string>}
 */
export function extrairParesDeSabores(saboresSelecionados = []) {
  if (!Array.isArray(saboresSelecionados) || saboresSelecionados.length < 2) return [];
  const paresSet = new Set();
  for (let i = 0; i < saboresSelecionados.length; i++) {
    for (let j = i + 1; j < saboresSelecionados.length; j++) {
      const s1 = normalizarTextoNF(saboresSelecionados[i]);
      const s2 = normalizarTextoNF(saboresSelecionados[j]);
      if (ORDEM_SABORES.includes(s1) && ORDEM_SABORES.includes(s2)) {
        paresSet.add(gerarChaveParSabores(s1, s2));
      }
    }
  }
  return Array.from(paresSet);
}

/**
 * Rola ou define um sabor de ingrediente na tabela 1d6.
 * @param {number|null} [d6Predefinido=null]
 * @param {string} [saborEscolhaSe6='umami']
 * @returns {{ dado: number, sabor: string, nomeSabor: string, foiEscolha: boolean }}
 */
export function rolarSaborIngrediente(d6Predefinido = null, saborEscolhaSe6 = 'umami') {
  const dado = d6Predefinido || (Math.floor(Math.random() * 6) + 1);
  if (dado >= 1 && dado <= 5) {
    const obj = SABORES_GOURMET[dado - 1];
    return { dado, sabor: obj.key, nomeSabor: obj.nome, foiEscolha: false };
  }
  const escolhaNorm = normalizarTextoNF(saborEscolhaSe6);
  const objEscolha = SABORES_GOURMET.find((s) => s.key === escolhaNorm) || SABORES_GOURMET[4];
  return { dado: 6, sabor: objEscolha.key, nomeSabor: objEscolha.nome, foiEscolha: true };
}

/**
 * Descobre proceduralmente o efeito de uma combinação inédita de dois sabores (1d12),
 * garantindo a regra de unicidade: "Duas combinações de sabores em sua ficha de receitas não podem ter efeitos idênticos."
 * @param {Object} params
 * @returns {Object}
 */
export function descobrirEfeitoParSabor({
  parKey,
  livroReceitas = {},
  catalogoEfeitos = TABELA_EFEITOS_IGUARIA_PADRAO,
  d12Predefinido = null,
  escolhaPredefinida = null
} = {}) {
  const baseCatalogo = Array.isArray(catalogoEfeitos) && catalogoEfeitos.length >= 12
    ? catalogoEfeitos
    : TABELA_EFEITOS_IGUARIA_PADRAO;

  const assinaturasUsadas = new Set(
    Object.entries(livroReceitas)
      .filter(([k]) => k !== parKey)
      .map(([, val]) => `${val?.numero_dado || val?.numeroEfeito}:${normalizarTextoNF(val?.escolha || '')}`)
  );

  const tentarGerar = (numDado) => {
    const def = baseCatalogo.find((e) => Number(e.numero_dado) === numDado) || TABELA_EFEITOS_IGUARIA_PADRAO[numDado - 1];
    if (!def) return null;

    if (!def.requer_escolha) {
      const sig = `${numDado}:`;
      if (assinaturasUsadas.has(sig)) return null;
      return {
        parKey,
        numero_dado: numDado,
        nome: def.nome,
        escolha: null,
        somente_conflito: Boolean(def.somente_conflito),
        descricao: def.descricao
      };
    }

    const opcoes = Array.isArray(def.opcoes_escolha) ? def.opcoes_escolha : [];
    const candidatos = escolhaPredefinida && opcoes.includes(normalizarTextoNF(escolhaPredefinida))
      ? [normalizarTextoNF(escolhaPredefinida), ...opcoes.filter((o) => o !== normalizarTextoNF(escolhaPredefinida))]
      : opcoes;

    const opcaoLivre = candidatos.find((op) => !assinaturasUsadas.has(`${numDado}:${normalizarTextoNF(op)}`));
    if (!opcaoLivre) return null;

    const descResolvida = (def.descricao || '').replace(/\(escolha[^)]+\)/i, opcaoLivre.toUpperCase());
    return {
      parKey,
      numero_dado: numDado,
      nome: `${def.nome} (${opcaoLivre.toUpperCase()})`,
      escolha: opcaoLivre,
      somente_conflito: Boolean(def.somente_conflito),
      descricao: descResolvida
    };
  };

  if (d12Predefinido && d12Predefinido >= 1 && d12Predefinido <= 12) {
    const direto = tentarGerar(d12Predefinido);
    if (direto) return direto;
  }

  // Sorteia entre os números de 1 a 12 embaralhados até encontrar uma combinação inédita
  const ordemTentativa = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(() => Math.random() - 0.5);
  for (const num of ordemTentativa) {
    const res = tentarGerar(num);
    if (res) return res;
  }

  // Fallback caso todas as 15 já estejam tomadas
  return tentarGerar(3) || {
    parKey,
    numero_dado: 3,
    nome: 'Recuperar 40 PV (50 no Nv. 30+)',
    escolha: null,
    somente_conflito: false,
    descricao: 'Cada alvo desta iguaria recupera 40 Pontos de Vida.'
  };
}

/**
 * Resolve os valores numéricos e interações de uma combinação de receita.
 * Considera Nível 30+, Data de Validade (Mercador), Escudo-tampa (+5 dano) e Pimenta em Pó (fogo).
 * @param {Object} params
 * @returns {Object}
 */
export function resolverValoresEfeitoIguaria({
  registroReceita,
  nivelPersonagem = 5,
  usarDataDeValidade = false,
  nvDataDeValidade = 0,
  multiAlvos = false,
  temEscudoTampa = false,
  temPimentaEmPo = false
} = {}) {
  if (!registroReceita) return null;
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  const num = Number(registroReceita.numero_dado || registroReceita.numeroEfeito);
  const escolha = registroReceita.escolha || null;

  if (num === 3) {
    if (usarDataDeValidade && nvDataDeValidade > 0) {
      const danoVenenoBruto = Math.floor(nv / 2) + (nvDataDeValidade * 10) + (temEscudoTampa ? 5 : 0);
      const danoFinal = multiAlvos ? Math.floor(danoVenenoBruto / 2) : danoVenenoBruto;
      const tipoDano = temPimentaEmPo ? 'fogo' : 'veneno';
      return {
        numero_dado: 3,
        tipo: 'dano_validade',
        dano: danoFinal,
        tipoDano,
        curaPv: 0,
        texto: `Data de Validade: Em vez de recuperar PV, causa ${danoFinal} de dano de ${tipoDano}!`
      };
    }
    const curaPv = nv >= 30 ? 50 : 40;
    return {
      numero_dado: 3,
      tipo: 'cura_pv',
      curaPv,
      texto: `Recupera ${curaPv} PV.`
    };
  }

  if (num === 4) {
    const curaPm = nv >= 30 ? 50 : 40;
    return {
      numero_dado: 4,
      tipo: 'cura_pm',
      curaPm,
      texto: `Recupera ${curaPm} PM.`
    };
  }

  if (num === 5) {
    const danoBase = (nv >= 30 ? 30 : 20) + (temEscudoTampa ? 5 : 0);
    const tipoDano = temPimentaEmPo ? 'fogo' : (escolha || 'fogo');
    return {
      numero_dado: 5,
      tipo: 'dano_elemental',
      dano: danoBase,
      tipoDano,
      texto: `Causa ${danoBase} de dano de ${tipoDano}.`
    };
  }

  if (num === 10) {
    return {
      numero_dado: 10,
      tipo: 'resistencia',
      elemento: escolha || 'fogo',
      texto: `Concede Resistência a dano de ${escolha || 'fogo'} até o fim do seu próximo turno.`
    };
  }

  if (num === 11) {
    return {
      numero_dado: 11,
      tipo: 'aumento_atributo',
      atributo: normalizarTextoNF(escolha || 'vigor'),
      texto: `Aumenta o dado de ${(escolha || 'vigor').toUpperCase()} em +1 passo (máx. d12) até o fim do seu próximo turno.`
    };
  }

  if (num === 12) {
    return {
      numero_dado: 12,
      tipo: 'conversao_dano',
      elemento: escolha || 'fogo',
      texto: `Todo dano causado no próximo turno torna-se de ${escolha || 'fogo'}.`
    };
  }

  return {
    numero_dado: num,
    tipo: 'outro',
    escolha,
    texto: registroReceita.descricao || registroReceita.nome
  };
}

/**
 * Processa a preparação completa de uma Iguaria via Culinária.
 * @param {Object} params
 * @returns {Object}
 */
export function processarPreparoIguaria({
  saboresEscolhidos = [],
  estoqueSabores = {},
  livroReceitas = {},
  catalogoEfeitos = TABELA_EFEITOS_IGUARIA_PADRAO,
  nvCulinaria = 0,
  nvFeitoComAmor = 0,
  alvosExtrasFeitoComAmor = 0,
  temGarfoEFaca = false,
  usarGarfoEFaca = false,
  temSalEPimenta = false,
  usarSalEPimenta = false,
  saborOriginalSalEPimenta = '',
  saborNovoSalEPimenta = '',
  modoAplicacao = 'aliados',
  aplicarEmSiMesmo = true,
  usarDataDeValidade = false,
  nvDataDeValidade = 0,
  temRodizio = false,
  temConcha = false,
  temEscudoTampa = false,
  temPimentaEmPo = false,
  mpAtual = 0,
  piAtual = 0,
  decretoDobrarPmAtivo = false,
  nivelPersonagem = 5
} = {}) {
  const npCul = Math.max(0, parseInt(nvCulinaria, 10) || 0);
  if (npCul <= 0) {
    return { sucesso: false, mensagem: 'Adquira níveis em Culinária para preparar iguarias.' };
  }

  const maxIngredientes = temRodizio ? 4 : 3;
  if (!Array.isArray(saboresEscolhidos) || saboresEscolhidos.length < 2 || saboresEscolhidos.length > maxIngredientes) {
    return {
      sucesso: false,
      mensagem: `Selecione de 2 a ${maxIngredientes} ingredientes para preparar a iguaria.`
    };
  }

  // Verifica estoque de ingredientes por sabor
  const contagemNecessaria = {};
  saboresEscolhidos.forEach((s) => {
    const key = normalizarTextoNF(s);
    contagemNecessaria[key] = (contagemNecessaria[key] || 0) + 1;
  });

  for (const [saborKey, qtd] of Object.entries(contagemNecessaria)) {
    const disp = parseInt(estoqueSabores?.[saborKey], 10) || 0;
    if (disp < qtd) {
      return {
        sucesso: false,
        mensagem: `Ingredientes insuficientes do sabor "${saborKey.toUpperCase()}" (necessário: ${qtd}, disponível: ${disp}).`
      };
    }
  }

  // Sal e Pimenta: gasta 2 PI para alterar 1 sabor após retirar do estoque
  const custoPi = usarSalEPimenta && temSalEPimenta ? CUSTO_SAL_E_PIMENTA_PI : 0;
  const pi = Math.max(0, parseInt(piAtual, 10) || 0);
  if (pi < custoPi) {
    return {
      sucesso: false,
      mensagem: `PI insuficiente para Sal e Pimenta! Requer ${custoPi} PI e você possui ${pi} PI.`
    };
  }

  // Feito com Amor: até NP (ou NP+1 com Concha, máx 4) aliados adicionais por 10 PM cada
  const maxAlvosExtras = nvFeitoComAmor > 0
    ? Math.min(4, nvFeitoComAmor + (temConcha ? 1 : 0))
    : 0;
  const extrasValidos = modoAplicacao === 'aliados'
    ? Math.max(0, Math.min(maxAlvosExtras, parseInt(alvosExtrasFeitoComAmor, 10) || 0))
    : 0;
  const custoPmBase = extrasValidos * CUSTO_FEITO_COM_AMOR_POR_ALVO_PM;
  const custoPm = decretoDobrarPmAtivo ? custoPmBase * 2 : custoPmBase;
  const mp = Math.max(0, parseInt(mpAtual, 10) || 0);

  if (mp < custoPm) {
    return {
      sucesso: false,
      mensagem: `PM insuficiente para Feito com Amor! Requer ${custoPm} PM e você possui ${mp} PM.`
    };
  }

  // Aplica alteração de sabor do Sal e Pimenta para formar os pares
  const saboresFinais = [...saboresEscolhidos.map((s) => normalizarTextoNF(s))];
  if (usarSalEPimenta && temSalEPimenta && saborOriginalSalEPimenta && saborNovoSalEPimenta) {
    const idxTroca = saboresFinais.indexOf(normalizarTextoNF(saborOriginalSalEPimenta));
    if (idxTroca !== -1) {
      saboresFinais[idxTroca] = normalizarTextoNF(saborNovoSalEPimenta);
    }
  }

  // Consome os ingredientes originais do estoque
  const novoEstoque = { ...estoqueSabores };
  Object.entries(contagemNecessaria).forEach(([saborKey, qtd]) => {
    novoEstoque[saborKey] = Math.max(0, (parseInt(novoEstoque[saborKey], 10) || 0) - qtd);
  });

  // Extrai pares únicos e descobre/consulta receitas
  const pares = extrairParesDeSabores(saboresFinais);
  const novoLivroReceitas = { ...livroReceitas };
  const receitasAplicadas = [];
  const novasDescobertas = [];

  pares.forEach((parKey) => {
    if (!novoLivroReceitas[parKey]) {
      const descoberta = descobrirEfeitoParSabor({
        parKey,
        livroReceitas: novoLivroReceitas,
        catalogoEfeitos
      });
      novoLivroReceitas[parKey] = descoberta;
      novasDescobertas.push(descoberta);
    }
    receitasAplicadas.push(novoLivroReceitas[parKey]);
  });

  // Regra oficial: máximo 1 efeito do tipo 5 (dano) e máximo 1 efeito do tipo 12 (conversão de dano)
  let jaTemTipo5 = false;
  let jaTemTipo12 = false;
  const efeitosResolvidos = [];

  receitasAplicadas.forEach((rec) => {
    const num = Number(rec.numero_dado);
    if (num === 5) {
      if (jaTemTipo5) return;
      jaTemTipo5 = true;
    }
    if (num === 12) {
      if (jaTemTipo12) return;
      jaTemTipo12 = true;
    }
    const resolvido = resolverValoresEfeitoIguaria({
      registroReceita: rec,
      nivelPersonagem,
      usarDataDeValidade,
      nvDataDeValidade,
      multiAlvos: extrasValidos > 0 || modoAplicacao === 'ataque_livre',
      temEscudoTampa,
      temPimentaEmPo
    });
    if (resolvido) efeitosResolvidos.push({ ...resolvido, parKey: rec.parKey });
  });

  // Consolida curas e buffs aplicados ao próprio personagem se aplicável
  let curaPvProprio = 0;
  let curaPmProprio = 0;
  const aumentosAtributoPrato = { destreza: 0, astucia: 0, vigor: 0, vontade: 0 };
  const resistenciasPrato = [];
  let conversaoDanoPrato = null;
  const condicoesRemovidas = [];

  if (modoAplicacao === 'aliados' && aplicarEmSiMesmo) {
    efeitosResolvidos.forEach((ef) => {
      if (ef.tipo === 'cura_pv') curaPvProprio += ef.curaPv;
      if (ef.tipo === 'cura_pm') curaPmProprio += ef.curaPm;
      if (ef.tipo === 'aumento_atributo' && aumentosAtributoPrato[ef.atributo] !== undefined) {
        aumentosAtributoPrato[ef.atributo] += 1;
      }
      if (ef.tipo === 'resistencia' && ef.elemento) {
        resistenciasPrato.push(ef.elemento);
      }
      if (ef.tipo === 'conversao_dano' && ef.elemento) {
        conversaoDanoPrato = ef.elemento;
      }
      if (ef.numero_dado === 1 && ef.escolha) {
        condicoesRemovidas.push(ef.escolha);
      }
    });
  }

  const temBuffsCena =
    Object.values(aumentosAtributoPrato).some((v) => v > 0) ||
    resistenciasPrato.length > 0 ||
    Boolean(conversaoDanoPrato);

  const pratoAtivoCena = temBuffsCena
    ? {
        pares,
        aumentosAtributo: aumentosAtributoPrato,
        resistencias: resistenciasPrato,
        conversaoDano: conversaoDanoPrato,
        resumo: efeitosResolvidos.map((e) => e.texto).join(' • ')
      }
    : null;

  const garfoEFacaAtivo = Boolean(
    modoAplicacao === 'ataque_livre' && temGarfoEFaca && usarGarfoEFaca && saboresEscolhidos.length === 2
  );

  return {
    sucesso: true,
    custoPm,
    custoPi,
    pares,
    novoEstoque,
    novoLivroReceitas,
    novasDescobertas,
    efeitosResolvidos,
    curaPvProprio,
    curaPmProprio,
    condicoesRemovidas,
    pratoAtivoCena,
    garfoEFacaAtivo,
    mensagem: `Iguaria preparada (${pares.join(' | ')})! ${efeitosResolvidos.map((e) => e.texto).join(' ')}${garfoEFacaAtivo ? ' [Garfo e Faca: O ataque livre também causa dano normal (RA = 0)!]' : ''}`
  };
}

// =============================================================================
// 5. REGRAS PURAS - INVOCADOR (MANANCIAIS, INVOCAÇÕES, PRAGAS E CASCATA)
// =============================================================================

/**
 * Extrai a escolha permanente de benefício inicial do Invocador (+5 PV ou +5 PM).
 * @param {Object} classeInvocador
 * @param {Object} [ficha=null]
 * @returns {{ escolha: 'pv'|'pm', bonusPv: number, bonusPm: number, confirmado: boolean }}
 */
export function extrairBeneficioInicialInvocador(classeInvocador = null, ficha = null) {
  const habs = Array.isArray(classeInvocador?.habilidades) ? classeInvocador.habilidades : [];
  const habInv = habs.find((h) => normalizarTextoNF(h?.nome).includes('invocac'));
  const escolhaSalva =
    classeInvocador?.dados_invocador?.beneficioInicial ||
    habInv?.dados_invocador?.beneficioInicial ||
    ficha?.dados_invocador?.beneficioInicial;

  if (escolhaSalva === 'pm') {
    return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: true };
  }
  if (escolhaSalva === 'pv') {
    return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: true };
  }

  const textoBeneficio = normalizarTextoNF(
    typeof classeInvocador?.beneficios === 'object'
      ? classeInvocador?.beneficios?.texto
      : classeInvocador?.beneficios
  );

  if (textoBeneficio.includes('pv ou pm') || textoBeneficio.includes('a sua escolha')) {
    return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: false };
  }
  if (textoBeneficio.includes('pv') && !textoBeneficio.includes('pm')) {
    return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: true };
  }
  return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: true };
}

/**
 * Verifica se o personagem está equipado com uma arma elegível para Expandir Manancial:
 * arco, arma arcana, arma arremessável, arma de luta, espada ou mangual (malho).
 * @param {Array} itensEquipados
 * @returns {boolean}
 */
export function verificarArmaExpandirManancial(itensEquipados = []) {
  if (!Array.isArray(itensEquipados)) return false;
  return itensEquipados.some((item) => {
    const texto = normalizarTextoNF(
      `${item?.stats_personalizados?.categoria || ''} ${item?.tipo || ''} ${item?.nome || ''}`
    );
    return (
      texto.includes('arco') ||
      texto.includes('arcana') ||
      texto.includes('cajado') ||
      texto.includes('tomo') ||
      texto.includes('arremess') ||
      texto.includes('luta') ||
      texto.includes('soqueira') ||
      texto.includes('espada') ||
      texto.includes('mangual') ||
      texto.includes('malho')
    );
  });
}

/**
 * Calcula o escalonamento de dano e cura/perda de PM das invocações por nível (20+ e 40+).
 * @param {number} nivelPersonagem
 * @returns {{ bonusDano: number, bonusCuraOuPerdaPm: number }}
 */
export function calcularBonusEscalonamentoInvocacao(nivelPersonagem = 5) {
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  return {
    bonusDano: nv >= 40 ? 10 : nv >= 20 ? 5 : 0,
    bonusCuraOuPerdaPm: nv >= 40 ? 20 : nv >= 20 ? 10 : 0
  };
}

/**
 * Filtra as invocações disponíveis conforme os mananciais ativos na cena (mais Manancial Interior)
 * e o NP na habilidade Invocação (NP 1 = explosão, NP 2 = explosão/praga, NP 3 = todas).
 * @param {Array} catalogoInvocacoes
 * @param {Array<string>} mananciaisCena
 * @param {number} nvInvocacao
 * @param {string|null} [manancialInteriorKey=null]
 * @returns {Array}
 */
export function filtrarInvocacoesDisponiveis(
  catalogoInvocacoes = [],
  mananciaisCena = [],
  nvInvocacao = 0,
  manancialInteriorKey = null
) {
  const np = Math.max(0, Math.min(3, parseInt(nvInvocacao, 10) || 0));
  if (np <= 0 || !Array.isArray(catalogoInvocacoes)) return [];

  const mananciaisSet = new Set(
    (Array.isArray(mananciaisCena) ? mananciaisCena : []).map((m) => normalizarTextoNF(m))
  );
  if (manancialInteriorKey) {
    mananciaisSet.add(normalizarTextoNF(manancialInteriorKey));
  }

  return catalogoInvocacoes.filter((inv) => {
    const mKey = normalizarTextoNF(inv.manancial_key);
    const reqNp = parseInt(inv.np_minimo, 10) || 1;
    return mananciaisSet.has(mKey) && reqNp <= np;
  });
}

/**
 * Calcula os valores finais de uma Invocação Elemental (dano, cura de PV, perda de PM e bônus de Praga).
 * @param {Object} params
 * @returns {Object}
 */
export function calcularValoresInvocacao({
  invocacao = null,
  nivelPersonagem = 5,
  nvExpandirManancial = 0,
  temArmaExpandir = false,
  nvHarmoniaElemental = 0,
  elementalPresenteNaCena = false,
  nvInvocacoesConectadas = 0,
  temLequeDasChamas = false,
  alvosExtras = 0
} = {}) {
  if (!invocacao) return null;
  const esc = calcularBonusEscalonamentoInvocacao(nivelPersonagem);
  const ef = invocacao.efeito_mecanico || {};
  const bonusExpandir = temArmaExpandir ? (parseInt(nvExpandirManancial, 10) || 0) : 0;
  const bonusLeque = temLequeDasChamas && alvosExtras > 0 ? (parseInt(nvInvocacoesConectadas, 10) || 0) : 0;
  const bonusHarmonia = elementalPresenteNaCena ? (parseInt(nvHarmoniaElemental, 10) || 0) * 5 : 0;

  let danoFinal = null;
  if (ef.danoBase) {
    const ehExplosao = invocacao.categoria_invocacao === 'explosao';
    danoFinal = ef.danoBase + esc.bonusDano + (ehExplosao ? bonusExpandir : 0) + bonusLeque;
  }

  let pragaBonusDano = null;
  if (ef.pragaBonusDano) {
    pragaBonusDano = ef.pragaBonusDano + bonusExpandir;
  }

  let curaPvFinal = null;
  if (ef.curaPvBase) {
    curaPvFinal = ef.curaPvBase + esc.bonusCuraOuPerdaPm + bonusHarmonia;
  }

  let perdaPmFinal = null;
  if (ef.perdaPmBase) {
    perdaPmFinal = ef.perdaPmBase + esc.bonusCuraOuPerdaPm;
  }

  return {
    danoFinal,
    tipoDano: ef.tipoDano || invocacao.tipo_dano_associado,
    pragaBonusDano,
    elementosVulneraveis: ef.elementosVulneraveis || [],
    curaPvFinal,
    perdaPmFinal,
    condicaoAplicada: ef.condicao || null
  };
}

/**
 * Processa a execução de uma Invocação Elemental em conflito.
 * @param {Object} params
 * @returns {Object}
 */
export function processarInvocacaoElemental({
  invocacao = null,
  mpAtual = 0,
  alvosExtras = 0,
  nvInvocacao = 0,
  nvInvocacoesConectadas = 0,
  nvExpandirManancial = 0,
  temArmaExpandir = false,
  nvHarmoniaElemental = 0,
  elementalPresenteNaCena = false,
  nvCascata = 0,
  usarManipularMagiaSemCusto = false,
  decretoDobrarPmAtivo = false,
  nivelPersonagem = 5,
  temPoderCincoMananciais = false,
  atributoEscolhidoTerra = 'vigor',
  aplicarCuraEmSiMesmo = false
} = {}) {
  if (!invocacao) {
    return { sucesso: false, mensagem: 'Selecione uma invocação disponível nos mananciais ativos.' };
  }
  const npInv = Math.max(0, parseInt(nvInvocacao, 10) || 0);
  if (npInv < (invocacao.np_minimo || 1)) {
    return {
      sucesso: false,
      mensagem: `Esta invocação requer Invocação NP ${invocacao.np_minimo}, e você possui NP ${npInv}.`
    };
  }

  if (usarManipularMagiaSemCusto && invocacao.categoria_invocacao === 'praga') {
    return {
      sucesso: false,
      mensagem: 'Manipular Magia não permite realizar invocações do tipo "Praga".'
    };
  }

  const maxExtras = usarManipularMagiaSemCusto ? 0 : Math.max(0, parseInt(nvInvocacoesConectadas, 10) || 0);
  const extras = Math.max(0, Math.min(maxExtras, parseInt(alvosExtras, 10) || 0));

  let custoPm = usarManipularMagiaSemCusto
    ? 0
    : CUSTO_BASE_INVOCACAO_PM + (extras * CUSTO_INVOCACAO_CONECTADA_POR_ALVO_PM);
  if (decretoDobrarPmAtivo && custoPm > 0) {
    custoPm *= 2;
  }

  const mp = Math.max(0, parseInt(mpAtual, 10) || 0);
  if (mp < custoPm) {
    return {
      sucesso: false,
      mensagem: `PM insuficiente! Esta invocação requer ${custoPm} PM e você possui ${mp} PM.`
    };
  }

  const valores = calcularValoresInvocacao({
    invocacao,
    nivelPersonagem,
    nvExpandirManancial,
    temArmaExpandir,
    nvHarmoniaElemental,
    elementalPresenteNaCena,
    nvInvocacoesConectadas,
    alvosExtras: extras
  });

  const pragaAtiva = invocacao.categoria_invocacao === 'praga'
    ? {
        key: invocacao.key,
        nome: invocacao.nome,
        manancial: invocacao.manancial_key,
        bonusDano: valores.pragaBonusDano,
        elementosVulneraveis: valores.elementosVulneraveis,
        bonusPrecisaoCascata: Math.max(0, parseInt(nvCascata, 10) || 0)
      }
    : null;

  let atributoCincoMananciais = null;
  if (temPoderCincoMananciais) {
    atributoCincoMananciais = invocacao.manancial_key === 'terra'
      ? normalizarTextoNF(atributoEscolhidoTerra || 'vigor')
      : invocacao.atributo_cinco_mananciais;
  }

  const detalhes = [];
  if (valores.danoFinal !== null) detalhes.push(`Dano: ${valores.danoFinal} (${valores.tipoDano})`);
  if (valores.pragaBonusDano !== null) {
    detalhes.push(`Praga: +${valores.pragaBonusDano} de dano de ${valores.elementosVulneraveis.join(' e ')}`);
  }
  if (valores.curaPvFinal !== null) detalhes.push(`Cura: ${valores.curaPvFinal} PV`);
  if (valores.perdaPmFinal !== null) detalhes.push(`Perda: ${valores.perdaPmFinal} PM`);
  if (valores.condicaoAplicada) detalhes.push(`Condição: ${valores.condicaoAplicada.toUpperCase()}`);
  if (atributoCincoMananciais) {
    detalhes.push(`Poder dos Cinco Mananciais: +1 passo em ${atributoCincoMananciais.toUpperCase()}`);
  }

  return {
    sucesso: true,
    custoPm,
    alvosTotais: 1 + extras,
    valores,
    pragaAtiva,
    atributoCincoMananciais,
    curaPvProprio: aplicarCuraEmSiMesmo && valores.curaPvFinal ? valores.curaPvFinal : 0,
    mensagem: `${invocacao.nome} (${invocacao.manancial_nome}) invocada (-${custoPm} PM, ${1 + extras} alvo(s))! [${detalhes.join(' • ')}]`
  };
}

// =============================================================================
// 6. REGRAS PURAS - MERCADOR (PONTOS DE COMÉRCIO, ESTOQUE E PROSPERIDADE)
// =============================================================================

/**
 * Calcula o limite máximo e ganho por descanso de Pontos de Comércio via Ventos do Comércio.
 * - Limite máximo: NP + 3
 * - Ganho por descanso comercial: NP + 1
 * - Inicial na criação: 2
 * @param {number} nvVentosDoComercio
 * @returns {{ maxPontos: number, ganhoDescanso: number, inicialCriacao: number }}
 */
export function calcularLimitePontosComercio(nvVentosDoComercio = 0) {
  const np = Math.max(0, Math.min(3, parseInt(nvVentosDoComercio, 10) || 0));
  if (np <= 0) {
    return { maxPontos: 0, ganhoDescanso: 0, inicialCriacao: 0 };
  }
  return {
    maxPontos: np + 3,
    ganhoDescanso: np + 1,
    inicialCriacao: 2
  };
}

/**
 * Calcula os parâmetros das habilidades de suporte do Mercador.
 * @param {Object} params
 * @returns {Object}
 */
export function calcularParametrosMercador({
  nivelPersonagem = 5,
  nvDataDeValidade = 0,
  nvEstoquePessoal = 0,
  nvJaOuviFalar = 0,
  nvVentosDoComercio = 0,
  nvVerdadeiroTesouro = 0,
  prosperidadeAssentamento = 0,
  temPimentaEmPo = false
} = {}) {
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  const npVal = Math.max(0, Math.min(3, parseInt(nvDataDeValidade, 10) || 0));
  const npEst = Math.max(0, Math.min(3, parseInt(nvEstoquePessoal, 10) || 0));
  const npOuv = Math.max(0, Math.min(3, parseInt(nvJaOuviFalar, 10) || 0));
  const npVen = Math.max(0, Math.min(3, parseInt(nvVentosDoComercio, 10) || 0));
  const npTes = Math.max(0, Math.min(3, parseInt(nvVerdadeiroTesouro, 10) || 0));
  const prosp = Math.max(0, parseInt(prosperidadeAssentamento, 10) || 0);

  const comercioLimites = calcularLimitePontosComercio(npVen);
  const danoDataValidadeUnico = npVal > 0 ? Math.floor(nv / 2) + (npVal * 10) : 0;
  const danoDataValidadeMulti = npVal > 0 ? Math.floor(danoDataValidadeUnico / 2) : 0;

  return {
    maxPontosComercio: comercioLimites.maxPontos,
    ganhoDescansoComercio: comercioLimites.ganhoDescanso,
    ganhoVerdadeiroTesouro: npVen > 0 && npTes > 0 ? npTes + 1 : 0,
    limitePiEstoquePessoal: npEst > 0 ? npEst + 2 : 0,
    bonusExaminarJaOuviFalar: npOuv > 0 ? npOuv + 2 : 0,
    orcamentoMaxItemRaroZenit: npVen > 0 ? nv * 30 : 0,
    danoDataValidadeUnico,
    danoDataValidadeMulti,
    tipoDanoDataValidade: temPimentaEmPo ? 'fogo' : 'veneno',
    aumentoProsperidadePorDescanso: npVen + npTes,
    prosperidade: {
      pontos: prosp,
      descontoZenit50: prosp >= 10,
      descansoGratuito: prosp >= 15,
      dadoViagemMax: prosp >= 15 ? 8 : null,
      ultimaViloesDobrado: prosp >= 20
    }
  };
}

// =============================================================================
// 7. CONSOLIDAÇÃO TRANSVERSAL PARA TODA A FICHA
// =============================================================================

/**
 * Extrai todos os modificadores, bônus de atributos, resistências, imunidades e sinergias
 * ativas das 4 classes do Atlas Fantasia Natural para integração direta na ficha.
 * @param {Object} params
 * @returns {Object}
 */
export function extrairEfeitosAtivosNaturalFantasy({
  classes = [],
  ficha = null,
  itensEquipados = [],
  nivelTotal = 5,
  catalogoMagiseeds = []
} = {}) {
  const getHabNivel = (cls, termo) => {
    const h = (cls?.habilidades || []).find((item) => normalizarTextoNF(item?.nome).includes(termo));
    return { h, nivel: parseInt(h?.nivel, 10) || 0 };
  };

  const poderesHeroicos = ficha?.poderes_heroicos || [];

  // 1. FLORALISTA
  const floralistaClass = (classes || []).find((c) => ehClasseFloralista(c?.nome_classe));
  const { h: habCloro, nivel: nvCloromancia } = getHabNivel(floralistaClass, 'cloromancia');
  const { nivel: nvArvoreDaVida } = getHabNivel(floralistaClass, 'arvore da vida');
  const { nivel: nvEnxerto } = getHabNivel(floralistaClass, 'enxerto');
  const { nivel: nvInfluenciaVerdejante } = getHabNivel(floralistaClass, 'influencia verdejante');
  const { nivel: nvJardinagemMarcial } = getHabNivel(floralistaClass, 'jardinagem marcial');

  const dadosFloralista =
    floralistaClass?.dados_floralista ||
    habCloro?.dados_floralista ||
    ficha?.dados_floralista ||
    {};

  const beneficioFloralista = floralistaClass
    ? extrairBeneficioInicialFloralista(floralistaClass, ficha)
    : { escolha: 'pm', bonusPv: 0, bonusPm: 0, confirmado: false };

  const magiseedAtiva = dadosFloralista.magiseedAtiva || null;
  const secaoRelogioGerminacao = parseInt(dadosFloralista.secaoRelogio, 10) || 0;
  const temDedoVerde = possuiPoderHeroicoNF(poderesHeroicos, 'dedo_verde') || possuiPoderHeroicoNF(poderesHeroicos, 'dedo verde');
  const temMuralhaHeroica = possuiPoderHeroicoNF(poderesHeroicos, 'muralha_de_espinhos') || possuiPoderHeroicoNF(poderesHeroicos, 'muralha de espinhos');

  const magiseedCatalogoRef = magiseedAtiva
    ? (Array.isArray(catalogoMagiseeds) ? catalogoMagiseeds.find((m) => m.key === magiseedAtiva.key) : null) || magiseedAtiva
    : null;

  const efeitoMagiseed = resolverEfeitoMagiseedNaSecao({
    magiseed: magiseedCatalogoRef,
    secaoAtual: secaoRelogioGerminacao,
    nvCloromancia: Math.max(1, nvCloromancia),
    nivelPersonagem: nivelTotal,
    escolhaElemento: dadosFloralista.escolhaElementoMagiseed || null,
    temDedoVerde
  });

  // 2. GOURMET
  const gourmetClass = (classes || []).find((c) => ehClasseGourmet(c?.nome_classe));
  const { h: habCulinaria, nivel: nvCulinaria } = getHabNivel(gourmetClass, 'culinaria');
  const { nivel: nvCozinheiroViajante } = getHabNivel(gourmetClass, 'cozinheiro viajante');
  const { nivel: nvFeitoComAmor } = getHabNivel(gourmetClass, 'feito com amor');
  const { nivel: nvGarfoEFaca } = getHabNivel(gourmetClass, 'garfo e faca');
  const { nivel: nvSalEPimenta } = getHabNivel(gourmetClass, 'sal e pimenta');

  const dadosGourmet =
    gourmetClass?.dados_gourmet ||
    habCulinaria?.dados_gourmet ||
    ficha?.dados_gourmet ||
    {};

  const pratoAtivoCena = dadosGourmet.pratoAtivoCena || null;
  const temDosagemPrecisa = possuiPoderHeroicoNF(poderesHeroicos, 'dosagem_precisa') || possuiPoderHeroicoNF(poderesHeroicos, 'dosagem precisa');

  // 3. INVOCADOR
  const invocadorClass = (classes || []).find((c) => ehClasseInvocador(c?.nome_classe));
  const { h: habInvocacao, nivel: nvInvocacao } = getHabNivel(invocadorClass, 'invocacao');
  const { nivel: nvInvocacoesConectadas } = getHabNivel(invocadorClass, 'invocacoes conectadas');
  const { nivel: nvExpandirManancial } = getHabNivel(invocadorClass, 'expandir manancial');
  const { nivel: nvCascata } = getHabNivel(invocadorClass, 'cascata');
  const { nivel: nvHarmoniaElemental } = getHabNivel(invocadorClass, 'harmonia elemental');

  const dadosInvocador =
    invocadorClass?.dados_invocador ||
    habInvocacao?.dados_invocador ||
    ficha?.dados_invocador ||
    {};

  const beneficioInvocador = invocadorClass
    ? extrairBeneficioInicialInvocador(invocadorClass, ficha)
    : { escolha: 'pm', bonusPv: 0, bonusPm: 0, confirmado: false };

  const temArmaExpandir = verificarArmaExpandirManancial(itensEquipados);
  const temManancialInterior = possuiPoderHeroicoNF(poderesHeroicos, 'manancial_interior') || possuiPoderHeroicoNF(poderesHeroicos, 'manancial interior');
  const manancialInteriorKey = temManancialInterior ? (dadosInvocador.manancialInteriorKey || 'agua') : null;
  const pragaAtivaInimigo = dadosInvocador.pragaAtiva || null;
  const elementalPresente = Boolean(dadosInvocador.elementalPresente);
  const atributoCincoMananciais = dadosInvocador.atributoCincoMananciais || null;

  // 4. MERCADOR
  const mercadorClass = (classes || []).find((c) => ehClasseMercador(c?.nome_classe));
  const { h: habVentos, nivel: nvVentosDoComercio } = getHabNivel(mercadorClass, 'ventos do comercio');
  const { nivel: nvEstoquePessoal } = getHabNivel(mercadorClass, 'estoque pessoal');
  const { nivel: nvJaOuviFalar } = getHabNivel(mercadorClass, 'ja ouvi falar');
  const { nivel: nvDataDeValidade } = getHabNivel(mercadorClass, 'data de validade');
  const { nivel: nvVerdadeiroTesouro } = getHabNivel(mercadorClass, 'verdadeiro tesouro');

  const dadosMercador =
    mercadorClass?.dados_mercador ||
    habVentos?.dados_mercador ||
    ficha?.dados_mercador ||
    {};

  const paramsMercador = calcularParametrosMercador({
    nivelPersonagem: nivelTotal,
    nvDataDeValidade,
    nvEstoquePessoal,
    nvJaOuviFalar,
    nvVentosDoComercio,
    nvVerdadeiroTesouro,
    prosperidadeAssentamento: dadosMercador.prosperidadeAssentamento || 0,
    temPimentaEmPo: Boolean(dadosMercador.temPimentaEmPo)
  });

  const pontosComercioAtuais = Math.max(
    0,
    Math.min(
      paramsMercador.maxPontosComercio || 99,
      parseInt(dadosMercador.pontosComercio ?? (nvVentosDoComercio > 0 ? 2 : 0), 10) || 0
    )
  );

  // Consolidação de Aumentos de Passo de Atributo Temporários (Magisseed + Prato Gourmet + Cinco Mananciais)
  const aumentosAtributoNF = {
    destreza: (efeitoMagiseed.aumentosAtributo?.destreza || 0) + (pratoAtivoCena?.aumentosAtributo?.destreza || 0) + (atributoCincoMananciais === 'destreza' ? 1 : 0),
    astucia: (efeitoMagiseed.aumentosAtributo?.astucia || 0) + (pratoAtivoCena?.aumentosAtributo?.astucia || 0) + (atributoCincoMananciais === 'astucia' ? 1 : 0),
    vigor: (efeitoMagiseed.aumentosAtributo?.vigor || 0) + (pratoAtivoCena?.aumentosAtributo?.vigor || 0) + (atributoCincoMananciais === 'vigor' ? 1 : 0),
    vontade: (efeitoMagiseed.aumentosAtributo?.vontade || 0) + (pratoAtivoCena?.aumentosAtributo?.vontade || 0) + (atributoCincoMananciais === 'vontade' ? 1 : 0)
  };

  // Consolidação de Resistências Elementais/Físicas (Magisseeds + Muralha Heroica + Prato Gourmet + Manancial Interior)
  const resistenciasNF = [];
  efeitoMagiseed.resistencias.forEach((tipo) => {
    resistenciasNF.push({ tipo, fonte: magiseedCatalogoRef?.nome || 'Magissemente' });
  });
  if (temMuralhaHeroica) {
    resistenciasNF.push({ tipo: 'luz', fonte: 'Muralha de Espinhos' });
    resistenciasNF.push({ tipo: 'veneno', fonte: 'Muralha de Espinhos' });
  }
  (pratoAtivoCena?.resistencias || []).forEach((tipo) => {
    resistenciasNF.push({ tipo, fonte: 'Iguaria (Gourmet)' });
  });
  if (manancialInteriorKey && MANANCIAIS_ELEMENTAIS[manancialInteriorKey]) {
    resistenciasNF.push({
      tipo: MANANCIAIS_ELEMENTAIS[manancialInteriorKey].tipoDano,
      fonte: `Manancial Interior (${MANANCIAIS_ELEMENTAIS[manancialInteriorKey].nomeCurto})`
    });
  }

  const conversaoDanoAtiva =
    efeitoMagiseed.conversaoDano ||
    pratoAtivoCena?.conversaoDano ||
    (dadosInvocador.converterDanoManancialInterior && manancialInteriorKey
      ? MANANCIAIS_ELEMENTAIS[manancialInteriorKey]?.tipoDano
      : null);

  return {
    aumentosAtributoNF,
    resistenciasNF,
    imunidadesCondicaoNF: efeitoMagiseed.imunidadesCondicao || [],
    conversaoDanoAtiva,
    temDosagemPrecisa,
    floralista: {
      ativo: Boolean(floralistaClass),
      nvCloromancia,
      nvArvoreDaVida,
      nvEnxerto,
      nvInfluenciaVerdejante,
      nvJardinagemMarcial,
      beneficioInicial: beneficioFloralista,
      magiseedAtiva: magiseedCatalogoRef,
      secaoRelogioGerminacao,
      efeitoMagiseed,
      bonusDanoVenenoBeladona: efeitoMagiseed.bonusDanoVenenoBeladona || 0,
      limitePmJardinagemMarcial: calcularLimitePmJardinagemMarcial(nvJardinagemMarcial)
    },
    gourmet: {
      ativo: Boolean(gourmetClass),
      nvCulinaria,
      nvCozinheiroViajante,
      nvFeitoComAmor,
      nvGarfoEFaca,
      nvSalEPimenta,
      pratoAtivoCena,
      estoqueSabores: dadosGourmet.estoqueSabores || {},
      livroReceitas: dadosGourmet.livroReceitas || {}
    },
    invocador: {
      ativo: Boolean(invocadorClass),
      nvInvocacao,
      nvInvocacoesConectadas,
      nvExpandirManancial,
      nvCascata,
      nvHarmoniaElemental,
      beneficioInicial: beneficioInvocador,
      temArmaExpandir,
      mananciaisCena: dadosInvocador.mananciaisCena || ['ar', 'terra'],
      manancialInteriorKey,
      pragaAtivaInimigo,
      elementalPresente,
      bonusCuraHarmonia: elementalPresente && nvHarmoniaElemental > 0 ? nvHarmoniaElemental * 5 : 0,
      bonusPrecisaoCascata: pragaAtivaInimigo && nvCascata > 0 ? nvCascata : 0,
      bonusDanoPragaAtiva: pragaAtivaInimigo ? (pragaAtivaInimigo.bonusDano || 5) : 0,
      atributoCincoMananciais
    },
    mercador: {
      ativo: Boolean(mercadorClass),
      nvVentosDoComercio,
      nvEstoquePessoal,
      nvJaOuviFalar,
      nvDataDeValidade,
      nvVerdadeiroTesouro,
      pontosComercioAtuais,
      ...paramsMercador
    }
  };
}
