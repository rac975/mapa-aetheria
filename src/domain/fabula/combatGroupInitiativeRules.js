import { rolarDadosCombate, estaDerrotado } from './combatRules.js';
import {
  extrairModificadorIniciativaHeroi,
  extrairIniciativaFixaInimigo
} from './combatInitiativeRules.js';

/**
 * Fabula Ultima - Regras Puras de Teste em Grupo de Iniciativa ([DES + AST])
 * Livro Básico p. 51 (Testes em Grupo) e p. 61 (Iniciativa).
 */

export const ND_TESTE_APOIO = 10;

export function normalizarTextoIniciativa(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Calcula o ND do Teste de Iniciativa do Líder como a maior Iniciativa entre os adversários na cena.
 */
export function calcularNdIniciativaInimigos(participantes = [], npcsDisponiveis = []) {
  const inimigosVivos = (participantes || []).filter(
    (p) => p.tipo !== 'heroi' && !estaDerrotado(p.hp_atual)
  );

  if (inimigosVivos.length === 0) {
    return {
      ndLider: 10,
      maiorInimigoNome: 'Sem adversários (ND Padrão 10)',
      iniciativasInimigos: []
    };
  }

  let maiorIni = 0;
  let maiorNome = '';
  const iniciativasInimigos = inimigosVivos.map((ini) => {
    const npcId = ini.modificadores?.npc_id;
    const npcFicha = (npcsDisponiveis || []).find(
      (n) => (npcId && String(n.id) === String(npcId)) || normalizarTextoIniciativa(n.nome) === normalizarTextoIniciativa(ini.nome)
    ) || null;
    const valor = extrairIniciativaFixaInimigo(ini, npcFicha);
    if (valor >= maiorIni) {
      maiorIni = valor;
      maiorNome = ini.nome;
    }
    return { id: ini.id, nome: ini.nome, iniciativa: valor };
  });

  return {
    ndLider: Math.max(1, maiorIni),
    maiorInimigoNome: maiorNome,
    iniciativasInimigos
  };
}

/**
 * Extrai a força do Laço (0 a 6) que um apoiador possui com o Líder a partir de ficha.lacos.
 */
export function extrairForcaLacoComLider(fichaApoiador, nomeLider = '') {
  const lacos = Array.isArray(fichaApoiador?.lacos) ? fichaApoiador.lacos : [];
  const alvoNorm = normalizarTextoIniciativa(nomeLider);
  if (!alvoNorm || lacos.length === 0) return 0;

  let maiorForca = 0;
  lacos.forEach((l) => {
    const nomeVinculo = normalizarTextoIniciativa(l?.nome || '');
    if (!nomeVinculo) return;
    if (nomeVinculo === alvoNorm || nomeVinculo.includes(alvoNorm) || alvoNorm.includes(nomeVinculo)) {
      const forca = Number(l.forca) || (Array.isArray(l.emocoes) ? l.emocoes.length : 0);
      if (forca > maiorForca) maiorForca = forca;
    }
  });
  return Math.max(0, Math.min(6, maiorForca));
}

/**
 * Executa o Teste em Grupo de Iniciativa ([DES + AST]) segundo o Livro Básico de Fabula Ultima.
 */
export function executarTesteGrupoIniciativa({
  lider,
  perfilLider = null,
  fichaLider = null,
  apoiadores = [],
  ndInimigos = 10,
  valoresFixosLider = null,
  mapaValoresFixosApoiadores = {}
} = {}) {
  const resultadosApoiadores = (apoiadores || []).map((ap) => {
    const c = ap.combatente;
    const modIni = extrairModificadorIniciativaHeroi(c, ap.ficha, ap.perfil);
    const fixoAp = mapaValoresFixosApoiadores[c?.id] || null;
    const rolagem = rolarDadosCombate({
      combatente: c,
      perfil: ap.perfil,
      categoria: 'iniciativa',
      titulo: 'Apoio de Iniciativa',
      attr1: 'des',
      attr2: 'ast',
      bonusTeste: modIni,
      nd: ND_TESTE_APOIO,
      valoresFixos: fixoAp
    });

    const sucesso = Boolean(rolagem.isCritico || (!rolagem.isFumble && rolagem.total >= ND_TESTE_APOIO));
    const forcaLacoDetectada = ap.forcaLacoOverride !== undefined && ap.forcaLacoOverride !== null
      ? Number(ap.forcaLacoOverride) || 0
      : extrairForcaLacoComLider(ap.ficha, lider?.nome);

    return {
      id: c?.id,
      nome: c?.nome || 'Apoiador',
      d1: rolagem.d1,
      d2: rolagem.d2,
      faces1: rolagem.faces1,
      faces2: rolagem.faces2,
      modIniciativa: modIni,
      total: rolagem.total,
      nd: ND_TESTE_APOIO,
      sucesso,
      isCritico: rolagem.isCritico,
      isFumble: rolagem.isFumble,
      forcaLaco: forcaLacoDetectada,
      forcaLacoAplicada: sucesso ? forcaLacoDetectada : 0
    };
  });

  const apoiadoresSucesso = resultadosApoiadores.filter((r) => r.sucesso);
  const bonusApoiadores = apoiadoresSucesso.length;
  const maiorForcaLaco = apoiadoresSucesso.reduce((max, r) => Math.max(max, r.forcaLacoAplicada), 0);
  const modIniciativaLider = extrairModificadorIniciativaHeroi(lider, fichaLider, perfilLider);
  const bonusTotalLider = modIniciativaLider + bonusApoiadores + maiorForcaLaco;

  const rolagemLider = rolarDadosCombate({
    combatente: lider,
    perfil: perfilLider,
    categoria: 'iniciativa',
    titulo: 'Teste em Grupo de Iniciativa (Líder)',
    attr1: 'des',
    attr2: 'ast',
    bonusTeste: bonusTotalLider,
    nd: ndInimigos,
    valoresFixos: valoresFixosLider
  });

  const heroisVenceram = Boolean(
    rolagemLider.isCritico || (!rolagemLider.isFumble && rolagemLider.total >= ndInimigos)
  );

  const resumoApoio = resultadosApoiadores.length > 0
    ? `Apoiadores: +${bonusApoiadores} (${apoiadoresSucesso.length}/${resultadosApoiadores.length} sucessos vs ND 10)${maiorForcaLaco > 0 ? ` | Maior Laço: +${maiorForcaLaco}` : ''}`
    : 'Sem apoiadores';

  const veredito = heroisVenceram
    ? '🏆 HERÓIS VENCEM A INICIATIVA (Agem Primeiro!)'
    : '⚠️ INIMIGOS VENCEM A INICIATIVA (Agem Primeiro!)';

  const detalhes = `Líder ${lider?.nome || 'Herói'}: [${rolagemLider.d1}+${rolagemLider.d2}] (Mod.Ficha ${modIniciativaLider >= 0 ? `+${modIniciativaLider}` : modIniciativaLider}) + Apoio (+${bonusApoiadores}) + Laço (+${maiorForcaLaco}) = ${rolagemLider.total} vs ND ${ndInimigos}. ${resumoApoio}. ${veredito}`;

  return {
    liderId: lider?.id,
    liderNome: lider?.nome || 'Líder',
    d1: rolagemLider.d1,
    d2: rolagemLider.d2,
    faces1: rolagemLider.faces1,
    faces2: rolagemLider.faces2,
    modIniciativaLider,
    bonusApoiadores,
    maiorForcaLaco,
    bonusTotalLider,
    totalLider: rolagemLider.total,
    ndInimigos,
    heroisVenceram,
    isCritico: rolagemLider.isCritico,
    isFumble: rolagemLider.isFumble,
    resultadosApoiadores,
    veredito,
    detalhes,
    rolagemLider,
    logEntry: {
      combatente_id: lider?.id || null,
      autor_nome: lider?.nome || 'Grupo de Heróis',
      autor_tipo: 'heroi',
      acao_codigo: 'TESTE_GRUPO_INICIATIVA',
      acao_titulo: `⚡ Iniciativa em Grupo: ${rolagemLider.total} vs ND ${ndInimigos}`,
      detalhes,
      metadata: {
        total_lider: rolagemLider.total,
        nd_inimigos: ndInimigos,
        herois_venceram: heroisVenceram,
        critico: rolagemLider.isCritico,
        fumble: rolagemLider.isFumble
      }
    }
  };
}
