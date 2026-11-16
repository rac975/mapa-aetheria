/**
 * Fabula Ultima - Regras do Suplemento Techno Fantasy Atlas
 *
 * Módulo de Lógica Pura de Domínio para as 3 Classes Oficiais:
 * - Esper (Psíquico / Foco Cognitivo / Dádivas Psíquicas / Relógio de Ondas Cerebrais)
 * - Mutante (Teriomorfose / Terioformas / Acromorfose / Biófago / Écdise)
 * - Piloto (Veículo Pessoal / Estruturas / Módulos / Configuração Flexível)
 *
 * CONFORME GEMINI.md:
 * - Funções e estruturas puras em JavaScript (sem efeitos colaterais).
 * - Sem dependência de UI (React) ou Banco de Dados (Supabase).
 * - Testabilidade total através de entradas e saídas puras.
 */

// =============================================================================
// 1. CONSTANTES E CATÁLOGOS CANÔNICOS DAS CLASSES TECHNO FANTASY
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

/**
 * Benefícios gratuitos e habilidades oficiais das 3 classes do Techno Fantasy Atlas.
 */
export const TECHNO_FANTASY_CLASSES = {
  esper: {
    nome_classe: 'Esper',
    descricao: 'Sensitivos psíquicos conectados à rede de almas e ao inconsciente coletivo, capazes de projetar energia mental pura e remodelar a realidade ao seu redor.',
    beneficios_iniciais: {
      texto: 'Aumente permanentemente seus Pontos de Magia (PM) máximos em 5.',
      hp_bonus: 0,
      mp_bonus: 5,
      ip_bonus: 0,
      proficiencias: []
    },
    habilidades_padrao: [
      {
        nome: 'Foco Cognitivo',
        max_nivel: 5,
        descricao: 'No início do seu turno em conflito, designe como Foco um aliado que possa ouvi-lo ou um inimigo com Confuso, Enfurecido ou Abalado. Receba +[SL] em testes para examiná-lo, +[SL] em Testes de Precisão/Magia contra ele, e ele recupera +[SL × 2] adicionais de PV/PM se você o curar.'
      },
      {
        nome: 'Hipercognição',
        max_nivel: 5,
        descricao: 'Reduz o custo em PM de magias e versos que alvejam seu Foco em [SL] PM, ou em [SL × 2] PM se o Foco for o único alvo (custo mínimo de 0 PM).'
      },
      {
        nome: 'Navegador',
        max_nivel: 1,
        descricao: 'Permite comunicação telepática com aliados conscientes a até 1 dia de viagem. Permite realizar Rituais da disciplina Ritualismo sem necessidade de ingredientes raros.'
      },
      {
        nome: 'Psicocinese',
        max_nivel: 1,
        descricao: 'Ao realizar um Teste de Precisão, você pode substituir um dado de atributo por Vontade (VON). Ataques corpo a corpo com armas arcanas ou espadas podem alvejar criaturas voadoras.'
      },
      {
        nome: 'Dádivas Psíquicas',
        max_nivel: 5,
        descricao: 'Aprenda 1 Dádiva Psíquica para cada nível desta habilidade. Você adquire um Relógio de Ondas Cerebrais de 4 seções. Usar uma dádiva custa 5 × seções preenchidas de PM (mín. 5 PM) e avança o relógio em 1 seção.'
      }
    ]
  },

  mutante: {
    nome_classe: 'Mutante',
    descricao: 'Seres geneticamente modificados ou aberrantes que reconfiguram sua própria fisiologia em combate através de mutações extremas conhecidas como terioformas.',
    beneficios_iniciais: {
      texto: 'Aumente permanentemente seus Pontos de Vida (PV) máximos em 5.',
      hp_bonus: 5,
      mp_bonus: 0,
      ip_bonus: 0,
      proficiencias: []
    },
    habilidades_padrao: [
      {
        nome: 'Teriomorfose',
        max_nivel: 6,
        descricao: 'Aprenda 1 Terioforma para cada nível nesta habilidade. Em conflito, gaste 1 ação e 1/3 do seu PV atual para manifestar até 2 Terioformas simultâneas pela cena inteira.'
      },
      {
        nome: 'Acromorfose',
        max_nivel: 3,
        descricao: 'No início do seu turno, escolha uma categoria de armas: seus ataques desarmados contam como pertencentes a essa categoria. Eles recebem +[SL] em Precisão e +[6 + (SL × 2)] no Dano Físico.'
      },
      {
        nome: 'Biófago',
        max_nivel: 5,
        descricao: 'Enquanto estiver em Crise (PV atual ≤ metade do PV Máximo), ao causar dano a um ou mais inimigos, você recupera [SL × 2] Pontos de Vida imediatamente.'
      },
      {
        nome: 'Écdise',
        max_nivel: 4,
        descricao: 'Reação adaptativa: ao sofrer dano, gaste PV para descartar sua carapaça externa e receber Resistência temporária àquele tipo de dano até o final do próximo turno.'
      },
      {
        nome: 'Genoclepsia',
        max_nivel: 3,
        descricao: 'Permite absorver e sintetizar temporariamente terioformas de monstros e espécimes encontrados ou consumidos em batalha.'
      }
    ]
  },

  piloto: {
    nome_classe: 'Piloto',
    descricao: 'Especialistas em combate mecanizado e condução de alta tecnologia, mestres em pilotar e sincronizar com andadores mecha, exoesqueletos cibernéticos e corcéis mecânicos armados.',
    beneficios_iniciais: {
      texto: 'Aumente permanentemente seus Pontos de Vida (PV) máximos em 5. Você ganha proficiência com armas marciais corpo a corpo e armas marciais à distância.',
      hp_bonus: 5,
      mp_bonus: 0,
      ip_bonus: 0,
      proficiencias: ['armas_marciais_corpo_a_corpo', 'armas_marciais_distancia']
    },
    habilidades_padrao: [
      {
        nome: 'Compressão Tecnológica',
        max_nivel: 1,
        descricao: 'Seu veículo pessoal pode ser comprimido em um dispositivo portátil quando estiver desocupado. Ao realizar uma ação de Inventário e gastar 2 Pontos de Inventário (PI), você invoca ou recolhe o veículo instantaneamente.'
      },
      {
        nome: 'Configuração Flexível',
        max_nivel: 4,
        descricao: 'Ao realizar a ação Guarda ou Equipamento enquanto pilota seu veículo pessoal durante um conflito, você pode desativar até [NP] módulos ativos e simultaneamente ativar até [NP] módulos inativos da sua reserva.'
      },
      {
        nome: 'Coração no Motor',
        max_nivel: 3,
        descricao: 'No início do seu turno durante um conflito, se estiver pilotando seu veículo pessoal, você pode gastar 10 PM para escolher uma opção: o próximo ataque que você realizar neste turno causa +[NP × 2] de dano; o próximo dano que você sofrer antes do início do seu próximo turno é reduzido em [NP × 2]; ou você cura imediatamente as condições Lento e/ou Fraco.'
      },
      {
        nome: 'Pulso Firme',
        max_nivel: 1,
        descricao: 'Ao realizar um Teste de Precisão utilizando um módulo de arma acoplado ao seu veículo pessoal, você pode substituir um dos dados de atributo por Vigor (VIG).'
      },
      {
        nome: 'Veículo Pessoal',
        max_nivel: 5,
        descricao: 'Você adquire um Veículo Pessoal operacional e escolhe sua Estrutura (Exoesqueleto, Mecha ou Corcel). No NP 1, você escolhe 3 módulos de veículo para instalar. Cada nível adicional nesta habilidade concede +2 módulos adicionais à sua escolha (totalizando 3 + (NP - 1) × 2 módulos no total). Você pode embarcar e pilotar seu veículo em viagens e combates.'
      }
    ]
  }
};

