/**
 * Fabula Ultima - Integrador de Ações de Conflito do Bloco C
 * Comandante, Dançarino, Simbolista e Virtuoso (Atlas High Fantasy).
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { gerarAcoesConflitoComandante } from './commanderRules.js';
import { gerarAcoesConflitoDancarino } from './dancerRules.js';
import { gerarAcoesConflitoSimbolista } from './symbolistRules.js';
import { gerarAcoesConflitoVirtuoso } from './virtuosoRules.js';

export const ACOES_BLOCO_C_OFICIAIS = {
  // Comandante
  CARGA_CAVALARIA: {
    codigo: 'CARGA_CAVALARIA',
    titulo: '🐎 Carga de Cavalaria',
    categoria: 'comandante',
    consomeTurno: true,
    custoBase: '10 PM',
    resumo: 'Gasta 10 PM para ordenar um ataque livre imediato de um aliado audível com +NP em Precisão (RA = 0 no dano).'
  },
  DECRETO_DO_BISPO: {
    codigo: 'DECRETO_DO_BISPO',
    titulo: '📜 Decreto do Bispo',
    categoria: 'comandante',
    consomeTurno: true,
    custoBase: '10 PM',
    resumo: 'Gasta 10 PM: Todos os custos de PM são dobrados OU todas as fontes de dano causam +NP×3 pontos de dano adicional.'
  },
  ROQUE_DO_REI: {
    codigo: 'ROQUE_DO_REI',
    titulo: '🏰 Roque do Rei',
    categoria: 'comandante',
    consomeTurno: true,
    custoBase: '10 PM',
    resumo: 'Gasta 10 PM: Nenhuma criatura pode recuperar PV/PM OU restaurações de PM recuperam +NP×5 PM adicionais.'
  },
  GAMBITO_DA_DAMA: {
    codigo: 'GAMBITO_DA_DAMA',
    titulo: '👑 Gambito da Dama',
    categoria: 'comandante',
    consomeTurno: true,
    custoBase: null,
    resumo: 'Ataque livre (RA = 0 no dano). Após o ataque: aliado recupera +[5 + NP×5] PV OU use Decreto, Carga ou Roque sem ação.'
  },
  CARRUAGEM_DEVASTADORA: {
    codigo: 'CARRUAGEM_DEVASTADORA',
    titulo: '⚡ Carruagem Devastadora',
    categoria: 'comandante',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após usar Decreto, Carga ou Roque: outro PJ audível age imediatamente após seu turno nesta rodada.'
  },
  // Dançarino
  DANCA: {
    codigo: 'DANCA',
    titulo: '💃 Apresentar Dança',
    categoria: 'dancarino',
    consomeTurno: false,
    custoBase: '5-10 PM',
    resumo: 'Gasta 10 PM (5 PM se consecutiva diferente; sem armadura marcial): Apresenta dança com efeitos elementais ou de cura/dreno.'
  },
  DANCARINO_DE_GUERRA: {
    codigo: 'DANCARINO_DE_GUERRA',
    titulo: '🗡️ Dançarino de Guerra',
    categoria: 'dancarino',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após dançar: +NP de dano em ataques leves/desarmados e feitiços ofensivos com arma arcana até o próximo turno.'
  },
  ME_ACOMPANHE: {
    codigo: 'ME_ACOMPANHE',
    titulo: '🤝 Me Acompanhe',
    categoria: 'dancarino',
    consomeTurno: false,
    custoBase: '10 PM',
    resumo: 'Ao dançar: Gasta +10 PM para estender os benefícios da dança de turno a um aliado com Laço de afeto.'
  },
  SAPATEADO_FRENETICO: {
    codigo: 'SAPATEADO_FRENETICO',
    titulo: '🩰 Sapateado Frenético',
    categoria: 'dancarino',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva em Dança: +NP×2 em testes opostos de acrobacia, coordenação ou velocidade.'
  },
  TROCA_FIGURINO: {
    codigo: 'TROCA_FIGURINO',
    titulo: '🎭 Troca de Figurino',
    categoria: 'dancarino',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Reação após dançar: realiza a ação Equipamento sem gastar ação.'
  },
  // Simbolista
  SIMBOLISMO: {
    codigo: 'SIMBOLISMO',
    titulo: '🖋️ Simbolismo',
    categoria: 'simbolista',
    consomeTurno: true,
    custoBase: '2 PI',
    resumo: 'Gasta 2 PI (Ação Inventário): Cria e aplica símbolo em si, aliado ou via ataque livre sem dano em inimigos.'
  },
  TOQUE_PESSOAL: {
    codigo: 'TOQUE_PESSOAL',
    titulo: '✨ Toque Pessoal',
    categoria: 'simbolista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Quando criatura com seu símbolo sofrer dano ou receber cura: cause +NP de dano ou cure +NP PV/PM adicionais.'
  },
  SIMBOLOS_MAGICOS: {
    codigo: 'SIMBOLOS_MAGICOS',
    titulo: '🔮 Símbolos Mágicos',
    categoria: 'simbolista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Aliado destrói seu símbolo para lançar feitiço que você conheça de até NP×10 PM.'
  },
  CONEXAO_SIMBOLICA: {
    codigo: 'CONEXAO_SIMBOLICA',
    titulo: '🌐 Conexão Simbólica',
    categoria: 'simbolista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Sabe a direção de criaturas com seus símbolos a até 2 dias de viagem.'
  },
  MIRAGEM: {
    codigo: 'MIRAGEM',
    titulo: '👁️ Miragem',
    categoria: 'simbolista',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Rituais para ilusões visuais.'
  },
  // Virtuoso
  MAGICANTO: {
    codigo: 'MAGICANTO',
    titulo: '🎵 Magicanto',
    categoria: 'virtuoso',
    consomeTurno: true,
    custoBase: '10-30 PM',
    resumo: 'Gasta 10/20/30 PM: Combina Volume (Fraco/Médio/Forte), Escala elemental e Tom para tecer um verso mágico.'
  },
  HARMONIA: {
    codigo: 'HARMONIA',
    titulo: '🎼 Harmonia',
    categoria: 'virtuoso',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Ao atingir inimigos com verso usando arma arcana: Aliados causam +NP dano OU você recupera +NP PM.'
  },
  BARREIRA_SONORA: {
    codigo: 'BARREIRA_SONORA',
    titulo: '🛡️ Barreira Sonora',
    categoria: 'virtuoso',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após cantar verso Médio ou Forte, reduz qualquer dano físico sofrido em -NP até seu próximo turno.'
  },
  VIBRATO: {
    codigo: 'VIBRATO',
    titulo: '⚡ Vibrato',
    categoria: 'virtuoso',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Após cantar verso Fraco ou Médio: realiza um ataque livre imediato com arma (RA = 0 no dano).'
  },
  CANTO_DA_SEREIA: {
    codigo: 'CANTO_DA_SEREIA',
    titulo: '🧜‍♀️ Canto da Sereia',
    categoria: 'virtuoso',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Rituais para ilusões sonoras.'
  }
};

export function gerarTodasAcoesConflitoBlocoC({
  classes = [],
  ultimaDancaKey = null
} = {}) {
  const acoes = [];

  acoes.push(...gerarAcoesConflitoComandante({ classes }));
  acoes.push(...gerarAcoesConflitoDancarino({ classes, ultimaDancaKey }));
  acoes.push(...gerarAcoesConflitoSimbolista({ classes }));
  acoes.push(...gerarAcoesConflitoVirtuoso({ classes }));

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
    descricao: acao.descricao,
    efeito: acao.descricao
  }));
}
