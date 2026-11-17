import {
  CONDICOES_OFICIAIS,
  calcularModificadoresCondicoesOficiais,
  normalizarTextoCore
} from './coreClassRules.js';

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
    ficha_id: fichaId,
    guardando: false,
    protegendo_id: null,
    turno_atual: false,
    modificadores: {}
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

/**
 * Calcula modificadores consolidados de cura/drenagem durante conflitos considerando
 * Símbolo do Desespero, Toque Pessoal (Simbolista), Foco Cognitivo (Esper), Roque do Rei (Comandante),
 * Harmonia Elemental (Invocador), Data de Validade (Mercador) e Dosagem Precisa (Gourmet/Mercador).
 * @param {Object} params
 * @returns {{ valorFinal: number, convertidoEmDano: boolean, danoVeneno: number, limitePercentualMax: number, detalhes: Array<string> }}
 */
export function calcularCuraEfetivaEmConflito({
  curaBase = 0,
  tipoRecurso = 'pv',
  temSimboloDesespero = false,
  bloqueadoPorRoqueDoRei = false,
  bonusToquePessoal = 0,
  bonusFocoCognitivo = 0,
  bonusRoqueReiPm = 0,
  bonusHarmoniaElementalPv = 0,
  usarDataDeValidade = false,
  danoDataDeValidade = 0,
  temDosagemPrecisa = false
} = {}) {
  if (tipoRecurso === 'pv' && usarDataDeValidade && danoDataDeValidade > 0) {
    return {
      valorFinal: 0,
      convertidoEmDano: true,
      danoVeneno: danoDataDeValidade,
      limitePercentualMax: 100,
      detalhes: [`Data de Validade: Convertido em ${danoDataDeValidade} de dano de veneno`]
    };
  }

  if (bloqueadoPorRoqueDoRei) {
    return {
      valorFinal: 0,
      convertidoEmDano: false,
      danoVeneno: 0,
      limitePercentualMax: 100,
      detalhes: ['Bloqueado por Roque do Rei']
    };
  }

  let total = Math.max(0, parseInt(curaBase, 10) || 0);
  const detalhes = [];

  if (bonusToquePessoal > 0) {
    total += bonusToquePessoal;
    detalhes.push(`Toque Pessoal (+${bonusToquePessoal})`);
  }
  if (bonusFocoCognitivo > 0) {
    total += bonusFocoCognitivo;
    detalhes.push(`Foco Cognitivo (+${bonusFocoCognitivo})`);
  }
  if (tipoRecurso === 'pv' && bonusHarmoniaElementalPv > 0) {
    total += bonusHarmoniaElementalPv;
    detalhes.push(`Harmonia Elemental (+${bonusHarmoniaElementalPv} PV)`);
  }
  if (tipoRecurso === 'pm' && bonusRoqueReiPm > 0) {
    total += bonusRoqueReiPm;
    detalhes.push(`Roque do Rei (+${bonusRoqueReiPm} PM)`);
  }
  if (temSimboloDesespero) {
    total = Math.floor(total / 2);
    detalhes.push('Símbolo do Desespero (÷2)');
  }
  if (temDosagemPrecisa) {
    detalhes.push('Dosagem Precisa (até 150% do máximo)');
  }

  return {
    valorFinal: total,
    convertidoEmDano: false,
    danoVeneno: 0,
    limitePercentualMax: temDosagemPrecisa ? 150 : 100,
    detalhes
  };
}

/**
 * Calcula a Iniciativa efetiva e bônus de testes opostos de velocidade/acrobacia em conflito.
 * @param {Object} params
 * @returns {{ iniciativa: number, bonusOpostosVelocidade: number }}
 */
export function calcularIniciativaEOpostosCombate({
  bonusIniciativaStatus = 0,
  bonusSapateadoFrenetico = 0
} = {}) {
  return {
    iniciativa: Number(bonusIniciativaStatus) || 0,
    bonusOpostosVelocidade: Math.max(0, Number(bonusSapateadoFrenetico) || 0)
  };
}

