/**
 * Fabula Ultima - Regras do Suplemento Atlas Alta Fantasia (High Fantasy Atlas)
 *
 * Módulo de Lógica Pura de Domínio para as 3 Classes Oficiais:
 * - Virtuoso (também referido como Cantor / Chanter): Magicanto, Versos, Volumes, Escalas (Chaves) e Tons
 * - Comandante: Carga de Cavalaria, Decreto do Bispo, Roque do Rei, Gambito da Dama, Carruagem Devastadora
 * - Dançarino: Benefício Inicial (+5 PV ou +5 PM), Danças, Dançarino de Guerra, Me Acompanhe, Sapateado Frenético, Troca de Figurino
 *
 * CONFORME GEMINI.md:
 * - Camada de Domínio Puro (src/domain/fabula/): Funções puras em JavaScript (sem efeitos colaterais).
 * - Isolamento total: ZERO importações de React ou Supabase.
 * - Desacoplamento de dados: Os catálogos oficiais (catalogo_virtuoso_escalas, catalogo_virtuoso_tons,
 *   catalogo_dancas) são persistidos e consultados diretamente do Supabase através de fichaService.js.
 */

// =============================================================================
// 1. CONSTANTES E TABELAS OFICIAIS (ALTA FANTASIA)
// =============================================================================

export const HIGH_FANTASY_CLASS_NAMES = {
  VIRTUOSO: 'Virtuoso',
  CANTOR_ALIAS: 'Cantor',
  COMANDANTE: 'Comandante',
  DANCARINO: 'Dançarino',
  SIMBOLISTA: 'Simbolista'
};

export const VOLUMES_VERSO = {
  fraco: {
    key: 'fraco',
    nome: 'Fraco',
    custoPm: 10,
    alvos: 'Você ou uma criatura que você possa ver e que possa ouvi-lo.',
    permiteBarreiraSonora: false,
    permiteVibrato: true,
    afetaAliadosPorPadrao: false,
    afetaInimigosPorPadrao: false
  },
  medio: {
    key: 'medio',
    nome: 'Médio',
    custoPm: 20,
    alvos: 'Todos os aliados capazes de ouvi-lo.',
    permiteBarreiraSonora: true,
    permiteVibrato: true,
    afetaAliadosPorPadrao: true,
    afetaInimigosPorPadrao: false
  },
  forte: {
    key: 'forte',
    nome: 'Forte',
    custoPm: 30,
    alvos: 'Todos os inimigos capazes de ouvi-lo.',
    permiteBarreiraSonora: true,
    permiteVibrato: false,
    afetaAliadosPorPadrao: false,
    afetaInimigosPorPadrao: true
  }
};

export const CUSTO_BASE_ORDEM_COMANDANTE_PM = 10;
export const CUSTO_BASE_DANCA_PM = 10;
export const DESCONTO_DANCA_CONSECUTIVA_PM = 5;
export const CUSTO_ME_ACOMPANHE_PM = 10;
export const CUSTO_CRIACAO_SIMBOLO_PI = 2;

// =============================================================================
// 2. AUXILIARES DE IDENTIFICAÇÃO E FORMATAÇÃO
// =============================================================================

/**
 * Normaliza strings para comparações insensíveis a acentos e maiúsculas.
 * @param {string} texto
 * @returns {string}
 */
