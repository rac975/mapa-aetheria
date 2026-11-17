/**
 * Fabula Ultima - Regras Oficiais de Projetos (Invenções e Construções)
 *
 * CONFORME GEMINI.md:
 * - Camada de Domínio Puro (src/domain/fabula/): Funções puras em JavaScript (sem efeitos colaterais).
 * - Isolamento total: ZERO importações de React ou Supabase.
 * - Testabilidade: Funções determinísticas baseadas exclusivamente em parâmetros recebidos.
 * - Fonte Oficial: Livro Básico de Fabula Ultima (Capítulo 3 - Projetos, p. 134–137).
 */

// =============================================================================
// 1. TABELAS OFICIAIS DE PROJETOS (FABULA ULTIMA PT-BR)
// =============================================================================

export const DESCONTO_DEFEITO_TERRIVEL = 0.25;
export const ZENIT_POR_PROGRESSO = 100;

/**
 * Tabela Oficial de Potência de Projetos (custo base em Zênites e ND sugerida).
 */
export const POTENCIAS_PROJETO = {
  menor: {
    key: 'menor',
    nome: 'Menor',
    custoBase: 100,
    ndSugerida: 7,
    requerIngredienteRaro: false,
    descricao: 'Efeito simples, utilidade menor, gadget pontual ou melhoria sutil.'
  },
  media: {
    key: 'media',
    nome: 'Média',
    custoBase: 200,
    ndSugerida: 10,
    requerIngredienteRaro: true,
    descricao: 'Efeito moderado, ferramenta especializada, veículo leve ou equipamento tático.'
  },
  maior: {
    key: 'maior',
    nome: 'Maior',
    custoBase: 400,
    ndSugerida: 13,
    requerIngredienteRaro: true,
    descricao: 'Efeito poderoso, autômato aliado, aeronave menor ou artefato complexo.'
  },
  extrema: {
    key: 'extrema',
    nome: 'Extrema',
    custoBase: 800,
    ndSugerida: 16,
    requerIngredienteRaro: true,
    descricao: 'Maravilha arcana/tecnológica ou obra monumental de escala regional.'
  }
};

/**
 * Tabela Oficial de Área de Projetos (multiplicador sobre o custo base).
 */
export const AREAS_PROJETO = {
  individual: {
    key: 'individual',
    nome: 'Individual',
    multiplicador: 1,
    descricao: 'Afeta 1 criatura ou uso pessoal (arma, acessório, poção concentrada).'
  },
  pequena: {
    key: 'pequena',
    nome: 'Pequena',
    multiplicador: 2,
    descricao: 'Afeta um pequeno grupo, um cômodo, um vagão ou veículo compacto.'
  },
  grande: {
    key: 'grande',
    nome: 'Grande',
    multiplicador: 3,
    descricao: 'Afeta um grupo grande, salão, aeronave ou pequena embarcação.'
  },
  enorme: {
    key: 'enorme',
    nome: 'Enorme',
    multiplicador: 4,
    descricao: 'Afeta uma fortaleza inteira, bairro, exército ou cidade.'
  }
};

/**
 * Tabela Oficial de Usos de Projetos (Consumível ×1 vs Permanente ×5).
 */
export const USOS_PROJETO = {
  consumivel: {
    key: 'consumivel',
    nome: 'Consumível (Uso Único)',
    multiplicador: 1,
    descricao: 'Descartável ou de carga única; consome-se após a ativação.'
  },
  permanente: {
    key: 'permanente',
    nome: 'Permanente (Reutilizável)',
    multiplicador: 5,
    descricao: 'Invenção duradoura, maquinário ou estrutura reutilizável.'
  }
};

/**
 * Combinações comuns de atributos para Testes de Projeto.
 */
export const ATRIBUTOS_PROJETO_OPCOES = [
  { key: 'AST+DES', nome: '[AST + DES] Engenharia & Precisão', attr1: 'astucia', attr2: 'destreza' },
  { key: 'AST+VON', nome: '[AST + VON] Tecnomagia & Alquimia', attr1: 'astucia', attr2: 'vontade' },
  { key: 'AST+VIG', nome: '[AST + VIG] Forja & Metalurgia', attr1: 'astucia', attr2: 'vigor' },
  { key: 'DES+VIG', nome: '[DES + VIG] Construção Pesada', attr1: 'destreza', attr2: 'vigor' },
  { key: 'AST+AST', nome: '[AST + AST] Pesquisa Pura & Projeto', attr1: 'astucia', attr2: 'astucia' }
];

