/**
 * Fabula Ultima - Regras da Classe Gourmet
 * Atlas Fantasia BucÃ³lica (Natural Fantasy) - Clean Architecture: FunÃ§Ãµes Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const SABORES_GOURMET = Object.freeze([
  { chave: 'amargo', nome: 'Amargo', desc: 'Dano de veneno, debuffs de status ou dano sombrio' },
  { chave: 'salgado', nome: 'Salgado', desc: 'Aumentos de defesa, resistÃªncias ou reduÃ§Ã£o de dano' },
  { chave: 'azedo', nome: 'Azedo', desc: 'Ataques rÃ¡pidos, debuffs em atributos ou dano Ã¡cido' },
  { chave: 'doce', nome: 'Doce', desc: 'RecuperaÃ§Ã£o de PV, cura de condiÃ§Ãµes ou cura contÃ­nua' },
  { chave: 'umami', nome: 'Umami', desc: 'RecuperaÃ§Ã£o de PM, potencializaÃ§Ã£o de feitiÃ§os e rituais' }
]);

export function extrairHabilidadesGourmet(classes = []) {
  const lista = (Array.isArray(classes) ? classes : []).map((c) => ({
    ...c,
    nome_classe: c?.nome_classe || c?.nome || c?.name || ''
  }));
  const temClasse = lista.some((c) => {
    const nomeNorm = normalizarTextoCore(c.nome_classe);
    return nomeNorm.includes('gourmet');
  });

  if (!temClasse) return null;

  return {
    ativa: true,
    culinaria: obterNivelHabilidade(lista, 'gourmet', 'culinaria'),
    feitoComAmor: obterNivelHabilidade(lista, 'gourmet', 'feito com amor') || obterNivelHabilidade(lista, 'gourmet', 'feito-com-amor'),
    garfoEFaca: obterNivelHabilidade(lista, 'gourmet', 'garfo e faca') || obterNivelHabilidade(lista, 'gourmet', 'garfo-e-faca'),
    salEPimenta: obterNivelHabilidade(lista, 'gourmet', 'sal e pimenta') || obterNivelHabilidade(lista, 'gourmet', 'sal-e-pimenta'),
    cozinheiroViajante: obterNivelHabilidade(lista, 'gourmet', 'cozinheiro viajante')
  };
}

export function gerarAcoesConflitoGourmet({ classes = [], ingredientes = 10 } = {}) {
  const habs = extrairHabilidadesGourmet(classes);
  if (!habs) return [];

  const acoes = [];

  if (habs.culinaria > 0) {
    const capacidadeIngredientes = 10 + habs.culinaria * 5;
    const temIngredientes = ingredientes >= 2;

    acoes.push({
      id: 'gourmet_culinaria_suporte',
      codigo: 'CULINARIA',
      nome: 'ðŸ µ CulinÃ¡ria: Banquete Aliado',
      nomeCurto: 'CulinÃ¡ria (Aliados)',
      tipo: 'especial',
      classe: 'Gourmet',
      nivel: habs.culinaria,
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
      bloqueada: !temIngredientes,
      descricao: `Gasta 1 aÃ§Ã£o e consome 2 ou 3 ingredientes (${ingredientes}/${capacidadeIngredientes}) preparando uma iguaria. Aplica os efeitos em vocÃª e em 1 aliado visÃ­vel.`
    });

    acoes.push({
      id: 'gourmet_culinaria_ofensiva',
      codigo: 'CULINARIA_OFENSIVA',
      nome: 'ðŸ´ CulinÃ¡ria: Ataque CulinÃ¡rio',
      nomeCurto: 'CulinÃ¡ria (Ataque)',
      tipo: 'especial',
      classe: 'Gourmet',
      nivel: habs.culinaria,
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
      bloqueada: !temIngredientes,
      descricao: `Gasta 1 aÃ§Ã£o e 2 ou 3 ingredientes: Ataque livre com arma que nÃ£o causa dano aplicando os efeitos da iguaria em cada inimigo atingido${habs.garfoEFaca > 0 ? ' (Com Garfo e Faca e 2 ingredientes: causa dano normal com RA = 0)' : ''}.`
    });
  }

  if (habs.feitoComAmor > 0) {
    const maxPmAmor = habs.feitoComAmor * 10;
    acoes.push({
      id: 'gourmet_feito_com_amor',
      codigo: 'FEITO_COM_AMOR',
      nome: 'â¤ï¸  Feito com Amor',
      nomeCurto: 'Feito com Amor',
      tipo: 'reacao',
      classe: 'Gourmet',
      nivel: habs.feitoComAmor,
      custoPm: 10,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'luz',
      isAcaoExtra: true,
      passiva: false,
      descricao: `Ao usar CulinÃ¡ria em aliados: Gaste atÃ© ${maxPmAmor} PM (10 PM por aliado adicional visÃ­vel para tambÃ©m receber os efeitos da iguaria).`
    });
  }

  if (habs.salEPimenta > 0) {
    acoes.push({
      id: 'gourmet_sal_e_pimenta',
      codigo: 'SAL_E_PIMENTA',
      nome: 'ðŸ§‚ Sal e Pimenta',
      nomeCurto: 'Sal e Pimenta',
      tipo: 'reacao',
      classe: 'Gourmet',
      nivel: habs.salEPimenta,
      custoPm: 0,
      custoPv: 0,
      custoPi: 2,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'fisico',
      isAcaoExtra: true,
      passiva: false,
      descricao: 'Ao preparar uma iguaria: Gasta 2 PI para transformar o sabor de um ingrediente em qualquer outro sabor a sua escolha.'
    });
  }

  if (habs.garfoEFaca > 0) {
    acoes.push({
      id: 'gourmet_garfo_e_faca',
      codigo: 'GARFO_E_FACA',
      nome: 'ðŸ´ Garfo e Faca',
      nomeCurto: 'Garfo e Faca',
      tipo: 'reacao',
      classe: 'Gourmet',
      nivel: habs.garfoEFaca,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'fisico',
      isAcaoExtra: true,
      passiva: true,
      descricao: `Passiva: Ao usar CulinÃ¡ria ofensiva combinando exatamente 2 ingredientes, seu ataque livre causa dano normal com arma equipada (RA = 0 no dano).`
    });
  }

  return acoes;
}