export function normalizarTextoHF(texto = '') {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Extrai o número de faces de um dado ('d8', 8, 'D12' -> 8, 12).
 * @param {string|number} dado
 * @param {number} [padrao=8]
 * @returns {number}
 */
export function extrairFacesDadoHF(dado, padrao = 8) {
  if (typeof dado === 'number' && !isNaN(dado) && dado >= 4) return dado;
  if (!dado) return padrao;
  const num = parseInt(String(dado).replace(/\D/g, ''), 10);
  return isNaN(num) || num < 4 ? padrao : num;
}

/**
 * Verifica se o nome da classe corresponde a Virtuoso (ou alias Cantor).
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseVirtuoso(nomeClasse = '') {
  const norm = normalizarTextoHF(nomeClasse);
  return norm.includes('virtuoso') || norm.includes('cantor');
}

/**
 * Verifica se o nome da classe corresponde a Comandante.
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseComandante(nomeClasse = '') {
  return normalizarTextoHF(nomeClasse).includes('comandante');
}

/**
 * Verifica se o nome da classe corresponde a Dançarino.
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseDancarino(nomeClasse = '') {
  return normalizarTextoHF(nomeClasse).includes('dancarino');
}

/**
 * Verifica se o nome da classe corresponde a Simbolista.
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function ehClasseSimbolista(nomeClasse = '') {
  return normalizarTextoHF(nomeClasse).includes('simbolista');
}

/**
 * Verifica se o personagem adquiriu determinado Poder Heróico na ficha.
 * @param {Array} poderesHeroicos
 * @param {string} termoChaveOuNome
 * @returns {boolean}
 */
export function possuiPoderHeroicoHF(poderesHeroicos = [], termoChaveOuNome = '') {
  if (!Array.isArray(poderesHeroicos) || !termoChaveOuNome) return false;
  const alvo = normalizarTextoHF(termoChaveOuNome);
  return poderesHeroicos.some((p) => {
    const key = normalizarTextoHF(typeof p === 'string' ? p : p?.key || '');
    const nome = normalizarTextoHF(typeof p === 'string' ? p : p?.nome || '');
    return key === alvo || nome === alvo || key.includes(alvo) || nome.includes(alvo);
  });
}

// =============================================================================
// 3. REGRAS PURAS - VIRTUOSO (CANTOR)
// =============================================================================

/**
 * Calcula o total de Escalas (Chaves) + Tons aprendidos pelo nível de Magicanto.
 * Regra Oficial PT-BR: NP 1 concede 1 Escala + 1 Tom (total 2); cada NP adicional concede +1 Escala ou +1 Tom.
 * @param {number} nvMagicanto Nível na habilidade Magicanto (0 a 10)
 * @returns {{ totalItens: number, minEscalas: number, minTons: number }}
 */
export function calcularLimiteMagicanto(nvMagicanto = 0) {
  const np = Math.max(0, Math.min(10, parseInt(nvMagicanto, 10) || 0));
  if (np === 0) {
    return { totalItens: 0, minEscalas: 0, minTons: 0 };
  }
  return {
    totalItens: np + 1,
    minEscalas: 1,
    minTons: 1
  };
}

/**
 * Valida se a seleção de Escalas e Tons respeita o limite do Magicanto e o mínimo de 1 de cada.
 * @param {number} nvMagicanto
 * @param {Array<string>} escalasAprendidas
 * @param {Array<string>} tonsAprendidos
 * @returns {{ valido: boolean, totalSelecionado: number, totalPermitido: number, motivo?: string }}
 */
export function validarSelecaoMagicanto(nvMagicanto = 0, escalasAprendidas = [], tonsAprendidos = []) {
  const { totalItens } = calcularLimiteMagicanto(nvMagicanto);
  const qtdEscalas = Array.isArray(escalasAprendidas) ? escalasAprendidas.length : 0;
  const qtdTons = Array.isArray(tonsAprendidos) ? tonsAprendidos.length : 0;
  const totalSelecionado = qtdEscalas + qtdTons;

  if (totalItens === 0) {
    return {
      valido: false,
      totalSelecionado,
      totalPermitido: 0,
      motivo: 'Adquira a habilidade Magicanto (mínimo Nv. 1) para aprender Escalas e Tons.'
    };
  }

  if (totalSelecionado > totalItens) {
    return {
      valido: false,
      totalSelecionado,
      totalPermitido: totalItens,
      motivo: `Limite excedido! Magicanto Nv. ${nvMagicanto} permite aprender ${totalItens} item(ns) no total (Escalas + Tons).`
    };
  }

  if (totalSelecionado === totalItens && (qtdEscalas < 1 || qtdTons < 1)) {
    return {
      valido: false,
      totalSelecionado,
      totalPermitido: totalItens,
      motivo: 'Ao adquirir Magicanto pela primeira vez, você deve ter pelo menos 1 Escala e 1 Tom.'
    };
  }

  return {
    valido: true,
    totalSelecionado,
    totalPermitido: totalItens
  };
}

/**
 * Calcula o custo final em PM (e Pontos de Fábula, se aplicável) para cantar um Verso.
 * Considera:
 * - Volume (Fraco = 10 PM, Médio = 20 PM, Forte = 30 PM)
 * - Poder Heróico Música Tema (reduz custo à metade na mesma escala)
 * - Habilidade Hipercognição do Esper (-NP ou -NP×2 PM se alvo for Foco Cognitivo)
 * - Poder Heróico Trilha Épica (dobra custo em PM ou gasta 1 Ponto de Fábula em Médio/Forte)
 *
 * @param {Object} params
 * @returns {{ custoPm: number, custoFabula: number, custoBase: number, volumeObj: Object, descontosAplicados: Array<string> }}
 */
export function calcularCustoVerso({
  volumeKey = 'fraco',
  escalaKey = '',
  musicaTemaAtiva = false,
  escalaMusicaTema = '',
  trilhaEpicaModo = 'nenhum',
  temFocoCognitivoAlvo = false,
  nvHipercognicao = 0,
  unicoAlvoFoco = false
} = {}) {
  const volumeObj = VOLUMES_VERSO[volumeKey] || VOLUMES_VERSO.fraco;
  const custoBase = volumeObj.custoPm;
  let custoPm = custoBase;
  let custoFabula = 0;
  const descontosAplicados = [];

  if (musicaTemaAtiva && escalaKey && normalizarTextoHF(escalaKey) === normalizarTextoHF(escalaMusicaTema)) {
    custoPm = Math.floor(custoPm / 2);
    descontosAplicados.push('Música Tema (÷2 PM)');
  }

  const nvHiper = Math.max(0, parseInt(nvHipercognicao, 10) || 0);
  if (temFocoCognitivoAlvo && nvHiper > 0) {
    const reducao = unicoAlvoFoco ? nvHiper * 2 : nvHiper;
    custoPm = Math.max(0, custoPm - reducao);
    descontosAplicados.push(`Hipercognição (-${reducao} PM)`);
  }

  if (volumeKey === 'medio' || volumeKey === 'forte') {
    if (trilhaEpicaModo === 'dobrar_pm') {
      custoPm = custoPm * 2;
      descontosAplicados.push('Trilha Épica (×2 PM)');
    } else if (trilhaEpicaModo === 'ponto_fabula') {
      custoFabula = 1;
      descontosAplicados.push('Trilha Épica (1 PF)');
    }
  }

  return {
    custoPm,
    custoFabula,
    custoBase,
    volumeObj,
    descontosAplicados
  };
}

/**
 * Calcula os valores numéricos e substitui os marcadores da Escala no texto oficial do Tom.
 * @param {Object} params
 * @returns {{ danoCalculado: number|null, curaCalculada: number|null, tipoDano: string, recuperacaoTipo: string, textoResolvido: string }}
 */
export function calcularValoresVerso({
  nivelPersonagem = 5,
  dadoVontade = 8,
  escala = null,
  tom = null,
  musicaTemaAtivaMesmaEscala = false
} = {}) {
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  const vonFaces = extrairFacesDadoHF(dadoVontade, 8);
  const bonusNivel = nv >= 40 ? 20 : nv >= 20 ? 10 : 0;

  const tipoDano = escala?.tipo_dano || 'fogo';
  const condicao = escala?.condicao || 'abalado';
  const atributo = escala?.atributo || 'Vigor';
  const recuperacao = escala?.recuperacao || 'PV';
  const tomKey = normalizarTextoHF(tom?.key || tom?.nome || '');

  let danoCalculado = null;
  let curaCalculada = null;

  if (tomKey === 'agitado') {
    danoCalculado = (vonFaces * 2) + bonusNivel + (musicaTemaAtivaMesmaEscala ? 5 : 0);
  } else if (tomKey === 'calmo') {
    curaCalculada = 10 + (vonFaces * 2) + bonusNivel;
  }

  let textoResolvido = tom?.descricao || '';
  if (textoResolvido && escala) {
    textoResolvido = textoResolvido
      .replace(/\(tipo da escala\)/gi, tipoDano)
      .replace(/\(condi[cç][aã]o da escala\)/gi, condicao)
      .replace(/\(atributo da escala\)/gi, atributo)
      .replace(/\(recupera[cç][aã]o da escala\)/gi, recuperacao);
  }

  return {
    danoCalculado,
    curaCalculada,
    tipoDano,
    condicao,
    atributo,
    recuperacaoTipo: recuperacao,
    textoResolvido
  };
}

/**
 * Processa o canto completo de um Verso, validando custos e apurando efeitos extras (Barreira Sonora, Harmonia, Vibrato).
 * @param {Object} params
 * @returns {Object}
 */
export function processarCantoVerso({
  volumeKey = 'fraco',
  escala = null,
  tom = null,
  mpAtual = 0,
  fabulaAtual = 0,
  nivelPersonagem = 5,
  dadoVontade = 8,
  nvBarreiraSonora = 0,
  nvHarmonia = 0,
  nvVibrato = 0,
  temArmaArcanaEquipada = false,
  alvoFracoEhInimigo = false,
  musicaTemaAtiva = false,
  escalaMusicaTema = '',
  trilhaEpicaModo = 'nenhum',
  temFocoCognitivoAlvo = false,
  nvHipercognicao = 0,
  unicoAlvoFoco = false
} = {}) {
  if (!escala || !tom) {
    return { sucesso: false, mensagem: 'Selecione uma Escala e um Tom aprendidos para cantar o Verso.' };
  }

  const musicaTemaMesmaEscala = Boolean(
    musicaTemaAtiva && escalaMusicaTema && normalizarTextoHF(escala.key) === normalizarTextoHF(escalaMusicaTema)
  );

  const custo = calcularCustoVerso({
    volumeKey,
    escalaKey: escala.key,
    musicaTemaAtiva,
    escalaMusicaTema,
    trilhaEpicaModo,
    temFocoCognitivoAlvo,
    nvHipercognicao,
    unicoAlvoFoco
  });

  const mp = Math.max(0, parseInt(mpAtual, 10) || 0);
  const pf = Math.max(0, parseInt(fabulaAtual, 10) || 0);

  if (mp < custo.custoPm) {
    return {
      sucesso: false,
      mensagem: `PM insuficiente! Este verso requer ${custo.custoPm} PM e você possui ${mp} PM.`
    };
  }
  if (pf < custo.custoFabula) {
    return {
      sucesso: false,
      mensagem: `Pontos de Fábula insuficientes! Trilha Épica requer ${custo.custoFabula} PF.`
    };
  }

  const valores = calcularValoresVerso({
    nivelPersonagem,
    dadoVontade,
    escala,
    tom,
    musicaTemaAtivaMesmaEscala: musicaTemaMesmaEscala
  });

  const afetaInimigo = volumeKey === 'forte' || (volumeKey === 'fraco' && alvoFracoEhInimigo);
  const efeitosExtras = [];

  if (nvBarreiraSonora > 0 && custo.volumeObj.permiteBarreiraSonora) {
    efeitosExtras.push(`Barreira Sonora: Dano físico sofrido reduzido em ${nvBarreiraSonora} até o início do seu próximo turno.`);
  }
  if (nvVibrato > 0 && custo.volumeObj.permiteVibrato) {
    efeitosExtras.push('Vibrato: Você pode fazer um ataque livre com uma arma equipada (RA = 0 no dano).');
  }
  if (nvHarmonia > 0 && afetaInimigo && temArmaArcanaEquipada) {
    efeitosExtras.push(
      `Harmonia (NP ${nvHarmonia}): Escolha: aliados causam +${nvHarmonia} de dano a estes inimigos OU você recupera ${nvHarmonia} PM sempre que sofrerem dano.`
    );
  }
  if (custo.custoFabula > 0 || trilhaEpicaModo === 'dobrar_pm') {
    efeitosExtras.push('Trilha Épica: Testes de Precisão seus e de aliados que o ouvirem são sucesso crítico com dados iguais (exceto 1+1).');
  }

  const sufixoValores = valores.danoCalculado !== null
    ? ` [Dano: ${valores.danoCalculado} de ${valores.tipoDano}]`
    : valores.curaCalculada !== null
      ? ` [Recuperação: ${valores.curaCalculada} ${valores.recuperacaoTipo}]`
      : '';

  return {
    sucesso: true,
    custoPm: custo.custoPm,
    custoFabula: custo.custoFabula,
    volume: custo.volumeObj,
    escala,
    tom,
    valores,
    efeitosExtras,
    mensagem: `Verso (${custo.volumeObj.nome} • ${escala.nome} • ${tom.nome}) cantado! Gasto: ${custo.custoPm} PM${custo.custoFabula > 0 ? ` e ${custo.custoFabula} PF` : ''}.${sufixoValores}`
  };
}

// =============================================================================
// 4. REGRAS PURAS - COMANDANTE
// =============================================================================

/**
 * Calcula o custo em PM de uma ordem do Comandante (Carga de Cavalaria, Decreto do Bispo, Roque do Rei).
 * Considera o Poder Heróico Batalha Incessante (reduz custo pela metade: 10 PM -> 5 PM).
 * @param {Object} params
 * @returns {number}
 */
export function calcularCustoOrdemComandante({ poderKey = '', temBatalhaIncessante = false } = {}) {
  const key = normalizarTextoHF(poderKey);
  if (key === 'gambito_dama') return 0;
  return temBatalhaIncessante
    ? Math.floor(CUSTO_BASE_ORDEM_COMANDANTE_PM / 2)
    : CUSTO_BASE_ORDEM_COMANDANTE_PM;
}

/**
 * Processa a ativação de um poder tático do Comandante.
 * @param {Object} params
 * @returns {Object}
 */
export function processarOrdemComandante({
  poderKey,
  nivelHabilidade = 1,
  opcaoEscolhida = 0,
  mpAtual = 0,
  temBatalhaIncessante = false,
  temCarruagemDevastadora = false,
  temTabulaRasa = false,
  emCrise = false,
  nivelPersonagem = 5
} = {}) {
  const np = Math.max(0, parseInt(nivelHabilidade, 10) || 0);
  if (np <= 0) {
    return { sucesso: false, mensagem: 'Você ainda não possui níveis neste poder de Comandante.' };
  }

  const key = normalizarTextoHF(poderKey);
  const custoPm = calcularCustoOrdemComandante({ poderKey: key, temBatalhaIncessante });
  const mp = Math.max(0, parseInt(mpAtual, 10) || 0);

  if (mp < custoPm) {
    return {
      sucesso: false,
      mensagem: `PM insuficiente! Este poder requer ${custoPm} PM e você possui ${mp} PM.`
    };
  }

  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  const danoTabulaRasa = temTabulaRasa && emCrise ? (nv >= 40 ? 30 : nv >= 20 ? 20 : 10) : 0;
  const extras = [];

  if (key === 'carga_cavalaria') {
    if (temCarruagemDevastadora) {
      extras.push('Carruagem Devastadora: Você pode escolher outro PJ que possa ouvi-lo e ainda não agiu para agir imediatamente após o seu turno.');
    }
    return {
      sucesso: true,
      poderKey: key,
      tituloOrdem: 'Carga de Cavalaria',
      custoPm,
      bonusPrecisao: np,
      efeitoTexto: `Aliado realiza ataque livre imediato com +${np} em Precisão (RA = 0 no dano).`,
      extras,
      danoTabulaRasa: 0,
      mensagem: `Carga de Cavalaria ativada (-${custoPm} PM)! Aliado realiza ataque livre com +${np} em Precisão (RA = 0).`
    };
  }

  if (key === 'decreto_bispo') {
    const efeitoTexto = opcaoEscolhida === 1
      ? `Todas as fontes de dano causam +${np * 3} de dano adicional.`
      : 'Todos os custos em PM são dobrados.';
    if (temCarruagemDevastadora) {
      extras.push('Carruagem Devastadora: Outro PJ que possa ouvi-lo pode agir imediatamente após o seu turno.');
    }
    if (danoTabulaRasa > 0) {
      extras.push(`Tabula Rasa (Em Crise): Cada inimigo presente na cena perde ${danoTabulaRasa} PV!`);
    }
    return {
      sucesso: true,
      poderKey: key,
      tituloOrdem: 'Decreto do Bispo',
      custoPm,
      bonusDano: opcaoEscolhida === 1 ? np * 3 : 0,
      efeitoTexto,
      extras,
      danoTabulaRasa,
      mensagem: `Decreto do Bispo proclamado (-${custoPm} PM): ${efeitoTexto}`
    };
  }

  if (key === 'roque_rei') {
    const efeitoTexto = opcaoEscolhida === 1
      ? `Todos os efeitos que restauram PM restauram +${np * 5} PM adicionais até o início do seu próximo turno.`
      : 'Nenhuma criatura pode recuperar PV ou PM até o início do seu próximo turno.';
    if (temCarruagemDevastadora) {
      extras.push('Carruagem Devastadora: Outro PJ que possa ouvi-lo pode agir imediatamente após o seu turno.');
    }
    if (danoTabulaRasa > 0) {
      extras.push(`Tabula Rasa (Em Crise): Cada inimigo presente na cena perde ${danoTabulaRasa} PV!`);
    }
    return {
      sucesso: true,
      poderKey: key,
      tituloOrdem: 'Roque do Rei',
      custoPm,
      bonusCuraPm: opcaoEscolhida === 1 ? np * 5 : 0,
      efeitoTexto,
      extras,
      danoTabulaRasa,
      mensagem: `Roque do Rei ativado (-${custoPm} PM): ${efeitoTexto}`
    };
  }

  if (key === 'gambito_dama') {
    const curaPvAliado = 5 + (np * 5);
    const efeitoTexto = opcaoEscolhida === 1
      ? `Após ataque livre (RA = 0), aliado que possa ouvi-lo recupera ${curaPvAliado} PV.`
      : 'Após ataque livre (RA = 0), você usa imediatamente Carga de Cavalaria, Decreto do Bispo ou Roque do Rei sem usar ação (pagando o custo de PM).';
    return {
      sucesso: true,
      poderKey: key,
      tituloOrdem: 'Gambito da Dama',
      custoPm: 0,
      curaPvAliado: opcaoEscolhida === 1 ? curaPvAliado : 0,
      efeitoTexto,
      extras,
      danoTabulaRasa: 0,
      mensagem: `Gambito da Dama executado! ${efeitoTexto}`
    };
  }

  return { sucesso: false, mensagem: 'Poder de Comandante não reconhecido.' };
}

// =============================================================================
// 5. REGRAS PURAS - DANÇARINO
// =============================================================================

/**
 * Extrai a escolha permanente de benefício inicial do Dançarino (+5 PV ou +5 PM).
 * @param {Object} classeDancarino
 * @param {Object} [ficha=null]
 * @returns {{ escolha: 'pv'|'pm', bonusPv: number, bonusPm: number, confirmado: boolean }}
 */
export function extrairBeneficioInicialDancarino(classeDancarino = null, ficha = null) {
  const habs = Array.isArray(classeDancarino?.habilidades) ? classeDancarino.habilidades : [];
  const habDanca = habs.find((h) => normalizarTextoHF(h?.nome).includes('danca'));
  const escolhaSalva =
    classeDancarino?.dados_dancarino?.beneficioInicial ||
    habDanca?.dados_dancarino?.beneficioInicial ||
    ficha?.dados_dancarino?.beneficioInicial;

  if (escolhaSalva === 'pm') {
    return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: true };
  }
  if (escolhaSalva === 'pv') {
    return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: true };
  }

  const textoBeneficio = normalizarTextoHF(
    typeof classeDancarino?.beneficios === 'object'
      ? classeDancarino?.beneficios?.texto
      : classeDancarino?.beneficios
  );

  if (textoBeneficio.includes('pv ou pm') || textoBeneficio.includes('a sua escolha')) {
    return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: false };
  }
  if (textoBeneficio.includes('pm') && !textoBeneficio.includes('pv')) {
    return { escolha: 'pm', bonusPv: 0, bonusPm: 5, confirmado: true };
  }
  return { escolha: 'pv', bonusPv: 5, bonusPm: 0, confirmado: true };
}

