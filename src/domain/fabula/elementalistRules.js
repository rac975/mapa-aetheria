/**
 * Fabula Ultima - Regras da Classe Elementalista (Elementalist)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesElementalista({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('elementalista') || nome.includes('elementalist');
  });

  const nvArtilhariaMagica = obterNivelHabilidade(listaClasses, 'elementalista', 'artilharia magica');
  const nvCataclismo = obterNivelHabilidade(listaClasses, 'elementalista', 'cataclismo');
  const nvLaminaMagica = obterNivelHabilidade(listaClasses, 'elementalista', 'lamina magica');

  return {
    temClasse,
    habilidades: {
      artilhariaMagica: {
        nivel: nvArtilhariaMagica,
        ativo: nvArtilhariaMagica > 0,
        bonusMagia: nvArtilhariaMagica * 2
      },
      cataclismo: {
        nivel: nvCataclismo,
        ativo: nvCataclismo > 0,
        maxPmAdicional: nvCataclismo * 10
      },
      laminaMagica: {
        nivel: nvLaminaMagica,
        ativo: nvLaminaMagica > 0,
        maxCustoPmFeitico: nvLaminaMagica * 20
      }
    }
  };
}

export function calcularBonusCataclismo({ pmGastoExtra = 0 } = {}) {
  const pm = Math.max(0, parseInt(pmGastoExtra, 10) || 0);
  const blocos = Math.floor(pm / 10);
  return blocos * 5;
}

export function gerarAcoesConflitoElementalista({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesElementalista({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  if (dados.habilidades.cataclismo.ativo) {
    const np = dados.habilidades.cataclismo.nivel;
    acoes.push({
      id: 'elementalista_cataclismo',
      codigo: 'CATACLISMO',
      nome: `🌋 Cataclismo (+10 a +${np * 10} PM • +5 a +${np * 5} Dano)`,
      nomeCurto: 'Cataclismo',
      tipo: 'modificador_feitico',
      classe: 'Elementalista',
      nivel: np,
      maxPmExtra: np * 10,
      isAcaoExtra: true,
      descricao: `Ao lançar feitiço instantâneo com arma arcana: gasta até ${np * 10} PM adicionais (+5 de dano para cada 10 PM gastos).`
    });
  }

  if (dados.habilidades.laminaMagica.ativo) {
    const np = dados.habilidades.laminaMagica.nivel;
    acoes.push({
      id: 'elementalista_lamina_magica',
      codigo: 'LAMINA_MAGICA',
      nome: `🗡️ Lâmina Mágica (Feitiço ≤ ${np * 20} PM com Arma)`,
      nomeCurto: 'Lâmina Mágica',
      tipo: 'modificador_feitico',
      classe: 'Elementalista',
      nivel: np,
      isAcaoExtra: true,
      descricao: `Ao lançar feitiço ofensivo de alvo único (≤ ${np * 20} PM): usa a fórmula de Precisão da arma equipada (+${np} se a fórmula incluir Destreza).`
    });
  }

  return acoes;
}
