import { obterSlotsAcoesInimigo, extrairIniciativaCombatente } from './combatInitiativeRules.js';

/**
 * Fabula Ultima - Regras Puras da Fila Unificada da Ordem de Combate
 * Alterna cada turno individual entre os lados (Herói <-> Ação/Token do Inimigo),
 * posiciona ações excedentes no final da rodada e permite reordenação livre via drag-and-drop.
 */

function gerarChavesAlternadasPorTurnos(herois = [], inimigos = [], heroisAgemPrimeiro = true) {
  const naoFugiu = (p) => !p.fugiu && !p.modificadores?.fugiu;
  const heroisVivos = herois.filter((h) => Number(h.hp_atual) > 0 && naoFugiu(h));
  const inimigosVivos = inimigos.filter((i) => Number(i.hp_atual) > 0 && naoFugiu(i));
  const derrotados = [...herois, ...inimigos].filter((p) => Number(p.hp_atual) <= 0 && naoFugiu(p));

  const turnosHerois = heroisVivos.map((h) => `card:${h.id}`);

  const turnosInimigos = [];
  const maxAcoesInimigo = inimigosVivos.reduce(
    (max, ini) => Math.max(max, Math.max(1, Number(ini.acoes_por_turno) || 1)),
    0
  );

  for (let numAcao = 1; numAcao <= maxAcoesInimigo; numAcao++) {
    inimigosVivos.forEach((ini) => {
      const totalAcoes = Math.max(1, Number(ini.acoes_por_turno) || 1);
      if (numAcao === 1) {
        turnosInimigos.push(`card:${ini.id}`);
      } else if (numAcao <= totalAcoes) {
        turnosInimigos.push(`token:${ini.id}:${numAcao}`);
      }
    });
  }

  const ordemChavesFila = [];
  const maxTurnos = Math.max(turnosHerois.length, turnosInimigos.length);

  for (let i = 0; i < maxTurnos; i++) {
    if (heroisAgemPrimeiro) {
      if (i < turnosHerois.length) ordemChavesFila.push(turnosHerois[i]);
      if (i < turnosInimigos.length) ordemChavesFila.push(turnosInimigos[i]);
    } else {
      if (i < turnosInimigos.length) ordemChavesFila.push(turnosInimigos[i]);
      if (i < turnosHerois.length) ordemChavesFila.push(turnosHerois[i]);
    }
  }

  derrotados.forEach((d) => {
    ordemChavesFila.push(`card:${d.id}`);
  });

  return ordemChavesFila;
}

/**
 * Constrói a fila unificada contendo Cards Principais ('combatente') e Tokens de Ação ('token_acao').
 * Respeita a ordem customizada salva em ordemFilaSalva quando disponível.
 */
export function construirFilaUnificadaCombate(participantes = [], ordemFilaSalva = []) {
  if (!Array.isArray(participantes) || participantes.length === 0) return [];
  const listaAtiva = participantes.filter((p) => !p.fugiu && !p.modificadores?.fugiu);
  if (listaAtiva.length === 0) return [];

  const mapaItens = new Map();
  listaAtiva.forEach((p) => {
    const chaveCard = `card:${p.id}`;
    mapaItens.set(chaveCard, {
      chaveFila: chaveCard,
      tipoItem: 'combatente',
      participante: p
    });

    if (p.tipo !== 'heroi' && Number(p.acoes_por_turno) > 1 && Number(p.hp_atual) > 0) {
      const slots = obterSlotsAcoesInimigo(p).filter((s) => s.numero >= 2);
      slots.forEach((slot) => {
        const chaveToken = `token:${p.id}:${slot.numero}`;
        mapaItens.set(chaveToken, {
          chaveFila: chaveToken,
          tipoItem: 'token_acao',
          participante: p,
          slot,
          numeroAcao: slot.numero,
          totalAcoes: Number(p.acoes_por_turno)
        });
      });
    }
  });

  const heroisNaOrdem = listaAtiva.filter((p) => p.tipo === 'heroi');
  const inimigosNaOrdem = listaAtiva.filter((p) => p.tipo !== 'heroi');
  const primeiroEhHeroi = listaAtiva[0]?.tipo !== 'inimigo';
  const ordemPadrao = gerarChavesAlternadasPorTurnos(heroisNaOrdem, inimigosNaOrdem, primeiroEhHeroi);

  const chavesOrdenadas = [];
  const adicionados = new Set();

  if (Array.isArray(ordemFilaSalva) && ordemFilaSalva.length > 0) {
    ordemFilaSalva.forEach((chave) => {
      if (mapaItens.has(chave) && !adicionados.has(chave)) {
        chavesOrdenadas.push(chave);
        adicionados.add(chave);
      }
    });
  }

  ordemPadrao.forEach((chave) => {
    if (mapaItens.has(chave) && !adicionados.has(chave)) {
      chavesOrdenadas.push(chave);
      adicionados.add(chave);
    }
  });

  return chavesOrdenadas.map((chave, idx) => ({
    ...mapaItens.get(chave),
    indexFila: idx
  }));
}