/**
 * Gera o texto oficial atualizado do benefício inicial do Dançarino conforme escolha do jogador.
 * @param {'pv'|'pm'} escolha
 * @returns {string}
 */
export function gerarTextoBeneficioDancarino(escolha = 'pv') {
  return escolha === 'pm'
    ? 'Aumente permanentemente seus PM máximos em 5.'
    : 'Aumente permanentemente seus PV máximos em 5.';
}

/**
 * Calcula quantas danças o personagem pode aprender pelo nível em Dança (máx 10).
 * @param {number} nvDanca
 * @returns {number}
 */
export function calcularLimiteDancasAprendidas(nvDanca = 0) {
  return Math.max(0, Math.min(10, parseInt(nvDanca, 10) || 0));
}

/**
 * Calcula o custo em PM para apresentar uma dança.
 * - Base: 10 PM
 * - Se apresentou uma dança diferente no turno anterior na mesma cena: -5 PM (5 PM)
 * - Me Acompanhe (apenas danças de turno): +10 PM (ou 0 PM com Paso Doble em Crise)
 * - Bloqueado se usar armadura marcial.
 *
 * @param {Object} params
 * @returns {Object}
 */
export function calcularCustoDanca({
  danca = null,
  ultimaDancaKey = null,
  usarMeAcompanhe = false,
  temPasoDoble = false,
  emCrise = false,
  temArmaduraMarcial = false
} = {}) {
  const bloqueadaPorArmadura = Boolean(temArmaduraMarcial);
  const dancaDiferenteConsecutiva = Boolean(
    ultimaDancaKey && danca?.key && normalizarTextoHF(ultimaDancaKey) !== normalizarTextoHF(danca.key)
  );
  const custoDanca = dancaDiferenteConsecutiva
    ? CUSTO_BASE_DANCA_PM - DESCONTO_DANCA_CONSECUTIVA_PM
    : CUSTO_BASE_DANCA_PM;

  const permiteMeAcompanhe = danca?.tipo_duracao === 'turno';
  const pasoDobleAtivo = Boolean(permiteMeAcompanhe && usarMeAcompanhe && temPasoDoble && emCrise);
  const custoMeAcompanhe = !permiteMeAcompanhe || !usarMeAcompanhe
    ? 0
    : pasoDobleAtivo
      ? 0
      : CUSTO_ME_ACOMPANHE_PM;

  return {
    custoDanca,
    custoMeAcompanhe,
    custoTotal: custoDanca + custoMeAcompanhe,
    descontoConsecutivoAplicado: dancaDiferenteConsecutiva,
    pasoDobleAplicado: pasoDobleAtivo,
    permiteMeAcompanhe,
    bloqueadaPorArmadura
  };
}