/**
 * Catálogo Oficial de Dádivas Psíquicas (Psychic Gifts) do Esper
 */
export const PSYCHIC_GIFTS_CATALOG = [
  {
    key: 'atmocinese',
    nome: 'Atmocinese (Atmokinesis)',
    gatilho: 'Ao causar dano',
    tipos_dano: ['ar', 'raio'],
    descricao: 'Altera o tipo do dano para Ar ou Raio. Causa dano adicional igual a 2 + seções preenchidas do Relógio de Ondas Cerebrais.'
  },
  {
    key: 'gravitocinese',
    nome: 'Gravitocinese (Gravitokinesis)',
    gatilho: 'Ao causar dano',
    tipos_dano: ['terra', 'fisico'],
    descricao: 'Altera o tipo do dano para Terra ou Físico. Causa dano adicional de 2 + seções preenchidas. Força criaturas voadoras alvejadas a pousarem imediatamente.'
  },
  {
    key: 'fotocinese',
    nome: 'Fotocinese (Photokinesis)',
    gatilho: 'Ao causar dano',
    tipos_dano: ['luz', 'trevas'],
    descricao: 'Altera o tipo do dano para Luz ou Trevas. Causa dano adicional igual a 2 + seções preenchidas do Relógio de Ondas Cerebrais.'
  },
  {
    key: 'termocinese',
    nome: 'Termocinese (Thermokinesis)',
    gatilho: 'Ao causar dano',
    tipos_dano: ['fogo', 'gelo'],
    descricao: 'Altera o tipo do dano para Fogo ou Gelo. Causa dano adicional igual a 2 + seções preenchidas do Relógio de Ondas Cerebrais.'
  },
  {
    key: 'escudo_psiquico',
    nome: 'Escudo Psíquico (Psychic Shield)',
    gatilho: 'Ao ser alvejado por ataque ou magia ofensiva',
    tipos_dano: [],
    descricao: 'Projeta um escudo cinético de força mental que reduz o dano total recebido em 5 + (seções preenchidas × 2).'
  },
  {
    key: 'retaliacao_psiquica',
    nome: 'Retaliação Psíquica (Psychic Backlash)',
    gatilho: 'Ao sofrer dano de um inimigo',
    tipos_dano: ['mental'],
    descricao: 'Projeta ondas de choque de retorno causando dano em PM ou perda mental ao atacante igual a 5 + seções preenchidas.'
  }
];

/**
 * Catálogo Oficial de Terioformas (Therioforms) do Mutante
 */
export const THERIOFORMS_CATALOG = [
  {
    key: 'amphibia',
    nome: 'Anfíbia (Amphibia)',
    descricao: 'Adaptação anfíbia e hidrodinâmica. Você respira debaixo d\'água, não sofre penalidades em terrenos aquáticos e ganha Resistência a dano de Gelo.'
  },
  {
    key: 'arpaktida',
    nome: 'Arpactida (Arpaktida)',
    descricao: 'Garras curvas preênseis e presas afiadas. Bônus de +2 em testes para agarrar ou derrubar inimigos, e seus ataques corpo a corpo ignoram resistência física leve.'
  },
  {
    key: 'dynamotheria',
    nome: 'Dinamotéria (Dynamotheria)',
    descricao: 'Musculatura hipertrofiada e densidade muscular extrema. Você recebe +4 em todas as rolagens de dano físico e bônus de +2 em testes de Vigor puro.'
  },
  {
    key: 'placophora',
    nome: 'Placófora (Placophora)',
    descricao: 'Placas dérmicas e carapaça quitinosa espessa. Sua Defesa natural aumenta em +2 e você não pode sofrer acertos críticos de ataques físicos.'
  },
  {
    key: 'polypoda',
    nome: 'Polípoda (Polypoda)',
    descricao: 'Membros múltiplos ou tentáculos articulados. Você pode empunhar armas ou itens adicionais e seus ataques corpo a corpo ganham alcance ampliado.'
  },
  {
    key: 'pterotheria',
    nome: 'Pterotéria (Pterotheria)',
    descricao: 'Asas membranosas funcionais brotam de sua espinha dorsal. Você adquire a capacidade de voar e ganha imunidade a dano de quedas.'
  },
  {
    key: 'pyrophora',
    nome: 'Pirófora (Pyrophora)',
    descricao: 'Glândulas bioluminescentes incandescentes. Você ganha Resistência a dano de Fogo e emite calor que causa dano a quem entrar em contato corpo a corpo.'
  },
  {
    key: 'toxifera',
    nome: 'Toxífera (Toxifera)',
    descricao: 'Glândulas venenosas subcutâneas. Seus ataques desarmados ou naturais podem infligir a condição Envenenado (Poisoned) no alvo ao acertar.'
  }
];