// =============================================================================
// SISTEMA COMPLETO DE AÇÕES DE CONFLITO, REAÇÕES E MANOBRAS (FABULA ULTIMA)
// =============================================================================

export const ACOES_CONFLITO_OFICIAIS = {
  ATAQUE: {
    codigo: 'ATAQUE',
    titulo: 'Atacar',
    categoria: 'ofensiva',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Realiza um ataque corpo a corpo ou à distância com arma equipada ou golpe desarmado (DES + VIG, dano RA + 0 físico).'
  },
  CONJURAR: {
    codigo: 'CONJURAR',
    titulo: 'Conjurar (Feitiço)',
    categoria: 'magica',
    consomeTurno: true,
    custoBase: 'PM variável',
    resumo: 'Lança um feitiço aprendido pagando seu custo total em PM (ou PV via Vismagus). Feitiços ofensivos (O) exigem Teste de Magia.'
  },
  GUARDAR: {
    codigo: 'GUARDAR',
    titulo: 'Guarda',
    categoria: 'defensiva',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Recebe Resistência a todos os tipos de dano e +2 em Testes Opostos até o início do próximo turno; pode dar Cobertura a outro aliado.'
  },
  INVENTARIO: {
    codigo: 'INVENTARIO',
    titulo: 'Inventário',
    categoria: 'suporte',
    consomeTurno: true,
    custoBase: 'PI variável',
    resumo: 'Gasta Pontos de Inventário (PI) para criar e usar poções, elixires, fragmentos elementais, engenhocas ou símbolos.'
  },
  OBJETIVO: {
    codigo: 'OBJETIVO',
    titulo: 'Objetivo',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Realiza um teste para avançar ou retroceder um Relógio de Conflito (+1 seção em sucesso; +1 extra por Crítico e a cada +3 acima do ND).'
  },
  ESTUDO: {
    codigo: 'ESTUDO',
    titulo: 'Estudo (Investigar)',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Teste Aberto (AST + AST) para revelar Traços, Afinidades, PV/PM ou ataques de um oponente visível (ND 10 / 13 / 16).'
  },
  IMPEDIMENTO: {
    codigo: 'IMPEDIMENTO',
    titulo: 'Impedimento',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Teste Oposto criativo contra um inimigo visível para impor uma condição ou complicação narrativa ao alvo.'
  },
  EQUIPAMENTO: {
    codigo: 'EQUIPAMENTO',
    titulo: 'Equipamento',
    categoria: 'tatica',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Troca livremente qualquer combinação de armas, escudos, armadura ou acessório equipados (grátis com Troca de Figurino ou Tempo Roubado).'
  },
  HABILIDADE: {
    codigo: 'HABILIDADE',
    titulo: 'Habilidade de Classe',
    categoria: 'classe',
    consomeTurno: true,
    custoBase: 'PM/PV/PF variável',
    resumo: 'Executa um poder ativo de classe (Invocar Arcano, Cloromancia, Culinária, Invocação, Magicanto, Teriomorfose, Ordem de Comandante, Oratória, etc.).'
  },
  RENDICAO: {
    codigo: 'RENDICAO',
    titulo: 'Rendição / Queda',
    categoria: 'especial',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ao chegar a 0 PV, um PJ pode se Render (sofre consequência narrativa e ganha +2 Pontos de Fábula) ou realizar Sacrifício Heróico.'
  }
};

