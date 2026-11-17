/**
 * Fabula Ultima - Regras de Rituais Mágicos
 *
 * CONFORME GEMINI.md:
 * - Camada de Domínio Puro (src/domain/fabula/): Funções puras em JavaScript (sem efeitos colaterais).
 * - Isolamento total: ZERO importações de React ou Supabase.
 * - Testabilidade: Funções determinísticas baseadas exclusivamente em parâmetros recebidos.
 * - Fontes Oficiais: Livro Básico de Fabula Ultima, Atlas High Fantasy,
 *   Atlas Natural Fantasy e Atlas Techno Fantasy.
 */

// =============================================================================
// 1. TABELAS OFICIAIS DE REGRAS (FABULA ULTIMA PT-BR)
// =============================================================================

/**
 * Disciplinas Mágicas Oficiais para Rituais.
 */
export const DISCIPLINAS_RITUAL = {
  arcanismo: {
    id: 'arcanismo',
    nome: 'Arcanismo',
    atributos: ['vontade', 'vontade'],
    sigla: '[VON + VON]',
    descricao: 'Efeitos associados aos domínios de um ou mais Arcanos vinculados à alma do personagem.',
    fontesPadrao: ['Arcanista (Arcanismo Ritualista)']
  },
  cloromancia: {
    id: 'cloromancia',
    nome: 'Cloromancia',
    atributos: ['astucia', 'vontade'],
    sigla: '[AST + VON]',
    descricao: 'Rituais botânicos: criação, animação e controle de plantas, vegetação, magissementes, toxinas e esporos.',
    fontesPadrao: ['Floralista (Influência Verdejante / Cloromancia)']
  },
  elementalismo: {
    id: 'elementalismo',
    nome: 'Elementalismo',
    atributos: ['astucia', 'vontade'],
    sigla: '[AST + VON]',
    descricao: 'Manipulação e invocação dos quatro elementos primordiais: ar, terra, fogo e água.',
    fontesPadrao: ['Elementalista (Elementalismo Ritualista)', 'Peculiaridade Cerne Elemental', 'Manancial Interior']
  },
  entropismo: {
    id: 'entropismo',
    nome: 'Entropismo',
    atributos: ['astucia', 'vontade'],
    sigla: '[AST + VON]',
    descricao: 'Distorção do fluxo temporal, aceleração ou desaceleração do envelhecimento, alteração de gravidade e teletransporte.',
    fontesPadrao: ['Entropista (Entropismo Ritualista)']
  },
  espiritualismo: {
    id: 'espiritualismo',
    nome: 'Espiritualismo',
    atributos: ['astucia', 'vontade'],
    sigla: '[AST + VON]',
    descricao: 'Comunhão e percepção de almas e sentimentos, purificação de aflições, indução ao sono/vigília e tratamentos vitais.',
    fontesPadrao: ['Espiritualista (Espiritualismo Ritualista)', 'Peculiaridade Áugure do Planeta']
  },
  quimerismo: {
    id: 'quimerismo',
    nome: 'Quimerismo',
    atributos: ['astucia', 'vontade'],
    atributosAlternativos: ['vigor', 'vontade'],
    sigla: '[AST + VON] ou [VIG + VON]',
    descricao: 'Comunicação e pacificação de monstros e feras selvagens, visão e sentidos partilhados com animais.',
    fontesPadrao: ['Quimerista (Quimerismo Ritualista)']
  },
  ritualismo: {
    id: 'ritualismo',
    nome: 'Ritualismo',
    atributos: ['astucia', 'vontade'],
    sigla: '[AST + VON]',
    descricao: 'Percepção, manipulação e vinculação de energia mágica em itens, relíquias, mecanismos e acesso à Rede de Almas.',
    fontesPadrao: [
      'Benefícios Iniciais (Elementalista, Entropista, Espiritualista, Quimerista)',
      'Esper (Navegador)',
      'Floralista (Influência Verdejante)',
      'Simbolista (Miragem)',
      'Virtuoso (Canto da Sereia)'
    ]
  }
};

/**
 * Tabela Oficial de Potência de Rituais (Livro Básico p. 138-141).
 */
