/**
 * Fabula Ultima - Integrador de Ações de Conflito do Bloco A
 * Elementalista, Entropista, Espiritualista, Furioso, Guardião, Guerreiro Sombrio, Orador.
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { gerarAcoesConflitoElementalista } from './elementalistRules.js';
import { gerarAcoesConflitoEntropista } from './entropistRules.js';
import { gerarAcoesConflitoEspiritualista } from './spiritistRules.js';
import { gerarAcoesConflitoFurioso } from './furyRules.js';
import { gerarAcoesConflitoGuardiao } from './guardianRules.js';
import { gerarAcoesConflitoGuerreiroSombrio } from './darkbladeRules.js';
import { gerarAcoesConflitoOrador } from './oratorRules.js';

export const ACOES_BLOCO_A_OFICIAIS = {
  // Elementalista
  CATACLISMO: {
    codigo: 'CATACLISMO',
    titulo: '🌋 Cataclismo',
    categoria: 'elementalista',
    consomeTurno: false,
    custoBase: '10-30 PM',
    resumo: 'Gasta até NP×10 PM adicionais em feitiço instantâneo (+5 de dano a cada 10 PM).'
  },
  LAMINA_MAGICA: {
    codigo: 'LAMINA_MAGICA',
    titulo: '🗡️ Lâmina Mágica',
    categoria: 'elementalista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao lançar feitiço ofensivo de alvo único: usa fórmula de Precisão da arma equipada (+NP se tiver DES).'
  },
  // Entropista
  TEMPO_ROUBADO: {
    codigo: 'TEMPO_ROUBADO',
    titulo: '⏳ Tempo Roubado',
    categoria: 'entropista',
    consomeTurno: true,
    custoBase: '5-20 PM',
    resumo: 'Gasta 5 a NP×5 PM para aplicar/remover Lento, ação Equipamento livre, drenar PV de inimigo Lento ou acelerar aliado.'
  },
  SETE_DA_SORTE: {
    codigo: 'SETE_DA_SORTE',
    titulo: '🎲 Sete da Sorte',
    categoria: 'entropista',
    consomeTurno: false,
    custoBase: null,
    resumo: '1x por cena, substitui um dado rolado pelo seu número da sorte (inicia em 7).'
  },
  ABSORVER_PM: {
    codigo: 'ABSORVER_PM',
    titulo: '🌀 Absorver PM',
    categoria: 'entropista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao sofrer dano, recupera +NP×2 PM imediatamente.'
  },
  // Espiritualista
  VISMAGUS: {
    codigo: 'VISMAGUS',
    titulo: '🩸 Vismagus',
    categoria: 'espiritualista',
    consomeTurno: false,
    custoBase: 'PV variável',
    resumo: 'Paga 10 + custo do feitiço em PV caso não tenha PM suficientes (não pode zerar PV).'
  },
  PODER_CURATIVO: {
    codigo: 'PODER_CURATIVO',
    titulo: '✨ Poder Curativo',
    categoria: 'espiritualista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Feitiços em aliados com arma arcana curam +[3 + NP×Laços] PV adicionais.'
  },
  // Furioso
  PROVOCAR: {
    codigo: 'PROVOCAR',
    titulo: '💢 Provocar',
    categoria: 'furioso',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Teste oposto [VIG+VON]+NP. Alvo fica Enfurecido e é compelido a focar o Furioso.'
  },
  RESISTIR: {
    codigo: 'RESISTIR',
    titulo: '🛡️ Resistir',
    categoria: 'furioso',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Na Guarda sem cobrir aliado: recupera NP×Laço PV e aumenta VIG ou VON em 1 passo até o próximo turno.'
  },
  ESPIRITO_INDOMAVEL: {
    codigo: 'ESPIRITO_INDOMAVEL',
    titulo: '🔥 Espírito Indomável',
    categoria: 'furioso',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao gastar Ponto de Fábula: recupera NP×5 PV, ou NP×5 PM, ou cura 1 condição.'
  },
  // Guardião
  GUARDA_COSTAS: {
    codigo: 'GUARDA_COSTAS',
    titulo: '🤝 Guarda-Costas',
    categoria: 'guardiao',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Na Guarda dando cobertura: o aliado torna-se Resistente a todos os danos até seu próximo turno.'
  },
  ESCUDOS_GEMEOS: {
    codigo: 'ESCUDOS_GEMEOS',
    titulo: '⚔️ Escudos Gêmeos',
    categoria: 'guardiao',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ataque corpo a corpo empunhando 2 escudos: [VIG+VIG], RA + 5 + Maestria Físico.'
  },
  // Guerreiro Sombrio
  GOLPE_DAS_SOMBRAS: {
    codigo: 'GOLPE_DAS_SOMBRAS',
    titulo: '🌑 Golpe das Sombras',
    categoria: 'guerreiro_sombrio',
    consomeTurno: true,
    custoBase: 'PV rolado no VIG',
    resumo: 'Perde PV rolado no dado de Vigor para realizar ataque livre causando dano de Trevas com +[NP + VIG rolado].'
  },
  AGONIA: {
    codigo: 'AGONIA',
    titulo: '🩸 Agonia',
    categoria: 'guerreiro_sombrio',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao causar dano a inimigo com Laço: recupera +NP×2 PV e +NP×2 PM (1x por turno).'
  },
  CORACAO_DA_ESCURIDAO: {
    codigo: 'CORACAO_DA_ESCURIDAO',
    titulo: '🖤 Coração da Escuridão',
    categoria: 'guerreiro_sombrio',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao entrar em Crise (1x cena): cria imediatamente um Laço de ódio contra criatura visível.'
  },
  LICAO_DOLOROSA: {
    codigo: 'LICAO_DOLOROSA',
    titulo: '👁️ Lição Dolorosa',
    categoria: 'guerreiro_sombrio',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao sofrer perda de PV: pode fazer Estudo reativo contra o agressor com +NP no teste.'
  },
  // Orador
  CONDENAR: {
    codigo: 'CONDENAR',
    titulo: '⚡ Condenar',
    categoria: 'orador',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Teste oposto [AST+VON]+NP. Alvo perde NP×10 PM, fica Abalado ou Atordoado, e sofre +NP de dano de todas as fontes.'
  },
  ENCORAJAR: {
    codigo: 'ENCORAJAR',
    titulo: '🗣️ Encorajar',
    categoria: 'orador',
    consomeTurno: true,
    custoBase: '5 PM',
    resumo: 'Aliado recupera NP×5 PV e dado de um atributo sobe 1 passo até o próximo turno do Orador.'
  },
  CONFIO_EM_VOCE: {
    codigo: 'CONFIO_EM_VOCE',
    titulo: '🤝 Confio em Você',
    categoria: 'orador',
    consomeTurno: false,
    custoBase: '1 PF',
    resumo: 'Ao teste de aliado: gasta 1 PF para convocar Traço/Laço; se houver Laço com ele, ele recupera NP×10 PM.'
  }
};

export function gerarTodasAcoesConflitoBlocoA({ classes = [], ficha = null, emCrise = false } = {}) {
  const params = { classes, ficha, emCrise };
  const acoes = [];

  acoes.push(...gerarAcoesConflitoElementalista(params));
  acoes.push(...gerarAcoesConflitoEntropista(params));
  acoes.push(...gerarAcoesConflitoEspiritualista(params));
  acoes.push(...gerarAcoesConflitoFurioso(params));
  acoes.push(...gerarAcoesConflitoGuardiao(params));
  acoes.push(...gerarAcoesConflitoGuerreiroSombrio(params));
  acoes.push(...gerarAcoesConflitoOrador(params));

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
    bonusTeste: acao.bonusTeste,
    custoPm: acao.custoPm || 0,
    custoPi: acao.custoPi || 0,
    custoPf: acao.custoPf || 0,
    danoAplicado: acao.danoAplicado || 0,
    curaAplicada: acao.curaAplicada || 0,
    recursoCura: acao.recursoCura || 'pv',
    tipoDano: acao.tipoDano || 'fisico',
    isAcaoExtra: acao.isAcaoExtra,
    perdaPmAlvo: acao.perdaPmAlvo,
    bonusDanoSofrido: acao.bonusDanoSofrido,
    descricao: acao.descricao,
    efeito: acao.descricao
  }));
}
