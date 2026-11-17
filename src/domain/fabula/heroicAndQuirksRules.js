/**
 * Fabula Ultima - Regras de Poderes Heróicos (Heroic Skills) e Peculiaridades (Quirks)
 *
 * CONFORME GEMINI.md:
 * - Camada de Domínio Puro (src/domain/fabula/): Funções puras em JavaScript (sem efeitos colaterais).
 * - Isolamento total: ZERO importações de React ou Supabase.
 * - Desacoplamento de dados: O catálogo oficial é persistido e consultado diretamente
 *   do Supabase através de fichaService.js, mantendo este módulo exclusivo para regras,
 *   cálculos de elegibilidade, fórmulas passivas e validações matemáticas.
 */

// =============================================================================
// 1. CONSTANTES OFICIAIS DE REGRAS (FABULA ULTIMA)
// =============================================================================

export const NIVEL_DOMINIO_CLASSE = 10;
export const MAX_PECULIARIDADES_POR_PERSONAGEM = 1;

export const FONTES_MANUAIS = {
  LIVRO_BASICO: 'Livro Básico',
  ALTA_FANTASIA: 'Atlas Alta Fantasia',
  TECNO_FANTASIA: 'Atlas Tecno-Fantasia',
  FANTASIA_NATURAL: 'Atlas Fantasia Natural'
};

export const CATEGORIAS_PODERES_HEROICOS = {
  AUMENTO_ATRIBUTO: 'aumento_atributo',
  RECURSOS_VITAIS: 'recursos_vitais',
  COMBATE_MARCIAL: 'combate_marcial',
  MAGIA_E_ARCANOS: 'magia_e_arcanos',
  SUPORTE_E_TATICA: 'suporte_e_tatica',
  ESPECIALISTA_CLASSE: 'especialista_classe'
};

export const REGRAS_OFICIAIS_RESUMO = {
  poderesHeroicos: {
    nivelDominioClasse: NIVEL_DOMINIO_CLASSE,
    regraDesbloqueio:
      'Sempre que um personagem atinge o Nível 10 (NP 10) em uma classe, ele domina essa classe permanentemente e ganha direito a 1 Poder Heróico adicional.',
    regraPreRequisitos:
      'Para escolher um Poder Heróico com requisitos de classe, o personagem deve ter atingido o Nível 10 em pelo menos uma das classes listadas e cumprir os requisitos de habilidades indicados.',
    regraUnicidade:
      'Cada Poder Heróico só pode ser adquirido uma única vez pelo mesmo personagem.'
  },
  peculiaridades: {
    limitePorPersonagem: MAX_PECULIARIDADES_POR_PERSONAGEM,
    regraOpcional:
      'Regra suplementar oficial dos Atlas: Cada personagem pode possuir no máximo 1 Peculiaridade (Quirk), escolhida durante a criação ou em momento dramático crucial.',
    estrutura:
      'Combina forte gancho narrativo/identidade com benefícios mecânicos exclusivos.'
  }
};

/**
 * Catálogos vazios para compatibilidade retroativa com eventuais imports legados.
 * O carregamento oficial é feito via fichaService.getCatalogoPoderesHeroicos() e getCatalogoPeculiaridades().
 */
export const HEROIC_SKILLS_CATALOG = [];
export const QUIRKS_CATALOG = [];

// =============================================================================
// 2. FUNÇÕES AUXILIARES PURAS
// =============================================================================

/**
 * Normaliza strings para comparações insensíveis a acentos e maiúsculas.
 * @param {string} texto
 * @returns {string}
 */
