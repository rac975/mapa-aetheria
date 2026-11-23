/**
 * Fabula Ultima - Regras da Classe Furioso (Fury)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesFurioso({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('furioso') || nome.includes('fury') || nome.includes('berserker');
  });

  const nvAdrenalina = obterNivelHabilidade(listaClasses, 'furioso', 'adrenalina');
  const nvEspiritoIndomavel = obterNivelHabilidade(listaClasses, 'furioso', 'espirito indomavel');
  const nvFrenesi = obterNivelHabilidade(listaClasses, 'furioso', 'frenesi');
  const nvProvocar = obterNivelHabilidade(listaClasses, 'furioso', 'provocar');
  const nvResistir = obterNivelHabilidade(listaClasses, 'furioso', 'resistir');

  const lacos = Array.isArray(ficha?.lacos) ? ficha.lacos : [];
  let maiorForcaLaco = 1;
  lacos.forEach((l) => {
    const forca = Number(l?.forca) || (Array.isArray(l?.sentimentos) ? l.sentimentos.length : 1);
    if (forca > maiorForcaLaco) maiorForcaLaco = forca;
  });

  return {
    temClasse,
    maiorForcaLaco,
    habilidades: {
      adrenalina: {
        nivel: nvAdrenalina,
        ativo: nvAdrenalina > 0,
        bonusDanoCrise: nvAdrenalina * 2
      },
      espiritoIndomavel: {
        nivel: nvEspiritoIndomavel,
        ativo: nvEspiritoIndomavel > 0,
        recuperacaoPf: nvEspiritoIndomavel * 5
      },
      frenesi: {
        nivel: nvFrenesi,
        ativo: nvFrenesi > 0
      },
      provocar: {
        nivel: nvProvocar,
        ativo: nvProvocar > 0,
        bonusTeste: nvProvocar,
        custoPm: 5
      },
      resistir: {
        nivel: nvResistir,
        ativo: nvResistir > 0,
        curaPvGuarda: nvResistir * maiorForcaLaco
      }
    }
  };
}

export function calcularBonusDanoAdrenalina({ nivel = 1, emCrise = false } = {}) {
  if (!emCrise) return 0;
  const np = Math.max(1, parseInt(nivel, 10) || 1);
  return np * 2;
}

export function gerarAcoesConflitoFurioso({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesFurioso({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  // 1. Provocar
  if (dados.habilidades.provocar.ativo) {
    const np = dados.habilidades.provocar.nivel;
    acoes.push({
      id: 'furioso_provocar',
      codigo: 'PROVOCAR',
      nome: `💢 Provocar (5 PM • [VIG+VON]+${np} • Enfurecido)`,
      nomeCurto: 'Provocar',
      tipo: 'acao_combate',
      classe: 'Furioso',
      nivel: np,
      custoPm: 5,
      attr1: 'vig',
      attr2: 'von',
      bonusTeste: np,
      descricao: `Gasta 5 PM e faz teste oposto [VIG + VON] + ${np} contra alvo visível. Se vencer, o alvo fica Enfurecido e é compelido a focar você em seus ataques.`
    });
  }

  // 2. Resistir
  if (dados.habilidades.resistir.ativo) {
    const np = dados.habilidades.resistir.nivel;
    const cura = dados.habilidades.resistir.curaPvGuarda;
    acoes.push({
      id: 'furioso_resistir',
      codigo: 'RESISTIR',
      nome: `🛡️ Resistir (+${cura} PV na Guarda • +1 Passo Atributo)`,
      nomeCurto: 'Resistir',
      tipo: 'acao_combate',
      classe: 'Furioso',
      nivel: np,
      curaPv: cura,
      descricao: `Ao realizar a ação Guarda sem cobrir aliado: recupera +${cura} PV (${np} × Força do Laço) e aumenta Vigor ou Vontade em um passo (máx d12) até o fim do próximo turno.`
    });
  }

  // 3. Espírito Indomável
  if (dados.habilidades.espiritoIndomavel.ativo) {
    const np = dados.habilidades.espiritoIndomavel.nivel;
    const rec = np * 5;
    acoes.push({
      id: 'furioso_espirito_indomavel',
      codigo: 'ESPIRITO_INDOMAVEL',
      nome: `🔥 Espírito Indomável (Reação ao gastar PF: +${rec} PV/PM ou Curar Condição)`,
      nomeCurto: 'Espírito Indomável',
      tipo: 'reacao_combate',
      classe: 'Furioso',
      nivel: np,
      isAcaoExtra: true,
      descricao: `Ao gastar 1 ou mais Pontos de Fábula: recupera +${rec} PV, ou +${rec} PM, ou cura 1 condição à sua escolha.`
    });
  }

  return acoes;
}
