/**
 * Fabula Ultima - Integrador de AÃ§Ãµes de Conflito do Bloco D
 * Floralista, Gourmet, Invocador e Mercador (Atlas Fantasia BucÃ³lica).
 * Clean Architecture: FunÃ§Ãµes puras sem dependÃªncias de React ou Supabase.
 */

import { gerarAcoesConflitoFloralista } from './floristRules.js';
import { gerarAcoesConflitoGourmet } from './gourmetRules.js';
import { gerarAcoesConflitoInvocador } from './invokerRules.js';
import { gerarAcoesConflitoMercador } from './merchantRules.js';

export const ACOES_BLOCO_D_OFICIAIS = {
  // Floralista
  CLOROMANCIA: {
    codigo: 'CLOROMANCIA',
    titulo: 'ðŸŒ± Cloromancia',
    categoria: 'floralista',
    consomeTurno: true,
    custoBase: '20 PM',
    resumo: 'Gasta 20 PM para plantar uma magissemente em seu jardim iniciando o relÃ³gio de germinaÃ§Ã£o (4 seÃ§Ãµes).'
  },
  ENXERTO: {
    codigo: 'ENXERTO',
    titulo: 'âœ‚ï¸  Enxerto',
    categoria: 'floralista',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Gasta 1 aÃ§Ã£o: Substitui a magissemente atual mantendo as seÃ§Ãµes preenchidas do relÃ³gio.'
  },
  JARDINAGEM_MARCIAL: {
    codigo: 'JARDINAGEM_MARCIAL',
    titulo: 'ðŸŒ¸ Jardinagem Marcial',
    categoria: 'floralista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'ApÃ³s Cloromancia: Ataque livre com arma equipada OU lanÃ§a feitiÃ§o sem gastar aÃ§Ã£o (RA = 0 no dano).'
  },
  ARVORE_DA_VIDA: {
    codigo: 'ARVORE_DA_VIDA',
    titulo: 'ðŸŒ³ Ã rvore da Vida',
    categoria: 'floralista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao remover semente: Criatura visÃ­vel em Crise recupera +[5 + NPÃ—5] PV.'
  },
  // Gourmet
  CULINARIA: {
    codigo: 'CULINARIA',
    titulo: 'ðŸ µ CulinÃ¡ria: Banquete',
    categoria: 'gourmet',
    consomeTurno: true,
    custoBase: '2-3 Ingredientes',
    resumo: 'Gasta 1 aÃ§Ã£o e 2 ou 3 ingredientes da reserva para preparar iguaria e conceder efeitos a si e 1 aliado visÃ­vel.'
  },
  CULINARIA_OFENSIVA: {
    codigo: 'CULINARIA_OFENSIVA',
    titulo: 'ðŸ ´ CulinÃ¡ria: Ataque',
    categoria: 'gourmet',
    consomeTurno: true,
    custoBase: '2-3 Ingredientes',
    resumo: 'Ataque livre com arma sem dano aplicando efeitos da iguaria nos inimigos (Com Garfo e Faca e 2 ingredientes: dano com RA = 0).'
  },
  FEITO_COM_AMOR: {
    codigo: 'FEITO_COM_AMOR',
    titulo: 'â ¤ï¸  Feito com Amor',
    categoria: 'gourmet',
    consomeTurno: false,
    custoBase: '10 PM / alvo extra',
    resumo: 'Ao usar CulinÃ¡ria de suporte: Gasta atÃ© NPÃ—10 PM (+10 PM por aliado adicional visÃ­vel para receber os efeitos).'
  },
  SAL_E_PIMENTA: {
    codigo: 'SAL_E_PIMENTA',
    titulo: 'ðŸ§‚ Sal e Pimenta',
    categoria: 'gourmet',
    consomeTurno: false,
    custoBase: '2 PI',
    resumo: 'Gasta 2 PI para transformar o sabor de um ingrediente em qualquer outro sabor Ã  sua escolha.'
  },
  GARFO_E_FACA: {
    codigo: 'GARFO_E_FACA',
    titulo: 'ðŸ ´ Garfo e Faca',
    categoria: 'gourmet',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Se CulinÃ¡ria ofensiva tiver 2 ingredientes, seu ataque livre causa dano de arma normal (RA = 0).'
  },
  // Invocador
  INVOCACAO: {
    codigo: 'INVOCACAO',
    titulo: 'âš„ï¸  InvocaÃ§Ã£o Elemental',
    categoria: 'invocador',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Gasta 5 PM: Canaliza manancial presente sem rolagem de dados (acerto automÃ¡tico!). Dano base 20, Praga +5 ou Cura 30 PV.'
  },
  INVOCACOES_CONECTADAS: {
    codigo: 'INVOCACOES_CONECTADAS',
    titulo: 'ðŸ”— InvocaÃ§Ãµes Conectadas',
    categoria: 'invocador',
    consomeTurno: false,
    custoBase: '10 PM / alvo extra',
    resumo: 'Ao realizar InvocaÃ§Ã£o: Gasta atÃ© NPÃ—10 PM (+10 PM por criatura adicional visÃ­vel afetada).'
  },
  CASCATA: {
    codigo: 'CASCATA',
    titulo: 'ðŸŒŠ Cascata',
    categoria: 'invocador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'ApÃ³s inimigo sofrer dano ampliado por Praga: Ataque livre com +NP PrecisÃ£o causando o mesmo elemento e dissipando pragas.'
  },
  EXPANDIR_MANANCIAL: {
    codigo: 'EXPANDIR_MANANCIAL',
    titulo: 'âœ¨ Expandir Manancial',
    categoria: 'invocador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva com arma leve/arcana: +NP de dano em ExplosÃµes e +NP no bÃ´nus de Pragas.'
  },
  // Mercador
  ESTOQUE_PESSOAL: {
    codigo: 'ESTOQUE_PESSOAL',
    titulo: 'ðŸ“¦ Estoque Pessoal',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: '1 Ponto de ComÃ©rcio',
    resumo: 'Gasta 1 Ponto de ComÃ©rcio para anular totalmente o custo de atÃ© NP+2 PI seu ou de um aliado.'
  },
  JA_OUVI_FALAR: {
    codigo: 'JA_OUVI_FALAR',
    titulo: 'ðŸ—³ï¸  JÃ¡ Ouvi Falar',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: '1 Ponto de ComÃ©rcio',
    resumo: 'Gasta 1 Ponto de ComÃ©rcio para conceder +[NP+2] em teste de exame/Estudo para vocÃª ou aliado audÃ­vel.'
  },
  DATA_DE_VALIDADE: {
    codigo: 'DATA_DE_VALIDADE',
    titulo: 'â˜  Data de Validade',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao usar poÃ§Ã£o ou iguaria curativa: Pode converter a cura em dano de veneno igual a [Nv/2 + NPÃ—10].'
  },
  VENTOS_DO_COMERCIO: {
    codigo: 'VENTOS_DO_COMERCIO',
    titulo: 'ðŸ’¸ Ventos do ComÃ©rcio',
    categoria: 'mercador',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Gerencia atÃ© NP+3 Pontos de ComÃ©rcio para ativar Estoque Pessoal e JÃ¡ Ouvi Falar.'
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
