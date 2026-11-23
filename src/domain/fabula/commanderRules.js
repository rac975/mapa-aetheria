/**
 * Fabula Ultima - Regras da Classe Comandante (Commander)
 * Atlas High Fantasy - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade } from './coreClassRules.js';

export function extrairHabilidadesComandante(classes = []) {
  const nvCargaCavalaria = obterNivelHabilidade(classes, 'comandante', 'carga de cavalaria');
  const nvDecretoBispo = obterNivelHabilidade(classes, 'comandante', 'decreto do bispo');
  const nvRoqueRei = obterNivelHabilidade(classes, 'comandante', 'roque do rei');
  const nvGambitoDama = obterNivelHabilidade(classes, 'comandante', 'gambito da dama');
  const nvCarruagemDevastadora = obterNivelHabilidade(classes, 'comandante', 'carruagem devastadora');

  return {
    temComandante: nvCargaCavalaria > 0 || nvDecretoBispo > 0 || nvRoqueRei > 0 || nvGambitoDama > 0 || nvCarruagemDevastadora > 0,
    nvCargaCavalaria,
    nvDecretoBispo,
    nvRoqueRei,
    nvGambitoDama,
    nvCarruagemDevastadora
  };
}

export function gerarAcoesConflitoComandante({ classes = [] } = {}) {
  const {
    nvCargaCavalaria,
    nvDecretoBispo,
    nvRoqueRei,
    nvGambitoDama,
    nvCarruagemDevastadora
  } = extrairHabilidadesComandante(classes);

  const acoes = [];

  if (nvCargaCavalaria > 0) {
    acoes.push({
      id: 'comandante_carga_cavalaria',
      codigo: 'CARGA_CAVALARIA',
      nome: '🐎 Carga de Cavalaria',
      nomeCurto: 'Carga de Cavalaria',
      tipo: 'acao_suporte',
      classe: 'Comandante',
      nivel: nvCargaCavalaria,
      custoPm: 10,
      bonusTeste: nvCargaCavalaria,
      isAcaoExtra: false,
      descricao: `Gasta 10 PM: Aliado audível realiza ataque livre imediato com +${nvCargaCavalaria} na Precisão (RA = 0 no cálculo do dano).`
    });
  }

  if (nvDecretoBispo > 0) {
    const bonusDano = nvDecretoBispo * 3;
    acoes.push({
      id: 'comandante_decreto_bispo',
      codigo: 'DECRETO_DO_BISPO',
      nome: '📜 Decreto do Bispo',
      nomeCurto: 'Decreto do Bispo',
      tipo: 'acao_suporte',
      classe: 'Comandante',
      nivel: nvDecretoBispo,
      custoPm: 10,
      danoAplicado: bonusDano,
      isAcaoExtra: false,
      descricao: `Gasta 10 PM: Até início do próximo turno, escolha: Custos de PM dobrados OU todas as fontes causam +${bonusDano} de dano.`
    });
  }

  if (nvRoqueRei > 0) {
    const bonusCuraPm = nvRoqueRei * 5;
    acoes.push({
      id: 'comandante_roque_rei',
      codigo: 'ROQUE_DO_REI',
      nome: '🏰 Roque do Rei',
      nomeCurto: 'Roque do Rei',
      tipo: 'acao_suporte',
      classe: 'Comandante',
      nivel: nvRoqueRei,
      custoPm: 10,
      isAcaoExtra: false,
      descricao: `Gasta 10 PM: Até início do próximo turno, escolha: Nenhuma criatura recupera PV/PM OU efeitos de restaurar PM curam +${bonusCuraPm} PM adicionais.`
    });
  }

  if (nvGambitoDama > 0) {
    const curaPv = 5 + (nvGambitoDama * 5);
    acoes.push({
      id: 'comandante_gambito_dama',
      codigo: 'GAMBITO_DA_DAMA',
      nome: '👑 Gambito da Dama',
      nomeCurto: 'Gambito da Dama',
      tipo: 'modificador_ataque',
      classe: 'Comandante',
      nivel: nvGambitoDama,
      custoPm: 0,
      curaAplicada: curaPv,
      recursoCura: 'pv',
      isAcaoExtra: false,
      descricao: `Ataque livre com arma (RA = 0). Após o ataque, escolha: Aliado recupera +${curaPv} PV OU use Carga, Decreto ou Roque sem gastar ação.`
    });
  }

  if (nvCarruagemDevastadora > 0) {
    acoes.push({
      id: 'comandante_carruagem_devastadora',
      codigo: 'CARRUAGEM_DEVASTADORA',
      nome: '⚡ Carruagem Devastadora',
      nomeCurto: 'Carruagem Devastadora',
      tipo: 'reacao',
      classe: 'Comandante',
      nivel: nvCarruagemDevastadora,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: 'Após usar Decreto, Carga ou Roque: outro PJ audível age imediatamente a seguir nesta rodada.'
    });
  }

  return acoes;
}
