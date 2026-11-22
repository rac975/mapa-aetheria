/**
 * Fabula Ultima - Regras Puras de Oportunidades (Sucesso Crítico e Falha Crítica)
 * Livro Básico p. 41:
 * - Sucesso Crítico ou Falha Crítica de Herói -> Mestre escolhe a Oportunidade.
 * - Sucesso Crítico ou Falha Crítica de Inimigo -> Heróis escolhem/votam na Oportunidade.
 */

export const CATALOGO_OPORTUNIDADES_FABULA = [
  {
    codigo: 'AFETAR',
    titulo: 'Afetar (Condição)',
    icone: '⚡',
    descricao: 'Uma criatura sofre uma condição tática (Lento, Confuso, Fraco ou Abalado).'
  },
  {
    codigo: 'FAVORECER',
    titulo: 'Favorecer (+4 no Próximo Teste)',
    icone: '✨',
    descricao: 'O próximo teste realizado por um combatente aliado recebe um bônus de +4.'
  },
  {
    codigo: 'REVELAR',
    titulo: 'Revelar Traço ou Afinidade',
    icone: '👁️',
    descricao: 'Descobre imediatamente uma Afinidade Elemental, Traço ou Regra Especial de um adversário.'
  },
  {
    codigo: 'LACO',
    titulo: 'Criar ou Fortalecer Laço',
    icone: '❤️',
    descricao: 'Cria um novo Laço ou adiciona uma emoção a um Laço existente na cena.'
  },
  {
    codigo: 'RELOGIO',
    titulo: 'Preencher ou Apagar Relógio',
    icone: '🕒',
    descricao: 'Preenche ou apaga 1 seção de um Relógio de Conflito ou Objetivo ativo.'
  },
  {
    codigo: 'GOLPE_RECURSO',
    titulo: 'Impacto ou Drenagem Extra',
    icone: '💥',
    descricao: 'Causa perda extra de PV/PM, ou recupera PM/PI tático durante a brecha.'
  },
  {
    codigo: 'ELEMENTO_CENA',
    titulo: 'Alterar Elemento da Cena',
    icone: '🌋',
    descricao: 'Introduz uma mudança ambiental, vantagem de terreno ou reviravolta narrativa.'
  },
  {
    codigo: 'PASSO_TATICO',
    titulo: 'Quebrar Guarda / Desarmar',
    icone: '🛡️',
    descricao: 'Anula postura de Guarda, cobertura ou compromete temporariamente um item.'
  }
];

/**
 * Cria um evento de Oportunidade quando ocorre um Sucesso Crítico ou Falha Crítica.
 * @param {Object} params
 * @param {Object} params.combatente
 * @param {Object} params.resultadoRolagem
 * @param {string} [params.origemAcao='']
 * @returns {Object|null}
 */
