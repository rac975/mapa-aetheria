/**
 * Fabula Ultima - Regras de Progressão de Personagem, Classes e Nível
 *
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 * Conforme o Livro Básico de Regras de Fabula Ultima:
 * - O teto máximo de nível por classe individual é 10 (uma classe com nível 10 é Dominada / Concluída).
 * - O nível do personagem é igual à soma de todos os níveis de suas classes (inicia tipicamente no nível 5 com 5 níveis de classe distribuídos em 2 ou 3 classes, teto máximo global do sistema vai até 50).
 * - Cada nível em uma classe concede exatamente 1 Ponto de Habilidade naquela classe para adquirir ou aprimorar uma Habilidade de Classe.
 * - Habilidades possuem um Nível de Habilidade (SL / Skill Level) máximo especificado (geralmente entre 1 e 5).
 * - O personagem só pode possuir até 3 classes ativas simultâneas que não estejam dominadas (nível 10). Para abrir uma nova classe se já tiver 3 classes, pelo menos uma deve estar no nível 10 (dominada).
 */

export const NIVEL_MAXIMO_CLASSE = 10;
export const MAX_CLASSES_NAO_DOMINADAS = 3;
export const NIVEL_MAXIMO_HABILIDADE_PADRAO = 5;
export const NIVEL_MAXIMO_GLOBAL = 50;

// Classes canônicas que possuem acesso a grimório de magias
export const CLASSES_COM_MAGIA = [
  'arcanista',
  'elementalista',
  'entropista',
  'espiritualista',
  'invocador',
];

/**
 * Calcula o nível total do personagem somando os níveis de cada classe.
 * @param {Array<{nivel: number|string}>} classes
 * @returns {number}
 */
