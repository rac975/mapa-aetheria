/**
 * Fabula Ultima - Regras Puras de Oportunidades Oficiais (Livro Básico p. 41)
 *
 * Sucesso Crítico ou Falha Crítica geram uma Oportunidade:
 * - Se gerada por Herói -> Mestre escolhe a Oportunidade.
 * - Se gerada por Inimigo -> Heróis escolhem/votam na Oportunidade.
 */

import {
  CATALOGO_OPORTUNIDADES_FABULA,
  ALIAS_OPORTUNIDADES_LEGADAS
} from './opportunitiesCatalog.js';

export { CATALOGO_OPORTUNIDADES_FABULA, ALIAS_OPORTUNIDADES_LEGADAS };

export function normalizarCodigoOportunidade(codigo) {
  const c = String(codigo || '').toUpperCase();
  return ALIAS_OPORTUNIDADES_LEGADAS[c] || c;
}

export function obterOportunidadePorCodigo(codigo) {
  const cNorm = normalizarCodigoOportunidade(codigo);
  return (
    CATALOGO_OPORTUNIDADES_FABULA.find((o) => o.codigo === cNorm) ||
    CATALOGO_OPORTUNIDADES_FABULA[0]
  );
}

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

export function registrarVotoOportunidade(oportunidadeAtiva, votanteChave, codigoOportunidade) {
  if (!oportunidadeAtiva || !votanteChave || !codigoOportunidade) return oportunidadeAtiva;
  const cNorm = normalizarCodigoOportunidade(codigoOportunidade);
  const votosAtuais = oportunidadeAtiva.votos && typeof oportunidadeAtiva.votos === 'object'
    ? oportunidadeAtiva.votos
    : {};

  return {
    ...oportunidadeAtiva,
    votos: {
      ...votosAtuais,
      [String(votanteChave)]: cNorm
    }
  };
}

export function obterOportunidadeVencedora(oportunidadeAtiva, codigoSelecionadoDireto = null) {
  const votosObj = oportunidadeAtiva?.votos && typeof oportunidadeAtiva.votos === 'object'
    ? oportunidadeAtiva.votos
    : {};

  const contagemPorCodigo = {};
  let totalVotos = 0;

  Object.values(votosObj).forEach((cod) => {
    if (!cod) return;
    const cNorm = normalizarCodigoOportunidade(cod);
    contagemPorCodigo[cNorm] = (contagemPorCodigo[cNorm] || 0) + 1;
    totalVotos += 1;
  });

  let codigoVencedor = codigoSelecionadoDireto ? normalizarCodigoOportunidade(codigoSelecionadoDireto) : null;
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

  const oportunidadeObj = obterOportunidadePorCodigo(codigoVencedor);

  return {
    contagemPorCodigo,
    totalVotos,
    codigoVencedor,
    oportunidadeObj
  };
}

