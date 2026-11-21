import {
  CONDICOES_OFICIAIS,
  PROGRESSAO_DADOS_ATRIBUTO,
  calcularModificadoresCondicoesOficiais,
  calcularPassivosCoreClasses,
  normalizarTextoCore,
  extrairArcanosVinculados,
  extrairMagiasQuimerista,
  extrairAtributoQuimerista
} from './coreClassRules.js';
import {
  armaAtingeVoadores,
  extrairResumoCaracteristicasEquipamento
} from './equipmentRules.js';
import { obterItemFormaAtivaArmaMutavel } from './weaponForge.js';
import { calcularBonusPassivosPoderesHeroicos } from './heroicAndQuirksRules.js';
import {
  clampRecursoNpc,
  ajustarRecursoNpc,
  isNpcCombatente,
  extrairHpMax,
  extrairMpMax,
  TIPOS_VILAO,
  ACOES_PONTOS_VILAO,
  normalizarTipoVilao,
  calcularPontosVilaoPadrao,
  calcularAcoesPorTurnoNpc,
  isVilaoOuChefe,
  criarFaseChefaoPadrao,
  verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao,
  consumirPontoVilaoNpc,
  formatarAtaqueBasicoNpc,
  formatarPoderNpcParaExibicao
} from './npcRules.js';

export {
  clampRecursoNpc,
  ajustarRecursoNpc,
  isNpcCombatente,
  extrairHpMax,
  extrairMpMax,
  TIPOS_VILAO,
  ACOES_PONTOS_VILAO,
  normalizarTipoVilao,
  calcularPontosVilaoPadrao,
  calcularAcoesPorTurnoNpc,
  isVilaoOuChefe,
  criarFaseChefaoPadrao,
  verificarGatilhoTransicaoFase,
  executarTransicaoFaseChefao,
  consumirPontoVilaoNpc
};

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

  if (maximo !== null && maximo !== undefined) {
    novo = Math.min(Number(maximo), novo);
  }
  return Math.max(Number(minimo) || 0, novo);
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
  tipoVilao = 'padrao',
  pontosVilao = null,
  fasesChefao = [],
  acoesPorTurno = 1,
  faseAtual = 1,
  fichaId = null,
  npcId = null,
  voador = false
}) {
  const hp = Math.max(1, Number(hpMax) || 1);
  const mp = Math.max(0, Number(mpMax) || 0);
  const vilaoNorm = tipo === 'heroi' ? 'padrao' : normalizarTipoVilao(tipoVilao);
  const pvVilao = tipo === 'heroi'
    ? 0
    : Math.max(
        0,
        pontosVilao !== null && pontosVilao !== undefined
          ? Number(pontosVilao)
          : (Number(pontosUltima) || calcularPontosVilaoPadrao(vilaoNorm))
      );
  const acoes = tipo === 'heroi' ? 1 : Math.max(1, Number(acoesPorTurno) || 1);
  const fases = tipo === 'heroi' || !Array.isArray(fasesChefao) ? [] : fasesChefao;
  const faseInicial = Math.max(1, Number(faseAtual) || 1);

  const modsIniciais = {
    ...(npcId ? { npc_id: npcId } : {}),
    ...(voador ? { voador: true } : {}),
    ...(tipo !== 'heroi' ? { acoes_realizadas_rodada: 0, pontos_vilao_max: pvVilao } : {})
  };

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
    pontos_ultima: pvVilao,
    tipo_vilao: vilaoNorm,
    pontos_vilao: pvVilao,
    fases_chefao: fases,
    acoes_por_turno: acoes,
    fase_atual: faseInicial,
    dano_acumulado: 0,
    condicoes: [],
    ficha_id: fichaId,
    guardando: false,
    protegendo_id: null,
    turno_atual: false,
    voador: Boolean(voador),
    modificadores: modsIniciais
  };
}

/**
 * Normaliza e sanitiza o payload para a tabela 'iniciativa_combate' do Supabase,
 * garantindo estritamente as colunas canônicas 'hp_max' e 'mp_max' e eliminando
 * propriedades legadas que geram erro 400 no banco (ex: maxHp, maxMp, pv_max, pm_max).
 * @param {Object} dados
 * @returns {Object}
 */