export const STATUS_PROJETO = {
  planejado: { key: 'planejado', nome: 'Planejado', variant: 'default' },
  em_andamento: { key: 'em_andamento', nome: 'Em Andamento', variant: 'ether' },
  pausado: { key: 'pausado', nome: 'Pausado', variant: 'pi' },
  concluido: { key: 'concluido', nome: 'Concluído', variant: 'core' }
};

// =============================================================================
// 2. HELPERS PUROS
// =============================================================================

function normalizarTexto(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Extrai valor numérico de um dado ('d8', 8, 'D12' -> 8, 12).
 * @param {string|number} dado
 * @returns {number}
 */
export function extrairValorDadoProjeto(dado) {
  if (!dado) return 8;
  const num = parseInt(String(dado).replace(/\D/g, ''), 10);
  return isNaN(num) || num < 4 ? 8 : num;
}

/**
 * Sugere um tamanho de relógio visual padrão (4, 6, 8, 10, 12) com base no progresso total.
 * @param {number} progressoTotal
 * @returns {number}
 */
export function sugerirFatiasRelogio(progressoTotal) {
  const total = Math.max(1, parseInt(progressoTotal, 10) || 1);
  if (total <= 4) return 4;
  if (total <= 6) return 6;
  if (total <= 8) return 8;
  if (total <= 10) return 10;
  return 12;
}

/**
 * Extrai o nível da habilidade "Visionário" (Inventor) e verifica presença da classe Inventor.
 * Regra Oficial: "Quando trabalha em um projeto, até (NP × 100) zênites do seu custo de material
 * são pagos automaticamente, e você gera mais (NP) de progresso todos os dias."
 *
 * @param {Array<object>} classes
 * @returns {{ temInventor: boolean, nivelVisionario: number }}
 */
export function extrairNivelVisionario(classes = []) {
  if (!Array.isArray(classes)) {
    return { temInventor: false, nivelVisionario: 0 };
  }

  let temInventor = false;
  let nivelVisionario = 0;

  classes.forEach((cls) => {
    const nomeClasse = normalizarTexto(cls?.nome_classe);
    if (nomeClasse.includes('inventor')) {
      temInventor = true;
    }

    const habilidades = Array.isArray(cls?.habilidades) ? cls.habilidades : [];
    habilidades.forEach((hab) => {
      const nomeHab = normalizarTexto(hab?.nome);
      if (nomeHab.includes('visionario')) {
        const nv = parseInt(hab?.nivel, 10) || 0;
        if (nv > nivelVisionario) nivelVisionario = nv;
      }
    });
  });

  return { temInventor, nivelVisionario };
}

// =============================================================================
// 3. CÁLCULO DE PARÂMETROS, CUSTO E PROGRESSO
// =============================================================================

/**
 * Calcula todos os parâmetros oficiais de um Projeto no Fabula Ultima.
 *
 * Fórmulas oficiais:
 * - Custo Base = Potência × Área × Usos
 * - Defeito Terrível (opcional): reduz o custo total de materiais em 25%
 * - Progresso Total = max(1, floor(Custo Material Final / 100))
 * - Subsídio Visionário: até (NP × 100) zênites pagos automaticamente
 *
 * @param {{
 *   potencia?: string,
 *   area?: string,
 *   usos?: string,
 *   possuiDefeito?: boolean,
 *   nivelVisionario?: number,
 *   zenitDisponivel?: number|null
 * }} [params]
 */
export function calcularParametrosProjeto(params = {}) {
  const potenciaKey = normalizarTexto(params.potencia) || 'menor';
  const areaKey = normalizarTexto(params.area) || 'individual';
  const usosKey = normalizarTexto(params.usos) || 'consumivel';

  const potencia = POTENCIAS_PROJETO[potenciaKey] || POTENCIAS_PROJETO.menor;
  const area = AREAS_PROJETO[areaKey] || AREAS_PROJETO.individual;
  const usos = USOS_PROJETO[usosKey] || USOS_PROJETO.consumivel;

  const custoSemDefeito = potencia.custoBase * area.multiplicador * usos.multiplicador;
  const possuiDefeito = Boolean(params.possuiDefeito);
  const descontoDefeito = possuiDefeito
    ? Math.floor(custoSemDefeito * DESCONTO_DEFEITO_TERRIVEL)
    : 0;

  const custoMaterialTotal = Math.max(0, custoSemDefeito - descontoDefeito);
  const progressoTotal = Math.max(1, Math.floor(custoMaterialTotal / ZENIT_POR_PROGRESSO));

  const nivelVis = Math.max(0, parseInt(params.nivelVisionario, 10) || 0);
  const subsidioVisionario = nivelVis * 100;
  const custoPagoAutomaticamente = Math.min(custoMaterialTotal, subsidioVisionario);
  const custoLiquidoJogador = Math.max(0, custoMaterialTotal - custoPagoAutomaticamente);

  const zenitDisp = params.zenitDisponivel === null || params.zenitDisponivel === undefined
    ? null
    : Math.max(0, parseInt(params.zenitDisponivel, 10) || 0);

  const podeIniciar = zenitDisp === null ? true : zenitDisp >= custoLiquidoJogador;
  const faltaZenit = zenitDisp === null ? 0 : Math.max(0, custoLiquidoJogador - zenitDisp);

  return {
    potencia,
    area,
    usos,
    possuiDefeito,
    custoSemDefeito,
    descontoDefeito,
    custoMaterialTotal,
    progressoTotal,
    nivelVisionario: nivelVis,
    subsidioVisionario,
    custoPagoAutomaticamente,
    custoLiquidoJogador,
    podeIniciar,
    faltaZenit,
    fatiasRelogioSugeridas: sugerirFatiasRelogio(progressoTotal),
    ndSugerida: potencia.ndSugerida,
    requerIngredienteRaro: potencia.requerIngredienteRaro
  };
}

/**
 * Calcula o progresso diário gerado ao trabalhar no projeto durante descanso/downtime.
 * Regra Oficial:
 * - Cada PJ trabalhando no projeto gera +1 de progresso por dia.
 * - Cada PJ com níveis na classe Inventor (ou habilidade Visionário) gera bônus:
 *   +1 pela classe Inventor (se contabilizado como colaborador especializado) ou +NP de Visionário.
 *
 * @param {{
 *   pjsTrabalhando?: number,
 *   inventoresSemVisionario?: number,
 *   niveisVisionario?: number[],
 *   bonusExtra?: number
 * }} [opcoes]
 */
export function calcularProgressoDiario(opcoes = {}) {
  const pjs = Math.max(0, parseInt(opcoes.pjsTrabalhando, 10) || 0);
  const invSemVis = Math.max(0, parseInt(opcoes.inventoresSemVisionario, 10) || 0);
  const listaVisionario = Array.isArray(opcoes.niveisVisionario) ? opcoes.niveisVisionario : [];
  const bonusExtra = Math.max(0, parseInt(opcoes.bonusExtra, 10) || 0);

  const progressoBase = pjs;
  const bonusInventor = invSemVis;
  const bonusVisionario = listaVisionario.reduce(
    (acc, nv) => acc + Math.max(0, parseInt(nv, 10) || 0),
    0
  );

  const totalDiario = progressoBase + bonusInventor + bonusVisionario + bonusExtra;

  return {
    progressoBase,
    bonusInventor,
    bonusVisionario,
    bonusExtra,
    totalDiario
  };
}

/**
 * Calcula quantos dias são necessários para concluir o projeto dado um ritmo diário.
 * @param {number} progressoAtual
 * @param {number} progressoTotal
 * @param {number} progressoPorDia
 * @returns {number}
 */
export function estimarDiasRestantes(progressoAtual, progressoTotal, progressoPorDia = 1) {
  const atual = Math.max(0, parseInt(progressoAtual, 10) || 0);
  const total = Math.max(1, parseInt(progressoTotal, 10) || 1);
  const ritmo = Math.max(1, parseInt(progressoPorDia, 10) || 1);
  const restante = Math.max(0, total - atual);
  return Math.ceil(restante / ritmo);
}

// =============================================================================
// 4. TESTES DE PROJETO E AVANÇO DE RELÓGIO
// =============================================================================

/**
 * Resolve um Teste de Projeto (2d + bônus vs ND) para acelerar ou avançar o relógio do projeto.
 *
 * Regra de resolução:
 * - Desastre (1 e 1): Falha automática, 0 progresso e gera complicação narrativa.
 * - Sucesso Crítico (dados iguais >= 6): Sucesso automático, gera +3 de progresso.
 * - Sucesso com margem >= 4: Gera +2 de progresso.
 * - Sucesso comum (total >= ND): Gera +1 de progresso.
 * - Falha (total < ND): 0 progresso.
 *
 * @param {string|number} attr1
 * @param {string|number} attr2
 * @param {number} nd
 * @param {{
 *   bonus?: number,
 *   dadosPredefinidos?: { d1: number, d2: number }
 * }} [opcoes]
 */
export function rolarTesteProjeto(attr1, attr2, nd = 10, opcoes = {}) {
  const faces1 = extrairValorDadoProjeto(attr1);
  const faces2 = extrairValorDadoProjeto(attr2);
  const bonus = parseInt(opcoes.bonus, 10) || 0;
  const ndNum = Math.max(4, parseInt(nd, 10) || 10);

  const dado1 = opcoes.dadosPredefinidos?.d1 || (Math.floor(Math.random() * faces1) + 1);
  const dado2 = opcoes.dadosPredefinidos?.d2 || (Math.floor(Math.random() * faces2) + 1);

  const total = dado1 + dado2 + bonus;
  const desastre = dado1 === 1 && dado2 === 1;
  const critico = dado1 === dado2 && dado1 >= 6;
  const sucesso = (critico || total >= ndNum) && !desastre;
  const margem = total - ndNum;

  let progressoGerado = 0;
  let classificacao = 'falha';

  if (desastre) {
    progressoGerado = 0;
    classificacao = 'desastre';
  } else if (critico) {
    progressoGerado = 3;
    classificacao = 'critico';
  } else if (sucesso && margem >= 4) {
    progressoGerado = 2;
    classificacao = 'sucesso_superior';
  } else if (sucesso) {
    progressoGerado = 1;
    classificacao = 'sucesso';
  }

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
    margem,
    progressoGerado,
    classificacao
  };
}

