/**
 * Fabula Ultima - Regras da Classe Floralista (Florist)
 * Atlas Fantasia Bucólica (Natural Fantasy) - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const MAGISEEDS_CATALOGO = Object.freeze([
  {
    chave: 'espinhos',
    nome: 'Magissemente de Espinhos',
    tipoDano: 'fisico',
    resumo: 'Gera espinhos defensivos e causa dano físico / retaliação.'
  },
  {
    chave: 'rosa_de_fogo',
    nome: 'Magissemente Rosa de Fogo',
    tipoDano: 'fogo',
    resumo: 'Desabrocha em chamas, causando dano de fogo acumulativo.'
  },
  {
    chave: 'lirio_restaurador',
    nome: 'Magissemente Lírio Restaurador',
    tipoDano: null,
    resumo: 'Restaura PV de aliados em seções avançadas do relógio.'
  },
  {
    chave: 'orquidea_silenciosa',
    nome: 'Magissemente Orquídea Silenciosa',
    tipoDano: 'trevas',
    resumo: 'Drena PM e inflige status Abalado ou Atordoado aos inimigos.'
  },
  {
    chave: 'semente_trovao',
    nome: 'Magissemente Semente do Trovão',
    tipoDano: 'raio',
    resumo: 'Emana pulsos elétricos em todos os inimigos no fim do turno.'
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
      nome: '🌱 Cloromancia (Plantar Magissemente)',
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
      descricao: 'Gasta 20 PM para plantar uma magissemente em seu jardim vazio, iniciando o relógio de germinação (4 seções).'
    });
  }

  if (habs.enxerto > 0) {
    const disponivel = relogioGerminacao > 0;
    acoes.push({
      id: 'floralista_enxerto',
      codigo: 'ENXERTO',
      nome: '✂️ Enxerto',
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
      descricao: 'Gasta 1 ação para remover a magissemente atual e plantar outra mantendo as seções preenchidas do relógio (Requer ≥1 seção).'
    });
  }

  if (habs.jardinagemMarcial > 0) {
    const limitePmMagia = 5 + habs.jardinagemMarcial * 5;
    acoes.push({
      id: 'floralista_jardinagem_marcial',
      codigo: 'JARDINAGEM_MARCIAL',
      nome: '🌸 Jardinagem Marcial',
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
      descricao: `Após plantar com Cloromancia: Ataque livre com arma equipada OU conjura feitiço de até ${limitePmMagia} PM sem gastar ação (RA = 0 no dano).`
    });
  }

  if (habs.arvoreDaVida > 0) {
    const curaCrise = 5 + habs.arvoreDaVida * 5;
    acoes.push({
      id: 'floralista_arvore_da_vida',
      codigo: 'ARVORE_DA_VIDA',
      nome: '🌳 Árvore da Vida',
      nomeCurto: 'Árvore da Vida',
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
      descricao: `Ao remover magissemente do jardim: Alvo visível em Crise recupera +${curaCrise} PV.`
    });
  }

  return acoes;
}