export function sanitizarPayloadIniciativa(dados) {
  if (!dados || typeof dados !== 'object') return dados;

  const payload = { ...dados };

  // Mapeia caso venha como maxHp ou pv_max sem hp_max
  if (payload.hp_max === undefined) {
    if (payload.maxHp !== undefined) payload.hp_max = payload.maxHp;
    else if (payload.pv_max !== undefined) payload.hp_max = payload.pv_max;
  }

  // Mapeia caso venha como maxMp ou pm_max sem mp_max
  if (payload.mp_max === undefined) {
    if (payload.maxMp !== undefined) payload.mp_max = payload.maxMp;
    else if (payload.pm_max !== undefined) payload.mp_max = payload.pm_max;
  }

  // Remove propriedades que não são colunas da tabela iniciativa_combate
  delete payload.maxHp;
  delete payload.maxMp;
  delete payload.pv_max;
  delete payload.pm_max;
  delete payload.pv_atual;
  delete payload.pm_atual;

  return payload;
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
  const targetIndex = typeof direcao === 'number'
    ? direcao
    : (direcao === 'cima' ? indexOrigem - 1 : indexOrigem + 1);
  if (targetIndex < 0 || targetIndex >= lista.length || targetIndex === indexOrigem) {
    return lista;
  }

  const novaLista = [...lista];
  const [removido] = novaLista.splice(indexOrigem, 1);
  novaLista.splice(targetIndex, 0, removido);

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
    consomeTurno: true,
    custoBonusDano: 'Remove o bônus fixo da arma (+0), mantendo RA + bônus externos.',
    efeito: 'Permite atingir até Multi (N) alvos com um único Teste de Precisão.'
  },
  COBERTURA_GUARDA: {
    codigo: 'COBERTURA_GUARDA',
    titulo: 'Cobrir Aliado em Guarda',
    consomeTurno: true,
    custoBonusDano: 'Ação Guarda no turno.',
    efeito: 'Aliado escolhido não pode ser alvo de ataques corpo a corpo até o início do próximo turno (e ganha Resistência total com Guarda-Costas).'
  },
  DUAS_ARMAS: {
    codigo: 'DUAS_ARMAS',
    titulo: 'Combate com Duas Armas',
    consomeTurno: true,
    custoBonusDano: 'Duas armas de 1 mão equipadas; ambos os ataques têm RA = 0.',
    efeito: 'Realiza dois ataques na mesma ação Ataque (mão dominante e mão secundária).'
  },
  TIRO_AVISO_QUEBRA_OSSOS: {
    codigo: 'TIRO_AVISO_QUEBRA_OSSOS',
    titulo: 'Manobra de Debilitação (Tiro de Aviso / Quebra-Ossos)',
    consomeTurno: true,
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
  const acaoInfo =
    ACOES_CONFLITO_OFICIAIS[codigoNorm] ||
    REACOES_COMBATE_OFICIAIS[codigoNorm] ||
    MANOBRAS_TATICAS_OFICIAIS[codigoNorm];
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
  if (pmGasto > 0) {
    if (isNpcCombatente(ator)) {
      const maxMpAtor = extrairMpMax(ator);
      updatesAtor.mp_atual = clampRecursoNpc((Number(ator.mp_atual) || 0) - pmGasto, maxMpAtor, 0);
    } else {
      updatesAtor.mp_atual = aplicarDeltaRecurso(ator.mp_atual, -pmGasto, ator.mp_max, 0);
    }
  }
  if (piGasto > 0) updatesAtor.ip = aplicarDeltaRecurso(ator.ip, -piGasto, null, 0);
  if (pfGasto > 0) updatesAtor.pontos_fabula = aplicarDeltaRecurso(ator.pontos_fabula, -pfGasto, null, 0);

  const resumoPartes = [];

  if (marcarTurnoConcluido && acaoInfo.consomeTurno) {
    const totalAcoes = isNpcCombatente(ator) ? Math.max(1, Number(ator.acoes_por_turno) || 1) : 1;
    const modsAtor = ator.modificadores && typeof ator.modificadores === 'object' ? ator.modificadores : {};
    const realizadasAntes = Math.max(0, Number(modsAtor.acoes_realizadas_rodada) || 0);
    const realizadasAgora = realizadasAntes + 1;

    if (totalAcoes > 1) {
      updatesAtor.modificadores = {
        ...modsAtor,
        acoes_realizadas_rodada: realizadasAgora
      };
      resumoPartes.push(`Multi-Ação (${realizadasAgora}/${totalAcoes})`);
    }

    if (realizadasAgora >= totalAcoes) {
      updatesAtor.agiu = true;
      updatesAtor.turno_atual = false;
    } else {
      updatesAtor.agiu = false;
      updatesAtor.turno_atual = false;
    }
  }

  if (codigoNorm === 'GUARDAR' || codigoNorm === 'COBERTURA_GUARDA') {
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
    const isAlvoNpc = isNpcCombatente(alvoEfetivo);
    const maxHpAlvo = extrairHpMax(alvoEfetivo);

    if (resDano.curaAbsorvida > 0) {
      const novoHpAlvo = isAlvoNpc
        ? clampRecursoNpc((Number(alvoEfetivo.hp_atual) || 0) + resDano.curaAbsorvida, maxHpAlvo, 0)
        : aplicarDeltaRecurso(alvoEfetivo.hp_atual, resDano.curaAbsorvida, alvoEfetivo.hp_max, 0);
      updatesAlvo.hp_atual = novoHpAlvo;
      if (isAlvoNpc) {
        updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHpAlvo, maxHpAlvo);
      }
      resumoPartes.push(`${alvoEfetivo.nome} absorveu +${resDano.curaAbsorvida} PV (${tipoDano})`);
    } else {
      const novoHpAlvo = isAlvoNpc
        ? clampRecursoNpc((Number(alvoEfetivo.hp_atual) || 0) - resDano.danoFinal, maxHpAlvo, 0)
        : aplicarDeltaRecurso(alvoEfetivo.hp_atual, -resDano.danoFinal, alvoEfetivo.hp_max, 0);
      updatesAlvo.hp_atual = novoHpAlvo;
      updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHpAlvo, isAlvoNpc ? maxHpAlvo : alvoEfetivo.hp_max);
      resumoPartes.push(`${alvoEfetivo.nome} sofreu ${resDano.danoFinal} de dano (${tipoDano})`);

      if (isAlvoNpc) {
        const checkFase = verificarGatilhoTransicaoFase({
          hpAtual: novoHpAlvo,
          hpMax: maxHpAlvo,
          faseAtual: alvoEfetivo.fase_atual,
          fasesChefao: alvoEfetivo.fases_chefao
        });
        if (checkFase.gatilhoAtivo && checkFase.proximaFaseObj) {
          resumoPartes.push(`⚡ GATILHO DE CHEFE: ${checkFase.proximaFaseObj.nome}`);
        }
      }
    }
  }

  if (alvoEfetivo && Number(curaAplicada) > 0) {
    const modCura = calcularCuraEfetivaEmConflito({
      curaBase: Number(curaAplicada),
      tipoRecurso: recursoCura,
      bloqueadoPorRoqueDoRei: Boolean(modificadoresCena?.roqueBloquearCura)
    });
    const destinoIsAtor = alvoEfetivo.id === ator.id;
    const combatenteDestino = destinoIsAtor ? ator : alvoEfetivo;
    const isDestinoNpc = isNpcCombatente(combatenteDestino);

    if (modCura.valorFinal > 0) {
      if (recursoCura === 'pm') {
        const mpBase = destinoIsAtor && updatesAtor.mp_atual !== undefined ? updatesAtor.mp_atual : combatenteDestino.mp_atual;
        let novoMp;
        if (isDestinoNpc) {
          const maxMpDestino = extrairMpMax(combatenteDestino);
          novoMp = clampRecursoNpc((Number(mpBase) || 0) + modCura.valorFinal, maxMpDestino, 0);
        } else {
          novoMp = aplicarDeltaRecurso(mpBase, modCura.valorFinal, combatenteDestino.mp_max, 0);
        }

        if (destinoIsAtor) updatesAtor.mp_atual = novoMp;
        else {
          updatesAlvo = updatesAlvo || {};
          updatesAlvo.mp_atual = novoMp;
        }
        resumoPartes.push(`${combatenteDestino.nome} recuperou +${modCura.valorFinal} PM`);
      } else {
        const hpBase = destinoIsAtor && updatesAtor.hp_atual !== undefined ? updatesAtor.hp_atual : combatenteDestino.hp_atual;
        let novoHp;
        if (isDestinoNpc) {
          const maxHpDestino = extrairHpMax(combatenteDestino);
          novoHp = clampRecursoNpc((Number(hpBase) || 0) + modCura.valorFinal, maxHpDestino, 0);
          if (destinoIsAtor) {
            updatesAtor.hp_atual = novoHp;
            updatesAtor.dano_acumulado = calcularDanoAcumulado(novoHp, maxHpDestino);
          } else {
            updatesAlvo = updatesAlvo || {};
            updatesAlvo.hp_atual = novoHp;
            updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHp, maxHpDestino);
          }
        } else {
          novoHp = aplicarDeltaRecurso(hpBase, modCura.valorFinal, combatenteDestino.hp_max, 0);
          if (destinoIsAtor) updatesAtor.hp_atual = novoHp;
          else {
            updatesAlvo = updatesAlvo || {};
            updatesAlvo.hp_atual = novoHp;
            updatesAlvo.dano_acumulado = calcularDanoAcumulado(novoHp, combatenteDestino.hp_max);
          }
        }
        resumoPartes.push(`${combatenteDestino.nome} recuperou +${modCura.valorFinal} PV`);
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

  const detalhes = resumoPartes.length > 0 ? resumoPartes.join(' • ') : (acaoInfo.resumo || acaoInfo.efeito);

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

// =============================================================================
// SISTEMA DE ROLAGEM DE DADOS INTEGRADA AO COMBATE (FICHAS E NPCS)
// =============================================================================

export const ATRIBUTOS_CONFLITO = {
  des: { key: 'des', campoFicha: 'destreza', sigla: 'DES', nome: 'Destreza' },
  ast: { key: 'ast', campoFicha: 'astucia', sigla: 'AST', nome: 'Astúcia' },
  vig: { key: 'vig', campoFicha: 'vigor', sigla: 'VIG', nome: 'Vigor' },
  von: { key: 'von', campoFicha: 'vontade', sigla: 'VON', nome: 'Vontade' }
};

export const TESTES_RAPIDOS_PADRAO = [
  { codigo: 'INICIATIVA', titulo: 'Iniciativa / Percepção', attr1: 'des', attr2: 'ast', isOposto: true },
  { codigo: 'RES_FISICA', titulo: 'Resistência Física', attr1: 'vig', attr2: 'vig', isOposto: false },
  { codigo: 'RES_MENTAL', titulo: 'Resistência Mental', attr1: 'von', attr2: 'von', isOposto: false },
  { codigo: 'ESTUDO', titulo: 'Estudo (ND 10/13/16)', attr1: 'ast', attr2: 'ast', isOposto: false, ndSugerido: 10 },
  { codigo: 'IMPEDIMENTO', titulo: 'Impedimento / Disputa', attr1: 'des', attr2: 'vig', isOposto: true }
];

/**
 * Converte valor de dado textual ou numérico (ex: 'd8', 'D10', 8) em número de faces válido.
 * @param {string|number} valor
 * @param {number} [padrao=8]
 * @returns {number}
 */
export function extrairFacesDadoCombate(valor, padrao = 8) {
  if (!valor) return padrao;
  if (typeof valor === 'number') {
    return PROGRESSAO_DADOS_ATRIBUTO.includes(valor) ? valor : padrao;
  }
  const limpo = parseInt(String(valor).replace(/\D/g, ''), 10);
  return PROGRESSAO_DADOS_ATRIBUTO.includes(limpo) ? limpo : padrao;
}

/**
 * Aplica variação de passos na progressão oficial de dados de Fabula Ultima [6, 8, 10, 12, 20].
 * @param {number} facesBase
 * @param {number} [deltaPassos=0]
 * @param {number} [tetoFaces=20]
 * @returns {number}
 */
export function aplicarPassosDadoCombate(facesBase, deltaPassos = 0, tetoFaces = 20) {
  const faces = extrairFacesDadoCombate(facesBase, 8);
  const idxBase = Math.max(0, PROGRESSAO_DADOS_ATRIBUTO.indexOf(faces));
  const idxTeto = Math.max(0, PROGRESSAO_DADOS_ATRIBUTO.indexOf(tetoFaces));
  const idxFinal = Math.max(0, Math.min(idxTeto, idxBase + (Number(deltaPassos) || 0)));
  return PROGRESSAO_DADOS_ATRIBUTO[idxFinal];
}

/**
 * Normaliza siglas ou nomes de atributos para uma das chaves canônicas: 'des' | 'ast' | 'vig' | 'von'.
 * @param {string} attr
 * @param {string} [fallback='des']
 * @returns {string}
 */
export function normalizarChaveAtributo(attr, fallback = 'des') {
  const norm = normalizarTextoCore(String(attr || ''));
  if (norm.startsWith('des') || norm.startsWith('dex') || norm.startsWith('agi')) return 'des';
  if (norm.startsWith('ast') || norm.startsWith('ins') || norm.startsWith('int')) return 'ast';
  if (norm.startsWith('vig') || norm.startsWith('mig') || norm.startsWith('for')) return 'vig';
  if (norm.startsWith('von') || norm.startsWith('wlp') || norm.startsWith('esp')) return 'von';
  return fallback;
}

/**
 * Extrai atributos de fórmula textual de precisão (ex: "[DES + VIG] +1" -> { attr1: 'des', attr2: 'vig', bonus: 1 }).
 * @param {Object} stats
 * @returns {{ attr1: string, attr2: string, bonus: number }}
 */
function extrairFormulaArmaItem(stats = {}) {
  let attr1 = normalizarChaveAtributo(stats.attr1 || 'des', 'des');
  let attr2 = normalizarChaveAtributo(stats.attr2 || 'vig', 'vig');
  let bonus = parseInt(stats.precisao || stats.acerto || 0, 10) || 0;

  const formula = String(stats.precisao || '').toUpperCase();
  if (formula) {
    const matchAttrs = formula.match(/[([【]\s*([A-Z]{3})\s*\+\s*([A-Z]{3})\s*[)\]】]/);
    if (matchAttrs) {
      attr1 = normalizarChaveAtributo(matchAttrs[1], attr1);
      attr2 = normalizarChaveAtributo(matchAttrs[2], attr2);
    }
    const partes = formula.split(/[)\]】]/);
    if (partes.length > 1) {
      const matchBonus = partes[1].match(/\+\s*(\d+)/);
      if (matchBonus) {
        bonus = Math.max(bonus, parseInt(matchBonus[1], 10) || 0);
      }
    }
  }

  return { attr1, attr2, bonus };
}

