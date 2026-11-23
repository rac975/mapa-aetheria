/**
 * Fabula Ultima - Integrador de Ações de Conflito do Bloco B
 * Mutante (Mutant) e Esper (Techno Fantasy).
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { gerarAcoesConflitoMutante } from './mutantRules.js';
import { gerarAcoesConflitoEsper } from './esperRules.js';

export const ACOES_BLOCO_B_OFICIAIS = {
  // Mutante
  TERIOMORFOSE: {
    codigo: 'TERIOMORFOSE',
    titulo: '🧬 Teriomorfose',
    categoria: 'mutante',
    consomeTurno: true,
    custoBase: '1/3 dos PV atuais',
    resumo: 'Gasta 1/3 do seu PV atual para manifestar os efeitos de até 2 terioformas aprendidas simultaneamente até o fim da cena.'
  },
  ECDISE: {
    codigo: 'ECDISE',
    titulo: '🛡️ Écdise',
    categoria: 'mutante',
    consomeTurno: false,
    custoBase: '10 PV',
    resumo: 'Ao sofrer dano não-físico: gasta 10 PV para receber Resistência àquele tipo de dano até o próximo uso deste poder.'
  },
  BIOFAGIA: {
    codigo: 'BIOFAGIA',
    titulo: '🩸 Biofagia',
    categoria: 'mutante',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Em Crise: ao fazer inimigo perder PV, recupera NP×5 PV imediatamente (e +4+NP PM se Neurofagóide estiver ativa).'
  },
  ACROMORFOSE: {
    codigo: 'ACROMORFOSE',
    titulo: '🦾 Acromorfose',
    categoria: 'mutante',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Início de turno: adapta ataques desarmados para categoria de arma escolhida (+NP Precisão, +(6 + NP×2) Dano).'
  },
  GENOCLEPSE: {
    codigo: 'GENOCLEPSE',
    titulo: '🔬 Genoclepse',
    categoria: 'mutante',
    consomeTurno: false,
    custoBase: '1/3 PV se manifestar',
    resumo: 'Ao causar dano a NPC: descobre a espécie e pode manifestar na hora até NP terioformas que reflitam o NPC.'
  },
  // Esper
  FOCO_COGNITIVO: {
    codigo: 'FOCO_COGNITIVO',
    titulo: '🎯 Foco Cognitivo',
    categoria: 'esper',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Início de turno: escolhe aliado audível ou inimigo Abalado/Atordoado/Enfurecido como Foco (+NP testes, +NP×2 curas).'
  },
  DONS_PSIQUICOS: {
    codigo: 'DONS_PSIQUICOS',
    titulo: '🔮 Dons Psíquicos',
    categoria: 'esper',
    consomeTurno: false,
    custoBase: '5 a 20 PM',
    resumo: 'Ativa um dom psíquico (custo: 5×Relógio, mín 5 PM) em reação a evento específico e avança o Relógio Mental em +1 seção.'
  },
  PSICOCINESE: {
    codigo: 'PSICOCINESE',
    titulo: '🧠 Psicocinese',
    categoria: 'esper',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Precisão pode substituir 1 atributo por Vontade; espadas e armas arcanas acertam alvos voadores.'
  },
  HIPERCOGNICAO: {
    codigo: 'HIPERCOGNICAO',
    titulo: '⚡ Hipercognição',
    categoria: 'esper',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Custo em PM de feitiços/versos que alvejam o Foco é reduzido em NP (ou NP×2 se foco for único alvo).'
  },
  NAVEGADOR: {
    codigo: 'NAVEGADOR',
    titulo: '🌐 Navegador',
    categoria: 'esper',
    consomeTurno: false,
    custoBase: null,
    resumo: 'Passiva: Telepatia a até 1 dia de viagem com aliados e rituais da rede de almas.'
  }
};

export function gerarTodasAcoesConflitoBlocoB({
  classes = [],
  ficha = null,
  pvAtual = null,
  relogioSecoes = 0
} = {}) {
  const acoes = [];

  acoes.push(...gerarAcoesConflitoMutante({ classes, ficha, pvAtual }));
  acoes.push(...gerarAcoesConflitoEsper({ classes, relogioSecoes }));

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
