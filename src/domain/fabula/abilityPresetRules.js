/**
 * Fabula Ultima - Regras de Presets de Escolha para Central de Turno
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { normalizarTextoCore } from './coreClassRules.js';
import { obterPresetsBlocoA } from './blockAPresetCatalog.js';
import { obterPresetsBlocoB } from './blockBPresetCatalog.js';
import { obterPresetsBlocoC } from './blockCPresetCatalog.js';
import { obterPresetsBlocoD } from './blockDPresetCatalog.js';

export const HABILIDADES_ELEITAS_PRESET = Object.freeze({
  QUEBRA_OSSOS: 'QUEBRA_OSSOS', ANALISE_RAPIDA: 'ANALISE_RAPIDA',
  PALAVRAS_SABEDORIA: 'PALAVRAS_SABEDORIA', CORACAO_NO_MOTOR: 'CORACAO_NO_MOTOR',
  CONFIGURACAO_FLEXIVEL: 'CONFIGURACAO_FLEXIVEL', TIRO_DE_AVISO: 'TIRO_DE_AVISO',
  BARRAGEM: 'BARRAGEM', OLHOS_DE_AGUIA: 'OLHOS_DE_AGUIA',
  // Bloco A
  CONDENAR: 'CONDENAR', ENCORAJAR: 'ENCORAJAR', GOLPE_DAS_SOMBRAS: 'GOLPE_DAS_SOMBRAS',
  TEMPO_ROUBADO: 'TEMPO_ROUBADO', CATACLISMO: 'CATACLISMO', PROVOCAR: 'PROVOCAR', RESISTIR: 'RESISTIR',
  // Bloco B (Mutante e Esper)
  FOCO_COGNITIVO: 'FOCO_COGNITIVO', DONS_PSIQUICOS: 'DONS_PSIQUICOS',
  TERIOMORFOSE: 'TERIOMORFOSE', ECDISE: 'ECDISE', ACROMORFOSE: 'ACROMORFOSE',
  // Bloco C (High Fantasy)
  CARGA_CAVALARIA: 'CARGA_CAVALARIA', DECRETO_DO_BISPO: 'DECRETO_DO_BISPO',
  ROQUE_DO_REI: 'ROQUE_DO_REI', GAMBITO_DA_DAMA: 'GAMBITO_DA_DAMA',
  DANCA: 'DANCA', SIMBOLISMO: 'SIMBOLISMO', MAGICANTO: 'MAGICANTO', HARMONIA: 'HARMONIA',
  // Bloco D (Natural Fantasy)
  CLOROMANCIA: 'CLOROMANCIA', JARDINAGEM_MARCIAL: 'JARDINAGEM_MARCIAL',
  CULINARIA: 'CULINARIA', SAL_E_PIMENTA: 'SAL_E_PIMENTA',
  INVOCACAO: 'INVOCACAO', ESTOQUE_PESSOAL: 'ESTOQUE_PESSOAL',
  JA_OUVI_FALAR: 'JA_OUVI_FALAR', DATA_DE_VALIDADE: 'DATA_DE_VALIDADE'
});

export const HABILIDADES_EXCLUIDAS_PRESET = Object.freeze([
  'GOLPE_BAIXO',
  'ROUBO_DE_ALMA',
  'VEJO_VOCE_MAIS_TARDE'
]);

/**
 * Normaliza o código de uma habilidade para verificação de elegibilidade.
 */
