/**
 * Fabula Ultima - Regras da Classe Guerreiro Sombrio (Darkblade)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export function extrairHabilidadesGuerreiroSombrio({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClasse = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('guerreiro sombrio') || nome.includes('darkblade');
  });

  const nvAgonia = obterNivelHabilidade(listaClasses, 'guerreiro sombrio', 'agonia');
  const nvCoracaoEscuridao = obterNivelHabilidade(listaClasses, 'guerreiro sombrio', 'coracao da escuridao');
  const nvGolpeSombras = obterNivelHabilidade(listaClasses, 'guerreiro sombrio', 'golpe das sombras');
  const nvLicaoDolorosa = obterNivelHabilidade(listaClasses, 'guerreiro sombrio', 'licao dolorosa');
  const nvSangueTrevas = obterNivelHabilidade(listaClasses, 'guerreiro sombrio', 'sangue das trevas');

  return {
    temClasse,
    habilidades: {
      agonia: {
        nivel: nvAgonia,
        ativo: nvAgonia > 0,
        recuperacaoRecursos: nvAgonia * 2
      },
      coracaoDaEscuridao: {
        nivel: nvCoracaoEscuridao,
        ativo: nvCoracaoEscuridao > 0
      },
      golpeDasSombras: {
        nivel: nvGolpeSombras,
        ativo: nvGolpeSombras > 0
      },
      licaoDolorosa: {
        nivel: nvLicaoDolorosa,
        ativo: nvLicaoDolorosa > 0,
        bonusEstudo: nvLicaoDolorosa
      },
      sangueDasTrevas: {
        nivel: nvSangueTrevas,
        ativo: nvSangueTrevas > 0
      }
    }
  };
}

export function calcularDanoGolpeDasSombras({ nivel = 1, valorDadoVigor = 6 } = {}) {
  const np = Math.max(1, parseInt(nivel, 10) || 1);
  const vig = Math.max(1, parseInt(valorDadoVigor, 10) || 6);
  return {
    custoPv: vig,
    bonusDano: np + vig,
    tipoDano: 'sombrio'
  };
}

export function gerarAcoesConflitoGuerreiroSombrio({ classes = [], ficha = null } = {}) {
  const dados = extrairHabilidadesGuerreiroSombrio({ classes, ficha });
  if (!dados.temClasse) return [];

  const acoes = [];

  // 1. Golpe das Sombras
  if (dados.habilidades.golpeDasSombras.ativo) {
    const np = dados.habilidades.golpeDasSombras.nivel;
    acoes.push({
      id: 'guerreiro_golpe_das_sombras',
      codigo: 'GOLPE_DAS_SOMBRAS',
      nome: `🌑 Golpe das Sombras (Perde VIG em PV • +[${np}+VIG] Dano Sombrio)`,
      nomeCurto: 'Golpe das Sombras',
      tipo: 'acao_combate',
      classe: 'Guerreiro Sombrio',
      nivel: np,
      tipoDano: 'sombrio',
      descricao: `Role o dado atual de Vigor e perca PV iguais ao valor rolado. Realize ataque livre com arma: o dano torna-se Sombrio e ganha +[${np} + Vigor rolado] de dano adicional.`
    });
  }

  // 2. Agonia
  if (dados.habilidades.agonia.ativo) {
    const np = dados.habilidades.agonia.nivel;
    const rec = np * 2;
    acoes.push({
      id: 'guerreiro_agonia',
      codigo: 'AGONIA',
      nome: `🩸 Agonia (Reação • +${rec} PV e +${rec} PM ao ferir alvo com Laço)`,
      nomeCurto: 'Agonia',
      tipo: 'reacao_combate',
      classe: 'Guerreiro Sombrio',
      nivel: np,
      isAcaoExtra: true,
      descricao: `Após causar dano a um ou mais inimigos com os quais possui Laço: recupera +${rec} PV e +${rec} PM (1 vez por turno).`
    });
  }

  // 3. Coração da Escuridão
  if (dados.habilidades.coracaoDaEscuridao.ativo) {
    acoes.push({
      id: 'guerreiro_coracao_escuridao',
      codigo: 'CORACAO_DA_ESCURIDAO',
      nome: '🖤 Coração da Escuridão (1x por Cena ao entrar em Crise: Cria Laço de Ódio)',
      nomeCurto: 'Coração da Escuridão',
      tipo: 'reacao_combate',
      classe: 'Guerreiro Sombrio',
      isAcaoExtra: true,
      descricao: 'Uma vez por cena ao entrar em Crise: escolha criatura visível sem Laço e crie imediatamente um Laço de ódio contra ela.'
    });
  }

  // 4. Lição Dolorosa
  if (dados.habilidades.licaoDolorosa.ativo) {
    const np = dados.habilidades.licaoDolorosa.nivel;
    acoes.push({
      id: 'guerreiro_licao_dolorosa',
      codigo: 'LICAO_DOLOROSA',
      nome: `👁️ Lição Dolorosa (Estudo Reativo com +${np} ao sofrer dano)`,
      nomeCurto: 'Lição Dolorosa',
      tipo: 'reacao_combate',
      classe: 'Guerreiro Sombrio',
      nivel: np,
      bonusEstudo: np,
      isAcaoExtra: true,
      descricao: `Quando outra criatura fizer você perder PV: pode realizar a ação Estudo imediatamente contra ela com bônus de +${np} no teste.`
    });
  }

  return acoes;
}