/**
 * Estruturas / Chassis (Vehicle Frames) do Piloto - Techno Fantasy Atlas
 */
export const VEHICLE_FRAMES = {
  exoesqueleto: {
    key: 'exoesqueleto',
    nome: 'Exoesqueleto (Exoskeleton)',
    tamanho: 'Pequeno',
    descricao: 'Armadura exoesqueleto leve e ágil vestida diretamente sobre o piloto.',
    defesa_base: 10,
    mdef_base: 10,
    bonus_defesa: 0,
    bonus_mdef: 0,
    modificador_iniciativa: 0,
    capacidade_modulos_base: 3,
    max_armas_ativas: 2,
    multiplicador_viagem: 1,
    regra_especial: 'Tamanho Pequeno: mobilidade irrestrita em passagens estreitas e ambientes fechados. Suporta até 2 armas ativas simultâneas.'
  },
  mecha: {
    key: 'mecha',
    nome: 'Mecha de Combate (Mecha Frame)',
    tamanho: 'Grande',
    descricao: 'Chassi pesado bípede ou quadrúpede de metal blindado para combate de choque de alto calibre.',
    defesa_base: 11,
    mdef_base: 8,
    bonus_defesa: 1,
    bonus_mdef: 0,
    modificador_iniciativa: -2,
    capacidade_modulos_base: 4,
    max_armas_ativas: 2,
    multiplicador_viagem: 2,
    regra_especial: 'Tamanho Grande: dobra velocidade de viagem no mapa terrestre (+1 Defesa estrutural, -2 Iniciativa). Suporta até 2 armas ativas e maior capacidade modular.'
  },
  corcel: {
    key: 'corcel',
    nome: 'Corcel Mecânico (Steed Frame)',
    tamanho: 'Médio',
    descricao: 'Hoverbike veloz, moto blindada ou montaria cibernética de alta impulsão e travessia rápida.',
    defesa_base: 9,
    mdef_base: 10,
    bonus_defesa: 0,
    bonus_mdef: 0,
    modificador_iniciativa: 4,
    capacidade_modulos_base: 3,
    max_armas_ativas: 1,
    multiplicador_viagem: 2,
    regra_especial: 'Montaria Veloz: dobra velocidade de viagem no mapa terrestre e concede +4 em testes de Iniciativa. Suporta 1 módulo de arma ativo (ou arma + escudo).'
  }
};

/**
 * Catálogo Oficial de Módulos de Veículo do Piloto - Techno Fantasy Atlas
 * Categorias:
 * - 'armadura': Define a Defesa e Defesa Mágica do veículo (máximo 1 ativo)
 * - 'arma': Armamentos acoplados (utilizam DES+INT na maioria, com slots de 1 ou 2 mãos)
 * - 'escudo': Dispositivo defensivo empunhado em slot de mão/arma (+2 Defesa)
 * - 'suporte': Utilitários, mobilidade avançada e buffs (não permite duplicatas do mesmo módulo)
 */