export const REACOES_COMBATE_OFICIAIS = {
  PROTEGER: {
    codigo: 'PROTEGER',
    titulo: 'Proteger (Guardião)',
    gatilho: 'Aliado ameaçado por ataque, feitiço ou perigo (1x/turno)',
    custoPm: 0,
    efeito: 'Toma o lugar do aliado; todos os testes e efeitos do perigo são redirecionados para você.'
  },
  CONTRA_ATAQUE: {
    codigo: 'CONTRA_ATAQUE',
    titulo: 'Contra-Ataque (Mestre de Armas)',
    gatilho: 'Inimigo realiza ataque corpo a corpo contra você com resultado de Precisão PAR',
    custoPm: 0,
    efeito: 'Executa ataque corpo a corpo livre contra o atacante com RA considerado igual a 0.'
  },
  FOGO_CRUZADO: {
    codigo: 'FOGO_CRUZADO',
    titulo: 'Fogo Cruzado (Atirador)',
    gatilho: 'Criatura visível faz ataque à distância (não crítico)',
    custoBasePm: 5,
    efeito: 'Gasta (5 + Teste de Precisão do alvo) PM com arma à distância equipada para anular o ataque contra todos os alvos.'
  },
  ABSORVER_PM: {
    codigo: 'ABSORVER_PM',
    titulo: 'Absorver PM (Entropista)',
    gatilho: 'Após sofrer dano',
    custoPm: 0,
    efeito: 'Recupera (NP × 2) Pontos de Magia.'
  },
  LICAO_DOLOROSA: {
    codigo: 'LICAO_DOLOROSA',
    titulo: 'Lição Dolorosa (Guerreiro Sombrio)',
    gatilho: 'Após sofrer dano',
    custoPm: 0,
    efeito: 'Realiza imediatamente a ação Estudo contra o agressor com bônus igual a (NP).'
  },
  ECDISE: {
    codigo: 'ECDISE',
    titulo: 'Écdise (Mutante)',
    gatilho: 'Após sofrer dano não-físico',
    custoPv: 10,
    efeito: 'Gasta 10 PV para adquirir Resistência àquele tipo de dano até a próxima troca.'
  },
  CASCATA: {
    codigo: 'CASCATA',
    titulo: 'Cascata (Invocador)',
    gatilho: 'Aliado fere inimigo marcado por invocação do tipo Praga',
    custoPm: 0,
    efeito: 'Executa ataque livre (+NP Precisão) convertendo dano para o elemento do aliado e dissipa a Praga.'
  }
};

export const MANOBRAS_TATICAS_OFICIAIS = {
  MULTI_ATAQUE: {
    codigo: 'MULTI_ATAQUE',
    titulo: 'Ataque Multi (Alvos Múltiplos)',
    custoBonusDano: 'Remove o bônus fixo da arma (+0), mantendo RA + bônus externos.',
    efeito: 'Permite atingir até Multi (N) alvos com um único Teste de Precisão.'
  },
  COBERTURA_GUARDA: {
    codigo: 'COBERTURA_GUARDA',
    titulo: 'Cobrir Aliado em Guarda',
    custoBonusDano: 'Ação Guarda no turno.',
    efeito: 'Aliado escolhido não pode ser alvo de ataques corpo a corpo até o início do próximo turno (e ganha Resistência total com Guarda-Costas).'
  },
  DUAS_ARMAS: {
    codigo: 'DUAS_ARMAS',
    titulo: 'Combate com Duas Armas',
    custoBonusDano: 'Duas armas de 1 mão equipadas; ambos os ataques têm RA = 0.',
    efeito: 'Realiza dois ataques na mesma ação Ataque (mão dominante e mão secundária).'
  },
  TIRO_AVISO_QUEBRA_OSSOS: {
    codigo: 'TIRO_AVISO_QUEBRA_OSSOS',
    titulo: 'Manobra de Debilitação (Tiro de Aviso / Quebra-Ossos)',
    custoBonusDano: 'Abre mão de causar dano ao acertar.',
    efeito: 'Impõe condição (Abalado/Lento/Atordoado/Fraco) ou drena (NP × 10) PM dos alvos atingidos.'
  }
};

export const AFINIDADES_DANO = {
  VULNERAVEL: 'vulneravel',
  NORMAL: 'normal',
  RESISTENTE: 'resistente',
  IMUNE: 'imune',
  ABSORVE: 'absorve'
};

