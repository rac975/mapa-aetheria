/**
 * Fabula Ultima - Regras da Classe Virtuoso (Cantor)
 * Atlas High Fantasy - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade } from './coreClassRules.js';

export const VOLUMES_MAGICANTO = Object.freeze({
  FRACO: { chave: 'fraco', nome: 'Fraco', custoPm: 10, alvo: 'Você ou 1 criatura visível', resumo: '10 PM: Alvo único' },
  MEDIO: { chave: 'medio', nome: 'Médio', custoPm: 20, alvo: 'Todos os aliados audíveis', resumo: '20 PM: Todos os aliados' },
  FORTE: { chave: 'forte', nome: 'Forte', custoPm: 30, alvo: 'Todos os inimigos audíveis', resumo: '30 PM: Todos os inimigos' }
});

export const ESCALAS_MAGICANTO = Object.freeze([
  { chave: 'chama', nome: 'Escala da Chama', tipoDano: 'fogo' },
  { chave: 'geada', nome: 'Escala da Geada', tipoDano: 'gelo' },
  { chave: 'ferro', nome: 'Escala do Ferro', tipoDano: 'fisico' },
  { chave: 'resplendor', nome: 'Escala do Resplendor', tipoDano: 'luz' },
  { chave: 'sombra', nome: 'Escala da Sombra', tipoDano: 'trevas' },
  { chave: 'pedra', nome: 'Escala da Pedra', tipoDano: 'terra' },
  { chave: 'trovao', nome: 'Escala do Trovão', tipoDano: 'raio' },
  { chave: 'vento', nome: 'Escala do Vento', tipoDano: 'ar' }
]);

export function extrairHabilidadesVirtuoso(classes = []) {
  let nvMagicanto = obterNivelHabilidade(classes, 'virtuoso', 'magicanto');
  if (nvMagicanto === 0) nvMagicanto = obterNivelHabilidade(classes, 'cantor', 'magicanto');

  let nvHarmonia = obterNivelHabilidade(classes, 'virtuoso', 'harmonia');
  if (nvHarmonia === 0) nvHarmonia = obterNivelHabilidade(classes, 'cantor', 'harmonia');

  let nvBarreiraSonora = obterNivelHabilidade(classes, 'virtuoso', 'barreira sonora');
  if (nvBarreiraSonora === 0) nvBarreiraSonora = obterNivelHabilidade(classes, 'cantor', 'barreira sonora');

  let nvVibrato = obterNivelHabilidade(classes, 'virtuoso', 'vibrato');
  if (nvVibrato === 0) nvVibrato = obterNivelHabilidade(classes, 'cantor', 'vibrato');

  let nvCantoSereia = obterNivelHabilidade(classes, 'virtuoso', 'canto da sereia');
  if (nvCantoSereia === 0) nvCantoSereia = obterNivelHabilidade(classes, 'cantor', 'canto da sereia');

  return {
    temVirtuoso: nvMagicanto > 0 || nvHarmonia > 0 || nvBarreiraSonora > 0 || nvVibrato > 0 || nvCantoSereia > 0,
    nvMagicanto,
    nvHarmonia,
    nvBarreiraSonora,
    nvVibrato,
    nvCantoSereia
  };
}

export function gerarAcoesConflitoVirtuoso({ classes = [] } = {}) {
  const {
    nvMagicanto,
    nvHarmonia,
    nvBarreiraSonora,
    nvVibrato,
    nvCantoSereia
  } = extrairHabilidadesVirtuoso(classes);

  const acoes = [];

  if (nvMagicanto > 0) {
    acoes.push({
      id: 'virtuoso_magicanto',
      codigo: 'MAGICANTO',
      nome: '🎵 Magicanto',
      nomeCurto: 'Magicanto',
      tipo: 'acao_suporte',
      classe: 'Virtuoso',
      nivel: nvMagicanto,
      custoPm: 10,
      isAcaoExtra: false,
      descricao: 'Gasta 10, 20 ou 30 PM (Volume Fraco/Médio/Forte): Combina Volume, Escala e Tom para tecer um verso sonoro.'
    });
  }

  if (nvHarmonia > 0) {
    acoes.push({
      id: 'virtuoso_harmonia',
      codigo: 'HARMONIA',
      nome: '🎼 Harmonia',
      nomeCurto: 'Harmonia',
      tipo: 'reacao',
      classe: 'Virtuoso',
      nivel: nvHarmonia,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: `Ao atingir inimigos com verso usando arma arcana: Aliados causam +${nvHarmonia} de dano a eles OU recupere +${nvHarmonia} PM quando eles sofrerem dano.`
    });
  }

  if (nvBarreiraSonora > 0) {
    acoes.push({
      id: 'virtuoso_barreira_sonora',
      codigo: 'BARREIRA_SONORA',
      nome: '🛡️ Barreira Sonora',
      nomeCurto: 'Barreira Sonora',
      tipo: 'passiva',
      classe: 'Virtuoso',
      nivel: nvBarreiraSonora,
      passiva: true,
      isAcaoExtra: false,
      descricao: `Passiva: Após cantar verso Médio ou Forte, todo dano físico sofrido é reduzido em -${nvBarreiraSonora} até seu próximo turno.`
    });
  }

  if (nvVibrato > 0) {
    acoes.push({
      id: 'virtuoso_vibrato',
      codigo: 'VIBRATO',
      nome: '⚡ Vibrato',
      nomeCurto: 'Vibrato',
      tipo: 'reacao',
      classe: 'Virtuoso',
      nivel: nvVibrato,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: 'Reação: Imediatamente após cantar verso Fraco ou Médio, realize um ataque livre com arma (RA = 0 no dano).'
    });
  }

  if (nvCantoSereia > 0) {
    acoes.push({
      id: 'virtuoso_canto_sereia',
      codigo: 'CANTO_DA_SEREIA',
      nome: '🧜‍♀️ Canto da Sereia',
      nomeCurto: 'Canto da Sereia',
      tipo: 'passiva',
      classe: 'Virtuoso',
      nivel: nvCantoSereia,
      passiva: true,
      isAcaoExtra: false,
      descricao: 'Passiva: Permite realizar rituais de Ritualismo para projetar ilusões sonoras.'
    });
  }

  return acoes;
}
