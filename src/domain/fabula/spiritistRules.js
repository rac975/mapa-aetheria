/**
 * Fabula Ultima - Regras da Classe Espiritualista (Spiritist)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesEspiritualista({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('espiritualista') || nome.includes('spiritist');
  });

  const nvPoderCurativo = obterNivelHabilidade(listaClasses, 'espiritualista', 'poder curativo');
  const nvMagiaSuporte = obterNivelHabilidade(listaClasses, 'espiritualista', 'magia de suporte');
  const nvVismagus = obterNivelHabilidade(listaClasses, 'espiritualista', 'vismagus');

  const lacos = Array.isArray(ficha?.lacos) ? ficha.lacos : [];
  const numLacos = lacos.length;

  return {
    temClasse,
    numLacos,
    habilidades: {
      poderCurativo: {
        nivel: nvPoderCurativo,
        ativo: nvPoderCurativo > 0,
        curaExtra: nvPoderCurativo > 0 ? (3 + (nvPoderCurativo * numLacos)) : 0
      },
      magiaDeSuporte: {
        nivel: nvMagiaSuporte,
        ativo: nvMagiaSuporte > 0
      },
      vismagus: {
        nivel: nvVismagus,
        ativo: nvVismagus > 0
      }
    }
  };
}

export function calcularCustoVismagus(custoPmTotal = 0) {
  const pm = Math.max(0, parseInt(custoPmTotal, 10) || 0);
  return 10 + pm;
}

export function gerarAcoesConflitoEspiritualista({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesEspiritualista({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  if (dados.habilidades.vismagus.ativo) {
    acoes.push({
      id: 'espiritualista_vismagus',
      codigo: 'VISMAGUS',
      nome: '🩸 Vismagus (Pagar Feitiço com PV: 10 + Custo PM)',
      nomeCurto: 'Vismagus',
      tipo: 'modificador_feitico',
      classe: 'Espiritualista',
      isAcaoExtra: true,
      descricao: 'Ao lançar um feitiço sem PM suficientes: pode pagar (10 + custo total do feitiço) em PV em vez de PM (não pode reduzir a 0 PV).'
    });
  }

  if (dados.habilidades.poderCurativo.ativo) {
    const np = dados.habilidades.poderCurativo.nivel;
    const curaExtra = dados.habilidades.poderCurativo.curaExtra;
    acoes.push({
      id: 'espiritualista_poder_curativo',
      codigo: 'PODER_CURATIVO',
      nome: `✨ Poder Curativo (+${curaExtra} PV por Aliado Alvo)`,
      nomeCurto: 'Poder Curativo',
      tipo: 'efeito_passivo',
      classe: 'Espiritualista',
      nivel: np,
      isAcaoExtra: true,
      descricao: `Ao lançar feitiço em aliados com arma arcana equipada: cada aliado recupera +${curaExtra} PV adicionais (3 + [${np} × ${dados.numLacos} Laços]).`
    });
  }

  return acoes;
}
