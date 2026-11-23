/**
 * Fabula Ultima - Regras da Classe Mercador (Merchant)
 * Atlas Fantasia Bucólica (Natural Fantasy) - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesMercador(classes = []) {
  const lista = (Array.isArray(classes) ? classes : []).map((c) => ({
    ...c,
    nome_classe: c?.nome_classe || c?.nome || c?.name || ''
  }));
  const temClasse = lista.some((c) => {
    const nomeNorm = normalizarTextoCore(c.nome_classe);
    return nomeNorm.includes('mercador') || nomeNorm.includes('merchant');
  });

  if (!temClasse) return null;

  return {
    ativa: true,
    estoquePessoal: obterNivelHabilidade(lista, 'mercad', 'estoque pessoal') || obterNivelHabilidade(lista, 'mercad', 'estoque-pessoal'),
    jaOuviFalar: obterNivelHabilidade(lista, 'mercad', 'ja ouvi falar') || obterNivelHabilidade(lista, 'mercad', 'ja-ouvi-falar'),
    dataDeValidade: obterNivelHabilidade(lista, 'mercad', 'data de validade') || obterNivelHabilidade(lista, 'mercad', 'data-de-validade'),
    ventosDoComercio: obterNivelHabilidade(lista, 'mercad', 'ventos do comercio') || obterNivelHabilidade(lista, 'mercad', 'ventos-do-comercio'),
    verdadeiroTesouro: obterNivelHabilidade(lista, 'mercad', 'verdadeiro tesouro') || obterNivelHabilidade(lista, 'mercad', 'verdadeiro-tesouro')
  };
}

export function gerarAcoesConflitoMercador({ classes = [], nivelPersonagem = 5, pontosComercio = 2 } = {}) {
  const habs = extrairHabilidadesMercador(classes);
  if (!habs) return [];

  const acoes = [];
  const temPontosComercio = pontosComercio >= 1;

  if (habs.estoquePessoal > 0) {
    const maxPiAnulado = habs.estoquePessoal + 2;
    acoes.push({
      id: 'mercador_estoque_pessoal',
      codigo: 'ESTOQUE_PESSOAL',
      nome: '📦 Estoque Pessoal (Anular PI)',
      nomeCurto: 'Estoque Pessoal',
      tipo: 'reacao',
      classe: 'Mercador',
      nivel: habs.estoquePessoal,
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
      bloqueada: !temPontosComercio,
      descricao: `Gasta 1 Ponto de Comércio (${pontosComercio} disp.) para ANULAR totalmente um custo de até ${maxPiAnulado} PI de você ou de um aliado.`
    });
  }

  if (habs.jaOuviFalar > 0) {
    const bonusExame = habs.jaOuviFalar + 2;
    acoes.push({
      id: 'mercador_ja_ouvi_falar',
      codigo: 'JA_OUVI_FALAR',
      nome: '🗳️ Já Ouvi Falar',
      nomeCurto: 'Já Ouvi Falar',
      tipo: 'reacao',
      classe: 'Mercador',
      nivel: habs.jaOuviFalar,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      bonusTeste: bonusExame,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'ast',
      isAcaoExtra: true,
      passiva: false,
      bloqueada: !temPontosComercio,
      descricao: `Gasta 1 Ponto de Comércio (${pontosComercio} disp.) para conceder +${bonusExame} em teste de exame (Ação Estudo) para você ou aliado audível.`
    });
  }

  if (habs.dataDeValidade > 0) {
    const danoVenenoBase = Math.floor(nivelPersonagem / 2) + habs.dataDeValidade * 10;
    acoes.push({
      id: 'mercador_data_de_validade',
      codigo: 'DATA_DE_VALIDADE',
      nome: '☠️ Data de Validade',
      nomeCurto: 'Data de Validade',
      tipo: 'reacao',
      classe: 'Mercador',
      nivel: habs.dataDeValidade,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: danoVenenoBase,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'veneno',
      isAcaoExtra: true,
      passiva: false,
      descricao: `Ao usar poção/iguaria curativa: Pode optar por converter a cura em ${danoVenenoBase} de dano de veneno (dividido por 2 se 2+ alvos).`
    });
  }

  if (habs.ventosDoComercio > 0) {
    const capMaxPc = habs.ventosDoComercio + 3;
    acoes.push({
      id: 'mercador_ventos_do_comercio',
      codigo: 'VENTOS_DO_COMERCIO',
      nome: '💸 Ventos do Comércio',
      nomeCurto: 'Ventos do Comércio',
      tipo: 'reacao',
      classe: 'Mercador',
      nivel: habs.ventosDoComercio,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'social',
      isAcaoExtra: true,
      passiva: true,
      descricao: `Passiva: Capacidade de até ${capMaxPc} Pontos de Comércio. Permite transações raras e alimenta Estoque Pessoal e Já Ouvi Falar.`
    });
  }

  return acoes;
}
