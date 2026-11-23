/**
 * Fabula Ultima - Regras da Classe Esper
 * Atlas Techno Fantasy - Clean Architecture: Funções Puras.
 */

import { obterNivelHabilidade, normalizarTextoCore } from './coreClassRules.js';

export const DONS_PSIQUICOS_OFICIAIS = Object.freeze([
  { chave: 'atmocinese', nome: 'Atmocinese', tipos: ['ar', 'raio'], gatilho: 'Ao causar dano', resumo: 'Converte dano para Ar ou Raio com +(2 + Relógio) de dano adicional.' },
  { chave: 'fotocinese', nome: 'Fotocinese', tipos: ['luz', 'trevas'], gatilho: 'Ao causar dano', resumo: 'Converte dano para Luz ou Trevas com +(2 + Relógio) de dano adicional.' },
  { chave: 'gravitocinese', nome: 'Gravitocinese', tipos: ['terra', 'fisico'], gatilho: 'Ao causar dano', resumo: 'Converte dano para Terra ou Físico com +(2 + Relógio); voadores pousam.' },
  { chave: 'termocinese', nome: 'Termocinese', tipos: ['fogo', 'gelo'], gatilho: 'Ao causar dano', resumo: 'Converte dano para Fogo ou Gelo com +(2 + Relógio) de dano adicional.' },
  { chave: 'escudo_psiquico', nome: 'Escudo Psíquico', tipos: [], gatilho: 'Ao ser atacado', resumo: 'Defesa e Defesa Mágica tratadas como VON + (2 × Relógio).' },
  { chave: 'presenca_reconfortante', nome: 'Presença Reconfortante', tipos: [], gatilho: 'Guarda (cobertura)', resumo: 'Aliado coberto recupera +(10 + 5 × Relógio) PM e cura condição mental se for Foco.' },
  { chave: 'retaliacao_psiquica', nome: 'Retaliação Psíquica', tipos: [], gatilho: 'Ao sofrer dano / teste oposto', resumo: 'Inimigo perde (5 + 5 × Relógio) PM e fica Abalado ou Atordoado.' },
  { chave: 'transferencia_vital', nome: 'Transferência de Vida', tipos: [], gatilho: 'Ao infligir dano', resumo: 'Você ou aliado Foco em crise recupera +(5 + 5 × Relógio) PV.' },
  { chave: 'clarividencia', nome: 'Clarividência', tipos: [], gatilho: 'Ao focar ou criar laço', resumo: 'Pergunta sincera respondida pelo Mestre com a verdade.' }
]);

export function extrairHabilidadesEsper(classes = []) {
  let nvDons = obterNivelHabilidade(classes, 'esper', 'dons psiquicos');
  if (nvDons === 0) nvDons = obterNivelHabilidade(classes, 'esper', 'dom psiquico');
  if (nvDons === 0) nvDons = obterNivelHabilidade(classes, 'esper', 'dadivas psiquicas');

  const nvFoco = obterNivelHabilidade(classes, 'esper', 'foco cognitivo');
  const nvHiper = obterNivelHabilidade(classes, 'esper', 'hipercognicao');
  const nvNavegador = obterNivelHabilidade(classes, 'esper', 'navegador');
  const nvPsicocinese = obterNivelHabilidade(classes, 'esper', 'psicocinese');

  return {
    temEsper: nvDons > 0 || nvFoco > 0 || nvHiper > 0 || nvNavegador > 0 || nvPsicocinese > 0,
    nvDonsPsiquicos: nvDons,
    nvFocoCognitivo: nvFoco,
    nvHipercognicao: nvHiper,
    nvNavegador,
    nvPsicocinese
  };
}

export function calcularCustoDomPsiquico(relogioSecoes = 0) {
  const secoes = Math.max(0, Math.min(4, parseInt(relogioSecoes, 10) || 0));
  return secoes === 0 ? 5 : secoes * 5;
}

