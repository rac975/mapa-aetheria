/**
 * Fabula Ultima - Regras da Classe Simbolista (Symbolist)
 * Atlas High Fantasy - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const SIMBOLOS_CATALOGO_PADRAO = Object.freeze([
  { chave: 'protecao', nome: 'Símbolo da Proteção', tipo: 'defensivo', resumo: 'Concede Resistência a um tipo de dano escolhido.' },
  { chave: 'desespero', nome: 'Símbolo do Desespero', tipo: 'ofensivo', resumo: 'Todas as curas de PV e PM recebidas pelo alvo são reduzidas pela metade (÷2).' },
  { chave: 'fraqueza', nome: 'Símbolo da Fraqueza', tipo: 'ofensivo', resumo: 'Alvo fica Vulnerável a um tipo de dano escolhido.' },
  { chave: 'proibicao', nome: 'Símbolo da Proibição', tipo: 'ofensivo', resumo: 'Alvo perde PV e PM ao realizar ações proibidas (5 / 15 / 25 conforme nível).' },
  { chave: 'amarras', nome: 'Símbolo das Amarras', tipo: 'controle', resumo: 'Alvo não pode se mover e criaturas voadoras são forçadas a aterrissar.' },
  { chave: 'criacao', nome: 'Símbolo da Criação', tipo: 'utilidade', resumo: 'Pode ser destruído para criar outro símbolo gastando 0 PI.' },
  { chave: 'rebeliao', nome: 'Símbolo da Rebelião', tipo: 'suporte', resumo: 'Aumenta o dano de ataques e feitiços contra criaturas que portem símbolos.' }
]);

export function extrairHabilidadesSimbolista(classes = []) {
  const nvSimbolismo = obterNivelHabilidade(classes, 'simbolista', 'simbolismo');
  const nvToquePessoal = obterNivelHabilidade(classes, 'simbolista', 'toque pessoal');
  const nvSimbolosMagicos = obterNivelHabilidade(classes, 'simbolista', 'simbolos magicos');
  const nvConexaoSimbolica = obterNivelHabilidade(classes, 'simbolista', 'conexao simbolica');
  const nvMiragem = obterNivelHabilidade(classes, 'simbolista', 'miragem');

  return {
    temSimbolista: nvSimbolismo > 0 || nvToquePessoal > 0 || nvSimbolosMagicos > 0 || nvConexaoSimbolica > 0 || nvMiragem > 0,
    nvSimbolismo,
    nvToquePessoal,
    nvSimbolosMagicos,
    nvConexaoSimbolica,
    nvMiragem
  };
}

export function extrairSimbolosAprendidosFicha(ficha, classes = []) {
  const cls = classes.find((c) => normalizarTextoCore(c?.nome_classe || '').includes('simbolista'));
  const hab = Array.isArray(cls?.habilidades)
    ? cls.habilidades.find((h) => normalizarTextoCore(h?.nome || '').includes('simbol'))
    : null;

  const simbolos = ficha?.dados_simbolista?.simbolosAprendidos ||
    cls?.dados_simbolista?.simbolosAprendidos ||
    hab?.simbolos_aprendidos ||
    hab?.dados_simbolista?.simbolosAprendidos ||
    [];

  if (Array.isArray(simbolos) && simbolos.length > 0) {
    return simbolos.map((s) => (typeof s === 'string' ? s : s?.chave || s?.id || s?.nome));
  }
  return SIMBOLOS_CATALOGO_PADRAO.map((s) => s.chave);
}

export function gerarAcoesConflitoSimbolista({ classes = [] } = {}) {
  const {
    nvSimbolismo,
    nvToquePessoal,
    nvSimbolosMagicos,
    nvConexaoSimbolica,
    nvMiragem
  } = extrairHabilidadesSimbolista(classes);

  const acoes = [];

  if (nvSimbolismo > 0) {
    const maxAtivos = nvSimbolismo + 1;
    acoes.push({
      id: 'simbolista_simbolismo',
      codigo: 'SIMBOLISMO',
      nome: '🖋️ Simbolismo',
      nomeCurto: 'Simbolismo',
      tipo: 'inventario',
      classe: 'Simbolista',
      nivel: nvSimbolismo,
      custoPi: 2,
      isAcaoExtra: false,
      descricao: `Gasta 2 PI (Ação Inventário): Aplica um símbolo em si mesmo, aliado ou via ataque livre em inimigo (até ${maxAtivos} símbolos ativos simultâneos).`
    });
  }

  if (nvToquePessoal > 0) {
    acoes.push({
      id: 'simbolista_toque_pessoal',
      codigo: 'TOQUE_PESSOAL',
      nome: '✨ Toque Pessoal',
      nomeCurto: 'Toque Pessoal',
      tipo: 'reacao',
      classe: 'Simbolista',
      nivel: nvToquePessoal,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: `Reação: Quando criatura com seu símbolo sofrer dano ou receber cura de PV/PM, cause +${nvToquePessoal} de dano ou cure +${nvToquePessoal} PV/PM adicionais.`
    });
  }

  if (nvSimbolosMagicos > 0) {
    const maxPmFeitico = nvSimbolosMagicos * 10;
    acoes.push({
      id: 'simbolista_simbolos_magicos',
      codigo: 'SIMBOLOS_MAGICOS',
      nome: '🔮 Símbolos Mágicos',
      nomeCurto: 'Símbolos Mágicos',
      tipo: 'acao_suporte',
      classe: 'Simbolista',
      nivel: nvSimbolosMagicos,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: `Aliado com seu símbolo pode destruir o símbolo e conjurar um feitiço conhecido por você de até ${maxPmFeitico} PM.`
    });
  }

  if (nvConexaoSimbolica > 0) {
    acoes.push({
      id: 'simbolista_conexao_simbolica',
      codigo: 'CONEXAO_SIMBOLICA',
      nome: '🌐 Conexão Simbólica',
      nomeCurto: 'Conexão Simbólica',
      tipo: 'passiva',
      classe: 'Simbolista',
      nivel: nvConexaoSimbolica,
      passiva: true,
      isAcaoExtra: false,
      descricao: 'Passiva: Você sabe a direção exata de qualquer criatura portando seus símbolos a até 2 dias de viagem.'
    });
  }

  if (nvMiragem > 0) {
    acoes.push({
      id: 'simbolista_miragem',
      codigo: 'MIRAGEM',
      nome: '👁️ Miragem',
      nomeCurto: 'Miragem',
      tipo: 'passiva',
      classe: 'Simbolista',
      nivel: nvMiragem,
      passiva: true,
      isAcaoExtra: false,
      descricao: 'Passiva: Permite realizar rituais de Ritualismo para projetar ilusões visuais.'
    });
  }

  return acoes;
}