export function calcularNivelTotal(classes = []) {
  if (!Array.isArray(classes)) return 0;
  return classes.reduce((acc, c) => {
    const n = parseInt(c?.nivel, 10);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
}

/**
 * Valida se uma classe atingiu o nível máximo (Dominada / Nível 10).
 * @param {number|string} nivelClasse
 * @returns {boolean}
 */
export function isClasseDominada(nivelClasse) {
  return (parseInt(nivelClasse, 10) || 0) >= NIVEL_MAXIMO_CLASSE;
}

/**
 * Limita o valor de um nível de classe entre 1 e 10.
 * @param {number|string} nivel
 * @returns {number}
 */
export function sanitizarNivelClasse(nivel) {
  let val = parseInt(nivel, 10);
  if (isNaN(val) || val < 1) return 1;
  if (val > NIVEL_MAXIMO_CLASSE) return NIVEL_MAXIMO_CLASSE;
  return val;
}

/**
 * Calcula os pontos de habilidade totais gastos em uma classe.
 * Em Fabula Ultima: cada nível em uma classe confere 1 ponto de habilidade para investir nas habilidades daquela classe.
 * @param {Array<{nivel: number|string}>} habilidades
 * @returns {number}
 */
export function calcularPontosHabilidadeGastos(habilidades = []) {
  if (!Array.isArray(habilidades)) return 0;
  return habilidades.reduce((acc, h) => {
    const n = parseInt(h?.nivel, 10);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
}

/**
 * Valida a integridade da distribuição de pontos de habilidade em relação ao nível da classe.
 * @param {number|string} nivelClasse
 * @param {Array<{nivel: number|string}>} habilidades
 * @returns {{
 *   pontosGastos: number,
 *   pontosMaximos: number,
 *   pontosRestantes: number,
 *   excedeNivel: boolean,
 *   incompleto: boolean,
 *   valido: boolean
 * }}
 */
export function validarDistribuicaoHabilidades(nivelClasse, habilidades = []) {
  const pontosMaximos = parseInt(nivelClasse, 10) || 0;
  const pontosGastos = calcularPontosHabilidadeGastos(habilidades);
  const pontosRestantes = pontosMaximos - pontosGastos;

  return {
    pontosGastos,
    pontosMaximos,
    pontosRestantes,
    excedeNivel: pontosGastos > pontosMaximos,
    incompleto: pontosGastos < pontosMaximos,
    valido: pontosGastos === pontosMaximos
  };
}

/**
 * Verifica se um personagem está apto a adotar uma nova classe conforme as regras de Fabula Ultima:
 * - Não pode ter a mesma classe repetida.
 * - Se já possui 3 classes ativas, pelo menos uma delas deve estar Dominada (Nível 10).
 * @param {Array<{nome_classe: string, nivel: number|string}>} classesAtuais
 * @param {string} nomeNovaClasse
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function podeAdicionarClasse(classesAtuais = [], nomeNovaClasse = '') {
  if (!nomeNovaClasse || typeof nomeNovaClasse !== 'string') {
    return { permitido: false, motivo: 'Nome de classe inválido.' };
  }

  const jaPossuiClasse = classesAtuais.some(
    c => (c.nome_classe || '').trim().toLowerCase() === nomeNovaClasse.trim().toLowerCase()
  );
  if (jaPossuiClasse) {
    return {
      permitido: false,
      motivo: `O personagem já possui a classe "${nomeNovaClasse}" ativa!`
    };
  }

  if (classesAtuais.length >= MAX_CLASSES_NAO_DOMINADAS) {
    const temClasseDominada = classesAtuais.some(c => isClasseDominada(c.nivel));
    if (!temClasseDominada) {
      return {
        permitido: false,
        motivo: `Regra de Fabula Ultima: Você já possui 3 classes ativas e nenhuma delas está no Nível 10. Você precisa concluir (chegar ao nível 10) em pelo menos uma classe antes de poder adquirir uma nova!`
      };
    }
  }

  return { permitido: true };
}

/**
 * Verifica se o nome da classe confere acesso ao sistema de magias.
 * @param {string} nomeClasse
 * @returns {boolean}
 */
export function classeAceitaMagia(nomeClasse) {
  if (!nomeClasse || typeof nomeClasse !== 'string') return false;
  const nomeClasseNorm = nomeClasse
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return CLASSES_COM_MAGIA.some(cm => nomeClasseNorm.includes(cm));
}

/**
 * Sanitiza o payload destinado à tabela public.fichas_personagens, garantindo que
 * colunas inexistentes como 'ip_atual' ou 'ip_max' nunca sejam enviadas no PATCH/INSERT/UPDATE,
 * mapeando seus valores para 'pi_atual' e 'pi_max'.
 * @param {Object} dados
 * @returns {Object}
 */
export function sanitizarPayloadFicha(dados) {
  if (!dados || typeof dados !== 'object') return dados;
  const payload = { ...dados };

  if ('ip_atual' in payload) {
    if (payload.pi_atual === undefined) {
      payload.pi_atual = payload.ip_atual;
    }
    delete payload.ip_atual;
  }

  if ('ip_max' in payload) {
    if (payload.pi_max === undefined) {
      payload.pi_max = payload.ip_max;
    }
    delete payload.ip_max;
  }

  return payload;
}

/**
 * Normaliza os Pontos de Inventário da ficha em memória, garantindo que
 * 'pi_atual' e 'pi_max' estejam sempre preenchidos e fornecendo propriedades
 * virtuais não-enumeráveis 'ip_atual' e 'ip_max' para retrocompatibilidade sem vazar no Supabase.
 * @param {Object} ficha
 * @returns {Object}
 */
export function normalizarFichaPersonagem(ficha) {
  if (!ficha || typeof ficha !== 'object') return ficha;
  const piAtual = ficha.pi_atual !== undefined && ficha.pi_atual !== null
    ? Number(ficha.pi_atual)
    : (ficha.ip_atual !== undefined && ficha.ip_atual !== null ? Number(ficha.ip_atual) : 6);
  const piMax = ficha.pi_max !== undefined && ficha.pi_max !== null
    ? Number(ficha.pi_max)
    : (ficha.ip_max !== undefined && ficha.ip_max !== null ? Number(ficha.ip_max) : 6);

  const normalizada = {
    ...ficha,
    pi_atual: piAtual,
    pi_max: piMax
  };

  if (!Object.prototype.hasOwnProperty.call(normalizada, 'ip_atual')) {
    Object.defineProperty(normalizada, 'ip_atual', {
      get() { return this.pi_atual; },
      set(v) { this.pi_atual = v; },
      enumerable: false,
      configurable: true
    });
  }
  if (!Object.prototype.hasOwnProperty.call(normalizada, 'ip_max')) {
    Object.defineProperty(normalizada, 'ip_max', {
      get() { return this.pi_max; },
      set(v) { this.pi_max = v; },
      enumerable: false,
      configurable: true
    });
  }

  return normalizada;
}

