/**
 * Fabula Ultima - Regras de Classificação de Habilidades (Ativas vs Passivas)
 * Clean Architecture: Funções puras sem dependências de React ou Supabase.
 */

import { normalizarTextoCore } from './coreClassRules.js';

export const HABILIDADES_PASSIVAS_CONHECIDAS = Object.freeze([
  // Piloto
  'pulso firme',
  'compressao tecnologica',
  'veiculo pessoal',
  // Guardião
  'fortaleza',
  'armadura pesada',
  'muralha de escudos',
  'corpo de ferro',
  'mestre de escudos',
  'maestria defensiva',
  'duplo escudeiro',
  // Mestre de Armas
  'maestria com armas',
  'contador de ossos',
  'especialista em armas',
  // Ladino
  'esquiva',
  'cacador de tesouros',
  'papo de taverna',
  'visao no escuro',
  // Atirador
  'aljava infinita',
  'artilharia cruzada',
  'fogo cruzado',
  'olhos de falcao',
  // Quimerista
  'lingua das feras',
  'consumo ritual',
  'patogenese',
  // Espiritualista / Elementalista / Entropista
  'poder curativo',
  'espirito vigoroso',
  'artilharia magica',
  'sorte absurda',
  'absorcao entropica',
  // Fúria / Guerreiro
  'adrenalina',
  'sangue das trevas',
  'ataque poderoso',
  'frenesi',
  // Erudito
  'erudicao',
  'memoria prodigiosa',
  // Inventor
  'engenhosidade',
  'visao tecnomagica',
  'alquimia avancada',
  // Esper / Mutante (Bloco B)
  'hipercognicao', 'psicocinese', 'navegador',
  // High Fantasy (Bloco C)
  'carruagem devastadora', 'dancarino de guerra', 'sapateado frenetico',
  'conexao simbolica', 'miragem', 'barreira sonora', 'canto da sereia',
  // Natural Fantasy (Bloco D)
  'arvore da vida', 'influencia verdejante', 'cozinheiro viajante', 'garfo e faca',
  'expandir manancial', 'harmonia elemental', 'ventos do comercio', 'verdadeiro tesouro'
]);

export const HABILIDADES_ATIVAS_CONHECIDAS = Object.freeze([
  // Piloto
  'coracao no motor',
  'configuracao flexivel',
  // Mestre de Armas
  'quebra ossos',
  'chuva de laminas',
  'trespassar',
  'contra ataque',
  // Ladino
  'golpe baixo',
  'roubo de alma',
  'vejo voce mais tarde',
  'sumir',
  // Atirador
  'tiro de aviso',
  'barragem',
  'olhos de aguia',
  'isca chamariz',
  // Erudito
  'estudo especializado',
  'analise rapida',
  'previsivel',
  'palavras de sabedoria',
  // Inventor
  'item emergencial',
  'chuva de pocoes',
  'tonico alquimico',
  'bomba alquimica',
  'infusao elemental',
  // Andarilho
  'cochilo poderoso',
  'lado a lado',
  'suporte pratico',
  'comandar companheiro',
  // Arcanista
  'invocar arcano',
  'dispensar arcano',
  'circulo arcano',
  // Guardião
  'proteger',
  'guarda costas',
  'escudos gemeos',
  'desafio do guardiao',
  // Guerreiro Sombrio
  'golpe das sombras',
  'agonia',
  'coracao da escuridao',
  'licao dolorosa',
  // Furioso
  'provocar',
  'resistir',
  'espirito indomavel',
  // Orador
  'condenar',
  'encorajar',
  'confio em voce',
  'persuasivo',
  'aliado inesperado',
  // Entropista
  'tempo roubado',
  'sete da sorte',
  'absorver pm',
  // Elementalista / Espiritualista
  'cataclismo',
  'lamina magica',
  'vismagus',
  // Mutante e Esper (Bloco B)
  'foco cognitivo',
  'dons psiquicos',
  'dom psiquico',
  'teriomorfose',
  'ecdise',
  'biofagia',
  'genoclepse',
  'acromorfose',
  // High Fantasy (Bloco C: Comandante, Dançarino, Simbolista, Virtuoso)
  'carga de cavalaria', 'decreto do bispo', 'roque do rei', 'gambito da dama',
  'danca', 'me acompanhe', 'troca de figurino',
  'simbolismo', 'toque pessoal', 'simbolos magicos',
  'magicanto', 'harmonia', 'vibrato',
  // Natural Fantasy (Bloco D: Floralista, Gourmet, Invocador, Mercador)
  'cloromancia', 'enxerto', 'jardinagem marcial',
  'culinaria', 'feito com amor', 'sal e pimenta',
  'invocacao', 'invocacoes conectadas', 'cascata',
  'estoque pessoal', 'ja ouvi falar', 'data de validade'
]);

