import {
  ACOES_CONFLITO_OFICIAIS,
  REACOES_COMBATE_OFICIAIS,
  MANOBRAS_TATICAS_OFICIAIS
} from '../../domain/fabula/combatRules';

export const CATEGORIAS_ACOES = [
  {
    id: 'principais',
    label: 'Ações Principais',
    opcoes: Object.values(ACOES_CONFLITO_OFICIAIS).map((a) => ({ ...a, categoriaTab: 'principais', isReacao: false }))
  },
  {
    id: 'reacoes',
    label: 'Reações',
    opcoes: Object.values(REACOES_COMBATE_OFICIAIS).map((r) => ({ ...r, categoriaTab: 'reacoes', isReacao: true }))
  },
  {
    id: 'manobras',
    label: 'Manobras',
    opcoes: Object.values(MANOBRAS_TATICAS_OFICIAIS).map((m) => ({ ...m, categoriaTab: 'manobras', isReacao: false }))
  }
];

export const TODAS_OPCOES = CATEGORIAS_ACOES.flatMap((c) => c.opcoes);
