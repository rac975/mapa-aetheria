/**
 * Fabula Ultima - Regras de Combate e Iniciativa
 * 
 * Funções puras sem dependências de UI (React) ou Banco de Dados (Supabase).
 */

/**
 * Verifica se um combatente está derrotado (HP igual a zero ou menor)
 * @param {number} hpAtual 
 * @returns {boolean}
 */
export function estaDerrotado(hpAtual) {
  return Number(hpAtual) <= 0;
}

/**
 * Em Fabula Ultima, um personagem está em Crise quando seus PV/HP atuais
 * estão iguais ou abaixo da metade do seu PV/HP Máximo (arredondado para baixo ou float),
 * desde que não esteja derrotado (HP > 0).
 * 
 * Regra do Livro Básico:
 * "Um personagem cujos Pontos de Vida atuais sejam iguais ou inferiores à metade
 * de seus Pontos de Vida máximos está em Crise."
 * 
 * @param {number} hpAtual 
 * @param {number} hpMax 
 * @returns {boolean}
 */
export function calcularStatusCrise(hpAtual, hpMax) {
  const hp = Number(hpAtual);
  const max = Number(hpMax);
  if (hp <= 0 || max <= 0) return false;
  return hp <= Math.floor(max / 2);
}

/**
 * Calcula o dano acumulado sofrido por um combatente (HP Máx - HP Atual).
 * @param {number} hpAtual 
 * @param {number} hpMax 
 * @returns {number}
 */
export function calcularDanoAcumulado(hpAtual, hpMax) {
  const hp = Math.max(0, Number(hpAtual));
  const max = Math.max(0, Number(hpMax));
  return Math.max(0, max - hp);
}

/**
 * Alterna ou define o status de ação/turno de um participante.
 * @param {boolean} agiuAtual 
 * @param {boolean|null} forcarStatus 
 * @returns {boolean}
 */
export function alternarTurno(agiuAtual, forcarStatus = null) {
  if (forcarStatus !== null) {
    return Boolean(forcarStatus);
  }
  return !agiuAtual;
}

/**
 * Verifica se todos os combatentes ativos de um grupo ou de toda a cena já agiram.
 * Em Fabula Ultima, a rodada reinicia quando todos os combatentes elegíveis completam seus turnos.
 * @param {Array<Object>} combatentes 
 * @returns {boolean}
 */
export function todosAgiram(combatentes = []) {
  if (!combatentes.length) return false;
  return combatentes
    .filter(c => !estaDerrotado(c.hp_atual))
    .every(c => c.agiu);
}

/**
 * Aplica uma variação em um recurso numérico (HP, MP, IP, Pontos de Fábula)
 * respeitando os limites mínimo (0 por padrão) e máximo (opcional).
 * @param {number} valorAtual 
 * @param {number} delta 
 * @param {number|null} maximo 
 * @param {number} minimo 
 * @returns {number}
 */
export function aplicarDeltaRecurso(valorAtual, delta, maximo = null, minimo = 0) {
  const atual = Number(valorAtual) || 0;
  const variacao = Number(delta) || 0;
  let novo = atual + variacao;

  if (maximo !== null) {
    novo = Math.min(Number(maximo), novo);
  }
  return Math.max(minimo, novo);
}

/**
 * Alterna a presença de uma condição (status) na lista de condições de um combatente.
 * Ex: 'lento', 'atordoado', 'enfraquecido', etc.
 * @param {Array<string>} condicoesAtuais 
 * @param {string} condicaoId 
 * @returns {Array<string>}
 */
export function alternarCondicao(condicoesAtuais = [], condicaoId) {
  if (!condicaoId) return [...condicoesAtuais];
  const existe = condicoesAtuais.includes(condicaoId);
  return existe
    ? condicoesAtuais.filter(c => c !== condicaoId)
    : [...condicoesAtuais, condicaoId];
}

/**
 * Constrói o objeto de participante combatente inicial pronto para inclusão na iniciativa.
 * @param {Object} params
 * @param {string} params.tipo - 'heroi' | 'inimigo'
 * @param {string} params.nome
 * @param {number} params.ordem
 * @param {number} [params.hpMax=40]
 * @param {number} [params.mpMax=40]
 * @param {number} [params.ip=0]
 * @param {number} [params.pontosFabula=0]
 * @param {number} [params.pontosUltima=0]
 * @param {string|number|null} [params.fichaId=null]
 * @returns {Object}
 */
export function construirCombatente({
  tipo,
  nome,
  ordem = 0,
  hpMax = 40,
  mpMax = 40,
  ip = 0,
  pontosFabula = 0,
  pontosUltima = 0,
  fichaId = null
}) {
  const hp = Math.max(1, Number(hpMax) || 1);
  const mp = Math.max(0, Number(mpMax) || 0);

  return {
    nome: nome.trim(),
    tipo,
    agiu: false,
    ordem,
    hp_atual: hp,
    hp_max: hp,
    mp_atual: mp,
    mp_max: mp,
    ip: Number(ip) || 0,
    pontos_fabula: Number(pontosFabula) || 0,
    pontos_ultima: Number(pontosUltima) || 0,
    dano_acumulado: 0,
    condicoes: [],
    ficha_id: fichaId
  };
}

/**
 * Reordena uma lista de combatentes trocando os índices indicados
 * e reatribuindo os valores de 'ordem'.
 * @param {Array<Object>} lista 
 * @param {number} indexOrigem 
 * @param {'cima'|'baixo'} direcao 
 * @returns {Array<Object>}
 */
export function reordenarParticipantes(lista, indexOrigem, direcao) {
  const targetIndex = direcao === 'cima' ? indexOrigem - 1 : indexOrigem + 1;
  if (targetIndex < 0 || targetIndex >= lista.length) {
    return lista;
  }

  const novaLista = [...lista];
  const temp = novaLista[indexOrigem];
  novaLista[indexOrigem] = novaLista[targetIndex];
  novaLista[targetIndex] = temp;

  return novaLista.map((item, idx) => ({ ...item, ordem: idx }));
}
