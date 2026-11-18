/**
 * Fabula Ultima - Regras do Suplemento Techno Fantasy Atlas (Atlas Tecno-Fantasia)
 *
 * Módulo de Lógica Pura de Domínio para as 3 Classes Oficiais:
 * - Esper (Psíquico / Foco Cognitivo / Dons Psíquicos / Relógio de Ondas Cerebrais)
 * - Mutante (Teriomorfose / Terioformas / Acromorfose / Biofagia / Écdise / Genoclepse)
 * - Piloto (Veículo Pessoal / Estruturas / Módulos / Configuração Flexível)
 *
 * CONFORME GEMINI.md:
 * - Camada de Domínio Puro (src/domain/fabula/): Funções puras em JavaScript (sem efeitos colaterais).
 * - Isolamento total: ZERO importações de React ou Supabase.
 * - Desacoplamento de dados: Os catálogos oficiais (catalogo_dons_psiquicos, catalogo_terioformas,
 *   catalogo_veiculos_estruturas, catalogo_veiculos_modulos) são persistidos e consultados diretamente
 *   do Supabase através de fichaService.js.
 */

// =============================================================================
// 1. CONSTANTES DE REGRAS E LIMITES DO SISTEMA (TECHNO FANTASY)
// =============================================================================

export const TECHNO_FANTASY_CLASS_NAMES = {
  ESPER: 'Esper',
  MUTANT: 'Mutante',
  PILOT: 'Piloto'
};

export const BRAINWAVE_CLOCK_MAX_SECTIONS = 4;
export const THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT = 2;
export const COMPRESSION_TECH_IP_COST = 2;
export const EXTEND_THERIOFORMS_MP_COST = 10;
export const ECDYSIS_HP_COST = 10;

/**
 * Catálogos vazios para retrocompatibilidade com eventuais referências legadas.
 * O carregamento oficial é realizado via fichaService (com cache em memória) a partir do Supabase.
 */
export const PSYCHIC_GIFTS_CATALOG = [];
export const THERIOFORMS_CATALOG = [];
export const VEHICLE_FRAMES = {};

/**
 * Catálogo canônico de módulos de veículo (usado como fallback rico antes/caso offline do Supabase).
 */