export const VEHICLE_MODULES_CATALOG = [
  // --- 1. MÓDULOS DE ARMADURA / BLINDAGEM ---
  {
    id: 'blindagem_padrao',
    nome: 'Blindagem Padrão',
    tipo: 'armadura',
    slot_cost: 1,
    def_fixa: 11,
    mdef_fixa: 10,
    descricao: 'Placas padrão balanceadas. Estabelece a Defesa em 11 e a Defesa Mágica em 10.'
  },
  {
    id: 'blindagem_pesada',
    nome: 'Blindagem Pesada',
    tipo: 'armadura',
    slot_cost: 1,
    def_fixa: 12,
    mdef_fixa: 8,
    descricao: 'Placas maciças de aço temperado para absorção de choque físico. Estabelece a Defesa em 12 e a Defesa Mágica em 8.'
  },
  {
    id: 'blindagem_runica',
    nome: 'Blindagem Rúnica',
    tipo: 'armadura',
    slot_cost: 1,
    def_fixa: 10,
    mdef_fixa: 11,
    descricao: 'Placas com filigrana e condutores rúnicos. Estabelece a Defesa em 10 e a Defesa Mágica em 11.'
  },
  {
    id: 'blindagem_flexivel',
    nome: 'Blindagem Flexível',
    tipo: 'armadura',
    slot_cost: 1,
    def_formula: '【DES + 2】',
    mdef_formula: '【INT + 1】',
    descricao: 'Chassi com servomotores ágeis. Sua Defesa torna-se DES + 2 e sua Defesa Mágica torna-se INT + 1.'
  },

  // --- 2. MÓDULOS DE ARMA ---
  {
    id: 'arma_machado',
    aliases: ['modulo_machado'],
    nome: 'Módulo de Machado',
    tipo: 'arma',
    categoria: 'pesada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 12】',
    dano_bonus: 12,
    tipo_dano: 'fisico',
    maos: 1,
    slot_cost: 1,
    descricao: 'Lâmina pesada de choque acoplada aos atuadores mecânicos.'
  },
  {
    id: 'arma_espada',
    aliases: ['modulo_espada'],
    nome: 'Módulo de Espada',
    tipo: 'arma',
    categoria: 'espada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 1,
    precisao_formula: '【DES + INT】 +1',
    dano_formula: '【HR + 8】',
    dano_bonus: 8,
    tipo_dano: 'fisico',
    maos: 1,
    slot_cost: 1,
    descricao: 'Lâmina ágil de alta frequência para cortes rápidos e precisos.'
  },
  {
    id: 'arma_espadao',
    aliases: ['modulo_espadao', 'arma_montante'],
    nome: 'Módulo de Espadão',
    tipo: 'arma',
    categoria: 'espada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 1,
    precisao_formula: '【DES + INT】 +1',
    dano_formula: '【HR + 14】',
    dano_bonus: 14,
    tipo_dano: 'fisico',
    maos: 2,
    slot_cost: 1,
    restricoes: 'Arma de Duas Mãos. Não permite outros módulos de arma ativos.',
    descricao: 'Espada maciça de duas mãos de impacto devastador.'
  },
  {
    id: 'arma_garra',
    aliases: ['modulo_garra'],
    nome: 'Módulo de Garra',
    tipo: 'arma',
    categoria: 'briga',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 8】',
    dano_bonus: 8,
    tipo_dano: 'fisico',
    maos: 1,
    slot_cost: 1,
    propriedades: 'Pode ser usado para interagir com a cena e objetos como se fosse uma mão livre.',
    descricao: 'Manipuladores e garras articuladas para combate fechado e interação com objetos.'
  },
  {
    id: 'arma_mangual',
    aliases: ['modulo_mangual'],
    nome: 'Módulo de Mangual',
    tipo: 'arma',
    categoria: 'mangual',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 10】',
    dano_bonus: 10,
    tipo_dano: 'fisico',
    maos: 1,
    slot_cost: 1,
    descricao: 'Massa cinética com corrente articulada para golpes contundentes.'
  },
  {
    id: 'arma_tridente',
    aliases: ['modulo_tridente'],
    nome: 'Módulo de Tridente',
    tipo: 'arma',
    categoria: 'lanca',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 1,
    precisao_formula: '【DES + INT】 +1',
    dano_formula: '【HR + 14】',
    dano_bonus: 14,
    tipo_dano: 'fisico',
    maos: 2,
    slot_cost: 1,
    restricoes: 'Arma de Duas Mãos. Não permite outros módulos de arma ativos.',
    descricao: 'Haste perfurante longa com 3 pontas reforçadas de penetração máxima.'
  },
  {
    id: 'arma_foice',
    aliases: ['modulo_foice'],
    nome: 'Módulo de Foice',
    tipo: 'arma',
    categoria: 'pesada',
    alcance: 'corpo_a_corpo',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 16】',
    dano_bonus: 16,
    tipo_dano: 'fisico',
    maos: 2,
    slot_cost: 1,
    restricoes: 'Arma de Duas Mãos. Não permite outros módulos de arma ativos.',
    descricao: 'Lâmina semicircular devastadora de grande raio.'
  },
  {
    id: 'arma_lanca_chamas',
    aliases: ['modulo_lanca_chamas'],
    nome: 'Módulo de Lança-Chamas',
    tipo: 'arma',
    categoria: 'arma_de_fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 8】',
    dano_bonus: 8,
    tipo_dano: 'fogo',
    maos: 1,
    slot_cost: 1,
    propriedades: 'Arma de disparo à distância conforme errata oficial. Inflige dano elemental de Fogo.',
    descricao: 'Dispersor de combustível incandescente de alta pressão à distância.'
  },
  {
    id: 'arma_metralhadora',
    aliases: ['modulo_metralhadora'],
    nome: 'Módulo de Metralhadora',
    tipo: 'arma',
    categoria: 'arma_de_fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 10】',
    dano_bonus: 10,
    tipo_dano: 'fisico',
    maos: 1,
    slot_cost: 1,
    propriedades: 'Permite realizar 2 ataques distintos na mesma ação Ataque (dois alvos ou no mesmo alvo).',
    descricao: 'Canos rotativos rápidos de disparo automático contínuo em rajada.'
  },
  {
    id: 'arma_rifle',
    aliases: ['modulo_fuzil', 'modulo_rifle'],
    nome: 'Módulo de Fuzil',
    tipo: 'arma',
    categoria: 'arma_de_fogo',
    alcance: 'distancia',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 1,
    precisao_formula: '【DES + INT】 +1',
    dano_formula: '【HR + 10】',
    dano_bonus: 10,
    tipo_dano: 'fisico',
    maos: 1,
    slot_cost: 1,
    descricao: 'Cano estriado de precisão extrema com telemetria óptica integrada.'
  },
  {
    id: 'arma_arco',
    aliases: ['modulo_arco'],
    nome: 'Módulo de Arco',
    tipo: 'arma',
    categoria: 'arco',
    alcance: 'distancia',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 1,
    precisao_formula: '【DES + INT】 +1',
    dano_formula: '【HR + 12】',
    dano_bonus: 12,
    tipo_dano: 'fisico',
    maos: 2,
    slot_cost: 1,
    restricoes: 'Arma de Duas Mãos. Não permite outros módulos de arma ativos.',
    descricao: 'Lançador de projéteis com tensão cinética eletromagnética de longo alcance.'
  },
  {
    id: 'arma_canhao_pesado',
    aliases: ['modulo_canhao'],
    nome: 'Módulo de Canhão',
    tipo: 'arma',
    categoria: 'pesada',
    alcance: 'distancia',
    atributos_precisao: ['des', 'int'],
    precisao_bonus: 0,
    precisao_formula: '【DES + INT】',
    dano_formula: '【HR + 14】',
    dano_bonus: 14,
    tipo_dano: 'fisico',
    maos: 2,
    slot_cost: 1,
    restricoes: 'Arma de Duas Mãos. Não permite outros módulos de arma ativos.',
    descricao: 'Canhão de grande calibre para bombardeio balístico de longo alcance.'
  },

  // --- 3. MÓDULOS DE ESCUDO ---
  {
    id: 'modulo_escudo',
    aliases: ['escudo_veiculo'],
    nome: 'Módulo de Escudo',
    tipo: 'escudo',
    categoria: 'escudo',
    alcance: 'nenhum',
    bonus_defesa: 2,
    bonus_mdef: 2,
    maos: 1,
    slot_cost: 1,
    propriedades: 'Concede +2 de Defesa e +2 de Defesa Mágica ao piloto. Conta como um escudo para habilidades. Não pode ser instalado em Corcel.',
    descricao: 'Broquel retrátil blindado ou barreira física de intercepção (+2 Defesa, +2 Defesa Mágica).'
  },

  // --- 4. MÓDULOS DE SUPORTE ---
  {
    id: 'suporte_mira_avancada',
    aliases: ['modulo_mira_avancada', 'sistema_mira_avancada'],
    nome: 'Módulo de Mira Avançada',
    tipo: 'suporte',
    slot_cost: 1,
    bonus_precisao: 2,
    descricao: 'HUD computorizado que concede +2 em todos os Testes de Precisão (e Testes de Magia ofensiva) do veículo.'
  },
  {
    id: 'suporte_aereo',
    aliases: ['modulo_aereo'],
    nome: 'Módulo Aéreo',
    tipo: 'suporte',
    slot_cost: 2,
    descricao: 'Propulsão a jato antigravitacional (ocupa 2 slots). Permite voar e flutuar em combate. Triplica velocidade no mapa-múndi. Ataques corpo a corpo podem atingir alvos voadores e passageiros não podem ser alvejados por ataques corpo a corpo terrestres.'
  },
  {
    id: 'suporte_aquatico',
    aliases: ['modulo_aquatico'],
    nome: 'Módulo Aquático',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Casco hidrodinâmico e turbinas náuticas. Permite que o veículo navegue sobre a superfície da água e submerja para operar debaixo d\'água.'
  },
  {
    id: 'suporte_anti_elemento',
    aliases: ['modulo_anti_elemento'],
    nome: 'Módulo Anti-Elemento',
    tipo: 'suporte',
    slot_cost: 1,
    configuravel: true,
    opcoes_elemento: ['ar', 'raio', 'terra', 'fogo', 'gelo'],
    descricao: 'Blindagem isolante elemental. Concede Resistência a um tipo de dano escolhido (Ar, Raio, Terra, Fogo ou Gelo) a todos a bordo.'
  },
  {
    id: 'suporte_sensores',
    aliases: ['modulo_sensores'],
    nome: 'Módulo de Sensores',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Sensores de longo alcance. Concede bônus de +2 em Testes Abertos para procurar e examinar criaturas, itens e ambientes.'
  },
  {
    id: 'suporte_forca',
    aliases: ['modulo_forca'],
    nome: 'Módulo de Força',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Atuadores mecânicos potencializados (apenas Mecha ou Exoesqueleto). Concede bônus em Testes Opostos que envolvam força bruta física.'
  },
  {
    id: 'suporte_magi_estatico',
    aliases: ['modulo_magi_estatico'],
    nome: 'Módulo Magi-Estático',
    tipo: 'suporte',
    slot_cost: 2,
    descricao: 'Condutores piezo-mágicos (ocupa 2 slots). Ao resolver uma magia ou habilidade com custo em PM empunhando uma arma arcana, recupera 5 PM (ou 10 PM se o custo foi 30+ PM).'
  },
  {
    id: 'suporte_turbo',
    aliases: ['modulo_velocidade', 'propulsores_auxiliares'],
    nome: 'Módulo de Velocidade',
    tipo: 'suporte',
    slot_cost: 1,
    bonus_iniciativa: 2,
    descricao: 'Propulsores de arranque imediato. Concede +2 de Iniciativa e bônus em Testes Abertos de velocidade e manobras rápidas.'
  },
  {
    id: 'suporte_interface_rapida',
    aliases: ['interface_rapida'],
    nome: 'Interface Rápida',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Ao realizar a ação Objetivo durante um conflito para entrar no veículo, você pode imediatamente realizar uma ação adicional.'
  },
  {
    id: 'suporte_assento_passageiro',
    aliases: ['modulo_passageiro'],
    nome: 'Módulo de Passageiro',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Cabine pressurizada adicional. Permite transportar com segurança 1 passageiro a bordo do veículo.'
  },
  {
    id: 'suporte_blindagem_expandida',
    aliases: ['blindagem_expandida'],
    nome: 'Blindagem Expandida',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Os passageiros a bordo podem adotar os valores de Defesa e Defesa Mágica da blindagem ativa do veículo se forem superiores aos seus próprios.'
  },
  {
    id: 'suporte_ofensiva_secundaria',
    aliases: ['ofensiva_secundaria'],
    nome: 'Ofensiva Secundária',
    tipo: 'suporte',
    slot_cost: 1,
    descricao: 'Mecanismo de acoplamento rápido (apenas Mecha). Permite selecionar um módulo de arma desativado e realizar um ataque com ele durante o conflito.'
  }
];