/**
 * Extrai o perfil completo de rolagem de um combatente (Herói ou NPC)
 * puxando automaticamente os atributos reais, penalidades de condições ativas,
 * armas equipadas/ataques básicos e magias/feitiços cadastrados.
 * @param {Object} params
 * @param {Object} [params.combatente={}]
 * @param {Object|null} [params.ficha=null]
 * @param {Object|null} [params.npc=null]
 * @param {Object} [params.modificadoresCena={}]
 * @returns {Object}
 */
export function extrairPerfilRolagemCombatente({
  combatente = {},
  ficha = null,
  npc = null,
  modificadoresCena = {}
} = {}) {
  const condicoes = Array.isArray(combatente?.condicoes) ? combatente.condicoes : [];
  const modsCondicoesBrutos = calcularModificadoresCondicoesOficiais(condicoes);
  const modsCondicoes = {
    des: modsCondicoesBrutos.destreza || 0,
    ast: modsCondicoesBrutos.astucia || 0,
    vig: modsCondicoesBrutos.vigor || 0,
    von: modsCondicoesBrutos.vontade || 0
  };

  const emCrise = calcularStatusCrise(combatente?.hp_atual, combatente?.hp_max);
  const guardando = Boolean(combatente?.guardando);
  const decretoDanoExtra = Number(modificadoresCena?.decretoDanoExtra) || 0;

  // 1. Determina atributos base (Ficha do Herói ou Ficha do NPC)
  let desBase = 8;
  let astBase = 8;
  let vigBase = 8;
  let vonBase = 8;

  if (ficha) {
    const classesFicha = Array.isArray(ficha.classes) ? ficha.classes : (Array.isArray(ficha.fichas_classes) ? ficha.fichas_classes : []);
    const nivelTotal = classesFicha.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha.nivel) || 5;
    const bonusHeroicos = calcularBonusPassivosPoderesHeroicos(ficha.poderes_heroicos || [], nivelTotal);

    desBase = aplicarPassosDadoCombate(ficha.destreza, bonusHeroicos.aumentosAtributo?.destreza || 0, 12);
    astBase = aplicarPassosDadoCombate(ficha.astucia, bonusHeroicos.aumentosAtributo?.astucia || 0, 12);
    vigBase = aplicarPassosDadoCombate(ficha.vigor, bonusHeroicos.aumentosAtributo?.vigor || 0, 12);
    vonBase = aplicarPassosDadoCombate(ficha.vontade, bonusHeroicos.aumentosAtributo?.vontade || 0, 12);
  } else if (npc?.atributos) {
    desBase = extrairFacesDadoCombate(npc.atributos.des, 8);
    astBase = extrairFacesDadoCombate(npc.atributos.ast, 8);
    vigBase = extrairFacesDadoCombate(npc.atributos.vig, 8);
    vonBase = extrairFacesDadoCombate(npc.atributos.von, 8);
  }

  const atributosBase = { des: desBase, ast: astBase, vig: vigBase, von: vonBase };
  const atributosAtuais = {
    des: aplicarPassosDadoCombate(desBase, modsCondicoes.des, 20),
    ast: aplicarPassosDadoCombate(astBase, modsCondicoes.ast, 20),
    vig: aplicarPassosDadoCombate(vigBase, modsCondicoes.vig, 20),
    von: aplicarPassosDadoCombate(vonBase, modsCondicoes.von, 20)
  };

  // 2. Extrai armas / ataques, magias e habilidades ativas
  const armas = [];
  const magias = [];
  const habilidades = [];

  if (ficha) {
    const classesFicha = Array.isArray(ficha.classes) ? ficha.classes : (Array.isArray(ficha.fichas_classes) ? ficha.fichas_classes : []);
    const todosItens = Array.isArray(ficha.itens) ? ficha.itens : [];
    const itensEquipados = todosItens.filter((i) => i.equipado || i.stats_personalizados?.slot);
    const passivosCore = calcularPassivosCoreClasses({
      classes: classesFicha,
      ficha,
      itensEquipados,
      emCrise
    });

    const nivelTotal = classesFicha.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha.nivel) || 5;
    const temFeiticoPoderoso = (ficha.poderes_heroicos || []).some((p) => {
      const txt = normalizarTextoCore(typeof p === 'string' ? p : `${p?.key || ''} ${p?.nome || ''}`);
      return txt.includes('feitico poderoso');
    });
    const bonusFeiticoPoderoso = temFeiticoPoderoso ? (nivelTotal >= 40 ? 10 : 5) : 0;

    // Armas equipadas nas mãos (excluindo armaduras, trajes/vestimentas, escudos e acessórios)
    const armasMaos = [];
    const nomesArmasVistas = new Set();

    itensEquipados.forEach((i) => {
      const slot = i.stats_personalizados?.slot || i.slot || '';
      const tipo = normalizarTextoCore(i.tipo || '');
      const ehArmaduraOuAcessorio =
        tipo.includes('armadura') ||
        tipo.includes('vestimenta') ||
        tipo.includes('traje') ||
        tipo.includes('escudo') ||
        tipo.includes('acessorio') ||
        slot === 'armadura' ||
        slot === 'acessorio' ||
        i.stats_personalizados?.escudo === true;

      if (ehArmaduraOuAcessorio) return;

      const ehSlotMao = slot === 'mao_dominante' || slot === 'mao_secundaria';
      const ehTipoArma =
        tipo.includes('arma') ||
        tipo.includes('corpo_a_corpo') ||
        tipo.includes('distancia') ||
        tipo.includes('arco') ||
        tipo.includes('espada') ||
        tipo.includes('lanca') ||
        tipo.includes('adaga') ||
        tipo.includes('machado') ||
        tipo.includes('mangual') ||
        tipo.includes('pistola') ||
        tipo.includes('fogo');

      if (ehSlotMao || ehTipoArma) {
        const chaveArma = `${i.id || ''}_${i.nome || ''}`;
        if (!nomesArmasVistas.has(chaveArma)) {
          nomesArmasVistas.add(chaveArma);
          armasMaos.push(i);
        }
      }
    });

    const adicionarArmaEquipadaNoPerfil = (itemAlvo, sufixoId = '', ehSegundaForma = false) => {
      const stats = itemAlvo.stats_personalizados || itemAlvo.stats || {};
      const alcanceTexto = normalizarTextoCore(`${stats.alcance || ''} ${stats.categoria || ''} ${itemAlvo.tipo || ''}`);
      const ehDistancia =
        alcanceTexto.includes('distancia') ||
        alcanceTexto.includes('arco') ||
        alcanceTexto.includes('fogo') ||
        alcanceTexto.includes('arremesso') ||
        alcanceTexto.includes('besta');

      const { attr1, attr2, bonus: bonusArma } = extrairFormulaArmaItem(stats);
      const bonusMaestria = ehDistancia ? passivosCore.bonusPrecisaoDistancia : passivosCore.bonusPrecisaoCorpoACorpo;

      const valorDanoBruto = stats.dano_fixo ?? stats.dano ?? stats.bonus_dano ?? 5;
      let danoArma = 0;
      if (typeof valorDanoBruto === 'number') {
        danoArma = valorDanoBruto;
      } else {
        const str = String(valorDanoBruto);
        const matchDano = str.includes('+') ? str.split('+').pop() : str;
        danoArma = parseInt(matchDano, 10) || 0;
      }

      const atingeVoadores = ehDistancia || armaAtingeVoadores(itemAlvo);
      const resumoCarac = extrairResumoCaracteristicasEquipamento(itemAlvo);
      const efeitosTexto = Array.isArray(stats.efeitos) ? stats.efeitos.join(' • ') : '';

      armas.push({
        id: `${itemAlvo.id || 'arma'}${sufixoId}`,
        nome: itemAlvo.nome || 'Arma Equipada',
        attr1,
        attr2,
        bonusPrecisao: bonusArma + bonusMaestria,
        bonusDano: danoArma + passivosCore.bonusDanoAdrenalinaCrise + decretoDanoExtra,
        tipoDano: normalizarTextoCore(stats.tipo_dano || 'fisico') || 'fisico',
        alcance: ehDistancia ? 'distancia' : 'corpo_a_corpo',
        isPadrao: false,
        atingeVoadores,
        ehSegundaForma,
        especiesCacadora: resumoCarac.especiesCacadora,
        efeito: efeitosTexto
      });
    };

    armasMaos.forEach((item, idx) => {
      adicionarArmaEquipadaNoPerfil(item, `_${idx}`, false);
      const resumoCarac = extrairResumoCaracteristicasEquipamento(item);
      if (resumoCarac.segundaForma) {
        const itemForma2 = obterItemFormaAtivaArmaMutavel(item, true);
        adicionarArmaEquipadaNoPerfil(itemForma2, `_${idx}_forma2`, true);
      }
    });

    // Golpe Desarmado só é exibido se o personagem NÃO possuir nenhuma arma equipada
    if (armas.length === 0) {
      armas.push({
        id: 'desarmado',
        nome: 'Golpe Desarmado',
        attr1: 'des',
        attr2: 'vig',
        bonusPrecisao: passivosCore.bonusPrecisaoCorpoACorpo,
        bonusDano: passivosCore.bonusDanoAdrenalinaCrise + decretoDanoExtra,
        tipoDano: 'fisico',
        alcance: 'corpo_a_corpo',
        isPadrao: true,
        atingeVoadores: false
      });
    }

    // Feitiços aprendidos da ficha (incluindo Quimerista e Arcanista) sem duplicatas
    const chavesMagiasVistas = new Set();
    const listaMagias = Array.isArray(ficha.magias) ? ficha.magias : [];
    listaMagias.forEach((m, idx) => {
      const nomeM = m.nome || 'Feitiço';
      const chave = m.id || nomeM;
      if (chavesMagiasVistas.has(chave)) return;
      chavesMagiasVistas.add(chave);

      const matchPm = String(m.custo_mp || m.custo_pm || '').match(/\d+/);
      const custoBase = matchPm ? parseInt(matchPm[0], 10) || 0 : 10;
      magias.push({
        id: m.id || `magia_${idx}`,
        nome: nomeM,
        attr1: 'ast',
        attr2: 'von',
        bonusPrecisao: passivosCore.bonusTesteArtilhariaMagica,
        bonusDano: bonusFeiticoPoderoso + decretoDanoExtra,
        custoPm: modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase,
        ofensiva: true,
        descricao: m.descricao || ''
      });
    });

    classesFicha.forEach((c, cIdx) => {
      // Magias aprendidas de Quimerista
      const magiasQuim = extrairMagiasQuimerista(c, ficha);
      magiasQuim.forEach((mq, mIdx) => {
        const nomeQuim = mq.nome || `Feitiço Quimérico ${mIdx + 1}`;
        const chave = mq.id || nomeQuim;
        if (chavesMagiasVistas.has(chave)) return;
        chavesMagiasVistas.add(chave);

        const matchPm = String(mq.custo_pm || mq.custo_mp || mq.custo || '').match(/\d+/);
        const custoBase = matchPm ? parseInt(matchPm[0], 10) || 0 : 10;
        const attrQuim = extrairAtributoQuimerista(c, ficha) || 'ast';
        magias.push({
          id: mq.id || `quim_${cIdx}_${mIdx}`,
          nome: nomeQuim,
          attr1: normalizarChaveAtributo(mq.attr1 || attrQuim, 'ast'),
          attr2: normalizarChaveAtributo(mq.attr2 || 'von', 'von'),
          bonusPrecisao: passivosCore.bonusTesteArtilhariaMagica,
          bonusDano: bonusFeiticoPoderoso + decretoDanoExtra,
          custoPm: modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase,
          ofensiva: true,
          descricao: mq.descricao || mq.efeito || ''
        });
      });

      // Arcanos vinculados de Arcanista
      const arcanos = extrairArcanosVinculados(c, ficha);
      arcanos.forEach((arc, aIdx) => {
        const nomeArcano = typeof arc === 'string' ? arc : (arc?.nome || `Arcano ${aIdx + 1}`);
        const chave = `arcano_${nomeArcano}`;
        if (chavesMagiasVistas.has(chave)) return;
        chavesMagiasVistas.add(chave);

        const descArcano = typeof arc === 'string' ? '' : (arc?.efeito_invocacao || arc?.efeito_descarte || arc?.descricao || '');
        magias.push({
          id: `arcano_${cIdx}_${aIdx}`,
          nome: `Invocar: ${nomeArcano}`,
          attr1: 'ast',
          attr2: 'von',
          bonusPrecisao: passivosCore.bonusTesteArtilhariaMagica,
          bonusDano: bonusFeiticoPoderoso + decretoDanoExtra,
          custoPm: modificadoresCena?.decretoDobrarPm ? 80 : 40,
          ofensiva: false,
          descricao: descArcano
        });
      });
    });

    // Habilidades ativas/usáveis em combate da ficha
    classesFicha.forEach((c) => {
      const habsClasse = Array.isArray(c.habilidades) ? c.habilidades : [];
      habsClasse.forEach((h, hIdx) => {
        const nivelHab = Number(h?.nivel ?? 0);
        if (nivelHab > 0) {
          const nomeHab = h?.nome || `Habilidade ${hIdx + 1}`;
          const nomeNorm = normalizarTextoCore(nomeHab);
          const ehPassivoEstatistica =
            nomeNorm.includes('aumento de pv') ||
            nomeNorm.includes('aumento de pm') ||
            nomeNorm.includes('aumento de pi') ||
            nomeNorm.includes('pontos de vida') ||
            nomeNorm.includes('pontos de mente');

          if (!ehPassivoEstatistica) {
            habilidades.push({
              id: h.id || `hab_${c.nome_classe || 'cls'}_${hIdx}`,
              nome: nomeHab,
              nivel: nivelHab,
              classe: c.nome_classe || '',
              descricao: h.descricao || h.efeito || '',
              custoPm: Number(h.custo_pm || h.custoPm || 0)
            });
          }
        }
      });
    });
  } else {
    // NPC do catálogo ou Inimigo manual
    const nivelNpc = Number(npc?.nivel) || 5;
    const bonusPrecisaoNivel = Math.floor(nivelNpc / 10);
    const bonusDanoNivel = nivelNpc >= 60 ? 15 : nivelNpc >= 40 ? 10 : nivelNpc >= 20 ? 5 : 0;

    const ataquesNpc = Array.isArray(npc?.ataques_basicos) ? npc.ataques_basicos : [];
    ataquesNpc.forEach((atk, idx) => {
      const infoAtk = formatarAtaqueBasicoNpc(atk);
      const alcanceAtk = normalizarTextoCore(atk.alcance || atk.tipo_alcance || '');
      const ehDistanciaAtk = alcanceAtk.includes('distancia');
      const atingeVoadoresAtk = ehDistanciaAtk || armaAtingeVoadores(atk) || Boolean(atk.atinge_voadores);
      armas.push({
        id: `npc_atk_${idx}`,
        nome: atk.nome || `Ataque ${idx + 1}`,
        attr1: normalizarChaveAtributo(atk.atributo_dado1 || 'des', 'des'),
        attr2: normalizarChaveAtributo(atk.atributo_dado2 || 'vig', 'vig'),
        bonusPrecisao: infoAtk.modPrecisao + bonusPrecisaoNivel,
        bonusDano: infoAtk.bonusDano + bonusDanoNivel + decretoDanoExtra,
        tipoDano: normalizarTextoCore(infoAtk.tipoDano || 'fisico') || 'fisico',
        alcance: ehDistanciaAtk ? 'distancia' : 'corpo_a_corpo',
        isPadrao: idx === 0,
        atingeVoadores: atingeVoadoresAtk,
        condicao: infoAtk.condicao,
        efeito: infoAtk.efeito,
        resumoEfeito: infoAtk.resumoEfeito
      });
    });

    if (armas.length === 0) {
      armas.push({
        id: 'npc_padrao',
        nome: 'Ataque Básico',
        attr1: 'des',
        attr2: 'vig',
        bonusPrecisao: bonusPrecisaoNivel,
        bonusDano: 5 + bonusDanoNivel + decretoDanoExtra,
        tipoDano: 'fisico',
        alcance: 'corpo_a_corpo',
        isPadrao: true
      });
    }

    const feiticosNpc = Array.isArray(npc?.feiticos) ? npc.feiticos : [];
    feiticosNpc.forEach((f, idx) => {
      const custoBase = parseInt(String(f.pm_custo || 10).replace(/\D/g, ''), 10) || 10;
      magias.push({
        id: `npc_mag_${idx}`,
        nome: f.nome || `Feitiço ${idx + 1}`,
        attr1: 'ast',
        attr2: 'von',
        bonusPrecisao: bonusPrecisaoNivel,
        bonusDano: 5 + bonusDanoNivel + decretoDanoExtra,
        custoPm: modificadoresCena?.decretoDobrarPm ? custoBase * 2 : custoBase,
        ofensiva: true,
        descricao: f.descricao || ''
      });
    });
  }

  const poderesNpcFormatados = Array.isArray(npc?.poderes)
    ? npc.poderes.map(formatarPoderNpcParaExibicao)
    : [];

  return {
    possuiFichaVinculada: Boolean(ficha || npc),
    origemNome: ficha?.nome_personagem || npc?.nome || combatente?.nome || 'Combatente',
    atributosBase,
    atributosAtuais,
    modsCondicoes,
    defesa: Number(ficha?.defesa ?? npc?.defesa ?? atributosAtuais.des),
    mdef: Number(ficha?.mdef ?? npc?.defesa_magica ?? atributosAtuais.ast),
    iniciativaMod: Number(npc?.iniciativa ?? 0),
    bonusGuardaOposto: guardando ? 2 : 0,
    emCrise,
    armas,
    magias,
    habilidades: ficha ? habilidades : poderesNpcFormatados,
    poderes: poderesNpcFormatados
  };
}