export function resolverEfeitoOportunidade({
  codigo,
  dadosEfeito = {},
  participantes = [],
  relogios = []
} = {}) {
  const codNorm = normalizarCodigoOportunidade(codigo);

  if (codNorm === 'AFLICAO' && dadosEfeito.alvoId && dadosEfeito.condicao) {
    const part = participantes.find((p) => String(p.id) === String(dadosEfeito.alvoId));
    if (part) {
      const condsAtuais = Array.isArray(part.condicoes) ? [...part.condicoes] : [];
      const condNova = dadosEfeito.condicao.toLowerCase().trim();
      if (!condsAtuais.includes(condNova)) condsAtuais.push(condNova);
      return {
        tipo: 'AFLICAO',
        alvoId: part.id,
        alvoNome: part.nome,
        condicao: condNova,
        updatesParticipante: { id: part.id, condicoes: condsAtuais }
      };
    }
  }

  if (codNorm === 'VANTAGEM' && dadosEfeito.alvoId) {
    const part = participantes.find((p) => String(p.id) === String(dadosEfeito.alvoId));
    if (part) {
      const mods = { ...(part.modificadores || {}), bonus_proximo_teste: 4 };
      return {
        tipo: 'VANTAGEM',
        alvoId: part.id,
        alvoNome: part.nome,
        updatesParticipante: { id: part.id, modificadores: mods }
      };
    }
  }

  if (codNorm === 'PROGRESSO' && dadosEfeito.relogioId) {
    const rel = relogios.find((r) => String(r.id) === String(dadosEfeito.relogioId));
    if (rel) {
      const maxSec = Number(rel.fatias_total || rel.secoes_max || rel.tamanho || 4);
      const preenchidasAtual = Number(rel.fatias_atuais ?? rel.secoes_preenchidas ?? rel.preenchido ?? 0);
      const delta = Math.min(2, Math.max(-2, Number(dadosEfeito.deltaRelogio) || 1));
      const novaQtd = Math.max(0, Math.min(maxSec, preenchidasAtual + delta));
      return {
        tipo: 'PROGRESSO',
        relogioId: rel.id,
        relogioNome: rel.titulo || rel.nome || 'Relógio',
        deltaRelogio: delta,
        updatesRelogio: { id: rel.id, fatias_atuais: novaQtd, secoes_preenchidas: novaQtd }
      };
    }
  }

  return { tipo: codNorm };
}

export function construirLogOportunidadeAplicada(
  oportunidadeAtiva,
  codigoEscolhido,
  detalheExtra = '',
  efeitoResolvido = null
) {
  const oportunidadeObj = obterOportunidadePorCodigo(codigoEscolhido || oportunidadeAtiva?.votos);
  const quemEscolheu = oportunidadeAtiva?.responsavelEscolha === 'mestre'
    ? 'Escolhida pelo Mestre'
    : 'Escolhida pelos Heróis';

  const partes = [oportunidadeObj.descricao];

  if (efeitoResolvido?.tipo === 'AFLICAO' && efeitoResolvido.alvoNome && efeitoResolvido.condicao) {
    partes.push(`Condição ${efeitoResolvido.condicao.toUpperCase()} aplicada em ${efeitoResolvido.alvoNome}`);
  } else if (efeitoResolvido?.tipo === 'VANTAGEM' && efeitoResolvido.alvoNome) {
    partes.push(`+4 no próximo teste de ${efeitoResolvido.alvoNome}`);
  } else if (efeitoResolvido?.tipo === 'PROGRESSO' && efeitoResolvido.relogioNome) {
    const acaoTexto = efeitoResolvido.deltaRelogio > 0 ? `Preencheu +${efeitoResolvido.deltaRelogio}` : `Apagou ${efeitoResolvido.deltaRelogio}`;
    partes.push(`${acaoTexto} seção(ões) de "${efeitoResolvido.relogioNome}"`);
  }

  if (detalheExtra && detalheExtra.trim()) {
    partes.push(detalheExtra.trim());
  }

  return {
    combatente_id: oportunidadeAtiva?.autorId || null,
    autor_nome: oportunidadeAtiva?.autorNome || 'Combate',
    autor_tipo: oportunidadeAtiva?.autorTipo || 'sistema',
    acao_codigo: `OPORTUNIDADE_${oportunidadeObj.codigo}`,
    acao_titulo: `${oportunidadeObj.icone} Oportunidade: ${oportunidadeObj.titulo}`,
    detalhes: `[${oportunidadeAtiva?.rotuloEvento || 'Crítico'} em ${oportunidadeAtiva?.tituloRolagem || 'Teste'}] (${quemEscolheu}): ${partes.join(' • ')}`,
    metadata: {
      oportunidade_codigo: oportunidadeObj.codigo,
      tipo_evento: oportunidadeAtiva?.tipoEvento,
      responsavel: oportunidadeAtiva?.responsavelEscolha,
      efeito_resolvido: efeitoResolvido || null
    }
  };
}