/**
 * Localiza um módulo do catálogo por ID principal ou aliases.
 * @param {string} idOuAlias
 * @returns {Object|null}
 */
export function obterModuloPorId(idOuAlias) {
  if (!idOuAlias) return null;
  return (
    VEHICLE_MODULES_CATALOG.find(
      (m) => m.id === idOuAlias || (m.aliases && m.aliases.includes(idOuAlias))
    ) || null
  );
}

// =============================================================================
// 2. FUNÇÕES PURAS - REGRAS DO ESPER
// =============================================================================

/**
 * Calcula o custo em Pontos de Magia (PM) para ativar uma Dádiva Psíquica.
 * Em Fabula Ultima Techno Fantasy: 5 × seções preenchidas do Relógio de Ondas Cerebrais (mínimo de 5 PM).
 * @param {number} secoesPreenchidas Quantidade atual de seções preenchidas (0 a 4)
 * @returns {number} Custo em PM
 */
export function calcularCustoPsychicGift(secoesPreenchidas = 0) {
  const secoes = Math.max(0, Math.min(BRAINWAVE_CLOCK_MAX_SECTIONS, parseInt(secoesPreenchidas, 10) || 0));
  if (secoes === 0) return 5;
  return secoes * 5;
}

/**
 * Avança o Relógio de Ondas Cerebrais em 1 seção após o uso de uma Dádiva Psíquica.
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
 * Processa a aplicação de uma Dádiva Cinética do Esper sobre um ataque.
 * @param {Object} params
 * @param {string} params.giftKey Chave da dádiva (ex: 'atmocinese', 'termocinese', etc.)
 * @param {string} params.tipoEscolhido Tipo elemental selecionado dentre os permitidos pela dádiva
 * @param {number} params.secoesRelogio Seções preenchidas do relógio de ondas cerebrais
 * @param {number} [params.danoBase=0] Dano base da rolagem
 * @returns {{ sucesso: boolean, danoExtra: number, danoTotal: number, tipoDanoFinal: string, novoRelogio: number, custoMp: number, mensagem?: string }}
 */
