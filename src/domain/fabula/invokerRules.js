/**
 * Fabula Ultima - Regras da Classe Invocador (Invoker)
 * Atlas Fantasia BucÃ³lica (Natural Fantasy) - Clean Architecture: FunÃ§Ãµes Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const MANANCIAIS_CONFLITO = Object.freeze([
  { chave: 'fogo', nome: 'Manancial de Fogo', tipoDano: 'fogo', pragas: ['gelo', 'veneno'] },
  { chave: 'agua', nome: 'Manancial de Ã gua', tipoDano: 'gelo', pragas: ['fogo', 'raio'] },
  { chave: 'ar', nome: 'Manancial de Ar', tipoDano: 'ar', pragas: ['terra', 'raio'] },
  { chave: 'terra', nome: 'Manancial de Terra', tipoDano: 'terra', pragas: ['ar', 'gelo'] },
  { chave: 'raio', nome: 'Manancial de Raio', tipoDano: 'raio', pragas: ['fogo', 'terra'] }
]);

export function extrairHabilidadesInvocador(classes = []) {
  const lista = (Array.isArray(classes) ? classes : []).map((c) => ({
    ...c,
    nome_classe: c?.nome_classe || c?.nome || c?.name || ''
  }));
  const temClasse = lista.some((c) => {
    const nomeNorm = normalizarTextoCore(c.nome_classe);
    return nomeNorm.includes('invocador') || nomeNorm.includes('invoker');
  });

  if (!temClasse) return null;

  return {
    ativa: true,
    invocacao: obterNivelHabilidade(lista, 'invoc', 'invocacao') || obterNivelHabilidade(lista, 'invoc', 'invocação'),
    invocacoesConectadas: obterNivelHabilidade(lista, 'invoc', 'invocacoes conectadas') || obterNivelHabilidade(lista, 'invoc', 'invocacoes-conectadas'),
    expandirManancial: obterNivelHabilidade(lista, 'invoc', 'expandir manancial'),
    cascata: obterNivelHabilidade(lista, 'invoc', 'cascata'),
    harmoniaElemental: obterNivelHabilidade(lista, 'invoc', 'harmonia elemental')
  };
}

export function gerarAcoesConflitoInvocador({ classes = [], nivelPersonagem = 5 } = {}) {
  const habs = extrairHabilidadesInvocador(classes);
  if (!habs) return [];

  const acoes = [];
  const bonusNivelDano = nivelPersonagem >= 40 ? 10 : (nivelPersonagem >= 20 ? 5 : 0);
  const bonusNivelCura = nivelPersonagem >= 40 ? 20 : (nivelPersonagem >= 20 ? 10 : 0);

  if (habs.invocacao > 0) {
    const danoExplosao = 20 + bonusNivelDano + (habs.expandirManancial || 0);
    const curaBencao = 30 + bonusNivelCura;

    acoes.push({
      id: 'invocador_invocacao',
      codigo: 'INVOCACAO',
      nome: 'âš„ï¸  Invocador: Canalizar InvocaÃ§Ã£o',
      nomeCurto: 'InvocaÃ§Ã£o',
      tipo: 'especial',
      classe: 'Invocador',
      nivel: habs.invocacao,
      custoPm: 5,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: danoExplosao,
      curaAplicada: curaBencao,
      recursoCura: 'pv',
      tipoDano: 'fogo',
      isAcaoExtra: false,
      passiva: false,
      descricao: `Gasta 5 PM: Canaliza um manancial presente sem rolagem de dados (acerto automÃ¡tico!). OpÃ§Ãµes: ExplosÃ£o (${danoExplosao} de dano), Praga (+${5 + (habs.expandirManancial || 0)} dano elemental), BÃªnÃ§Ã£o (${curaBencao} PV) ou Dreno (${20 + bonusNivelCura} PM).`
    });
  }

  if (habs.invocacoesConectadas > 0) {
    const maxPmConexao = habs.invocacoesConectadas * 10;
    acoes.push({
      id: 'invocador_invocacoes_conectadas',
      codigo: 'INVOCACOES_CONECTADAS',
      nome: 'ðŸ”— InvocaÃ§Ãµes Conectadas',
      nomeCurto: 'InvocaÃ§Ãµes Conectadas',
      tipo: 'reacao',
      classe: 'Invocador',
      nivel: habs.invocacoesConectadas,
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
      descricao: `Ao realizar Invocador: Gaste atÃ© ${maxPmConexao} PM adicionais (10 PM por criatura adicional visÃ­vel afetada pela invocaÃ§Ã£o).`
    });
  }

  if (habs.cascata > 0) {
    acoes.push({
      id: 'invocador_cascata',
      codigo: 'CASCATA',
      nome: 'ðŸŒŠ Cascata',
      nomeCurto: 'Cascata',
      tipo: 'reacao',
      classe: 'Invocador',
      nivel: habs.cascata,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: 0,
      curaAplicada: 0,
      bonusTeste: habs.cascata,
      recursoCura: 'pv',
      tipoDano: 'fisico',
      isAcaoExtra: true,
      passiva: false,
      descricao: `ReaÃ§Ã£o: ApÃ³s inimigo sofrer dano ampliado por sua Praga, faÃ§a ataque livre com +${habs.cascata} na PrecisÃ£o, causando o mesmo elemento do aliado e dissipando as pragas.`
    });
  }

  if (habs.expandirManancial > 0) {
    acoes.push({
      id: 'invocador_expandir_manancial',
      codigo: 'EXPANDIR_MANANCIAL',
      nome: 'âœ¨ Expandir Manancial',
      nomeCurto: 'Expandir Manancial',
      tipo: 'reacao',
      classe: 'Invocador',
      nivel: habs.expandirManancial,
      custoPm: 0,
      custoPv: 0,
      custoPi: 0,
      custoPf: 0,
      danoAplicado: habs.expandirManancial,
      curaAplicada: 0,
      recursoCura: 'pv',
      tipoDano: 'energia',
      isAcaoExtra: true,
      passiva: true,
      descricao: `Passiva com arma leve/arcana: InvocaÃ§Ãµes de ExplosÃ£o causam +${habs.expandirManancial} de dano e Pragas recebem +${habs.expandirManancial} de bÃ´nus.`
    });
  }

  return acoes;
}