/**
 * Executa uma rolagem oficial de Fabula Ultima (2 dados de Atributo + Modificador)
 * para Testes de Atributo, Resistência, Iniciativa, Ataques com Armas ou Feitiços,
 * gerando o resultado detalhado e a entrada para o Feed de Ações em tempo real.
 * @param {Object} params
 * @returns {Object}
 */
export function rolarDadosCombate({
  combatente = {},
  perfil = null,
  categoria = 'atributo',
  titulo = 'Teste de Atributo',
  attr1 = 'des',
  attr2 = 'des',
  bonusTeste = 0,
  bonusDano = 0,
  calcularDano = false,
  zerarHr = false,
  isMulti = false,
  isOposto = false,
  tipoDano = 'fisico',
  custoPm = 0,
  ndAlvo = null,
  condicao = '',
  efeito = '',
  valoresFixos = null
} = {}) {
  const k1 = normalizarChaveAtributo(attr1, 'des');
  const k2 = normalizarChaveAtributo(attr2, 'des');

  const faces1 = perfil?.atributosAtuais?.[k1] || 8;
  const faces2 = perfil?.atributosAtuais?.[k2] || 8;
  const sigla1 = ATRIBUTOS_CONFLITO[k1]?.sigla || 'DES';
  const sigla2 = ATRIBUTOS_CONFLITO[k2]?.sigla || 'DES';

  const d1 = valoresFixos?.d1 !== undefined
    ? Number(valoresFixos.d1)
    : Math.floor(Math.random() * faces1) + 1;
  const d2 = valoresFixos?.d2 !== undefined
    ? Number(valoresFixos.d2)
    : Math.floor(Math.random() * faces2) + 1;

  const bonusGuarda = isOposto && (perfil?.bonusGuardaOposto || combatente?.guardando) ? 2 : 0;
  const modificadorTotal = (Number(bonusTeste) || 0) + bonusGuarda;
  const total = d1 + d2 + modificadorTotal;

  const hrBruto = Math.max(d1, d2);
  const hr = zerarHr ? 0 : hrBruto;

  const isFumble = d1 === 1 && d2 === 1;
  const isCritico = !isFumble && d1 === d2 && d1 >= 6;
  const statusCritico = isCritico
    ? 'Sucesso Crítico!'
    : isFumble
      ? 'Erro Crítico (Fumble)!'
      : null;

  const bonusDanoEfetivo = isMulti ? 0 : (Number(bonusDano) || 0);
  const danoTotal = calcularDano ? Math.max(0, hr + bonusDanoEfetivo) : null;

  const sucessoNd = ndAlvo !== null
    ? (!isFumble && (isCritico || total >= Number(ndAlvo)))
    : null;

  const modStr = modificadorTotal !== 0
    ? (modificadorTotal > 0 ? ` + ${modificadorTotal}` : ` - ${Math.abs(modificadorTotal)}`)
    : '';

  const formulaDados = `[${sigla1} d${faces1}: ${d1} + ${sigla2} d${faces2}: ${d2}]${modStr}`;
  const partesDetalhe = [
    `${formulaDados} = ${total}`,
    `RA: ${hr}`
  ];

  if (calcularDano && danoTotal !== null) {
    partesDetalhe.push(`Dano: ${danoTotal} (${tipoDano})`);
  }
  if (bonusGuarda > 0) {
    partesDetalhe.push('Guarda (+2 Oposto)');
  }
  if (ndAlvo !== null) {
    partesDetalhe.push(sucessoNd ? `Sucesso (ND ${ndAlvo})` : `Falha (ND ${ndAlvo})`);
  }
  if (statusCritico) {
    partesDetalhe.push(statusCritico);
  }
  if (efeito) {
    partesDetalhe.push(`Efeito: ${efeito}`);
  } else if (condicao) {
    partesDetalhe.push(`Condição: ${condicao}`);
  }

  const detalhes = partesDetalhe.join(' • ');
  const nomeAutor = combatente?.nome || perfil?.origemNome || 'Combatente';

  return {
    autorNome: nomeAutor,
    categoria,
    titulo,
    attr1: k1,
    attr2: k2,
    sigla1,
    sigla2,
    faces1,
    faces2,
    d1,
    d2,
    modificadorTotal,
    bonusGuarda,
    total,
    hr,
    calcularDano,
    bonusDanoEfetivo,
    danoTotal,
    tipoDano,
    custoPm: Number(custoPm) || 0,
    condicao: condicao || '',
    efeito: efeito || '',
    isCritico,
    isFumble,
    statusCritico,
    sucessoNd,
    formulaDados,
    detalhes,
    logEntry: {
      combatente_id: combatente?.id || null,
      autor_nome: nomeAutor,
      autor_tipo: combatente?.tipo || 'heroi',
      acao_codigo: 'ROLAGEM_DADOS',
      acao_titulo: `🎲 ${titulo}`,
      detalhes,
      metadata: {
        rolagem: {
          categoria,
          titulo,
          sigla1,
          faces1,
          d1,
          sigla2,
          faces2,
          d2,
          modificadorTotal,
          total,
          hr,
          calcularDano,
          danoTotal,
          tipoDano,
          isCritico,
          isFumble,
          statusCritico
        }
      }
    }
  };
}

