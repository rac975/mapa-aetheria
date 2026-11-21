/**
 * Fabula Ultima - Regras de Progressão de Personagem, Classes e Nível
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 */

export const NIVEL_MAXIMO_CLASSE = 10;
export const MAX_CLASSES_NAO_DOMINADAS = 3;
export const NIVEL_MAXIMO_HABILIDADE_PADRAO = 5;
export const NIVEL_MAXIMO_GLOBAL = 50;

// Classes canônicas que possuem acesso a grimório de magias
export const CLASSES_COM_MAGIA = ['arcanista', 'elementalista', 'entropista', 'espiritualista', 'invocador'];

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
 * Verifica se um personagem está apto a adotar uma nova classe conforme as regras de Fabula Ultima.
 */
export function podeAdicionarClasse(classesAtuais = [], nomeNovaClasse = '') {
  if (!nomeNovaClasse || typeof nomeNovaClasse !== 'string') {
    return { permitido: false, motivo: 'Nome de classe inválido.' };
  }
  const jaPossuiClasse = classesAtuais.some(
    c => (c.nome_classe || '').trim().toLowerCase() === nomeNovaClasse.trim().toLowerCase()
  );
  if (jaPossuiClasse) {
    return { permitido: false, motivo: `O personagem já possui a classe "${nomeNovaClasse}" ativa!` };
  }
  if (classesAtuais.length >= MAX_CLASSES_NAO_DOMINADAS) {
    const temClasseDominada = classesAtuais.some(c => isClasseDominada(c.nivel));
    if (!temClasseDominada) {
      return {
        permitido: false,
        motivo: 'Regra de Fabula Ultima: Você já possui 3 classes ativas e nenhuma delas está no Nível 10. Você precisa concluir (chegar ao nível 10) em pelo menos uma classe antes de poder adquirir uma nova!'
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

export const COLUNAS_INTEIRAS_FICHAS = new Set([
  'nivel', 'destreza', 'astucia', 'vigor', 'vontade',
  'hp_atual', 'hp_max', 'mp_atual', 'mp_max', 'pi_atual', 'pi_max',
  'zenit', 'defesa', 'mdef', 'iniciativa', 'fabula', 'exp'
]);

export const COLUNAS_JSONB_FICHAS = new Set([
  'lacos', 'peculiaridade', 'poderes_heroicos', 'dados_veiculo',
  'dados_esper', 'dados_mutante', 'rituais', 'dados_virtuoso',
  'dados_comandante', 'dados_dancarino', 'dados_simbolista'
]);

export const COLUNAS_TEXTO_FICHAS = new Set([
  'jogador_token', 'nome_personagem', 'identidade', 'tema',
  'titulo_pecularidade', 'descricao_peculiaridade', 'descricao_pecularidade',
  'criado_em', 'nome_jogador', 'notas', 'avatar_url'
]);

export const COLUNAS_VALIDAS_FICHAS_PERSONAGENS = new Set([
  'id',
  ...COLUNAS_INTEIRAS_FICHAS,
  ...COLUNAS_JSONB_FICHAS,
  ...COLUNAS_TEXTO_FICHAS
]);

/**
 * Sanitiza o payload destinado à tabela public.fichas_personagens, garantindo que
 * apenas colunas reais e válidas sejam enviadas, com tipos compatíveis (sem NaN, undefined
 * ou campos extras indevidos como condicoes, classes, magias, itens, statusCalculados).
 * Mapeia apelidos legados (ip_atual, pv_atual, etc.) para os nomes canônicos.
 * @param {Object} dados
 * @param {{ incluirId?: boolean }} [opcoes]
 * @returns {Object}
 */
export function sanitizarPayloadFicha(dados, { incluirId = false } = {}) {
  if (!dados || typeof dados !== 'object') return {};
  const payload = {};
  const src = { ...dados };

  if (src.ip_atual !== undefined && src.pi_atual === undefined) src.pi_atual = src.ip_atual;
  if (src.ip_max !== undefined && src.pi_max === undefined) src.pi_max = src.ip_max;
  if (src.ip !== undefined && src.pi_atual === undefined) src.pi_atual = src.ip;
  if (src.pv_atual !== undefined && src.hp_atual === undefined) src.hp_atual = src.pv_atual;
  if (src.pv_max !== undefined && src.hp_max === undefined) src.hp_max = src.pv_max;
  if (src.pm_atual !== undefined && src.mp_atual === undefined) src.mp_atual = src.pm_atual;
  if (src.pm_max !== undefined && src.mp_max === undefined) src.mp_max = src.pm_max;
  if (src.pontos_fabula !== undefined && src.fabula === undefined) src.fabula = src.pontos_fabula;
  if (src.pf !== undefined && src.fabula === undefined) src.fabula = src.pf;

  if (incluirId && src.id !== undefined && src.id !== null) {
    payload.id = String(src.id);
  }

  for (const [chave, valor] of Object.entries(src)) {
    if (valor === undefined) continue;

    if (COLUNAS_INTEIRAS_FICHAS.has(chave)) {
      if (valor === null) {
        payload[chave] = null;
      } else {
        const num = Number(valor);
        if (Number.isFinite(num)) {
          payload[chave] = Math.floor(num);
        }
      }
    } else if (COLUNAS_JSONB_FICHAS.has(chave)) {
      if (valor === null || typeof valor === 'object') {
        payload[chave] = valor;
      } else if (typeof valor === 'string') {
        try {
          payload[chave] = JSON.parse(valor);
        } catch {
          payload[chave] = valor;
        }
      }
    } else if (COLUNAS_TEXTO_FICHAS.has(chave)) {
      payload[chave] = valor === null ? null : String(valor);
    }
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