export function normalizarCodigoHabilidade(hab) {
  if (!hab) return '';
  if (typeof hab === 'string') {
    const raw = hab.toUpperCase().trim();
    if (Object.values(HABILIDADES_ELEITAS_PRESET).includes(raw)) return raw;
    const norm = normalizarTextoCore(hab).replace(/_/g, ' ');
    if (norm.includes('quebra ossos')) return HABILIDADES_ELEITAS_PRESET.QUEBRA_OSSOS;
    if (norm.includes('analise rapida')) return HABILIDADES_ELEITAS_PRESET.ANALISE_RAPIDA;
    if (norm.includes('palavras de sabedoria') || norm.includes('palavras sabedoria')) return HABILIDADES_ELEITAS_PRESET.PALAVRAS_SABEDORIA;
    if (norm.includes('coracao no motor')) return HABILIDADES_ELEITAS_PRESET.CORACAO_NO_MOTOR;
    if (norm.includes('configuracao flexivel')) return HABILIDADES_ELEITAS_PRESET.CONFIGURACAO_FLEXIVEL;
    if (norm.includes('tiro de aviso')) return HABILIDADES_ELEITAS_PRESET.TIRO_DE_AVISO;
    if (norm.includes('barragem')) return HABILIDADES_ELEITAS_PRESET.BARRAGEM;
    if (norm.includes('olhos de aguia')) return HABILIDADES_ELEITAS_PRESET.OLHOS_DE_AGUIA;
    if (norm.includes('condenar')) return HABILIDADES_ELEITAS_PRESET.CONDENAR;
    if (norm.includes('encorajar')) return HABILIDADES_ELEITAS_PRESET.ENCORAJAR;
    if (norm.includes('golpe das sombras') || norm.includes('golpe sombras') || norm.includes('dark strike')) return HABILIDADES_ELEITAS_PRESET.GOLPE_DAS_SOMBRAS;
    if (norm.includes('tempo roubado')) return HABILIDADES_ELEITAS_PRESET.TEMPO_ROUBADO;
    if (norm.includes('cataclismo')) return HABILIDADES_ELEITAS_PRESET.CATACLISMO;
    if (norm.includes('provocar')) return HABILIDADES_ELEITAS_PRESET.PROVOCAR;
    if (norm.includes('resistir')) return HABILIDADES_ELEITAS_PRESET.RESISTIR;
    if (norm.includes('foco cognitivo')) return HABILIDADES_ELEITAS_PRESET.FOCO_COGNITIVO;
    if (norm.includes('dons psiquicos') || norm.includes('dom psiquico') || norm.includes('dadivas psiquicas')) return HABILIDADES_ELEITAS_PRESET.DONS_PSIQUICOS;
    if (norm.includes('teriomorfose')) return HABILIDADES_ELEITAS_PRESET.TERIOMORFOSE;
    if (norm.includes('ecdise')) return HABILIDADES_ELEITAS_PRESET.ECDISE;
    if (norm.includes('acromorfose')) return HABILIDADES_ELEITAS_PRESET.ACROMORFOSE;
    if (norm.includes('carga de cavalaria') || norm.includes('carga cavalaria')) return HABILIDADES_ELEITAS_PRESET.CARGA_CAVALARIA;
    if (norm.includes('decreto do bispo') || norm.includes('decreto bispo')) return HABILIDADES_ELEITAS_PRESET.DECRETO_DO_BISPO;
    if (norm.includes('roque do rei') || norm.includes('roque rei')) return HABILIDADES_ELEITAS_PRESET.ROQUE_DO_REI;
    if (norm.includes('gambito da dama') || norm.includes('gambito dama')) return HABILIDADES_ELEITAS_PRESET.GAMBITO_DA_DAMA;
    if (norm.includes('danca') || norm.includes('dança')) return HABILIDADES_ELEITAS_PRESET.DANCA;
    if (norm.includes('simbolismo')) return HABILIDADES_ELEITAS_PRESET.SIMBOLISMO;
    if (norm.includes('magicanto')) return HABILIDADES_ELEITAS_PRESET.MAGICANTO;
    if (norm.includes('harmonia')) return HABILIDADES_ELEITAS_PRESET.HARMONIA;
    if (norm.includes('cloromancia')) return HABILIDADES_ELEITAS_PRESET.CLOROMANCIA;
    if (norm.includes('jardinagem marcial')) return HABILIDADES_ELEITAS_PRESET.JARDINAGEM_MARCIAL;
    if (norm.includes('culinaria')) return HABILIDADES_ELEITAS_PRESET.CULINARIA;
    if (norm.includes('sal e pimenta')) return HABILIDADES_ELEITAS_PRESET.SAL_E_PIMENTA;
    if (norm.includes('invocacao') || norm.includes('invocação')) return HABILIDADES_ELEITAS_PRESET.INVOCACAO;
    if (norm.includes('estoque pessoal')) return HABILIDADES_ELEITAS_PRESET.ESTOQUE_PESSOAL;
    if (norm.includes('ja ouvi falar')) return HABILIDADES_ELEITAS_PRESET.JA_OUVI_FALAR;
    if (norm.includes('data de validade')) return HABILIDADES_ELEITAS_PRESET.DATA_DE_VALIDADE;
    return raw;
  }
  return normalizarCodigoHabilidade(hab.codigo || hab.key || hab.id || hab.nome || '');
}