export const VEHICLE_MODULES_CATALOG = [
  // --- MÓDULOS DE FÁBRICA / CHASSIS (CUSTO 0) ---
  {
    id: 'blindagem_padrao',
    key: 'blindagem_padrao',
    nome: 'Blindagem Padrão',
    tipo: 'armadura',
    categoria: 'Armadura',
    slot_cost: 1,
    bonus_defesa: 1,
    bonus_mdef: 1,
    bonus_iniciativa: 0,
    custo: 0,
    de_fabrica: true,
    descricao: 'Placas protetoras reforçadas instaladas na estrutura do veículo. Concede +1 na Defesa e +1 na Defesa Mágica.',
    restricoes: 'Apenas 1 módulo de armadura ativo por vez.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'blindagem_flexivel',
    key: 'blindagem_flexivel',
    nome: 'Blindagem Flexível',
    tipo: 'armadura',
    categoria: 'Armadura',
    slot_cost: 1,
    bonus_defesa: 0,
    bonus_mdef: 0,
    bonus_iniciativa: 0,
    custo: 0,
    de_fabrica: true,
    descricao: 'Estrutura leve e maleável: trata a Defesa como dado de DES + 2 e a Defesa Mágica como dado de AST + 1.',
    restricoes: 'Apenas 1 módulo de armadura ativo por vez.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'modulo_escudo_padrao',
    key: 'modulo_escudo_padrao',
    nome: 'Módulo de Escudo',
    tipo: 'escudo',
    categoria: 'Escudo',
    slot_cost: 1,
    bonus_defesa: 2,
    bonus_mdef: 0,
    bonus_iniciativa: 0,
    custo: 0,
    de_fabrica: true,
    descricao: 'Escudo integrado retrátil acoplado ao chassi do veículo pessoal. Concede +2 na Defesa.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'suporte_mira_avancada',
    key: 'suporte_mira_avancada',
    nome: 'Mira Avançada',
    tipo: 'suporte',
    categoria: 'Suporte',
    slot_cost: 1,
    precisao_bonus: 1,
    custo: 0,
    de_fabrica: true,
    descricao: 'Sensores ópticos e telêmetros acoplados aumentam em +1 todos os testes de Precisão com armas veiculares.',
    restricoes: 'Não pode ter módulos de suporte idênticos ativos.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'suporte_turbo',
    key: 'suporte_turbo',
    nome: 'Turbo Propulsor',
    tipo: 'suporte',
    categoria: 'Suporte',
    slot_cost: 1,
    bonus_iniciativa: 4,
    custo: 0,
    de_fabrica: true,
    descricao: 'Propulsores auxiliares que concedem +4 no modificador de Iniciativa do veículo.',
    restricoes: 'Não pode ter módulos de suporte idênticos ativos.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'suporte_contragolpe',
    key: 'suporte_contragolpe',
    nome: 'Módulo de Contragolpe',
    tipo: 'suporte',
    categoria: 'Suporte',
    slot_cost: 1,
    custo: 0,
    de_fabrica: true,
    descricao: 'Sistemas defensivos que reagem a ataques à distância sofridos pelo veículo pessoal.',
    restricoes: 'Não pode ter módulos de suporte idênticos ativos.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'arma_veicular_lamina',
    key: 'arma_veicular_lamina',
    aliases: ['arma_espada'],
    nome: 'Lâmina Integrada',
    tipo: 'arma',
    categoria: 'Espada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 8】',
    dano_bonus: 8,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 0,
    de_fabrica: true,
    descricao: 'Lâmina retrátil de combate veicular forjada diretamente no chassi do veículo.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'arma_veicular_canhao',
    key: 'arma_veicular_canhao',
    aliases: ['arma_machado'],
    nome: 'Canhão Leve Integrado',
    tipo: 'arma',
    categoria: 'Arma de fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 8】',
    dano_bonus: 8,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 0,
    de_fabrica: true,
    descricao: 'Disparador balístico leve de longo alcance acoplado na torreta ou blindagem externa.',
    fonte: 'Atlas Tecno-Fantasia'
  },

  // --- MÓDULOS DE OFICINA / LOJA (CUSTO > 0 EM ZÊNITES) ---
  {
    id: 'blindagem_pesada',
    key: 'blindagem_pesada',
    nome: 'Blindagem Pesada',
    tipo: 'armadura',
    categoria: 'Armadura',
    slot_cost: 2,
    def_fixa: 12,
    mdef_fixa: 8,
    bonus_iniciativa: -2,
    custo: 300,
    de_fabrica: false,
    descricao: 'Blindagem reforçada maciça: fixa a Defesa em 12 e a Defesa Mágica em 8, com penalidade de -2 na Iniciativa.',
    restricoes: 'Apenas 1 módulo de armadura ativo por vez. Ocupa 2 slots.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'alicate_richter',
    key: 'alicate_richter',
    nome: 'Alicate Richter',
    tipo: 'arma',
    categoria: 'Luta',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 12】',
    dano_bonus: 12,
    tipo_dano: 'terra',
    slot_cost: 1,
    custo: 800,
    de_fabrica: false,
    descricao: 'Esta arma pode ser usada para interagir com a cena como se fosse uma mão livre normal.',
    propriedades: 'Luta ✦ Corpo a corpo ✦ Sem características',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'desmontador',
    key: 'desmontador',
    nome: 'Desmontador',
    tipo: 'arma',
    categoria: 'Pesada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 1,
    dano_formula: '【RA + 12】',
    dano_bonus: 12,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 900,
    de_fabrica: false,
    descricao: 'Causa 5 pontos de dano adicional a construtos.',
    propriedades: 'Pesada ✦ Corpo a corpo',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'bateria_fimbulvetr',
    key: 'bateria_fimbulvetr',
    nome: 'Bateria Fimbulvetr',
    tipo: 'arma',
    categoria: 'Arma de fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 10】',
    dano_bonus: 10,
    tipo_dano: 'gelo',
    slot_cost: 1,
    custo: 1000,
    de_fabrica: false,
    descricao: 'Dano causado por esta arma ignora Resistências.',
    propriedades: 'Arma de fogo ✦ À distância ✦ Ignora Resistências',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'canhao_de_pem',
    key: 'canhao_de_pem',
    nome: 'Canhão de PEM',
    tipo: 'arma',
    categoria: 'Arma de fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 14】',
    dano_bonus: 14,
    tipo_dano: 'raio',
    slot_cost: 1,
    custo: 1100,
    de_fabrica: false,
    descricao: 'Todo construto atingido por um ataque desta arma fica atordoado.',
    restricoes: 'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'pique_de_vanguarda',
    key: 'pique_de_vanguarda',
    nome: 'Pique de Vanguarda',
    tipo: 'arma',
    categoria: 'Lança',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 1,
    dano_formula: '【RA + 14】',
    dano_bonus: 14,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 1100,
    de_fabrica: false,
    descricao: 'Esta arma causa 5 pontos de dano adicional durante a primeira rodada de cada conflito.',
    restricoes: 'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'crescens',
    key: 'crescens',
    nome: 'Crescens',
    tipo: 'arma',
    categoria: 'Espada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 1,
    dano_formula: '【RA + 12】',
    dano_bonus: 12,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 1200,
    de_fabrica: false,
    descricao: 'Esta arma causa dano adicional igual ao seu NP em Veículo Pessoal (página 160).',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'garragancho',
    key: 'garragancho',
    nome: 'Garragancho',
    tipo: 'arma',
    categoria: 'Malho',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 10】',
    dano_bonus: 10,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 1200,
    de_fabrica: false,
    descricao: 'Ataques com esta arma podem atingir criaturas voadoras.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'arbalesta_mk_ii',
    key: 'arbalesta_mk_ii',
    nome: 'Arbalesta Mk II',
    tipo: 'arma',
    categoria: 'Arco',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 1,
    dano_formula: '【RA + 16】',
    dano_bonus: 16,
    tipo_dano: 'fisico',
    slot_cost: 1,
    custo: 1300,
    de_fabrica: false,
    descricao: 'Esta arma causa 5 pontos de dano adicional a criaturas voadoras ou que estejam no ar.',
    restricoes: 'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'defletor_reativo',
    key: 'defletor_reativo',
    nome: 'Defletor Reativo',
    tipo: 'escudo',
    categoria: 'Escudo',
    slot_cost: 1,
    bonus_defesa: 2,
    bonus_mdef: 0,
    custo: 1500,
    de_fabrica: false,
    descricao: 'Enquanto estiver pilotando seu veículo pessoal e tiver um módulo de suporte de Contragolpe ativo (p. 168), você pode aplicar seus efeitos mesmo quando um dos personagens a bordo do seu veículo pessoal for atingido por um ataque corpo a corpo (em vez de apenas à distância). ✦ Este módulo tem todos os efeitos de um módulo de Escudo (p. 167).',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'mercurialis',
    key: 'mercurialis',
    nome: 'Mercurialis',
    tipo: 'arma',
    categoria: 'Arcano',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'von'],
    precisao_bonus: 0,
    dano_formula: '【RA + 12】',
    dano_bonus: 12,
    tipo_dano: 'fogo',
    slot_cost: 1,
    custo: 1600,
    de_fabrica: false,
    descricao: 'Quando um feitiço lançado por você causar dano a uma única criatura, ele causa 5 pontos de dano adicional ao alvo.',
    restricoes: 'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'morfescudo',
    key: 'morfescudo',
    nome: 'Morfescudo',
    tipo: 'escudo',
    categoria: 'Escudo',
    slot_cost: 1,
    bonus_defesa: 2,
    bonus_mdef: 0,
    custo: 1800,
    de_fabrica: false,
    descricao: 'No começo do seu turno durante um conflito, você pode desativar este módulo para ativar um módulo de arma diferente inativo à sua escolha. Se fizer isso, no final do seu turno, você terá que desativar o módulo escolhido e ativar este módulo novamente. Este módulo tem todos os efeitos de um módulo de Escudo (p. 167).',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'rifle_de_plasma',
    key: 'rifle_de_plasma',
    nome: 'Rifle de Plasma',
    tipo: 'arma',
    categoria: 'Arma de fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 1,
    dano_formula: '【RA + 14】',
    dano_bonus: 14,
    tipo_dano: 'luz',
    slot_cost: 1,
    custo: 1800,
    de_fabrica: false,
    descricao: 'Testes de Precisão com esta arma são considerados um sucesso crítico se os dois dados mostrarem o mesmo número (e não for uma falha crítica).',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'aerowitzer',
    key: 'aerowitzer',
    nome: 'Aerowitzer',
    tipo: 'arma',
    categoria: 'Arma de fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 0,
    dano_formula: '【RA + 18】',
    dano_bonus: 18,
    tipo_dano: 'ar',
    slot_cost: 1,
    bonus_defesa: 2,
    custo: 2000,
    de_fabrica: false,
    descricao: 'Enquanto estiver pilotando seu veículo pessoal, você recebe +2 na Defesa.',
    restricoes: 'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    fonte: 'Atlas Tecno-Fantasia'
  },
  {
    id: 'canhao_de_dobra',
    key: 'canhao_de_dobra',
    nome: 'Canhão de Dobra',
    tipo: 'arma',
    categoria: 'Arma de fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'ast'],
    precisao_bonus: 1,
    dano_formula: '【RA + 18】',
    dano_bonus: 18,
    tipo_dano: 'trevas',
    slot_cost: 1,
    custo: 2800,
    de_fabrica: false,
    descricao: 'Ataques com esta arma têm multi (2). Além disso, dano causado por esta arma ignora Resistência, Imunidades e Absorção.',
    restricoes: 'Um veículo pessoal com este módulo ativo não pode ter outro módulo de arma ativo.',
    fonte: 'Atlas Tecno-Fantasia'
  }
];

/**
 * Parâmetros matemáticos mínimos de estrutura de chassi (usados como fallback seguro antes do carregamento assíncrono).
 */
