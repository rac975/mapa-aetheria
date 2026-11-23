/**
 * Fabula Ultima - Regras da Classe Piloto em Conflito (Techno Fantasy Atlas)
 * Clean Architecture: funções puras sem dependências de React ou Supabase.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

/**
 * Extrai as habilidades e poderes do Piloto a partir dos dados da ficha.
 */
export function extrairHabilidadesPiloto({ classes = [], ficha = null } = {}) {
  const listaClasses = Array.isArray(classes) && classes.length > 0
    ? classes
    : (Array.isArray(ficha?.classes) ? ficha.classes : (Array.isArray(ficha?.fichas_classes) ? ficha.fichas_classes : []));

  const temClassePiloto = listaClasses.some((c) => {
    const nome = normalizarTextoCore(c?.nome_classe || c?.classe || '');
    return nome.includes('piloto') || nome.includes('pilot');
  });

  const nvCoracao = obterNivelHabilidade(listaClasses, 'piloto', 'coracao no motor');
  const nvFlexivel = obterNivelHabilidade(listaClasses, 'piloto', 'configuracao flexivel');
  const nvVeiculo = obterNivelHabilidade(listaClasses, 'piloto', 'veiculo pessoal');
  const nvPulsoFirme = obterNivelHabilidade(listaClasses, 'piloto', 'pulso firme');

  const nivelTotal = listaClasses.reduce((acc, c) => acc + (parseInt(c?.nivel, 10) || 0), 0) || Number(ficha?.nivel) || 5;

  return {
    temClassePiloto,
    nivelTotal,
    habilidades: {
      coracaoNoMotor: { nivel: nvCoracao, ativo: nvCoracao > 0, bonusMax: nvCoracao * 2 },
      configuracaoFlexivel: { nivel: nvFlexivel, ativo: nvFlexivel > 0, maxModulos: nvFlexivel },
      veiculoPessoal: { nivel: nvVeiculo, ativo: nvVeiculo > 0 },
      pulsoFirme: { nivel: nvPulsoFirme, ativo: nvPulsoFirme > 0 }
    }
  };
}

/**
 * Calcula o efeito oficial de Coração no Motor (10 PM).
 */
export function calcularEfeitoCoracaoNoMotor(nivelHabilidade = 1, modo = 'ataque') {
  const np = Math.max(1, Math.min(3, parseInt(nivelHabilidade, 10) || 1));
  const custoMp = 10;
  const bonusDano = np * 2;
  const reducaoDano = np * 2;
  const curaStatus = ['lento', 'fraco'];

  let mensagem = '';
  if (modo === 'defesa') {
    mensagem = `Coração no Motor (10 PM): Próximo dano sofrido reduzido em ${reducaoDano}!`;
  } else if (modo === 'cura') {
    mensagem = 'Coração no Motor (10 PM): Condições Lento e Fraco curadas com sucesso!';
  } else {
    mensagem = `Coração no Motor (10 PM): +${bonusDano} de dano no próximo ataque!`;
  }

  return {
    np,
    custoMp,
    bonusDano,
    reducaoDano,
    curaStatus,
    mensagem
  };
}

/**
 * Gera as ações de conflito oficiais da classe Piloto para a Central de Turno.
 */
export function gerarAcoesConflitoPiloto({ classes = [], poderesHeroicos = [], ficha = null } = {}) {
  const dados = extrairHabilidadesPiloto({ classes, poderesHeroicos, ficha });
  if (!dados.temClassePiloto) return [];

  const acoes = [];

  // 1. Coração no Motor (NP 1-3)
  if (dados.habilidades.coracaoNoMotor.ativo) {
    const np = dados.habilidades.coracaoNoMotor.nivel;
    acoes.push({
      id: 'piloto_coracao_no_motor',
      codigo: 'CORACAO_NO_MOTOR',
      nome: `⚙️ Coração no Motor (10 PM • Nv ${np})`,
      nomeCurto: 'Coração no Motor',
      tipo: 'modificador_ataque',
      classe: 'Piloto',
      nivel: np,
      custoPm: 10,
      isAcaoExtra: true,
      descricao: `Gasta 10 PM para escolher: +${np * 2} de dano no próximo ataque, reduzir próximo dano sofrido em ${np * 2}, ou curar Lento e Fraco.`
    });
  }

  // 2. Configuração Flexível (NP 1-3)
  if (dados.habilidades.configuracaoFlexivel.ativo) {
    const np = dados.habilidades.configuracaoFlexivel.nivel;
    acoes.push({
      id: 'piloto_configuracao_flexivel',
      codigo: 'CONFIGURACAO_FLEXIVEL',
      nome: `🔧 Configuração Flexível (Troca até ${np} módulos)`,
      nomeCurto: 'Configuração Flexível',
      tipo: 'acao_suporte',
      classe: 'Piloto',
      nivel: np,
      custoPm: 0,
      descricao: `Gasta 1 ação para trocar até ${np} módulo(s) ou arma(s) ativos do veículo pessoal por opções do hangar/reserva.`
    });
  }

  return acoes;
}