export const POTENCIAS_RITUAL = {
  menor: {
    key: 'menor',
    nome: 'Menor',
    custoPm: 20,
    nd: 7,
    relogioSecoes: 4,
    descricao: 'Efeitos simples, sutis ou de impacto imediato contido.',
    exemplos: 'Criar um lampejo luminoso, quebrar um vidro, bloquear ou trancar uma passagem, extinguir uma tocha.'
  },
  media: {
    key: 'media',
    nome: 'Média',
    custoPm: 30,
    nd: 10,
    relogioSecoes: 6,
    descricao: 'Efeitos moderados, tratamentos e percepções aprimoradas.',
    exemplos: 'Criar uma ilusão convincente, tratar uma doença, localizar alguém/algo, sentir emoções, fornecer energia a curto prazo.'
  },
  maior: {
    key: 'maior',
    nome: 'Maior',
    custoPm: 40,
    nd: 13,
    relogioSecoes: 6,
    descricao: 'Efeitos poderosos, transformações e alterações ambientais perceptíveis.',
    exemplos: 'Sentir pensamentos, influenciar emoções profundas, dissipar uma maldição, alterar o clima por algumas horas, fornecer energia de longo prazo.'
  },
  extrema: {
    key: 'extrema',
    nome: 'Extrema',
    custoPm: 50,
    nd: 16,
    relogioSecoes: 8,
    descricao: 'Efeitos lendários, cataclísmicos ou de escala colossal.',
    exemplos: 'Enfraquecer uma entidade divina, evitar uma grande catástrofe, selar um portal planar, alterar profundamente criatura ou local por uma semana.'
  }
};

/**
 * Tabela Oficial de Área e Multiplicador de Alvos (Livro Básico p. 139).
 */
export const AREAS_RITUAL = {
  individual: {
    key: 'individual',
    nome: 'Individual',
    multiplicador: 1,
    descricao: '1 criatura de tamanho humano, 1 objeto pequeno ou 1 árvore.'
  },
  pequena: {
    key: 'pequena',
    nome: 'Pequena',
    multiplicador: 2,
    descricao: 'Algumas criaturas humanas, 1 criatura grande, 1 cômodo, 1 vagão ou 1 clareira.'
  },
  grande: {
    key: 'grande',
    nome: 'Grande',
    multiplicador: 3,
    descricao: 'Uma multidão, uma pequena floresta, uma aeronave ou galeão, um salão de castelo ou 1 criatura gigante.'
  },
  enorme: {
    key: 'enorme',
    nome: 'Enorme',
    multiplicador: 4,
    descricao: 'Uma fortaleza inteira, um lago, um cume de montanha, uma aldeia inteira ou um quarteirão de cidade.'
  }
};

// =============================================================================
// 2. FUNÇÕES PURAS DE CÁLCULO E VALIDAÇÃO
// =============================================================================

/**
 * Normaliza um texto para busca case-insensitive e sem acentos.
 * @param {string} str
 * @returns {string}
 */
