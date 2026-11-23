/**
 * Fabula Ultima - Regras da Classe Mutante (Mutant)
 * Atlas Techno Fantasy - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade } from './coreClassRules.js';

export const TERIOFORMAS_PADRAO = Object.freeze([
  { chave: 'placofora', nome: 'Placófora', efeito: 'Defesa fixada em 13 + ⌊NP/2⌋ carapaça protetora.' },
  { chave: 'neurofagoide', nome: 'Neurofagóide', efeito: 'Biofagia também recupera (4 + NP) PM.' },
  { chave: 'tachytheria', nome: 'Tachytheria', efeito: 'Aumenta o dado de Destreza em 1 passo (máx d12).' },
  { chave: 'arpaktida', nome: 'Arpaktida', efeito: 'Aumenta o dado de Astúcia em 1 passo (máx d12).' },
  { chave: 'dynamotheria', nome: 'Dynamotheria', efeito: 'Aumenta o dado de Vigor em 1 passo (máx d12).' },
  { chave: 'ophiocordyceps', nome: 'Ophiocordyceps', efeito: 'Causa Envenenado ao infligir dano.' }
]);

export function extrairHabilidadesMutante(classes = []) {
  const nvAcromorfose = obterNivelHabilidade(classes, 'mutant', 'acromorfose');
  const nvBiofagia = obterNivelHabilidade(classes, 'mutant', 'biofagia');
  const nvEcdise = obterNivelHabilidade(classes, 'mutant', 'ecdise');
  const nvGenoclepse = obterNivelHabilidade(classes, 'mutant', 'genoclepse');
  const nvTeriomorfose = obterNivelHabilidade(classes, 'mutant', 'teriomorfose');

  return {
    temMutante: nvAcromorfose > 0 || nvBiofagia > 0 || nvEcdise > 0 || nvGenoclepse > 0 || nvTeriomorfose > 0,
    nvAcromorfose,
    nvBiofagia,
    nvEcdise,
    nvGenoclepse,
    nvTeriomorfose
  };
}

export function calcularBonusAkromorphosis(nv = 0) {
  const np = Math.max(0, Math.min(3, parseInt(nv, 10) || 0));
  if (np === 0) return { bonusPrecisao: 0, bonusDano: 0 };
  return {
    bonusPrecisao: np,
    bonusDano: 6 + (np * 2)
  };
}

export function calcularCustoTeriomorfose(pvAtual = 0) {
  const pv = Math.max(0, parseInt(pvAtual, 10) || 0);
  return Math.floor(pv / 3);
}

export function gerarAcoesConflitoMutante({ classes = [], ficha = null, pvAtual = null } = {}) {
  const { nvAcromorfose, nvBiofagia, nvEcdise, nvGenoclepse, nvTeriomorfose } = extrairHabilidadesMutante(classes);
  const acoes = [];
  const pvEfetivo = pvAtual !== null && pvAtual !== undefined
    ? Number(pvAtual)
    : (Number(ficha?.recursos?.pv?.atual) || Number(ficha?.pv_atual) || 30);

  if (nvTeriomorfose > 0) {
    const custoPv = calcularCustoTeriomorfose(pvEfetivo);
    acoes.push({
      id: 'mutante_teriomorfose',
      codigo: 'TERIOMORFOSE',
      nome: '🧬 Teriomorfose',
      nomeCurto: 'Teriomorfose',
      tipo: 'acao_suporte',
      classe: 'Mutante',
      nivel: nvTeriomorfose,
      custoPv,
      isAcaoExtra: false,
      descricao: `Gasta 1/3 dos PV atuais (${custoPv} PV) para manifestar até 2 terioformas ativas até o fim da cena.`
    });
  }

  if (nvEcdise > 0) {
    acoes.push({
      id: 'mutante_ecdise',
      codigo: 'ECDISE',
      nome: '🛡️ Écdise',
      nomeCurto: 'Écdise',
      tipo: 'reacao',
      classe: 'Mutante',
      nivel: nvEcdise,
      custoPv: 10,
      isAcaoExtra: true,
      descricao: 'Reação ao sofrer dano não-físico: gasta 10 PV para receber Resistência àquele elemento até o próximo uso.'
    });
  }

  if (nvBiofagia > 0) {
    const curaPv = nvBiofagia * 5;
    acoes.push({
      id: 'mutante_biofagia',
      codigo: 'BIOFAGIA',
      nome: '🩸 Biofagia',
      nomeCurto: 'Biofagia',
      tipo: 'reacao',
      classe: 'Mutante',
      nivel: nvBiofagia,
      curaAplicada: curaPv,
      recursoCura: 'pv',
      isAcaoExtra: true,
      descricao: `Reação em Crise: ao infligir dano a inimigo, regenera imediatamente +${curaPv} PV (e +${4 + nvBiofagia} PM se tiver Neurofagóide).`
    });
  }

  if (nvAcromorfose > 0) {
    const { bonusPrecisao, bonusDano } = calcularBonusAkromorphosis(nvAcromorfose);
    acoes.push({
      id: 'mutante_acromorfose',
      codigo: 'ACROMORFOSE',
      nome: '🦾 Acromorfose',
      nomeCurto: 'Acromorfose',
      tipo: 'manobra',
      classe: 'Mutante',
      nivel: nvAcromorfose,
      bonusTeste: bonusPrecisao,
      danoAplicado: bonusDano,
      isAcaoExtra: true,
      descricao: `Início de turno: adapta ataques desarmados para categoria de arma escolhida (+${bonusPrecisao} Precisão, +${bonusDano} Dano).`
    });
  }

  if (nvGenoclepse > 0) {
    acoes.push({
      id: 'mutante_genoclepse',
      codigo: 'GENOCLEPSE',
      nome: '🔬 Genoclepse',
      nomeCurto: 'Genoclepse',
      tipo: 'reacao',
      classe: 'Mutante',
      nivel: nvGenoclepse,
      isAcaoExtra: true,
      descricao: `Ao causar dano a NPC: descobre a espécie e pode manifestar até ${nvGenoclepse} terioformas imediatas pagando 1/3 PV.`
    });
  }

  return acoes;
}