const ESTRUTURAS_PADRAO_FALLBACK = {
  exoesqueleto: {
    key: 'exoesqueleto',
    nome: 'Exoesqueleto (Exoskeleton)',
    tamanho: 'Pequeno',
    passageiros: 'Nenhum',
    defesa_base: 10,
    mdef_base: 10,
    bonus_defesa: 0,
    bonus_mdef: 0,
    modificador_iniciativa: 0,
    capacidade_modulos_base: 3,
    max_armas_ativas: 2,
    multiplicador_viagem: 1,
    descricao: 'Armaduras energizadas e membros mecânicos vestidos diretamente sobre o piloto.',
    regra_especial: 'Pode ter até 2 módulos de arma, 1 módulo de armadura e qualquer número de módulos de suporte ativos. Compressão Tecnológica custa 0 PI.'
  },
  mecha: {
    key: 'mecha',
    nome: 'Mecha de Combate (Mecha Frame)',
    tamanho: 'Grande',
    passageiros: 'Nenhum',
    defesa_base: 11,
    mdef_base: 8,
    bonus_defesa: 1,
    bonus_mdef: 0,
    modificador_iniciativa: -2,
    capacidade_modulos_base: 4,
    max_armas_ativas: 2,
    multiplicador_viagem: 2,
    descricao: 'Grandes robôs de combate bípedes ou quadrúpedes blindados pilotados por dentro.',
    regra_especial: 'Pode ter até 2 módulos de arma, 1 módulo de armadura e qualquer número de módulos de suporte ativos. Distância de viagem ×2.'
  },
  corcel: {
    key: 'corcel',
    nome: 'Montaria / Corcel Mecânico (Steed Frame)',
    tamanho: 'Médio',
    passageiros: 'Até um',
    defesa_base: 9,
    mdef_base: 10,
    bonus_defesa: 0,
    bonus_mdef: 0,
    modificador_iniciativa: 4,
    capacidade_modulos_base: 3,
    max_armas_ativas: 1,
    multiplicador_viagem: 2,
    descricao: 'Animais mecânicos de montaria, aeromotos, caças pequenos, skates voadores e similares.',
    regra_especial: 'Pode ter até 1 módulo de arma, 1 módulo de armadura e qualquer número de módulos de suporte ativos. Coração no Motor custa 0 PM.'
  }
};

/**
 * Localiza uma estrutura de veículo pelo key dentro do catálogo fornecido pelo Supabase (ou fallback seguro).
 * @param {string} [frameKey='exoesqueleto']
 * @param {Array<Object>|Object} [catalogoEstruturas=[]]
 * @returns {Object}
 */
export function obterEstruturaVeiculo(frameKey = 'exoesqueleto', catalogoEstruturas = []) {
  const chave = (frameKey || 'exoesqueleto').toLowerCase().trim();

  if (Array.isArray(catalogoEstruturas) && catalogoEstruturas.length > 0) {
    const encontrado = catalogoEstruturas.find(
      (f) => (f?.key || '').toLowerCase() === chave
    );
    if (encontrado) return encontrado;
  } else if (catalogoEstruturas && typeof catalogoEstruturas === 'object' && !Array.isArray(catalogoEstruturas)) {
    if (catalogoEstruturas[chave]) return catalogoEstruturas[chave];
  }

  return ESTRUTURAS_PADRAO_FALLBACK[chave] || ESTRUTURAS_PADRAO_FALLBACK.exoesqueleto;
}

/**
 * Localiza um módulo do catálogo por ID principal, key ou aliases.
 * @param {string|Object} idOuAlias
 * @param {Array<Object>} [catalogoModulos=[]]
 * @returns {Object|null}
 */
export function obterModuloPorId(idOuAlias, catalogoModulos = []) {
  if (!idOuAlias) return null;
  if (typeof idOuAlias === 'object') return idOuAlias;

  const lista = Array.isArray(catalogoModulos) && catalogoModulos.length > 0
    ? catalogoModulos
    : VEHICLE_MODULES_CATALOG;

  return (
    lista.find(
      (m) =>
        m.id === idOuAlias ||
        m.key === idOuAlias ||
        (Array.isArray(m.aliases) && m.aliases.includes(idOuAlias))
    ) || null
  );
}

/**
 * Identifica se um módulo de veículo é nativo/de fábrica (custo 0 Z).
 * @param {Object} modulo Objeto do módulo
 * @returns {boolean}
 */
export function isModuloDeFabrica(modulo) {
  if (!modulo) return false;
  return Number(modulo.custo) === 0 || Boolean(modulo.de_fabrica) || Boolean(modulo.isNativo);
}

/**
 * Retorna o preço de aquisição em zênites de um módulo veicular.
 * @param {Object} modulo Objeto do módulo
 * @returns {number} Custo em zênites (0 se de fábrica)
 */
export function obterPrecoModulo(modulo) {
  if (!modulo) return 0;
  return Number(modulo.custo) || 0;
}

// =============================================================================
// 2. FUNÇÕES PURAS - REGRAS DO ESPER
// =============================================================================

/**
 * Calcula o custo em Pontos de Magia (PM) para ativar um Dom Psíquico.
 * Em Fabula Ultima Techno Fantasy: 5 × seções preenchidas do Relógio Mental (mínimo de 5 PM).
 * @param {number} secoesPreenchidas Quantidade atual de seções preenchidas (0 a 4)
 * @returns {number} Custo em PM
 */
export function calcularCustoPsychicGift(secoesPreenchidas = 0) {
  const secoes = Math.max(0, Math.min(BRAINWAVE_CLOCK_MAX_SECTIONS, parseInt(secoesPreenchidas, 10) || 0));
  if (secoes === 0) return 5;
  return secoes * 5;
}

/**
 * Avança o Relógio de Ondas Cerebrais em 1 seção após o uso de um Dom Psíquico.
 * @param {number} secoesAtuais
 * @returns {number} Novo número de seções (máximo 4)
 */
export function avancarBrainwaveClock(secoesAtuais = 0) {
  const atuais = Math.max(0, parseInt(secoesAtuais, 10) || 0);
  return Math.min(BRAINWAVE_CLOCK_MAX_SECTIONS, atuais + 1);
}

/**
 * Reseta o Relógio de Ondas Cerebrais para 0 (início de cena/conflito).
 * @returns {number} 0
 */
export function resetarBrainwaveClock() {
  return 0;
}

/**
 * Calcula os bônus concedidos pela habilidade Foco Cognitivo do Esper.
 * @param {number} nivelHabilidade Nível da habilidade Foco Cognitivo (SL 1 a 5)
 * @returns {{ bonusExame: number, bonusPrecisaoMagia: number, curaExtra: number }}
 */
export function calcularBonusCognitiveFocus(nivelHabilidade = 0) {
  const sl = Math.max(0, Math.min(5, parseInt(nivelHabilidade, 10) || 0));
  return {
    bonusExame: sl,
    bonusPrecisaoMagia: sl,
    curaExtra: sl * 2
  };
}

/**
 * Calcula a redução de custo de PM pela habilidade Hipercognição ao alvejar o Foco Cognitivo.
 * @param {number} nivelHabilidade Nível da habilidade Hipercognição (SL 1 a 5)
 * @param {boolean} unicoAlvo Se o Foco Cognitivo é o único alvo da magia
 * @returns {number} Quantidade de PM reduzida
 */
export function calcularReducaoHypercognition(nivelHabilidade = 0, unicoAlvo = false) {
  const sl = Math.max(0, Math.min(5, parseInt(nivelHabilidade, 10) || 0));
  return unicoAlvo ? sl * 2 : sl;
}

/**
 * Calcula a quantidade máxima de Dons Psíquicos que o personagem pode aprender.
 * Regra Oficial: Cada nível na habilidade Dons Psíquicos concede 1 Dom à sua escolha (máximo 5).
 * @param {number} nivelHabilidade Nível da habilidade Dons Psíquicos (NP 1 a 5)
 * @returns {number} Quantidade máxima de dons aprendidos
 */