export function normalizarTexto(texto = '') {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Mapa de sinônimos de habilidades entre traduções e variações.
 */
const SINONIMOS_HABILIDADES = {
  'dons psiquicos': ['dons psiquicos', 'dadivas psiquicas', 'psychic gifts'],
  'teriomorfose': ['teriomorfose', 'theriomorphosis'],
  'veiculo pessoal': ['veiculo pessoal', 'personal vehicle'],
  'foco cognitivo': ['foco cognitivo', 'cognitive focus'],
  'arcanos': ['arcanos', 'arcana', 'arcanum'],
  'golpe das sombras': ['golpe das sombras', 'shadow strike'],
  'fogo cruzado': ['fogo cruzado', 'crossfire'],
  'proteger': ['proteger', 'protect'],
  'frenesi': ['frenesi', 'frenzy'],
  'esquiva': ['esquiva', 'dodge'],
  'tempo roubado': ['tempo roubado', 'stolen time'],
  'feitico quimerico': ['feitico quimerico', 'chimeric spell'],
  'engenhocas': ['engenhocas', 'gadgets'],
  'companheiro fiel': ['companheiro fiel', 'faithful companion'],
  'tiro de aviso': ['tiro de aviso', 'warning shot'],
  'roubo de alma': ['roubo de alma', 'soul steal'],
  'condenar': ['condenar', 'condemn'],
  'encorajar': ['encorajar', 'encourage'],
  'me acompanhe': ['me acompanhe', 'eu conduzo', 'lead the way'],
  'contra-ataque': ['contra-ataque', 'counterattack'],
  'acromorfose': ['acromorfose', 'achromorphosis'],
  'olhos de aguia': ['olhos de aguia', 'eagle eyes', 'olho de aguia'],
  'genoclepse': ['genoclepse', 'genoclepsis'],
  'imitacao magica': ['imitacao magica', 'spell mimicry'],
  'compressao tecnologica': ['compressao tecnologica', 'tech compression'],
  'alta velocidade': ['alta velocidade', 'high speed'],
  'quebra-ossos': ['quebra-ossos', 'quebra ossos', 'bone crusher'],
  'confio em voce': ['confio em voce', 'encorajar', 'encourage', 'lean on me'],
  'invocacao': ['invocacao', 'invocation'],
  'cloromancia': ['cloromancia', 'chloromancy'],
  'ventos do comercio': ['ventos do comercio', 'winds of trade'],
  'verdadeiro tesouro': ['verdadeiro tesouro', 'real treasure']
};

/**
 * Retorna as classes dominadas pelo personagem (Nível >= 10).
 * @param {Array<{nome_classe?: string, nivel?: number|string, habilidades?: Array}>} classes
 * @returns {Array<{nome_classe: string, nome_normalizado: string, nivel: number, objetoOriginal: Object}>}
 */
export function obterClassesDominadas(classes = []) {
  if (!Array.isArray(classes)) return [];

  return classes
    .filter((c) => (parseInt(c?.nivel, 10) || 0) >= NIVEL_DOMINIO_CLASSE)
    .map((c) => ({
      nome_classe: c.nome_classe || '',
      nome_normalizado: normalizarTexto(c.nome_classe),
      nivel: parseInt(c.nivel, 10) || NIVEL_DOMINIO_CLASSE,
      objetoOriginal: c
    }));
}

/**
 * Calcula a quantidade de Poderes Heróicos a que o herói tem direito (1 por classe Nv. 10).
 * @param {Array<{nome_classe?: string, nivel?: number|string}>} classes
 * @param {number} [bonusExtra=0]
 * @returns {number}
 */
export function calcularLimitePoderesHeroicos(classes = [], bonusExtra = 0) {
  const dominadas = obterClassesDominadas(classes);
  const extra = Math.max(0, parseInt(bonusExtra, 10) || 0);
  return dominadas.length + extra;
}

/**
 * Verifica se o personagem possui determinada habilidade de classe com nível >= 1.
 * @param {Array<{habilidades?: Array<{nome?: string, nivel?: number|string}>}>} classes
 * @param {string} nomeHabilidadeRequerida
 * @returns {boolean}
 */
export function possuiHabilidadeRequerida(classes = [], nomeHabilidadeRequerida = '') {
  if (!Array.isArray(classes) || !nomeHabilidadeRequerida) return false;

  const habReqNorm = normalizarTexto(nomeHabilidadeRequerida);
  const variantesAceitas = SINONIMOS_HABILIDADES[habReqNorm] || [habReqNorm];

  return classes.some((c) =>
    (c?.habilidades || []).some((h) => {
      const nivelHab = parseInt(h?.nivel, 10) || 0;
      if (nivelHab <= 0) return false;
      const nomeHabNorm = normalizarTexto(h?.nome);
      return variantesAceitas.some((variante) => nomeHabNorm.includes(variante));
    })
  );
}

/**
 * Busca um Poder Heróico em um catálogo pela chave (`key`) ou pelo nome.
 * @param {string} identificador
 * @param {Array<Object>} [catalogo=[]]
 * @returns {Object|null}
 */
export function buscarPoderHeroicoNoCatalogo(identificador = '', catalogo = []) {
  const idNorm = normalizarTexto(identificador);
  if (!idNorm) return null;

  const lista = Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : HEROIC_SKILLS_CATALOG;
  return (
    lista.find(
      (ph) =>
        normalizarTexto(ph?.key) === idNorm ||
        normalizarTexto(ph?.nome) === idNorm ||
        normalizarTexto(ph?.nome_original) === idNorm
    ) || null
  );
}

/**
 * Busca uma Peculiaridade em um catálogo pela chave (`key`) ou pelo nome.
 * @param {string} identificador
 * @param {Array<Object>} [catalogo=[]]
 * @returns {Object|null}
 */
export function buscarPeculiaridadeNoCatalogo(identificador = '', catalogo = []) {
  const idNorm = normalizarTexto(identificador);
  if (!idNorm) return null;

  const lista = Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : QUIRKS_CATALOG;
  return (
    lista.find(
      (q) =>
        normalizarTexto(q?.key) === idNorm ||
        normalizarTexto(q?.nome) === idNorm ||
        normalizarTexto(q?.nome_original) === idNorm
    ) || null
  );
}

// =============================================================================
// 3. VALIDAÇÃO PURA DE PODERES HERÓICOS
// =============================================================================

/**
 * Valida a elegibilidade de um Poder Heróico para uma ficha.
 *
 * @param {Object|string} poderHeroico
 * @param {Array} classes
 * @param {Array} [poderesJaAdquiridos=[]]
 * @param {Array} [catalogo=[]]
 * @returns {{
 *   elegivel: boolean,
 *   jaAdquirido: boolean,
 *   temSlotClasseDominada: boolean,
 *   cumpreRequisitoClasse: boolean,
 *   cumpreRequisitoHabilidade: boolean,
 *   classesDominadasQueHabilitam: Array<string>,
 *   motivosBloqueio: Array<string>,
 *   poderCatalogo: Object|null
 * }}
 */
export function validarElegibilidadePoderHeroico(
  poderHeroico,
  classes = [],
  poderesJaAdquiridos = [],
  catalogo = []
) {
  const poderCatalogo =
    typeof poderHeroico === 'string'
      ? buscarPoderHeroicoNoCatalogo(poderHeroico, catalogo)
      : poderHeroico?.key
        ? buscarPoderHeroicoNoCatalogo(poderHeroico.key, catalogo) || poderHeroico
        : poderHeroico;

  if (!poderCatalogo || !poderCatalogo.nome) {
    return {
      elegivel: false,
      jaAdquirido: false,
      temSlotClasseDominada: false,
      cumpreRequisitoClasse: false,
      cumpreRequisitoHabilidade: false,
      classesDominadasQueHabilitam: [],
      motivosBloqueio: ['Poder Heróico inválido ou não encontrado no catálogo.'],
      poderCatalogo: null
    };
  }

  const motivosBloqueio = [];
  const classesDominadas = obterClassesDominadas(classes);
  const temSlotClasseDominada = classesDominadas.length > 0;

  if (!temSlotClasseDominada) {
    motivosBloqueio.push(
      'É necessário dominar pelo menos uma classe no Nível 10 (NP 10) para desbloquear Poderes Heróicos.'
    );
  }

  // 1. Unicidade
  const chaveAlvoNorm = normalizarTexto(poderCatalogo.key || poderCatalogo.nome);
  const nomeAlvoNorm = normalizarTexto(poderCatalogo.nome);

  const jaAdquirido = (poderesJaAdquiridos || []).some((item) => {
    const itemKey = typeof item === 'string' ? item : item?.key || item?.nome || '';
    const itemNorm = normalizarTexto(itemKey);
    return itemNorm && (itemNorm === chaveAlvoNorm || itemNorm === nomeAlvoNorm);
  });

  if (jaAdquirido) {
    motivosBloqueio.push(`O Poder Heróico "${poderCatalogo.nome}" já foi adquirido por este personagem.`);
  }

  // 2. Classes Requeridas (NP 10)
  const classesRequeridas = Array.isArray(poderCatalogo.classes_requeridas)
    ? poderCatalogo.classes_requeridas
    : [];

  let cumpreRequisitoClasse = false;
  let classesDominadasQueHabilitam = [];

  if (classesRequeridas.length === 0) {
    cumpreRequisitoClasse = temSlotClasseDominada;
    classesDominadasQueHabilitam = classesDominadas.map((cd) => cd.nome_classe);
  } else {
    const requeridasNorm = classesRequeridas.map((cr) => normalizarTexto(cr));
    const matches = classesDominadas.filter((cd) =>
      requeridasNorm.some((reqNorm) => cd.nome_normalizado.includes(reqNorm) || reqNorm.includes(cd.nome_normalizado))
    );
    classesDominadasQueHabilitam = matches.map((m) => m.nome_classe);
    cumpreRequisitoClasse = matches.length > 0;

    if (!cumpreRequisitoClasse) {
      motivosBloqueio.push(
        `Requer ter dominado (Nível 10) pelo menos uma das seguintes classes: ${classesRequeridas.join(', ')}.`
      );
    }
  }

  // 3. Habilidades Requeridas
  const habilidadesRequeridas = Array.isArray(poderCatalogo.habilidades_requeridas)
    ? poderCatalogo.habilidades_requeridas
    : [];

  let cumpreRequisitoHabilidade = true;
  habilidadesRequeridas.forEach((habReq) => {
    if (!possuiHabilidadeRequerida(classes, habReq)) {
      cumpreRequisitoHabilidade = false;
      motivosBloqueio.push(`Requer possuir a habilidade de classe "${habReq}" (mínimo Nv. 1).`);
    }
  });

  const elegivel =
    temSlotClasseDominada &&
    !jaAdquirido &&
    cumpreRequisitoClasse &&
    cumpreRequisitoHabilidade;

  return {
    elegivel,
    jaAdquirido,
    temSlotClasseDominada,
    cumpreRequisitoClasse,
    cumpreRequisitoHabilidade,
    classesDominadasQueHabilitam,
    motivosBloqueio,
    poderCatalogo
  };
}

/**
 * Classifica a lista de poderes heróicos para a UI entre elegíveis, bloqueados e adquiridos.
 *
 * @param {Array} classes
 * @param {Array} [poderesJaAdquiridos=[]]
 * @param {string|null} [filtroFonte=null]
 * @param {Array} [catalogo=[]] Catálogo oficial fornecido via fichaService
 * @returns {{
 *   classesDominadas: Array<string>,
 *   slotsTotais: number,
 *   slotsUsados: number,
 *   slotsLivres: number,
 *   possuiSlotsLivres: boolean,
 *   elegiveis: Array<Object>,
 *   bloqueados: Array<Object>,
 *   adquiridos: Array<Object>,
 *   catalogoAvaliado: Array<Object>
 * }}
 */
export function listarPoderesHeroicosDisponiveis(
  classes = [],
  poderesJaAdquiridos = [],
  filtroFonte = null,
  catalogo = []
) {
  const classesDominadasObjs = obterClassesDominadas(classes);
  const classesDominadas = classesDominadasObjs.map((c) => c.nome_classe);
  const slotsTotais = classesDominadas.length;
  const slotsUsados = Array.isArray(poderesJaAdquiridos) ? poderesJaAdquiridos.length : 0;
  const slotsLivres = Math.max(0, slotsTotais - slotsUsados);
  const possuiSlotsLivres = slotsLivres > 0;

  const baseCatalogo = Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : HEROIC_SKILLS_CATALOG;

  const listaFiltrada = filtroFonte
    ? baseCatalogo.filter((ph) => normalizarTexto(ph?.fonte) === normalizarTexto(filtroFonte))
    : baseCatalogo;

  const catalogoAvaliado = listaFiltrada.map((ph) => {
    const avaliacao = validarElegibilidadePoderHeroico(ph, classes, poderesJaAdquiridos, catalogo);
    return {
      ...ph,
      ...avaliacao,
      podeSelecionarAgora: avaliacao.elegivel && possuiSlotsLivres
    };
  });

  return {
    classesDominadas,
    slotsTotais,
    slotsUsados,
    slotsLivres,
    possuiSlotsLivres,
    elegiveis: catalogoAvaliado.filter((p) => p.elegivel),
    bloqueados: catalogoAvaliado.filter((p) => !p.elegivel && !p.jaAdquirido),
    adquiridos: catalogoAvaliado.filter((p) => p.jaAdquirido),
    catalogoAvaliado
  };
}

/**
 * Valida a integridade de uma lista completa de Poderes Heróicos da ficha.
 *
 * @param {Array} classes
 * @param {Array} poderesSelecionados
 * @param {Array} [catalogo=[]]
 * @returns {{ valido: boolean, erros: Array<string>, slotsTotais: number, slotsUsados: number, slotsLivres: number }}
 */
export function validarSelecaoPoderesHeroicos(classes = [], poderesSelecionados = [], catalogo = []) {
  const lista = Array.isArray(poderesSelecionados) ? poderesSelecionados : [];
  const slotsTotais = calcularLimitePoderesHeroicos(classes);
  const slotsUsados = lista.length;
  const slotsLivres = Math.max(0, slotsTotais - slotsUsados);
  const erros = [];

  if (slotsUsados > slotsTotais) {
    erros.push(
      `O personagem possui ${slotsUsados} Poder(es) Heróico(s), mas dominou apenas ${slotsTotais} classe(s) no Nível 10.`
    );
  }

  const chavesVistas = new Set();

  lista.forEach((item) => {
    const chaveBruta = typeof item === 'string' ? item : item?.key || item?.nome || '';
    const chaveNorm = normalizarTexto(chaveBruta);

    if (!chaveNorm) {
      erros.push('Um Poder Heróico selecionado não possui nome ou identificador válido.');
      return;
    }

    if (chavesVistas.has(chaveNorm)) {
      erros.push(`O Poder Heróico "${chaveBruta}" foi selecionado mais de uma vez.`);
      return;
    }
    chavesVistas.add(chaveNorm);

    const ehCustomizado = typeof item === 'object' && item?.customizado === true;
    const poderOficial = buscarPoderHeroicoNoCatalogo(chaveBruta, catalogo);

    if (poderOficial && !ehCustomizado) {
      const validacao = validarElegibilidadePoderHeroico(poderOficial, classes, [], catalogo);
      if (!validacao.elegivel) {
        erros.push(`${poderOficial.nome}: ${validacao.motivosBloqueio.join(' ')}`);
      }
    }
  });

  return {
    valido: erros.length === 0,
    erros,
    slotsTotais,
    slotsUsados,
    slotsLivres
  };
}

// =============================================================================
// 4. CÁLCULO PURO DE BÔNUS PASSIVOS
// =============================================================================

/**
 * Calcula bônus passivos e modificadores permanentes outorgados por Poderes Heróicos.
 *
 * @param {Array<Object|string>} poderesAdquiridos
 * @param {number} [nivelTotalPersonagem=5]
 * @returns {Object}
 */
export function calcularBonusPassivosPoderesHeroicos(
  poderesAdquiridos = [],
  nivelTotalPersonagem = 5
) {
  const nv = parseInt(nivelTotalPersonagem, 10) || 5;
  const resultado = {
    bonusPvMax: 0,
    bonusPmMax: 0,
    bonusPiMax: 0,
    bonusIniciativa: 0,
    bonusDefesa: 0,
    bonusDefesaMagica: 0,
    reducaoCustoPi: 0,
    reducaoDanoExtraEscudoOuMarcial: 0,
    aumentosAtributo: {
      destreza: 0,
      astucia: 0,
      vigor: 0,
      vontade: 0
    },
    maxTerioformasAtivas: 2,
    maxFocosCognitivos: 1,
    bonusLimiteModulosAtivosVeiculo: 0,
    permiteArma2hEmUmaMao: false,
    permiteDuasArmasCategoriasDistintas: false
  };

  if (!Array.isArray(poderesAdquiridos)) return resultado;

  poderesAdquiridos.forEach((item) => {
    const chave = normalizarTexto(typeof item === 'string' ? item : item?.key || item?.nome || '');
    const ef = (typeof item === 'object' && item?.efeito_mecanico) ? item.efeito_mecanico : {};

    // Efeitos padrões oficiais reconhecidos diretamente por chave ou objeto
    if (chave === 'pv_extras' || ef.bonusPvMax) {
      resultado.bonusPvMax += nv >= 40 ? (ef.bonusPvMaxNv40 || 20) : (ef.bonusPvMax || 10);
    }
    if (chave === 'pm_extras' || ef.bonusPmMax) {
      resultado.bonusPmMax += nv >= 40 ? (ef.bonusPmMaxNv40 || 20) : (ef.bonusPmMax || 10);
    }
    if (chave === 'pi_extras' || ef.bonusPiMax) {
      resultado.bonusPiMax += ef.bonusPiMax || 4;
    }
    if (chave === 'bolsos_fundos' || ef.reducaoCustoPi) {
      resultado.reducaoCustoPi += ef.reducaoCustoPi || 1;
    }
    if (chave === 'ambidestria' || ef.permiteDuasArmasCategoriasDistintas) {
      resultado.permiteDuasArmasCategoriasDistintas = true;
      resultado.bonusDefesa += ef.bonusDefesa || 2;
    }
    if (chave === 'mao_de_gorila' || ef.permiteArma2hEmUmaMao) {
      resultado.permiteArma2hEmUmaMao = true;
    }
    if (chave === 'hoplita') {
      resultado.bonusDefesa += 1;
    }
    if (chave === 'adepto_das_laminas') {
      resultado.bonusDefesa += 1;
      resultado.bonusDefesaMagica += 1;
    }

    if (ef.bonusIniciativa) resultado.bonusIniciativa += ef.bonusIniciativa;
    if (ef.reducaoDanoExtraEscudoOuMarcial) resultado.reducaoDanoExtraEscudoOuMarcial += ef.reducaoDanoExtraEscudoOuMarcial;
    if (ef.bonusLimiteModulosAtivosVeiculo) resultado.bonusLimiteModulosAtivosVeiculo += ef.bonusLimiteModulosAtivosVeiculo;
    if (ef.maxTerioformasAtivas && ef.maxTerioformasAtivas > resultado.maxTerioformasAtivas) {
      resultado.maxTerioformasAtivas = ef.maxTerioformasAtivas;
    }
    if (ef.maxFocosCognitivos && ef.maxFocosCognitivos > resultado.maxFocosCognitivos) {
      resultado.maxFocosCognitivos = ef.maxFocosCognitivos;
    }
    if (ef.aumentoPassoAtributo && resultado.aumentosAtributo[ef.aumentoPassoAtributo] !== undefined) {
      resultado.aumentosAtributo[ef.aumentoPassoAtributo] += 1;
    }
  });

  return resultado;
}

// =============================================================================
// 5. VALIDAÇÃO PURA DE PECULIARIDADES (QUIRKS)
// =============================================================================

/**
 * Valida a regra de limite de Peculiaridade por personagem.
 *
 * @param {Object|Array} entradaPeculiaridade
 * @param {Array} [catalogo=[]]
 * @returns {Object}
 */
export function validarPeculiaridadePersonagem(entradaPeculiaridade, catalogo = []) {
  const erros = [];

  if (Array.isArray(entradaPeculiaridade)) {
    const ativas = entradaPeculiaridade.filter(
      (p) => p && (p.nome || p.titulo || p.titulo_pecularidade || p.key)
    );
    if (ativas.length > MAX_PECULIARIDADES_POR_PERSONAGEM) {
      erros.push(
        `Regra de Fabula Ultima: Um personagem pode possuir no máximo ${MAX_PECULIARIDADES_POR_PERSONAGEM} Peculiaridade (Quirk). Foram informadas ${ativas.length}.`
      );
    }
    const primeira = ativas[0] || null;
    const cat = primeira ? buscarPeculiaridadeNoCatalogo(primeira.key || primeira.nome || primeira.titulo, catalogo) : null;

    return {
      valido: erros.length === 0,
      possuiPeculiaridade: ativas.length > 0,
      quantidade: ativas.length,
      limiteMaximo: MAX_PECULIARIDADES_POR_PERSONAGEM,
      peculiaridadeCatalogo: cat,
      erros
    };
  }

  if (!entradaPeculiaridade || typeof entradaPeculiaridade !== 'object') {
    return {
      valido: true,
      possuiPeculiaridade: false,
      quantidade: 0,
      limiteMaximo: MAX_PECULIARIDADES_POR_PERSONAGEM,
      peculiaridadeCatalogo: null,
      erros: []
    };
  }

  const titulo = (
    entradaPeculiaridade.nome ||
    entradaPeculiaridade.titulo ||
    entradaPeculiaridade.titulo_pecularidade ||
    entradaPeculiaridade.titulo_peculiaridade ||
    ''
  ).trim();

  const possuiPeculiaridade = Boolean(titulo || entradaPeculiaridade.key);
  const peculiaridadeCatalogo = buscarPeculiaridadeNoCatalogo(
    entradaPeculiaridade.key || titulo,
    catalogo
  );

  return {
    valido: erros.length === 0,
    possuiPeculiaridade,
    quantidade: possuiPeculiaridade ? 1 : 0,
    limiteMaximo: MAX_PECULIARIDADES_POR_PERSONAGEM,
    peculiaridadeCatalogo,
    erros
  };
}

// =============================================================================
// 6. EXTRAÇÃO E NORMALIZAÇÃO DE DADOS DE FICHA
// =============================================================================

/**
 * Normaliza os nós de Peculiaridade e Poderes Heróicos de uma linha de `fichas_personagens`.
 *
 * @param {Object} ficha
 * @param {Array} [catalogoPeculiaridades=[]]
 * @param {Array} [catalogoPoderes=[]]
 * @returns {Object}
 */
export function extrairHeroicAndQuirksDaFicha(ficha = {}, catalogoPeculiaridades = [], catalogoPoderes = []) {
  const objPeculiaridade =
    ficha?.peculiaridade && typeof ficha.peculiaridade === 'object'
      ? ficha.peculiaridade
      : {};

  const titulo =
    ficha?.titulo_pecularidade ||
    ficha?.titulo_peculiaridade ||
    objPeculiaridade?.nome ||
    objPeculiaridade?.titulo ||
    '';

  const descricao =
    ficha?.descricao_pecularidade ||
    ficha?.descricao_peculiaridade ||
    objPeculiaridade?.descricao ||
    '';

  const itemCatalogo = buscarPeculiaridadeNoCatalogo(objPeculiaridade?.key || titulo, catalogoPeculiaridades);

  const poderesBrutos = Array.isArray(ficha?.poderes_heroicos) ? ficha.poderes_heroicos : [];
  const poderesNormalizados = poderesBrutos.map((ph) => {
    if (typeof ph === 'string') {
      const cat = buscarPoderHeroicoNoCatalogo(ph, catalogoPoderes);
      return cat
        ? {
            key: cat.key,
            nome: cat.nome,
            fonte: cat.fonte,
            descricao: cat.descricao,
            efeito_mecanico: cat.efeito_mecanico || {},
            classe_origem: null
          }
        : { key: normalizarTexto(ph), nome: ph, fonte: 'Personalizado', descricao: '', customizado: true };
    }
    const cat = buscarPoderHeroicoNoCatalogo(ph?.key || ph?.nome, catalogoPoderes);
    return {
      key: ph?.key || cat?.key || normalizarTexto(ph?.nome),
      nome: ph?.nome || cat?.nome || 'Poder Heróico',
      fonte: ph?.fonte || cat?.fonte || 'Livro Básico',
      descricao: ph?.descricao || cat?.descricao || '',
      efeito_mecanico: ph?.efeito_mecanico || cat?.efeito_mecanico || {},
      classe_origem: ph?.classe_origem || null,
      customizado: Boolean(ph?.customizado)
    };
  });

  return {
    titulo_pecularidade: titulo,
    descricao_pecularidade: descricao,
    peculiaridade: {
      key: objPeculiaridade?.key || itemCatalogo?.key || null,
      nome: titulo,
      descricao: descricao || itemCatalogo?.descricao || '',
      fonte: objPeculiaridade?.fonte || itemCatalogo?.fonte || null
    },
    poderes_heroicos: poderesNormalizados
  };
}

/**
 * Prepara payload para sincronização e gravação no banco de dados.
 *
 * @param {Object} dadosFormulario
 * @returns {Object}
 */
export function prepararHeroicAndQuirksParaBanco(dadosFormulario = {}) {
  const normalizado = extrairHeroicAndQuirksDaFicha(dadosFormulario);

  return {
    titulo_pecularidade: normalizado.titulo_pecularidade,
    descricao_pecularidade: normalizado.descricao_pecularidade,
    peculiaridade: normalizado.titulo_pecularidade
      ? normalizado.peculiaridade
      : null,
    poderes_heroicos: normalizado.poderes_heroicos
  };
}