/**
 * Move qualquer item da fila unificada (Card Principal de Herói/Inimigo ou Token de Ação)
 * para a posição de destino via drag-and-drop ({ fromIndex, toIndex }).
 */
export function moverItemFilaUnificada(filaUnificada = [], indexOuPayload, destinoOuDirecao = 0) {
  const copia = [...filaUnificada];
  if (copia.length <= 1) {
    return {
      novaFila: copia,
      novaOrdemChaves: copia.map((i) => i.chaveFila),
      participantesReordenados: copia.filter((i) => i.tipoItem === 'combatente').map((i) => i.participante),
      mudouOrdemCards: false
    };
  }

  let fromIndex = -1;
  let toIndex = -1;

  if (typeof indexOuPayload === 'object' && indexOuPayload !== null) {
    fromIndex = Number(indexOuPayload.fromIndex);
    toIndex = Number(indexOuPayload.toIndex);
  } else {
    fromIndex = Number(indexOuPayload);
    const delta = Number(destinoOuDirecao);
    toIndex = (delta === -1 || delta === 1) ? fromIndex + delta : delta;
  }

  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= copia.length ||
    toIndex >= copia.length ||
    fromIndex === toIndex
  ) {
    return {
      novaFila: copia,
      novaOrdemChaves: copia.map((i) => i.chaveFila),
      participantesReordenados: copia.filter((i) => i.tipoItem === 'combatente').map((i) => i.participante),
      mudouOrdemCards: false
    };
  }

  const idsCardsAntes = copia
    .filter((i) => i.tipoItem === 'combatente')
    .map((i) => String(i.participante.id))
    .join(',');

  const [removido] = copia.splice(fromIndex, 1);
  copia.splice(toIndex, 0, removido);

  const novaFila = copia.map((item, idx) => ({ ...item, indexFila: idx }));
  const novaOrdemChaves = novaFila.map((i) => i.chaveFila);

  const participantesReordenados = novaFila
    .filter((i) => i.tipoItem === 'combatente')
    .map((i, idx) => ({
      ...i.participante,
      ordem: idx
    }));

  const idsCardsDepois = participantesReordenados.map((p) => String(p.id)).join(',');

  return {
    novaFila,
    novaOrdemChaves,
    participantesReordenados,
    mudouOrdemCards: idsCardsAntes !== idsCardsDepois
  };
}

/**
 * Gera a ordenação alternada de Fabula Ultima (Herói <-> Ação/Token de Inimigo),
 * posicionando o lado vencedor da iniciativa no topo, intercalando cada ação extra de inimigo
 * como turno próprio e deixando participantes/ações excedentes no final da rodada.
 */
export function gerarOrdemIntercaladaIniciativa(participantes = [], heroisAgemPrimeiro = true) {
  const listaAtiva = (participantes || []).filter((p) => !p.fugiu && !p.modificadores?.fugiu);
  const ordenarPorIniEOrdem = (a, b) => {
    const diffIni = extrairIniciativaCombatente(b) - extrairIniciativaCombatente(a);
    if (diffIni !== 0) return diffIni;
    return (Number(a.ordem) || 0) - (Number(b.ordem) || 0);
  };

  const herois = listaAtiva.filter((p) => p.tipo === 'heroi').sort(ordenarPorIniEOrdem);
  const inimigos = listaAtiva.filter((p) => p.tipo !== 'heroi').sort(ordenarPorIniEOrdem);

  const ordemChavesFila = gerarChavesAlternadasPorTurnos(herois, inimigos, heroisAgemPrimeiro);

  const mapaParticipantes = new Map(listaAtiva.map((p) => [`card:${p.id}`, p]));
  const participantesOrdenados = [];

  ordemChavesFila.forEach((chave) => {
    if (mapaParticipantes.has(chave)) {
      participantesOrdenados.push({
        ...mapaParticipantes.get(chave),
        ordem: participantesOrdenados.length
      });
    }
  });

  return { participantesOrdenados, ordemChavesFila };
}