export function processarAtivacaoPsychicGift({ giftKey, tipoEscolhido, secoesRelogio = 0, danoBase = 0 }) {
  const gift = PSYCHIC_GIFTS_CATALOG.find(g => g.key === giftKey);
  if (!gift) {
    return { sucesso: false, mensagem: `Dádiva Psíquica "${giftKey}" não encontrada.` };
  }

  const secoes = Math.max(0, Math.min(BRAINWAVE_CLOCK_MAX_SECTIONS, parseInt(secoesRelogio, 10) || 0));
  const custoMp = calcularCustoPsychicGift(secoes);
  const danoExtra = 2 + secoes;
  const novoRelogio = avancarBrainwaveClock(secoes);

  let tipoDanoFinal = tipoEscolhido;
  if (gift.tipos_dano.length > 0 && (!tipoEscolhido || !gift.tipos_dano.includes(tipoEscolhido.toLowerCase()))) {
    tipoDanoFinal = gift.tipos_dano[0];
  }

  return {
    sucesso: true,
    giftNome: gift.nome,
    custoMp,
    danoExtra,
    danoTotal: Math.max(0, Number(danoBase) || 0) + danoExtra,
    tipoDanoFinal: tipoDanoFinal || 'fisico',
    novoRelogio,
    mensagem: `${gift.nome} ativada! Gasto de ${custoMp} PM. +${danoExtra} de dano (${tipoDanoFinal}). Relógio avançou para ${novoRelogio}/${BRAINWAVE_CLOCK_MAX_SECTIONS}.`
  };
}

// =============================================================================
// 3. FUNÇÕES PURAS - REGRAS DO MUTANTE
// =============================================================================

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
 * @param {number} [maxPermitido=2] Limite de formas ativas simultâneas (padrão 2, ou 3 com Heroic Skill)
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
 * Processa a cura da habilidade Biófago (Biophage) do Mutante.
 * Regra: Ativa apenas quando em Crise (PV atual ≤ Metade do PV Máximo).
 * Ao causar dano, recupera [SL × 2] PV.
 * @param {number} nivelHabilidade Nível da habilidade Biófago (SL 1 a 5)
 * @param {boolean} emCrise Se o personagem está atualmente em Crise
 * @returns {number} Quantidade de PV recuperados
 */
export function processarBiophageCura(nivelHabilidade = 0, emCrise = false) {
  if (!emCrise) return 0;
  const sl = Math.max(0, Math.min(5, parseInt(nivelHabilidade, 10) || 0));
  return sl * 2;
}

// =============================================================================
// 4. FUNÇÕES PURAS - REGRAS DO PILOTO
// =============================================================================

/**
 * Calcula o limite de módulos que o veículo pessoal pode ter ativos simultaneamente.
 * Em Fabula Ultima: Chassi base fornece capacidade (3 para Exoesqueleto/Corcel, 4 para Mecha),
 * expandindo conforme o nível/habilidade do Piloto.
 * @param {string} frameKey Chave do frame ('exoesqueleto', 'mecha', 'corcel')
 * @param {number} [nivelPilotoOuSl=1] Nível do personagem na classe Piloto ou SL de Veículo Pessoal
 * @returns {number} Capacidade de módulos ativos simultâneos
 */
export function calcularCapacidadeModulosVeiculo(frameKey = 'exoesqueleto', nivelPilotoOuSl = 1) {
  const frame = VEHICLE_FRAMES[frameKey] || VEHICLE_FRAMES.exoesqueleto;
  const base = frame.capacidade_modulos_base || 3;
  const nv = Math.max(1, parseInt(nivelPilotoOuSl, 10) || 1);
  const bonusNivel = Math.max(0, nv - 1);
  return base + bonusNivel;
}

/**
 * Calcula o custo total de slots dos módulos ativos selecionados.
 * @param {Array<string>} modulosAtivosIds
 * @returns {number} Total de slots consumidos
 */
export function calcularSlotsUtilizados(modulosAtivosIds = []) {
  if (!Array.isArray(modulosAtivosIds)) return 0;
  return modulosAtivosIds.reduce((total, id) => {
    const mod = obterModuloPorId(id);
    return total + (mod?.slot_cost || 1);
  }, 0);
}