export function calcularLimiteDonsPsiquicosAprendidos(nivelHabilidade = 0) {
  return Math.max(0, Math.min(5, parseInt(nivelHabilidade, 10) || 0));
}

/**
 * Processa a aplicação ou ativação de um Dom Psíquico do Esper.
 * Suporta todos os 9 Dons Oficiais do Atlas Tecno-Fantasia:
 * - Cinéticos (+2+Relógio de dano e conversão elemental): Atmocinese, Fotocinese, Gravitocinese, Termocinese.
 * - Defesa: Escudo Psíquico (trata Defesa e Def. Mágica como VON + 2×Relógio).
 * - Cobertura: Presença Reconfortante (aliado recupera 10+5×Relógio PM e cura condição mental se for Foco).
 * - Reação Ofensiva: Retaliação Psíquica (inimigo perde 5+5×Relógio PM e sofre Abalado/Atordoado).
 * - Cura de Crise: Transferência de Vida (recupera 5+5×Relógio PV em você ou aliado em Crise que seja seu Foco).
 * - Investigação: Clarividência (pergunta sincera ao Mestre sobre PdM Foco ou Laço).
 *
 * @param {Object} params
 * @param {string} params.giftKey Chave do dom (ex: 'atmocinese', 'escudo_psiquico', etc.)
 * @param {Object} [params.giftObjeto=null] Objeto do dom carregado do Supabase
 * @param {Array<Object>} [params.catalogoDons=[]] Catálogo de dons do Supabase
 * @param {string} [params.tipoEscolhido] Tipo elemental selecionado dentre os permitidos pelo dom
 * @param {number} [params.secoesRelogio=0] Seções preenchidas do relógio de ondas cerebrais
 * @param {number} [params.danoBase=0] Dano base da rolagem (para dons cinéticos)
 * @param {string} [params.statusEscolhido='Abalado'] Condição escolhida
 * @param {number|string} [params.dadoVon=8] Tamanho do dado de Vontade do personagem
 * @returns {Object} Resultado detalhado da ativação
 */