/**
 * Resolve valores dinâmicos de uma dança com base em Destreza e nível do personagem.
 * @param {Object} params
 * @returns {{ valorDestreza: number, curaUnicornio: number|null, perdaPmMenade: number|null }}
 */
export function resolverValoresDanca({ danca = null, dadoDestreza = 8, nivelPersonagem = 5 } = {}) {
  const desFaces = extrairFacesDadoHF(dadoDestreza, 8);
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  const key = normalizarTextoHF(danca?.key || '');

  const curaUnicornio = key === 'danca_unicornio'
    ? desFaces + (nv >= 40 ? 10 : nv >= 20 ? 5 : 0)
    : null;
  const perdaPmMenade = key === 'danca_menade' ? desFaces : null;

  return {
    valorDestreza: desFaces,
    curaUnicornio,
    perdaPmMenade
  };
}

/**
 * Processa a apresentação de uma Dança, validando armadura marcial, PM e bônus derivados.
 * @param {Object} params
 * @returns {Object}
 */
export function processarApresentacaoDanca({
  danca = null,
  mpAtual = 0,
  ultimaDancaKey = null,
  usarMeAcompanhe = false,
  temMeAcompanhe = false,
  temPasoDoble = false,
  emCrise = false,
  temArmaduraMarcial = false,
  nvDancarinoGuerra = 0,
  nvSapateadoFrenetico = 0,
  temTrocaFigurino = false,
  dadoDestreza = 8,
  nivelPersonagem = 5,
  modoElemento = 'resistencia'
} = {}) {
  if (!danca) {
    return { sucesso: false, mensagem: 'Selecione uma dança aprendida para apresentar.' };
  }

  if (temArmaduraMarcial) {
    return {
      sucesso: false,
      mensagem: 'Não é possível apresentar danças enquanto estiver equipando uma armadura marcial.'
    };
  }

  const custo = calcularCustoDanca({
    danca,
    ultimaDancaKey,
    usarMeAcompanhe: usarMeAcompanhe && temMeAcompanhe,
    temPasoDoble,
    emCrise,
    temArmaduraMarcial
  });

  const mp = Math.max(0, parseInt(mpAtual, 10) || 0);
  if (mp < custo.custoTotal) {
    return {
      sucesso: false,
      mensagem: `PM insuficiente! Esta dança requer ${custo.custoTotal} PM e você possui ${mp} PM.`
    };
  }

  const valores = resolverValoresDanca({ danca, dadoDestreza, nivelPersonagem });
  const efeitosExtras = [];

  if (nvDancarinoGuerra > 0) {
    efeitosExtras.push(
      `Dançarino de Guerra: +${nvDancarinoGuerra} de dano em ataques com adaga, arremesso, luta, malho e feitiços (O) com arma arcana.`
    );
  }
  if (danca.tipo_duracao === 'turno' && nvSapateadoFrenetico > 0) {
    efeitosExtras.push(
      `Sapateado Frenético: +${nvSapateadoFrenetico * 2} em testes opostos de acrobacia, coordenação ou velocidade.`
    );
  }
  if (temTrocaFigurino) {
    efeitosExtras.push('Troca de Figurino: Você pode fazer a ação Equipamento sem usar ações.');
  }
  if (usarMeAcompanhe && temMeAcompanhe && danca.tipo_duracao === 'turno') {
    efeitosExtras.push('Me Acompanhe: Um aliado com Laço de afeto também recebe os benefícios desta dança.');
  }

  const infoValor = valores.curaUnicornio !== null
    ? ` (Cura: ${valores.curaUnicornio} PV para você e aliado com Laço)`
    : valores.perdaPmMenade !== null
      ? ` (Alvo perde ${valores.perdaPmMenade} PM)`
      : '';

  const sufixoElemento = danca.descricao?.includes('Resistente a dano')
    ? (modoElemento === 'converter' ? ' [Modo: Converter Dano]' : ' [Modo: Resistência Elemental]')
    : '';

  return {
    sucesso: true,
    custoTotal: custo.custoTotal,
    novaUltimaDancaKey: danca.key,
    dancaAtivaTurno: danca.tipo_duracao === 'turno' ? danca : null,
    efeitosExtras,
    valores,
    mensagem: `${danca.nome} apresentada (-${custo.custoTotal} PM${custo.descontoConsecutivoAplicado ? ', desconto consecutivo aplicado' : ''})!${infoValor}${sufixoElemento}`
  };
}