export function normalizarTexto(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Extrai o valor numérico de um dado ('d8', 8, 'D10' -> 8, 10).
 * @param {string|number} dado
 * @returns {number}
 */
export function extrairValorDadoRitual(dado) {
  if (!dado) return 8;
  const num = parseInt(String(dado).replace(/\D/g, ''), 10);
  return isNaN(num) || num < 4 ? 8 : num;
}

/**
 * Calcula o custo total de PM e dados do teste de um ritual.
 * Custo Base = Potência (PM) × Área (Multiplicador).
 * Se usar ingrediente raro/especial, o custo total de PM é reduzido à metade (arredondado para cima).
 *
 * @param {string} potenciaKey - Chave da potência ('menor', 'media', 'maior', 'extrema')
 * @param {string} areaKey - Chave da área ('individual', 'pequena', 'grande', 'enorme')
 * @param {{ ingredienteRaro?: boolean }} [opcoes]
 * @returns {{
 *   potencia: typeof POTENCIAS_RITUAL[keyof typeof POTENCIAS_RITUAL],
 *   area: typeof AREAS_RITUAL[keyof typeof AREAS_RITUAL],
 *   custoBase: number,
 *   custoTotal: number,
 *   nd: number,
 *   relogioSecoes: number,
 *   temReducaoIngrediente: boolean
 * }}
 */
export function calcularCustoRitual(potenciaKey = 'menor', areaKey = 'individual', opcoes = {}) {
  const pKey = String(potenciaKey || '').toLowerCase();
  const aKey = String(areaKey || '').toLowerCase();

  const potencia = POTENCIAS_RITUAL[pKey] || POTENCIAS_RITUAL.menor;
  const area = AREAS_RITUAL[aKey] || AREAS_RITUAL.individual;

  const custoBase = potencia.custoPm * area.multiplicador;
  const temReducaoIngrediente = Boolean(opcoes.ingredienteRaro);
  let custoTotal = temReducaoIngrediente ? Math.ceil(custoBase / 2) : custoBase;

  if (opcoes.dobrarPmDecreto) {
    custoTotal = custoTotal * 2;
  }

  const reducaoExtra = Math.max(0, parseInt(opcoes.reducaoPmExtra, 10) || 0);
  if (reducaoExtra > 0) {
    custoTotal = Math.max(0, custoTotal - reducaoExtra);
  }

  const temRituaisAgeis = Boolean(opcoes.temRituaisAgeis);
  const relogioSecoes = temRituaisAgeis
    ? Math.max(4, potencia.relogioSecoes - 2)
    : potencia.relogioSecoes;

  return {
    potencia,
    area,
    custoBase,
    custoTotal,
    nd: potencia.nd,
    relogioSecoes,
    temReducaoIngrediente,
    temRituaisAgeis
  };
}

/**
 * Valida se o conjurador possui Pontos de Magia suficientes para o ritual.
 *
 * @param {number} mpAtual - PM atual do personagem
 * @param {number} custoTotal - Custo total do ritual em PM
 * @returns {{
 *   podeConjurar: boolean,
 *   faltaMp: number,
 *   motivo: string|null
 * }}
 */
export function validarConjuracaoRitual(mpAtual, custoTotal) {
  const atual = Math.max(0, parseInt(mpAtual, 10) || 0);
  const custo = Math.max(0, parseInt(custoTotal, 10) || 0);

  if (atual >= custo) {
    return {
      podeConjurar: true,
      faltaMp: 0,
      motivo: null
    };
  }

  const falta = custo - atual;
  return {
    podeConjurar: false,
    faltaMp: falta,
    motivo: `PM insuficiente para conjurar este ritual (Necessário: ${custo} PM, Atual: ${atual} PM. Faltam: ${falta} PM).`
  };
}

// =============================================================================
// 3. DETECÇÃO AUTOMÁTICA DE DISCIPLINAS
// =============================================================================

/**
 * Detecta automaticamente todas as disciplinas que o personagem domina,
 * analisando classes, benefícios iniciais, habilidades, peculiaridades e seleções manuais.
 *
 * @param {Array<object>} classes - Lista de classes da ficha
 * @param {Array<string>} [rituaisManuais] - Disciplinas marcadas manualmente na ficha
 * @param {object|string} [peculiaridades] - Peculiaridade do personagem
 * @returns {Array<{
 *   id: string,
 *   nome: string,
 *   atributos: string[],
 *   sigla: string,
 *   descricao: string,
 *   fontes: string[],
 *   auto: boolean,
 *   manual: boolean
 * }>}
 */
export function detectarDisciplinasPersonagem(classes = [], rituaisManuais = [], peculiaridades = null) {
  const disciplinasDetectadas = new Map();

  const registrarDisciplina = (idKey, fonte, isManual = false) => {
    const discBase = DISCIPLINAS_RITUAL[idKey];
    if (!discBase) return;

    if (!disciplinasDetectadas.has(idKey)) {
      disciplinasDetectadas.set(idKey, {
        ...discBase,
        fontes: [fonte],
        auto: !isManual,
        manual: isManual
      });
    } else {
      const registro = disciplinasDetectadas.get(idKey);
      if (!registro.fontes.includes(fonte)) {
        registro.fontes.push(fonte);
      }
      if (!isManual) registro.auto = true;
      if (isManual) registro.manual = true;
    }
  };

  // 1. Analisar Classes, Benefícios e Habilidades
  if (Array.isArray(classes)) {
    classes.forEach((c) => {
      const nomeClasseNorm = normalizarTexto(c.nome_classe);
      const beneficiosNorm = normalizarTexto(
        typeof c.beneficios === 'object' ? c.beneficios?.texto : c.beneficios
      );
      const habilidades = Array.isArray(c.habilidades) ? c.habilidades : [];

      // Elementalista
      if (nomeClasseNorm.includes('elementalista')) {
        registrarDisciplina('ritualismo', 'Elementalista (Benefício Inicial)');
        registrarDisciplina('elementalismo', 'Elementalista');
      }

      // Entropista
      if (nomeClasseNorm.includes('entropista')) {
        registrarDisciplina('ritualismo', 'Entropista (Benefício Inicial)');
        registrarDisciplina('entropismo', 'Entropista');
      }

      // Espiritualista
      if (nomeClasseNorm.includes('espiritualista')) {
        registrarDisciplina('ritualismo', 'Espiritualista (Benefício Inicial)');
        registrarDisciplina('espiritualismo', 'Espiritualista');
      }

      // Quimerista
      if (nomeClasseNorm.includes('quimerista')) {
        registrarDisciplina('ritualismo', 'Quimerista (Benefício Inicial)');
        registrarDisciplina('quimerismo', 'Quimerista');
      }

      // Arcanista
      if (nomeClasseNorm.includes('arcanista')) {
        registrarDisciplina('arcanismo', 'Arcanista');
      }

      // Floralista / Florista
      if (nomeClasseNorm.includes('floralista') || nomeClasseNorm.includes('florista')) {
        registrarDisciplina('cloromancia', 'Floralista');
        registrarDisciplina('ritualismo', 'Floralista (Influência Verdejante)');
      }

      // Benefícios explícitos no texto
      if (beneficiosNorm.includes('ritualismo')) {
        registrarDisciplina('ritualismo', `${c.nome_classe || 'Classe'} (Benefício)`);
      }

      // Habilidades individuais
      habilidades.forEach((h) => {
        const nomeHabNorm = normalizarTexto(h.nome);
        const nv = parseInt(h.nivel, 10) || 0;

        // Arcanismo Ritualista
        if (nv > 0 && nomeHabNorm.includes('arcanismo ritualista')) {
          registrarDisciplina('arcanismo', 'Habilidade: Arcanismo Ritualista');
        }

        // Elementalismo Ritualista
        if (nv > 0 && nomeHabNorm.includes('elementalismo ritualista')) {
          registrarDisciplina('elementalismo', 'Habilidade: Elementalismo Ritualista');
        }

        // Entropismo Ritualista
        if (nv > 0 && nomeHabNorm.includes('entropismo ritualista')) {
          registrarDisciplina('entropismo', 'Habilidade: Entropismo Ritualista');
        }

        // Espiritualismo Ritualista
        if (nv > 0 && nomeHabNorm.includes('espiritualismo ritualista')) {
          registrarDisciplina('espiritualismo', 'Habilidade: Espiritualismo Ritualista');
        }

        // Quimerismo Ritualista
        if (nv > 0 && nomeHabNorm.includes('quimerismo ritualista')) {
          registrarDisciplina('quimerismo', 'Habilidade: Quimerismo Ritualista');
        }

        // Navegador (Esper) - Libera Ritualismo sem ingredientes raros!
        if (nomeHabNorm.includes('navegador') && nv > 0) {
          registrarDisciplina('ritualismo', 'Habilidade: Navegador (Esper)');
        }

        // Influência Verdejante (Floralista)
        if (nv > 0 && nomeHabNorm.includes('influencia verdejante')) {
          registrarDisciplina('cloromancia', 'Habilidade: Influência Verdejante');
          registrarDisciplina('ritualismo', 'Habilidade: Influência Verdejante (Floralista)');
        }

        // Cloromancia
        if (nv > 0 && nomeHabNorm.includes('cloromancia')) {
          registrarDisciplina('cloromancia', 'Habilidade: Cloromancia');
        }

        // Miragem (Simbolista)
        if (nv > 0 && nomeHabNorm.includes('miragem')) {
          registrarDisciplina('ritualismo', 'Habilidade: Miragem (Simbolista)');
        }

        // Canto da Sereia (Virtuoso)
        if (nv > 0 && nomeHabNorm.includes('canto da sereia')) {
          registrarDisciplina('ritualismo', 'Habilidade: Canto da Sereia (Virtuoso)');
        }
      });
    });
  }

  // 2. Analisar Peculiaridades (Quirks)
  const textoPeculiaridade = normalizarTexto(
    typeof peculiaridades === 'object'
      ? `${peculiaridades?.titulo || ''} ${peculiaridades?.nome || ''} ${peculiaridades?.descricao || ''}`
      : peculiaridades
  );

  if (textoPeculiaridade.includes('cerne elemental')) {
    registrarDisciplina('elementalismo', 'Peculiaridade: Cerne Elemental');
  }
  if (textoPeculiaridade.includes('augure do planeta')) {
    registrarDisciplina('espiritualismo', 'Peculiaridade: Áugure do Planeta');
  }
  if (textoPeculiaridade.includes('fantasma cognitivo')) {
    registrarDisciplina('ritualismo', 'Peculiaridade: Fantasma Cognitivo');
  }
  if (textoPeculiaridade.includes('paria feerico') || textoPeculiaridade.includes('paria feerica')) {
    registrarDisciplina('ritualismo', 'Peculiaridade: Pária Feérico');
  }

  // 3. Incorporar Seleções Manuais da Ficha (FichaFormRituais)
  if (Array.isArray(rituaisManuais)) {
    rituaisManuais.forEach((ritManual) => {
      const ritualStr = normalizarTexto(ritManual);
      Object.keys(DISCIPLINAS_RITUAL).forEach((key) => {
        if (ritualStr === key || ritualStr === normalizarTexto(DISCIPLINAS_RITUAL[key].nome)) {
          registrarDisciplina(key, 'Seleção Manual', true);
        }
      });
    });
  }

  // Converte Map para Array consolidado
  return Array.from(disciplinasDetectadas.values());
}

// =============================================================================
// 4. RESOLUÇÃO DE TESTE DE RITUAL (TESTE DE MAGIA)
// =============================================================================

/**
 * Realiza a rolagem e cálculo de um teste de ritual com base nos atributos do conjurador.
 *
 * @param {string|number} attr1 - Valor ou dado do primeiro atributo (ex: 8, 'd10')
 * @param {string|number} attr2 - Valor ou dado do segundo atributo (ex: 10, 'd10')
 * @param {number} nd - Nível de Dificuldade do teste de ritual
 * @param {{
 *   bonus?: number,
 *   dadosPredefinidos?: { d1: number, d2: number }
 * }} [opcoes]
 * @returns {{
 *   dado1: number,
 *   dado2: number,
 *   faces1: number,
 *   faces2: number,
 *   bonus: number,
 *   total: number,
 *   nd: number,
 *   sucesso: boolean,
 *   critico: boolean,
 *   desastre: boolean,
 *   margem: number
 * }}
 */
export function rolarTesteRitual(attr1, attr2, nd, opcoes = {}) {
  const faces1 = extrairValorDadoRitual(attr1);
  const faces2 = extrairValorDadoRitual(attr2);
  const bonus = parseInt(opcoes.bonus, 10) || 0;
  const ndNum = parseInt(nd, 10) || 7;

  const dado1 = opcoes.dadosPredefinidos?.d1 || (Math.floor(Math.random() * faces1) + 1);
  const dado2 = opcoes.dadosPredefinidos?.d2 || (Math.floor(Math.random() * faces2) + 1);

  const total = dado1 + dado2 + bonus;
  const desastre = dado1 === 1 && dado2 === 1;
  const critico = dado1 === dado2 && dado1 >= 6;
  const sucesso = (critico || total >= ndNum) && !desastre;
  const margem = total - ndNum;

  return {
    dado1,
    dado2,
    faces1,
    faces2,
    bonus,
    total,
    nd: ndNum,
    sucesso,
    critico,
    desastre,
    margem
  };
}