/**
 * Calcula quantas seções de um Relógio de Conflito devem avançar em um teste da ação Objetivo.
 * Regra oficial de Fabula Ultima:
 * - Falha: 0 seções
 * - Sucesso: 1 seção + 1 seção adicional para cada 3 pontos acima do ND + 2 seções extras em Sucesso Crítico
 * - Orador (Persuasivo): +1 seção por cada 20 PM gastos (se aplicável)
 * @param {Object} params
 * @returns {{ sucesso: boolean, secoesAvancadas: number, detalhes: Array<string> }}
 */
export function calcularProgressoRelogioPorTeste({
  resultadoTeste = 10,
  nivelDificuldade = 10,
  isCritico = false,
  isFalhaCritica = false,
  secoesExtrasPersuasivo = 0
} = {}) {
  const total = Number(resultadoTeste) || 0;
  const nd = Number(nivelDificuldade) || 10;

  if (isFalhaCritica || total < nd) {
    return {
      sucesso: false,
      secoesAvancadas: 0,
      detalhes: [isFalhaCritica ? 'Falha Crítica (0 seções)' : `Falhou no ND ${nd} (0 seções)`]
    };
  }

  let secoes = 1;
  const detalhes = ['Sucesso (+1 seção)'];

  const margem = Math.floor((total - nd) / 3);
  if (margem > 0) {
    secoes += margem;
    detalhes.push(`Margem +${total - nd} (+${margem} seção(ões))`);
  }

  if (isCritico) {
    secoes += 2;
    detalhes.push('Sucesso Crítico (+2 seções)');
  }

  const extrasOrador = Math.max(0, parseInt(secoesExtrasPersuasivo, 10) || 0);
  if (extrasOrador > 0) {
    secoes += extrasOrador;
    detalhes.push(`Persuasivo (+${extrasOrador} seção(ões))`);
  }

  return {
    sucesso: true,
    secoesAvancadas: secoes,
    detalhes
  };
}

/**
 * Calcula o dano final recebido por um combatente aplicando redução fixa (Maestria Defensiva /
 * Barreira Sonora), Guarda/Resistência e Afinidade elemental/física oficial de Fabula Ultima.
 * Ordem oficial: Redução fixa antes das Afinidades -> Guarda/Resistência (÷2) -> Vulnerabilidade (×2) / Imune (0) / Absorve (cura).
 * @param {Object} params
 * @returns {{ danoFinal: number, curaAbsorvida: number, afinidadeAplicada: string, detalhes: Array<string> }}
 */
export function calcularDanoFinalComModificadores({
  danoBruto = 0,
  reducaoDanoFixa = 0,
  estaGuardando = false,
  afinidade = AFINIDADES_DANO.NORMAL,
  bonusDanoCondenar = 0,
  bonusDanoAdicional = 0
} = {}) {
  const detalhes = [];
  let dano = Math.max(0, (Number(danoBruto) || 0) + (Number(bonusDanoCondenar) || 0) + (Number(bonusDanoAdicional) || 0));

  const red = Math.max(0, Number(reducaoDanoFixa) || 0);
  if (red > 0) {
    dano = Math.max(0, dano - red);
    detalhes.push(`Redução Fixa (-${red})`);
  }

  const afNorm = normalizarTextoCore(afinidade || 'normal');
  if (afNorm === 'imune') {
    return { danoFinal: 0, curaAbsorvida: 0, afinidadeAplicada: 'imune', detalhes: [...detalhes, 'Imune (0 dano)'] };
  }
  if (afNorm === 'absorve') {
    return { danoFinal: 0, curaAbsorvida: dano, afinidadeAplicada: 'absorve', detalhes: [...detalhes, `Absorve (+${dano} PV)`] };
  }

  if (afNorm === 'vulneravel') {
    if (estaGuardando) {
      // Guarda concede Resistência a todos os tipos; Resistência + Vulnerabilidade anulam-se mutuamente
      detalhes.push('Vulnerável cancelado por Guarda (×1)');
    } else {
      dano = dano * 2;
      detalhes.push('Vulnerável (×2)');
    }
  } else if (afNorm === 'resistente' || estaGuardando) {
    dano = Math.floor(dano / 2);
    detalhes.push(estaGuardando ? 'Em Guarda / Resistente (÷2)' : 'Resistente (÷2)');
  }

  return {
    danoFinal: Math.max(0, dano),
    curaAbsorvida: 0,
    afinidadeAplicada: estaGuardando && afNorm === 'normal' ? 'resistente_guarda' : afNorm,
    detalhes
  };
}