// =============================================================================
// 6. REGRAS PURAS - SIMBOLISTA (SIGILOS E SÍMBOLOS)
// =============================================================================

/**
 * Calcula quantos Símbolos o Simbolista aprende pelo nível em Simbolismo (2 por NP, máx 10).
 * @param {number} nvSimbolismo
 * @returns {number}
 */
export function calcularLimiteSimbolosAprendidos(nvSimbolismo = 0) {
  const np = Math.max(0, Math.min(5, parseInt(nvSimbolismo, 10) || 0));
  return np * 2;
}

/**
 * Calcula quantos Símbolos podem estar ativos simultaneamente (NP + 1, máx 6).
 * @param {number} nvSimbolismo
 * @returns {number}
 */
export function calcularLimiteSimbolosAtivos(nvSimbolismo = 0) {
  const np = Math.max(0, Math.min(5, parseInt(nvSimbolismo, 10) || 0));
  return np > 0 ? np + 1 : 0;
}

/**
 * Calcula o custo máximo de PM de um feitiço canalizado via Símbolos Mágicos (NP × 10 PM).
 * @param {number} nvSimbolosMagicos
 * @returns {number}
 */
export function calcularLimitePmSimbolosMagicos(nvSimbolosMagicos = 0) {
  const np = Math.max(0, Math.min(3, parseInt(nvSimbolosMagicos, 10) || 0));
  return np * 10;
}