export function extrairDonsAprendidosFicha(ficha, classes = []) {
  const esperClass = classes.find((c) => normalizarTextoCore(c?.nome_classe || '').includes('esper'));
  const habDons = Array.isArray(esperClass?.habilidades)
    ? esperClass.habilidades.find((h) => normalizarTextoCore(h?.nome || '').includes('don'))
    : null;

  const dons = ficha?.dados_esper?.donsAprendidos ||
    esperClass?.dados_esper?.donsAprendidos ||
    habDons?.dons_aprendidos ||
    habDons?.dados_esper?.donsAprendidos ||
    [];

  if (Array.isArray(dons) && dons.length > 0) {
    return dons.map((d) => (typeof d === 'string' ? d : d?.chave || d?.id || d?.nome));
  }
  return DONS_PSIQUICOS_OFICIAIS.map((d) => d.chave);
}

export function gerarAcoesConflitoEsper({ classes = [], relogioSecoes = 0 } = {}) {
  const { nvDonsPsiquicos, nvFocoCognitivo, nvPsicocinese, nvHipercognicao, nvNavegador } = extrairHabilidadesEsper(classes);
  const acoes = [];
  const secoesEfetivas = Math.max(0, Math.min(4, parseInt(relogioSecoes, 10) || 0));
  const custoPmDom = calcularCustoDomPsiquico(secoesEfetivas);

  if (nvFocoCognitivo > 0) {
    acoes.push({
      id: 'esper_foco_cognitivo',
      codigo: 'FOCO_COGNITIVO',
      nome: '🎯 Foco Cognitivo',
      nomeCurto: 'Foco Cognitivo',
      tipo: 'acao_suporte',
      classe: 'Esper',
      nivel: nvFocoCognitivo,
      custoPm: 0,
      isAcaoExtra: true,
      descricao: `Início de turno: designa foco (aliado audível ou inimigo Abalado/Atordoado/Enfurecido). Concede +${nvFocoCognitivo} em testes contra o foco e +${nvFocoCognitivo * 2} em curas aplicadas ao foco.`
    });
  }

  if (nvDonsPsiquicos > 0) {
    acoes.push({
      id: 'esper_dons_psiquicos',
      codigo: 'DONS_PSIQUICOS',
      nome: '🔮 Dons Psíquicos',
      nomeCurto: 'Dons Psíquicos',
      tipo: 'reacao',
      classe: 'Esper',
      nivel: nvDonsPsiquicos,
      custoPm: custoPmDom,
      isAcaoExtra: true,
      descricao: `Ativa um Dom Psíquico (${custoPmDom} PM, Relógio Mental ${secoesEfetivas}/4). Após resolver, preenche 1 seção do Relógio.`
    });
  }

  if (nvPsicocinese > 0) {
    acoes.push({
      id: 'esper_psicocinese',
      codigo: 'PSICOCINESE',
      nome: '🧠 Psicocinese',
      nomeCurto: 'Psicocinese',
      tipo: 'passiva',
      classe: 'Esper',
      nivel: nvPsicocinese,
      passiva: true,
      isAcaoExtra: false,
      descricao: 'Passiva: Testes de Precisão podem substituir 1 dado por Vontade. Espadas e armas arcanas corpo a corpo acertam criaturas voadoras.'
    });
  }

  if (nvHipercognicao > 0) {
    acoes.push({
      id: 'esper_hipercognicao',
      codigo: 'HIPERCOGNICAO',
      nome: '⚡ Hipercognição',
      nomeCurto: 'Hipercognição',
      tipo: 'passiva',
      classe: 'Esper',
      nivel: nvHipercognicao,
      passiva: true,
      isAcaoExtra: false,
      descricao: `Passiva: Feitiços e versos que afetam o Foco Cognitivo custam -${nvHipercognicao} PM (-${nvHipercognicao * 2} PM se for o único alvo).`
    });
  }

  if (nvNavegador > 0) {
    acoes.push({
      id: 'esper_navegador',
      codigo: 'NAVEGADOR',
      nome: '🌐 Navegador',
      nomeCurto: 'Navegador',
      tipo: 'passiva',
      classe: 'Esper',
      nivel: nvNavegador,
      passiva: true,
      isAcaoExtra: false,
      descricao: 'Passiva: Telepatia a até 1 dia de viagem com aliados e rituais da disciplina Ritualismo pela rede de almas.'
    });
  }

  return acoes;
}