/**
 * Normaliza o identificador ou nome da habilidade para conferência.
 */
function normalizarNomeHabilidade(hab) {
  if (!hab) return '';
  const raw = typeof hab === 'string' ? hab : (hab.codigo || hab.nomeCurto || hab.nome || hab.id || '');
  return normalizarTextoCore(raw).replace(/[-_]/g, ' ').trim();
}

/**
 * Determina se a habilidade é passiva (de consulta rápida/efeito contínuo).
 */
export function isHabilidadePassiva(hab) {
  if (!hab) return false;

  // Flags explícitas
  if (hab.passiva === true) return true;
  if (hab.tipo === 'passiva' || hab.tipoHabilidade === 'passiva') return true;

  // Se tiver custo de recursos ativo, não é passiva
  const custoPm = Number(hab.custoPm) || 0;
  const custoPi = Number(hab.custoPi) || 0;
  const custoPf = Number(hab.custoPf) || 0;
  if (custoPm > 0 || custoPi > 0 || custoPf > 0) return false;

  // Se for explicitamente marcada como ação
  if (hab.isAcaoExtra || hab.tipo === 'modificador_ataque' || hab.tipo === 'acao_suporte' || hab.tipo === 'reacao' || hab.tipo === 'heroica') {
    return false;
  }

  const nomeNorm = normalizarNomeHabilidade(hab);

  // Lista de passivas conhecidas
  if (HABILIDADES_PASSIVAS_CONHECIDAS.some((p) => nomeNorm.includes(p))) {
    return true;
  }

  // Lista de ativas conhecidas
  if (HABILIDADES_ATIVAS_CONHECIDAS.some((a) => nomeNorm.includes(a))) {
    return false;
  }

  // Análise de descrição
  const descNorm = normalizarTextoCore(`${hab.descricao || ''} ${hab.efeito || ''}`);
  if (descNorm.includes('passiv') || descNorm.includes('automaticamente') || descNorm.includes('permanentemente') || descNorm.includes('seu limite de')) {
    return true;
  }

  if (descNorm.includes('gasta 1 acao') || descNorm.includes('gasta 1 acao livre') || descNorm.includes('ao acertar') || descNorm.includes('ao realizar') || descNorm.includes('reacao')) {
    return false;
  }

  // Por padrão, se não possui gatilhos ativos nem custo, é passiva
  return true;
}

/**
 * Determina se a habilidade é ativa (pode ser preparada ou acionada em combate).
 */
export function isHabilidadeAtiva(hab) {
  return !isHabilidadePassiva(hab);
}

/**
 * Separa uma lista de habilidades em ativas e passivas com deduplicação.
 */
export function separarHabilidadesAtivasEPassivas(habilidades = []) {
  const lista = Array.isArray(habilidades) ? habilidades : [];
  const ativas = [];
  const passivas = [];
  const vistos = new Set();

  for (const hab of lista) {
    if (!hab) continue;
    const chave = normalizarNomeHabilidade(hab);
    if (chave && vistos.has(chave)) continue;
    if (chave) vistos.add(chave);

    if (isHabilidadePassiva(hab)) {
      passivas.push(hab);
    } else {
      ativas.push(hab);
    }
  }

  return { ativas, passivas };
}