/**
 * Valida a configuração atual de módulos ativos do veículo conforme as regras oficiais do Techno Fantasy Atlas.
 * Regras validadas:
 * - Total de slots consumidos <= capacidade máxima
 * - Máximo de 1 Módulo de Armadura/Blindagem ativo
 * - Limite de armas ativas por estrutura (1 para Corcel, 2 para Exoesqueleto e Mecha)
 * - Módulos de arma de 2 mãos proíbem outros módulos de arma ativos
 * - Proibição de múltiplos módulos de suporte idênticos
 * @param {Object} params
 * @param {string} params.frameKey Chave da estrutura
 * @param {Array<string>} params.modulosAtivosIds IDs dos módulos a ativar
 * @param {number} [params.nivelPilotoOuSl=1]
 * @returns {{ valido: boolean, erros: string[], avisos: string[], slotsUsados: number, slotsMaximos: number }}
 */
export function validarConfiguracaoVeiculo({
  frameKey = 'exoesqueleto',
  modulosAtivosIds = [],
  nivelPilotoOuSl = 1
}) {
  const frame = VEHICLE_FRAMES[frameKey] || VEHICLE_FRAMES.exoesqueleto;
  const capacidadeMaxima = calcularCapacidadeModulosVeiculo(frameKey, nivelPilotoOuSl);
  const slotsUsados = calcularSlotsUtilizados(modulosAtivosIds);
  const erros = [];
  const avisos = [];

  // 1. Limite de slots totais
  if (slotsUsados > capacidadeMaxima) {
    erros.push(`Slots excedidos: ${slotsUsados} em uso de no máximo ${capacidadeMaxima} permitidos.`);
  }

  // 2. Módulos de Armadura (Máximo 1 ativo)
  const armaduras = modulosAtivosIds
    .map(id => obterModuloPorId(id))
    .filter(m => m?.tipo === 'armadura');

  if (armaduras.length > 1) {
    erros.push(`Apenas 1 Módulo de Armadura pode estar ativo por vez (selecionados: ${armaduras.map(a => a.nome).join(', ')}).`);
  }

  // 3. Módulos de Arma e Mãos
  const armas = modulosAtivosIds
    .map(id => obterModuloPorId(id))
    .filter(m => m?.tipo === 'arma');

  const maxArmas = frame.max_armas_ativas || 2;
  if (armas.length > maxArmas) {
    erros.push(`A estrutura ${frame.nome} suporta no máximo ${maxArmas} módulo(s) de arma ativo(s).`);
  }

  const armaDuasMaos = armas.find(a => a.maos === 2);
  if (armaDuasMaos && armas.length > 1) {
    erros.push(`"${armaDuasMaos.nome}" é uma arma de Duas Mãos e não permite outros módulos de arma ativos.`);
  }

  // 4. Módulos de Suporte duplicados
  const suportes = modulosAtivosIds
    .map(id => obterModuloPorId(id))
    .filter(m => m?.tipo === 'suporte');

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
 * @param {string} frameKey Chave da estrutura ('exoesqueleto', 'mecha', 'corcel')
 * @param {Array<string>} modulosAtivosIds Lista de IDs dos módulos ativos
 * @param {Object} [atributos={}] Atributos do personagem { des, int, vig, von }
 * @param {number} [nivelPilotoOuSl=1] Nível do piloto ou nível de habilidade
 * @param {Object} [customizacoes={}] Parâmetros adicionais (ex: elementoAntiElemento)
 * @returns {Object} Estatísticas consolidadas do veículo
 */
export function calcularEstatisticasVeiculo(
  frameKey = 'exoesqueleto',
  modulosAtivosIds = [],
  atributos = {},
  nivelPilotoOuSl = 1,
  customizacoes = {}
) {
  const frame = VEHICLE_FRAMES[frameKey] || VEHICLE_FRAMES.exoesqueleto;
  const modulos = (Array.isArray(modulosAtivosIds) ? modulosAtivosIds : [])
    .map(id => obterModuloPorId(id))
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

  const capacidadeMaxima = Number(calcularCapacidadeModulosVeiculo(frameKey, nivelPilotoOuSl)) || 3;
  const slotsUsados = Number(calcularSlotsUtilizados(modulosAtivosIds)) || 0;

  // Localiza armadura ativa
  const armaduraAtiva = modulos.find(m => m.tipo === 'armadura');

  let defBase = 0;
  let mdefBase = 0;

  if (armaduraAtiva) {
    if (armaduraAtiva.def_fixa !== undefined) {
      defBase = Number(armaduraAtiva.def_fixa) || 0;
    } else if (armaduraAtiva.id === 'blindagem_flexivel') {
      defBase = (Number(des) || 8) + 2;
    } else {
      defBase = Number(frame.defesa_base) || (Number(des) || 8);
    }

    if (armaduraAtiva.mdef_fixa !== undefined) {
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

  // Bônus estruturais e cumulativos
  let defTotal = (Number(defBase) || 0) + (Number(frame.bonus_defesa) || 0);
  let mdefTotal = (Number(mdefBase) || 0) + (Number(frame.bonus_mdef) || 0);
  let iniBonus = Number(frame.modificador_iniciativa) || 0;
  let precisaoBonus = 0;

  const armasInstaladas = [];
  const suportesAtivos = [];
  const resistencias = [];

  modulos.forEach(mod => {
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
        danoFormatado: mod.dano_formula || `【HR + ${Number(mod.dano_bonus) || 8}】`,
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
          origem: 'Módulo Anti-Elemento'
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
 * Permite desativar até [SL] módulos ativos e ativar até [SL] módulos reservas em pleno combate.
 * @param {Object} params
 * @param {Array<string>} params.modulosAtivosAtuais Lista de IDs atualmente ativos
 * @param {Array<string>} params.modulosParaDesativar IDs selecionados para desativar
 * @param {Array<string>} params.modulosParaAtivar IDs selecionados para ativar
 * @param {number} params.nivelHabilidade Nível da habilidade Configuração Flexível (SL 1 a 4)
 * @param {string} [params.frameKey='exoesqueleto']
 * @param {number} [params.nivelPilotoOuSl=1]
 * @returns {{ sucesso: boolean, novosModulosAtivos: Array<string>, mensagem?: string }}
 */
export function processarConfiguracaoFlexivel({
  modulosAtivosAtuais = [],
  modulosParaDesativar = [],
  modulosParaAtivar = [],
  nivelHabilidade = 1,
  frameKey = 'exoesqueleto',
  nivelPilotoOuSl = 1
}) {
  const sl = Math.max(1, Math.min(4, parseInt(nivelHabilidade, 10) || 1));

  if (modulosParaDesativar.length > sl || modulosParaAtivar.length > sl) {
    return {
      sucesso: false,
      novosModulosAtivos: modulosAtivosAtuais,
      mensagem: `Configuração Flexível nível ${sl} permite trocar no máximo ${sl} módulos por ação.`
    };
  }

  // Remove os módulos indicados
  let resultado = modulosAtivosAtuais.filter(id => !modulosParaDesativar.includes(id));

  // Adiciona os novos módulos
  modulosParaAtivar.forEach(id => {
    if (!resultado.includes(id)) {
      resultado.push(id);
    }
  });

  const validacao = validarConfiguracaoVeiculo({
    frameKey,
    modulosAtivosIds: resultado,
    nivelPilotoOuSl
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
 * Em Fabula Ultima Techno Fantasy Atlas (PT-BR): Gasto fixo de 10 PM.
 * Concede +[NP × 2] de dano no próximo ataque, -[NP × 2] no próximo dano sofrido,
 * ou cura imediatamente as condições Lento e/ou Fraco.
 * @param {number} nivelHabilidade Nível da habilidade (NP 1 a 3)
 * @param {'ataque' | 'defesa' | 'cura'} [modo='ataque']
 * @returns {{ custoMp: number, bonusDano: number, reducaoDano: number, curaStatus: string[], mensagem: string }}
 */
export function processarCoracaoNoMotor(nivelHabilidade = 1, modo = 'ataque') {
  const np = Math.max(1, Math.min(3, parseInt(nivelHabilidade, 10) || 1));
  const custoMp = 10; // Gasto fixo oficial de 10 PM
  const bonusDano = modo === 'ataque' ? np * 2 : 0;
  const reducaoDano = modo === 'defesa' ? np * 2 : 0;
  const curaStatus = modo === 'cura' ? ['Lento', 'Fraco'] : [];

  let mensagem = '';
  if (modo === 'ataque') {
    mensagem = `Coração no Motor ativado (10 PM): +${bonusDano} de dano no seu próximo ataque!`;
  } else if (modo === 'defesa') {
    mensagem = `Coração no Motor ativado (10 PM): próximo dano sofrido reduzido em ${reducaoDano}!`;
  } else if (modo === 'cura') {
    mensagem = `Coração no Motor ativado (10 PM): condições Lento e Fraco curadas com sucesso!`;
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
 * Regra oficial: 3 módulos no NP 1, e +2 módulos por NP adicional (3 + (NP - 1) * 2).
 * @param {number} [nivelVeiculoPessoal=1] Nível da habilidade Veículo Pessoal (1 a 5)
 * @returns {number} Quantidade total de módulos adquiridos
 */
export function calcularTotalModulosHangar(nivelVeiculoPessoal = 1) {
  const np = Math.max(1, Math.min(5, parseInt(nivelVeiculoPessoal, 10) || 1));
  return 3 + (np - 1) * 2;
}

/**
 * Valida a invocação ou recolhimento do veículo via Compressão Tecnológica.
 * Regra oficial: Veículos com estrutura Exoesqueleto custam 0 PI para expandir/comprimir.
 * Mecha e Corcel custam 2 PI.
 * @param {number} ipAtual Pontos de Inventário atuais do personagem
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
 * Função pura conforme GEMINI.md.
 * Suporta a substituição de um dado de atributo por VIG pela habilidade Pulso Firme.
 *
 * @param {Object} params
 * @param {Object|string} params.moduloArma Objeto do módulo ou ID do módulo
 * @param {Object} params.atributos { des, ast, vig, von } ou { destreza, astucia, vigor, vontade }
 * @param {boolean} [params.usarPulsoFirme=false] Se a habilidade Pulso Firme substitui um dado por Vigor
 * @param {number} [params.bonusPrecisaoExtra=0] Bônus de suporte (ex: Módulo de Mira Avançada)
 * @param {number} [params.bonusDanoExtra=0] Bônus adicional de dano (ex: Coração no Motor)
 * @param {Object} [params.dadosPredefinidos=null] { d1: number, d2: number } para testes determinísticos
 * @returns {Object} Resultado detalhado da rolagem
 */
export function rolarAtaqueModuloVeiculo({
  moduloArma,
  atributos = {},
  usarPulsoFirme = false,
  bonusPrecisaoExtra = 0,
  bonusDanoExtra = 0,
  dadosPredefinidos = null
}) {
  const mod = typeof moduloArma === 'string' ? obterModuloPorId(moduloArma) : moduloArma;
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
    // Pulso Firme: substitui o menor atributo por Vigor para maximizar o teste
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
// 5. AUXILIARES DE RECONHECIMENTO E INTEGRAÇÃO DE CLASSES TECHNO
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

/**
 * Retorna os dados oficiais canônicos de uma classe do Techno Fantasy Atlas.
 * @param {string} nomeClasse
 * @returns {Object|null}
 */
export function obterDadosClasseTechno(nomeClasse = '') {
  if (!nomeClasse || typeof nomeClasse !== 'string') return null;
  const norm = nomeClasse
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (norm.includes('esper')) return TECHNO_FANTASY_CLASSES.esper;
  if (norm.includes('mutant')) return TECHNO_FANTASY_CLASSES.mutante;
  if (norm.includes('pilot')) return TECHNO_FANTASY_CLASSES.piloto;
  return null;
}