export function processarAtivacaoPsychicGift({
  giftKey,
  giftObjeto = null,
  catalogoDons = [],
  tipoEscolhido,
  secoesRelogio = 0,
  danoBase = 0,
  statusEscolhido = 'Abalado',
  dadoVon = 8
}) {
  const lista = Array.isArray(catalogoDons) && catalogoDons.length > 0 ? catalogoDons : PSYCHIC_GIFTS_CATALOG;
  const gift = giftObjeto || lista.find((g) => g.key === giftKey) || (giftKey ? { key: giftKey, nome: giftKey, tipos_dano: [] } : null);

  if (!gift) {
    return { sucesso: false, mensagem: `Dom Psíquico "${giftKey}" não encontrado.` };
  }

  const secoes = Math.max(0, Math.min(BRAINWAVE_CLOCK_MAX_SECTIONS, parseInt(secoesRelogio, 10) || 0));
  const custoMp = calcularCustoPsychicGift(secoes);
  const novoRelogio = avancarBrainwaveClock(secoes);

  // 1. Escudo Psíquico
  if (giftKey === 'escudo_psiquico') {
    const vonFaces = typeof dadoVon === 'string' ? parseInt(dadoVon.replace('d', ''), 10) || 8 : Number(dadoVon) || 8;
    const defesaEspecial = vonFaces + (2 * secoes);
    return {
      sucesso: true,
      tipoAcao: 'defesa',
      giftNome: gift.nome,
      custoMp,
      novoRelogio,
      defesaEspecial,
      formula: `VON (d${vonFaces}) + (2 × ${secoes} seções) = ${defesaEspecial}`,
      mensagem: `${gift.nome} ativado! Custo de ${custoMp} PM. Defesa e Def. Mágica tratadas como ${defesaEspecial} para este teste. Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
    };
  }

  // 2. Presença Reconfortante
  if (giftKey === 'presenca_reconfortante') {
    const curaMpAliado = 10 + (secoes * 5);
    return {
      sucesso: true,
      tipoAcao: 'suporte',
      giftNome: gift.nome,
      custoMp,
      novoRelogio,
      curaMpAliado,
      mensagem: `${gift.nome} ativada! Custo de ${custoMp} PM. O aliado protegido recupera +${curaMpAliado} PM (e cura Abalado, Atordoado ou Enfurecido se for seu Foco)! Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
    };
  }

  // 3. Retaliação Psíquica
  if (giftKey === 'retaliacao_psiquica') {
    const perdaMpInimigo = 5 + (secoes * 5);
    const condicao = (statusEscolhido || 'Abalado').toLowerCase().includes('conf') || (statusEscolhido || '').toLowerCase().includes('atord')
      ? statusEscolhido
      : 'Abalado';
    return {
      sucesso: true,
      tipoAcao: 'retaliacao',
      giftNome: gift.nome,
      custoMp,
      novoRelogio,
      perdaMpInimigo,
      condicaoAplicada: condicao,
      mensagem: `${gift.nome} ativada! Custo de ${custoMp} PM. O inimigo perde ${perdaMpInimigo} PM e sofre a condição ${condicao}! Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
    };
  }

  // 4. Transferência Vital / Transferência de Vida
  if (giftKey === 'transferencia_vital') {
    const curaPv = 5 + (secoes * 5);
    return {
      sucesso: true,
      tipoAcao: 'cura',
      giftNome: gift.nome,
      custoMp,
      novoRelogio,
      curaPv,
      mensagem: `${gift.nome} ativada! Custo de ${custoMp} PM. Você ou o aliado em Crise recupera +${curaPv} PV! Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
    };
  }

  // 5. Clarividência
  if (giftKey === 'clarividencia') {
    return {
      sucesso: true,
      tipoAcao: 'utilidade',
      giftNome: gift.nome,
      custoMp,
      novoRelogio,
      mensagem: `${gift.nome} ativada! Custo de ${custoMp} PM. Faça uma pergunta sincera sobre o PdM (Foco ou Laço) e o Mestre responderá com a verdade. Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
    };
  }

  // 6. Dons Cinéticos (Atmocinese, Fotocinese, Gravitocinese, Termocinese)
  const danoExtra = 2 + secoes;
  const tiposPermitidos = Array.isArray(gift.tipos_dano) ? gift.tipos_dano : [];
  let tipoDanoFinal = tipoEscolhido;
  if (tiposPermitidos.length > 0 && (!tipoEscolhido || !tiposPermitidos.includes(tipoEscolhido.toLowerCase()))) {
    tipoDanoFinal = tiposPermitidos[0];
  }

  const efeitoEspecial = giftKey === 'gravitocinese'
    ? 'Criaturas voadoras atingidas são forçadas a pousar imediatamente!'
    : null;

  return {
    sucesso: true,
    tipoAcao: 'dano',
    giftNome: gift.nome,
    custoMp,
    danoExtra,
    danoTotal: Math.max(0, Number(danoBase) || 0) + danoExtra,
    tipoDanoFinal: tipoDanoFinal || 'fisico',
    efeitoEspecial,
    novoRelogio,
    mensagem: `${gift.nome} ativado! Custo de ${custoMp} PM. +${danoExtra} de dano (${(tipoDanoFinal || 'fisico').toUpperCase()}).${efeitoEspecial ? ` ${efeitoEspecial}` : ''} Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
  };
}

/**
 * Aplica a regra oficial da habilidade Psicocinese do Esper (Techno Fantasy Atlas):
 * Ao realizar um Teste de Precisão com uma arma, substitui um dos dados de atributo por Vontade (VON).
 * @param {Object} params
 * @returns {{ attr1Nome: string, attr2Nome: string, faces1: number, faces2: number, substituiu: boolean }}
 */
export function aplicarPsicocinesePrecisao({
  attr1Nome,
  attr2Nome,
  faces1,
  faces2,
  facesVon
}) {
  const norm1 = (attr1Nome || '').toLowerCase();
  const norm2 = (attr2Nome || '').toLowerCase();
  const vonVal = Math.max(6, Math.min(12, parseInt(facesVon, 10) || 8));

  if (norm1 === 'vontade' && norm2 !== 'vontade') {
    return {
      attr1Nome,
      attr2Nome: 'vontade',
      faces1,
      faces2: vonVal,
      substituiu: true
    };
  }

  if (norm2 === 'vontade' && norm1 !== 'vontade') {
    return {
      attr1Nome: 'vontade',
      attr2Nome,
      faces1: vonVal,
      faces2,
      substituiu: true
    };
  }

  if (faces1 <= faces2) {
    return {
      attr1Nome: 'vontade',
      attr2Nome,
      faces1: vonVal,
      faces2,
      substituiu: true
    };
  }

  return {
    attr1Nome,
    attr2Nome: 'vontade',
    faces1,
    faces2: vonVal,
    substituiu: true
  };
}

// =============================================================================
// 3. FUNÇÕES PURAS - REGRAS DO MUTANTE
// =============================================================================

/**
 * Calcula a quantidade máxima de Terioformas que o personagem pode aprender.
 * Regra Oficial: Cada nível na habilidade Teriomorfose concede 1 Terioforma do catálogo genético (máximo 6).
 * @param {number} nivelHabilidade Nível da habilidade Teriomorfose (NP 1 a 6)
 * @returns {number} Quantidade máxima de terioformas aprendidas
 */
export function calcularLimiteTerioformasAprendidas(nivelHabilidade = 0) {
  return Math.max(0, Math.min(6, parseInt(nivelHabilidade, 10) || 0));
}

/**
 * Calcula o custo em Pontos de Vida (PV) para ativar a Teriomorfose.
 * Regra: Gasta 1/3 do seu PV atual (arredondado para baixo).
 * @param {number} pvAtual PV atual do personagem
 * @returns {number} Custo em PV
 */
export function calcularCustoAtivacaoTeriomorfose(pvAtual = 0) {
  const pv = Math.max(0, parseInt(pvAtual, 10) || 0);
  return Math.floor(pv / 3);
}

/**
 * Valida se a quantidade de terioformas ativadas respeita o limite do sistema.
 * @param {Array<string>} terioformasSelecionadas Lista de chaves de terioformas
 * @param {number} [maxPermitido=2] Limite de formas ativas simultâneas (padrão 2, ou 3 com Poder Heróico)
 * @returns {{ valido: boolean, mensagem?: string }}
 */
export function validarManifestacaoTerioformas(terioformasSelecionadas = [], maxPermitido = THERIOMORPHOSIS_MAX_ACTIVE_DEFAULT) {
  if (!Array.isArray(terioformasSelecionadas)) {
    return { valido: false, mensagem: 'Lista de terioformas inválida.' };
  }
  if (terioformasSelecionadas.length > maxPermitido) {
    return {
      valido: false,
      mensagem: `Você pode manifestar no máximo ${maxPermitido} terioformas simultâneas.`
    };
  }
  return { valido: true };
}

/**
 * Calcula a Defesa concedida pela Terioforma Placófora (Placophora).
 * Regra Oficial PT-BR: Trata a Defesa como 13 + [metade do NP de Teriomorfose, arredondado para baixo].
 * @param {number} slTeriomorfose Nível na habilidade Teriomorfose (1 a 6)
 * @returns {number} Defesa fixa proporcionada pela carapaça
 */
export function calcularDefesaPlacophora(slTeriomorfose = 1) {
  const sl = Math.max(1, Math.min(6, parseInt(slTeriomorfose, 10) || 1));
  return 13 + Math.floor(sl / 2);
}

/**
 * Processa a ativação da habilidade Écdise do Mutante.
 * @param {Object} params
 * @param {number} params.pvAtual PV atual do Mutante
 * @param {string} params.tipoDanoSofrido Tipo de dano sofrido (ex: 'fogo', 'gelo', 'raio')
 * @returns {{ sucesso: boolean, novoPv: number, custoPv: number, tipoResistencia?: string, mensagem: string }}
 */
export function processarEcdise({ pvAtual = 0, tipoDanoSofrido = 'fogo' }) {
  const pv = Math.max(0, parseInt(pvAtual, 10) || 0);
  const tipo = (tipoDanoSofrido || 'fogo').toLowerCase().trim();

  if (tipo === 'fisico') {
    return {
      sucesso: false,
      novoPv: pv,
      custoPv: 0,
      mensagem: 'A Écdise só pode ser ativada contra tipos de dano não físicos (diferentes de Físico).'
    };
  }

  if (pv <= ECDYSIS_HP_COST) {
    return {
      sucesso: false,
      novoPv: pv,
      custoPv: 0,
      mensagem: `PV insuficiente para Écdise! É necessário ter mais de ${ECDYSIS_HP_COST} PV para não cair a 0 PV.`
    };
  }

  return {
    sucesso: true,
    novoPv: pv - ECDYSIS_HP_COST,
    custoPv: ECDYSIS_HP_COST,
    tipoResistencia: tipo,
    mensagem: `Écdise ativada com sucesso! Gasto de ${ECDYSIS_HP_COST} PV. Resistência concedida contra dano do tipo ${tipo.toUpperCase()} até o próximo uso!`
  };
}

/**
 * Calcula os bônus passivos da Acromorfose (Akromorphosis) nos ataques desarmados.
 * @param {number} nivelHabilidade Nível da habilidade Acromorfose (SL 1 a 3)
 * @returns {{ bonusPrecisao: number, bonusDanoFisico: number }}
 */
export function calcularBonusAkromorphosis(nivelHabilidade = 0) {
  const sl = Math.max(0, Math.min(3, parseInt(nivelHabilidade, 10) || 0));
  if (sl === 0) return { bonusPrecisao: 0, bonusDanoFisico: 0 };
  return {
    bonusPrecisao: sl,
    bonusDanoFisico: 6 + (sl * 2)
  };
}

/**
 * Processa a cura da habilidade Biofagia (Biophage) do Mutante conforme regras oficiais PT-BR.
 * @param {number} nivelHabilidade Nível da habilidade Biofagia (NP 1 a 4)
 * @param {boolean} emCrise Se o personagem está atualmente em Crise
 * @param {boolean} [temNeurophagoida=false] Se a Terioforma Neurofagóide está ativa
 * @returns {{ curaPv: number, curaMp: number, emCrise: boolean, mensagem: string }}
 */
export function processarBiofagiaCura(nivelHabilidade = 0, emCrise = false, temNeurophagoida = false) {
  if (!emCrise) {
    return {
      curaPv: 0,
      curaMp: 0,
      emCrise: false,
      mensagem: 'Biofagia inativa: requer que o personagem esteja em Crise (PV atual ≤ metade do PV Máximo).'
    };
  }

  const np = Math.max(0, Math.min(4, parseInt(nivelHabilidade, 10) || 0));
  const curaPv = np * 5;
  const curaMp = temNeurophagoida ? 4 + np : 0;

  return {
    curaPv,
    curaMp,
    emCrise: true,
    mensagem: `Biofagia ativada! Regenerados +${curaPv} PV${curaMp > 0 ? ` e +${curaMp} PM (Neurofagóide)` : ''} com sucesso.`
  };
}

/**
 * Mantém retrocompatibilidade numérica para processarBiophageCura.
 * @param {number} nivelHabilidade
 * @param {boolean} emCrise
 * @returns {number} PV recuperados
 */
export function processarBiophageCura(nivelHabilidade = 0, emCrise = false) {
  if (!emCrise) return 0;
  const np = Math.max(0, Math.min(4, parseInt(nivelHabilidade, 10) || 0));
  return np * 5;
}

// =============================================================================
// 4. FUNÇÕES PURAS - REGRAS DO PILOTO
// =============================================================================

/**
 * Calcula o limite de módulos que o veículo pessoal pode ter ativos simultaneamente.
 * @param {string} [frameKey='exoesqueleto'] Chave da estrutura ('exoesqueleto', 'mecha', 'corcel')
 * @param {number} [nivelPilotoOuSl=1] Nível do personagem na classe Piloto ou SL de Veículo Pessoal
 * @param {Array<Object>} [catalogoEstruturas=[]]
 * @returns {number} Capacidade de módulos ativos simultâneos
 */
export function calcularCapacidadeModulosVeiculo(
  frameKey = 'exoesqueleto',
  nivelPilotoOuSl = 1,
  catalogoEstruturas = []
) {
  const frame = obterEstruturaVeiculo(frameKey, catalogoEstruturas);
  const base = frame.capacidade_modulos_base || 3;
  const nv = Math.max(1, parseInt(nivelPilotoOuSl, 10) || 1);
  const bonusNivel = Math.max(0, nv - 1);
  return base + bonusNivel;
}

/**
 * Calcula o custo total de slots dos módulos ativos selecionados.
 * @param {Array<string>} modulosAtivosIds
 * @param {Array<Object>} [catalogoModulos=[]]
 * @returns {number} Total de slots consumidos
 */
export function calcularSlotsUtilizados(modulosAtivosIds = [], catalogoModulos = []) {
  if (!Array.isArray(modulosAtivosIds)) return 0;
  return modulosAtivosIds.reduce((total, id) => {
    const mod = obterModuloPorId(id, catalogoModulos);
    return total + (mod?.slot_cost || 1);
  }, 0);
}

/**
 * Valida a configuração atual de módulos ativos do veículo conforme as regras oficiais do Techno Fantasy Atlas.
 * @param {Object} params
 * @param {string} [params.frameKey='exoesqueleto'] Chave da estrutura
 * @param {Array<string>} [params.modulosAtivosIds=[]] IDs dos módulos a ativar
 * @param {number} [params.nivelPilotoOuSl=1]
 * @param {Array<Object>} [params.catalogoEstruturas=[]]
 * @param {Array<Object>} [params.catalogoModulos=[]]
 * @returns {{ valido: boolean, erros: string[], avisos: string[], slotsUsados: number, slotsMaximos: number }}
 */
export function validarConfiguracaoVeiculo({
  frameKey = 'exoesqueleto',
  modulosAtivosIds = [],
  nivelPilotoOuSl = 1,
  catalogoEstruturas = [],
  catalogoModulos = []
}) {
  const frame = obterEstruturaVeiculo(frameKey, catalogoEstruturas);
  const capacidadeMaxima = calcularCapacidadeModulosVeiculo(frameKey, nivelPilotoOuSl, catalogoEstruturas);
  const slotsUsados = calcularSlotsUtilizados(modulosAtivosIds, catalogoModulos);
  const erros = [];
  const avisos = [];

  if (slotsUsados > capacidadeMaxima) {
    erros.push(`Slots excedidos: ${slotsUsados} em uso de no máximo ${capacidadeMaxima} permitidos.`);
  }

  const armaduras = modulosAtivosIds
    .map((id) => obterModuloPorId(id, catalogoModulos))
    .filter((m) => m?.tipo === 'armadura');

  if (armaduras.length > 1) {
    erros.push(`Apenas 1 Módulo de Armadura pode estar ativo por vez (selecionados: ${armaduras.map((a) => a.nome).join(', ')}).`);
  }

  const armas = modulosAtivosIds
    .map((id) => obterModuloPorId(id, catalogoModulos))
    .filter((m) => m?.tipo === 'arma');

  const maxArmas = frame.max_armas_ativas || 2;
  if (armas.length > maxArmas) {
    erros.push(`A estrutura ${frame.nome} suporta no máximo ${maxArmas} módulo(s) de arma ativo(s).`);
  }

  const armaDuasMaos = armas.find((a) => a.maos === 2);
  if (armaDuasMaos && armas.length > 1) {
    erros.push(`"${armaDuasMaos.nome}" impede outros módulos de arma ativos no mesmo veículo.`);
  }

  const suportes = modulosAtivosIds
    .map((id) => obterModuloPorId(id, catalogoModulos))
    .filter((m) => m?.tipo === 'suporte');

  const idsVistos = new Set();
  for (const s of suportes) {
    if (s) {
      if (idsVistos.has(s.id)) {
        erros.push(`Não é permitido ativar múltiplos módulos de suporte idênticos ("${s.nome}").`);
      }
      idsVistos.add(s.id);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    slotsUsados,
    slotsMaximos: capacidadeMaxima
  };
}

/**
 * Calcula as estatísticas completas de combate e parâmetros do Veículo Pessoal.
 * @param {string} [frameKey='exoesqueleto'] Chave da estrutura ('exoesqueleto', 'mecha', 'corcel')
 * @param {Array<string>} [modulosAtivosIds=[]] Lista de IDs dos módulos ativos
 * @param {Object} [atributos={}] Atributos do personagem { des, int, vig, von }
 * @param {number} [nivelPilotoOuSl=1] Nível do piloto ou nível de habilidade
 * @param {Object} [customizacoes={}] Parâmetros adicionais (ex: elementoAntiElemento)
 * @param {Array<Object>} [catalogoEstruturas=[]]
 * @param {Array<Object>} [catalogoModulos=[]]
 * @returns {Object} Estatísticas consolidadas do veículo
 */
export function calcularEstatisticasVeiculo(
  frameKey = 'exoesqueleto',
  modulosAtivosIds = [],
  atributos = {},
  nivelPilotoOuSl = 1,
  customizacoes = {},
  catalogoEstruturas = [],
  catalogoModulos = []
) {
  const frame = obterEstruturaVeiculo(frameKey, catalogoEstruturas);
  const modulos = (Array.isArray(modulosAtivosIds) ? modulosAtivosIds : [])
    .map((id) => obterModuloPorId(id, catalogoModulos))
    .filter(Boolean);

  const extrairNumDado = (val, padrao = 8) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (!val) return padrao;
    const str = String(val).trim().toLowerCase().replace('d', '');
    const num = parseInt(str, 10);
    return isNaN(num) ? padrao : num;
  };

  const des = extrairNumDado(atributos.des ?? atributos.dex ?? atributos.destreza, 8);
  const int = extrairNumDado(atributos.int ?? atributos.ins ?? atributos.ast ?? atributos.astucia, 8);

  const capacidadeMaxima = Number(calcularCapacidadeModulosVeiculo(frameKey, nivelPilotoOuSl, catalogoEstruturas)) || 3;
  const slotsUsados = Number(calcularSlotsUtilizados(modulosAtivosIds, catalogoModulos)) || 0;

  const armaduraAtiva = modulos.find((m) => m.tipo === 'armadura');

  let defBase = 0;
  let mdefBase = 0;

  if (armaduraAtiva) {
    if (armaduraAtiva.def_fixa !== undefined && armaduraAtiva.def_fixa !== null) {
      defBase = Number(armaduraAtiva.def_fixa) || 0;
    } else if (armaduraAtiva.id === 'blindagem_flexivel') {
      defBase = (Number(des) || 8) + 2;
    } else {
      defBase = Number(frame.defesa_base) || (Number(des) || 8);
    }

    if (armaduraAtiva.mdef_fixa !== undefined && armaduraAtiva.mdef_fixa !== null) {
      mdefBase = Number(armaduraAtiva.mdef_fixa) || 0;
    } else if (armaduraAtiva.id === 'blindagem_flexivel') {
      mdefBase = (Number(int) || 8) + 1;
    } else {
      mdefBase = Number(frame.mdef_base) || (Number(int) || 8);
    }
  } else {
    defBase = Number(frame.defesa_base) || (Number(des) || 8);
    mdefBase = Number(frame.mdef_base) || (Number(int) || 8);
  }

  let defTotal = (Number(defBase) || 0) + (Number(frame.bonus_defesa) || 0);
  let mdefTotal = (Number(mdefBase) || 0) + (Number(frame.bonus_mdef) || 0);
  let iniBonus = Number(frame.modificador_iniciativa) || 0;
  let precisaoBonus = 0;

  const armasInstaladas = [];
  const suportesAtivos = [];
  const resistencias = [];

  modulos.forEach((mod) => {
    if (mod.bonus_defesa) defTotal += Number(mod.bonus_defesa) || 0;
    if (mod.bonus_mdef) mdefTotal += Number(mod.bonus_mdef) || 0;
    if (mod.bonus_iniciativa) iniBonus += Number(mod.bonus_iniciativa) || 0;
    if (mod.bonus_precisao) precisaoBonus += Number(mod.bonus_precisao) || 0;

    if (mod.tipo === 'arma') {
      let atr1 = (mod.atributos_precisao?.[0] || 'des').toUpperCase();
      let atr2 = (mod.atributos_precisao?.[1] || 'int').toUpperCase();
      let pulsoFirmeAtivo = false;

      if (customizacoes?.usarPulsoFirme) {
        pulsoFirmeAtivo = true;
        const valAtr1 = extrairNumDado(atributos[atr1.toLowerCase()], 8);
        const valAtr2 = extrairNumDado(atributos[atr2.toLowerCase()], 8);
        if (valAtr1 <= valAtr2) {
          atr1 = 'VIG';
        } else {
          atr2 = 'VIG';
        }
      }

      const bonusArma = (Number(mod.precisao_bonus) || 0) + (Number(mod.bonus_precisao) || 0);

      armasInstaladas.push({
        ...mod,
        formulaPrecisaoFormatada: `【${atr1} + ${atr2}】${bonusArma > 0 ? ` +${bonusArma}` : ''}`,
        pulsoFirmeAtivo,
        danoFormatado: mod.dano_formula || `【RA + ${Number(mod.dano_bonus) || 8}】`,
        tipoDanoFormatado: (mod.tipo_dano || 'fisico').toUpperCase(),
        alcanceFormatado: mod.alcance === 'distancia' ? 'À Distância' : 'Corpo a Corpo'
      });
    }

    if (mod.tipo === 'suporte') {
      suportesAtivos.push(mod);
      if (mod.id === 'suporte_anti_elemento') {
        const elementoEscolhido = customizacoes?.elementoAntiElemento || 'fogo';
        resistencias.push({
          tipo: String(elementoEscolhido).toLowerCase(),
          origem: 'Módulo Antielemento'
        });
      }
    }
  });

  return {
    defesaBase: Number(defBase) || 0,
    mdefBase: Number(mdefBase) || 0,
    defesaTotal: Number(defTotal) || 0,
    mdefTotal: Number(mdefTotal) || 0,
    iniciativaBonus: Number(iniBonus) || 0,
    precisaoBonus: Number(precisaoBonus) || 0,
    armasInstaladas,
    suportesAtivos,
    resistencias,
    armaduraAtiva,
    slotsUsados: Number(slotsUsados) || 0,
    slotsMaximos: Number(capacidadeMaxima) || 0,
    frameAtual: frame
  };
}

/**
 * Processa a manobra da habilidade Configuração Flexível do Piloto.
 * @param {Object} params
 * @returns {{ sucesso: boolean, novosModulosAtivos: Array<string>, mensagem?: string }}
 */
export function processarConfiguracaoFlexivel({
  modulosAtivosAtuais = [],
  modulosParaDesativar = [],
  modulosParaAtivar = [],
  nivelHabilidade = 1,
  frameKey = 'exoesqueleto',
  nivelPilotoOuSl = 1,
  catalogoEstruturas = [],
  catalogoModulos = []
}) {
  const sl = Math.max(1, Math.min(4, parseInt(nivelHabilidade, 10) || 1));

  if (modulosParaDesativar.length > sl || modulosParaAtivar.length > sl) {
    return {
      sucesso: false,
      novosModulosAtivos: modulosAtivosAtuais,
      mensagem: `Configuração Flexível nível ${sl} permite trocar no máximo ${sl} módulos por ação.`
    };
  }

  const resultado = modulosAtivosAtuais.filter((id) => !modulosParaDesativar.includes(id));

  modulosParaAtivar.forEach((id) => {
    if (!resultado.includes(id)) {
      resultado.push(id);
    }
  });

  const validacao = validarConfiguracaoVeiculo({
    frameKey,
    modulosAtivosIds: resultado,
    nivelPilotoOuSl,
    catalogoEstruturas,
    catalogoModulos
  });

  if (!validacao.valido) {
    return {
      sucesso: false,
      novosModulosAtivos: modulosAtivosAtuais,
      mensagem: validacao.erros.join(' ')
    };
  }

  return {
    sucesso: true,
    novosModulosAtivos: resultado,
    mensagem: `Veículo reconfigurado com sucesso! Slots em uso: ${validacao.slotsUsados}/${validacao.slotsMaximos}.`
  };
}

/**
 * Processa a ativação da habilidade Coração no Motor (Heart in the Engine).
 * @param {number} [nivelHabilidade=1] Nível da habilidade (NP 1 a 3)
 * @param {'ataque' | 'defesa' | 'cura'} [modo='ataque']
 * @returns {{ custoMp: number, bonusDano: number, reducaoDano: number, curaStatus: string[], mensagem: string }}
 */
export function processarCoracaoNoMotor(nivelHabilidade = 1, modo = 'ataque') {
  const np = Math.max(1, Math.min(3, parseInt(nivelHabilidade, 10) || 1));
  const custoMp = 10;
  const bonusDano = modo === 'ataque' ? np * 2 : 0;
  const reducaoDano = modo === 'defesa' ? np * 2 : 0;
  const curaStatus = modo === 'cura' ? ['Lento', 'Fraco'] : [];

  let mensagem = '';
  if (modo === 'ataque') {
    mensagem = `Coração no Motor ativado (10 PM): +${bonusDano} de dano no seu próximo ataque!`;
  } else if (modo === 'defesa') {
    mensagem = `Coração no Motor ativado (10 PM): próximo dano sofrido reduzido em ${reducaoDano}!`;
  } else if (modo === 'cura') {
    mensagem = 'Coração no Motor ativado (10 PM): condições Lento e Fraco curadas com sucesso!';
  }

  return {
    custoMp,
    bonusDano,
    reducaoDano,
    curaStatus,
    mensagem
  };
}

/**
 * Calcula a quantidade máxima de módulos que o piloto pode adquirir para o hangar/reserva
 * com base na habilidade Veículo Pessoal.
 * @param {number} [nivelVeiculoPessoal=1] Nível da habilidade Veículo Pessoal (1 a 5)
 * @returns {number} Quantidade total de módulos adquiridos
 */
export function calcularTotalModulosHangar(nivelVeiculoPessoal = 1) {
  const np = Math.max(1, Math.min(5, parseInt(nivelVeiculoPessoal, 10) || 1));
  return 3 + (np - 1) * 2;
}

/**
 * Valida a invocação ou recolhimento do veículo via Compressão Tecnológica.
 * @param {number} [ipAtual=0] Pontos de Inventário atuais do personagem
 * @param {string} [frameKey='exoesqueleto'] Chave da estrutura ('exoesqueleto', 'mecha', 'corcel')
 * @returns {{ sucesso: boolean, novoIp: number, custoIp: number, mensagem: string }}
 */
export function processarTecnologiaCompressao(ipAtual = 0, frameKey = 'exoesqueleto') {
  const ip = Math.max(0, parseInt(ipAtual, 10) || 0);
  const ehExoesqueleto = (frameKey || '').toLowerCase() === 'exoesqueleto';
  const custo = ehExoesqueleto ? 0 : COMPRESSION_TECH_IP_COST;

  if (ip < custo) {
    return {
      sucesso: false,
      novoIp: ip,
      custoIp: custo,
      mensagem: `Pontos de Inventário insuficientes! São necessários ${custo} PI para comprimir/invocar este veículo.`
    };
  }

  return {
    sucesso: true,
    novoIp: ip - custo,
    custoIp: custo,
    mensagem: custo === 0
      ? 'Exoesqueleto expandido/comprimido instantaneamente (0 PI).'
      : `Veículo comprimido/invocado com sucesso! Gasto de ${custo} PI.`
  };
}

export const processarCompressaoTecnologica = processarTecnologiaCompressao;

/**
 * Executa a rolagem de Precisão e Dano para um módulo de arma veicular.
 * @param {Object} params
 * @param {Object|string} params.moduloArma Objeto do módulo ou ID do módulo
 * @param {Object} [params.atributos={}]
 * @param {boolean} [params.usarPulsoFirme=false]
 * @param {number} [params.bonusPrecisaoExtra=0]
 * @param {number} [params.bonusDanoExtra=0]
 * @param {Object} [params.dadosPredefinidos=null]
 * @param {Array<Object>} [params.catalogoModulos=[]]
 * @returns {Object} Resultado detalhado da rolagem
 */
export function rolarAtaqueModuloVeiculo({
  moduloArma,
  atributos = {},
  usarPulsoFirme = false,
  bonusPrecisaoExtra = 0,
  bonusDanoExtra = 0,
  dadosPredefinidos = null,
  catalogoModulos = []
}) {
  const mod = typeof moduloArma === 'string'
    ? obterModuloPorId(moduloArma, catalogoModulos)
    : moduloArma;
  if (!mod) {
    return { sucesso: false, mensagem: 'Módulo de arma inválido.' };
  }

  const extrairFaces = (valorAttr) => {
    if (!valorAttr) return 8;
    const str = String(valorAttr).trim().toLowerCase();
    if (str.startsWith('d')) {
      const faces = parseInt(str.substring(1), 10);
      return isNaN(faces) ? 8 : faces;
    }
    const num = parseInt(str, 10);
    return isNaN(num) ? 8 : num;
  };

  const valDes = extrairFaces(atributos.des ?? atributos.destreza ?? atributos.dex ?? 8);
  const valInt = extrairFaces(atributos.int ?? atributos.ast ?? atributos.astucia ?? atributos.ins ?? 8);
  const valVig = extrairFaces(atributos.vig ?? atributos.vigor ?? atributos.mig ?? 8);
  const valVon = extrairFaces(atributos.von ?? atributos.vontade ?? atributos.wlp ?? 8);

  const mapaFaces = {
    des: valDes,
    destreza: valDes,
    int: valInt,
    ast: valInt,
    astucia: valInt,
    vig: valVig,
    vigor: valVig,
    von: valVon,
    vontade: valVon
  };

  let atr1Sigla = (mod.atributos_precisao?.[0] || 'des').toLowerCase();
  let atr2Sigla = (mod.atributos_precisao?.[1] || 'int').toLowerCase();

  let faces1 = mapaFaces[atr1Sigla] || 8;
  let faces2 = mapaFaces[atr2Sigla] || 8;
  let pulsoFirmeAtivo = false;

  if (usarPulsoFirme) {
    pulsoFirmeAtivo = true;
    if (faces1 <= faces2) {
      atr1Sigla = 'vig';
      faces1 = valVig;
    } else {
      atr2Sigla = 'vig';
      faces2 = valVig;
    }
  }

  const d1 = dadosPredefinidos?.d1 || (Math.floor(Math.random() * faces1) + 1);
  const d2 = dadosPredefinidos?.d2 || (Math.floor(Math.random() * faces2) + 1);

  const bonusPrecisaoArma = mod.precisao_bonus || 0;
  const bonusPrecisaoTotal = bonusPrecisaoArma + (Number(bonusPrecisaoExtra) || 0);
  const testeAtaque = d1 + d2 + bonusPrecisaoTotal;

  let statusCritico = null;
  if (d1 === 1 && d2 === 1) {
    statusCritico = 'Erro Crítico (Fumble)';
  } else if (d1 === d2 && d1 >= 6) {
    statusCritico = 'Sucesso Crítico!';
  }

  const dadoMaisAlto = Math.max(d1, d2);
  const bonusDanoBase = mod.dano_bonus || 0;
  const bonusDanoTotal = bonusDanoBase + (Number(bonusDanoExtra) || 0);
  const danoTotal = dadoMaisAlto + bonusDanoTotal;

  return {
    sucesso: true,
    nomeArma: mod.nome,
    atr1Nome: atr1Sigla.toUpperCase(),
    faces1,
    d1,
    atr2Nome: atr2Sigla.toUpperCase(),
    faces2,
    d2,
    pulsoFirmeAtivo,
    bonusPrecisaoArma,
    bonusPrecisaoExtra,
    bonusPrecisaoTotal,
    testeAtaque,
    statusCritico,
    dadoMaisAlto,
    bonusDanoBase,
    bonusDanoExtra,
    bonusDanoTotal,
    danoTotal,
    tipoDano: mod.tipo_dano || 'fisico',
    alcance: mod.alcance || 'corpo_a_corpo'
  };
}

// =============================================================================
// 5. AUXILIARES DE RECONHECIMENTO DE CLASSES TECHNO
// =============================================================================

/**
 * Identifica se um nome de classe corresponde a uma das 3 classes do Techno Fantasy Atlas.
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function isTechnoFantasyClass(nomeClasse = '') {
  if (!nomeClasse || typeof nomeClasse !== 'string') return false;
  const norm = nomeClasse
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return norm.includes('esper') || norm.includes('mutant') || norm.includes('pilot');
}