/**
 * Calcula a perda de PV e PM causada pelo Símbolo da Proibição conforme nível do Simbolista.
 * @param {number} nivelPersonagem
 * @returns {number}
 */
export function calcularValorSimboloProibicao(nivelPersonagem = 5) {
  const nv = Math.max(1, parseInt(nivelPersonagem, 10) || 5);
  if (nv >= 40) return 25;
  if (nv >= 20) return 15;
  return 5;
}

/**
 * Calcula o custo real em PI para criar um símbolo (padrão 2 PI, mínimo 1 PI com Bolsos Fundos ou 0 PI destruindo Símbolo da Criação).
 * @param {Object} params
 * @returns {number}
 */
export function calcularCustoCriacaoSimbolo({ reducaoCustoPi = 0, destruirSimboloCriacao = false } = {}) {
  if (destruirSimboloCriacao) return 0;
  const red = Math.max(0, parseInt(reducaoCustoPi, 10) || 0);
  return Math.max(1, CUSTO_CRIACAO_SIMBOLO_PI - red);
}

/**
 * Processa a criação e aplicação de um Símbolo pelo Simbolista.
 * Regras oficiais:
 * - Gasta ação Inventário e 2 PI.
 * - Limite simultâneo de (NP + 1) símbolos ativos; se exceder, exige destruir um ativo antes.
 * - Uma criatura só pode portar 1 símbolo por vez (substitui se aplicar em si mesmo).
 * - Símbolo da Metamorfose não pode ser aplicado a PJs.
 *
 * @param {Object} params
 * @returns {Object}
 */