export function criarEventoOportunidade({
  combatente,
  resultadoRolagem,
  origemAcao = ''
} = {}) {
  if (!resultadoRolagem || (!resultadoRolagem.isCritico && !resultadoRolagem.isFumble)) {
    return null;
  }

  const autorTipo = combatente?.tipo === 'heroi' ? 'heroi' : 'inimigo';
  const tipoEvento = resultadoRolagem.isCritico ? 'critico' : 'fumble';
  const responsavelEscolha = autorTipo === 'heroi' ? 'mestre' : 'herois';

  const rotuloEvento = tipoEvento === 'critico' ? 'Sucesso Crítico' : 'Falha Crítica';
  const autorNome = combatente?.nome || resultadoRolagem.autorNome || 'Combatente';

  return {
    id: `opp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    autorId: combatente?.id || null,
    autorNome,
    autorTipo,
    tipoEvento,
    rotuloEvento,
    responsavelEscolha,
    tituloRolagem: origemAcao || resultadoRolagem.titulo || 'Teste de Combate',
    dadosRolados: `[${resultadoRolagem.d1 ?? '?'}, ${resultadoRolagem.d2 ?? '?'}]`,
    totalRolado: resultadoRolagem.total ?? 0,
    votos: {},
    criadoEm: new Date().toISOString()
  };
}

/**
 * Registra o voto de um herói/jogador em uma opção de Oportunidade.
 * @param {Object} oportunidadeAtiva
 * @param {string} votanteChave
 * @param {string} codigoOportunidade
 * @returns {Object}
 */
export function registrarVotoOportunidade(oportunidadeAtiva, votanteChave, codigoOportunidade) {
  if (!oportunidadeAtiva || !votanteChave || !codigoOportunidade) return oportunidadeAtiva;
  const votosAtuais = oportunidadeAtiva.votos && typeof oportunidadeAtiva.votos === 'object'
    ? oportunidadeAtiva.votos
    : {};

  return {
    ...oportunidadeAtiva,
    votos: {
      ...votosAtuais,
      [String(votanteChave)]: codigoOportunidade
    }
  };
}

/**
 * Contabiliza os votos registrados e retorna o placar por código e a opção mais votada.
 * @param {Object} oportunidadeAtiva
 * @param {string|null} [codigoSelecionadoDireto=null]
 * @returns {{
 *   contagemPorCodigo: Object,
 *   totalVotos: number,
 *   codigoVencedor: string,
 *   oportunidadeObj: Object
 * }}
 */
export function obterOportunidadeVencedora(oportunidadeAtiva, codigoSelecionadoDireto = null) {
  const votosObj = oportunidadeAtiva?.votos && typeof oportunidadeAtiva.votos === 'object'
    ? oportunidadeAtiva.votos
    : {};

  const contagemPorCodigo = {};
  let totalVotos = 0;

  Object.values(votosObj).forEach((cod) => {
    if (!cod) return;
    contagemPorCodigo[cod] = (contagemPorCodigo[cod] || 0) + 1;
    totalVotos += 1;
  });

  let codigoVencedor = codigoSelecionadoDireto || null;
  if (!codigoVencedor) {
    let maior = -1;
    CATALOGO_OPORTUNIDADES_FABULA.forEach((op) => {
      const qtd = contagemPorCodigo[op.codigo] || 0;
      if (qtd > maior) {
        maior = qtd;
        codigoVencedor = op.codigo;
      }
    });
  }

  if (!codigoVencedor) {
    codigoVencedor = CATALOGO_OPORTUNIDADES_FABULA[0].codigo;
  }

  const oportunidadeObj =
    CATALOGO_OPORTUNIDADES_FABULA.find((o) => o.codigo === codigoVencedor) ||
    CATALOGO_OPORTUNIDADES_FABULA[0];

  return {
    contagemPorCodigo,
    totalVotos,
    codigoVencedor,
    oportunidadeObj
  };
}

/**
 * Constrói o registro do feed de combate para a oportunidade confirmada.
 */
export function construirLogOportunidadeAplicada(oportunidadeAtiva, codigoEscolhido, detalheExtra = '') {
  const { oportunidadeObj, totalVotos } = obterOportunidadeVencedora(oportunidadeAtiva, codigoEscolhido);
  const quemEscolheu = oportunidadeAtiva?.responsavelEscolha === 'mestre'
    ? 'Escolhida pelo Mestre'
    : `Escolhida pelos Heróis${totalVotos > 0 ? ` (${totalVotos} voto(s))` : ''}`;

  const complemento = detalheExtra && detalheExtra.trim() ? ` — ${detalheExtra.trim()}` : '';

  return {
    combatente_id: oportunidadeAtiva?.autorId || null,
    autor_nome: oportunidadeAtiva?.autorNome || 'Combate',
    autor_tipo: oportunidadeAtiva?.autorTipo || 'sistema',
    acao_codigo: `OPORTUNIDADE_${oportunidadeObj.codigo}`,
    acao_titulo: `${oportunidadeObj.icone} Oportunidade: ${oportunidadeObj.titulo}`,
    detalhes: `[${oportunidadeAtiva?.rotuloEvento || 'Crítico'} em ${oportunidadeAtiva?.tituloRolagem || 'Teste'}] (${quemEscolheu}): ${oportunidadeObj.descricao}${complemento}`,
    metadata: {
      oportunidade_codigo: oportunidadeObj.codigo,
      tipo_evento: oportunidadeAtiva?.tipoEvento,
      responsavel: oportunidadeAtiva?.responsavelEscolha
    }
  };
}