/**
 * Calcula bônus ativos de combate derivados das condições do participante, estado de Guarda e modificadores da cena.
 * @param {Object} combatente
 * @param {Object} [modificadoresCena={}]
 * @returns {Object}
 */
export function extrairModificadoresCombatente(combatente = {}, modificadoresCena = {}) {
  const condicoes = Array.isArray(combatente?.condicoes) ? combatente.condicoes : [];
  const modsAtributos = calcularModificadoresCondicoesOficiais(condicoes);
  const guardando = Boolean(combatente?.guardando);
  const emCrise = calcularStatusCrise(combatente?.hp_atual, combatente?.hp_max);
  const caido = estaDerrotado(combatente?.hp_atual);
  const extraCombatente = combatente?.modificadores && typeof combatente.modificadores === 'object'
    ? combatente.modificadores
    : {};

  return {
    condicoes,
    modsAtributos,
    guardando,
    bonusOpostosGuarda: guardando ? 2 : 0,
    emCrise,
    caido,
    protegendoId: combatente?.protegendo_id ?? null,
    decretoDanoExtra: Number(modificadoresCena?.decretoDanoExtra) || 0,
    decretoDobrarPm: Boolean(modificadoresCena?.decretoDobrarPm),
    roqueBloquearCura: Boolean(modificadoresCena?.roqueBloquearCura),
    bonusDanoSofridoCondenar: Number(extraCombatente?.bonusDanoCondenar) || 0,
    detalhesCondicoes: condicoes
      .map((id) => CONDICOES_OFICIAIS[normalizarTextoCore(id)]?.nome || id)
      .filter(Boolean)
  };
}

/**
 * Processa e valida uma Ação Rápida de Conflito para execução imediata em mesas híbridas,
 * computando alterações em recursos, turno, Guarda, condições, relógios e log de combate.
 * @param {Object} params
 * @returns {{ valido: boolean, erro?: string, updatesAtor: Object, updatesAlvo: Object|null, deltaRelogio: number, logEntry: Object|null }}
 */
