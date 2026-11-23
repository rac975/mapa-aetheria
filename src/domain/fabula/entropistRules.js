/**
 * Fabula Ultima - Regras da Classe Entropista (Entropist)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesEntropista({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('entropista') || nome.includes('entropist');
  });

  const nvAbsorverPm = obterNivelHabilidade(listaClasses, 'entropista', 'absorver pm');
  const nvSeteDaSorte = obterNivelHabilidade(listaClasses, 'entropista', 'sete da sorte');
  const nvTempoRoubado = obterNivelHabilidade(listaClasses, 'entropista', 'tempo roubado');

  return {
    temClasse,
    habilidades: {
      absorverPm: {
        nivel: nvAbsorverPm,
        ativo: nvAbsorverPm > 0,
        pmRecuperadoAoSofrerDano: nvAbsorverPm * 2
      },
      seteDaSorte: {
        nivel: nvSeteDaSorte,
        ativo: nvSeteDaSorte > 0
      },
      tempoRoubado: {
        nivel: nvTempoRoubado,
        ativo: nvTempoRoubado > 0,
        maxCustoPm: nvTempoRoubado * 5,
        danoInimigoLento: 10 + (nvTempoRoubado * 5)
      }
    }
  };
}

export function gerarAcoesConflitoEntropista({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesEntropista({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  if (dados.habilidades.tempoRoubado.ativo) {
    const np = dados.habilidades.tempoRoubado.nivel;
    const danoLento = 10 + (np * 5);
    acoes.push({
      id: 'entropista_tempo_roubado',
      codigo: 'TEMPO_ROUBADO',
      nome: `⏳ Tempo Roubado (5 a ${np * 5} PM • Controle Temporal)`,
      nomeCurto: 'Tempo Roubado',
      tipo: 'acao_combate',
      classe: 'Entropista',
      nivel: np,
      custoPm: 5,
      danoInimigoLento: danoLento,
      descricao: `Gasta 5 a ${np * 5} PM (5 PM por opção): aplicar Lento, remover Lento, ação Equipamento livre, causar ${danoLento} de dano a inimigo já Lento, ou acelerar turno de um aliado.`
    });
  }

  if (dados.habilidades.seteDaSorte.ativo) {
    acoes.push({
      id: 'entropista_sete_da_sorte',
      codigo: 'SETE_DA_SORTE',
      nome: '🎲 Sete da Sorte (1x por Cena • Trocar Dado)',
      nomeCurto: 'Sete da Sorte',
      tipo: 'reacao_combate',
      classe: 'Entropista',
      isAcaoExtra: true,
      descricao: 'Uma vez por cena, após fazer um teste, substitui um dado rolado pelo seu número da sorte (inicia em 7). O valor substituído torna-se seu novo número da sorte.'
    });
  }

  if (dados.habilidades.absorverPm.ativo) {
    const np = dados.habilidades.absorverPm.nivel;
    acoes.push({
      id: 'entropista_absorver_pm',
      codigo: 'ABSORVER_PM',
      nome: `🌀 Absorver PM (Reação • +${np * 2} PM ao Sofrer Dano)`,
      nomeCurto: 'Absorver PM',
      tipo: 'reacao_combate',
      classe: 'Entropista',
      nivel: np,
      isAcaoExtra: true,
      descricao: `Imediatamente após sofrer dano de qualquer fonte ou tipo, recupera +${np * 2} PM.`
    });
  }

  return acoes;
}