export function processarCriacaoSimbolo({
  simbolo = null,
  escolhaOpcao = '',
  modoAplicacao = 'aliado',
  nomeAlvo = '',
  simbolosAtivos = [],
  nvSimbolismo = 0,
  piAtual = 0,
  reducaoCustoPi = 0,
  destruirSimboloCriacao = false,
  substituirSimboloId = null
} = {}) {
  if (!simbolo) {
    return { sucesso: false, mensagem: 'Selecione um Símbolo aprendido para criar.' };
  }
  const np = Math.max(0, parseInt(nvSimbolismo, 10) || 0);
  if (np <= 0) {
    return { sucesso: false, mensagem: 'Adquira níveis na habilidade Simbolismo para criar símbolos.' };
  }

  if (simbolo.key === 'simbolo_metamorfose' && modoAplicacao === 'proprio') {
    return {
      sucesso: false,
      mensagem: 'O Símbolo da Metamorfose não pode ser aplicado a Personagens dos Jogadores (PJs).'
    };
  }

  if (simbolo.requer_escolha && !escolhaOpcao) {
    return {
      sucesso: false,
      mensagem: `O "${simbolo.nome}" exige escolher uma opção (${simbolo.tipo_escolha || 'parâmetro'}) antes de ser criado.`
    };
  }

  const custoPi = calcularCustoCriacaoSimbolo({ reducaoCustoPi, destruirSimboloCriacao });
  const pi = Math.max(0, parseInt(piAtual, 10) || 0);
  if (pi < custoPi) {
    return {
      sucesso: false,
      mensagem: `PI insuficiente! Criar este símbolo requer ${custoPi} PI e você possui ${pi} PI.`
    };
  }

  const limiteAtivos = calcularLimiteSimbolosAtivos(np);
  let listaBase = Array.isArray(simbolosAtivos) ? [...simbolosAtivos] : [];

  // Uma criatura só pode portar 1 símbolo por vez: ao aplicar em si mesmo, substitui o anterior em 'proprio'
  if (modoAplicacao === 'proprio') {
    listaBase = listaBase.filter((s) => s.alvoTipo !== 'proprio');
  }

  if (substituirSimboloId) {
    listaBase = listaBase.filter((s) => s.id !== substituirSimboloId);
  }

  if (listaBase.length >= limiteAtivos) {
    return {
      sucesso: false,
      requerSubstituicao: true,
      mensagem: `Limite de ${limiteAtivos} símbolos ativos atingido (NP ${np} + 1). Destrua um símbolo ativo antes de criar um novo.`
    };
  }

  const alvoLabel = modoAplicacao === 'proprio'
    ? 'Próprio Personagem'
    : (nomeAlvo || '').trim() || (modoAplicacao === 'ataque_livre' ? 'Inimigo Atingido' : 'Aliado');

  const novoRegistro = {
    id: `${simbolo.key}_${Date.now()}`,
    key: simbolo.key,
    nome: simbolo.nome,
    escolha: escolhaOpcao || null,
    alvoTipo: modoAplicacao,
    alvoNome: alvoLabel,
    efeitoResumido: simbolo.efeito_resumido || '',
    descricao: simbolo.descricao
  };

  const novaLista = [...listaBase, novoRegistro];
  const sufixoEscolha = escolhaOpcao ? ` [${escolhaOpcao}]` : '';
  const sufixoModo = modoAplicacao === 'ataque_livre'
    ? ' via Ataque Livre sem dano (1 cópia por inimigo atingido)'
    : ` em ${alvoLabel}`;

  return {
    sucesso: true,
    custoPi,
    novoSimbolo: novoRegistro,
    simbolosAtivos: novaLista,
    mensagem: `${simbolo.nome}${sufixoEscolha} criado (-${custoPi} PI) e aplicado${sufixoModo}! (${novaLista.length}/${limiteAtivos} ativos)`
  };
}

/**
 * Extrai efeitos ativos de Símbolos aplicados ao próprio personagem (alvoTipo === 'proprio')
 * e informações globais dos símbolos ativos para cálculos da ficha.
 * @param {Array} classes
 * @param {Object} [ficha=null]
 * @returns {Object}
 */
export function extrairEfeitosSimbolosAtivos(classes = [], ficha = null) {
  const simbolistaClass = (classes || []).find((c) => ehClasseSimbolista(c?.nome_classe));
  const habSimbolismo = (simbolistaClass?.habilidades || []).find((h) =>
    normalizarTextoHF(h?.nome).includes('simbolismo')
  );
  const habToque = (simbolistaClass?.habilidades || []).find((h) =>
    normalizarTextoHF(h?.nome).includes('toque pessoal')
  );
  const habMagicos = (simbolistaClass?.habilidades || []).find((h) =>
    normalizarTextoHF(h?.nome).includes('simbolos magicos')
  );

  const dadosSimb = simbolistaClass?.dados_simbolista || habSimbolismo?.dados_simbolista || ficha?.dados_simbolista || {};
  const simbolosAtivos = Array.isArray(dadosSimb.simbolosAtivos) ? dadosSimb.simbolosAtivos : [];
  const simbolosProprios = simbolosAtivos.filter((s) => s.alvoTipo === 'proprio');

  const resistencias = [];
  let travaAtributosBase = false;
  let temSimboloDesespero = false;
  let temSimboloCrescimento = false;
  let temSimboloFeiticariaProprio = false;
  let temSimboloVerdadeProprio = false;
  let qtdSimbolosVerdadeInimigos = 0;
  let qtdSimbolosFeiticariaInimigos = 0;

  simbolosAtivos.forEach((s) => {
    if (s.key === 'simbolo_verdade' && s.alvoTipo !== 'proprio') {
      qtdSimbolosVerdadeInimigos += 1;
    }
    if (s.key === 'simbolo_feiticaria' && s.alvoTipo !== 'proprio') {
      qtdSimbolosFeiticariaInimigos += 1;
    }
  });

  simbolosProprios.forEach((s) => {
    if (s.key === 'simbolo_protecao' && s.escolha) {
      resistencias.push({
        tipo: normalizarTextoHF(s.escolha),
        fonte: 'Símbolo da Proteção'
      });
    }
    if (s.key === 'simbolo_amarras') {
      travaAtributosBase = true;
    }
    if (s.key === 'simbolo_desespero') {
      temSimboloDesespero = true;
    }
    if (s.key === 'simbolo_crescimento') {
      temSimboloCrescimento = true;
    }
    if (s.key === 'simbolo_feiticaria') {
      temSimboloFeiticariaProprio = true;
    }
    if (s.key === 'simbolo_verdade') {
      temSimboloVerdadeProprio = true;
    }
  });

  return {
    simbolistaAtivo: Boolean(simbolistaClass),
    nvSimbolismo: parseInt(habSimbolismo?.nivel, 10) || 0,
    nvToquePessoal: parseInt(habToque?.nivel, 10) || 0,
    nvSimbolosMagicos: parseInt(habMagicos?.nivel, 10) || 0,
    simbolosAtivos,
    simbolosProprios,
    resistencias,
    travaAtributosBase,
    temSimboloDesespero,
    temSimboloCrescimento,
    temSimboloFeiticariaProprio,
    temSimboloVerdadeProprio,
    qtdSimbolosVerdadeInimigos,
    qtdSimbolosFeiticariaInimigos
  };
}