/**
 * Converte o progresso absoluto (pontos) em fatias preenchidas no relógio SVG.
 * @param {number} progressoAtual
 * @param {number} progressoTotal
 * @param {number} fatiasTotal
 * @returns {number}
 */
export function calcularFatiasPreenchidas(progressoAtual, progressoTotal, fatiasTotal = 4) {
  const atual = Math.max(0, parseInt(progressoAtual, 10) || 0);
  const total = Math.max(1, parseInt(progressoTotal, 10) || 1);
  const fatias = Math.max(2, parseInt(fatiasTotal, 10) || 4);

  if (atual <= 0) return 0;
  if (atual >= total) return fatias;

  const proporcionais = Math.floor((atual / total) * fatias);
  return Math.max(1, Math.min(fatias, proporcionais));
}

/**
 * Avança ou retrocede o progresso e o relógio de um projeto de forma imutável.
 *
 * @param {{
 *   progresso_atual?: number,
 *   progresso_total?: number,
 *   fatias_relogio?: number,
 *   status?: string
 * }} projeto
 * @param {number} delta
 */
export function avancarRelogioProjeto(projeto = {}, delta = 1) {
  const progressoTotal = Math.max(1, parseInt(projeto.progresso_total, 10) || 1);
  const progressoAnterior = Math.max(0, Math.min(progressoTotal, parseInt(projeto.progresso_atual, 10) || 0));
  const variacao = parseInt(delta, 10) || 0;
  const progressoNovo = Math.max(0, Math.min(progressoTotal, progressoAnterior + variacao));
  const fatiasTotal = Math.max(2, parseInt(projeto.fatias_relogio, 10) || sugerirFatiasRelogio(progressoTotal));

  const concluido = progressoNovo >= progressoTotal;
  const percentual = Math.round((progressoNovo / progressoTotal) * 100);
  const fatiasPreenchidas = calcularFatiasPreenchidas(progressoNovo, progressoTotal, fatiasTotal);

  let novoStatus = projeto.status || 'em_andamento';
  if (concluido) {
    novoStatus = 'concluido';
  } else if (novoStatus === 'concluido' || novoStatus === 'planejado') {
    novoStatus = 'em_andamento';
  }

  return {
    progressoAnterior,
    progressoNovo,
    progressoTotal,
    percentual,
    concluido,
    fatiasTotal,
    fatiasPreenchidas,
    novoStatus
  };
}
