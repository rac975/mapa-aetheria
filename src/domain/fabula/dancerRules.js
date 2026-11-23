/**
 * Fabula Ultima - Regras da Classe Dançarino (Dancer)
 * Atlas High Fantasy - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const DANCAS_CATALOGO_PADRAO = Object.freeze([
  { chave: 'flamingo', nome: 'Dança do Flamingo', elemento: 'fogo', resumo: 'Concede Resistência a Fogo ou converte dano em Fogo até próximo turno.' },
  { chave: 'garca', nome: 'Dança da Garça', elemento: 'gelo', resumo: 'Concede Resistência a Gelo ou converte dano em Gelo até próximo turno.' },
  { chave: 'falcao', nome: 'Dança do Falcão', elemento: 'raio', resumo: 'Concede Resistência a Raio ou converte dano em Raio até próximo turno.' },
  { chave: 'rouxinol', nome: 'Dança do Rouxinol', elemento: 'ar', resumo: 'Concede Resistência a Ar ou converte dano em Ar até próximo turno.' },
  { chave: 'serpente', nome: 'Dança da Serpente', elemento: 'terra', resumo: 'Concede Resistência a Terra ou converte dano em Terra até próximo turno.' },
  { chave: 'cisne', nome: 'Dança do Cisne', elemento: 'luz', resumo: 'Concede Resistência a Luz ou converte dano em Luz até próximo turno.' },
  { chave: 'corvo', nome: 'Dança do Corvo', elemento: 'trevas', resumo: 'Concede Resistência a Trevas ou converte dano em Trevas até próximo turno.' },
  { chave: 'unicornio', nome: 'Dança do Unicórnio', elemento: 'cura', resumo: 'Recupera PV em você e em aliado com Laço igual ao dado de Destreza.' },
  { chave: 'menade', nome: 'Dança da Mênade', elemento: 'dreno', resumo: 'Alvo perde PM igual ao dado de Destreza.' },
  { chave: 'borboleta', nome: 'Dança da Borboleta', elemento: 'status', resumo: 'Imunidade a condições de status até o próximo turno.' }
]);

export function extrairHabilidadesDancarino(classes = []) {
  let nvDanca = obterNivelHabilidade(classes, 'dancarino', 'danca');
  if (nvDanca === 0) nvDanca = obterNivelHabilidade(classes, 'dancarino', 'dança');

  const nvDancarinoGuerra = obterNivelHabilidade(classes, 'dancarino', 'dancarino de guerra');
  const nvMeAcompanhe = obterNivelHabilidade(classes, 'dancarino', 'me acompanhe');
  const nvSapateadoFrenetico = obterNivelHabilidade(classes, 'dancarino', 'sapateado frenetico');
  const nvTrocaFigurino = obterNivelHabilidade(classes, 'dancarino', 'troca de figurino');

  return {
    temDancarino: nvDanca > 0 || nvDancarinoGuerra > 0 || nvMeAcompanhe > 0 || nvSapateadoFrenetico > 0 || nvTrocaFigurino > 0,
    nvDanca,
    nvDancarinoGuerra,
    nvMeAcompanhe,
    nvSapateadoFrenetico,
    nvTrocaFigurino
  };
}

export function extrairDancasAprendidasFicha(ficha, classes = []) {
  const clsDancer = classes.find((c) => normalizarTextoCore(c?.nome_classe || '').includes('dancarino'));
  const habDanca = Array.isArray(clsDancer?.habilidades)
    ? clsDancer.habilidades.find((h) => normalizarTextoCore(h?.nome || '').includes('danc'))
    : null;

  const dancas = ficha?.dados_dancarino?.dancasAprendidas ||
    clsDancer?.dados_dancarino?.dancasAprendidas ||
    habDanca?.dancas_aprendidas ||
    habDanca?.dados_dancarino?.dancasAprendidas ||
    [];

  if (Array.isArray(dancas) && dancas.length > 0) {
    return dancas.map((d) => (typeof d === 'string' ? d : d?.chave || d?.id || d?.nome));
  }
  return DANCAS_CATALOGO_PADRAO.map((d) => d.chave);
}

export function gerarAcoesConflitoDancarino({ classes = [], ultimaDancaKey = null } = {}) {
  const {
    nvDanca,
    nvDancarinoGuerra,
    nvMeAcompanhe,
    nvSapateadoFrenetico,
    nvTrocaFigurino
  } = extrairHabilidadesDancarino(classes);

  const acoes = [];

  if (nvDanca > 0) {
    const custoPm = ultimaDancaKey ? 5 : 10;
    acoes.push({
      id: 'dancarino_danca',
      codigo: 'DANCA',
      nome: '💃 Apresentar Dança',
      nomeCurto: 'Dança',
      tipo: 'manobra',
      classe: 'Dançarino',
      nivel: nvDanca,
      custoPm,
      isAcaoExtra: true,
      descricao: `Gasta ${custoPm} PM (sem consumir ação; sem armadura marcial): Apresenta uma dança aprendida até o próximo turno.`
    });
  }

  if (nvDancarinoGuerra > 0) {
    acoes.push({
      id: 'dancarino_de_guerra',
      codigo: 'DANCARINO_DE_GUERRA',
      nome: '🗡️ Dançarino de Guerra',
      nomeCurto: 'Dançarino de Guerra',
      tipo: 'passiva',
      classe: 'Dançarino',
      nivel: nvDancarinoGuerra,
      passiva: true,
      isAcaoExtra: false,
      descricao: `Após dançar: +${nvDancarinoGuerra} de dano com adagas, arremesso, luta, malhos e feitiços ofensivos com arma arcana.`
    });
  }

  if (nvMeAcompanhe > 0) {
    acoes.push({
      id: 'dancarino_me_acompanhe',
      codigo: 'ME_ACOMPANHE',
      nome: '🤝 Me Acompanhe',
      nomeCurto: 'Me Acompanhe',
      tipo: 'reacao',
      classe: 'Dançarino',
      nivel: nvMeAcompanhe,
      custoPm: 10,
      isAcaoExtra: true,
      descricao: 'Ao dançar dança de turno: Gasta +10 PM para conceder os efeitos da dança também a 1 aliado com Laço de afeto.'
    });
  }

  if (nvSapateadoFrenetico > 0) {
    acoes.push({
      id: 'dancarino_sapateado_frenetico',
      codigo: 'SAPATEADO_FRENETICO',
      nome: '🩰 Sapateado Frenético',
      nomeCurto: 'Sapateado Frenético',
      tipo: 'passiva',
      classe: 'Dançarino',
      nivel: nvSapateadoFrenetico,
      passiva: true,
      isAcaoExtra: false,
      descricao: `Passiva em Dança: +${nvSapateadoFrenetico * 2} em testes opostos de acrobacia, coordenação ou velocidade.`
    });
  }

  if (nvTrocaFigurino > 0) {
    acoes.push({
      id: 'dancarino_troca_figurino',
      codigo: 'TROCA_FIGURINO',
      nome: '🎭 Troca de Figurino',
      nomeCurto: 'Troca de Figurino',
      tipo: 'reacao',
      classe: 'Dançarino',
      nivel: nvTrocaFigurino,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: 'Reação após apresentar dança: realiza a ação Equipamento sem gastar ação.'
    });
  }

  return acoes;
}
