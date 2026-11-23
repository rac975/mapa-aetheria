/**
 * Fabula Ultima - Regras da Classe Floralista (Florist)
 * Atlas Fantasia BucÃ³lica (Natural Fantasy) - Clean Architecture: FunÃ§Ãµes Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const MAGISEEDS_CATALOGO = Object.freeze([
  {
    chave: 'espinhos',
    nome: 'Magissemente de Espinhos',
    tipoDano: 'fisico',
    resumo: 'Gera espinhos defensivos e causa dano fÃ­sico / retaliaÃ§Ã£o.'
  },
  {
    chave: 'rosa_de_fogo',
    nome: 'Magissemente Rosa de Fogo',
    tipoDano: 'fogo',
    resumo: 'Desabrocha em chamas, causando dano de fogo acumulativo.'
  },
  {
    chave: 'lirio_restaurador',
    nome: 'Magissemente LÃ­rio Restaurador',
    tipoDano: null,
    resumo: 'Restaura PV de aliados em seÃ§Ãµes avanÃ§adas do relÃ³gio.'
  },
  {
    chave: 'orquidea_silenciosa',
    nome: 'Magissemente OrquÃ­dea Silenciosa',
    tipoDano: 'sombra',
    resumo: 'Drena PM e inflige status Abalado ou Atordoado aos inimigos.'
  },
  {
    chave: 'semente_trovao',
    nome: 'Magissemente Semente do TrovÃ£o',
    tipoDano: 'raio',
    resumo: 'Emana pulsos elÃ©tricos em todos os inimigos no fim do turno.'
  }
]);

export function extrairHabilidadesFloralista(classes = []) {
  const lista = (Array.isArray(classes) ? classes : []).map((c) => ({
    ...c,
    nome_classe: c?.nome_classe || c?.nome || c?.name || ''
  }));
  const temClasse = lista.some((c) => {
    const nomeNorm = normalizarTextoCore(c.nome_classe);
    return nomeNorm.includes('floralista') || nomeNorm.includes('florista') || nomeNorm.includes('florist');
  });

  if (!temClasse) return null;

  return {
    ativa: true,
    cloromancia: obterNivelHabilidade(lista, 'flor', 'cloromancia'),
    arvoreDaVida: obterNivelHabilidade(lista, 'flor', 'arvore da vida') || obterNivelHabilidade(lista, 'flor', 'arvore-da-vida'),
    enxerto: obterNivelHabilidade(lista, 'flor', 'enxerto'),
    jardinagemMarcial: obterNivelHabilidade(lista, 'flor', 'jardinagem marcial'),
    influenciaVerdejante: obterNivelHabilidade(lista, 'flor', 'influencia verdejante')
  };
}

export function gerarAcoesConflitoFloralista({ classes = [], relogioGerminacao = 0 } = {}) {
  const habs = extrairHabilidadesFloralista(classes);
  if (!habs) return [];

  const acoes = [];

  if (habs.cloromancia > 0) {
    acoes.push({
      id: 'floralista_cloromancia',
      codigo: 'CLOROMANCIA',
      nome: 'ðŸŒ± Cloromancia (Plantar Magissemente)',
      nomeCurto: 'Cloromancia',
      tipo: 'especial',
      classe: 'Floralista',
      nivel: habs.cloromancia,
      custoPm: 20,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'terra',
      isAcaoExtra: false,
      passiva: false,
      descricao: `Gasta 20 PM para plantar uma magissemente em seu jardim vazio, iniciando o relÃ³gio de germinaÃ§Ã£o (4 seÃ§Ãµes).`
    });
  }

  if (habs.enxerto > 0) {
    const disponivel = relogioGerminacao > 0;
    acoes.push({
      id: 'floralista_enxerto',
      codigo: 'ENXERTO',
      nome: 'âœ‚ï¸  Enxerto',
      nomeCurto: 'Enxerto',
      tipo: 'especial',
      classe: 'Floralista',
      nivel: habs.enxerto,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'fisico',
      isAcaoExtra: false,
      passiva: false,
      bloqueada: !disponivel,
      descricao: `Gasta 1 aÃ§Ã£o para remover a magissemente atual e plantar outra mantendo as seÃ§Ãµes preenchidas do relÃ³gio (Requer â‰¥1 seÃ§Ã£o).`
    });
  }

  if (habs.jardinagemMarcial > 0) {
    const limitePmMagia = 5 + habs.jardinagemMarcial * 5;
    acoes.push({
      id: 'floralista_jardinagem_marcial',
      codigo: 'JARDINAGEM_MARCIAL',
      nome: 'ðŸŒ¸ Jardinagem Marcial',
      nomeCurto: 'Jardinagem Marcial',
      tipo: 'reacao',
      classe: 'Floralista',
      nivel: habs.jardinagemMarcial,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'fisico',
      isAcaoExtra: true,
      passiva: false,
      descricao: `ApÃ³s plantar com Cloromancia: Ataque livre com arma equipada OU conjura feitiÃ§o de atÃ© ${limitePmMagia} PM sem gastar aÃ§Ã£o (RA = 0 no dano).`
    });
  }

  if (habs.arvoreDaVida > 0) {
    const curaCrise = 5 + habs.arvoreDaVida * 5;
    acoes.push({
      id: 'floralista_arvore_da_vida',
      codigo: 'ARVORE_DA_VIDA',
      nome: 'ðŸŒ³ Ã rvore da Vida',
      nomeCurto: 'Ã rvore da Vida',
      tipo: 'reacao',
      classe: 'Floralista',
      nivel: habs.arvoreDaVida,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: curaCrise,
      recursoCura: 'pv',
      tipoDano: 'luz',
      isAcaoExtra: true,
      passiva: true,
      descricao: `Ao remover magissemente do jardim: Alvo visÃ­vel em Crise recupera +${curaCrise} PV.`
    });
  }

  return acoes;
}