/**
 * Verifica se a habilidade é eleita para exibir presets de escolha na área de efeito.
 */
export function isHabilidadeEleitaPreset(hab) {
  if (!hab) return false;
  const codigo = normalizarCodigoHabilidade(hab);
  if (HABILIDADES_EXCLUIDAS_PRESET.includes(codigo)) return false;
  return Object.values(HABILIDADES_ELEITAS_PRESET).includes(codigo);
}

/**
 * Extrai todas as habilidades ativas do combatente que são eleitas para presets (sem duplicatas).
 */
export function extrairHabilidadesEleitasCombatente(perfilOuHabilidades) {
  const lista = Array.isArray(perfilOuHabilidades)
    ? perfilOuHabilidades
    : (Array.isArray(perfilOuHabilidades?.habilidades) ? perfilOuHabilidades.habilidades : []);

  const vistos = new Set();
  const resultado = [];
  const nomesMap = {
    [HABILIDADES_ELEITAS_PRESET.OLHOS_DE_AGUIA]: 'Olhos de Águia', [HABILIDADES_ELEITAS_PRESET.TIRO_DE_AVISO]: 'Tiro de Aviso',
    [HABILIDADES_ELEITAS_PRESET.BARRAGEM]: 'Barragem', [HABILIDADES_ELEITAS_PRESET.CORACAO_NO_MOTOR]: 'Coração no Motor',
    [HABILIDADES_ELEITAS_PRESET.CONFIGURACAO_FLEXIVEL]: 'Configuração Flexível', [HABILIDADES_ELEITAS_PRESET.QUEBRA_OSSOS]: 'Quebra-Ossos',
    [HABILIDADES_ELEITAS_PRESET.ANALISE_RAPIDA]: 'Análise Rápida', [HABILIDADES_ELEITAS_PRESET.PALAVRAS_SABEDORIA]: 'Palavras de Sabedoria',
    [HABILIDADES_ELEITAS_PRESET.CONDENAR]: 'Condenar', [HABILIDADES_ELEITAS_PRESET.ENCORAJAR]: 'Encorajar',
    [HABILIDADES_ELEITAS_PRESET.GOLPE_DAS_SOMBRAS]: 'Golpe das Sombras', [HABILIDADES_ELEITAS_PRESET.TEMPO_ROUBADO]: 'Tempo Roubado',
    [HABILIDADES_ELEITAS_PRESET.CATACLISMO]: 'Cataclismo', [HABILIDADES_ELEITAS_PRESET.PROVOCAR]: 'Provocar',
    [HABILIDADES_ELEITAS_PRESET.RESISTIR]: 'Resistir', [HABILIDADES_ELEITAS_PRESET.FOCO_COGNITIVO]: 'Foco Cognitivo',
    [HABILIDADES_ELEITAS_PRESET.DONS_PSIQUICOS]: 'Dons Psíquicos', [HABILIDADES_ELEITAS_PRESET.TERIOMORFOSE]: 'Teriomorfose',
    [HABILIDADES_ELEITAS_PRESET.ECDISE]: 'Écdise', [HABILIDADES_ELEITAS_PRESET.ACROMORFOSE]: 'Acromorfose',
    [HABILIDADES_ELEITAS_PRESET.CARGA_CAVALARIA]: 'Carga de Cavalaria', [HABILIDADES_ELEITAS_PRESET.DECRETO_DO_BISPO]: 'Decreto do Bispo',
    [HABILIDADES_ELEITAS_PRESET.ROQUE_DO_REI]: 'Roque do Rei', [HABILIDADES_ELEITAS_PRESET.GAMBITO_DA_DAMA]: 'Gambito da Dama',
    [HABILIDADES_ELEITAS_PRESET.DANCA]: 'Dança', [HABILIDADES_ELEITAS_PRESET.SIMBOLISMO]: 'Simbolismo',
    [HABILIDADES_ELEITAS_PRESET.MAGICANTO]: 'Magicanto', [HABILIDADES_ELEITAS_PRESET.HARMONIA]: 'Harmonia',
    [HABILIDADES_ELEITAS_PRESET.CLOROMANCIA]: 'Cloromancia', [HABILIDADES_ELEITAS_PRESET.JARDINAGEM_MARCIAL]: 'Jardinagem Marcial',
    [HABILIDADES_ELEITAS_PRESET.CULINARIA]: 'Culinária', [HABILIDADES_ELEITAS_PRESET.SAL_E_PIMENTA]: 'Sal e Pimenta',
    [HABILIDADES_ELEITAS_PRESET.INVOCACAO]: 'Invocação', [HABILIDADES_ELEITAS_PRESET.ESTOQUE_PESSOAL]: 'Estoque Pessoal',
    [HABILIDADES_ELEITAS_PRESET.JA_OUVI_FALAR]: 'Já Ouvi Falar', [HABILIDADES_ELEITAS_PRESET.DATA_DE_VALIDADE]: 'Data de Validade'
  };

  for (const h of lista) {
    if (!isHabilidadeEleitaPreset(h)) continue;
    const codNorm = normalizarCodigoHabilidade(h);
    if (!vistos.has(codNorm)) {
      vistos.add(codNorm);
      resultado.push({ ...h, codigo: codNorm, nome: nomesMap[codNorm] || h.nome || codNorm });
    }
  }
  return resultado;
}