export function resolverAcaoCombate({
  acaoCodigo = 'ATAQUE',
  ator = null,
  alvo = null,
  custoPm = 0,
  custoPi = 0,
  custoPf = 0,
  danoAplicado = 0,
  curaAplicada = 0,
  recursoCura = 'pv',
  tipoDano = 'fisico',
  afinidadeAlvo = 'normal',
  reducaoDanoAlvo = 0,
  condicaoAlvo = null,
  avancoRelogio = 0,
  notaLivre = '',
  marcarTurnoConcluido = true,
  modificadoresCena = {}
} = {}) {
  const codigoNorm = String(acaoCodigo || 'ATAQUE').toUpperCase();
  const acaoInfo = ACOES_CONFLITO_OFICIAIS[codigoNorm] || REACOES_COMBATE_OFICIAIS[codigoNorm];
  if (!acaoInfo) {
    return { valido: false, erro: `Ação de conflito desconhecida: ${acaoCodigo}`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (!ator || !ator.nome) {
    return { valido: false, erro: 'Combatente ativo não informado.', updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (estaDerrotado(ator.hp_atual) && codigoNorm !== 'RENDICAO') {
    return { valido: false, erro: `${ator.nome} está caído (0 PV) e não pode executar ações normais.`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }

  let pmGasto = Math.max(0, parseInt(custoPm, 10) || 0);
  if (modificadoresCena?.decretoDobrarPm && pmGasto > 0 && codigoNorm === 'CONJURAR') {
    pmGasto *= 2;
  }
  const piGasto = Math.max(0, parseInt(custoPi, 10) || 0);
  const pfGasto = Math.max(0, parseInt(custoPf, 10) || 0);

  if (pmGasto > (Number(ator.mp_atual) || 0)) {
    return { valido: false, erro: `${ator.nome} não possui PM suficientes (requer ${pmGasto} PM).`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (piGasto > (Number(ator.ip) || 0)) {
    return { valido: false, erro: `${ator.nome} não possui PI suficientes (requer ${piGasto} PI).`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }
  if (pfGasto > (Number(ator.pontos_fabula) || 0)) {
    return { valido: false, erro: `${ator.nome} não possui Pontos de Fábula suficientes (requer ${pfGasto} PF).`, updatesAtor: {}, updatesAlvo: null, deltaRelogio: 0, logEntry: null };
  }

  const updatesAtor = {};
  if (pmGasto > 0) updatesAtor.mp_atual = aplicarDeltaRecurso(ator.mp_atual, -pmGasto, ator.mp_max, 0);
  if (piGasto > 0) updatesAtor.ip = aplicarDeltaRecurso(ator.ip, -piGasto, null, 0);
  if (pfGasto > 0) updatesAtor.pontos_fabula = aplicarDeltaRecurso(ator.pontos_fabula, -pfGasto, null, 0);

  if (marcarTurnoConcluido && acaoInfo.consomeTurno) {
    updatesAtor.agiu = true;
    updatesAtor.turno_atual = false;
  }

  const resumoPartes = [];

  if (codigoNorm === 'GUARDAR') {
    updatesAtor.guardando = true;
    if (alvo && alvo.id && alvo.id !== ator.id) {
      updatesAtor.protegendo_id = alvo.id;
      resumoPartes.push(`Em Guarda cobrindo ${alvo.nome} (Resistência total e +2 Opostos)`);
    } else {
      updatesAtor.protegendo_id = null;
      resumoPartes.push('Em Guarda (Resistência total a danos e +2 Opostos)');
    }
  } else if (codigoNorm === 'RENDICAO') {
    updatesAtor.pontos_fabula = aplicarDeltaRecurso(ator.pontos_fabula, 2, null, 0);
    resumoPartes.push(`${ator.nome} realizou Rendição (+2 Pontos de Fábula)`);
  }

  let updatesAlvo = null;
  const alvoEfetivo = alvo || (curaAplicada > 0 ? ator : null);

  if (alvoEfetivo && Number(danoAplicado) > 0) {
    const modAlvo = extrairModificadoresCombatente(alvoEfetivo, modificadoresCena);
    const resDano = calcularDanoFinalComModificadores({
      danoBruto: Number(danoAplicado),
      reducaoDanoFixa: Number(reducaoDanoAlvo) || 0,
      estaGuardando: modAlvo.guardando,
      afinidade: afinidadeAlvo,
      bonusDanoCondenar: modAlvo.bonusDanoSofridoCondenar,
      bonusDanoAdicional: modificadoresCena?.decretoDanoExtra || 0
    });

    updatesAlvo = updatesAlvo || {};
    if (resDano.curaAbsorvida > 0) {
      updatesAlvo.hp_atual = aplicarDeltaRecurso(alvoEfetivo.hp_atual, resDano.curaAbsorvida, alvoEfetivo.hp_max, 0);
      resumoPartes.push(`${alvoEfetivo.nome} absorveu +${resDano.curaAbsorvida} PV (${tipoDano})`);
    } else {
      const novoHpAlvo = aplicarDeltaRecurso(alvoEfetivo.hp_atual, -resDano.danoFinal, alvoEfetivo.hp_max, 0);
      updatesAlvo.hp_atual = novoHpAlvo;
      updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHpAlvo, alvoEfetivo.hp_max);
      resumoPartes.push(`${alvoEfetivo.nome} sofreu ${resDano.danoFinal} de dano (${tipoDano})`);
    }
  }

  if (alvoEfetivo && Number(curaAplicada) > 0) {
    const modCura = calcularCuraEfetivaEmConflito({
      curaBase: Number(curaAplicada),
      tipoRecurso: recursoCura,
      bloqueadoPorRoqueDoRei: Boolean(modificadoresCena?.roqueBloquearCura)
    });
    const destinoIsAtor = alvoEfetivo.id === ator.id;
    if (modCura.valorFinal > 0) {
      if (recursoCura === 'pm') {
        const novoMp = aplicarDeltaRecurso(
          destinoIsAtor && updatesAtor.mp_atual !== undefined ? updatesAtor.mp_atual : alvoEfetivo.mp_atual,
          modCura.valorFinal,
          alvoEfetivo.mp_max,
          0
        );
        if (destinoIsAtor) updatesAtor.mp_atual = novoMp;
        else {
          updatesAlvo = updatesAlvo || {};
          updatesAlvo.mp_atual = novoMp;
        }
        resumoPartes.push(`${alvoEfetivo.nome} recuperou +${modCura.valorFinal} PM`);
      } else {
        const novoHp = aplicarDeltaRecurso(alvoEfetivo.hp_atual, modCura.valorFinal, alvoEfetivo.hp_max, 0);
        if (destinoIsAtor) updatesAtor.hp_atual = novoHp;
        else {
          updatesAlvo = updatesAlvo || {};
          updatesAlvo.hp_atual = novoHp;
          updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHp, alvoEfetivo.hp_max);
        }
        resumoPartes.push(`${alvoEfetivo.nome} recuperou +${modCura.valorFinal} PV`);
      }
    } else if (modCura.detalhes.length > 0) {
      resumoPartes.push(modCura.detalhes.join(', '));
    }
  }

  if (alvo && condicaoAlvo) {
    const condNorm = normalizarTextoCore(condicaoAlvo);
    const atuaisAlvo = Array.isArray(alvo.condicoes) ? alvo.condicoes : [];
    if (!atuaisAlvo.includes(condNorm)) {
      updatesAlvo = updatesAlvo || {};
      updatesAlvo.condicoes = [...atuaisAlvo, condNorm];
      const nomeCond = CONDICOES_OFICIAIS[condNorm]?.nome || condicaoAlvo;
      resumoPartes.push(`${alvo.nome} ficou ${nomeCond}`);
    }
  }

  const deltaRelogio = codigoNorm === 'OBJETIVO' ? (parseInt(avancoRelogio, 10) || 0) : 0;
  if (deltaRelogio !== 0) {
    resumoPartes.push(`Relógio ${deltaRelogio > 0 ? `+${deltaRelogio}` : deltaRelogio} seção(ões)`);
  }

  if (pmGasto > 0) resumoPartes.push(`-${pmGasto} PM`);
  if (piGasto > 0) resumoPartes.push(`-${piGasto} PI`);
  if (pfGasto > 0) resumoPartes.push(`-${pfGasto} PF`);
  if (notaLivre && notaLivre.trim()) resumoPartes.push(notaLivre.trim());

  const detalhes = resumoPartes.length > 0 ? resumoPartes.join(' • ') : acaoInfo.resumo;

  return {
    valido: true,
    updatesAtor,
    updatesAlvo,
    alvoId: alvoEfetivo?.id || null,
    deltaRelogio,
    logEntry: {
      combatente_id: ator.id || null,
      autor_nome: ator.nome,
      autor_tipo: ator.tipo || 'heroi',
      acao_codigo: codigoNorm,
      acao_titulo: acaoInfo.titulo,
      detalhes,
      metadata: {
        alvo_nome: alvoEfetivo?.nome || null,
        dano_aplicado: Number(danoAplicado) || 0,
        cura_aplicada: Number(curaAplicada) || 0,
        pm_gasto: pmGasto,
        pi_gasto: piGasto,
        pf_gasto: pfGasto,
        condicao_aplicada: condicaoAlvo || null,
        delta_relogio: deltaRelogio
      }
    }
  };
}