/**
 * Consolida sinergias ativas de combate, magia e rituais de todas as classes da ficha.
 * @param {Object} params
 * @returns {Object}
 */
export function calcularSinergiasCombateEMagia({
  classes = [],
  ficha = null,
  itensEquipados = [],
  nivelTotal = 5,
  emCrise = false
} = {}) {
  const getHabNivel = (classeMatcher, habTermo) => {
    const cls = (classes || []).find((c) => classeMatcher(c?.nome_classe || ''));
    const h = (cls?.habilidades || []).find((item) => normalizarTextoHF(item?.nome).includes(habTermo));
    return { cls, h, nivel: parseInt(h?.nivel, 10) || 0 };
  };

  const temArmaArcanaEquipada = (itensEquipados || []).some((item) => {
    const cat = normalizarTextoHF(item?.stats_personalizados?.categoria || item?.tipo || '');
    return cat.includes('arcana') || cat.includes('cajado') || cat.includes('tomo');
  });

  // Esper
  const esperClass = (classes || []).find((c) => normalizarTextoHF(c?.nome_classe).includes('esper'));
  const habFoco = (esperClass?.habilidades || []).find((h) => normalizarTextoHF(h?.nome).includes('foco cognitivo'));
  const habHiper = (esperClass?.habilidades || []).find((h) => normalizarTextoHF(h?.nome).includes('hipercognicao'));
  const dadosEsper = esperClass?.dados_esper || habFoco?.dados_esper || ficha?.dados_esper || {};
  const nvFocoCognitivo = parseInt(habFoco?.nivel, 10) || 0;
  const nvHipercognicao = parseInt(habHiper?.nivel, 10) || 0;
  const focoCognitivoAtivo = Boolean(dadosEsper.focoAtivo && nvFocoCognitivo > 0);

  // Elementalista & Espiritualista & Erudito
  const { nivel: nvArtilhariaMagica } = getHabNivel((n) => normalizarTextoHF(n).includes('elementalista'), 'artilharia magica');
  const { nivel: nvCataclismo } = getHabNivel((n) => normalizarTextoHF(n).includes('elementalista'), 'cataclismo');
  const { nivel: nvPoderCurativo } = getHabNivel((n) => normalizarTextoHF(n).includes('espiritualista'), 'poder curativo');
  const { nivel: nvConcentrado } = getHabNivel((n) => normalizarTextoHF(n).includes('erudito'), 'concentrado');
  const { nivel: nvConsumir } = getHabNivel((n) => normalizarTextoHF(n).includes('quimerista'), 'consumir');

  // High Fantasy: Comandante, Dançarino, Virtuoso, Simbolista
  const cmd = getHabNivel((n) => ehClasseComandante(n), 'decreto do bispo');
  const dadosCmd = cmd.cls?.dados_comandante || cmd.h?.dados_comandante || ficha?.dados_comandante || {};
  const ordemAtivaCmd = dadosCmd.ordemAtiva || null;
  const decretoDanoAtivo = ordemAtivaCmd?.poderKey === 'decreto_bispo' && String(ordemAtivaCmd?.efeito || '').includes('dano adicional');
  const decretoDobrarPmAtivo = ordemAtivaCmd?.poderKey === 'decreto_bispo' && String(ordemAtivaCmd?.efeito || '').includes('dobrados');

  const dncGuerra = getHabNivel((n) => ehClasseDancarino(n), 'dancarino de guerra');
  const dncSapateado = getHabNivel((n) => ehClasseDancarino(n), 'sapateado frenetico');
  const dadosDnc = dncGuerra.cls?.dados_dancarino || dncSapateado.cls?.dados_dancarino || ficha?.dados_dancarino || {};
  const dancaAtivaTurno = dadosDnc.dancaAtivaTurno || null;
  const dancaApresentada = Boolean(dancaAtivaTurno || dadosDnc.ultimaDancaKey);

  const vrtBarreira = getHabNivel((n) => ehClasseVirtuoso(n), 'barreira sonora');
  const vrtHarmonia = getHabNivel((n) => ehClasseVirtuoso(n), 'harmonia');
  const simb = extrairEfeitosSimbolosAtivos(classes, ficha);

  const bonusDanoDecreto = decretoDanoAtivo ? cmd.nivel * 3 : 0;
  const bonusDanoDancarinoGuerra = dancaApresentada ? dncGuerra.nivel : 0;
  const bonusSapateadoOpostos = dancaAtivaTurno ? dncSapateado.nivel * 2 : 0;
  const bonusArtilharia = temArmaArcanaEquipada ? nvArtilhariaMagica * 2 : 0;
  const bonusFocoTeste = focoCognitivoAtivo ? nvFocoCognitivo : 0;
  const bonusFocoCura = focoCognitivoAtivo ? nvFocoCognitivo * 2 : 0;
  const numLacos = Array.isArray(ficha?.lacos) ? ficha.lacos.length : 0;
  const bonusPoderCurativo = temArmaArcanaEquipada && nvPoderCurativo > 0 ? 3 + (nvPoderCurativo * numLacos) : 0;

  return {
    temArmaArcanaEquipada,
    focoCognitivoAtivo,
    nvFocoCognitivo,
    nvHipercognicao,
    bonusFocoTeste,
    bonusFocoCura,
    nvArtilhariaMagica,
    bonusArtilharia,
    nvCataclismo,
    nvPoderCurativo,
    bonusPoderCurativo,
    nvConcentrado,
    nvConsumir,
    decretoDanoAtivo,
    decretoDobrarPmAtivo,
    ordemAtivaCmd,
    bonusDanoDecreto,
    dancaAtivaTurno,
    dancaApresentada,
    bonusDanoDancarinoGuerra,
    bonusSapateadoOpostos,
    nvBarreiraSonora: vrtBarreira.nivel,
    nvHarmonia: vrtHarmonia.nivel,
    simbolista: simb,
    emCrise,
    nivelTotal
  };
}