/**
 * Gera a lista oficial de presets para uma habilidade eleita.
 */
export function obterPresetsHabilidade(hab, { alvo = null, combatente = null } = {}) {
  const codigo = normalizarCodigoHabilidade(hab);
  const np = Math.max(1, parseInt(hab?.nivel, 10) || 1);
  const alvoNome = alvo?.nome || 'o alvo';

  // Presets do Bloco A
  const presetsBlocoA = obterPresetsBlocoA(codigo, np, { alvo, combatente });
  if (presetsBlocoA && presetsBlocoA.length > 0) {
    return presetsBlocoA;
  }

  // Presets do Bloco B (Mutante e Esper)
  const presetsBlocoB = obterPresetsBlocoB(codigo, np, { alvo, combatente });
  if (presetsBlocoB && presetsBlocoB.length > 0) {
    return presetsBlocoB;
  }

  // Presets do Bloco C (High Fantasy)
  const presetsBlocoC = obterPresetsBlocoC(codigo, np, { alvo, combatente });
  if (presetsBlocoC && presetsBlocoC.length > 0) {
    return presetsBlocoC;
  }

  // Presets do Bloco D (Natural Fantasy)
  const presetsBlocoD = obterPresetsBlocoD(codigo, np, { alvo, combatente });
  if (presetsBlocoD && presetsBlocoD.length > 0) {
    return presetsBlocoD;
  }

  switch (codigo) {
    case HABILIDADES_ELEITAS_PRESET.QUEBRA_OSSOS:
      return [
        { id: 'quebra_ossos_atordoado', titulo: 'Atordoado', badge: 'Condição', descricao: 'Dano 0 para aplicar Atordoado (DES ↓).', valores: { danoAplicado: 0, condicaoAlvo: 'atordoado', perdaPmAlvo: 0, notaLivre: `🦴 Quebra-Ossos: Dano 0 para aplicar Atordoado em ${alvoNome}.` } },
        { id: 'quebra_ossos_fraco', titulo: 'Fraco', badge: 'Condição', descricao: 'Dano 0 para aplicar Fraco (VIG ↓).', valores: { danoAplicado: 0, condicaoAlvo: 'fraco', perdaPmAlvo: 0, notaLivre: `🦴 Quebra-Ossos: Dano 0 para aplicar Fraco em ${alvoNome}.` } },
        { id: 'quebra_ossos_drenar_pm', titulo: `Drenar ${np * 10} PM`, badge: 'Recurso', descricao: `Dano 0 para drenar até ${np * 10} PM do alvo.`, valores: { danoAplicado: 0, condicaoAlvo: '', perdaPmAlvo: np * 10, notaLivre: `🦴 Quebra-Ossos: Dano 0 para drenar ${np * 10} PM de ${alvoNome}.` } }
      ];

    case HABILIDADES_ELEITAS_PRESET.TIRO_DE_AVISO:
      return [
        { id: 'tiro_aviso_abalado', titulo: 'Abalado', badge: 'Condição', descricao: 'Dano 0 para aplicar Abalado (AST ↓).', valores: { danoAplicado: 0, condicaoAlvo: 'abalado', perdaPmAlvo: 0, notaLivre: `⚠️ Tiro de Aviso (Nv ${np}): Dano 0 para aplicar Abalado em ${alvoNome}.` } },
        { id: 'tiro_aviso_lento', titulo: 'Lento', badge: 'Condição', descricao: 'Dano 0 para aplicar Lento (DES ↓).', valores: { danoAplicado: 0, condicaoAlvo: 'lento', perdaPmAlvo: 0, notaLivre: `⚠️ Tiro de Aviso (Nv ${np}): Dano 0 para aplicar Lento em ${alvoNome}.` } },
        { id: 'tiro_aviso_drenar_pm', titulo: `Drenar ${np * 10} PM`, badge: 'Recurso', descricao: `Dano 0 para drenar até ${np * 10} PM do alvo.`, valores: { danoAplicado: 0, condicaoAlvo: '', perdaPmAlvo: np * 10, notaLivre: `⚠️ Tiro de Aviso (Nv ${np}): Dano 0 para drenar ${np * 10} PM de ${alvoNome}.` } }
      ];

    case HABILIDADES_ELEITAS_PRESET.BARRAGEM:
      return [
        { id: 'barragem_multi_2', titulo: 'Multi (2)', badge: '10 PM', descricao: 'Ataque à distância ganha propriedade Multi (2).', valores: { custoPm: 10, notaLivre: '🎯 Barragem (10 PM): Ataque à distância recebe Multi (2).' } },
        { id: 'barragem_multi_mais_um', titulo: '+1 em Multi', badge: '10 PM', descricao: 'Aumenta Multi do ataque em +1 (máx 3).', valores: { custoPm: 10, notaLivre: '🎯 Barragem (10 PM): Propriedade Multi aumentada em +1 (máx 3).' } }
      ];

    case HABILIDADES_ELEITAS_PRESET.OLHOS_DE_AGUIA:
      return [
        { id: 'olhos_aguia_mira', titulo: `+${np * 3} Dano`, badge: 'Guarda', descricao: `+${np * 3} dano no próximo ataque à distância.`, valores: { danoAplicado: np * 3, custoPm: 0, notaLivre: `🦅 Olhos de Águia (Nv ${np}): Na Guarda sem cobrir aliado, +${np * 3} dano no próximo ataque.` } },
        { id: 'olhos_aguia_disparo', titulo: 'Disparo em Guarda', badge: 'RA = 0', descricao: 'Ataque livre na Guarda com arco/fogo (RA = 0 no dano).', valores: { danoAplicado: 0, custoPm: 0, notaLivre: `🦅 Olhos de Águia (Nv ${np}): Ataque livre imediato na Guarda com arco/fogo (RA = 0 no dano).` } }
      ];

    case HABILIDADES_ELEITAS_PRESET.ANALISE_RAPIDA:
      return [
        { id: 'analise_rapida_traco', titulo: 'Revelar Traço', badge: '5 PM', descricao: 'Gasta 5 PM para revelar Traço(s) da criatura visível.', valores: { danoAplicado: 0, custoPm: 5, notaLivre: `🔍 Análise Rápida: Revela Traço(s) de ${alvoNome}.` } },
        { id: 'analise_rapida_afinidade', titulo: 'Revelar Afinidade', badge: '5 PM', descricao: 'Gasta 5 PM para revelar Afinidade(s) Elementais.', valores: { danoAplicado: 0, custoPm: 5, notaLivre: `🔍 Análise Rápida: Revela Afinidade(s) de ${alvoNome}.` } }
      ];

    case HABILIDADES_ELEITAS_PRESET.PALAVRAS_SABEDORIA:
      return [
        { id: 'palavras_sabedoria_pm', titulo: 'Recuperar 20 PM', badge: '10 PM', descricao: 'Gasta 10 PM para aliado recuperar 20 PM.', valores: { danoAplicado: 0, curaAplicada: 20, recursoCura: 'pm', custoPm: 10, notaLivre: `💬 Palavras de Sabedoria: ${alvoNome} recupera 20 PM.` } },
        { id: 'palavras_sabedoria_condicao', titulo: 'Curar Condição', badge: '10 PM', descricao: 'Gasta 10 PM para aliado curar 1 condição de status.', valores: { danoAplicado: 0, custoPm: 10, notaLivre: `💬 Palavras de Sabedoria: ${alvoNome} cura 1 condição.` } },
        { id: 'palavras_sabedoria_acao_livre', titulo: 'Ação Livre / Bônus', badge: '10 PM', descricao: 'Gasta 10 PM para conceder ação livre ou bônus.', valores: { danoAplicado: 0, custoPm: 10, notaLivre: `💬 Palavras de Sabedoria: ${alvoNome} recebe ação livre com bônus.` } },
        { id: 'palavras_sabedoria_relogio', titulo: 'Relógio (±1 Seção)', badge: '10 PM', descricao: 'Gasta 10 PM para avançar/retroceder relógio em 1 seção.', valores: { danoAplicado: 0, custoPm: 10, avancoRelogio: 1, notaLivre: '💬 Palavras de Sabedoria: Relógio ajustado em 1 seção.' } }
      ];

    case HABILIDADES_ELEITAS_PRESET.CORACAO_NO_MOTOR:
      return [
        { id: 'coracao_motor_dano', titulo: `+${np * 2} Dano`, badge: '10 PM', descricao: `+${np * 2} de dano no próximo ataque do veículo.`, valores: { danoAplicado: np * 2, custoPm: 10, notaLivre: `⚙️ Coração no Motor: +${np * 2} de dano no próximo ataque!` } },
        { id: 'coracao_motor_defesa', titulo: `-${np * 2} Dano Sofrido`, badge: '10 PM', descricao: `Reduz o próximo dano sofrido em ${np * 2}.`, valores: { danoAplicado: 0, custoPm: 10, notaLivre: `⚙️ Coração no Motor: Próximo dano sofrido reduzido em ${np * 2}.` } },
        { id: 'coracao_motor_cura', titulo: 'Curar Lento/Fraco', badge: '10 PM', descricao: 'Remove as condições Lento e Fraco do veículo/piloto.', valores: { danoAplicado: 0, custoPm: 10, notaLivre: '⚙️ Coração no Motor: Condições Lento e Fraco curadas!' } }
      ];

    case HABILIDADES_ELEITAS_PRESET.CONFIGURACAO_FLEXIVEL:
      return [
        { id: 'configuracao_flexivel_modulos', titulo: `Troca até ${np} Módulos`, badge: 'Ação Livre', descricao: `Troca até ${np} módulo(s) ou arma(s) ativos do veículo.`, valores: { danoAplicado: 0, custoPm: 0, notaLivre: `🔧 Configuração Flexível: Troca de até ${np} módulo(s) do veículo.` } }
      ];

    default:
      return [];
  }
}
