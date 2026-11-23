/**
 * Fabula Ultima - Integrador de Ações de Conflito do Bloco D
 * Floralista, Gourmet, Invocador e Mercador (Atlas Fantasia Bucólica).
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { gerarAcoesConflitoFloralista } from './floristRules.js';
import { gerarAcoesConflitoGourmet } from './gourmetRules.js';
import { gerarAcoesConflitoInvocador } from './invokerRules.js';
import { gerarAcoesConflitoMercador } from './merchantRules.js';

export const ACOES_BLOCO_D_OFICIAIS = {
  // Floralista
  CLOROMANCIA: {
    codigo: 'CLOROMANCIA',
    titulo: '🌱 Cloromancia',
    categoria: 'floralista',
    consomeTurno: true,
    custoBase: '20 PM',
    resumo: 'Gasta 20 PM para plantar uma magissemente em seu jardim iniciando o relógio de germinação (4 seções).'
  },
  ENXERTO: {
    codigo: 'ENXERTO',
    titulo: '✂️ Enxerto',
    categoria: 'floralista',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Gasta 1 ação: Substitui a magissemente atual mantendo as seções preenchidas do relógio.'
  },
  JARDINAGEM_MARCIAL: {
    codigo: 'JARDINAGEM_MARCIAL',
    titulo: '🌸 Jardinagem Marcial',
    categoria: 'floralista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após Cloromancia: Ataque livre com arma equipada OU lança feitiço sem gastar ação (RA = 0 no dano).'
  },
  ARVORE_DA_VIDA: {
    codigo: 'ARVORE_DA_VIDA',
    titulo: '🌳 Árvore da Vida',
    categoria: 'floralista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao remover semente: Criatura visível em Crise recupera +[5 + NP×5] PV.'
  },
  // Gourmet
  CULINARIA: {
    codigo: 'CULINARIA',
    titulo: '🥣 Culinária: Banquete',
    categoria: 'gourmet',
    consomeTurno: true,
    custoBase: '2-3 Ingredientes',
    resumo: 'Gasta 1 ação e 2 ou 3 ingredientes da reserva para preparar iguaria e conceder efeitos a si e 1 aliado visível.'
  },
  CULINARIA_OFENSIVA: {
    codigo: 'CULINARIA_OFENSIVA',
    titulo: '🍴 Culinária: Ataque',
    categoria: 'gourmet',
    consomeTurno: true,
    custoBase: '2-3 Ingredientes',
    resumo: 'Ataque livre com arma sem dano aplicando efeitos da iguaria nos inimigos (Com Garfo e Faca e 2 ingredientes: dano com RA = 0).'
  },
  FEITO_COM_AMOR: {
    codigo: 'FEITO_COM_AMOR',
    titulo: '❤️ Feito com Amor',
    categoria: 'gourmet',
    consomeTurno: false,
    custoBase: '10 PM / alvo extra',
    resumo: 'Ao usar Culinária de suporte: Gasta até NP×10 PM (+10 PM por aliado adicional visível para receber os efeitos).'
  },
  SAL_E_PIMENTA: {
    codigo: 'SAL_E_PIMENTA',
    titulo: '🧂 Sal e Pimenta',
    categoria: 'gourmet',
    consomeTurno: false,
    custoBase: '2 PI',
    resumo: 'Gasta 2 PI para transformar o sabor de um ingrediente em qualquer outro sabor à sua escolha.'
  },
  GARFO_E_FACA: {
    codigo: 'GARFO_E_FACA',
    titulo: '🍴 Garfo e Faca',
    categoria: 'gourmet',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Se Culinária ofensiva tiver 2 ingredientes, seu ataque livre causa dano de arma normal (RA = 0).'
  },
  // Invocador
  INVOCACAO: {
    codigo: 'INVOCACAO',
    titulo: '☄️ Invocação Elemental',
    categoria: 'invocador',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Gasta 5 PM: Canaliza manancial presente sem rolagem de dados (acerto automático!). Dano base 20, Praga +5 ou Cura 30 PV.'
  },
  INVOCACOES_CONECTADAS: {
    codigo: 'INVOCACOES_CONECTADAS',
    titulo: '🔗 Invocações Conectadas',
    categoria: 'invocador',
    consomeTurno: false,
    custoBase: '10 PM / alvo extra',
    resumo: 'Ao realizar Invocação: Gasta até NP×10 PM (+10 PM por criatura adicional visível afetada).'
  },
  CASCATA: {
    codigo: 'CASCATA',
    titulo: '🌊 Cascata',
    categoria: 'invocador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após inimigo sofrer dano ampliado por Praga: Ataque livre com +NP Precisão causando o mesmo elemento e dissipando pragas.'
  },
  EXPANDIR_MANANCIAL: {
    codigo: 'EXPANDIR_MANANCIAL',
    titulo: '✨ Expandir Manancial',
    categoria: 'invocador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva com arma leve/arcana: +NP de dano em Explosões e +NP no bônus de Pragas.'
  },
  // Mercador
  ESTOQUE_PESSOAL: {
    codigo: 'ESTOQUE_PESSOAL',
    titulo: '📦 Estoque Pessoal',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: '1 Ponto de Comércio',
    resumo: 'Gasta 1 Ponto de Comércio para anular totalmente o custo de até NP+2 PI seu ou de um aliado.'
  },
  JA_OUVI_FALAR: {
    codigo: 'JA_OUVI_FALAR',
    titulo: '🗳️ Já Ouvi Falar',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: '1 Ponto de Comércio',
    resumo: 'Gasta 1 Ponto de Comércio para conceder +[NP+2] em teste de exame/Estudo para você ou aliado audível.'
  },
  DATA_DE_VALIDADE: {
    codigo: 'DATA_DE_VALIDADE',
    titulo: '☠️ Data de Validade',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao usar poção ou iguaria curativa: Pode converter a cura em dano de veneno igual a [Nv/2 + NP×10].'
  },
  VENTOS_DO_COMERCIO: {
    codigo: 'VENTOS_DO_COMERCIO',
    titulo: '💸 Ventos do Comércio',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Gerencia até NP+3 Pontos de Comércio para ativar Estoque Pessoal e Já Ouvi Falar.'
  }
};

export function gerarTodasAcoesConflitoBlocoD({
  classes = [],
  relogioGerminacao = 0,
  ingredientes = 10,
  nivelPersonagem = 5,
  pontosComercio = 2
} = {}) {
  const acoes = [];

  acoes.push(...gerarAcoesConflitoFloralista({ classes, relogioGerminacao }));
  acoes.push(...gerarAcoesConflitoGourmet({ classes, ingredientes }));
  acoes.push(...gerarAcoesConflitoInvocador({ classes, nivelPersonagem }));
  acoes.push(...gerarAcoesConflitoMercador({ classes, nivelPersonagem, pontosComercio }));

  return acoes.map((acao) => ({
    id: acao.id,
    codigo: acao.codigo,
    nome: acao.nome,
    nomeCurto: acao.nomeCurto || acao.nome,
    tipo: acao.tipo,
    classe: acao.classe,
    nivel: acao.nivel,
    attr1: acao.attr1,
    attr2: acao.attr2,
    bonusTeste: acao.bonusTeste || 0,
    custoPm: acao.custoPm || 0,
    custoPv: acao.custoPv || 0,
    custoPi: acao.custoPi || 0,
    custoPf: acao.custoPf || 0,
    danoAplicado: acao.danoAplicado || 0,
    curaAplicada: acao.curaAplicada || 0,
    recursoCura: acao.recursoCura || 'pv',
    tipoDano: acao.tipoDano || 'fisico',
    isAcaoExtra: Boolean(acao.isAcaoExtra),
    passiva: Boolean(acao.passiva),
    bloqueada: Boolean(acao.bloqueada),
    descricao: acao.descricao,
    efeito: acao.descricao
  }));
}
